create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  singleton_key text not null unique default 'default',
  company_name text,
  cnpj text,
  email text,
  phone text,
  cep text,
  address text,
  city text,
  state text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company_settings enable row level security;

create policy "Authenticated users can read company settings"
on public.company_settings
for select
to authenticated
using (true);

create policy "Authenticated users can insert company settings"
on public.company_settings
for insert
to authenticated
with check (true);

create policy "Authenticated users can update company settings"
on public.company_settings
for update
to authenticated
using (true)
with check (true);

create or replace function public.update_company_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_company_settings_updated_at on public.company_settings;

create trigger trg_company_settings_updated_at
before update on public.company_settings
for each row
execute function public.update_company_settings_updated_at();

insert into public.company_settings (
  singleton_key,
  company_name,
  cnpj,
  email,
  phone,
  cep,
  address,
  city,
  state,
  country
)
values (
  'default',
  'VIP Manuseios Ltda',
  '12.345.678/0001-90',
  'contato@vipmanuseios.com.br',
  '(11) 99999-0000',
  '01310-100',
  'Av. Paulista, 1000',
  'São Paulo',
  'SP',
  'Brasil'
)
on conflict (singleton_key) do nothing;
