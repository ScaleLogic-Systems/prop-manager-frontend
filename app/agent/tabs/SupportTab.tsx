// app/agent/tabs/SupportTab.tsx
'use client';

import React from 'react';
import { ContactSupportTab } from '@/components/support/ContactSupportTab';

export const SupportTab: React.FC = () => {
  return <ContactSupportTab roleTitle="Property Agent" />;
};