-- Update patients table to match provider portal field requirements

alter table public.patients
  add column if not exists full_name text,
  add column if not exists weight text,
  add column if not exists height text,
  add column if not exists sex text;

update public.patients
set full_name = trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
where full_name is null;

alter table public.patients
  alter column full_name set not null;

alter table public.patients
  drop column if exists first_name,
  drop column if exists last_name;

alter table public.patients
  drop column if exists extra_fields;
