// app/auth/change-password/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import { Lock, Eye, EyeOff, AlertCircle, KeyRound, CheckCircle2, Mail } from 'lucide-react';

/** Map a profile role to the correct dashboard path */
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
      return '/tenant';
  }
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Show/Hide password toggles
  const [showTempPw, setShowTempPw] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function initSessionCheck() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!ignore) {
          setHasSession(!!session);
          setChecking(false);
        }
      } catch (err) {
        console.error('Session check error:', err);
        if (!ignore) {
          setHasSession(false);
          setChecking(false);
        }
      }
    }

    initSessionCheck();
    return () => { ignore = true; };
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      let userId = '';

      // If user came from onboarding email without a pre-existing session, sign them in with their temp password first
      if (!hasSession) {
        if (!email || !tempPassword) {
          throw new Error('Please enter your email and temporary password.');
        }

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: tempPassword,
        });

        if (signInError || !signInData.user) {
          throw new Error('Invalid email or temporary password. Please check your credentials.');
        }

        userId = signInData.user.id;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Active session not found. Please log in again.');
        userId = user.id;
      }

      // Update password and clear must_change_password flag in auth metadata
      const { error: updateError } = await supabase.auth.updateUser({
        password,
        data: { must_change_password: false },
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update profiles table state
      await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('id', userId);

      // Fetch user role for correct dashboard redirection
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const role = profile?.role || 'tenant';
      const destination = dashboardForRole(role);

      setSuccess(true);
      setTimeout(() => {
        router.replace(destination);
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
        <div className="text-slate-400 text-sm animate-pulse">Initializing secure verification...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 text-slate-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-indigo-600/20 border border-indigo-500/30 rounded-2xl p-4 mb-4">
            <KeyRound size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Set Permanent Password</h1>
          <p className="text-slate-400 text-sm mt-1">
            {hasSession
              ? 'Create your permanent password to continue.'
              : 'Enter your temporary credentials and choose your new permanent password.'}
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* If no session, collect email & temporary password */}
              {!hasSession && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Mail size={12} /> Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Lock size={12} /> Temporary Password (from email)
                    </label>
                    <div className="relative">
                      <input
                        type={showTempPw ? 'text' : 'password'}
                        required
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder="Temporary password"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-11 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTempPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                      >
                        {showTempPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 my-2 pt-2"></div>
                </>
              )}

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock size={12} /> New Permanent Password
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

              {/* Confirm Password */}
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