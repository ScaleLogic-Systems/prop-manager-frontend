// components/modals/RemoveUserModal.tsx
'use client';

import React, { useState } from 'react';
import { ShieldAlert, Loader2, X } from 'lucide-react';

interface RemoveUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetUserId: string;
  targetName: string;
  targetRole: string;
  propertyId?: string;
  unitId?: string;
}

export function RemoveUserModal({
  isOpen,
  onClose,
  onSuccess,
  targetUserId,
  targetName,
  targetRole,
  propertyId,
  unitId,
}: RemoveUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRemove = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          targetRole,
          propertyId,
          unitId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove user.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Confirm User Removal</h3>
            <p className="text-xs text-slate-500 capitalize">
              Role: <span className="font-semibold text-slate-700">{targetRole.replace('_', ' ')}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-sm">
          <p className="text-slate-700 text-xs leading-relaxed">
            Are you sure you want to remove <span className="font-bold text-slate-900">{targetName}</span>? 
            {targetRole === 'tenant' && (
              <span className="block mt-1 text-emerald-700 font-medium">
                ℹ️ This will automatically mark their assigned unit as vacant while preserving all historical payment records.
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs uppercase tracking-wider shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Confirm Removal
          </button>
        </div>
      </div>
    </div>
  );
}