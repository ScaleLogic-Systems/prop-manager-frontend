"use client";

import { useState, FormEvent } from "react";
import { createClient } from "@/lib/supabaseClient";
import { X, Mail, Shield, Building } from "lucide-react";

interface PropertyOption {
  id: string;
  name: string;
}

interface SendInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PropertyOption[];
}

export default function SendInviteModal({ isOpen, onClose, properties }: SendInviteModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "owner">("manager");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePropertyToggle = (propertyId: string) => {
    if (selectedPropertyIds.includes(propertyId)) {
      setSelectedPropertyIds(selectedPropertyIds.filter((id) => id !== propertyId));
    } else {
      setSelectedPropertyIds([...selectedPropertyIds, propertyId]);
    }
  };

  const handleSendInvite = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/owner/api/send-invite", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: email.trim(),
          role,
          propertyIds: selectedPropertyIds,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to send invitation.");
      }

      setSuccess(`Invitation successfully sent to ${email.trim()}`);
      setEmail("");
      setRole("manager");
      setSelectedPropertyIds([]);
      
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred while sending the invite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Invite Owner / Manager</h3>
              <p className="text-xs text-gray-500">Grant portal access to a new team member or partner.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

        <form onSubmit={handleSendInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="colleague@example.com"
              className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Shield size={16} className="text-gray-500" />
              Role Permission *
            </label>
            <select
              required
              className="w-full border rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value as "manager" | "owner")}
            >
              <option value="manager">Property Manager (Operational Access)</option>
              <option value="owner">Co-Owner (Financial & Full Access)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Building size={16} className="text-gray-500" />
              Assign Properties
            </label>
            <p className="text-xs text-gray-500 mb-2">Select which properties this user can manage.</p>
            
            {properties.length === 0 ? (
              <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg border">No properties available to assign.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto border rounded-lg divide-y bg-gray-50/50 p-2 space-y-1">
                {properties.map((prop) => (
                  <label key={prop.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedPropertyIds.includes(prop.id)}
                      onChange={() => handlePropertyToggle(prop.id)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-gray-800 font-medium">{prop.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="border px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:bg-gray-400 transition"
            >
              {loading ? "Sending Invite..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}