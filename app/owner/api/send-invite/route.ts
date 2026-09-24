import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Helper to create Supabase admin client for secure backend operations
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

const resendApiKey = process.env.RESEND_API_KEY || process.env.RESEND_RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Missing auth token.' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Verify user session from token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid session.' }, { status: 401 });
    }

    const body = await request.json();
    const { email, role, propertyIds } = body;

    if (!email || !role || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, role, or propertyIds.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const inviteToken = crypto.randomUUID();

    // 2. Insert invitation record into the database
    const { error: inviteError } = await supabaseAdmin.from('property_invitations').insert({
      email: normalizedEmail,
      property_ids: propertyIds,
      role: role,
      token: inviteToken,
      status: 'pending',
      invited_by: user.id,
    });

    if (inviteError) {
      throw new Error(`Failed to create invitation record: ${inviteError.message}`);
    }

    // 3. Build secure acceptance link
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://logic.scalelogicsystems.com';
    const acceptLink = `${siteUrl}/auth/accept-property?token=${inviteToken}`;

    // 4. Send email via Resend (if configured)
    if (resend) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'PropManager HQ <billing@scalelogicsystems.com>',
          to: [normalizedEmail],
          subject: 'Property Management & Portal Access Invitation',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; color: #1e293b; border-radius: 12px; border: 1px solid #e2e8f0;">
              <h2 style="color: #2563eb; margin-top: 0;">You've Been Invited!</h2>
              <p>Hello,</p>
              <p>You have been invited to access and manage <strong>${propertyIds.length} property(ies)</strong> on PropManager as a <span style="color: #0284c7; text-transform: uppercase; font-weight: bold;">${role}</span>.</p>
              <p>Click the secure button below to accept your invitation, link these properties, and access your portal dashboard:</p>
              <div style="margin: 32px 0; text-align: center;">
                <a href="${acceptLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">Accept & Link Properties</a>
              </div>
              <p style="font-size: 13px; color: #64748b; word-break: break-all;">Or copy and paste this link into your browser:<br/><a href="${acceptLink}" style="color: #2563eb;">${acceptLink}</a></p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #94a3b8;">If you did not expect this invitation, you can safely ignore this email.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Failed to dispatch email via Resend:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Invitation successfully sent to ${normalizedEmail}.`,
    });
  } catch (err: any) {
    console.error('API Error in /owner/api/send-invite:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to process invitation.' },
      { status: 500 }
    );
  }
}