'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

interface AccountSettingsTabProps {
  roleTitle: string;
}

export const AccountSettingsTab: React.FC<AccountSettingsTabProps> = ({ roleTitle }) => {
  const supabase = createClient();
  const [userId, setUserId] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadUserData() {
      try {
        setFetching(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserId(user.id);
        setEmail(user.email || '');

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();

        if (profile) {
          setFullName(profile.full_name || '');
          setPhone(profile.phone || '');
        }
      } catch (err) {
        console.error('Error loading settings profile:', err);
      } finally {
        setFetching(false);
      }
    }

    loadUserData();
  }, [supabase]);

  async function handleUpdateSettings(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fullName, phone, email }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update settings.');
      }

      setMessage({ type: 'success', text: json.message || 'Settings updated successfully.' });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return <div className="text-sm text-slate-400 p-6">Loading account settings...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Account Settings</h1>
        <p className="text-sm text-slate-300 mt-1 font-medium">
          Manage your personal credentials, contact email, and phone number for your {roleTitle.toLowerCase()} portal.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-medium mb-6 flex items-start gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
            )}
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100 ml-2">
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleUpdateSettings} className="space-y-5 text-xs">
          <div>
            <label className="block font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
              <User size={13} /> Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
              <Mail size={13} /> Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Note: Changing your email will require verification through your new inbox.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
              <Phone size={13} /> Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254 700 000 000"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl transition shadow-lg shadow-indigo-600/25 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Saving Changes...' : 'Save Account Settings'}</span>
              <Save size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};