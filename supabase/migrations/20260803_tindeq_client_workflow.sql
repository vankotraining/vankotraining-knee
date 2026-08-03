-- Connected client → maximum measurement → prescription → confirmed Tindeq import.
-- This migration is additive and keeps existing Tindeq sessions readable.

alter table public.knee_extension_tests
  add column if not exists left_moment_nm numeric,
  add column if not exists right_moment_nm numeric,
  add column if not exists source_force_unit text,
  add column if not exists source_left_force numeric,
  add column if not exists source_right_force numeric;

update public.knee_extension_tests
set
  left_moment_nm = coalesce(left_moment_nm, left_force_kg * 9.80665 * (shin_length_cm / 100)),
  right_moment_nm = coalesce(right_moment_nm, right_force_kg * 9.80665 * (shin_length_cm / 100)),
  source_force_unit = coalesce(source_force_unit, 'kg'),
  source_left_force = coalesce(source_left_force, left_force_kg),
  source_right_force = coalesce(source_right_force, right_force_kg)
where shin_length_cm is not null;

update public.knee_extension_tests
set
  source_force_unit = coalesce(source_force_unit, 'kg'),
  source_left_force = coalesce(source_left_force, left_force_kg),
  source_right_force = coalesce(source_right_force, right_force_kg);

alter table public.knee_extension_tests
  alter column source_force_unit set default 'kg';

DO $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'knee_extension_tests_left_moment_positive'
      and conrelid = 'public.knee_extension_tests'::regclass
  ) then
    alter table public.knee_extension_tests
      add constraint knee_extension_tests_left_moment_positive
      check (left_moment_nm is null or left_moment_nm > 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'knee_extension_tests_right_moment_positive'
      and conrelid = 'public.knee_extension_tests'::regclass
  ) then
    alter table public.knee_extension_tests
      add constraint knee_extension_tests_right_moment_positive
      check (right_moment_nm is null or right_moment_nm > 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'knee_extension_tests_source_force_unit_valid'
      and conrelid = 'public.knee_extension_tests'::regclass
  ) then
    alter table public.knee_extension_tests
      add constraint knee_extension_tests_source_force_unit_valid
      check (source_force_unit is null or source_force_unit in ('kg', 'n', 'lb'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'knee_extension_tests_source_forces_positive'
      and conrelid = 'public.knee_extension_tests'::regclass
  ) then
    alter table public.knee_extension_tests
      add constraint knee_extension_tests_source_forces_positive
      check (
        (source_left_force is null or source_left_force > 0)
        and (source_right_force is null or source_right_force > 0)
      );
  end if;
end $$;

create table if not exists public.tindeq_prescriptions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id),
  reference_test_id uuid not null references public.knee_extension_tests(id),
  reference_test_date date not null,
  exercise_side text not null check (exercise_side in ('left', 'right')),
  reference_force_kg numeric not null check (reference_force_kg > 0),
  prescribed_pct numeric not null check (prescribed_pct > 0),
  target_force_kg numeric not null check (target_force_kg > 0),
  force_unit text not null default 'kg' check (force_unit = 'kg'),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid(),
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  deleted_context text,
  delete_reason text,
  constraint tindeq_prescriptions_target_formula check (
    abs(target_force_kg - (reference_force_kg * prescribed_pct / 100)) <= 0.0001
  )
);

alter table public.tindeq_prescriptions enable row level security;

create index if not exists tindeq_prescriptions_active_athlete_idx
  on public.tindeq_prescriptions (athlete_id, created_at desc)
  where deleted_at is null;
create index if not exists tindeq_prescriptions_reference_test_idx
  on public.tindeq_prescriptions (reference_test_id)
  where deleted_at is null;

revoke all on public.tindeq_prescriptions from anon;
grant select, insert, update on public.tindeq_prescriptions to authenticated;

DROP POLICY IF EXISTS tindeq_prescriptions_select_authenticated
  on public.tindeq_prescriptions;
create policy tindeq_prescriptions_select_authenticated
  on public.tindeq_prescriptions
  for select
  to authenticated
  using (is_knee_admin() and deleted_at is null);

