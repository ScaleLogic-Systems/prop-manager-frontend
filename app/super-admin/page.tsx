'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { TenantUnassignedPaymentsTab } from './tabs/TenantUnassignedPaymentsTab';
import { AddUsersTab } from './tabs/AddUsersTab';
import { EtimsConfigModal } from './components/EtimsConfigModal';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<string>('add-users');

  const navItems = [
    {
      section: 'OPERATIONS & SAAS MANAGEMENT',
      items: [
        { id: 'dashboard', label: 'Overview Dashboard', icon: '📊' },
        { id: 'subscribers', label: 'Subscribers & Agencies', icon: '🏢' },
        { id: 'add-users', label: 'User Onboarding', icon: '👤+' },
        { id: 'saas-invoicing', label: 'SaaS Invoicing', icon: '📄' },
      ],
    },
    {
      section: 'RECONCILIATION HUB',
      items: [
        { id: 'payments-overview', label: 'Payments Hub Overview', icon: '💳' },
        { id: 'saas-b2b-unassigned', label: 'SaaS B2B Unassigned', icon: '🏛️' },
        { id: 'tenant-unassigned-payments', label: 'Tenant Rent Unassigned', icon: '💵' },
      ],
    },
    {
      section: 'TECHNICAL & GOD-MODE CONTROLS',
      items: [
        { id: 'cron-lockdown', label: 'Cron & Emergency Lockdown', icon: '⏰' },
        { id: 'webhook-dlq', label: 'Webhook DLQ & Replay', icon: '🔄' },
        { id: 'tenant-impersonation', label: 'Tenant Impersonation', icon: '👥' },
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 shrink-0 flex flex-col justify-between p-4 z-20 overflow-y-auto">
        <div>
          {/* Logo / Branding */}
          <div className="flex items-center space-x-3 px-3 py-3 border-b border-slate-800 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-amber-500/20">
              👑
            </div>
            <div>
              <h2 className="font-bold text-sm text-white tracking-wide">PropManager HQ</h2>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Superadmin Portal</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-4 text-xs font-medium">
            {navItems.map((group) => (
              <div key={group.section} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {group.section}
                </div>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl transition text-left ${
                      activeTab === item.id
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 px-3 py-2 text-xs flex flex-col space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="truncate text-[11px]">admin@propmanager.co.ke</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></span>
          </div>
          <button
            onClick={() => console.log('Sign out')}
            className="w-full flex items-center space-x-2 px-2 py-1.5 text-slate-400 hover:text-rose-400 text-left transition rounded-lg hover:bg-slate-800/50"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Workspace Area */}
      <main className="flex-1 min-h-screen bg-slate-950 p-6 md:p-8 overflow-y-auto text-slate-100">
        {activeTab === 'dashboard' && <OverviewDashboardView />}
        {activeTab === 'subscribers' && <SubscribersAgenciesView />}
        {activeTab === 'add-users' && <AddUsersTab />}
        {activeTab === 'saas-invoicing' && <SaaSInvoicingView />}
        {activeTab === 'payments-overview' && <PaymentsHubOverviewView />}
        {activeTab === 'saas-b2b-unassigned' && <SaaSB2BUnassignedView />}
        {(activeTab === 'tenant-unassigned-payments' || activeTab === 'unassigned-tenant-payments') && (
          <TenantUnassignedPaymentsTab setActiveTab={setActiveTab} />
        )}
        {activeTab === 'cron-lockdown' && <CronLockdownView />}
        {activeTab === 'webhook-dlq' && <WebhookDLQView />}
        {activeTab === 'tenant-impersonation' && <TenantImpersonationView />}
      </main>
    </div>
  );
}

/* ============================================================================
   DYNAMIC SUBSCRIBERS & AGENCIES VIEW WITH ETIMS MANAGEMENT
   ============================================================================ */

function SubscribersAgenciesView() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [etimsConfigs, setEtimsConfigs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    loadSubscribers();
  }, []);

  async function loadSubscribers() {
    setLoading(true);
    try {
      // Fetch property managers / owners / agency profiles
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['property_manager', 'super_admin', 'owner', 'property-manager', 'super-admin'])
        .order('created_at', { ascending: false });

      if (profileErr) throw profileErr;
      setProfiles(profileData || []);

      // Fetch active eTIMS configurations
      const { data: configData, error: configErr } = await supabase
        .from('agency_etims_configs')
        .select('profile_id, is_enabled');

      if (!configErr && configData) {
        const configMap: Record<string, boolean> = {};
        configData.forEach((c) => {
          configMap[c.profile_id] = c.is_enabled;
        });
        setEtimsConfigs(configMap);
      }
    } catch (err: any) {
      console.error('Failed to load subscribers:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscribers & Agency Accounts</h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage client subscription profiles and configure optional KRA eTIMS add-on features.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading subscribers...</div>
        ) : (
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Subscriber / Agency</th>
                <th className="px-6 py-3">Email Address</th>
                <th className="px-6 py-3">System Role</th>
                <th className="px-6 py-3">eTIMS Status</th>
                <th className="px-6 py-3 text-right">Feature Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {profiles.map((p) => {
                const isEtimsEnabled = etimsConfigs[p.id] || false;
                return (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-6 py-4 font-semibold text-white">{p.full_name}</td>
                    <td className="px-6 py-4">{p.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 font-mono text-[10px] text-amber-400">
                        {p.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isEtimsEnabled ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ✓ eTIMS Enabled
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedProfile({ id: p.id, name: p.full_name })}
                        className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        ⚙ Configure eTIMS
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Render eTIMS Configuration Modal when an agency is selected */}
      {selectedProfile && (
        <EtimsConfigModal
          profileId={selectedProfile.id}
          profileName={selectedProfile.name}
          onClose={() => {
            setSelectedProfile(null);
            loadSubscribers(); // Refresh feature badges after saving
          }}
        />
      )}
    </div>
  );
}

/* ============================================================================
   OTHER DASHBOARD SUB-VIEWS
   ============================================================================ */

function OverviewDashboardView() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">System Overview & KPI Metrics</h1>
        <p className="text-xs text-slate-400 mt-1">Real-time health status and SaaS revenue performance across all agencies.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Recurring Revenue', value: 'KES 1,280,000', change: '+12.4%', color: 'border-indigo-500/30' },
          { label: 'Active Agencies', value: '18 Agencies', change: '+2 this month', color: 'border-emerald-500/30' },
          { label: 'Total Managed Units', value: '2,450 Units', change: '+180 units', color: 'border-amber-500/30' },
          { label: 'M-Pesa IPN Sync Health', value: '99.94%', change: 'Optimal', color: 'border-blue-500/30' },
        ].map((stat, i) => (
          <div key={i} className={`bg-slate-900 border ${stat.color} rounded-2xl p-5 shadow-lg`}>
            <p className="text-xs font-medium text-slate-400">{stat.label}</p>
            <h2 className="text-2xl font-extrabold text-white mt-2">{stat.value}</h2>
            <span className="text-[11px] font-semibold text-emerald-400 mt-1 inline-block">{stat.change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SaaSInvoicingView() {
  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-white">SaaS Billing & Invoices</h1>
      <p className="text-xs text-slate-400">Monthly billing for platform subscribers.</p>
    </div>
  );
}

function PaymentsHubOverviewView() {
  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-white">Payments Hub Overview</h1>
      <p className="text-xs text-slate-400">M-Pesa Express and Bank Feed Sync Status.</p>
    </div>
  );
}

function SaaSB2BUnassignedView() {
  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-white">SaaS B2B Unassigned Payments</h1>
      <p className="text-xs text-slate-400">Unattributed subscription payments.</p>
    </div>
  );
}

function CronLockdownView() {
  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-white">Cron Jobs & Lockdown Controls</h1>
      <p className="text-xs text-slate-400">Emergency controls and system task schedules.</p>
    </div>
  );
}

function WebhookDLQView() {
  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-white">Webhook Dead Letter Queue</h1>
      <p className="text-xs text-slate-400">Callback replay and error inspection.</p>
    </div>
  );
}

function TenantImpersonationView() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-white">Tenant Impersonation Mode</h1>
      <p className="text-xs text-slate-400">Read-only layout inspection.</p>
    </div>
  );
}
