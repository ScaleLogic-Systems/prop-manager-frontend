'use client';

import React, { useEffect, useState } from 'react';
import { OwnerTab } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardTab } from './tabs/DashboardTab';
import AddPropertyTab from './tabs/AddPropertyTab';
import { UserManagementTab } from './tabs/UserManagementTab';
import { TenantsTab } from './tabs/TenantsTab';
import { UnassignedPaymentsTab } from './tabs/UnassignedPaymentsTab';
import { SubscriptionsTab } from './tabs/SubscriptionsTab';
import { MeterReadingTab } from '../caretaker/tabs/MeterReadingTab';
import { createClient } from '@/lib/supabaseClient';

export default function OwnerPage() {
  const [activeTab, setActiveTab] = useState<OwnerTab>('dashboard');
  const [ownerFullName, setOwnerFullName] = useState<string>('Property Owner');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) return;

        if (isMounted) {
          setCurrentUserId(user.id);
        }

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching owner profile:', profileError.message);
          return;
        }

        if (isMounted && data?.full_name) {
          setOwnerFullName(data.full_name);
        }
      } catch (err: unknown) {
        console.error('Failed to resolve owner authentication context:', err);
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'meter-reading':
        return <MeterReadingTab profileId={currentUserId} apiBasePath="/owner/api/unit-meter-readings" creatorRole="owner" />;
      case 'add-property':
        return <AddPropertyTab currentUserId={currentUserId} />;
      case 'users':
        return <UserManagementTab />;
      case 'tenants':
        return <TenantsTab />;
      case 'unassigned-payments':
        return <UnassignedPaymentsTab />;
      case 'subscription':
        return <SubscriptionsTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      {/* 1. SIDEBAR NAVIGATION */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. MAIN LAYOUT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        {/* TOP HEADER */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white pr-6">
          <div className="flex-1">
            <Header fullName={ownerFullName} />
          </div>
        </div>

        {/* TAB CONTENT WRAPPER */}
        <div className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto space-y-6">
          {renderTabContent()}
        </div>
      </main>

    </div>
  );
}