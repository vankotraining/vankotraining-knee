-- Knee data safety migration
-- Purpose:
-- 1. Add soft-delete metadata to client, profile, and knee measurement tables.
-- 2. Add audit logging for changes in these tables.
-- 3. Add safe database functions for deleting/restoring clients and measurements.
--
-- Run this in Supabase SQL editor before wiring the UI to soft delete.

begin;

create extension if not exists pgcrypto;

alter table public.athletes
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid default auth.uid(),
  add column if not exists updated_by uuid,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid,
  add column if not exists deleted_context text,
  add column if not exists delete_reason text;

alter table public.athlete_profiles
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid default auth.uid(),
  add column if not exists updated_by uuid,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid,
  add column if not exists deleted_context text,
  add column if not exists delete_reason text;

alter table public.knee_extension_tests
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists created_by uuid default auth.uid(),
  add column if not exists updated_by uuid,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid,
  add column if not exists deleted_context text,
  add column if not exists delete_reason text;

create index if not exists athletes_active_idx
  on public.athletes (display_name)
  where deleted_at is null;

create index if not exists athlete_profiles_active_athlete_idx
  on public.athlete_profiles (athlete_id, profile_date desc, updated_at desc)
  where deleted_at is null;

create index if not exists knee_extension_tests_active_athlete_idx
  on public.knee_extension_tests (athlete_id, test_date desc, source_row desc)
  where deleted_at is null;

create table if not exists public.knee_audit_log (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  table_name text not null,
  row_id uuid,
  athlete_id uuid,
  old_data jsonb,
  new_data jsonb,
  actor_id uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists knee_audit_log_athlete_idx
  on public.knee_audit_log (athlete_id, created_at desc);

create index if not exists knee_audit_log_row_idx
  on public.knee_audit_log (table_name, row_id, created_at desc);

create or replace function public.set_knee_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

create or replace function public.log_knee_table_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_row_id uuid;
  changed_athlete_id uuid;
begin
  changed_row_id := coalesce(new.id, old.id);

  if tg_table_name = 'athletes' then
    changed_athlete_id := coalesce(new.id, old.id);
  else
    changed_athlete_id := coalesce(new.athlete_id, old.athlete_id);
  end if;

  insert into public.knee_audit_log (
    action,
    table_name,
    row_id,
    athlete_id,
    old_data,
    new_data,
    actor_id
  ) values (
    tg_op,
    tg_table_name,
    changed_row_id,
    changed_athlete_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    auth.uid()
  );

  return coalesce(new, old);
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'athletes_set_updated_at') then
    create trigger athletes_set_updated_at
      before update on public.athletes
      for each row execute function public.set_knee_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'athlete_profiles_set_updated_at') then
    create trigger athlete_profiles_set_updated_at
      before update on public.athlete_profiles
      for each row execute function public.set_knee_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'knee_extension_tests_set_updated_at') then
    create trigger knee_extension_tests_set_updated_at
      before update on public.knee_extension_tests
      for each row execute function public.set_knee_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'athletes_audit_log') then
    create trigger athletes_audit_log
      after insert or update or delete on public.athletes
      for each row execute function public.log_knee_table_change();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'athlete_profiles_audit_log') then
    create trigger athlete_profiles_audit_log
      after insert or update or delete on public.athlete_profiles
      for each row execute function public.log_knee_table_change();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'knee_extension_tests_audit_log') then
    create trigger knee_extension_tests_audit_log
      after insert or update or delete on public.knee_extension_tests
      for each row execute function public.log_knee_table_change();
  end if;
end;
$$;

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
