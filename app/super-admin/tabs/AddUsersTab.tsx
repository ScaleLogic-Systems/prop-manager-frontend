// app/super-admin/tabs/AddUsersTab.tsx
'use client';

import React, { useState } from 'react';
import { UserPlus, CheckCircle2, AlertCircle, Mail, User, ShieldCheck } from 'lucide-react';

const availableRoles = [
  { value: 'developer', label: 'Developer (Technical & System Controls)', badge: 'Tech' },
  { value: 'accountant', label: 'Accountant (Financials & Reconciliation)', badge: 'Finance' },
  { value: 'super-admin', label: 'Super Admin (Full Platform Control)', badge: 'Admin' },
  { value: 'property_manager', label: 'Property Manager', badge: 'Management' },
  { value: 'admin', label: 'Admin', badge: 'Admin' },
  { value: 'owner', label: 'Property Owner', badge: 'Client' },
  { value: 'caretaker', label: 'Caretaker', badge: 'Staff' },
  { value: 'agent', label: 'Agent (Properties & Field Operations)', badge: 'Staff' },
  { value: 'tenant', label: 'Tenant', badge: 'Client' },
  { value: 'marketer', label: 'Marketer', badge: 'Sales' },
];

export const AddUsersTab: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('developer');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleInviteUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Call admin API route to provision Auth, sync profile, and send temporary password email securely
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, role }),
      });

      const json = (await res.json()) as { success?: boolean; message?: string; error?: string };

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to onboard user.');
      }

      setMessage({ type: 'success', text: json.message || `Invitation sent to ${email}.` });
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
          Invite team members and assign operational system roles. A secure temporary password will
          be generated and emailed directly to the new user.
        </p>
      </div>

      {/* Info card */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300 space-y-1">
        <p className="font-semibold text-indigo-200 flex items-center gap-1.5">
          <ShieldCheck size={14} /> How this works
        </p>
        <ul className="list-disc list-inside space-y-0.5 text-indigo-300/80">
          <li>A Supabase auth account is created with a temporary password.</li>
          <li>The email is confirmed immediately — no verification loop.</li>
          <li>The new user receives an email with their temp password and a link to set a permanent one.</li>
          <li>On first login they are automatically redirected to their role dashboard.</li>
        </ul>
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

        <form onSubmit={handleInviteUser} className="space-y-5 text-xs">
          {/* Full Name */}
          <div>
            <label className="block font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
              <User size={13} /> Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
              <Mail size={13} /> Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
              <ShieldCheck size={13} /> System Role
            </label>
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
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl transition shadow-lg shadow-indigo-600/25 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Sending Invitation…' : 'Send Invitation & Create Profile'}</span>
              <UserPlus size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};