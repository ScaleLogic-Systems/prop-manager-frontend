import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

async function getAuthenticatedClient(request: NextRequest) {
  const cookieStore = await cookies();
  const serverClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Cookie writes are handled by middleware when needed.
          }
        },
      },
    }
  );

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearerClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await bearerClient.auth.getUser();
    if (user) return { user, db: bearerClient };
  }

  const { data: { user } } = await serverClient.auth.getUser();
  return { user, db: serverClient };
}

export async function GET(request: NextRequest) {
  try {
    const { user, db: authenticatedDb } = await getAuthenticatedClient(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });

    const db = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      : authenticatedDb;
    const requestedPropertyId = request.nextUrl.searchParams.get('property_id');

    let propertyQuery = db.from('properties').select('id').eq('owner_id', user.id);
    if (requestedPropertyId) propertyQuery = propertyQuery.eq('id', requestedPropertyId);
    const { data: properties, error: propertyError } = await propertyQuery;
    if (propertyError) throw propertyError;
    if (!properties?.length) return NextResponse.json({ units: [] });

    const propertyIds = properties.map((property) => property.id);
    const { data: units, error: unitsError } = await db
      .from('units')
      .select('id, property_id, unit_number, rent_amount, deposit_fee, garbage_fee, parking_fee, water_fee, is_occupied')
      .in('property_id', propertyIds)
      .eq('is_occupied', true);
    if (unitsError) throw unitsError;
    if (!units?.length) return NextResponse.json({ units: [] });

    const unitIds = units.map((unit) => unit.id);
    const [{ data: tenants, error: tenantsError }, { data: invoices, error: invoicesError }] = await Promise.all([
      db.from('tenants').select('unit_id, profile_id').in('unit_id', unitIds),
      db.from('invoices')
        .select('unit_id, current_reading, created_at')
        .in('unit_id', unitIds)
        .eq('invoice_type', 'water')
        .order('created_at', { ascending: false }),
    ]);
    if (tenantsError) throw tenantsError;
    if (invoicesError) throw invoicesError;

    const profileIds = (tenants || [])
      .map((tenant) => tenant.profile_id)
      .filter((profileId): profileId is string => Boolean(profileId));
    const { data: profiles, error: profilesError } = profileIds.length
      ? await db.from('profiles').select('id, full_name').in('id', profileIds)
      : { data: [], error: null };
    if (profilesError) throw profilesError;

    const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile.full_name || 'Tenant']));
    const tenantMap = new Map((tenants || []).map((tenant) => [tenant.unit_id, tenant.profile_id]));
    const previousReadingMap = new Map<string, number>();
    for (const invoice of invoices || []) {
      if (!previousReadingMap.has(invoice.unit_id)) {
        previousReadingMap.set(invoice.unit_id, Number(invoice.current_reading || 0));
      }
    }

    return NextResponse.json({
      units: units.map((unit) => ({
        id: unit.id,
        unit_number: unit.unit_number,
        tenant_name: profileMap.get(tenantMap.get(unit.id) || '') || 'Tenant',
        previous_reading: previousReadingMap.get(unit.id) || 0,
        water_rate: Number(unit.water_fee || 0),
        rent_amount: Number(unit.rent_amount || 0),
        deposit_fee: Number(unit.deposit_fee || 0),
        garbage_fee: Number(unit.garbage_fee || 0),
        parking_fee: Number(unit.parking_fee || 0),
        water_fee: Number(unit.water_fee || 0),
      })),
    });
  } catch (error: unknown) {
    console.error('Owner meter readings error:', error);
    return NextResponse.json({ error: 'Failed to load meter readings' }, { status: 500 });
  }
}
