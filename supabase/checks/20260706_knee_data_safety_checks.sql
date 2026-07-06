-- Knee data safety verification checks
-- Run after supabase/migrations/20260706_knee_data_safety.sql.

-- 1. Expected safety columns exist on all key tables.
select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('athletes', 'athlete_profiles', 'knee_extension_tests')
  and column_name in (
    'created_at',
    'updated_at',
    'created_by',
    'updated_by',
    'deleted_at',
    'deleted_by',
    'deleted_context',
    'delete_reason'
  )
order by table_name, column_name;

-- 2. Audit table exists.
select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'knee_audit_log'
order by ordinal_position;

-- 3. Triggers are installed.
select
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table in ('athletes', 'athlete_profiles', 'knee_extension_tests')
order by table_name, trigger_name, event;

-- 4. Soft-delete and restore functions are installed.
select
  proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in (
    'soft_delete_athlete',
    'restore_athlete',
    'soft_delete_knee_extension_test',
    'restore_knee_extension_test'
  )
order by proname;

-- 5. Current active/deleted row counts.
select 'athletes' as table_name,
  count(*) filter (where deleted_at is null) as active_rows,
  count(*) filter (where deleted_at is not null) as deleted_rows
from public.athletes
union all
select 'athlete_profiles' as table_name,
  count(*) filter (where deleted_at is null) as active_rows,
  count(*) filter (where deleted_at is not null) as deleted_rows
from public.athlete_profiles
union all
select 'knee_extension_tests' as table_name,
  count(*) filter (where deleted_at is null) as active_rows,
  count(*) filter (where deleted_at is not null) as deleted_rows
from public.knee_extension_tests;
