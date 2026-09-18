'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const AddUsersTab: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('developer');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const availableRoles = [
    { value: 'developer', label: 'Developer (Technical & System Controls)', badge: 'Tech' },
    { value: 'accountant', label: 'Accountant (Financials & Reconciliation)', badge: 'Finance' },
    { value: 'super-admin', label: 'Super Admin (Full Platform Control)', badge: 'Admin' },
    { value: 'property-manager', label: 'Property Manager', badge: 'Management' },
    { value: 'admin', label: 'Admin', badge: 'Admin' },
    { value: 'owner', label: 'Property Owner', badge: 'Client' },
    { value: 'caretaker', label: 'Caretaker', badge: 'Staff' },
    { value: 'tenant', label: 'Tenant', badge: 'Client' },
  ];

  async function handleInviteUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('profiles').insert([
        {
          email,
          full_name: fullName,
          role,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setMessage({ type: 'success', text: `User successfully onboarded as ${role}!` });
      setEmail('');
      setFullName('');
      setRole('developer');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to onboard user.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">User Onboarding</h1>
        <p className="text-sm text-slate-300 mt-1 font-medium">
          Invite team members and assign operational system roles.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-medium mb-6 flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="opacity-60 hover:opacity-100">
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleInviteUser} className="space-y-5 text-xs">
          <div>
            <label className="block font-semibold text-slate-200 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-200 mb-2">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-200 mb-2">System Role</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition appearance-none cursor-pointer"
              >
                {availableRoles.map((r) => (
                  <option key={r.value} value={r.value} className="bg-slate-900 text-white">
                    [{r.badge}] {r.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                &#9660;
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl transition shadow-lg shadow-indigo-600/25 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? 'Sending Invitation...' : 'Send Invitation & Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
