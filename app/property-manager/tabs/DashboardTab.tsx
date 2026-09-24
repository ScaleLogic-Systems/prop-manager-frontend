// app/property-manager/tabs/DashboardTab.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { 
  Building2, 
  Home, 
  UserCheck, 
  UserX, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PieChart as PieChartIcon, 
  Loader2, 
  RefreshCw 
} from 'lucide-react';

export interface PropertyFinancials {
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;
  partialPayments: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  totalOverdueAmount: number;
  totalPartialAmount: number;
}

export interface PropertyDashboardData {
  propertyId: string;
  propertyName: string;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  financials: PropertyFinancials;
}

const DEFAULT_PLACEHOLDER_PROPERTY: PropertyDashboardData = {
  propertyId: 'sample-001',
  propertyName: 'Sample Property (Placeholder)',
  totalUnits: 0,
  occupiedUnits: 0,
  vacantUnits: 0,
  financials: {
    paidInvoices: 0,
    unpaidInvoices: 0,
    overdueInvoices: 0,
    partialPayments: 0,
    totalPaidAmount: 0,
    totalUnpaidAmount: 0,
    totalOverdueAmount: 0,
    totalPartialAmount: 0,
  },
};

export const DashboardTab: React.FC = () => {
  const [properties, setProperties] = useState<PropertyDashboardData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/property-manager/api/properties-overview', { 
        cache: 'no-store',
        headers 
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Server responded with error status ${res.status}`);
      }

      const rawProperties = data.properties || [];

      if (Array.isArray(rawProperties) && rawProperties.length > 0) {
        const formattedProperties: PropertyDashboardData[] = rawProperties.map((prop: any) => {
          const unitsList = Array.isArray(prop.units) ? prop.units : [];
          const totalUnits = prop.totalUnits ?? unitsList.length;
          const occupiedUnits = prop.occupiedUnits ?? unitsList.filter((u: any) => u.is_occupied).length;
          const vacantUnits = prop.vacantUnits ?? (totalUnits - occupiedUnits);

          return {
            propertyId: prop.propertyId || prop.id || 'N/A',
            propertyName: prop.propertyName || prop.name || 'Unnamed Property',
            totalUnits,
            occupiedUnits,
            vacantUnits,
            financials: prop.financials || DEFAULT_PLACEHOLDER_PROPERTY.financials,
          };
        });

        setProperties(formattedProperties);
      } else {
        setProperties([]);
      }
    } catch (err: unknown) {
      console.error('Error fetching property manager dashboard metrics:', err);
      const message = err instanceof Error ? err.message : 'Database connection error.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-gray-500 gap-3 shadow-sm">
        <Loader2 className="animate-spin text-blue-600" size={28} />
        <span className="text-sm font-medium">Loading assigned property metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 rounded-xl border border-gray-200 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Property Manager Portfolio Overview</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time breakdown of units, occupancy rates, and financial invoice statuses for your managed properties.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg transition self-start sm:self-auto"
        >
          <RefreshCw size={14} /> Refresh Records
        </button>
      </div>

      {/* DATABASE DISCONNECT ALERT BANNER */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between text-amber-800 text-sm shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition"
          >
            <RefreshCw size={12} /> Retry Connection
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {!error && properties.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center space-y-3">
          <Building2 size={36} className="mx-auto text-gray-400" />
          <h3 className="text-base font-bold text-gray-800">No Managed Properties Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            There are currently no properties assigned to your manager account or agency in the database.
          </p>
        </div>
      )}

      {/* RENDER PER-PROPERTY DASHBOARD SECTION */}
      {properties.map((property) => {
        const financials = property.financials || DEFAULT_PLACEHOLDER_PROPERTY.financials;
        const totalInvoicesCount =
          (financials.paidInvoices || 0) +
          (financials.unpaidInvoices || 0) +
          (financials.overdueInvoices || 0) +
          (financials.partialPayments || 0);

        const getPct = (val: number) =>
          totalInvoicesCount > 0 ? ((val / totalInvoicesCount) * 100).toFixed(1) : '0';

        const paidPct = Number(getPct(financials.paidInvoices || 0));
        const unpaidPct = Number(getPct(financials.unpaidInvoices || 0));
        const overduePct = Number(getPct(financials.overdueInvoices || 0));
        const partialPct = Number(getPct(financials.partialPayments || 0));

        return (
          <div
            key={property.propertyId || property.propertyName}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-6 p-6"
          >
            {/* PROPERTY HEADER */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{property.propertyName}</h3>
                  <span className="text-xs text-gray-400">Database Record ID: {property.propertyId}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Occupancy Rate</span>
                <span className="text-base font-bold text-gray-800">
                  {property.totalUnits > 0
                    ? `${((property.occupiedUnits / property.totalUnits) * 100).toFixed(0)}%`
                    : '0%'}
                </span>
              </div>
            </div>

            {/* UNIT & OCCUPANCY METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center gap-3">
                <div className="p-2 bg-slate-200 text-slate-700 rounded-md">
                  <Home size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Total Units</p>
                  <p className="text-lg font-bold text-slate-800">{property.totalUnits ?? 0}</p>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex items-center gap-3">
                <div className="p-2 bg-emerald-200 text-emerald-800 rounded-md">
                  <UserCheck size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-700">Occupied Units</p>
                  <p className="text-lg font-bold text-emerald-900">{property.occupiedUnits ?? 0}</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-3">
                <div className="p-2 bg-amber-200 text-amber-800 rounded-md">
                  <UserX size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-700">Vacant Units</p>
                  <p className="text-lg font-bold text-amber-900">{property.vacantUnits ?? 0}</p>
                </div>
              </div>
            </div>

            {/* INVOICE FINANCIAL CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-green-200 bg-green-50/50 p-4 rounded-lg">
                <div className="flex items-center justify-between text-green-700 mb-1">
                  <span className="text-xs font-semibold">Paid Invoices</span>
                  <CheckCircle2 size={16} />
                </div>
                <p className="text-xl font-bold text-green-900">{financials.paidInvoices ?? 0}</p>
                <p className="text-xs text-green-700 mt-1 font-medium">
                  KES {(financials.totalPaidAmount ?? 0).toLocaleString()}
                </p>
              </div>

              <div className="border border-yellow-200 bg-yellow-50/50 p-4 rounded-lg">
                <div className="flex items-center justify-between text-yellow-700 mb-1">
                  <span className="text-xs font-semibold">Unpaid Invoices</span>
                  <Clock size={16} />
                </div>
                <p className="text-xl font-bold text-yellow-900">{financials.unpaidInvoices ?? 0}</p>
                <p className="text-xs text-yellow-700 mt-1 font-medium">
                  KES {(financials.totalUnpaidAmount ?? 0).toLocaleString()}
                </p>
              </div>

              <div className="border border-red-200 bg-red-50/50 p-4 rounded-lg">
                <div className="flex items-center justify-between text-red-700 mb-1">
                  <span className="text-xs font-semibold">Overdue Invoices</span>
                  <AlertTriangle size={16} />
                </div>
                <p className="text-xl font-bold text-red-900">{financials.overdueInvoices ?? 0}</p>
                <p className="text-xs text-red-700 mt-1 font-medium">
                  KES {(financials.totalOverdueAmount ?? 0).toLocaleString()}
                </p>
              </div>

              <div className="border border-blue-200 bg-blue-50/50 p-4 rounded-lg">
                <div className="flex items-center justify-between text-blue-700 mb-1">
                  <span className="text-xs font-semibold">Partial Payments</span>
                  <Clock size={16} />
                </div>
                <p className="text-xl font-bold text-blue-900">{financials.partialPayments ?? 0}</p>
                <p className="text-xs text-blue-700 mt-1 font-medium">
                  KES {(financials.totalPartialAmount ?? 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* GRAPHICAL REPRESENTATION OF FINANCIALS */}
            <div className="bg-gray-50 border border-gray-200 p-5 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChartIcon size={18} className="text-gray-600" />
                  <h4 className="text-sm font-bold text-gray-800">Financial Breakdown Visual</h4>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  Total Invoices: {totalInvoicesCount}
                </span>
              </div>

              {totalInvoicesCount === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-md">
                  No invoice records registered for this property.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* PROGRESS DISTRIBUTION BAR */}
                  <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${paidPct}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500"
                      title={`Paid: ${paidPct}%`}
                    />
                    <div
                      style={{ width: `${unpaidPct}%` }}
                      className="bg-amber-400 h-full transition-all duration-500"
                      title={`Unpaid: ${unpaidPct}%`}
                    />
                    <div
                      style={{ width: `${overduePct}%` }}
                      className="bg-red-500 h-full transition-all duration-500"
                      title={`Overdue: ${overduePct}%`}
                    />
                    <div
                      style={{ width: `${partialPct}%` }}
                      className="bg-blue-500 h-full transition-all duration-500"
                      title={`Partial: ${partialPct}%`}
                    />
                  </div>

                  {/* CHART LEGEND & STATS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-gray-600">Paid:</span>
                      <span className="font-bold text-gray-800">{paidPct}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <span className="text-gray-600">Unpaid:</span>
                      <span className="font-bold text-gray-800">{unpaidPct}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-gray-600">Overdue:</span>
                      <span className="font-bold text-gray-800">{overduePct}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-gray-600">Partial:</span>
                      <span className="font-bold text-gray-800">{partialPct}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};