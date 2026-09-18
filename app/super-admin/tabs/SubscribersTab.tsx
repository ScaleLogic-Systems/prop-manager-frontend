'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Subscriber {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  created_at: string;
  property_count: number;
  payment_status: 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE' | 'NO_INVOICE';
  total_paid: number;
  total_due: number;
}

export interface Invoice {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  due_date?: string;
  description?: string;
}

export const SubscribersTab: React.FC = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Drawer state for viewing payment history
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [history, setHistory] = useState<Invoice[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  async function fetchSubscribers() {
    setLoading(true);
    try {
      // 1. Fetch users with subscriber roles (or all managers/owners)
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, created_at')
        .in('role', ['property_manager', 'property_owner']);

      if (usersError) throw usersError;

      if (!users || users.length === 0) {
        setSubscribers([]);
        setLoading(false);
        return;
      }

      const userIds = users.map((u) => u.id);

      // 2. Fetch related property counts
      const { data: properties } = await supabase
        .from('properties')
        .select('id, user_id')
        .in('user_id', userIds);

      // 3. Fetch invoices associated with these subscribers
      const { data: invoices } = await supabase
        .from('saas_invoices')
        .select('id, user_id, amount, status, created_at')
        .in('user_id', userIds);

      // Map statistics per subscriber
      const formatted: Subscriber[] = users.map((user) => {
        const userProps = properties?.filter((p) => p.user_id === user.id) || [];
        const userInvoices = invoices?.filter((i) => i.user_id === user.id) || [];

        let payment_status: Subscriber['payment_status'] = 'NO_INVOICE';
        let total_paid = 0;
        let total_due = 0;

        if (userInvoices.length > 0) {
          const hasOverdue = userInvoices.some((i) => i.status?.toUpperCase() === 'OVERDUE');
          const hasUnpaid = userInvoices.some((i) => i.status?.toUpperCase() === 'UNPAID');
          const hasPartial = userInvoices.some(
            (i) => i.status?.toUpperCase() === 'PARTIAL' || i.status?.toUpperCase() === 'PARTIALLY_PAID'
          );

          if (hasOverdue) payment_status = 'OVERDUE';
          else if (hasPartial) payment_status = 'PARTIAL';
          else if (hasUnpaid) payment_status = 'UNPAID';
          else payment_status = 'PAID';

          userInvoices.forEach((inv) => {
            if (inv.status?.toUpperCase() === 'PAID') total_paid += inv.amount || 0;
            else total_due += inv.amount || 0;
          });
        }

        return {
          ...user,
          property_count: userProps.length,
          payment_status,
          total_paid,
          total_due,
        };
      });

      setSubscribers(formatted);
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscribers();
  }, []);

  async function openPaymentHistory(subscriber: Subscriber) {
    setSelectedSubscriber(subscriber);
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('saas_invoices')
        .select('*')
        .eq('user_id', subscriber.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching payment history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  const filteredSubscribers = subscribers.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Subscriber['payment_status']) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PAID</span>;
      case 'PARTIAL':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">PARTIAL</span>;
      case 'UNPAID':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">UNPAID</span>;
      case 'OVERDUE':
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">OVERDUE</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-800 text-slate-400 border border-slate-700">NO INVOICES</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SUBSCRIBERS</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage subscribed property managers, linked properties, and individual payment records.
          </p>
        </div>
        <input
          type="text"
          placeholder="Search subscriber name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-full md:w-72"
        />
      </div>

      {/* SUBSCRIBERS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Subscriber</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Linked Properties</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4 text-center">Payment History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Loading subscriber records...
                  </td>
                </tr>
              ) : filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No subscribers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{sub.full_name || 'Unnamed User'}</div>
                      <div className="text-[11px] text-slate-500">{sub.email}</div>
                    </td>
                    <td className="px-6 py-4 capitalize text-slate-400">
                      {sub.role.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                        🏢 {sub.property_count} {sub.property_count === 1 ? 'Property' : 'Properties'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(sub.payment_status)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openPaymentHistory(sub)}
                        className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYMENT HISTORY MODAL / DRAWER */}
      {selectedSubscriber && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Payment History</h3>
                <p className="text-xs text-slate-400">{selectedSubscriber.full_name}</p>
              </div>
              <button
                onClick={() => setSelectedSubscriber(null)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            {loadingHistory ? (
              <p className="text-xs text-slate-500 text-center py-8">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                No payment or invoice history available for this subscriber.
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">
                        KES {inv.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                      {inv.description && (
                        <p className="text-[11px] text-slate-400 mt-1">{inv.description}</p>
                      )}
                    </div>
                    <div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          inv.status?.toUpperCase() === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};