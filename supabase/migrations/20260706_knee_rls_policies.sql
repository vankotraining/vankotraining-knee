-- Knee RLS policies
-- Purpose:
-- 1. Require an authenticated Supabase user for knee data access.
-- 2. Keep physical DELETE unavailable from the browser client.
-- 3. Let soft-delete SECURITY DEFINER functions handle archival safely.
--
-- Run this after supabase/migrations/20260706_knee_data_safety.sql.

begin;

alter table public.athletes enable row level security;
alter table public.athlete_profiles enable row level security;
alter table public.knee_extension_tests enable row level security;
alter table public.knee_audit_log enable row level security;

-- Client records: authenticated trainer can read, create, and update.
-- No DELETE policy is created intentionally; archival must use soft-delete functions.
drop policy if exists athletes_select_authenticated on public.athletes;
create policy athletes_select_authenticated
  on public.athletes
  for select
  to authenticated
  using (true);

drop policy if exists athletes_insert_authenticated on public.athletes;
create policy athletes_insert_authenticated
  on public.athletes
  for insert
  to authenticated
  with check (true);

drop policy if exists athletes_update_authenticated on public.athletes;
create policy athletes_update_authenticated
  on public.athletes
  for update
  to authenticated
  using (true)
  with check (true);

-- Athlete profiles: authenticated trainer can read, create, and update.
drop policy if exists athlete_profiles_select_authenticated on public.athlete_profiles;
create policy athlete_profiles_select_authenticated
  on public.athlete_profiles
  for select
  to authenticated
  using (true);

drop policy if exists athlete_profiles_insert_authenticated on public.athlete_profiles;
create policy athlete_profiles_insert_authenticated
  on public.athlete_profiles
  for insert
  to authenticated
  with check (true);

drop policy if exists athlete_profiles_update_authenticated on public.athlete_profiles;
create policy athlete_profiles_update_authenticated
  on public.athlete_profiles
  for update
  to authenticated
  using (true)
  with check (true);

-- Knee measurements: authenticated trainer can read, create, and update.
-- No DELETE policy is created intentionally; use soft_delete_knee_extension_test().
drop policy if exists knee_extension_tests_select_authenticated on public.knee_extension_tests;
create policy knee_extension_tests_select_authenticated
  on public.knee_extension_tests
  for select
  to authenticated
  using (true);

drop policy if exists knee_extension_tests_insert_authenticated on public.knee_extension_tests;
create policy knee_extension_tests_insert_authenticated
  on public.knee_extension_tests
  for insert
  to authenticated
  with check (true);

drop policy if exists knee_extension_tests_update_authenticated on public.knee_extension_tests;
create policy knee_extension_tests_update_authenticated
  on public.knee_extension_tests
  for update
  to authenticated
  using (true)
  with check (true);

-- Audit log is readable to authenticated users. Direct writes stay unavailable.
drop policy if exists knee_audit_log_select_authenticated on public.knee_audit_log;
create policy knee_audit_log_select_authenticated
  on public.knee_audit_log
  for select
  to authenticated
  using (true);

commit;
