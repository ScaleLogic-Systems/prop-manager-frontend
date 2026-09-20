create policy "Property stakeholders can create change audit logs"
on public.property_change_audit_logs
for insert to authenticated
with check (
  actor_profile_id = auth.uid()
  and exists (
    select 1 from public.properties p
    where p.id = property_change_audit_logs.property_id
      and (p.owner_id = auth.uid() or p.property_manager_id = auth.uid() or p.caretaker_id = auth.uid())
  )
);

create policy "Invoice issuers can create invoice audit logs"
on public.invoice_audit_logs
for insert to authenticated
with check (actor_profile_id = auth.uid());
