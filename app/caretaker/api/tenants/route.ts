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
    const { data: units } = await supabase
      .from('units')
      .select('id, unit_number, property_id')
      .in('property_id', propertyIds);

    const unitIds = (units || []).map((u: any) => u.id);
    const unitMap = new Map((units || []).map((u: any) => [u.id, u]));

    // 3. Query tenants by property_id OR unit_id with profile & unit joins
    const tenantMap = new Map();

    const { data: tenantsByProp } = await supabase
      .from('tenants')
      .select(`
        id,
        property_id,
        unit_id,
        profile_id,
        profiles (
          id,
          full_name,
          email,
          phone
        ),
        units (
          id,
          unit_number
        ),
        properties (
          id,
          name
        )
      `)
      .in('property_id', propertyIds);

    (tenantsByProp || []).forEach((t: any) => {
      if (t && t.id) {
        const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles || {};
        const unit = Array.isArray(t.units) ? t.units[0] : t.units || {};
        const prop = Array.isArray(t.properties) ? t.properties[0] : t.properties || {};
        const resolvedPropId = t.property_id || unitMap.get(t.unit_id)?.property_id || propertyIds[0];

        tenantMap.set(t.id, {
          id: t.id,
          tenant_name: profile.full_name || profile.name || 'Tenant',
          email: profile.email || '',
          phone: profile.phone || '',
          unit_id: t.unit_id || '',
          unit_number: unit.unit_number || unitMap.get(t.unit_id)?.unit_number || 'N/A',
          property_id: resolvedPropId,
          property_name: prop.name || propertyMap.get(resolvedPropId) || 'Property',
        });
      }
    });

    if (unitIds.length > 0) {
      const { data: tenantsByUnit } = await supabase
        .from('tenants')
        .select(`
          id,
          property_id,
          unit_id,
          profile_id,
          profiles (
            id,
            full_name,
            email,
            phone
          ),
          units (
            id,
            unit_number
          ),
          properties (
            id,
            name
          )
        `)
        .in('unit_id', unitIds);

      (tenantsByUnit || []).forEach((t: any) => {
        if (t && t.id && !tenantMap.has(t.id)) {
          const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles || {};
          const unit = Array.isArray(t.units) ? t.units[0] : t.units || {};
          const prop = Array.isArray(t.properties) ? t.properties[0] : t.properties || {};
          const resolvedPropId = t.property_id || unitMap.get(t.unit_id)?.property_id || propertyIds[0];

          tenantMap.set(t.id, {
            id: t.id,
            tenant_name: profile.full_name || profile.name || 'Tenant',
            email: profile.email || '',
            phone: profile.phone || '',
            unit_id: t.unit_id || '',
            unit_number: unit.unit_number || unitMap.get(t.unit_id)?.unit_number || 'N/A',
            property_id: resolvedPropId,
            property_name: prop.name || propertyMap.get(resolvedPropId) || 'Property',
          });
        }
      });
    }

    return NextResponse.json({ success: true, tenants: Array.from(tenantMap.values()) });
  } catch (err: any) {
    console.error('Caretaker Tenants API Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to fetch tenants.' }, { status: 500 });
  }
}