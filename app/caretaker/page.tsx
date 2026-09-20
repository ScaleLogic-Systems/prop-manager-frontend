'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Gauge, 
  UserPlus, 
  History, 
  Wrench,
  DollarSign,
  LogOut,
  FileText
} from 'lucide-react';

import { DashboardTab } from './tabs/DashboardTab';
import { MeterReadingTab } from './tabs/MeterReadingTab';
import { InvoiceGenerationTab } from '@/components/InvoiceGenerationTab';
import { AddTenantTab } from './tabs/AddTenantTab';
import { PaymentsTab } from './tabs/PaymentsTab';
import { UnassignedPaymentsTab } from './tabs/UnassignedPaymentsTab';

export type CaretakerTab = 
  | 'dashboard' 
  | 'meter' 
  | 'generate-invoice'
  | 'add-tenant' 
  | 'payments' 
  | 'unassigned-payments' 
  | 'requests' 
  | 'settings';

interface CaretakerProfile {
  id?: string;
  full_name: string;
  assigned_property_id?: string;
  assigned_property_name?: string;
}

export default function CaretakerPortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<CaretakerTab>('dashboard');
  const [profile, setProfile] = useState<CaretakerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch('/caretaker/api/profile', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.profile) {
            setProfile(data.profile);
          }
        }
      } catch (err) {
        console.error('Failed to fetch caretaker profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white mb-1 tracking-wide flex items-center gap-2">
            <Wrench className="text-emerald-400" size={22} />
            Caretaker Portal
          </h1>
          <p className="text-xs text-slate-400 mb-8">Property Management</p>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('meter')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'meter'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Gauge size={18} />
              Meter Readings
            </button>

            <button
              onClick={() => setActiveTab('generate-invoice')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'generate-invoice'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText size={18} />
              Generate Invoice
            </button>

            <button
              onClick={() => setActiveTab('add-tenant')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'add-tenant'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserPlus size={18} />
              Add Tenant
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'payments'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History size={18} />
              Payment History
            </button>

            <button
              onClick={() => setActiveTab('unassigned-payments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'unassigned-payments'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <DollarSign size={18} />
              Unassigned Payments
            </button>
          </nav>
        </div>

        {/* Footer Area: Logout & Version */}
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
          >
            <LogOut size={18} />
            Log Out
          </button>

          <div className="text-xs text-slate-500 px-4">
            Caretaker Mode v1.0.0
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Profile Header */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-emerald-700">
              {loading ? (
                <span className="animate-pulse text-gray-400">Loading user profile...</span>
              ) : (
                `Welcome Back, ${profile?.full_name ? profile.full_name : 'Caretaker'}`
              )}
            </h2>
            <p className="text-sm font-medium text-gray-600 mt-1">
              Assigned Property:{' '}
              <span className="font-semibold text-gray-800">
                {profile?.assigned_property_name || 'No assigned property record found'}
              </span>
            </p>
          </div>

        </div>

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <DashboardTab 
            propertyId={profile?.assigned_property_id} 
            propertyName={profile?.assigned_property_name} 
          />
        )}
        {activeTab === 'meter' && (
          <MeterReadingTab
            propertyId={profile?.assigned_property_id}
            profileId={profile?.id}
          />
        )}
        {activeTab === 'generate-invoice' && <InvoiceGenerationTab role="caretaker" />}
        {activeTab === 'add-tenant' && (
          <AddTenantTab propertyId={profile?.assigned_property_id} />
        )}
        {activeTab === 'payments' && (
          <PaymentsTab propertyId={profile?.assigned_property_id} />
        )}
        {activeTab === 'unassigned-payments' && (
          <UnassignedPaymentsTab propertyId={profile?.assigned_property_id} />
        )}
      </main>

    </div>
  );
}