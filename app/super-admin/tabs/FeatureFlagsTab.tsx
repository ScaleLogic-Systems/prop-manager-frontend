// app/super-admin/tabs/FeatureFlagsTab.tsx
'use client';

import React, { useState } from 'react';
import { ToggleRight, ToggleLeft } from 'lucide-react';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  min_tier: 'starter' | 'growth' | 'enterprise';
  enabled_globally: boolean;
}

export const FeatureFlagsTab: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([
    {
      id: 'ff_1',
      key: 'whatsapp_bot_automation',
      name: 'WhatsApp Bot Integration',
      description: 'Allows tenants to query balances and download rent receipts via WhatsApp automated bot.',
      min_tier: 'growth',
      enabled_globally: true,
    },
    {
      id: 'ff_2',
      key: 'ai_emailer_module',
      name: 'AI Emailer & Dispute Summarizer',
      description: 'Uses AI to draft tenant payment reminders and summarize maintenance requests.',
      min_tier: 'enterprise',
      enabled_globally: true,
    },
    {
      id: 'ff_3',
      key: 'auto_mpesa_stk_push',
      name: 'Automated Monthly STK Push',
      description: 'Triggers automated M-Pesa STK push prompts to tenants on rent due date.',
      min_tier: 'growth',
      enabled_globally: false,
    },
  ]);

  const toggleFlag = (id: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled_globally: !f.enabled_globally } : f))
    );
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-6 space-y-4">
        <div className="divide-y divide-slate-800/80">
          {flags.map((flag) => (
            <div key={flag.id} className="py-4.5 flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{flag.name}</span>
                  <span className="font-mono text-[10px] bg-slate-950 text-amber-400 border border-slate-800 px-2.5 py-0.5 rounded-full uppercase font-bold">
                    {flag.min_tier}+ Tier
                  </span>
                </div>
                <p className="text-xs text-slate-400">{flag.description}</p>
                <code className="text-[10px] text-indigo-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded font-mono inline-block">
                  {flag.key}
                </code>
              </div>

              <button
                onClick={() => toggleFlag(flag.id)}
                className="shrink-0 p-1 hover:opacity-90 transition cursor-pointer"
                title={flag.enabled_globally ? 'Disable Globally' : 'Enable Globally'}
              >
                {flag.enabled_globally ? (
                  <ToggleRight size={40} className="text-amber-500" />
                ) : (
                  <ToggleLeft size={40} className="text-slate-600" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};