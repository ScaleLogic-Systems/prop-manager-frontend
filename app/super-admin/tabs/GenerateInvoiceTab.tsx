'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface SubscriberInvoiceData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  propertyNames: string[];
  occupiedUnits: number;
}

export const GenerateInvoiceTab: React.FC = () => {
  const [subscribers, setSubscribers] = useState<SubscriberInvoiceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<string>('');
  
  // Custom or auto-filled billing state
  const [amount, setAmount] = useState<number>(500);
  const [dueDate, setDueDate] = useState<string>(() => {
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 7);
    return defaultDue.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState<string>('');
  
  const [sending, setSending] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto calculate pricing based on occupied units range
  const calculateDefaultTierAmount = (units: number): number => {
    if (units <= 20) return 500;
    if (units <= 50) return 1000;
    if (units <= 100) return 1500;
    // Scaled tier above 100 units
    return Math.ceil(units / 50) * 1000;
  };

  const handleSubscriberSelect = (userId: string, currentSubscribers = subscribers) => {
    setSelectedSubscriberId(userId);
    const sub = currentSubscribers.find((s) => s.id === userId);
    if (sub) {
      const calculatedAmount = calculateDefaultTierAmount(sub.occupiedUnits);
      setAmount(calculatedAmount);
      const propText = sub.propertyNames.length > 0 ? sub.propertyNames.join(', ') : 'Registered Properties';
      setDescription(`SaaS Subscription Fee - ${sub.occupiedUnits} Occupied Units (${propText})`);
    }
  };

  useEffect(() => {
    let ignore = false;

    async function fetchSubscribersWithOccupiedUnits() {
      setLoading(true);
      try {
        // Fetch users with subscriber roles
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .in('role', ['property_manager', 'property_owner']);

        if (usersError) throw usersError;

        if (!users || users.length === 0) {
          if (!ignore) {
            setSubscribers([]);
            setLoading(false);
          }
          return;
        }

        const userIds = users.map((u) => u.id);

        // Fetch properties for these subscribers
        const { data: properties } = await supabase
          .from('properties')
          .select('id, name, user_id')
          .in('user_id', userIds);

        const propertyIds = properties?.map((p) => p.id) || [];

        // Fetch active tenancies / occupied units for these properties
        const { data: occupiedUnitsData } = await supabase
          .from('units')
          .select('id, property_id, status')
          .in('property_id', propertyIds)
          .eq('status', 'OCCUPIED');

        const formatted: SubscriberInvoiceData[] = users.map((user) => {
          const userProps = properties?.filter((p) => p.user_id === user.id) || [];
          const userPropIds = userProps.map((p) => p.id);

          const occupiedCount =
            occupiedUnitsData?.filter((u) => userPropIds.includes(u.property_id)).length || 0;

          return {
            id: user.id,
            full_name: user.full_name || 'Unnamed Subscriber',
            email: user.email,
            phone: user.phone || '',
            propertyNames: userProps.map((p) => p.name),
            occupiedUnits: occupiedCount,
          };
        });

        if (!ignore) {
          setSubscribers(formatted);
          if (formatted.length > 0) {
            handleSubscriberSelect(formatted[0].id, formatted);
          }
        }
      } catch (err) {
        console.error('Error fetching subscriber occupied units:', err);
        if (!ignore) setLoading(false);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchSubscribersWithOccupiedUnits();
    return () => { ignore = true; };
  }, []);

  const selectedSubscriber = subscribers.find((s) => s.id === selectedSubscriberId);

  async function handleGenerateAndSendInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSubscriber) return;

    setSending(true);
    setMessage(null);

    try {
      // 1. Record invoice in Database
      const { data: invoice, error: dbError } = await supabase
        .from('saas_invoices')
        .insert({
          user_id: selectedSubscriber.id,
          amount,
          status: 'UNPAID',
          due_date: dueDate,
          description,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 2. Trigger multi-channel notifications (SMS, WhatsApp, Email) via API route
      const res = await fetch('/api/admin/send-invoice-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          subscriberId: selectedSubscriber.id,
          email: selectedSubscriber.email,
          phone: selectedSubscriber.phone,
          fullName: selectedSubscriber.full_name,
          amount,
          dueDate,
          occupiedUnits: selectedSubscriber.occupiedUnits,
          propertyNames: selectedSubscriber.propertyNames,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Invoice generated, but notification dispatch failed.');

      setMessage({
        type: 'success',
        text: `Invoice of KES ${amount.toLocaleString()} generated and sent via SMS, WhatsApp, and Email to ${selectedSubscriber.full_name}!`,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate invoice.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">GENERATE INVOICE</h1>
        <p className="text-xs text-slate-400 mt-1">
          Calculate occupancy-based subscription charges and dispatch multi-channel invoices (SMS, WhatsApp & Email).
        </p>
      </div>

      <div className="max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        {message && (
          <div
            className={`p-4 rounded-xl text-xs mb-6 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <p className="text-xs text-slate-500 text-center py-8">Loading subscriber occupancy details...</p>
        ) : (
          <form onSubmit={handleGenerateAndSendInvoice} className="space-y-5">
            {/* Subscriber Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Subscriber
              </label>
              <select
                value={selectedSubscriberId}
                onChange={(e) => handleSubscriberSelect(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {subscribers.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.full_name} ({sub.email}) — {sub.occupiedUnits} Occupied Units
                  </option>
                ))}
              </select>
            </div>

            {/* Occupied Property Breakdown Summary */}
            {selectedSubscriber && (
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Linked Properties</span>
                  <span className="text-white font-medium">
                    {selectedSubscriber.propertyNames.length > 0
                      ? selectedSubscriber.propertyNames.join(', ')
                      : 'No properties registered yet'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Occupied Units Count</span>
                  <span className="text-indigo-400 font-bold text-sm">
                    🏢 {selectedSubscriber.occupiedUnits} Occupied Units
                  </span>
                </div>
              </div>
            )}

            {/* Pricing Range Selector & Charge Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Billing Tier Amount (KES)
                </label>
                <select
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={500}>1 – 20 Occupied Units → KES 500</option>
                  <option value={1000}>21 – 50 Occupied Units → KES 1,000</option>
                  <option value={1500}>51 – 100 Occupied Units → KES 1,500</option>
                  <option value={2000}>101 – 150 Occupied Units → KES 2,000</option>
                  <option value={3000}>151+ Occupied Units → KES 3,000</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Invoice Description / Note
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Subscription Fee for March 2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={sending || !selectedSubscriber}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-3 rounded-xl transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{sending ? 'Dispatching Multi-Channel Invoice...' : 'Generate & Send Invoice (SMS, WhatsApp, Email)'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};