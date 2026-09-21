// app/accountant/page.tsx
'use client';

import React, { useState } from 'react';
import { AccountantTab } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewTab } from './tabs/OverviewTab';
import { RentRollTab } from './tabs/RentRollTab';
import { InvoicesTab } from './tabs/InvoicesTab';
import { ReconciliationTab } from './tabs/ReconciliationTab';
import { PayoutsTab } from './tabs/PayoutsTab';
import AccountantSettingsTab from './tabs/SettingsTab';

export default function AccountantPage() {
  const [activeTab, setActiveTab] = useState<AccountantTab>('rent-roll');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'rent-roll':
        return <RentRollTab />;
      case 'invoices':
        return <InvoicesTab />;
      case 'reconciliation':
        return <ReconciliationTab />;
      case 'payouts':
        return <PayoutsTab />;
      case 'settings':
        return <AccountantSettingsTab />;
      default:
        return <RentRollTab />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
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