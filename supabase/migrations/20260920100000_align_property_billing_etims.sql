-- Align property billing with a canonical eTIMS invoice model.
-- Existing invoice_items and legacy invoice amount columns remain for backward compatibility.

alter table public.units
  add column if not exists use_type text not null default 'residential',
  add column if not exists vat_treatment public.kra_tax_category not null default 'A_EXEMPT',
  add column if not exists vat_rate numeric(5,4) not null default 0.0000;

alter table public.units
  add constraint units_use_type_check
  check (use_type in ('residential', 'commercial', 'mixed', 'other'))
  not valid;

alter table public.units
  add constraint units_vat_rate_check
  check (vat_rate >= 0 and vat_rate <= 1)
  not valid;

comment on column public.units.use_type is 'Actual leasing/use classification for the unit.';
comment on column public.units.vat_treatment is 'VAT treatment selected for this unit or charge.';
comment on column public.units.vat_rate is 'VAT rate as a decimal, for example 0.1600 for 16 percent.';

create table if not exists public.property_utility_types (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  billing_method text not null default 'fixed',
  default_amount numeric(12,2),
  default_tax_treatment public.kra_tax_category not null default 'A_EXEMPT',
  default_vat_rate numeric(5,4) not null default 0.0000,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint property_utility_types_name_check check (length(trim(name)) > 0),
  constraint property_utility_types_code_check check (code ~ '^[a-z0-9][a-z0-9_-]*$'),
  constraint property_utility_types_billing_method_check check (billing_method in ('fixed', 'metered', 'variable')),
  constraint property_utility_types_amount_check check (default_amount is null or default_amount >= 0),
  constraint property_utility_types_vat_rate_check check (default_vat_rate >= 0 and default_vat_rate <= 1),
  unique (property_id, code)
);

comment on table public.property_utility_types is 'Owner/property-manager-defined utility and service catalog for a property.';

create table if not exists public.unit_utility_charges (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  utility_type_id uuid not null references public.property_utility_types(id) on delete cascade,
  amount numeric(12,2),
  rate_per_unit numeric(12,4),
  tax_treatment public.kra_tax_category,
  vat_rate numeric(5,4),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unit_utility_charges_amount_check check (amount is null or amount >= 0),
  constraint unit_utility_charges_rate_check check (rate_per_unit is null or rate_per_unit >= 0),
  constraint unit_utility_charges_vat_rate_check check (vat_rate is null or (vat_rate >= 0 and vat_rate <= 1)),
  unique (unit_id, utility_type_id)
);

comment on table public.unit_utility_charges is 'Per-unit utility/service values configured by the property owner or manager.';

alter table public.invoices
  add column if not exists invoice_number text,
  add column if not exists invoice_type text not null default 'rent',
  add column if not exists currency_code text not null default 'KES',
  add column if not exists billing_period_start date,
  add column if not exists billing_period_end date,
  add column if not exists customer_name text,
  add column if not exists customer_kra_pin varchar(20),
  add column if not exists issuer_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists subtotal_amount numeric(12,2) not null default 0,
  add column if not exists taxable_amount numeric(12,2) not null default 0,
  add column if not exists exempt_amount numeric(12,2) not null default 0,
  add column if not exists non_vat_amount numeric(12,2) not null default 0,
  add column if not exists vat_amount numeric(12,2) not null default 0,
  add column if not exists grand_total numeric(12,2),
  add column if not exists line_items jsonb not null default '[]'::jsonb,
  add column if not exists tax_summary jsonb not null default '{}'::jsonb,
  add column if not exists etims_request jsonb,
  add column if not exists etims_response jsonb,
  add column if not exists etims_result_code text,
  add column if not exists etims_attempts integer not null default 0,
  add column if not exists issued_at timestamptz,
  add column if not exists transmitted_at timestamptz;

update public.invoices
set grand_total = coalesce(grand_total, total_amount, 0),
    customer_name = coalesce(customer_name, ''),
    issuer_profile_id = coalesce(issuer_profile_id, issued_by),
    subtotal_amount = case when subtotal_amount = 0 then coalesce(total_amount, 0) else subtotal_amount end
where grand_total is null
   or customer_name is null
   or issuer_profile_id is null
   or subtotal_amount = 0;

alter table public.invoices
  alter column grand_total set default 0,
  alter column grand_total set not null,
  add constraint invoices_invoice_type_check
    check (invoice_type in ('rent', 'utility', 'water', 'deposit', 'service_charge', 'credit_note', 'other')) not valid,
  add constraint invoices_currency_code_check
    check (currency_code = 'KES') not valid,
  add constraint invoices_amounts_check
    check (subtotal_amount >= 0 and taxable_amount >= 0 and exempt_amount >= 0 and non_vat_amount >= 0 and vat_amount >= 0 and grand_total >= 0) not valid,
  add constraint invoices_line_items_object_check
    check (jsonb_typeof(line_items) = 'array') not valid;

create unique index if not exists invoices_invoice_number_key
  on public.invoices (invoice_number)
  where invoice_number is not null;

create index if not exists idx_invoices_tenant_period
  on public.invoices (tenant_id, billing_period_start, billing_period_end);

create index if not exists idx_invoices_issuer_profile
  on public.invoices (issuer_profile_id);

create index if not exists idx_property_utility_types_property
  on public.property_utility_types (property_id, is_active);

create index if not exists idx_unit_utility_charges_unit
  on public.unit_utility_charges (unit_id, is_active);

alter table public.property_utility_types enable row level security;
alter table public.unit_utility_charges enable row level security;

create policy "Property stakeholders manage utility types"
on public.property_utility_types
for all to authenticated
using (
  exists (
    select 1 from public.properties p
    where p.id = property_utility_types.property_id
      and (p.owner_id = auth.uid() or p.property_manager_id = auth.uid())
  )
)
with check (
  exists (
    select 1 from public.properties p
    where p.id = property_utility_types.property_id
      and (p.owner_id = auth.uid() or p.property_manager_id = auth.uid())
  )
);

create policy "Property stakeholders manage unit utility charges"
on public.unit_utility_charges
for all to authenticated
using (
  exists (
    select 1
    from public.units u
    join public.properties p on p.id = u.property_id
    where u.id = unit_utility_charges.unit_id
      and (p.owner_id = auth.uid() or p.property_manager_id = auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.units u
    join public.properties p on p.id = u.property_id
    where u.id = unit_utility_charges.unit_id
      and (p.owner_id = auth.uid() or p.property_manager_id = auth.uid())
  )
);

comment on table public.invoices is 'Canonical billing and eTIMS document. line_items is the invoice snapshot; invoice_items remains the normalized audit table during migration.';
comment on column public.invoices.line_items is 'Immutable JSON snapshot of all invoice lines sent for this invoice.';
comment on column public.invoices.tax_summary is 'Immutable JSON snapshot of tax totals and KRA tax categories.';
comment on column public.invoices.etims_request is 'Sanitized request payload sent to eTIMS; never store API secrets here.';
comment on column public.invoices.etims_response is 'Response metadata from eTIMS for audit and retry support.';
