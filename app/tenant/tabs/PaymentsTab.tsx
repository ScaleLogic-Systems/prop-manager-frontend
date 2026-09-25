// app/tenant/tabs/PaymentsTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, CreditCard, User, Home, UserCheck, Phone } from 'lucide-react';
import { PaymentRecord } from '../types';

interface TenantProfile {
  name: string;
  full_name?: string;
  property_name: string;
  unit_number: string;
  caretaker_name: string;
  caretaker_phone?: string;
}

export const PaymentsTab: React.FC = () => {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fallback fetch paths for maximum compatibility across profile routes
        let profileRes = await fetch('/api/tenant/profile');
        if (!profileRes.ok) {
          profileRes = await fetch('/tenant/api/profile');
        }

        const paymentsRes = await fetch('/api/tenant/payments');

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const p = profileData.profile || profileData || {};
          setProfile({
            name: p.full_name || p.name || 'Valued Tenant',
            property_name: p.property_name || p.property?.name || '',
            unit_number: p.unit_number || p.unit?.unit_number || '',
            caretaker_name: p.caretaker_name || p.caretaker?.full_name || p.caretaker?.name || '',
            caretaker_phone: p.caretaker_phone || p.caretaker?.phone || '',
          });
        }

        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPaymentHistory(paymentsData.payments || []);
        }
      } catch (err) {
        console.error('Failed to fetch payment tab data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">
            <CheckCircle2 size={12} /> Confirmed
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold">
            <Clock size={12} /> Waiting Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded-full font-bold">
            <XCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-full font-bold">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-slate-500 font-medium animate-pulse">
        Loading payment records...
      </div>
    );
  }

  const displayName = profile?.name || profile?.full_name || 'Valued Tenant';

  return (
    <div className="space-y-6">
      {/* 1. HERO SECTION */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Payment Ledger</span>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 mt-1">
            <User className="text-blue-600 p-1.5 bg-blue-50 rounded-xl" size={32} />
            {displayName} — Transaction History
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review month-after-month records of all submitted and verified transactions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <Home size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Property &amp; Unit</div>
              <div className="font-bold text-slate-900 mt-0.5">
                {profile?.property_name && profile?.unit_number
                  ? `${profile.property_name} — Unit ${profile.unit_number}`
                  : profile?.property_name || (profile?.unit_number ? `Unit ${profile.unit_number}` : 'Not assigned')}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                <UserCheck size={20} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Assigned Caretaker</div>
                <div className="font-bold text-slate-900 mt-0.5">{profile?.caretaker_name || 'Not assigned'}</div>
              </div>
            </div>
            {profile?.caretaker_phone && (
              <a
                href={`tel:${profile.caretaker_phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Phone size={14} /> Call
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 2. PAYMENT LEDGER TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recorded Transactions</h3>
            <p className="text-sm text-slate-500">Chronological history of all payments made over time.</p>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
            {paymentHistory.length} Records
          </span>
        </div>

        {paymentHistory.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <CreditCard size={40} className="text-slate-300" />
            <p className="font-semibold text-slate-700">No payment records found</p>
            <p className="text-xs text-slate-400">You haven&apos;t completed any transaction payments yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Reference</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {paymentHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-mono text-xs font-semibold text-slate-700">{rec.reference}</td>
                    <td className="p-4 font-bold text-slate-900">{rec.description}</td>
                    <td className="p-4 text-slate-600">{rec.method}</td>
                    <td className="p-4 text-slate-500">{rec.date}</td>
                    <td className="p-4 font-bold text-slate-900">KES {(rec.amount || 0).toLocaleString()}</td>
                    <td className="p-4">{getStatusBadge(rec.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};