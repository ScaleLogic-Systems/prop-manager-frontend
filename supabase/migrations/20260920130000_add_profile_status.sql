alter table public.profiles
  add column if not exists status text not null default 'active';

alter table public.profiles
  add constraint profiles_status_check
  check (status in ('active', 'pending', 'suspended'))
  not valid;

comment on column public.profiles.status is 'Account lifecycle status. Auth email confirmation and password setup are tracked separately.';
