// app/set-password/page.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

/** Map a profile role to the correct dashboard path */
function dashboardForRole(role: string): string {
  switch (role) {
    case 'super-admin':
    case 'superadmin':
    case 'developer':
    case 'accountant':
      return '/super-admin';
    case 'property_manager':
    case 'property-manager':
      return '/property-manager';
    case 'property_owner':
    case 'owner':
      return '/owner';
    case 'marketer':
      return '/marketer';
    case 'caretaker':
      return '/caretaker';
    case 'tenant':
      return '/tenant';
    default:
      return '/dashboard';
  }
}

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check whether the user already has an active session (arrived via magic link or
  // signed in manually with the temp password).
  useEffect(() => {
    let ignore = false;
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!ignore) {
        if (!session) {
          // No session — redirect to login so they sign in first with temp password
          router.replace('/login?next=/set-password');
        }
        setChecking(false);
      }
    }
    checkSession();
    return () => { ignore = true; };
  }, [router, supabase]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // 1. Update the password
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // 2. Clear the must_change_password flag from metadata
      await supabase.auth.updateUser({ data: { must_change_password: false } });

      // 3. Get session to find the role
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      let role = session?.user?.user_metadata?.role as string | undefined;

      // Also try fetching from profiles table for accuracy
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
        if (profile?.role) role = profile.role;
      }

      setSuccess(true);

      // 4. Redirect to role-appropriate dashboard after a brief success flash
      setTimeout(() => {
        router.replace(dashboardForRole(role ?? ''));
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Verifying session…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-indigo-600/20 border border-indigo-500/30 rounded-2xl p-4 mb-4">
            <KeyRound size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Set Your Password</h1>
          <p className="text-slate-400 text-sm mt-1">
            Choose a strong password to secure your account.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-5">
          {/* Error */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {success ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
              <p className="text-white font-semibold">Password set successfully!</p>
              <p className="text-slate-400 text-xs">Redirecting you to your dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Lock size={12} /> New Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Lock size={12} /> Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="flex items-center gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        password.length >= (i + 1) * 3
                          ? password.length >= 12
                            ? 'bg-emerald-500'
                            : password.length >= 8
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                          : 'bg-slate-800'
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Fair' : 'Weak'}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl transition shadow-lg shadow-indigo-600/25 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock size={16} />
                {loading ? 'Saving…' : 'Set Password & Enter Dashboard'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
