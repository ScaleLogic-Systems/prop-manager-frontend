// app/auth/change-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import { Lock, Eye, EyeOff, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';

/** Map a profile role to the correct dashboard path safely */
function dashboardForRole(rawRole: string): string {
  const role = String(rawRole || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  
  switch (role) {
    case 'super_admin':
    case 'superadmin':
    case 'developer':
    case 'accountant':
      return '/super-admin';
    case 'property_manager':
      return '/property-manager';
    case 'property_owner':
    case 'owner':
      return '/owner';
    case 'marketer':
    case 'sales':
    case 'marketing':
      return '/marketer';
    case 'caretaker':
      return '/caretaker';
    case 'tenant':
    default:
      return '/tenant'; // Safe fallback instead of non-existent /dashboard
  }
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Show/Hide password toggle states
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function verifyAndSetupSession() {
      try {
        const url = window.location.href;
        
        // 1. Handle URL Hash fragments (Supabase default token format: #access_token=...&refresh_token=...)
        if (url.includes('#access_token=')) {
          const hashPart = url.split('#')[1];
          const hashParams = new URLSearchParams(hashPart);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }

        // 2. Handle PKCE code parameter (?code=...)
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          await supabase.auth.signOut();
          await supabase.auth.exchangeCodeForSession(code);
        }

        // 3. Verify active session exists now
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!ignore) {
          if (session) {
            setChecking(false);
          } else {
            // Give it one more brief check to account for async cookie settlement
            setTimeout(async () => {
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              if (!ignore) {
                if (!retrySession) {
                  router.replace('/login');
                } else {
                  setChecking(false);
                }
              }
            }, 1000);
          }
        }
      } catch (err) {
        console.error('Session verification error:', err);
        if (!ignore) {
          router.replace('/login');
        }
      }
    }

    verifyAndSetupSession();

    return () => {
      ignore = true;
    };
  }, [router, supabase]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      // 1. Update auth password and clear must_change_password flag
      const { data: { user }, error: updateError } = await supabase.auth.updateUser({
        password,
        data: { must_change_password: false },
      });

      if (updateError || !user) {
        throw new Error(updateError?.message || 'Failed to update password. Auth session missing or expired.');
      }

      // 2. Update profiles table state
      await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', user.id);

      // 3. Get user role for correct dashboard redirection
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const userRole = profile?.role || 'tenant';
      const destinationUrl = dashboardForRole(userRole);
      
      setSuccess(true);

      // 4. Redirect after success flash
      setTimeout(() => {
        router.replace(destinationUrl);
      }, 1500);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Verifying secure session...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 text-slate-100">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-indigo-600/20 border border-indigo-500/30 rounded-2xl p-4 mb-4">
            <KeyRound size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Set Permanent Password</h1>
          <p className="text-slate-400 text-sm mt-1">
            You are logging in with a temporary password. Please create a new password to continue.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-5">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
              <p className="text-white font-semibold">Password set successfully!</p>
              <p className="text-slate-400 text-xs">Redirecting you to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              {/* New Password Field with Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock size={12} /> New Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field with Toggle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock size={12} /> Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/20 text-xs uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock size={16} />
                {loading ? 'Updating Password...' : 'Save & Continue to Dashboard'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}