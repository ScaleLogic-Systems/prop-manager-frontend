'use client';

import React, { useState, useEffect } from 'react';
import { Gauge, Send, FileText, CheckCircle2 } from 'lucide-react';

interface DynamicUnit {
  id: string;
  unit_number: string;
  tenant_name: string;
  previous_reading: number;
  water_rate: number;
  rent_amount: number;
  garbage_fee: number;
  parking_fee: number;
  water_fee: number;
}

interface GeneratedInvoice {
  id: string;
  unit_number: string;
  tenant_name: string;
  previous_reading: number;
  current_reading: number;
  units_consumed: number;
  total_amount: number;
}

export const MeterReadingTab: React.FC<{ propertyId?: string; profileId?: string }> = ({
  propertyId,
  profileId,
}) => {
  const [units, setUnits] = useState<DynamicUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [currentReading, setCurrentReading] = useState<number | ''>('');
  const [generatedInvoices, setGeneratedInvoices] = useState<GeneratedInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUnits, setFetchingUnits] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Units & Previous Readings from DB
  useEffect(() => {
    const fetchUnitReadings = async () => {
      try {
        setFetchingUnits(true);
        const queryParam = propertyId ? `?property_id=${propertyId}` : '';
        const res = await fetch(`/caretaker/api/unit-meter-readings${queryParam}`);
        if (res.ok) {
          const data = await res.json();
          setUnits(data.units || []);
          if (data.units?.length > 0) {
            setSelectedUnitId(data.units[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load meter data:', err);
      } finally {
        setFetchingUnits(false);
      }
    };

    fetchUnitReadings();
  }, [propertyId]);

  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedUnit || currentReading === '') return;

    if (Number(currentReading) < selectedUnit.previous_reading) {
      setErrorMsg('Current reading cannot be lower than the previous recorded reading.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          creator_role: 'caretaker',
          unit_id: selectedUnit.id,
          unit_number: selectedUnit.unit_number,
          tenant_name: selectedUnit.tenant_name,
          invoice_type: 'water',
          previous_reading: selectedUnit.previous_reading,
          current_reading: Number(currentReading),
          rate_per_unit: selectedUnit.water_rate,
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Failed to generate water invoice');

      setGeneratedInvoices([
        {
          ...resData.invoice,
          total_amount: resData.invoice?.total_amount ?? resData.invoice?.amount,
          unit_number: selectedUnit.unit_number,
          tenant_name: selectedUnit.tenant_name,
          units_consumed: Number(currentReading) - selectedUnit.previous_reading,
          previous_reading: selectedUnit.previous_reading,
          current_reading: Number(currentReading),
        },
        ...generatedInvoices,
      ]);
      setCurrentReading('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Gauge size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Record Water Meter Reading</h2>
            <p className="text-sm text-gray-500">
              Input current readings to generate water bills automatically using unit-specific rate configurations.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm mb-6">
            {errorMsg}
          </div>
        )}

        {fetchingUnits ? (
          <div className="p-6 text-gray-500 text-sm">Loading units and previous readings from database...</div>
        ) : units.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No occupied unit records found in the database for this property.
          </div>
        ) : (
          <form onSubmit={handleGenerateInvoice} className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Select Unit / Tenant
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    Unit {u.unit_number} - {u.tenant_name || 'No Tenant Name'}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Previous Meter Reading</label>
                <input
                  type="number"
                  disabled
                  value={selectedUnit?.previous_reading || 0}
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg p-3 text-sm text-gray-600 font-semibold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Current Meter Reading</label>
                <input
                  type="number"
                  required
                  value={currentReading}
                  onChange={(e) => setCurrentReading(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 1460"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Configured water rate:</span>
                <span className="font-bold text-gray-800">KES {selectedUnit?.water_rate || 0} / unit</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Configured rent and utilities:</span>
                <span className="font-semibold text-gray-700">
                  KES {(
                    (selectedUnit?.rent_amount || 0) +
                    (selectedUnit?.garbage_fee || 0) +
                    (selectedUnit?.parking_fee || 0) +
                    (selectedUnit?.water_fee || 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={18} />
              {loading ? 'Processing & Sending...' : 'Generate Invoice & Send to Tenant'}
            </button>
          </form>
        )}
      </div>

      {/* RECENTLY GENERATED INVOICES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center gap-2">
          <FileText size={20} className="text-emerald-600" />
          <h3 className="text-lg font-bold text-gray-800">Generated Water Invoices</h3>
        </div>

        {generatedInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No water invoices generated in this session yet.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <th className="p-4">Invoice ID</th>
                <th className="p-4">Unit & Tenant</th>
                <th className="p-4">Consumption</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {generatedInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="p-4 font-mono text-xs font-semibold text-gray-700">{inv.id}</td>
                  <td className="p-4">
                    <div className="font-medium text-gray-900">{inv.unit_number}</div>
                    <div className="text-xs text-gray-500">{inv.tenant_name}</div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {inv.units_consumed} units ({inv.previous_reading} &rarr; {inv.current_reading})
                  </td>
                  <td className="p-4 font-bold text-emerald-600">${inv.total_amount?.toFixed(2)}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">
                      <CheckCircle2 size={12} /> Sent to Tenant
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};