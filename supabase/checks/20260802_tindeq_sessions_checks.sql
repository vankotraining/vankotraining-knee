-- Verification queries for 20260802_tindeq_sessions.sql.
-- Run only after the migration has been explicitly approved and applied.

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'tindeq_sessions';

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tindeq_sessions'
order by ordinal_position;

select
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.tindeq_sessions'::regclass
order by conname;

select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'tindeq_sessions'
order by indexname;

select
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'tindeq_sessions'
order by policyname;

select
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'tindeq_sessions'
order by grantee, privilege_type;

select
  trigger_name,
  action_timing,
  event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table = 'tindeq_sessions'
order by trigger_name, event_manipulation;

select
  proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in (
    'soft_delete_tindeq_session',
    'restore_tindeq_session',
    'soft_delete_athlete',
    'restore_athlete'
  )
order by proname, arguments;
