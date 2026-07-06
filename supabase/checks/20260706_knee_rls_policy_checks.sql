-- Knee RLS policy verification checks
-- Run after supabase/migrations/20260706_knee_rls_policies.sql.

-- 1. RLS must be enabled on all protected knee tables.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('athletes', 'athlete_profiles', 'knee_extension_tests', 'knee_audit_log')
order by c.relname;

-- 2. Expected policies. There should be no DELETE policy on the data tables.
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('athletes', 'athlete_profiles', 'knee_extension_tests', 'knee_audit_log')
order by tablename, policyname;

-- 3. Admin helper and protected RPC functions must exist.
select
  proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in (
    'is_knee_admin',
    'soft_delete_athlete',
    'restore_athlete',
    'soft_delete_knee_extension_test',
    'restore_knee_extension_test'
  )
order by proname, arguments;

-- 4. Quick red flag check: this should return zero rows.
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('athletes', 'athlete_profiles', 'knee_extension_tests')
  and cmd = 'DELETE';
