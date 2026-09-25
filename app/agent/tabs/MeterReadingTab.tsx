// app/agent/tabs/MeterReadingTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Gauge, CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

export const MeterReadingTab: React.FC<{ propertyId?: string }> = ({ propertyId }) => {
  const [properties, setProperties] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState(propertyId || '');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [billingMonth, setBillingMonth] = useState('');
  const [previousReading, setPreviousReading] = useState('');
  const [currentReading, setCurrentReading] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch properties and units on load
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
        console.error('Failed to load properties for meter readings:', err);
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

  const unitsConsumed = Number(currentReading) && Number(previousReading) 
    ? Math.max(0, Number(currentReading) - Number(previousReading)) 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!selectedUnit || !currentReading || !billingMonth) {
      setErrorMsg('Please select a unit, enter the current reading, and specify the billing month.');
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch('/api/caretaker/meter-readings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          property_id: selectedProperty,
          unit_id: selectedUnit,
          billing_month: billingMonth,
          previous_meter_reading: Number(previousReading) || 0,
          current_meter_reading: Number(currentReading),
          units_consumed: unitsConsumed,
        }),
      });

      if (!res.ok) throw new Error('Failed to save meter reading');

      setSuccessMsg('Water meter reading recorded successfully!');
      setCurrentReading('');
      setPreviousReading('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit meter reading.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Gauge size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Water Meter Reading Management</h2>
            <p className="text-sm text-slate-500">Record and update monthly utility water consumption for property units.</p>
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Billing Month</label>
            <input
              type="text"
              placeholder="e.g. October 2026"
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Previous Reading</label>
              <input
                type="number"
                placeholder="0"
                value={previousReading}
                onChange={(e) => setPreviousReading(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Current Reading</label>
              <input
                type="number"
                placeholder="0"
                value={currentReading}
                onChange={(e) => setCurrentReading(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Calculated Units Consumed</span>
            <span className="text-xl font-extrabold text-blue-900">{unitsConsumed} Units</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Save Meter Reading
        </button>
      </form>
    </div>
  );
};