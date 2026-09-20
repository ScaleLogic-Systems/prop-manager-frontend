import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { type EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/dashboard';

  const targetUrl = `${origin}${next}`;
  let response = NextResponse.redirect(targetUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.redirect(targetUrl);
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 1. PKCE Code Exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[CALLBACK_CODE_ERROR]', error.message);
      return NextResponse.redirect(`${origin}/login?error=invalid_link`);
    }
  } else if (token_hash && type) {
    // 2. Token Hash / OTP Verification
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (error) {
      console.error('[CALLBACK_VERIFY_OTP_ERROR]', error.message);
      return NextResponse.redirect(`${origin}/login?error=invalid_link`);
    }
  }

  // 3. Temporary Password / Password Change Verification
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check user_metadata flag
    const mustChangePassword = user.user_metadata?.must_change_password === true;

    if (mustChangePassword) {
      const redirectResponse = NextResponse.redirect(`${origin}/auth/change-password`);
      
      // Preserve session cookies set during exchange/verification
      response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });

      return redirectResponse;
    }
  }

  return response;
}