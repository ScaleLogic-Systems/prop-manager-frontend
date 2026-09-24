// app/tenant/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Phone, LayoutDashboard, History, Receipt, Settings, LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TenantTab, TenantProfile } from './types';
import { DashboardTab } from './tabs/DashboardTab';
import { PaymentsTab } from './tabs/PaymentsTab';
import { ManualPaymentTab } from './tabs/ManualPaymentTab';
import { SettingsTab } from './tabs/SettingsTab';

export default function TenantPortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TenantTab>('dashboard');
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch('/tenant/api/profile', { cache: 'no-store' });
        
        if (res.ok) {
          const data = await res.json();
          if (data?.profile?.full_name) {
            setProfile(data.profile);
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleCallCaretaker = () => {
    if (profile?.caretaker_phone) {
      window.location.href = `tel:${profile.caretaker_phone}`;
    } else {
      alert('No caretaker contact phone is listed for your unit.');
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      setIsLoggingOut(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'payments':
        return <PaymentsTab />;
      case 'manual-payment':
        return <ManualPaymentTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white mb-8 tracking-wide">Tenant Portal</h1>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'payments'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History size={18} />
              Payment History
            </button>
            <button
              onClick={() => setActiveTab('manual-payment')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'manual-payment'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Receipt size={18} />
              Submit M-Pesa Code
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings size={18} />
              Settings
            </button>
          </nav>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition disabled:opacity-50"
          >
            {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
            {isLoggingOut ? 'Logging out...' : 'Log Out'}
          </button>
          <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-800/60">
            © {new Date().getFullYear()} Property Portal
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* HERO HEADER */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-blue-600">
              {loading ? (
                <span className="animate-pulse text-gray-400">Loading user profile...</span>
              ) : (
                `Welcome Back ${profile?.full_name ? `"${profile.full_name}"` : 'Tenant'}`
              )}
            </h2>
            <p className="text-sm font-medium text-gray-600 mt-1">
              {profile?.property_name && profile?.unit_number
                ? `${profile.property_name} — Unit ${profile.unit_number}`
                : profile?.property_name || (profile?.unit_number ? `Unit ${profile.unit_number}` : 'Tenant Account')}
            </p>
          </div>

          {/* CALL CARETAKER BUTTON */}
          {profile?.caretaker_name && (
            <button
              onClick={handleCallCaretaker}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
            >
              <Phone size={16} />
              Call Caretaker ({profile.caretaker_name})
            </button>
          )}
        </div>

        {/* TAB CONTENTS */}
        {renderTabContent()}
      </main>
    </div>
  );
}