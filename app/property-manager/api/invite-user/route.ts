import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';
import { resend, FROM_EMAIL } from '@/lib/resend';

function generateTempPassword() {
  return `PM-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}!`;
}

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

    const tempPassword = generateTempPassword();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name, phone, role, must_change_password: true },
    });
    if (createError || !created.user) throw createError || new Error('Failed to create user');
    const profileId = created.user.id;
    const { error: profileError } = await admin.from('profiles').upsert({
      id: profileId,
      full_name,
      email,
      phone: phone || null,
      role,
      status: 'active',
      must_change_password: true,
    });
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
    const origin = new URL(request.url).origin;
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${origin}/auth/callback?next=/auth/change-password` },
    });
    if (linkError || !linkData.properties?.action_link) {
      throw linkError || new Error('Failed to create invitation link');
    }

    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your PropManager account invitation',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:auto">
        <h2>Welcome to PropManager, ${full_name}</h2>
        <p>Your account has been created by a property manager.</p>
        <p><strong>Temporary password:</strong> ${tempPassword}</p>
        <p><a href="${linkData.properties.action_link}" style="display:inline-block;background:#2563eb;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">Set your permanent password</a></p>
        <p>You must set a new password before using your account.</p>
        <p><strong>Assigned role:</strong> ${role}</p>
      </div>`,
    });
    if (emailError) throw emailError;

    return NextResponse.json({ message: 'Account created and invitation email sent successfully.' }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to invite user' }, { status: 500 });
  }
}
