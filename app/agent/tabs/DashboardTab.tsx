// app/agent/tabs/DashboardTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Building, Users, CreditCard, Clock, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

interface Metrics {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  totalCollected: number;
  pendingReviewPayments: number;
  activeTenantsCount: number;
}

export const DashboardTab: React.FC<{ propertyId?: string }> = ({ propertyId }) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const queryParam = propertyId ? `?property_id=${propertyId}` : '';
        const res = await fetch(`/agent/api/dashboard-metrics${queryParam}`, { headers, cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setMetrics(data.metrics);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-medium animate-pulse">
        Loading agent dashboard metrics...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Units</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Building size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics?.totalUnits || 0}</div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="text-emerald-600 font-bold">{metrics?.occupiedUnits || 0} Occupied</span>
            <span>&bull;</span>
            <span className="text-amber-600 font-bold">{metrics?.vacantUnits || 0} Vacant</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Tenants</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Users size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics?.activeTenantsCount || 0}</div>
          <div className="text-xs text-emerald-600 font-medium">Verified active occupancy</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Collected</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">KES {(metrics?.totalCollected || 0).toLocaleString()}</div>
          <div className="text-xs text-indigo-600 font-medium">Verified revenue</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics?.pendingReviewPayments || 0}</div>
          <div className="text-xs text-amber-600 font-medium">Payments awaiting audit</div>
        </div>
      </div>

      {/* Quick Status / Instructions Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
            Agent Operations Hub
          </span>
          <h3 className="text-2xl font-bold">Manage Assigned Properties &amp; Tenants Seamlessly</h3>
          <p className="text-blue-100 text-sm max-w-2xl">
            Use the sidebar navigation to log water meter readings, generate monthly invoices, review direct M-Pesa payments, and onboard new tenants.
          </p>
        </div>
      </div>
    </div>
  );
};