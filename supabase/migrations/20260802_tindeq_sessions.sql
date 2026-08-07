-- Persist normalized Tindeq Repeaters results against existing athletes.
-- This migration is prepared for review only. Do not run against the shared
-- production project without explicit approval.

begin;

create extension if not exists pgcrypto;

create table if not exists public.tindeq_sessions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  measured_at timestamptz not null,
  imported_at timestamptz not null default now(),
  source_filename text not null,
  source_dataset_name text not null,
  source_tag text,
  protocol_name text,
  target_force_left_kg numeric,
  target_force_right_kg numeric,
  sampling_rate_hz numeric,
  detected_repetitions integer not null,
  expected_repetitions integer not null,
  left_summary jsonb not null,
  right_summary jsonb not null,
  overall_summary jsonb not null,
  repetitions jsonb not null,
  warnings jsonb not null default '[]'::jsonb,
  analysis_version text not null,
  raw_metadata jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  deleted_context text,
  delete_reason text,
  constraint tindeq_sessions_source_filename_not_blank
    check (length(trim(source_filename)) > 0),
  constraint tindeq_sessions_source_dataset_name_not_blank
    check (length(trim(source_dataset_name)) > 0),
  constraint tindeq_sessions_analysis_version_not_blank
    check (length(trim(analysis_version)) > 0),
  constraint tindeq_sessions_target_left_positive
    check (target_force_left_kg is null or target_force_left_kg > 0),
  constraint tindeq_sessions_target_right_positive
    check (target_force_right_kg is null or target_force_right_kg > 0),
  constraint tindeq_sessions_sampling_rate_positive
    check (sampling_rate_hz is null or sampling_rate_hz > 0),
  constraint tindeq_sessions_detected_repetitions_positive
    check (detected_repetitions > 0),
  constraint tindeq_sessions_expected_repetitions_positive
    check (expected_repetitions > 0),
  constraint tindeq_sessions_left_summary_object
    check (jsonb_typeof(left_summary) = 'object'),
  constraint tindeq_sessions_right_summary_object
    check (jsonb_typeof(right_summary) = 'object'),
  constraint tindeq_sessions_overall_summary_object
    check (jsonb_typeof(overall_summary) = 'object'),
  constraint tindeq_sessions_repetitions_array
    check (jsonb_typeof(repetitions) = 'array' and jsonb_array_length(repetitions) > 0),
  constraint tindeq_sessions_warnings_array
    check (jsonb_typeof(warnings) = 'array'),
  constraint tindeq_sessions_raw_metadata_object
    check (jsonb_typeof(raw_metadata) = 'object')
);

create index if not exists tindeq_sessions_active_athlete_measured_idx
  on public.tindeq_sessions (athlete_id, measured_at desc, created_at desc)
  where deleted_at is null;

create index if not exists tindeq_sessions_analysis_version_idx
  on public.tindeq_sessions (analysis_version);

alter table public.tindeq_sessions enable row level security;

revoke all on table public.tindeq_sessions from anon, authenticated;
grant select, insert on table public.tindeq_sessions to authenticated;
grant update (
  deleted_at,
  deleted_by,
  deleted_context,
  delete_reason,
  updated_at,
  updated_by
) on table public.tindeq_sessions to authenticated;

drop policy if exists tindeq_sessions_select_authenticated on public.tindeq_sessions;
create policy tindeq_sessions_select_authenticated
  on public.tindeq_sessions
  for select
  to authenticated
  using (public.is_knee_admin() and deleted_at is null);

drop policy if exists tindeq_sessions_insert_authenticated on public.tindeq_sessions;
create policy tindeq_sessions_insert_authenticated
  on public.tindeq_sessions
  for insert
  to authenticated
  with check (
    public.is_knee_admin()
    and exists (
      select 1
      from public.athletes athlete
      where athlete.id = athlete_id
        and athlete.deleted_at is null
    )
  );

drop policy if exists tindeq_sessions_update_authenticated on public.tindeq_sessions;
create policy tindeq_sessions_update_authenticated
  on public.tindeq_sessions
  for update
  to authenticated
  using (public.is_knee_admin() and deleted_at is null)
  with check (public.is_knee_admin());

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'tindeq_sessions_set_updated_at') then
    create trigger tindeq_sessions_set_updated_at
      before update on public.tindeq_sessions
      for each row execute function public.set_knee_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'tindeq_sessions_audit_log') then
    create trigger tindeq_sessions_audit_log
      after insert or update or delete on public.tindeq_sessions
      for each row execute function public.log_knee_table_change();
  end if;
end;
$$;

create or replace function public.soft_delete_tindeq_session(
  p_session_id uuid,
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

  update public.tindeq_sessions
  set deleted_at = now(),
      deleted_by = auth.uid(),
      deleted_context = 'measurement',
      delete_reason = p_reason
  where id = p_session_id
    and deleted_at is null;

  if not found then
    raise exception 'Tindeq measurement not found or already deleted';
  end if;
end;
$$;

create or replace function public.restore_tindeq_session(p_session_id uuid)
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

  update public.tindeq_sessions
  set deleted_at = null,
      deleted_by = null,
      deleted_context = null,
      delete_reason = null
  where id = p_session_id;
end;
$$;

revoke all on function public.soft_delete_tindeq_session(uuid, text) from public, anon;
revoke all on function public.restore_tindeq_session(uuid) from public, anon;
grant execute on function public.soft_delete_tindeq_session(uuid, text) to authenticated;
grant execute on function public.restore_tindeq_session(uuid) to authenticated;

-- Keep athlete-level soft delete consistent with all athlete-owned measurements.
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

  update public.tindeq_sessions
  set deleted_at = now(),
      deleted_by = auth.uid(),
      deleted_context = 'athlete',
      delete_reason = p_reason
  where athlete_id = p_athlete_id
    and deleted_at is null;

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

  update public.tindeq_sessions
  set deleted_at = null,
      deleted_by = null,
      deleted_context = null,
      delete_reason = null
  where athlete_id = p_athlete_id
    and deleted_context = 'athlete';
end;
$$;

notify pgrst, 'reload schema';

commit;
