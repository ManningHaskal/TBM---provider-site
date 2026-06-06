-- Split patient full_name into first_name and last_name

alter table public.patients
  add column if not exists first_name text,
  add column if not exists last_name text;

update public.patients
set
  first_name = split_part(trim(full_name), ' ', 1),
  last_name = nullif(
    trim(substring(trim(full_name) from length(split_part(trim(full_name), ' ', 1)) + 1)),
    ''
  )
where full_name is not null
  and first_name is null;

update public.patients
set last_name = coalesce(last_name, '')
where first_name is not null
  and last_name is null;

alter table public.patients
  alter column first_name set not null,
  alter column last_name set not null;

alter table public.patients
  drop column if exists full_name;
