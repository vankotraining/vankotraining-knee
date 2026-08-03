-- Add client-scoped Tindeq records to the existing Knee application.
-- The client is selected before import; no separate prescription table or name matching is required.

alter table public.tindeq_sessions
  add column if not exists exercise_side text,
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
  add column if not exists import_fingerprint text;

DO $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'tindeq_sessions_reference_test_id_fkey'
      and conrelid = 'public.tindeq_sessions'::regclass
  ) then
    alter table public.tindeq_sessions
      add constraint tindeq_sessions_reference_test_id_fkey
      foreign key (reference_test_id)
      references public.knee_extension_tests(id)
      on delete set null;
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
        (
          reference_test_id is null
          and reference_test_date is null
          and reference_force_kg is null
          and prescribed_pct is null
          and prescribed_target_force_kg is null
        )
        or
        (
          reference_test_id is not null
          and reference_test_date is not null
          and reference_force_kg > 0
          and prescribed_pct is null
          and prescribed_target_force_kg is null
        )
        or
        (
          reference_test_id is not null
          and reference_test_date is not null
          and reference_force_kg > 0
          and prescribed_pct > 0
          and prescribed_target_force_kg > 0
          and abs(
            prescribed_target_force_kg
            - (reference_force_kg * prescribed_pct / 100)
          ) <= 0.0001
        )
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
end $$;

create unique index if not exists tindeq_sessions_active_import_fingerprint_uidx
  on public.tindeq_sessions (athlete_id, import_fingerprint)
  where deleted_at is null and import_fingerprint is not null;

create index if not exists tindeq_sessions_reference_test_idx
  on public.tindeq_sessions (reference_test_id)
  where deleted_at is null and reference_test_id is not null;

revoke all on table public.tindeq_sessions from anon;
grant select, insert on table public.tindeq_sessions to authenticated;
grant update (
  deleted_at,
  deleted_by,
  deleted_context,
  delete_reason,
  updated_at,
  updated_by
) on table public.tindeq_sessions to authenticated;

DROP POLICY IF EXISTS tindeq_sessions_insert_authenticated
  on public.tindeq_sessions;
create policy tindeq_sessions_insert_authenticated
  on public.tindeq_sessions
  for insert
  to authenticated
  with check (
    is_knee_admin()
    and exists (
      select 1
      from public.athletes athlete
      where athlete.id = tindeq_sessions.athlete_id
        and athlete.deleted_at is null
    )
    and (
      tindeq_sessions.reference_test_id is null
      or exists (
        select 1
        from public.knee_extension_tests test
        where test.id = tindeq_sessions.reference_test_id
          and test.athlete_id = tindeq_sessions.athlete_id
          and test.test_date = tindeq_sessions.reference_test_date
          and test.deleted_at is null
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
      select 1
      from public.athletes athlete
      where athlete.id = tindeq_sessions.athlete_id
        and athlete.deleted_at is null
    )
    and (
      tindeq_sessions.reference_test_id is null
      or exists (
        select 1
        from public.knee_extension_tests test
        where test.id = tindeq_sessions.reference_test_id
          and test.athlete_id = tindeq_sessions.athlete_id
          and test.test_date = tindeq_sessions.reference_test_date
          and test.deleted_at is null
      )
    )
  );

notify pgrst, 'reload schema';
