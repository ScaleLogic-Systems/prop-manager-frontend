// app/super-admin/page.tsx
'use client';

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { HeroSection } from './components/HeroSection';
import { SuperadminTab } from './types';

// Tab Components
import { DashboardTab } from './tabs/DashboardTab';
import { SubscribersTab } from './tabs/SubscribersTab';
import { AddUsersTab } from './tabs/AddUsersTab';
import { AddPropertyTab } from './tabs/AddPropertyTab';
import { GenerateInvoiceTab } from './tabs/GenerateInvoiceTab';
import { KraEtimsTab } from './tabs/KraEtimsTab';
import { UnassignedPaymentsHubTab } from './tabs/UnassignedPaymentsHubTab';
import { SaaSUnassignedPaymentsTab } from './tabs/SaaSUnassignedPaymentsTab';
import { TenantUnassignedPaymentsTab } from './tabs/TenantUnassignedPaymentsTab';
import { SystemControlTab } from './tabs/SystemControlTab';
import { WebhookDebuggerTab } from './tabs/WebhookDebuggerTab';
import { ImpersonatorTab } from './tabs/ImpersonatorTab';
import { AuditLogsTab } from './tabs/AuditLogsTab';
import { FeatureFlagsTab } from './tabs/FeatureFlagsTab';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<SuperadminTab>('dashboard');

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Workspace Area */}
      <main className="flex-1 min-h-screen bg-slate-950 p-6 md:p-8 overflow-y-auto text-slate-100">
        {/* Dynamic Hero Section on each tab */}
        <HeroSection activeTab={activeTab} />

        {/* Tab Content Views */}
        <div className="w-full">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'subscribers' && <SubscribersTab />}
          {activeTab === 'add-users' && <AddUsersTab />}
          {activeTab === 'add-property' && <AddPropertyTab />}
          {(activeTab === 'saas-invoicing' || activeTab === 'generate-invoice') && <GenerateInvoiceTab />}
          {activeTab === 'kra-etims' && <KraEtimsTab />}
          {(activeTab === 'payments-overview' || activeTab === 'unassigned-payments-hub') && (
            <UnassignedPaymentsHubTab setActiveTab={(tab) => setActiveTab(tab as SuperadminTab)} />
          )}
          {(activeTab === 'saas-b2b-unassigned' ||
            activeTab === 'saas-unassigned-payments' ||
            activeTab === 'unassigned-saas-payments') && (
            <SaaSUnassignedPaymentsTab setActiveTab={(tab) => setActiveTab(tab as SuperadminTab)} />
          )}
          {(activeTab === 'tenant-unassigned-payments' || activeTab === 'unassigned-tenant-payments') && (
            <TenantUnassignedPaymentsTab setActiveTab={(tab) => setActiveTab(tab as SuperadminTab)} />
          )}
          {(activeTab === 'cron-lockdown' || activeTab === 'system-control') && <SystemControlTab />}
          {(activeTab === 'webhook-dlq' || activeTab === 'webhook-debugger') && <WebhookDebuggerTab />}
          {(activeTab === 'tenant-impersonation' || activeTab === 'impersonator') && <ImpersonatorTab />}
          {activeTab === 'audit-logs' && <AuditLogsTab />}
          {activeTab === 'feature-flags' && <FeatureFlagsTab />}
        </div>
      </main>
    </div>
  );
}