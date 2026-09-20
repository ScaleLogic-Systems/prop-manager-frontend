-- Enforce one invoice scope per unit and billing period, with an immutable issuer audit trail.

alter table public.invoices
  add column if not exists billing_key text not null default 'rent';

alter table public.invoices
  add constraint invoices_billing_key_check
  check (billing_key ~ '^[a-z0-9][a-z0-9_-]*$')
  not valid;

create unique index if not exists invoices_unit_period_key
  on public.invoices (unit_id, billing_period_start, billing_period_end, billing_key)
  where unit_id is not null
    and billing_period_start is not null
    and billing_period_end is not null;

create table if not exists public.invoice_audit_logs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  actor_profile_id uuid not null references public.profiles(id) on delete restrict,
  actor_name_snapshot text not null,
  action text not null,
  changed_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint invoice_audit_logs_action_check check (action in ('created', 'updated', 'cancelled', 'transmitted', 'credit_noted'))
);

create index if not exists idx_invoice_audit_logs_invoice
  on public.invoice_audit_logs (invoice_id, created_at desc);

create index if not exists idx_invoice_audit_logs_actor
  on public.invoice_audit_logs (actor_profile_id, created_at desc);

alter table public.invoice_audit_logs enable row level security;

create policy "Invoice stakeholders can view audit logs"
on public.invoice_audit_logs
for select to authenticated
using (
  exists (
    select 1
    from public.invoices i
    join public.properties p on p.id = i.property_id
    where i.id = invoice_audit_logs.invoice_id
      and (
        p.owner_id = auth.uid()
        or p.property_manager_id = auth.uid()
        or p.caretaker_id = auth.uid()
        or invoice_audit_logs.actor_profile_id = auth.uid()
      )
  )
);

comment on column public.invoices.billing_key is 'Business scope for duplicate prevention, such as rent, utilities, deposit, or a custom invoice group.';
comment on table public.invoice_audit_logs is 'Immutable accountability history for every invoice action and issuer.';
