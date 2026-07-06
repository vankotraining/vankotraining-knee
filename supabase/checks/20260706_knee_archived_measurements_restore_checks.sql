-- Archived knee measurement restore verification checks
-- Run after supabase/migrations/20260706_knee_archived_measurements_restore.sql.

-- 1. Restore archive listing RPC must exist.
select
  proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname = 'list_archived_knee_extension_tests';

-- 2. Authenticated role must be allowed to execute the archive listing RPC.
select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name = 'list_archived_knee_extension_tests'
  and grantee = 'authenticated'
order by routine_name, privilege_type;

-- 3. Restore RPC should still be present.
select
  proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname = 'restore_knee_extension_test';
