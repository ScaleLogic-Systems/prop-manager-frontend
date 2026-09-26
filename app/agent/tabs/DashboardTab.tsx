// app/agent/tabs/DashboardTab.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  PieChart,
  Loader2
} from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

interface DashboardTabProps {
  propertyId?: string;
  propertyName?: string;
}

interface Metrics {
  occupiedUnits: number;
  vacantUnits: number;
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
  partialCount: number;
  paidAmount: number;
  unpaidAmount: number;
  overdueAmount: number;
  partialAmount: number;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ 
  propertyId: initialPropertyId, 
  propertyName: initialPropertyName 
}) => {
  const [propertyId, setPropertyId] = useState<string | undefined>(initialPropertyId);
  const [propertyName, setPropertyName] = useState<string | undefined>(initialPropertyName);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const queryParam = propertyId ? `?property_id=${propertyId}` : '';
        const res = await fetch(`/agent/api/dashboard-metrics${queryParam}`, {
          cache: 'no-store',
          headers
        });

        if (res.ok) {
          const data = await res.json();
          setMetrics(data.metrics);
          
          if (data.property_id && !propertyId) setPropertyId(data.property_id);
          if (data.property_name && !propertyName) setPropertyName(data.property_name);
        }
      } catch (err) {
        console.error('Error fetching agent metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [propertyId, propertyName]);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center text-gray-500 gap-2">
        <Loader2 className="animate-spin text-indigo-600" size={24} />
        Fetching property statistics from database...
      </div>
    );
  }

  const totalInvoices = (metrics?.paidCount || 0) + (metrics?.unpaidCount || 0) + (metrics?.overdueCount || 0) + (metrics?.partialCount || 0);

  return (
    <div className="space-y-8">
      {/* 1. Property Banner */}
      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-indigo-600">Assigned Property</span>
          <h2 className="text-xl font-bold text-indigo-950">
            {propertyName || 'No property assigned in database'}
          </h2>
        </div>
      </div>

      {/* 2. Numerical Representation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
            <Building2 size={16} /> Occupied Units
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics?.occupiedUnits ?? 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
            <Building2 size={16} /> Vacant Units
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics?.vacantUnits ?? 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium mb-1">
            <CheckCircle2 size={16} /> Paid Invoices
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics?.paidCount ?? 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium mb-1">
            <Clock size={16} /> Unpaid Invoices
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics?.unpaidCount ?? 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-red-600 text-sm font-medium mb-1">
            <AlertCircle size={16} /> Overdue
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics?.overdueCount ?? 0}</div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-blue-600 text-sm font-medium mb-1">
            <DollarSign size={16} /> Partial Payments
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics?.partialCount ?? 0}</div>
        </div>
      </section>

      {/* 3. Financials & Invoicing Breakdown */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <PieChart size={20} className="text-indigo-600" /> Financials & Invoicing Breakdown
          </h2>
        </div>

        {totalInvoices === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No invoice financial records found in the database for this property.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${((metrics?.paidCount || 0) / totalInvoices) * 100}%` }} className="bg-green-500" title="Paid Invoices" />
              <div style={{ width: `${((metrics?.unpaidCount || 0) / totalInvoices) * 100}%` }} className="bg-yellow-400" title="Unpaid Invoices" />
              <div style={{ width: `${((metrics?.overdueCount || 0) / totalInvoices) * 100}%` }} className="bg-red-500" title="Overdue" />
              <div style={{ width: `${((metrics?.partialCount || 0) / totalInvoices) * 100}%` }} className="bg-blue-500" title="Partial Payments" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <div>
                  <div className="text-gray-500">Paid Invoices</div>
                  <div className="font-bold text-gray-800">${(metrics?.paidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <div>
                  <div className="text-gray-500">Unpaid Invoices</div>
                  <div className="font-bold text-gray-800">${(metrics?.unpaidAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <div>
                  <div className="text-gray-500">Overdue</div>
                  <div className="font-bold text-gray-800">${(metrics?.overdueAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <div>
                  <div className="text-gray-500">Partial Payments</div>
                  <div className="font-bold text-gray-800">${(metrics?.partialAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};