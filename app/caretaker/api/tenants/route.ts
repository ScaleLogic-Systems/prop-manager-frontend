// app/caretaker/api/tenants/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing auth token.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid session.' }, { status: 401 });
    }

    const url = new URL(request.url);
    const paramPropertyId = url.searchParams.get('property_id');

    // 1. Get properties assigned to this caretaker
    let propQuery = supabase.from('properties').select('id, name');
    if (paramPropertyId) {
      propQuery = propQuery.eq('id', paramPropertyId);
    } else {
      propQuery = propQuery.eq('caretaker_id', user.id);
    }

    const { data: properties, error: propErr } = await propQuery;
    if (propErr) throw propErr;

    const propertyIds = (properties || []).map((p: any) => p.id);
    if (propertyIds.length === 0) {
      return NextResponse.json({ success: true, tenants: [] });
    }

    // 2. Get units for these properties
    const { data: units, error: unitErr } = await supabase
      .from('units')
      .select('id, unit_number, property_id')
      .in('property_id', propertyIds);

    if (unitErr) throw unitErr;

    const unitIds = (units || []).map((u: any) => u.id);
    if (unitIds.length === 0) {
      return NextResponse.json({ success: true, tenants: [] });
    }

    // 3. Get tenants assigned to these units
    const { data: tenants, error: tenantErr } = await supabase
      .from('tenants')
      .select(`
        id,
        full_name,
        email,
        phone,
        unit_id,
        units (
          unit_number,
          property_id,
          properties ( name )
        )
      `)
      .in('unit_id', unitIds);

    if (tenantErr) throw tenantErr;

    const formattedTenants = (tenants || []).map((t: any) => ({
      id: t.id,
      tenant_name: t.full_name || 'Unknown',
      email: t.email || '',
      phone: t.phone || '',
      unit_id: t.unit_id,
      unit_number: t.units?.unit_number || 'N/A',
      property_id: t.units?.property_id || '',
      property_name: t.units?.properties?.name || '',
    }));

    return NextResponse.json({ success: true, tenants: formattedTenants });
  } catch (err: any) {
    console.error('Caretaker Tenants API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch tenants.' }, { status: 500 });
  }
}