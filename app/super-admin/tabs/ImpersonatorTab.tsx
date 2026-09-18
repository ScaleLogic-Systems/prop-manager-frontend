// app/super-admin/tabs/ImpersonatorTab.tsx
'use client';

import React, { useState } from 'react';
import { ShieldAlert, LogIn, Search } from 'lucide-react';

export const ImpersonatorTab: React.FC = () => {
  const [targetUser, setTargetUser] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartImpersonation = async () => {
    if (!targetUser) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    alert(`Debug session established for ${targetUser}. Opening tenant interface in read-only mode...`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-2xl shadow-xl">
      <div className="border-b border-slate-800 pb-4">
        <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 text-xs px-3 py-1 rounded-full font-bold mb-3 border border-amber-500/20">
          <ShieldAlert size={14} /> Superadmin Diagnostic Access
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">User Session Impersonation</h2>
        <p className="text-xs text-slate-400 mt-1">
          Spawn a 15-minute read-only token to view UI layout and state directly as any Landlord, Accountant, or Tenant.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
            User Email or Phone Number
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="e.g. accounts@kiprono.co.ke or +254712345678"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-none transition"
            />
          </div>
        </div>

        <button
          onClick={handleStartImpersonation}
          disabled={loading || !targetUser}
          className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3.5 rounded-xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
        >
          <LogIn size={16} />
          {loading ? 'Generating Session...' : 'Impersonate Session (Read-Only)'}
        </button>
      </div>
    </div>
  );
};