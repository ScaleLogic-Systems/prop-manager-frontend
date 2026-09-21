import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
    const { userId, fullName, phone, email } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required.' }, { status: 400 });
    }

    const trimmedEmail = email ? email.trim().toLowerCase() : undefined;
    const trimmedName = fullName ? fullName.trim() : undefined;
    const trimmedPhone = phone ? phone.trim() : undefined;

    // 1. Update Supabase Auth if email or name/phone metadata changed
    const authUpdates: { email?: string; user_metadata?: { full_name?: string; phone?: string } } = {};
    if (trimmedEmail) authUpdates.email = trimmedEmail;
    if (trimmedName || trimmedPhone) {
      authUpdates.user_metadata = {};
      if (trimmedName) authUpdates.user_metadata.full_name = trimmedName;
      if (trimmedPhone) authUpdates.user_metadata.phone = trimmedPhone;
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates);
      if (authError) {
        throw new Error(authError.message);
      }
    }

    // 2. Update public.profiles table
    const profileUpdates: { full_name?: string; phone?: string; email?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (trimmedName) profileUpdates.full_name = trimmedName;
    if (trimmedPhone) profileUpdates.phone = trimmedPhone;
    if (trimmedEmail) profileUpdates.email = trimmedEmail;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId);

    if (profileError) {
      throw new Error(`Failed to update profile record: ${profileError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Account settings updated successfully. If you updated your email, please check your inbox for verification.',
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}