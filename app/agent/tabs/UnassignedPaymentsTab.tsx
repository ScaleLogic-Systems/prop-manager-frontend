// app/agent/tabs/UnassignedPaymentsTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, DollarSign, Loader2, Link2 } from 'lucide-react';

export interface UnassignedPayment {
  id: string;
  sender_name: string;
  phone: string;
  reference: string;
  amount: number;
  date: string;
  property_id?: string;
  property_name?: string;
}

interface TenantOption {
  id: string;
  full_name: string;
  unit_number: string;
}

export const UnassignedPaymentsTab: React.FC<{ propertyId?: string }> = ({ propertyId }) => {
  const [unassignedPayments, setUnassignedPayments] = useState<UnassignedPayment[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mapping Modal State
  const [selectedPayment, setSelectedPayment] = useState<UnassignedPayment | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [mappingLoading, setMappingLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUnassignedPayments = async () => {
    try {
      setLoading(true);
      const queryParam = propertyId ? `?property_id=${propertyId}` : '';
      const res = await fetch(`/agent/api/unassigned-payments${queryParam}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUnassignedPayments(data.payments || []);
        setTenants(data.tenants || []);
      }
    } catch (err) {
      console.error('Failed to load unassigned payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnassignedPayments();
  }, [propertyId]);

  const handleMapPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !selectedTenantId) return;

    setMappingLoading(true);
    setMessage(null);

    try {
      // Updated to match your agent verify-payment API route
      const res = await fetch('/agent/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: selectedPayment.id,
          tenant_id: selectedTenantId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify and map payment.');

      setMessage({ type: 'success', text: 'Payment verified and mapped successfully!' });
      setSelectedPayment(null);
      setSelectedTenantId('');
      fetchUnassignedPayments(); // Refresh table
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error verifying payment.' });
    } finally {
      setMappingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center text-gray-500 gap-2 bg-white rounded-xl border border-gray-200">
        <Loader2 className="animate-spin text-indigo-600" size={24} />
        Fetching unassigned payments from database...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <DollarSign className="text-amber-500" size={22} />
              Unassigned Payments
            </h2>
            <p className="text-sm text-gray-500">
              Unassigned payments from tenants attached to assigned property records.
            </p>
          </div>
        </div>

        {unassignedPayments.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            <CheckCircle2 size={32} className="mx-auto text-indigo-500 mb-2" />
            No unassigned payments found for this property. All transactions are cleanly mapped.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <th className="p-4">Sender / Phone</th>
                <th className="p-4">Reference No.</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Date Received</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {unassignedPayments.map((pay) => (
                <tr key={pay.id}>
                  <td className="p-4 font-medium text-gray-900">
                    {pay.sender_name || 'Unknown Sender'} 
                    <span className="block text-xs text-gray-500">{pay.phone || 'No Phone Recorded'}</span>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-600">{pay.reference}</td>
                  <td className="p-4 font-bold text-indigo-600">
                    ${pay.amount.toFixed(2)}
                  </td>
                  <td className="p-4 text-gray-500">{pay.date}</td>
                  <td className="p-4">
                    <button
                      onClick={() => {
                        setSelectedPayment(pay);
                        setSelectedTenantId('');
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5"
                    >
                      <Link2 size={14} /> Verify &amp; Map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MAP PAYMENT MODAL */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Verify &amp; Map Payment</h3>
              <p className="text-xs text-gray-500 mt-1">
                Assign transaction <span className="font-mono text-indigo-700 font-semibold">{selectedPayment.reference}</span> (${selectedPayment.amount.toFixed(2)}) to a tenant.
              </p>
            </div>

            <form onSubmit={handleMapPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase">
                  Select Tenant & Unit
                </label>
                <select
                  required
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">-- Choose Tenant --</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.full_name} (Unit {tenant.unit_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mappingLoading || !selectedTenantId}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {mappingLoading ? 'Verifying...' : 'Confirm Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};