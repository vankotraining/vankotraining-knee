-- Tindeq Repeaters Stage 1
-- Creates private raw ZIP storage, session/repetition/error tables and strict RLS.
-- The current Knee deployment is single-account; owner_user_id provides account scope.

begin;

create extension if not exists pgcrypto;

create table if not exists public.tindeq_repeaters_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null default auth.uid() references auth.users(id),
  athlete_id uuid references public.athletes(id) on delete set null,
  original_tag text,
  normalized_tag text,
  test_datetime timestamptz,
  protocol_type text,
  left_mvc numeric,
  right_mvc numeric,
  work_percentage numeric,
  left_target numeric,
  right_target numeric,
  work_duration_seconds numeric,
  rest_duration_seconds numeric,
  planned_repetitions integer,
  detected_repetitions integer not null default 0,
  sampling_frequency_hz numeric,
  unit text not null default 'kg',
  file_hash text not null,
  storage_path text not null,
  raw_metadata jsonb not null default '{}'::jsonb,
  summary_metrics jsonb not null default '{}'::jsonb,
  pain_during smallint,
  rpe smallint,
  clinical_note text,
  analysis_version text not null,
  parser_version text not null,
  segmentation_version text not null,
  metrics_version text not null,
  analyzed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tindeq_repeaters_file_hash_unique unique (owner_user_id, file_hash),
  constraint tindeq_repeaters_pain_check check (pain_during is null or pain_during between 0 and 10),
  constraint tindeq_repeaters_rpe_check check (rpe is null or rpe between 0 and 10),
  constraint tindeq_repeaters_work_percentage_check check (work_percentage is null or work_percentage between 0 and 200),
  constraint tindeq_repeaters_repetition_count_check check (
    (planned_repetitions is null or planned_repetitions >= 0)
    and detected_repetitions >= 0
  )
);

create table if not exists public.tindeq_repetitions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.tindeq_repeaters_sessions(id) on delete cascade,
  repetition_number integer not null,
  is_valid boolean not null default true,
  work_start_seconds numeric not null,
  work_end_seconds numeric not null,
  left_metrics jsonb not null default '{}'::jsonb,
  right_metrics jsonb not null default '{}'::jsonb,
  bilateral_metrics jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint tindeq_repetition_number_unique unique (session_id, repetition_number),
  constraint tindeq_repetition_time_check check (work_end_seconds >= work_start_seconds)
);

create table if not exists public.tindeq_import_errors (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null default auth.uid() references auth.users(id),
  file_name text,
  file_hash text,
  error_code text not null,
  user_message text not null,
  technical_detail text,
  created_at timestamptz not null default now()
);

create index if not exists tindeq_repeaters_athlete_datetime_idx
  on public.tindeq_repeaters_sessions (athlete_id, test_datetime desc nulls last, created_at desc);
create index if not exists tindeq_repeaters_unassigned_idx
  on public.tindeq_repeaters_sessions (created_at desc)
  where athlete_id is null;
create index if not exists tindeq_repetitions_session_idx
  on public.tindeq_repetitions (session_id, repetition_number);
create index if not exists tindeq_import_errors_owner_idx
  on public.tindeq_import_errors (owner_user_id, created_at desc);

create or replace function public.set_tindeq_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tindeq_repeaters_set_updated_at on public.tindeq_repeaters_sessions;
create trigger tindeq_repeaters_set_updated_at
  before update on public.tindeq_repeaters_sessions
  for each row execute function public.set_tindeq_updated_at();

alter table public.tindeq_repeaters_sessions enable row level security;
alter table public.tindeq_repetitions enable row level security;
alter table public.tindeq_import_errors enable row level security;

revoke all on public.tindeq_repeaters_sessions from anon;
revoke all on public.tindeq_repetitions from anon;
revoke all on public.tindeq_import_errors from anon;
grant select, insert, update, delete on public.tindeq_repeaters_sessions to authenticated;
grant select, insert, update, delete on public.tindeq_repetitions to authenticated;
grant select, insert on public.tindeq_import_errors to authenticated;

