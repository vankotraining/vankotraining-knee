-- Align the development Tindeq table back to the canonical ZIP-only schema.
-- Intended target for phase 4: dev project twndqnmrvefhwuwuglju.
-- Production already has the canonical shape and must not be migrated without explicit approval.

begin;

-- Policies added by the abandoned PR #15 workflow depend on reference columns.
drop policy if exists tindeq_sessions_insert_authenticated on public.tindeq_sessions;
drop policy if exists tindeq_sessions_update_authenticated on public.tindeq_sessions;
drop policy if exists tindeq_sessions_select_authenticated on public.tindeq_sessions;

-- Remove PR #15-only indexes and constraints before dropping their columns.
drop index if exists public.tindeq_sessions_active_import_fingerprint_uidx;
drop index if exists public.tindeq_sessions_reference_test_idx;

alter table public.tindeq_sessions
  drop constraint if exists tindeq_sessions_exercise_side_valid,
  drop constraint if exists tindeq_sessions_pain_range,
  drop constraint if exists tindeq_sessions_reference_snapshot_complete,
  drop constraint if exists tindeq_sessions_reference_test_id_fkey,
  drop constraint if exists tindeq_sessions_workflow_metrics_nonnegative;

alter table public.tindeq_sessions
  drop column if exists exercise_side,
  drop column if exists reference_test_id,
  drop column if exists reference_test_date,
  drop column if exists reference_force_kg,
  drop column if exists prescribed_pct,
  drop column if exists prescribed_target_force_kg,
  drop column if exists mean_force_kg,
  drop column if exists best_rep_force_kg,
  drop column if exists weakest_rep_force_kg,
  drop column if exists mean_pct_reference,
  drop column if exists mean_pct_target,
  drop column if exists consistency_cv_pct,
  drop column if exists first_to_last_change_pct_points,
  drop column if exists total_work_seconds,
  drop column if exists pain_before,
  drop column if exists pain_during_max,
  drop column if exists pain_after,
  drop column if exists import_fingerprint;

-- Match the canonical production privilege boundary exactly.
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

create policy tindeq_sessions_select_authenticated
  on public.tindeq_sessions
  for select
  to authenticated
  using (public.is_knee_admin() and deleted_at is null);

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

create policy tindeq_sessions_update_authenticated
  on public.tindeq_sessions
  for update
  to authenticated
  using (public.is_knee_admin() and deleted_at is null)
  with check (public.is_knee_admin());

notify pgrst, 'reload schema';

commit;
