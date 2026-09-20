import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';

interface UnitRecord {
  id: string;
  unit_number: string;
  rent_amount: number | null;
  garbage_fee: number | null;
  parking_fee: number | null;
  water_fee: number | null;
  is_occupied: boolean;
}

interface TenantRecord {
  unit_id: string;
  profile_id: string | null;
}

interface ProfileRecord {
  id: string;
  full_name: string | null;
}

interface MeterReadingRecord {
  unit_id: string;
  current_reading: number | null;
  reading_date: string;
  created_at: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? getSupabaseAdmin() : supabase;
    const requestedPropertyId = request.nextUrl.searchParams.get('property_id');
    const propertyQuery = db
      .from('properties')
      .select('id, water_rate_per_unit')
      .eq('caretaker_id', user.id);
    const { data: properties, error: propertyError } = requestedPropertyId
      ? await propertyQuery.eq('id', requestedPropertyId)
      : await propertyQuery;

    if (propertyError) throw propertyError;
    if (!properties?.length) return NextResponse.json({ units: [] });

    const propertyIds = properties.map((property) => property.id);
    const waterRates = new Map(
      properties.map((property) => [property.id, Number(property.water_rate_per_unit || 0)])
    );
    const { data: units, error: unitsError } = await db
      .from('units')
      .select('id, property_id, unit_number, rent_amount, garbage_fee, parking_fee, water_fee, is_occupied')
      .in('property_id', propertyIds)
      .eq('is_occupied', true);

    if (unitsError) throw unitsError;

    const typedUnits = (units || []) as (UnitRecord & { property_id: string })[];
    if (!typedUnits.length) return NextResponse.json({ units: [] });

    const unitIds = typedUnits.map((unit) => unit.id);
    const [{ data: tenants, error: tenantsError }, { data: readings, error: readingsError }] = await Promise.all([
      db.from('tenants').select('unit_id, profile_id').in('unit_id', unitIds),
      db.from('meter_readings').select('unit_id, current_reading, reading_date, created_at').in('unit_id', unitIds).order('reading_date', { ascending: false }).order('created_at', { ascending: false }),
    ]);

    if (tenantsError) throw tenantsError;
    if (readingsError) throw readingsError;

    const typedTenants = (tenants || []) as TenantRecord[];
    const profileIds = typedTenants
      .map((tenant) => tenant.profile_id)
      .filter((profileId): profileId is string => Boolean(profileId));
    const { data: profiles, error: profilesError } = profileIds.length
      ? await db.from('profiles').select('id, full_name').in('id', profileIds)
      : { data: [], error: null };

    if (profilesError) throw profilesError;

    const profileMap = new Map((profiles || [] as ProfileRecord[]).map((profile) => [profile.id, profile.full_name || '']));
    const tenantMap = new Map(typedTenants.map((tenant) => [tenant.unit_id, tenant.profile_id]));
    const previousReadingMap = new Map<string, number>();

    for (const reading of (readings || []) as MeterReadingRecord[]) {
      if (!previousReadingMap.has(reading.unit_id)) {
        previousReadingMap.set(reading.unit_id, Number(reading.current_reading || 0));
      }
    }

    return NextResponse.json({
      units: typedUnits.map((unit) => ({
        id: unit.id,
        unit_number: unit.unit_number,
        tenant_name: profileMap.get(tenantMap.get(unit.id) || '') || 'Tenant',
        previous_reading: previousReadingMap.get(unit.id) || 0,
        water_rate: waterRates.get(unit.property_id) || 0,
        rent_amount: Number(unit.rent_amount || 0),
        garbage_fee: Number(unit.garbage_fee || 0),
        parking_fee: Number(unit.parking_fee || 0),
        water_fee: Number(unit.water_fee || 0),
      })),
    });
  } catch (error: unknown) {
    console.error('Caretaker meter readings error:', error);
    return NextResponse.json({ error: 'Failed to load meter readings' }, { status: 500 });
  }
}
