import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';
import { resend, FROM_EMAIL } from '@/lib/resend';

const allowedRoles = ['owner', 'property_manager', 'accountant', 'tenant', 'caretaker'] as const;
type AllowedRole = (typeof allowedRoles)[number];

function generateTempPassword() {
  return `MK-${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}!`;
}

function normalizeRole(value: string) {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_');
  if (normalized === 'property_owner' || normalized === 'landlord') return 'owner';
  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });

    const db = getSupabaseAdmin();
    const { data: actor } = await db.from('profiles').select('role, full_name').eq('id', user.id).single();
    const actorRole = String(actor?.role || user.user_metadata?.role || '').toLowerCase();
    if (!['marketer', 'marketing', 'admin', 'super_admin'].includes(actorRole)) {
      return NextResponse.json({ error: 'Only authorized marketer accounts can invite users.' }, { status: 403 });
    }

    const body = await request.json();
    const fullName = String(body.full_name || body.fullName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = body.phone || body.phone_number || null;
    const role = normalizeRole(String(body.role || '')) as AllowedRole;

    if (!fullName || !email || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Full name, email, and a valid role are required.' }, { status: 400 });
    }

    const tempPassword = generateTempPassword();
    const { data: created, error: createError } = await db.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone, role, must_change_password: true },
    });
    if (createError || !created.user) throw createError || new Error('Failed to create user account.');

    const { error: profileError } = await db.from('profiles').upsert({
      id: created.user.id,
      full_name: fullName,
      email,
      phone,
      role,
      status: 'active',
      must_change_password: true,
    });
    if (profileError) throw profileError;

    const origin = new URL(request.url).origin;
    const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${origin}/auth/callback?next=/auth/change-password` },
    });
    if (linkError || !linkData.properties?.action_link) {
      throw linkError || new Error('Failed to create invitation link.');
    }

    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your PropManager account invitation',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:auto">
        <h2>Welcome to PropManager, ${fullName}</h2>
        <p>Your account has been created by ${actor?.full_name || 'the PropManager team'}.</p>
        <p><strong>Temporary password:</strong> ${tempPassword}</p>
        <p><a href="${linkData.properties.action_link}" style="display:inline-block;background:#2563eb;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">Set your permanent password</a></p>
        <p>You must set a new password before accessing your account.</p>
        <p><strong>Assigned role:</strong> ${role.replace(/_/g, ' ')}</p>
      </div>`,
    });
    if (emailError) throw emailError;

    return NextResponse.json({ message: 'Account created and invitation email sent successfully.' }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to invite user.' }, { status: 500 });
  }
}
