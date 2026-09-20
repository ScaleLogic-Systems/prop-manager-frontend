create table if not exists public.property_change_audit_logs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  actor_profile_id uuid not null references public.profiles(id) on delete restrict,
  actor_name_snapshot text not null,
  action text not null default 'updated',
  changed_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint property_change_audit_action_check check (action in ('created', 'updated', 'assigned', 'unassigned'))
);

create index if not exists idx_property_change_audit_property on public.property_change_audit_logs(property_id, created_at desc);
create index if not exists idx_property_change_audit_unit on public.property_change_audit_logs(unit_id, created_at desc);

alter table public.property_change_audit_logs enable row level security;

create policy "Property stakeholders can view change audit logs"
on public.property_change_audit_logs
for select to authenticated
using (
  actor_profile_id = auth.uid()
  or exists (
    select 1 from public.properties p
    where p.id = property_change_audit_logs.property_id
      and (p.owner_id = auth.uid() or p.property_manager_id = auth.uid() or p.caretaker_id = auth.uid())
  )
);

comment on table public.property_change_audit_logs is 'Immutable record of property and unit changes, including actor name and changed fields.';
