-- Run after applying 20260803_tindeq_client_workflow.sql to a non-production database.

select c.relname as table_name, c.relrowsecurity as row_security_active
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('athletes', 'knee_extension_tests', 'tindeq_sessions')
order by c.relname;

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'tindeq_sessions'
order by policyname;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'tindeq_sessions_active_import_fingerprint_uidx',
    'tindeq_sessions_reference_test_idx'
  )
order by indexname;

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.tindeq_sessions'::regclass
  and conname in (
    'tindeq_sessions_exercise_side_valid',
    'tindeq_sessions_reference_snapshot_complete',
    'tindeq_sessions_workflow_metrics_nonnegative',
    'tindeq_sessions_pain_range',
    'tindeq_sessions_reference_test_id_fkey'
  )
order by conname;

select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tindeq_sessions'
  and column_name in (
    'exercise_side',
    'reference_test_id',
    'reference_test_date',
    'reference_force_kg',
    'prescribed_pct',
    'prescribed_target_force_kg',
    'mean_force_kg',
    'pain_before',
    'pain_during_max',
    'pain_after',
    'import_fingerprint'
  )
order by column_name;