drop policy if exists tindeq_repeaters_select_owner on public.tindeq_repeaters_sessions;
create policy tindeq_repeaters_select_owner
  on public.tindeq_repeaters_sessions for select to authenticated
  using (public.is_knee_admin() and owner_user_id = (select auth.uid()));

drop policy if exists tindeq_repeaters_insert_owner on public.tindeq_repeaters_sessions;
create policy tindeq_repeaters_insert_owner
  on public.tindeq_repeaters_sessions for insert to authenticated
  with check (public.is_knee_admin() and owner_user_id = (select auth.uid()));

drop policy if exists tindeq_repeaters_update_owner on public.tindeq_repeaters_sessions;
create policy tindeq_repeaters_update_owner
  on public.tindeq_repeaters_sessions for update to authenticated
  using (public.is_knee_admin() and owner_user_id = (select auth.uid()))
  with check (public.is_knee_admin() and owner_user_id = (select auth.uid()));

drop policy if exists tindeq_repeaters_delete_owner on public.tindeq_repeaters_sessions;
create policy tindeq_repeaters_delete_owner
  on public.tindeq_repeaters_sessions for delete to authenticated
  using (public.is_knee_admin() and owner_user_id = (select auth.uid()));

drop policy if exists tindeq_repetitions_select_owner on public.tindeq_repetitions;
create policy tindeq_repetitions_select_owner
  on public.tindeq_repetitions for select to authenticated
  using (exists (
    select 1 from public.tindeq_repeaters_sessions session
    where session.id = session_id
      and session.owner_user_id = (select auth.uid())
      and public.is_knee_admin()
  ));

drop policy if exists tindeq_repetitions_insert_owner on public.tindeq_repetitions;
create policy tindeq_repetitions_insert_owner
  on public.tindeq_repetitions for insert to authenticated
  with check (exists (
    select 1 from public.tindeq_repeaters_sessions session
    where session.id = session_id
      and session.owner_user_id = (select auth.uid())
      and public.is_knee_admin()
  ));

drop policy if exists tindeq_repetitions_update_owner on public.tindeq_repetitions;
create policy tindeq_repetitions_update_owner
  on public.tindeq_repetitions for update to authenticated
  using (exists (
    select 1 from public.tindeq_repeaters_sessions session
    where session.id = session_id
      and session.owner_user_id = (select auth.uid())
      and public.is_knee_admin()
  ))
  with check (exists (
    select 1 from public.tindeq_repeaters_sessions session
    where session.id = session_id
      and session.owner_user_id = (select auth.uid())
      and public.is_knee_admin()
  ));

drop policy if exists tindeq_repetitions_delete_owner on public.tindeq_repetitions;
create policy tindeq_repetitions_delete_owner
  on public.tindeq_repetitions for delete to authenticated
  using (exists (
    select 1 from public.tindeq_repeaters_sessions session
    where session.id = session_id
      and session.owner_user_id = (select auth.uid())
      and public.is_knee_admin()
  ));

drop policy if exists tindeq_import_errors_select_owner on public.tindeq_import_errors;
create policy tindeq_import_errors_select_owner
  on public.tindeq_import_errors for select to authenticated
  using (public.is_knee_admin() and owner_user_id = (select auth.uid()));

drop policy if exists tindeq_import_errors_insert_owner on public.tindeq_import_errors;
create policy tindeq_import_errors_insert_owner
  on public.tindeq_import_errors for insert to authenticated
  with check (public.is_knee_admin() and owner_user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tindeq-raw',
  'tindeq-raw',
  false,
  26214400,
  array['application/zip', 'application/x-zip-compressed']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists tindeq_raw_select_owner on storage.objects;
create policy tindeq_raw_select_owner
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tindeq-raw'
    and public.is_knee_admin()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists tindeq_raw_insert_owner on storage.objects;
create policy tindeq_raw_insert_owner
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tindeq-raw'
    and public.is_knee_admin()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists tindeq_raw_delete_owner on storage.objects;
create policy tindeq_raw_delete_owner
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'tindeq-raw'
    and public.is_knee_admin()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

notify pgrst, 'reload schema';
commit;
