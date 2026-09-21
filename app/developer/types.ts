// app/developer/types.ts

export type DeveloperTab = 
  | 'system-health' 
  | 'api-logs' 
  | 'rbac' 
  | 'audit-logs' 
  | 'feature-flags'
  | 'settings';

export interface ServiceHealth {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency_ms: number;
  last_checked: string;
}

export interface SystemMetric {
  active_sessions: number;
  db_pool_usage_percent: number;
  api_requests_24h: number;
  error_rate_percent: number;
}

export interface AuditLog {
  id: string;
  actor_email: string;
  action: string;
  resource: string;
  ip_address: string;
  created_at: string;
}