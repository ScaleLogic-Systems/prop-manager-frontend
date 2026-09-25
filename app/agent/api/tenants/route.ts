// app/agent/api/tenants/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const paramPropertyId = url.searchParams.get('property_id');

    // Get properties assigned to agent
    let propQuery = supabase.from('properties').select('id, name');
    if (paramPropertyId) {
      propQuery = propQuery.eq('id', paramPropertyId);
    } else {
      propQuery = propQuery.or(`manager_id.eq.${user.id},agent_id.eq.${user.id}`);
    }

    const { data: properties } = await propQuery;
    const propertyIds = (properties || []).map((p: any) => p.id);
    const propertyMap = new Map((properties || []).map((p: any) => [p.id, p.name]));

    if (propertyIds.length === 0) {
      return NextResponse.json({ success: true, tenants: [] });
    }

    // Get units
    const { data: units } = await supabase
      .from('units')
      .select('id, unit_number, property_id')
      .in('property_id', propertyIds);

    const unitMap = new Map((units || []).map((u: any) => [u.id, u]));

    // Get tenants with profile and unit joins
    const { data: tenants } = await supabase
      .from('tenants')
      .select(`
        id,
        property_id,
        unit_id,
        profile_id,
        profiles (
          full_name,
          email,
          phone
        ),
        units (
          unit_number
        ),
        properties (
          name
        )
      `)
      .in('property_id', propertyIds);

    const tenantList = (tenants || []).map((t: any) => {
      const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles || {};
      const unit = Array.isArray(t.units) ? t.units[0] : t.units || {};
      const prop = Array.isArray(t.properties) ? t.properties[0] : t.properties || {};
      const unitObj = t.unit_id ? unitMap.get(t.unit_id) : null;
      const propId = t.property_id || unitObj?.property_id || propertyIds[0];

      return {
        id: t.id,
        tenant_name: profile.full_name || profile.name || 'Tenant',
        email: profile.email || '',
        phone: profile.phone || '',
        unit_id: t.unit_id || '',
        unit_number: unit.unit_number || unitObj?.unit_number || 'N/A',
        property_id: propId,
        property_name: prop.name || propertyMap.get(propId) || 'Property',
      };
    });

    return NextResponse.json({ success: true, tenants: tenantList });
  } catch (err: any) {
    console.error('Agent Tenants API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}