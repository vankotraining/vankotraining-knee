-- Knee RLS policies and RPC access hardening
-- Purpose:
-- 1. Restrict knee data access to the internal admin email.
-- 2. Hide archived records from normal app reads.
-- 3. Convert browser DELETE on measurements into a soft delete for backward compatibility.
-- 4. Require the same admin check inside soft-delete/restore RPC functions.
--
-- Run this after supabase/migrations/20260706_knee_data_safety.sql.

begin;

create or replace function public.is_knee_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'martin@vankotraining.cz';
$$;

grant execute on function public.is_knee_admin() to authenticated;

alter table public.athletes enable row level security;
alter table public.athlete_profiles enable row level security;
alter table public.knee_extension_tests enable row level security;
alter table public.knee_audit_log enable row level security;

-- Client records: the internal admin can read active records, create, and update.
-- No DELETE policy is created intentionally; archival must use soft-delete functions.
drop policy if exists athletes_select_authenticated on public.athletes;
create policy athletes_select_authenticated
  on public.athletes
  for select
  to authenticated
  using (public.is_knee_admin() and deleted_at is null);

drop policy if exists athletes_insert_authenticated on public.athletes;
create policy athletes_insert_authenticated
  on public.athletes
  for insert
  to authenticated
  with check (public.is_knee_admin());

drop policy if exists athletes_update_authenticated on public.athletes;
create policy athletes_update_authenticated
  on public.athletes
  for update
  to authenticated
  using (public.is_knee_admin())
  with check (public.is_knee_admin());

-- Athlete profiles: the internal admin can read active records, create, and update.
drop policy if exists athlete_profiles_select_authenticated on public.athlete_profiles;
create policy athlete_profiles_select_authenticated
  on public.athlete_profiles
  for select
  to authenticated
  using (public.is_knee_admin() and deleted_at is null);

drop policy if exists athlete_profiles_insert_authenticated on public.athlete_profiles;
create policy athlete_profiles_insert_authenticated
  on public.athlete_profiles
  for insert
  to authenticated
  with check (public.is_knee_admin());

drop policy if exists athlete_profiles_update_authenticated on public.athlete_profiles;
create policy athlete_profiles_update_authenticated
  on public.athlete_profiles
  for update
  to authenticated
  using (public.is_knee_admin())
  with check (public.is_knee_admin());

-- Knee measurements: the internal admin can read active records, create, update,
-- and call the legacy browser delete path. A trigger converts that delete into archival.
drop policy if exists knee_extension_tests_select_authenticated on public.knee_extension_tests;
create policy knee_extension_tests_select_authenticated
  on public.knee_extension_tests
  for select
  to authenticated
  using (public.is_knee_admin() and deleted_at is null);

drop policy if exists knee_extension_tests_insert_authenticated on public.knee_extension_tests;
create policy knee_extension_tests_insert_authenticated
  on public.knee_extension_tests
  for insert
  to authenticated
  with check (public.is_knee_admin());

drop policy if exists knee_extension_tests_update_authenticated on public.knee_extension_tests;
create policy knee_extension_tests_update_authenticated
  on public.knee_extension_tests
  for update
  to authenticated
  using (public.is_knee_admin())
  with check (public.is_knee_admin());

drop policy if exists knee_extension_tests_delete_authenticated on public.knee_extension_tests;
create policy knee_extension_tests_delete_authenticated
  on public.knee_extension_tests
  for delete
  to authenticated
  using (public.is_knee_admin() and deleted_at is null);

-- Audit log is readable to the internal admin. Direct writes stay unavailable.
drop policy if exists knee_audit_log_select_authenticated on public.knee_audit_log;
create policy knee_audit_log_select_authenticated
  on public.knee_audit_log
  for select
  to authenticated
  using (public.is_knee_admin());

create or replace function public.soft_delete_knee_extension_test(
  p_test_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_knee_admin() then
    raise exception 'Not authorized';
  end if;

  if not exists (
    select 1
    from public.knee_extension_tests
    where id = p_test_id
      and deleted_at is null
  ) then
    raise exception 'Measurement not found or already deleted';
  end if;

  update public.knee_extension_tests
  set deleted_at = now(),
      deleted_by = auth.uid(),
      deleted_context = 'measurement',
      delete_reason = p_reason
  where id = p_test_id
    and deleted_at is null;
end;
$$;

create or replace function public.soft_delete_knee_extension_test_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_knee_admin() then
    raise exception 'Not authorized';
  end if;

  update public.knee_extension_tests
  set deleted_at = now(),
      deleted_by = auth.uid(),
      deleted_context = 'measurement',
      delete_reason = 'Archived through legacy delete action'
  where id = old.id
    and deleted_at is null;

  return null;
end;
$$;

drop trigger if exists knee_extension_tests_soft_delete_on_delete on public.knee_extension_tests;
create trigger knee_extension_tests_soft_delete_on_delete
  before delete on public.knee_extension_tests
  for each row execute function public.soft_delete_knee_extension_test_on_delete();

create or replace function public.restore_knee_extension_test(p_test_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_knee_admin() then
    raise exception 'Not authorized';
  end if;

  update public.knee_extension_tests
  set deleted_at = null,
      deleted_by = null,
      deleted_context = null,
      delete_reason = null
  where id = p_test_id;
end;
$$;

create or replace function public.soft_delete_athlete(
  p_athlete_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_knee_admin() then
    raise exception 'Not authorized';
  end if;

  if not exists (
    select 1
    from public.athletes
    where id = p_athlete_id
      and deleted_at is null
  ) then
    raise exception 'Client not found or already deleted';
  end if;

  update public.knee_extension_tests
  set deleted_at = now(),
      deleted_by = auth.uid(),
      deleted_context = 'athlete',
      delete_reason = p_reason
  where athlete_id = p_athlete_id
    and deleted_at is null;

  update public.athlete_profiles
  set deleted_at = now(),
      deleted_by = auth.uid(),
      deleted_context = 'athlete',
      delete_reason = p_reason
  where athlete_id = p_athlete_id
    and deleted_at is null;

  update public.athletes
  set deleted_at = now(),
      deleted_by = auth.uid(),
      deleted_context = 'athlete',
      delete_reason = p_reason
  where id = p_athlete_id
    and deleted_at is null;
end;
$$;

create or replace function public.restore_athlete(p_athlete_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_knee_admin() then
    raise exception 'Not authorized';
  end if;

  update public.athletes
  set deleted_at = null,
      deleted_by = null,
      deleted_context = null,
      delete_reason = null
  where id = p_athlete_id;

  update public.athlete_profiles
  set deleted_at = null,
      deleted_by = null,
      deleted_context = null,
      delete_reason = null
  where athlete_id = p_athlete_id
    and deleted_context = 'athlete';

  update public.knee_extension_tests
  set deleted_at = null,
      deleted_by = null,
      deleted_context = null,
      delete_reason = null
  where athlete_id = p_athlete_id
    and deleted_context = 'athlete';
end;
$$;

grant execute on function public.soft_delete_knee_extension_test(uuid, text) to authenticated;
grant execute on function public.restore_knee_extension_test(uuid) to authenticated;
grant execute on function public.soft_delete_athlete(uuid, text) to authenticated;
grant execute on function public.restore_athlete(uuid) to authenticated;

commit;
