// app/api/tenant/profile/route.ts
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

    const supabase = getSupabaseAdmin();
    let userId = '';

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    // Fallback if no bearer token passed directly in headers
    if (!userId) {
      const cookieHeader = request.headers.get('cookie') || '';
      // If using cookie session auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get tenant record linked to this profile
    const { data: tenantRec, error: tenantErr } = await supabase
      .from('tenants')
      .select(`
        id,
        property_id,
        unit_id,
        properties (
          id,
          name,
          caretaker_id,
          manager_id
        ),
        units (
          id,
          unit_number
        ),
        profiles (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('profile_id', userId)
      .single();

    if (tenantErr || !tenantRec) {
      // Fallback: check profiles table directly
      const { data: profileRec } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return NextResponse.json({
        success: true,
        profile: {
          full_name: profileRec?.full_name || 'Tenant',
          property_name: 'Not assigned',
          unit_number: 'N/A',
          contacts: []
        }
      });
    }

    const prop = Array.isArray(tenantRec.properties) ? tenantRec.properties[0] : tenantRec.properties;
    const unit = Array.isArray(tenantRec.units) ? tenantRec.units[0] : tenantRec.units;
    const profile = Array.isArray(tenantRec.profiles) ? tenantRec.profiles[0] : tenantRec.profiles;

    const contacts: any[] = [];

    // 2. Fetch Caretaker(s) assigned to this property
    if (prop?.caretaker_id) {
      const { data: caretaker } = await supabase
        .from('profiles')
        .select('full_name, phone, role')
        .eq('id', prop.caretaker_id)
        .single();

      if (caretaker) {
        contacts.push({
          name: caretaker.full_name || 'Property Caretaker',
          phone: caretaker.phone || '',
          role: 'Caretaker'
        });
      }
    }

    // 3. Fetch Manager / Agent assigned to this property
    if (prop?.manager_id) {
      const { data: manager } = await supabase
        .from('profiles')
        .select('full_name, phone, role')
        .eq('id', prop.manager_id)
        .single();

      if (manager) {
        contacts.push({
          name: manager.full_name || 'Property Agent / Manager',
          phone: manager.phone || '',
          role: 'Property Agent'
        });
      }
    }

    return NextResponse.json({
      success: true,
      profile: {
        full_name: profile?.full_name || 'Tenant',
        property_name: prop?.name || 'Assigned Property',
        unit_number: unit?.unit_number || 'N/A',
        contacts: contacts // Array of all caretakers and agents
      }
    });

  } catch (err: any) {
    console.error('Tenant Profile API Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}