DROP POLICY IF EXISTS tindeq_prescriptions_insert_authenticated
  on public.tindeq_prescriptions;
create policy tindeq_prescriptions_insert_authenticated
  on public.tindeq_prescriptions
  for insert
  to authenticated
  with check (
    is_knee_admin()
    and exists (
      select 1 from public.athletes athlete
      where athlete.id = tindeq_prescriptions.athlete_id and athlete.deleted_at is null
    )
    and exists (
      select 1 from public.knee_extension_tests test
      where test.id = tindeq_prescriptions.reference_test_id
        and test.athlete_id = tindeq_prescriptions.athlete_id
        and test.deleted_at is null
    )
  );

DROP POLICY IF EXISTS tindeq_prescriptions_update_authenticated
  on public.tindeq_prescriptions;
create policy tindeq_prescriptions_update_authenticated
  on public.tindeq_prescriptions
  for update
  to authenticated
  using (is_knee_admin())
  with check (
    is_knee_admin()
    and exists (
      select 1 from public.athletes athlete
      where athlete.id = tindeq_prescriptions.athlete_id and athlete.deleted_at is null
    )
    and exists (
      select 1 from public.knee_extension_tests test
      where test.id = tindeq_prescriptions.reference_test_id
        and test.athlete_id = tindeq_prescriptions.athlete_id
        and test.deleted_at is null
    )
  );

alter table public.tindeq_sessions
  add column if not exists exercise_side text,
  add column if not exists prescription_id uuid,
  add column if not exists reference_test_id uuid,
  add column if not exists reference_test_date date,
  add column if not exists reference_force_kg numeric,
  add column if not exists prescribed_pct numeric,
  add column if not exists prescribed_target_force_kg numeric,
  add column if not exists mean_force_kg numeric,
  add column if not exists best_rep_force_kg numeric,
  add column if not exists weakest_rep_force_kg numeric,
  add column if not exists mean_pct_reference numeric,
  add column if not exists mean_pct_target numeric,
  add column if not exists consistency_cv_pct numeric,
  add column if not exists first_to_last_change_pct_points numeric,
  add column if not exists total_work_seconds numeric,
  add column if not exists pain_before numeric,
  add column if not exists pain_during_max numeric,
  add column if not exists pain_after numeric,
  add column if not exists source_client_name text,
  add column if not exists client_match_method text,
  add column if not exists import_fingerprint text;

DO $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tindeq_sessions_prescription_id_fkey'
      and conrelid = 'public.tindeq_sessions'::regclass
  ) then
    alter table public.tindeq_sessions
      add constraint tindeq_sessions_prescription_id_fkey
      foreign key (prescription_id) references public.tindeq_prescriptions(id) on delete set null;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'tindeq_sessions_reference_test_id_fkey'
      and conrelid = 'public.tindeq_sessions'::regclass
  ) then
    alter table public.tindeq_sessions
      add constraint tindeq_sessions_reference_test_id_fkey
      foreign key (reference_test_id) references public.knee_extension_tests(id) on delete set null;
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'tindeq_sessions_exercise_side_valid'
      and conrelid = 'public.tindeq_sessions'::regclass
  ) then
    alter table public.tindeq_sessions
      add constraint tindeq_sessions_exercise_side_valid
      check (exercise_side is null or exercise_side in ('left', 'right'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'tindeq_sessions_reference_snapshot_complete'
      and conrelid = 'public.tindeq_sessions'::regclass
  ) then
    alter table public.tindeq_sessions
      add constraint tindeq_sessions_reference_snapshot_complete
      check (
        (reference_test_id is null
          and reference_test_date is null
          and reference_force_kg is null
          and prescribed_pct is null
          and prescribed_target_force_kg is null)
        or
        (reference_test_id is not null
          and reference_test_date is not null
          and reference_force_kg > 0
          and prescribed_pct > 0
          and prescribed_target_force_kg > 0
          and abs(prescribed_target_force_kg - (reference_force_kg * prescribed_pct / 100)) <= 0.0001)
      );
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'tindeq_sessions_workflow_metrics_nonnegative'
      and conrelid = 'public.tindeq_sessions'::regclass
  ) then
    alter table public.tindeq_sessions
      add constraint tindeq_sessions_workflow_metrics_nonnegative
      check (
        (mean_force_kg is null or mean_force_kg > 0)
        and (best_rep_force_kg is null or best_rep_force_kg > 0)
        and (weakest_rep_force_kg is null or weakest_rep_force_kg > 0)
        and (mean_pct_reference is null or mean_pct_reference >= 0)
        and (mean_pct_target is null or mean_pct_target >= 0)
        and (consistency_cv_pct is null or consistency_cv_pct >= 0)
        and (total_work_seconds is null or total_work_seconds >= 0)
      );
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'tindeq_sessions_pain_range'
      and conrelid = 'public.tindeq_sessions'::regclass
  ) then
    alter table public.tindeq_sessions
      add constraint tindeq_sessions_pain_range
      check (
        (pain_before is null or pain_before between 0 and 10)
        and (pain_during_max is null or pain_during_max between 0 and 10)
        and (pain_after is null or pain_after between 0 and 10)
      );
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'tindeq_sessions_client_match_method_valid'
      and conrelid = 'public.tindeq_sessions'::regclass
  ) then
    alter table public.tindeq_sessions
      add constraint tindeq_sessions_client_match_method_valid
      check (client_match_method is null or client_match_method in ('exact', 'manual'));
  end if;
