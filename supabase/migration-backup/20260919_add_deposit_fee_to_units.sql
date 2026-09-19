alter table public.units
add column if not exists deposit_fee numeric not null default 0;

comment on column public.units.deposit_fee is 'Security deposit configured for the unit, in KES.';
