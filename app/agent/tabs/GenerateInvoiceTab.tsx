// app/agent/tabs/GenerateInvoiceTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

export const GenerateInvoiceTab: React.FC<{ propertyId?: string }> = ({ propertyId }) => {
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState(propertyId || '');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchScope = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

        const res = await fetch('/agent/api/profile', { headers });
        if (res.ok) {
          const data = await res.json();
          setProperties(data.properties || []);
          if (!selectedProperty && data.properties?.length > 0) {
            setSelectedProperty(data.properties[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch properties:', err);
      }
    };
    fetchScope();
  }, []);

  useEffect(() => {
    if (!selectedProperty) return;
    const fetchUnits = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('units').select('id, unit_number').eq('property_id', selectedProperty);
        setUnits(data || []);
      } catch (err) {
        console.error('Failed to fetch units:', err);
      }
    };
    fetchUnits();
  }, [selectedProperty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedUnit || !title || !amount || !dueDate) {
      setErrorMsg('Please fill in all required invoice details.');
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/api/caretaker/invoices', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          property_id: selectedProperty,
          unit_id: selectedUnit,
          title: title.trim(),
          amount: Number(amount),
          due_date: dueDate,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate invoice');

      setSuccessMsg('Invoice raised and dispatched successfully!');
      setTitle('');
      setAmount('');
      setDueDate('');
      setSelectedUnit('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to raise invoice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Generate Monthly Invoice</h2>
            <p className="text-sm text-slate-500">Raise and send rent or utility bills directly to tenants.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-sm">
            <CheckCircle2 className="shrink-0 text-emerald-600 mt-0.5" size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
            <AlertCircle className="shrink-0 text-rose-600 mt-0.5" size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Property</label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Unit</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Choose unit...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>Unit {u.unit_number}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Invoice Title / Description</label>
            <input
              type="text"
              placeholder="e.g. October Rent & Water Bill"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Total Amount (KES)</label>
            <input
              type="number"
              placeholder="15000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          Generate &amp; Send Invoice
        </button>
      </form>
    </div>
  );
};