end $$;

create unique index if not exists tindeq_sessions_active_import_fingerprint_uidx
  on public.tindeq_sessions (athlete_id, import_fingerprint)
  where deleted_at is null and import_fingerprint is not null;
create index if not exists tindeq_sessions_reference_test_idx
  on public.tindeq_sessions (reference_test_id)
  where deleted_at is null;
create index if not exists tindeq_sessions_prescription_idx
  on public.tindeq_sessions (prescription_id)
  where deleted_at is null;

DROP POLICY IF EXISTS tindeq_sessions_insert_authenticated
  on public.tindeq_sessions;
create policy tindeq_sessions_insert_authenticated
  on public.tindeq_sessions
  for insert
  to authenticated
  with check (
    is_knee_admin()
    and exists (
      select 1 from public.athletes athlete
      where athlete.id = tindeq_sessions.athlete_id and athlete.deleted_at is null
    )
    and (
      tindeq_sessions.reference_test_id is null
      or exists (
        select 1 from public.knee_extension_tests test
        where test.id = tindeq_sessions.reference_test_id
          and test.athlete_id = tindeq_sessions.athlete_id
          and test.deleted_at is null
      )
    )
    and (
      tindeq_sessions.prescription_id is null
      or exists (
        select 1 from public.tindeq_prescriptions prescription
        where prescription.id = tindeq_sessions.prescription_id
          and prescription.athlete_id = tindeq_sessions.athlete_id
          and prescription.exercise_side = tindeq_sessions.exercise_side
          and prescription.deleted_at is null
      )
    )
  );

DROP POLICY IF EXISTS tindeq_sessions_update_authenticated
  on public.tindeq_sessions;
create policy tindeq_sessions_update_authenticated
  on public.tindeq_sessions
  for update
  to authenticated
  using (is_knee_admin() and deleted_at is null)
  with check (
    is_knee_admin()
    and exists (
      select 1 from public.athletes athlete
      where athlete.id = tindeq_sessions.athlete_id and athlete.deleted_at is null
    )
    and (
      tindeq_sessions.reference_test_id is null
      or exists (
        select 1 from public.knee_extension_tests test
        where test.id = tindeq_sessions.reference_test_id
          and test.athlete_id = tindeq_sessions.athlete_id
          and test.deleted_at is null
      )
    )
    and (
      tindeq_sessions.prescription_id is null
      or exists (
        select 1 from public.tindeq_prescriptions prescription
        where prescription.id = tindeq_sessions.prescription_id
          and prescription.athlete_id = tindeq_sessions.athlete_id
          and prescription.exercise_side = tindeq_sessions.exercise_side
          and prescription.deleted_at is null
      )
    )
  );
