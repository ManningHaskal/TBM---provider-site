-- Replace weight/height with allergies on patient records

alter table public.patients
  add column if not exists allergies text;

alter table public.patients
  drop column if exists weight,
  drop column if exists height;
