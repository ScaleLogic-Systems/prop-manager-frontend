// components/settings/AccountSettingsTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, AlertCircle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

interface AccountSettingsTabProps {
  roleTitle?: string;
}

export function AccountSettingsTab({ roleTitle = 'User' }: AccountSettingsTabProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserData() {
      try {
        setFetching(true);
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return;

        if (isMounted) {
          setEmail(user.email || '');
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .maybeSingle();

        if (isMounted && profile) {
          setFullName(profile.full_name || user.user_metadata?.full_name || '');
          setPhone(profile.phone || '');
        }
      } catch (err) {
        console.error('Failed to load user settings:', err);
      } finally {
        if (isMounted) setFetching(false);
      }
    }

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Triggered when user clicks "Save Changes" on the main form
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setShowConfirmModal(true); // Open review confirmation modal
  };

  // Triggered when user clicks "Confirm Changes" inside the modal
  const handleConfirmedSave = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          ...(password ? { password } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update account settings.');
      }

      setMessage({ 
        type: 'success', 
        text: 'Account details updated successfully! Note: Email changes may require verification.' 
      });
      setPassword(''); // Clear sensitive password field
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An unexpected error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
        <Loader2 className="animate-spin" size={20} />
        <span>Loading account settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Account Settings</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage your personal credentials and security for your <span className="font-semibold text-blue-600">{roleTitle}</span> role.
            </p>
          </div>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handlePreSubmit} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <User size={14} className="text-slate-400" /> Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Mail size={14} className="text-slate-400" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="name@example.com"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Phone size={14} className="text-slate-400" /> Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="+254 700 000000"
            />
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Lock size={14} className="text-slate-400" /> New Password (Optional)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Leave blank to keep current password"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>

      {/* CONFIRMATION POPUP MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Confirm Your Details</h3>
                <p className="text-xs text-slate-500">Please review your changes before submitting.</p>
              </div>
            </div>

            {/* Review Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs font-semibold uppercase">Full Name:</span>
                <span className="font-medium text-slate-900 text-right">{fullName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs font-semibold uppercase">Email:</span>
                <span className="font-medium text-slate-900 text-right">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs font-semibold uppercase">Phone:</span>
                <span className="font-medium text-slate-900 text-right">{phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-xs font-semibold uppercase">Password Update:</span>
                <span className="font-medium text-slate-900 text-right">
                  {password ? '******** (Will be changed)' : 'Unchanged'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center">
              Are you sure these details are correct? Click confirm to proceed or back to make edits.
            </p>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider transition-all"
              >
                Back / Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmedSave}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs uppercase tracking-wider shadow-md shadow-blue-600/20 transition-all"
              >
                Confirm Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}