// app/api/admin/create-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Build a service-role admin client — never expose this key to the browser.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function generateTempPassword(length = 16): string {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let result = '';
  // Use Math.random only as a fallback — crypto is available in Node 18+
  const arr = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < length; i++) {
    result += chars[arr[i] % chars.length];
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { email, fullName, role } = (await req.json()) as {
      email: string;
      fullName: string;
      role: string;
    };

    if (!email || !role) {
      return NextResponse.json({ error: 'email and role are required' }, { status: 400 });
    }

    const tempPassword = generateTempPassword();

    // 1. Create auth user with Admin API — email confirmed immediately, no verification email
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || '',
        role,
        must_change_password: true,
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const userId = authUser.user.id;

    // 2. Upsert profile row so the role is immediately readable via RLS policies
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: fullName || '',
        role,
      },
      { onConflict: 'id' }
    );

    if (profileError) {
      // Roll back auth user so we don't leave orphan accounts
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // 3. Send invitation email via Resend
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const setPasswordUrl = `${appUrl}/set-password`;

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'no-reply@propmanager.app',
            to: [email],
            subject: 'Welcome to PropManager — Set Your Password',
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
                <h2 style="color:#1e293b">You have been invited to PropManager</h2>
                <p>Hi ${fullName || 'there'},</p>
                <p>Your account has been created with the role: <strong>${role}</strong>.</p>
                <p>
                  Please click the button below to set your permanent password and access your dashboard.
                  For reference, your temporary password is:
                </p>
                <div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:12px 20px;font-family:monospace;font-size:16px;letter-spacing:2px;margin:16px 0">
                  ${tempPassword}
                </div>
                <a
                  href="${setPasswordUrl}"
                  style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;margin-top:8px"
                >
                  Set Your Password
                </a>
                <p style="margin-top:24px;font-size:12px;color:#64748b">
                  If you did not expect this email, please ignore it.
                </p>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        // Non-fatal — user is created; log the failure but don't break the response
        console.error('Invitation email failed:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      message: `User created and invitation sent to ${email}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

