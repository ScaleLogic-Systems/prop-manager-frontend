// app/api/admin/claim-property-invite/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    const { token, userId } = await request.json();
    if (!token || !userId) {
      return NextResponse.json({ success: false, error: 'Missing token or user ID.' }, { status: 400 });
    }

    const db = getSupabaseAdmin();

    // 1. Fetch the invitation
    const { data: invite, error: inviteErr } = await db
      .from('property_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteErr || !invite) {
      return NextResponse.json({ success: false, error: 'Invalid or expired invitation token.' }, { status: 400 });
    }

    // 2. Update user profile role if needed and link properties
    const propertyIds = invite.property_ids;
    const targetRole = invite.role; // 'owner' or 'property_manager'

    // Update profile role
    await db.from('profiles').update({ role: targetRole }).eq('id', userId);

    // Link properties based on role
    const updatePayload = targetRole === 'owner' ? { owner_id: userId } : { property_manager_id: userId };

    const { error: updatePropErr } = await db
      .from('properties')
      .update(updatePayload)
      .in('id', propertyIds);

    if (updatePropErr) throw updatePropErr;

    // 3. Mark invitation as accepted
    await db.from('property_invitations').update({ status: 'accepted' }).eq('id', invite.id);

    return NextResponse.json({ success: true, role: targetRole });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to claim invitation.' }, { status: 500 });
  }
}