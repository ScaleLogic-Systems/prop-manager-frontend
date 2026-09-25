// app/tenant/tabs/DashboardTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Gauge, 
  CreditCard, 
  CheckCircle2, 
  FileX, 
  User, 
  Home, 
  UserCheck,
  Phone
} from 'lucide-react';
import { TenantInvoice, MeterReadingInfo } from '../types';

interface TenantProfile {
  name: string;
  full_name?: string;
  property_name: string;
  unit_number: string;
  caretaker_name: string;
  caretaker_phone?: string;
}

export const DashboardTab: React.FC = () => {
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [meterInfo, setMeterInfo] = useState<MeterReadingInfo | null>(null);
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Try fetching from both standard API paths for maximum compatibility
        let profileRes = await fetch('/api/tenant/profile');
        if (!profileRes.ok) {
          profileRes = await fetch('/tenant/api/profile');
        }

        const [invoiceRes, meterRes] = await Promise.all([
          fetch('/api/tenant/invoices'),
          fetch('/api/tenant/meter-reading')
        ]);

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const p = profileData.profile || profileData || {};
          setProfile({
            name: p.full_name || p.name || 'Valued Tenant',
            property_name: p.property_name || p.property?.name || '',
            unit_number: p.unit_number || p.unit?.unit_number || '',
            caretaker_name: p.caretaker_name || p.caretaker?.full_name || p.caretaker?.name || '',
            caretaker_phone: p.caretaker_phone || p.caretaker?.phone || '',
          });
        }

        if (invoiceRes.ok) {
          const invData = await invoiceRes.json();
          setInvoices(invData.invoices || []);
        }

        if (meterRes.ok) {
          const meterData = await meterRes.json();
          setMeterInfo(meterData.meterInfo || null);
        }
      } catch (err) {
        console.error('Failed to load tenant dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handlePayNow = async (invoiceId: string, amount: number) => {
    setPayingId(invoiceId);
    try {
      const res = await fetch('/api/tenant/pay-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId, amount }),
      });

      if (!res.ok) throw new Error('Payment processing failed');

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: 'under_review' as any } : inv
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Payment failed');
      }
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium animate-pulse">
        Loading tenant dashboard...
      </div>
    );
  }

  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const reviewInvoices = invoices.filter((i) => i.status === 'under_review');
  const displayName = profile?.name || profile?.full_name || 'Valued Tenant';

  return (
    <div className="space-y-8">
      {/* 1. CLEAN HERO SECTION */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Tenant Portal</span>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5 mt-1">
            <User className="text-blue-600 p-1.5 bg-blue-50 rounded-xl" size={32} />
            Welcome back, {displayName} 👋
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Here is a summary of your tenancy, active bills, and water meter consumption.
          </p>
        </div>

        {/* PROPERTY, UNIT, & CARETAKER DETAILS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shrink-0">
              <Home size={20} />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Assigned Property &amp; Unit</div>
              <div className="font-bold text-slate-900 mt-0.5">
                {profile?.property_name && profile?.unit_number
                  ? `${profile.property_name} — Unit ${profile.unit_number}`
                  : profile?.property_name || (profile?.unit_number ? `Unit ${profile.unit_number}` : 'No unit assigned')}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/60 gap-3">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                <UserCheck size={20} />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Assigned Caretaker</div>
                <div className="font-bold text-slate-900 mt-0.5">
                  {profile?.caretaker_name || 'Not assigned'}
                </div>
              </div>
            </div>
            {profile?.caretaker_phone ? (
              <a
                href={`tel:${profile.caretaker_phone}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Phone size={14} /> Call Caretaker ({profile.caretaker_phone})
              </a>
            ) : (
              <div className="text-xs text-slate-400 italic">No phone contact listed</div>
            )}
          </div>

          <div className="flex items-center gap-3.5 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="text-xs text-blue-600 font-medium">Active Invoices</div>
              <div className="font-bold text-blue-950 mt-0.5">{invoices.length} Bills Raised</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ALERTS SECTION */}
      {overdueInvoices.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="text-rose-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-rose-900 text-sm">Overdue Payment Notice</h4>
            <p className="text-sm text-rose-700 mt-0.5">
              You have {overdueInvoices.length} overdue invoice(s). Please clear your balance promptly to maintain active status.
            </p>
          </div>
        </div>
      )}

      {reviewInvoices.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <Clock className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-amber-900 text-sm">Payment Received &amp; Pending Review</h4>
            <p className="text-sm text-amber-700 mt-0.5">
              Your payment has been logged and is awaiting verification by property management.
            </p>
          </div>
        </div>
      )}

      {/* 3. RAISED INVOICES & PAYMENT STATUS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Raised Invoices &amp; Payments</h3>
            <p className="text-sm text-slate-500">View active bills, payment statuses, and settle balances securely.</p>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
            {invoices.length} Total
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
            <FileX size={36} className="text-slate-300" />
            <p className="font-semibold text-slate-700">No raised invoices found</p>
            <p className="text-xs text-slate-400">You currently have no active or historical invoices on record.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {invoices.map((inv) => {
              const statusStr = String(inv.status || '').toLowerCase();
              const isPaid = statusStr === 'paid' || statusStr === 'settled';
              const isPartial = statusStr === 'partial';
              const isOverdue = statusStr === 'overdue';
              const isReview = statusStr === 'under_review';
              const invAny = inv as any;
              const amountPaid = invAny.amount_paid;
              const balance = invAny.balance;

              return (
                <div key={inv.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-900 text-base">{inv.title || 'Rent & Utility Invoice'}</span>
                      {isOverdue && (
                        <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Overdue</span>
                      )}
                      {isReview && (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Awaiting Review</span>
                      )}
                      {isPaid && (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Settled</span>
                      )}
                      {isPartial && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Partial Payment</span>
                      )}
                      {!isOverdue && !isReview && !isPaid && !isPartial && (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Unpaid</span>
                      )}
                    </div>

                    {inv.meter_info && (
                      <p className="text-xs text-slate-500">
                        Water Readings: {inv.meter_info.previous_meter_reading} to {inv.meter_info.current_meter_reading} ({inv.meter_info.units_consumed} units)
                      </p>
                    )}

                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Due Date: <strong className="text-slate-700">{inv.due_date || 'N/A'}</strong></span>
                      {isPartial && amountPaid !== undefined && (
                        <span>Paid: <strong className="text-emerald-600">KES {(amountPaid).toLocaleString()}</strong></span>
                      )}
                      {isPartial && balance !== undefined && (
                        <span>Balance: <strong className="text-rose-600">KES {(balance).toLocaleString()}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 justify-between md:justify-end">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Grand Total</div>
                      <div className="text-xl font-bold text-slate-900">KES {(inv.amount || 0).toLocaleString()}</div>
                    </div>

                    {isReview ? (
                      <button
                        disabled
                        className="bg-amber-100 text-amber-800 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-not-allowed flex items-center gap-1.5"
                      >
                        <Clock size={15} /> Payment Pending Review
                      </button>
                    ) : isPaid ? (
                      <button
                        disabled
                        className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-not-allowed flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={15} /> Settled
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePayNow(inv.id, balance !== undefined ? balance : inv.amount)}
                        disabled={payingId === inv.id}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                      >
                        <CreditCard size={15} />
                        {payingId === inv.id ? 'Processing...' : isPartial ? 'Pay Balance' : 'Pay Now'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. WATER METER READING OVERVIEW (MOVED TO BOTTOM) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-lg border-b border-slate-100 pb-3">
          <Gauge className="text-blue-600" size={22} />
          <h3>Water Meter Reading Overview {meterInfo?.billing_month ? `(${meterInfo.billing_month})` : ''}</h3>
        </div>

        {meterInfo && (meterInfo.current_meter_reading !== undefined || meterInfo.previous_meter_reading !== undefined) ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
              <div className="text-xs text-slate-500 font-medium">Previous Meter Reading</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{meterInfo.previous_meter_reading ?? '0'}</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
              <div className="text-xs text-slate-500 font-medium">Current Meter Reading</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{meterInfo.current_meter_reading ?? '0'}</div>
            </div>

            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl">
              <div className="text-xs text-blue-600 font-medium">Total Units Consumed</div>
              <div className="text-2xl font-bold text-blue-950 mt-1">{meterInfo.units_consumed ?? '0'} units</div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-sm font-medium">
            No Information to show
          </div>
        )}
      </div>
    </div>
  );
};