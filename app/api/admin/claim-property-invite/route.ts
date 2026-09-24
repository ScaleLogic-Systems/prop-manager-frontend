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

    // 1. Fetch the pending invitation
    const { data: invite, error: inviteErr } = await db
      .from('property_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteErr || !invite) {
      return NextResponse.json({ success: false, error: 'Invalid or expired invitation token.' }, { status: 400 });
    }

    const propertyIds = invite.property_ids;
    const targetRole = invite.role; // 'owner', 'property_manager', or 'caretaker'

    // 2. Update user profile role
    await db.from('profiles').update({ role: targetRole }).eq('id', userId);

    // 3. Link properties based on the role
    let updatePayload: Record<string, any> = {};
    if (targetRole === 'owner') {
      updatePayload = { owner_id: userId };
    } else if (targetRole === 'property_manager') {
      updatePayload = { property_manager_id: userId };
    } else if (targetRole === 'caretaker') {
      updatePayload = { caretaker_id: userId }; // <-- This was missing for caretakers!
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updatePropErr } = await db
        .from('properties')
        .update(updatePayload)
        .in('id', propertyIds);

      if (updatePropErr) throw updatePropErr;
    }

    // 4. Mark invitation as accepted
    await db.from('property_invitations').update({ status: 'accepted' }).eq('id', invite.id);

    return NextResponse.json({ success: true, role: targetRole });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Failed to claim invitation.' }, { status: 500 });
  }
}