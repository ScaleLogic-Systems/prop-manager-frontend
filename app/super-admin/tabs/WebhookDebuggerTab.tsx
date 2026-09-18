// app/super-admin/tabs/WebhookDebuggerTab.tsx
'use client';

import React, { useState } from 'react';
import { RotateCw, Code2 } from 'lucide-react';
import { FailedWebhook } from '../types';

const MOCK_FAILED_WEBHOOKS: FailedWebhook[] = [
  {
    id: 'wh_9021',
    source: 'mpesa_c2b',
    endpoint: '/api/v1/mpesa/c2b/callback',
    payload: {
      TransactionType: 'Pay Bill',
      TransID: 'RKT92104KS',
      TransAmount: '45000',
      BusinessShortCode: '600100',
      BillRefNumber: 'HOUSE-B4',
      MSISDN: '254712345678',
    },
    error_message: 'Unassigned Account: Unit reference HOUSE-B4 not matched to active lease.',
    retry_count: 2,
    created_at: '2026-09-18T12:00:00.000Z',
  },
];

export const WebhookDebuggerTab: React.FC = () => {
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [selectedPayload, setSelectedPayload] = useState<Record<string, unknown> | null>(null);

  const handleReplay = async (id: string) => {
    setReplayingId(id);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setReplayingId(null);
    alert(`Webhook [${id}] replayed and routed successfully!`);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Callbacks List */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm">Dropped Callbacks ({MOCK_FAILED_WEBHOOKS.length})</h3>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
              DLQ Monitored
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {MOCK_FAILED_WEBHOOKS.map((wh) => (
              <div key={wh.id} className="py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase font-mono">
                      {wh.source}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-200">{wh.endpoint}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(wh.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs text-rose-400 font-medium bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  {wh.error_message}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setSelectedPayload(wh.payload)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Code2 size={14} /> View Raw Payload
                  </button>

                  <button
                    onClick={() => handleReplay(wh.id)}
                    disabled={replayingId === wh.id}
                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCw size={13} className={replayingId === wh.id ? 'animate-spin' : ''} />
                    {replayingId === wh.id ? 'Replaying...' : 'Replay Callback'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* JSON Inspector */}
        <div className="bg-slate-900 border border-slate-800 text-slate-200 rounded-2xl p-5 space-y-3 font-mono text-xs shadow-xl">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2.5">
            <span className="font-bold text-white text-xs">JSON Inspector</span>
            <Code2 size={16} className="text-slate-400" />
          </div>
          {selectedPayload ? (
            <pre className="overflow-x-auto text-emerald-400 bg-slate-950 p-4 rounded-xl text-[11px] border border-slate-800/80">
              {JSON.stringify(selectedPayload, null, 2)}
            </pre>
          ) : (
            <div className="text-slate-500 py-16 text-center text-xs">
              Select <span className="text-indigo-400">&quot;View Raw Payload&quot;</span> to inspect payload body.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};