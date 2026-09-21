'use client';

import React, { useEffect, useState } from 'react';
import { MarketerTab } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardTab } from './tabs/DashboardTab';
import { AddClientsTab } from './tabs/AddClientsTab';
import { AddPropertyTab } from './tabs/AddPropertyTab';
import { AddUserTab } from './tabs/AddUserTab';
import { AccountSettingsTab } from '@/components/settings/AccountSettingsTab';
import { createClient } from '@/lib/supabaseClient';

export default function MarketerPage() {
  const [activeTab, setActiveTab] = useState<MarketerTab>('dashboard');
  const [marketerFullName, setMarketerFullName] = useState<string>('Marketer');
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
          console.error('Error fetching marketer profile:', profileError.message);
          return;
        }

        if (isMounted && data?.full_name) {
          setMarketerFullName(data.full_name);
        }
      } catch (err: unknown) {
        console.error('Failed to resolve marketer authentication context:', err);
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
        return <DashboardTab fullName={marketerFullName} />;
      case 'add-clients':
        return <AddClientsTab fullName={marketerFullName} />;
      case 'add-properties':
        return (
          <AddPropertyTab
            currentUserId={currentUserId}
            fullName={marketerFullName}
          />
        );
      case 'add-user':
        return (
          <AddUserTab
            currentUserId={currentUserId}
            fullName={marketerFullName}
          />
        );
      case 'settings':
        return <AccountSettingsTab roleTitle="Marketer" />;
      default:
        return <DashboardTab fullName={marketerFullName} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-900 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        <Header fullName={marketerFullName} />
        <div className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto space-y-6">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}