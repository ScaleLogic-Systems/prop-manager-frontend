// app/agent/tabs/PaymentsTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Clock, AlertCircle, DollarSign, Loader2 } from 'lucide-react';

interface TenantPaymentRecord {
  id: string;
  tenant_name: string;
  property_name: string;
  unit_number: string;
  amount: number;
  paid_amount?: number;
  due_date: string;
  status: 'paid' | 'unpaid' | 'overdue' | 'partial';
  payment_history: {
    id: string;
    amount: number;
    payment_date: string;
    method: string;
  }[];
}

export const PaymentsTab: React.FC<{ propertyId?: string }> = ({ propertyId }) => {
  const [records, setRecords] = useState<TenantPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        setLoading(true);
        const queryParam = propertyId ? `?property_id=${propertyId}` : '';
        const res = await fetch(`/agent/api/payments${queryParam}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setRecords(data.records || []);
        }
      } catch (err) {
        console.error('Failed to load payment history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [propertyId]);

  const getStatusBadge = (status: TenantPaymentRecord['status']) => {
    switch (status) {
      case 'paid':
        return <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-medium">Paid</span>;
      case 'unpaid':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-full font-medium">Pending</span>;
      case 'overdue':
        return <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-medium">Overdue</span>;
      case 'partial':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">Partial</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center text-gray-500 gap-2">
        <Loader2 className="animate-spin text-indigo-600" size={24} />
        Loading tenant payment records from database...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center gap-2">
          <CreditCard size={20} className="text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-800">Tenant Payment Records</h3>
        </div>

        {records.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            No payment history records found in the database.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                <th className="p-4">Property</th>
                <th className="p-4">Unit</th>
                <th className="p-4">Tenant Name</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Payment History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {records.map((rec) => (
                <tr key={rec.id} className="align-top">
                  <td className="p-4 font-medium text-gray-900">{rec.property_name}</td>
                  <td className="p-4 text-gray-700 font-semibold">Unit {rec.unit_number}</td>
                  <td className="p-4 text-gray-900">{rec.tenant_name}</td>
                  <td className="p-4 font-medium text-gray-900">
                    ${rec.amount.toFixed(2)}
                    {rec.paid_amount !== undefined && rec.paid_amount > 0 && (
                      <span className="block text-xs text-blue-600 font-medium">
                        (Paid: ${rec.paid_amount.toFixed(2)})
                      </span>
                    )}
                  </td>
                  <td className="p-4">{getStatusBadge(rec.status)}</td>
                  <td className="p-4">
                    {rec.payment_history && rec.payment_history.length > 0 ? (
                      <ul className="space-y-1">
                        {rec.payment_history.map((pay) => (
                          <li key={pay.id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                            <span className="font-bold text-indigo-700">${pay.amount.toFixed(2)}</span> via {pay.method} on {pay.payment_date}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No payments logged</span>
                    )}
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