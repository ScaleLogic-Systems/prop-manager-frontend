// app/api/auth/forgot-password/route.ts
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

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Verify if the email exists in our profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'The email has not been found in our database.' },
        { status: 404 }
      );
    }

    // 2. Generate Supabase recovery action link pointing correctly to /set-password
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://prop-manager-frontend.vercel.app';
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: `${appUrl}/set-password`, // 👈 Fixed redirect route
      },
    });

    if (linkError || !linkData) {
      throw new Error(linkError?.message || 'Failed to generate password recovery link.');
    }

    const recoveryUrl = linkData.properties?.action_link;

    // 3. Dispatch email via Resend
    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: normalizedEmail,
        subject: 'Reset Your PropManager HQ Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
            <h2 style="color: #fbbf24; margin-top: 0;">Password Reset Request</h2>
            <p>Hello ${profile.full_name || 'User'},</p>
            <p>We received a request to reset your password. Click the button below to set a new permanent password:</p>
            
            <div style="margin-top: 30px;">
              <a href="${recoveryUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>

            <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset link has been successfully sent to your email.',
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}