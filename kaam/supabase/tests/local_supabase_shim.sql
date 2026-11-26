-- LOCAL TESTING ONLY. Do not run this on Supabase.
--
-- A minimal stand-in for what Supabase provides, so the migration and the
-- access-rule tests can run against plain Postgres: the anon / authenticated
-- roles, auth.users, auth.uid() and the supabase_realtime publication.

-- Roles belong to the whole server, so create them only once.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

create schema auth;
grant usage on schema auth to anon, authenticated;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

-- Supabase reads the signed-in user from the request's JWT claims.
create function auth.uid() returns uuid language sql stable as $$
  select nullif(coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  ), '')::uuid
$$;
grant execute on function auth.uid() to anon, authenticated;

create publication supabase_realtime;
