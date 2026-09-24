// app/api/admin/send-property-invite/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseServer';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, propertyIds, role } = body;

    if (!email || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Email and at least one property must be selected.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const targetRole = role || 'owner';
    const inviteToken = crypto.randomUUID();
    const db = getSupabaseAdmin();

    // 1. Save invitation record
    const { error: inviteError } = await db.from('property_invitations').insert({
      email: normalizedEmail,
      property_ids: propertyIds,
      role: targetRole,
      token: inviteToken,
      status: 'pending',
    });

    if (inviteError) throw inviteError;

    // 2. Build secure acceptance link
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prop-manager-frontend.vercel.app';
    const acceptLink = `${appUrl}/auth/accept-property?token=${inviteToken}`;

    // 3. Send email via Resend
    if (process.env.RESEND_RESEND_API_KEY || process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'PropManager <billing@yourdomain.com>',
        to: normalizedEmail,
        subject: 'Property Management Access Invitation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 12px;">
            <h2 style="color: #fbbf24; margin-top: 0;">You've Been Invited!</h2>
            <p>You have been invited to access and manage <strong>${propertyIds.length} property(ies)</strong> on PropManager HQ as a <span style="color: #38bdf8; text-transform: uppercase;">${targetRole}</span>.</p>
            <p>Click the secure button below to accept your invitation and link these properties to your account:</p>
            <div style="margin: 30px 0;">
              <a href="${acceptLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accept & Link Properties</a>
            </div>
            <p style="font-size: 12px; color: #94a3b8;">If you did not expect this invitation, you can safely ignore this email.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true, message: `Invitation dispatched successfully to ${normalizedEmail}.` });
  } catch (err: any) {
    console.error('Invite error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to send invitation.' }, { status: 500 });
  }
}