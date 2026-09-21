// app/developer/page.tsx
'use client';

import React, { useState } from 'react';
import { DeveloperTab } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SystemHealthTab } from './tabs/SystemHealthTab';
import { ApiLogsTab } from './tabs/ApiLogsTab';
import { RbacTab } from './tabs/RbacTab';
import { AuditLogsTab } from './tabs/AuditLogsTab';
import { FeatureFlagsTab } from './tabs/FeatureFlagsTab';
import DeveloperSettingsTab from './tabs/SettingsTab'; // Import from local tabs folder

export default function DeveloperPage() {
  const [activeTab, setActiveTab] = useState<DeveloperTab>('system-health');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'system-health':
        return <SystemHealthTab />;
      case 'api-logs':
        return <ApiLogsTab />;
      case 'rbac':
        return <RbacTab />;
      case 'audit-logs':
        return <AuditLogsTab />;
      case 'feature-flags':
        return <FeatureFlagsTab />;
      case 'settings':
        return <DeveloperSettingsTab />;
      default:
        return <SystemHealthTab />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}