'use client';

import React from 'react';
import { Phone, Mail, MapPin, Clock, Headphones, ShieldCheck, ExternalLink } from 'lucide-react';

interface ContactSupportTabProps {
  roleTitle: string;
}

export const ContactSupportTab: React.FC<ContactSupportTabProps> = ({ roleTitle }) => {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@propmanager.co.ke';
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+254700000000';
  const officeAddress = process.env.NEXT_PUBLIC_OFFICE_ADDRESS || 'Scalelogic Systems HQ, Nairobi, Kenya';
  const supportHours = process.env.NEXT_PUBLIC_SUPPORT_HOURS || 'Monday – Friday: 8:00 AM – 5:00 PM EAT';

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Help & Office Support</h1>
        <p className="text-sm text-slate-300 mt-1 font-medium">
          Need assistance with your {roleTitle.toLowerCase()} portal? Reach out to our central administration office directly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Call Office Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Phone size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Call Our Office</h3>
            <p className="text-xs text-slate-400 mt-1">
              Speak directly with our technical and administrative support team for urgent platform issues.
            </p>
            <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-sm font-semibold text-indigo-300">
              {supportPhone}
            </div>
          </div>
          <div className="mt-6">
            <a
              href={`tel:${supportPhone}`}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <span>Call Now</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Email Support Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Mail size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Email Support</h3>
            <p className="text-xs text-slate-400 mt-1">
              Send us detailed inquiries, bug reports, or account questions. We respond within 24 hours.
            </p>
            <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800 text-sm font-semibold text-emerald-300 truncate">
              {supportEmail}
            </div>
          </div>
          <div className="mt-6">
            <a
              href={`mailto:${supportEmail}?subject=Support Request - ${roleTitle}`}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <span>Send Email</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Office Details & Hours Footer Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Headphones size={16} className="text-indigo-400" /> Office Information & Operating Hours
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-300">Physical Office</p>
              <p className="text-slate-400 mt-0.5">{officeAddress}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <Clock size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-300">Support Hours</p>
              <p className="text-slate-400 mt-0.5">{supportHours}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};