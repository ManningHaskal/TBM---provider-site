-- Add super_admin role for account management powers.

alter table public.providers
  drop constraint if exists providers_role_check;

alter table public.providers
  add constraint providers_role_check
  check (role in ('provider', 'admin', 'super_admin'));

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
      and role in ('admin', 'super_admin')
  )
$$;
