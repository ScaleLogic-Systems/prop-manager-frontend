'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

    // 1. Update auth password
    const { data: { user }, error: updateError } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });

    if (updateError || !user) {
      setError(updateError?.message || 'Failed to update password.');
      setLoading(false);
      return;
    }

    // 2. Update profile state
    await supabase
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', user.id);

    // 3. Get user role and redirect to dashboard
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = String(profile?.role || 'tenant').toLowerCase().trim().replace(/\s+/g, '_');
    const destinations: Record<string, string> = {
      super_admin: '/super-admin',
      property_manager: '/property-manager',
      owner: '/owner',
      property_owner: '/owner',
      landlord: '/owner',
      caretaker: '/caretaker',
      tenant: '/tenant',
      developer: '/developer',
      marketer: '/marketer',
      accountant: '/accountant',
    };
    router.push(destinations[role] || '/property-manager');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Set Permanent Password</h1>
        <p className="text-sm text-gray-600 text-center mt-1 mb-6">
          You are logging in with a temporary password. Please create a new password to continue.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs font-medium text-center mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition disabled:opacity-50"
          >
            {loading ? 'Updating Password...' : 'Save & Continue to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}