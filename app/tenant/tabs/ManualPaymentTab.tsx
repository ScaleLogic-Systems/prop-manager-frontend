// app/tenant/tabs/ManualPaymentTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2, ShieldCheck, Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

interface InvoiceOption {
  id: string;
  title: string;
  amount: number;
}

export const ManualPaymentTab: React.FC = () => {
  const [transactionCode, setTransactionCode] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [notes, setNotes] = useState('');
  const [invoices, setInvoices] = useState<InvoiceOption[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch active invoices so tenant can optionally link their payment to a specific bill
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const res = await fetch('/api/tenant/invoices');
        if (res.ok) {
          const data = await res.json();
          const unpaid = (data.invoices || []).filter(
            (inv: any) => inv.status !== 'paid' && inv.status !== 'settled'
          );
          setInvoices(unpaid);
        }
      } catch (err) {
        console.error('Failed to load invoices for manual payment:', err);
      }
    };
    fetchInvoices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!transactionCode.trim() || !amount) {
      setErrorMessage('Please enter both the M-Pesa transaction code and the amount.');
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/tenant/submit-manual-payment', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transaction_code: transactionCode.trim(),
          amount: Number(amount),
          invoice_id: selectedInvoiceId || null,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit payment.');
      }

      setSuccessMessage('Payment code submitted successfully! Management will review and verify shortly.');
      setTransactionCode('');
      setAmount('');
      setSelectedInvoiceId('');
      setNotes('');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Receipt size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Submit Manual M-Pesa Payment</h2>
            <p className="text-sm text-slate-500">
              Paid directly via Paybill or Till? Submit your M-Pesa receipt details here for quick verification.
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-sm">
            <CheckCircle2 className="shrink-0 text-emerald-600 mt-0.5" size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
            <AlertCircle className="shrink-0 text-rose-600 mt-0.5" size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              M-Pesa Transaction Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. QGH8291XYZ"
              value={transactionCode}
              onChange={(e) => setTransactionCode(e.target.value.toUpperCase())}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
            <span className="text-xs text-slate-400 mt-1 block">
              Found in the confirmation SMS received from M-Pesa.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Amount Paid (KES) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              placeholder="e.g. 15000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              step="0.01"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Link to Invoice (Optional)
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            >
              <option value="">Select an active invoice (Optional)</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.title} — KES {inv.amount.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Additional Notes / Remarks (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="E.g. Paid via Paybill for September rent"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Submitting Payment...
            </>
          ) : (
            <>
              <Send size={18} />
              Submit M-Pesa Code for Review
            </>
          )}
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100 justify-center">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Submissions are audited and verified by property management.</span>
        </div>
      </form>
    </div>
  );
};