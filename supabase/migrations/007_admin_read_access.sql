-- Allow admins to read all patients, orders, and order items for oversight.

create policy "Admins can read all patients"
  on public.patients
  for select
  using (public.is_admin());

create policy "Admins can read all orders"
  on public.orders
  for select
  using (public.is_admin());

create policy "Admins can read all order items"
  on public.order_items
  for select
  using (public.is_admin());
