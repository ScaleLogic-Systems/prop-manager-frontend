// app/auth/signin/route.ts
import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/supabaseServer';

/** Map a profile role to the correct dashboard path */
function dashboardForRole(rawRole: string): string {
  const role = String(rawRole || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  switch (role) {
    case 'super_admin':
    case 'superadmin':
      return '/super-admin';
    case 'developer':
      return '/developer';
    case 'accountant':
      return '/accountant';
    case 'property_manager':
      return '/property-manager';
    case 'property_owner':
    case 'owner':
      return '/owner';
    case 'marketer':
    case 'sales':
      return '/marketer';
    case 'caretaker':
      return '/caretaker';
    case 'agent':
      return '/agent';
    case 'tenant':
    default:
      return '/tenant';
  }
}

// ==========================================
// 1. GET HANDLER: Legacy Redirect
// ==========================================
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  return NextResponse.redirect(
    new URL(`/login${requestUrl.search}`, requestUrl.origin)
  );
}

// ==========================================
// 2. POST HANDLER: Password Authentication & Check
// ==========================================
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to initialize session client.' },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Authenticate user with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Invalid login credentials.' },
        { status: 401 }
      );
    }

    // Check if the user is logging in with a temporary password
    const mustChangePassword =
      data.user.user_metadata?.must_change_password === true;

    if (mustChangePassword) {
      return NextResponse.json(
        {
          message: 'Password reset required.',
          mustChangePassword: true,
          redirectTo: '/auth/change-password',
        },
        { status: 200 }
      );
    }

    // Fetch user's actual role from profiles table to ensure accurate redirection
    const db = getSupabaseAdmin() || supabase;
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    const role = profile?.role || data.user.user_metadata?.role || 'tenant';
    const redirectTo = dashboardForRole(role);

    // Standard successful authentication with proper role-based redirect
    return NextResponse.json(
      {
        message: 'Signed in successfully.',
        mustChangePassword: false,
        redirectTo,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[SIGNIN_ERROR]', err.message);
    return NextResponse.json(
      { error: err.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}