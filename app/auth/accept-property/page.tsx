// app/auth/accept-property/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AcceptPropertyPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'success' | 'error' | 'processing'>('processing');
  const [message, setMessage] = useState('Verifying your property access invitation...');

  useEffect(() => {
    async function processAcceptance() {
      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing invitation token.');
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // If not logged in, store token in session storage and redirect to login
        sessionStorage.setItem('pending_invite_token', token);
        router.push(`/auth/login?redirect=/auth/accept-property?token=${token}`);
        return;
      }

      try {
        // Call backend API to claim the invitation and link properties
        const res = await fetch('/api/admin/claim-property-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, userId: user.id }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to link properties.');
        }

        setStatus('success');
        setMessage('Properties successfully linked to your account! Redirecting to your dashboard...');
        
        setTimeout(() => {
          router.push(json.role === 'owner' ? '/owner/dashboard' : '/property-manager/dashboard');
        }, 2500);

      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'An error occurred while accepting the invitation.');
      } finally {
        setLoading(false);
      }
    }

    processAcceptance();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
        {status === 'processing' && <Loader2 className="animate-spin text-indigo-500 mx-auto" size={36} />}
        {status === 'success' && <CheckCircle2 className="text-emerald-400 mx-auto" size={36} />}
        {status === 'error' && <AlertCircle className="text-rose-500 mx-auto" size={36} />}

        <h2 className="text-xl font-bold">Property Access Linking</h2>
        <p className="text-xs text-slate-300">{message}</p>
      </div>
    </div>
  );
}