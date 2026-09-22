// app/tenant/tabs/SettingsTab.tsx
'use client';

import React from 'react';
import { AccountSettingsTab } from '@/components/settings/AccountSettingsTab';

export function SettingsTab() {
  return <AccountSettingsTab roleTitle="Tenant" />;
}