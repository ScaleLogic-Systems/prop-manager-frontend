'use client';

import React, { useState } from 'react';
import { TenantUnassignedPaymentsTab } from './tabs/TenantUnassignedPaymentsTab';
import { AddUsersTab } from './tabs/AddUsersTab';

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

          {/* Navigation Links Grouped by Section */}
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
        {/* Render Tab Views Dynamically */}
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
   SUB-VIEWS FOR TAB MAIN MENUS & MODULE WORKSPACES
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

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-3">System Event Stream</h3>
        <div className="space-y-2 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
            <span>[CRON] Nightly Rent Invoicing completed for 1,820 active leases.</span>
            <span className="text-slate-500 text-[10px]">10 mins ago</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
            <span>[M-PESA] C2B IPN Callback reconciled automatically for KES 45,000.</span>
            <span className="text-slate-500 text-[10px]">24 mins ago</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
            <span>[AUTH] SuperAdmin user session authenticated.</span>
            <span className="text-slate-500 text-[10px]">Just now</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubscribersAgenciesView() {
  const agencies = [
    { name: 'Nairobi Heights Real Estate', plan: 'Enterprise (Custom)', units: '420 Units', status: 'Active', mrr: 'KES 150,000' },
    { name: 'Kilimani Living Agencies', plan: 'Growth Tier', units: '180 Units', status: 'Active', mrr: 'KES 65,000' },
    { name: 'Westlands Property Management', plan: 'Starter Tier', units: '45 Units', status: 'Pending Review', mrr: 'KES 25,000' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscribers & Agency Accounts</h1>
          <p className="text-xs text-slate-400 mt-1">Manage B2B SaaS agency subscriptions, unit limits, and account access.</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition">
          + Add New Agency
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-3">Agency Name</th>
              <th className="px-6 py-3">Subscription Plan</th>
              <th className="px-6 py-3">Managed Capacity</th>
              <th className="px-6 py-3">Monthly SaaS Fee</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {agencies.map((agency, idx) => (
              <tr key={idx} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 font-semibold text-white">{agency.name}</td>
                <td className="px-6 py-4">{agency.plan}</td>
                <td className="px-6 py-4">{agency.units}</td>
                <td className="px-6 py-4 font-mono">{agency.mrr}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${agency.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {agency.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-indigo-400 hover:text-indigo-300 font-semibold">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SaaSInvoicingView() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">SaaS Platform Billing & Invoices</h1>
          <p className="text-xs text-slate-400 mt-1">Issue and track monthly SaaS subscription invoices to property management agencies.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition">
          Generate Monthly Billing
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-xs text-slate-300 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <p className="font-semibold text-white">Invoice #INV-2026-009 — Nairobi Heights Real Estate</p>
            <p className="text-[11px] text-slate-400">Due: March 15, 2026 • Billing Cycle: Monthly</p>
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-lg text-[10px]">
            PAID (KES 150,000)
          </span>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <p className="font-semibold text-white">Invoice #INV-2026-010 — Kilimani Living Agencies</p>
            <p className="text-[11px] text-slate-400">Due: March 20, 2026 • Billing Cycle: Monthly</p>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold rounded-lg text-[10px]">
            PENDING (KES 65,000)
          </span>
        </div>
      </div>
    </div>
  );
}

function PaymentsHubOverviewView() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Payments Hub Overview</h1>
        <p className="text-xs text-slate-400 mt-1">Monitor all incoming gateway streams (M-Pesa Express, Bank Feeds, Manual Ledger).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="font-bold text-white text-sm">M-Pesa Daraja API</h3>
          <p className="text-xs text-emerald-400 mt-1 font-semibold">● Connected & Responding</p>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
            Shortcode: 4088920 <br />
            Avg Callback: 1.2s
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="font-bold text-white text-sm">Bank IPN Feeds</h3>
          <p className="text-xs text-emerald-400 mt-1 font-semibold">● Active (NCBA & Equity API)</p>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
            Unprocessed Webhooks: 0 <br />
            Last Sync: 2 mins ago
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="font-bold text-white text-sm">Auto-Reconciliation Engine</h3>
          <p className="text-xs text-indigo-400 mt-1 font-semibold">● Match Rate: 98.4%</p>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
            Matched via Unit Ref / Account Number
          </div>
        </div>
      </div>
    </div>
  );
}

function SaaSB2BUnassignedView() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">SaaS B2B Unassigned Payments</h1>
        <p className="text-xs text-slate-400 mt-1">Review SaaS subscription payments from agencies with missing reference metadata.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
        <p className="text-slate-300 font-semibold mb-1">🎉 No Unassigned B2B SaaS Payments!</p>
        <p>All incoming subscription payments have been automatically attributed to their agency accounts.</p>
      </div>
    </div>
  );
}

function CronLockdownView() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Cron Jobs & Emergency Lockdown Controls</h1>
        <p className="text-xs text-slate-400 mt-1">Manage scheduled cron triggers and emergency system-wide killswitches.</p>
      </div>

      <div className="bg-rose-950/30 border border-rose-500/20 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-rose-400 mb-2">🚨 Emergency System Lockdown Controls</h2>
        <p className="text-xs text-slate-300 mb-4">
          Locking down the system will restrict tenant login sessions and temporarily suspend outgoing payment processing APIs.
        </p>
        <button className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition">
          Trigger System Lockdown
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-white mb-2">Scheduled System Cron Tasks</h3>
        {[
          { name: 'Nightly Rent Invoicing & Late Fee Penalty', schedule: '0 0 * * *', status: 'Active' },
          { name: 'M-Pesa IPN Health Check & Retry Queue', schedule: '*/5 * * * *', status: 'Active' },
          { name: 'Tenant Overdue Reminders (SMS/Email)', schedule: '0 8 5 * *', status: 'Active' },
        ].map((job, idx) => (
          <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
            <div>
              <p className="font-semibold text-white">{job.name}</p>
              <span className="text-[10px] font-mono text-slate-500">Cron Rule: {job.schedule}</span>
            </div>
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-[11px] font-medium transition">
              Run Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebhookDLQView() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Webhook Dead Letter Queue (DLQ)</h1>
          <p className="text-xs text-slate-400 mt-1">Replay or inspect failed HTTP webhooks and IPN callback payloads.</p>
        </div>
        <button className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2 rounded-xl text-xs transition border border-slate-700">
          Replay All Dead Webhooks
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
        <p className="text-emerald-400 font-semibold mb-1">✓ Webhook Queue Healthy</p>
        <p>No failed callbacks in the Dead Letter Queue. All webhooks were processed with HTTP 200/201 responses.</p>
      </div>
    </div>
  );
}

function TenantImpersonationView() {
  const [targetUser, setTargetUser] = useState('');

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Tenant & User Impersonation Mode</h1>
        <p className="text-xs text-slate-400 mt-1">Generate a temporary, read-only session token to debug user portal layout issues.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">Target User Email or UUID</label>
          <input
            type="text"
            value={targetUser}
            onChange={(e) => setTargetUser(e.target.value)}
            placeholder="tenant@example.com or user_uuid"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <button className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-amber-500/20">
          Start Impersonation Session
        </button>
      </div>
    </div>
  );
}
