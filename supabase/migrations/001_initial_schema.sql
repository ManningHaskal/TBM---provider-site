-- TexBioMed Provider Portal initial schema

create extension if not exists "pgcrypto";

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text not null,
  practice_name text not null,
  phone text,
  clinic_shipping_address text,
  role text not null default 'provider' check (role in ('provider', 'admin')),
  created_at timestamptz not null default now()
);

create table public.invite_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  created_by uuid references public.providers(id) on delete set null,
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references public.providers(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete cascade not null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  date_of_birth text,
  weight text,
  height text,
  sex text,
  shipping_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete cascade not null,
  patient_id uuid references public.patients(id) on delete restrict not null,
  notes text,
  ship_to text check (ship_to in ('clinic', 'patient')),
  shipping_address text,
  sync_error text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_name text not null,
  product_sku text not null,
  unit_price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0)
);

create index patients_provider_id_idx on public.patients (provider_id);
create index orders_provider_id_idx on public.orders (provider_id);
create index orders_patient_id_idx on public.orders (patient_id);
create index orders_created_at_idx on public.orders (created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);
create index invite_tokens_token_hash_idx on public.invite_tokens (token_hash);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger patients_updated_at
before update on public.patients
for each row
execute function public.set_updated_at();

create or replace function public.current_provider_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.providers where user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.providers
    where user_id = auth.uid()
      and role = 'admin'
  )
$$;

alter table public.providers enable row level security;
alter table public.invite_tokens enable row level security;
alter table public.patients enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Providers can read own profile"
  on public.providers
  for select
  using (user_id = auth.uid());

create policy "Providers can update own profile"
  on public.providers
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can read all providers"
  on public.providers
  for select
  using (public.is_admin());

create policy "Providers manage own patients"
  on public.patients
  for all
  using (provider_id = public.current_provider_id())
  with check (provider_id = public.current_provider_id());

create policy "Providers manage own orders"
  on public.orders
  for all
  using (provider_id = public.current_provider_id())
  with check (provider_id = public.current_provider_id());

create policy "Providers manage own order items"
  on public.order_items
  for all
  using (
    exists (
      select 1
      from public.orders o
      where o.id = order_id
        and o.provider_id = public.current_provider_id()
    )
  )
  with check (
    exists (
      select 1
      from public.orders o
      where o.id = order_id
        and o.provider_id = public.current_provider_id()
    )
  );

create policy "Admins manage invite tokens"
  on public.invite_tokens
  for all
  using (public.is_admin())
  with check (public.is_admin());

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;

grant all on all sequences in schema public to postgres, service_role;
grant usage, select on all sequences in schema public to authenticated;
