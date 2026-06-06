-- Grant API roles access to portal tables (run once if seed/login fails with permission denied)

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;

grant all on all sequences in schema public to postgres, service_role;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
grant all on tables to postgres, service_role;

alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;
