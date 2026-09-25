// app/agent/tabs/PaymentsTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { PaymentRecord } from '../types';

export const PaymentsTab: React.FC<{ propertyId?: string }> = ({ propertyId }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const queryParam = propertyId ? `?property_id=${propertyId}` : '';
        const res = await fetch(`/agent/api/payments${queryParam}`, { headers, cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments || []);
        }
      } catch (err) {
        console.error('Failed to load payments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [propertyId]);

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
            <Clock size={12} /> Under Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs px-2.5 py-1 rounded-full font-bold">
            <XCircle size={12} /> Rejected
          </span>
        );
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs rounded-full font-bold">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center text-slate-500 gap-2">
        <Loader2 className="animate-spin text-blue-600" size={20} />
        <span>Loading payment ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="text-blue-600" size={22} />
            Payment History Ledger
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">Chronological record of all tenant transactions and submissions.</p>
        </div>
        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
          {payments.length} Total
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No payment records found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Reference</th>
                <th className="p-4">Tenant / Unit</th>
                <th className="p-4">Property</th>
                <th className="p-4">Method &amp; Date</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-4 font-mono text-xs font-semibold text-slate-700">{p.reference}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{p.tenant_name}</div>
                    <div className="text-xs text-slate-500">Unit {p.unit_number}</div>
                  </td>
                  <td className="p-4 text-slate-700 font-medium">{p.property_name}</td>
                  <td className="p-4 text-slate-500 text-xs">
                    <div>{p.method}</div>
                    <div>{p.date}</div>
                  </td>
                  <td className="p-4 font-bold text-slate-900">KES {(p.amount || 0).toLocaleString()}</td>
                  <td className="p-4">{getStatusBadge(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};