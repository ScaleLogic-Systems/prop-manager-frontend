// app/agent/tabs/UnassignedPaymentsTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

export const UnassignedPaymentsTab: React.FC<{ propertyId?: string }> = ({ propertyId }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const queryParam = propertyId ? `?property_id=${propertyId}&status=under_review` : '?status=under_review';
      const res = await fetch(`/agent/api/payments${queryParam}`, { headers, cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error('Failed to load pending payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
  }, [propertyId]);

  const handleVerify = async (paymentId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(paymentId);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/agent/api/verify-payment', {
        method: 'POST',
        headers,
        body: JSON.stringify({ payment_id: paymentId, action }),
      });

      if (!res.ok) throw new Error('Failed to process payment verification');

      // Refresh list
      fetchPendingPayments();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center text-slate-500 gap-2">
        <Loader2 className="animate-spin text-blue-600" size={20} />
        <span>Loading unassigned payments queue...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-amber-600" size={22} />
            Unassigned / Pending Review Payments
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">Verify manual M-Pesa transaction codes submitted by tenants.</p>
        </div>
        <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">
          {payments.length} Pending
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No pending payments awaiting review.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900 text-base">{p.reference}</span>
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                      Awaiting Audit
                    </span>
                  </div>
                  <div className="text-sm text-slate-700">
                    Tenant: <strong className="text-slate-900">{p.tenant_name}</strong> (Unit {p.unit_number} — {p.property_name})
                  </div>
                  <div className="text-xs text-slate-500">{p.description} &bull; {p.date}</div>
                </div>

                <div className="flex items-center gap-4 justify-between md:justify-end">
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-medium">Submitted Amount</div>
                    <div className="text-xl font-bold text-slate-900">KES {(p.amount || 0).toLocaleString()}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVerify(p.id, 'approve')}
                      disabled={processingId === p.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleVerify(p.id, 'reject')}
                      disabled={processingId === p.id}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};