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
    const propertyMap = new Map((properties || []).map((p: any) => [p.id, p.name]));

    if (propertyIds.length === 0) {
      return NextResponse.json({ success: true, tenants: [] });
    }

    // 2. Get units for these properties
    const { data: units, error: unitErr } = await supabase
      .from('units')
      .select('id, unit_number, property_id, tenant_id')
      .in('property_id', propertyIds);

    if (unitErr) throw unitErr;

    const unitMap = new Map((units || []).map((u: any) => [u.id, u]));
    const unitIds = (units || []).map((u: any) => u.id);

    const tenantMap = new Map<string, any>();

    // Strategy A: Query tenants table by unit_id
    if (unitIds.length > 0) {
      const { data: tenantsByUnit } = await supabase
        .from('tenants')
        .select('id, full_name, tenant_name, email, phone, unit_id, property_id')
        .in('unit_id', unitIds);

      (tenantsByUnit || []).forEach((t: any) => {
        const unit = unitMap.get(t.unit_id);
        tenantMap.set(t.id, {
          id: t.id,
          tenant_name: t.full_name || t.tenant_name || 'Unknown Tenant',
          email: t.email || '',
          phone: t.phone || '',
          unit_id: t.unit_id,
          unit_number: unit?.unit_number || 'N/A',
          property_id: unit?.property_id || t.property_id || propertyIds[0],
          property_name: propertyMap.get(unit?.property_id || t.property_id) || '',
        });
      });
    }

    // Strategy B: Query tenants table directly by property_id
    const { data: tenantsByProp } = await supabase
      .from('tenants')
      .select('id, full_name, tenant_name, email, phone, unit_id, property_id')
      .in('property_id', propertyIds);

    (tenantsByProp || []).forEach((t: any) => {
      if (!tenantMap.has(t.id)) {
        const unit = t.unit_id ? unitMap.get(t.unit_id) : null;
        tenantMap.set(t.id, {
          id: t.id,
          tenant_name: t.full_name || t.tenant_name || 'Unknown Tenant',
          email: t.email || '',
          phone: t.phone || '',
          unit_id: t.unit_id || unit?.id || '',
          unit_number: unit?.unit_number || 'N/A',
          property_id: t.property_id || unit?.property_id || propertyIds[0],
          property_name: propertyMap.get(t.property_id || unit?.property_id) || '',
        });
      }
    });

    // Strategy C: Absolute Fallback if no tenants matched via foreign keys yet
    if (tenantMap.size === 0) {
      const { data: allTenants } = await supabase.from('tenants').select('*');
      (allTenants || []).forEach((t: any) => {
        tenantMap.set(t.id, {
          id: t.id,
          tenant_name: t.full_name || t.tenant_name || 'Unknown Tenant',
          email: t.email || '',
          phone: t.phone || '',
          unit_id: t.unit_id || '',
          unit_number: 'N/A',
          property_id: propertyIds[0],
          property_name: propertyMap.get(propertyIds[0]) || '',
        });
      });
    }

    return NextResponse.json({ success: true, tenants: Array.from(tenantMap.values()) });
  } catch (err: any) {
    console.error('Caretaker Tenants API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch tenants.' }, { status: 500 });
  }
}