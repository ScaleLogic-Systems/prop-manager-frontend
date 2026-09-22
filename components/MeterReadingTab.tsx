// components/MeterReadingTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Gauge, Calculator, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface UnitMeter {
  unit_id: string;
  unit_number: string;
  tenant_name: string;
  previous_reading: number;
  current_reading: number | '';
  water_rate_per_unit: number;
}

interface PropertyOption {
  id: string;
  name: string;
}

interface MeterReadingTabProps {
  role?: 'owner' | 'property_manager' | 'caretaker';
  propertyId?: string;
  profileId?: string;
}

export function MeterReadingTab({ role = 'caretaker', propertyId }: MeterReadingTabProps) {
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(propertyId || '');
  const [units, setUnits] = useState<UnitMeter[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (role === 'owner' && !propertyId) {
      const fetchOwnerProperties = async () => {
        try {
          const res = await fetch('/owner/api/properties-overview', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            const props = (data.properties || []).map((p: any) => ({
              id: p.propertyId,
              name: p.propertyName,
            }));
            setProperties(props);
            if (props.length > 0 && !selectedPropertyId) {
              setSelectedPropertyId(props[0].id);
            }
          }
        } catch (err) {
          console.error('Failed to load properties for meter readings:', err);
        }
      };
      fetchOwnerProperties();
    } else if (propertyId) {
      setSelectedPropertyId(propertyId);
    }
  }, [role, propertyId, selectedPropertyId]);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!selectedPropertyId && role === 'owner') return;
      try {
        setLoading(true);
        const queryParam = selectedPropertyId ? `?property_id=${selectedPropertyId}` : '';
        const res = await fetch(`/api/meters/units${queryParam}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const loadedUnits = (data.units || []).map((u: any) => ({
            ...u,
            current_reading: u.current_reading ?? '',
            water_rate_per_unit: u.water_rate_per_unit || 150,
          }));
          setUnits(loadedUnits);
        }
      } catch (err) {
        console.error('Failed to fetch unit meter records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [selectedPropertyId, role]);

  const handleReadingChange = (unitId: string, val: string) => {
    setUnits((prev) =>
      prev.map((u) => (u.unit_id === unitId ? { ...u, current_reading: val === '' ? '' : Number(val) } : u))
    );
  };

  const handleRateChange = (unitId: string, val: string) => {
    setUnits((prev) =>
      prev.map((u) => (u.unit_id === unitId ? { ...u, water_rate_per_unit: Number(val) } : u))
    );
  };

  const handleSubmitReadings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const readingsPayload = units
        .filter((u) => u.current_reading !== '')
        .map((u) => ({
          unit_id: u.unit_id,
          previous_reading: u.previous_reading,
          current_reading: Number(u.current_reading),
          water_rate_per_unit: u.water_rate_per_unit,
        }));

      if (readingsPayload.length === 0) {
        throw new Error('Please enter at least one current meter reading.');
      }

      const res = await fetch('/api/meters/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: selectedPropertyId,
          readings: readingsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit meter readings.');

      setMessage({ type: 'success', text: 'Meter readings successfully recorded and water bills updated!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'An error occurred while saving readings.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Gauge size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Water Meter Readings</h2>
            <p className="text-sm text-gray-500">
              Record current meter readings to automatically calculate consumption and generate water utility bills.
            </p>
          </div>
        </div>

        {role === 'owner' && properties.length > 0 && (
          <div className="w-full md:w-72">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Select Property</label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 flex items-center justify-center text-gray-500 gap-2">
          <Loader2 className="animate-spin text-emerald-600" size={20} />
          <span>Loading meter units...</span>
        </div>
      ) : units.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 text-center text-gray-500 text-sm">
          No occupied units found with water meters for this property.
        </div>
      ) : (
        <form onSubmit={handleSubmitReadings} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-4">Unit</th>
                  <th className="p-4">Tenant Name</th>
                  <th className="p-4">Previous Reading</th>
                  <th className="p-4">Current Reading</th>
                  <th className="p-4">Rate / Unit (KES)</th>
                  <th className="p-4 text-right">Units Consumed & Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {units.map((unit) => {
                  const current = unit.current_reading === '' ? 0 : Number(unit.current_reading);
                  const consumed = Math.max(0, current - unit.previous_reading);
                  const total = consumed * unit.water_rate_per_unit;

                  return (
                    <tr key={unit.unit_id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 font-bold text-gray-900">Unit {unit.unit_number}</td>
                      <td className="p-4 text-gray-700">{unit.tenant_name || 'Unassigned'}</td>
                      <td className="p-4 text-gray-600 font-semibold">{unit.previous_reading}</td>
                      <td className="p-4">
                        <input
                          type="number"
                          min={unit.previous_reading}
                          placeholder="Enter current"
                          value={unit.current_reading}
                          onChange={(e) => handleReadingChange(unit.unit_id, e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                        />
                      </td>
                      <td className="p-4">
                        <input
                          type="number"
                          min="0"
                          value={unit.water_rate_per_unit}
                          onChange={(e) => handleRateChange(unit.unit_id, e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                        />
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-bold text-emerald-700">
                          KES {total.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          ({consumed} units consumed)
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={18} />}
              <span>Save Readings & Generate Water Bills</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}