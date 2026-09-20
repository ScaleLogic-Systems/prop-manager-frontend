import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';
import { resend, FROM_EMAIL } from '@/lib/resend';

const allowedRoles = [
  'developer',
  'accountant',
  'super_admin',
  'property_manager',
  'admin',
  'owner',
  'caretaker',
  'tenant',
] as const;

type AllowedRole = (typeof allowedRoles)[number];

function normalizeRole(value: string): AllowedRole | null {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  return allowedRoles.includes(normalized as AllowedRole) ? (normalized as AllowedRole) : null;
}

function generateTempPassword() {
  return `PM-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}!`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] || character);
}

export async function POST(request: NextRequest) {
  let createdUserId: string | null = null;

  try {
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });

    const db = getSupabaseAdmin();
    const { data: actor } = await db
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();
    const actorRole = String(actor?.role || user.user_metadata?.role || '')
      .toLowerCase()
      .replace(/-/g, '_');

    if (!['super_admin', 'admin'].includes(actorRole)) {
      return NextResponse.json({ error: 'Only super-admin accounts can invite users.' }, { status: 403 });
    }

    const body = await request.json();
    const fullName = String(body.full_name || body.fullName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim() || null;
    const role = normalizeRole(String(body.role || ''));

    if (!fullName || !email || !role) {
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
    createdUserId = created.user.id;

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

    const safeName = escapeHtml(fullName);
    const safeActorName = escapeHtml(String(actor?.full_name || 'the PropManager team'));
    const safeRole = escapeHtml(role.replace(/_/g, ' '));
    const { error: emailError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your PropManager account invitation',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:600px;margin:auto">
        <h2>Welcome to PropManager, ${safeName}</h2>
        <p>Your account has been created by ${safeActorName}.</p>
        <p><strong>Temporary password:</strong> ${escapeHtml(tempPassword)}</p>
        <p><a href="${linkData.properties.action_link}" style="display:inline-block;background:#2563eb;color:white;padding:12px 18px;text-decoration:none;border-radius:6px">Set your permanent password</a></p>
        <p>You must set a new password before accessing your account.</p>
        <p><strong>Assigned role:</strong> ${safeRole}</p>
      </div>`,
    });
    if (emailError) throw emailError;

    return NextResponse.json({ message: 'Account created and invitation email sent successfully.' }, { status: 201 });
  } catch (error: unknown) {
    if (createdUserId) {
      try {
        await getSupabaseAdmin().auth.admin.deleteUser(createdUserId);
      } catch (cleanupError) {
        console.error('Failed to clean up incomplete invited user:', cleanupError);
      }
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to invite user.' },
      { status: 500 },
    );
  }
}