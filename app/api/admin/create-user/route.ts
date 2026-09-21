import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

function generateTemporaryPassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, fullName, role } = body;

    if (!email || !fullName || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, fullName, or role.' },
        { status: 400 }
      );
    }

    // Normalize role matching database schema
    const normalizedRole = role === 'property_owner' ? 'owner' : role;
    const tempPassword = generateTemporaryPassword();

    // 1. Create user in Supabase Auth via Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: normalizedRole,
        must_change_password: true,
      },
    });

    if (authError) {
      throw new Error(authError.message);
    }

    const userId = authData.user.id;

    // 2. Upsert profile record with active status
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email,
        full_name: fullName,
        role: normalizedRole,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // 3. Send email via Resend
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://propmanager.co.ke';
    const changePasswordUrl = `${appUrl}/auth/change-password`;

    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: email,
        subject: 'Your PropManager HQ Account & Temporary Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
            <h2 style="color: #fbbf24; margin-top: 0;">Welcome to PropManager HQ, ${fullName}!</h2>
            <p>An administrative account has been created for you with the role: <strong style="text-transform: uppercase; color: #38bdf8;">${normalizedRole}</strong>.</p>
            
            <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
              <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>Temporary Password:</strong></p>
              <code style="background: #0f172a; padding: 8px 12px; display: inline-block; border-radius: 6px; color: #34d399; font-size: 16px; font-family: monospace;">${tempPassword}</code>
            </div>

            <p>For security reasons, you are required to set a permanent password upon your first sign-in.</p>
            
            <div style="margin-top: 30px;">
              <a href="${changePasswordUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Sign In & Set Password</a>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: `User successfully invited and temporary password dispatched to ${email}.`,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}