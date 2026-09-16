'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SaaSPayment, SuperAdminTab } from '../types';

interface Props {
  setActiveTab: (tab: SuperAdminTab) => void;
}

export const SaaSUnassignedPaymentsTab: React.FC<Props> = ({ setActiveTab }) => {
  const [payments, setPayments] = useState<SaaSPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSaaSPayments();
  }, []);

  async function fetchSaaSPayments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('saas_unassigned_payments')
      .select('*')
      .eq('status', 'UNASSIGNED')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPayments(data);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <button
              onClick={() => setActiveTab('unassigned-payments-hub')}
              className="hover:text-slate-200"
            >
              Unassigned Payments
            </button>
            <span>/</span>
            <span className="text-emerald-400">SaaS Subscribers</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            SaaS Subscriber Unassigned Payments
          </h1>
        </div>
        <button
          onClick={fetchSaaSPayments}
          className="text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800 px-3 py-2 rounded-xl transition"
        >
          Refresh Data
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Loading subscriber records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Sender Name</th>
                  <th className="py-3 px-4">Sender Phone</th>
                  <th className="py-3 px-4">Tx Code</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                      No unassigned SaaS subscriber payments found.
                    </td>
                  </tr>
                ) : (
                  payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {pay.sender_name || 'Unknown Subscriber'}
                      </td>
                      <td className="py-3.5 px-4 font-mono">{pay.sender_phone || 'N/A'}</td>
                      <td className="py-3.5 px-4 font-mono text-amber-400">
                        {pay.transaction_code}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{pay.payment_method}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        KES {pay.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {pay.created_at ? new Date(pay.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg transition">
                          Match Account
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};