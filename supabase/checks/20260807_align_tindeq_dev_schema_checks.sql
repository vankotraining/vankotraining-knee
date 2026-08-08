-- Read-only phase 4 verification for the canonical ZIP-only Tindeq schema.

with expected_columns(name) as (
  values
    ('id'), ('athlete_id'), ('measured_at'), ('imported_at'),
    ('source_filename'), ('source_dataset_name'), ('source_tag'), ('protocol_name'),
    ('target_force_left_kg'), ('target_force_right_kg'), ('sampling_rate_hz'),
    ('detected_repetitions'), ('expected_repetitions'), ('left_summary'), ('right_summary'),
    ('overall_summary'), ('repetitions'), ('warnings'), ('analysis_version'), ('raw_metadata'),
    ('created_at'), ('updated_at'), ('created_by'), ('updated_by'), ('deleted_at'),
    ('deleted_by'), ('deleted_context'), ('delete_reason')
), actual_columns as (
  select column_name as name
  from information_schema.columns
  where table_schema = 'public' and table_name = 'tindeq_sessions'
)
select
  (select count(*) from actual_columns) as actual_column_count,
  (select array_agg(name order by name) from expected_columns where name not in (select name from actual_columns)) as missing_columns,
  (select array_agg(name order by name) from actual_columns where name not in (select name from expected_columns)) as extra_columns;

select indexname, indexdef
from pg_indexes
where schemaname = 'public' and tablename = 'tindeq_sessions'
order by indexname;

select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'tindeq_sessions'
order by policyname;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'tindeq_sessions'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

select array_agg(column_name order by column_name) as authenticated_update_columns
from information_schema.column_privileges
where table_schema = 'public'
  and table_name = 'tindeq_sessions'
  and grantee = 'authenticated'
  and privilege_type = 'UPDATE';

select
  count(*) as tindeq_rows,
  count(*) filter (where deleted_at is null) as active_tindeq_rows
from public.tindeq_sessions;
