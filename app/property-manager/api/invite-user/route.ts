import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    const body = await request.json();
    const { full_name, email, phone, role, property_id, unit_number } = body;
    if (!full_name || !email || !property_id || !['tenant', 'caretaker'].includes(role)) {
      return NextResponse.json({ error: 'Full name, email, role, and property are required.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data: property } = await admin.from('properties').select('id, property_manager_id').eq('id', property_id).eq('property_manager_id', user.id).single();
    if (!property) return NextResponse.json({ error: 'Property not found or access denied.' }, { status: 403 });

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name, phone, role } });
    if (inviteError || !invited.user) throw inviteError || new Error('Failed to invite user');
    const profileId = invited.user.id;
    const { error: profileError } = await admin.from('profiles').upsert({ id: profileId, full_name, email, phone: phone || null, role: role.toUpperCase() });
    if (profileError) throw profileError;

    if (role === 'caretaker') {
      const { error } = await admin.from('properties').update({ caretaker_id: profileId }).eq('id', property_id);
      if (error) throw error;
    } else {
      let unitId: string | null = null;
      if (unit_number && unit_number !== 'N/A') {
        const { data: unit } = await admin.from('units').select('id').eq('property_id', property_id).eq('unit_number', unit_number).single();
        unitId = unit?.id || null;
      }
      const { error } = await admin.from('tenants').insert({ profile_id: profileId, property_id, unit_id: unitId });
      if (error) throw error;
      if (unitId) await admin.from('units').update({ is_occupied: true }).eq('id', unitId);
    }
    return NextResponse.json({ message: 'Invitation sent and user assigned.' }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to invite user' }, { status: 500 });
  }
}
