-- Run after applying 20260803_tindeq_client_workflow.sql to a non-production database.

select table_name, row_security_active
from (
  select c.relname as table_name, c.relrowsecurity as row_security_active
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in ('athletes', 'athlete_profiles', 'knee_extension_tests', 'tindeq_prescriptions', 'tindeq_sessions')
) checked
order by table_name;

select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('tindeq_prescriptions', 'tindeq_sessions')
order by tablename, policyname;

select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'tindeq_sessions_active_import_fingerprint_uidx',
    'tindeq_prescriptions_active_athlete_idx'
  )
order by indexname;

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid in (
  'public.tindeq_prescriptions'::regclass,
  'public.tindeq_sessions'::regclass
)
  and conname in (
    'tindeq_prescriptions_target_formula',
    'tindeq_sessions_reference_snapshot_complete',
    'tindeq_sessions_pain_range',
    'tindeq_sessions_prescription_id_fkey',
    'tindeq_sessions_reference_test_id_fkey'
  )
order by conname;
