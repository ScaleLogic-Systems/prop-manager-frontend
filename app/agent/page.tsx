// app/agent/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AgentTab, AgentProfile } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { createClient } from '@/lib/supabaseClient';

// Import tabs (we will create these step by step)
import { DashboardTab } from './tabs/DashboardTab';
import { TenantsTab } from './tabs/TenantsTab';
import { MeterReadingTab } from './tabs/MeterReadingTab';
import { PaymentsTab } from './tabs/PaymentsTab';
import { UnassignedPaymentsTab } from './tabs/UnassignedPaymentsTab';
import { AddTenantTab } from './tabs/AddTenantTab';
import { GenerateInvoiceTab } from './tabs/GenerateInvoiceTab';
import { SupportTab } from './tabs/SupportTab';
import { SettingsTab } from './tabs/SettingsTab';

export default function AgentPortalPage() {
  const [activeTab, setActiveTab] = useState<AgentTab>('dashboard');
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [unassignedCount, setUnassignedCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const res = await fetch('/agent/api/profile', { headers, cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
          setProperties(data.properties || []);
        }

        // Fetch unassigned payments count for badge
        const payRes = await fetch('/agent/api/payments?status=under_review', { headers, cache: 'no-store' });
        if (payRes.ok) {
          const payData = await payRes.json();
          setUnassignedCount((payData.payments || []).length);
        }
      } catch (err) {
        console.error('Failed to load agent portal data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab propertyId={selectedPropertyId} />;
      case 'meter-readings':
        return <MeterReadingTab propertyId={selectedPropertyId} />;
      case 'generate-invoice':
        return <GenerateInvoiceTab propertyId={selectedPropertyId} />;
      case 'add-tenant':
        return <AddTenantTab propertyId={selectedPropertyId} />;
      case 'tenants':
        return <TenantsTab propertyId={selectedPropertyId} />;
      case 'payments':
        return <PaymentsTab propertyId={selectedPropertyId} />;
      case 'unassigned-payments':
        return <UnassignedPaymentsTab propertyId={selectedPropertyId} />;
      case 'support':
        return <SupportTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTab propertyId={selectedPropertyId} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-medium">
        Loading Agent Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} unassignedCount={unassignedCount} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          profile={profile} 
          selectedPropertyId={selectedPropertyId} 
          onSelectProperty={setSelectedPropertyId} 
          properties={properties} 
        />
        <main className="flex-1 p-8 overflow-y-auto">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}