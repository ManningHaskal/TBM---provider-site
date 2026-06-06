-- Clinic and order shipping addresses

alter table public.providers
  add column if not exists clinic_shipping_address text;

alter table public.orders
  add column if not exists ship_to text check (ship_to in ('clinic', 'patient')),
  add column if not exists shipping_address text;

create policy "Providers can update own profile"
  on public.providers
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
