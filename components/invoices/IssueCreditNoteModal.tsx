// components/invoices/IssueCreditNoteModal.tsx

'use client';

import React, { useState } from 'react';

interface IssueCreditNoteModalProps {
  invoiceId: string;
  invoiceAmount: number;
  cuInvoiceNumber?: string;
  profileId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const IssueCreditNoteModal: React.FC<IssueCreditNoteModalProps> = ({
  invoiceId,
  invoiceAmount,
  cuInvoiceNumber,
  profileId,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState<'OVERCHARGE' | 'CANCELLATION' | 'LEASE_TERMINATION' | 'SERVICE_DISPUTE'>('CANCELLATION');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/etims/credit-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoiceId,
          profile_id: profileId,
          reason,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to issue credit note.');
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Issue eTIMS Credit Note</h2>
        <p className="text-xs text-slate-500 mt-1">
          Reversing invoice <span className="font-mono text-slate-700 font-semibold">{invoiceId}</span> (CUIN: {cuInvoiceNumber || 'N/A'})
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Adjustment</label>
            <select
              value={reason}
              onChange={(e: any) => setReason(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="CANCELLATION">Full Invoice Cancellation</option>
              <option value="OVERCHARGE">Billing Overcharge Adjustment</option>
              <option value="LEASE_TERMINATION">Early Lease Termination</option>
              <option value="SERVICE_DISPUTE">Service Quality Dispute</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reversal Amount (KES)</label>
            <input
              type="text"
              disabled
              value={`KES ${invoiceAmount.toLocaleString()}`}
              className="w-full border border-slate-200 bg-slate-100 rounded-lg p-2.5 text-slate-600 font-mono font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State the detailed reason for issuing this credit note..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition flex items-center gap-2"
            >
              {loading ? 'Transmitting to KRA...' : 'Issue & Sign Credit Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};