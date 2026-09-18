'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { TenantPayment, SuperAdminTab } from '../types';

interface RawPaymentRecord {
  id: string;
  transaction_code: string;
  amount: number;
  created_at: string;
  sender_phone?: string;
  status: string;
  tenant?: { full_name?: string } | null;
  unit?: { unit_number?: string; property?: { name?: string } | null } | null;
}

interface Props {
  setActiveTab: (tab: SuperAdminTab) => void;
}

export const TenantUnassignedPaymentsTab: React.FC<Props> = ({ setActiveTab }) => {
  const [payments, setPayments] = useState<TenantPayment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTenantPayments();
  }, []);

  async function fetchTenantPayments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('unassigned_payments')
      .select(`
        id,
        transaction_code,
        amount,
        created_at,
        sender_phone,
        status,
        tenant:profiles(full_name),
        unit:units(unit_number, property:properties(name))
      `)
      .eq('status', 'UNASSIGNED')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formatted: TenantPayment[] = (data as unknown as RawPaymentRecord[]).map((item) => ({
        id: item.id,
        transaction_code: item.transaction_code,
        amount: item.amount,
        created_at: item.created_at,
        payment_date: item.created_at,
        sender_phone: item.sender_phone,
        tenant_name: item.tenant?.full_name || 'Unidentified Tenant',
        unit_name: item.unit?.unit_number ? `Unit ${item.unit.unit_number}` : 'N/A',
        unit_number: item.unit?.unit_number || 'N/A',
        property_name: item.unit?.property?.name || 'Unlinked Property',
        status: item.status,
      }));
      setPayments(formatted);
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
            <span className="text-indigo-400">Tenant Payments</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Tenant Unassigned Payments
          </h1>
        </div>
        <button
          onClick={fetchTenantPayments}
          className="text-xs bg-slate-900 border border-slate-800 hover:bg-slate-800 px-3 py-2 rounded-xl transition"
        >
          Refresh Data
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading tenant records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Unit Name</th>
                  <th className="py-3 px-4">Property Name</th>
                  <th className="py-3 px-4">Tx Code</th>
                  <th className="py-3 px-4">Sender Phone</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                      No unassigned tenant payments found.
                    </td>
                  </tr>
                ) : (
                  payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {pay.tenant_name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-indigo-300">
                        {pay.unit_name || pay.unit_number || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">{pay.property_name}</td>
                      <td className="py-3.5 px-4 font-mono text-amber-400">
                        {pay.transaction_code}
                      </td>
                      <td className="py-3.5 px-4 font-mono">{pay.sender_phone || 'N/A'}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        KES {pay.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {pay.payment_date ? new Date(pay.payment_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition">
                          Align Payment
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