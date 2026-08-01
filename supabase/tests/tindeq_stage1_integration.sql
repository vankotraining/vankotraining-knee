\set ON_ERROR_STOP on

create or replace function pg_temp.assert_true(condition boolean, message text)
returns void
language plpgsql
as $$
begin
  if condition is not true then
    raise exception 'ASSERTION FAILED: %', message;
  end if;
end;
$$;

begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', 'owner-one@example.test', '{}'::jsonb),
  ('22222222-2222-4222-8222-222222222222', 'owner-two@example.test', '{}'::jsonb)
on conflict (id) do nothing;

select pg_temp.assert_true(
  (select relrowsecurity from pg_class where oid = 'public.tindeq_repeaters_sessions'::regclass),
  'RLS must be enabled on tindeq_repeaters_sessions'
);
select pg_temp.assert_true(
  (select relrowsecurity from pg_class where oid = 'public.tindeq_repetitions'::regclass),
  'RLS must be enabled on tindeq_repetitions'
);
select pg_temp.assert_true(
  (select relrowsecurity from pg_class where oid = 'public.tindeq_import_errors'::regclass),
  'RLS must be enabled on tindeq_import_errors'
);
select pg_temp.assert_true(
  not has_table_privilege('anon', 'public.tindeq_repeaters_sessions', 'select'),
  'anon must not have SELECT on sessions'
);
select pg_temp.assert_true(
  has_table_privilege('authenticated', 'public.tindeq_repeaters_sessions', 'select'),
  'authenticated must have SELECT before RLS filtering'
);
select pg_temp.assert_true(
  (select count(*) >= 11 from pg_policies
   where (schemaname = 'public' and tablename in ('tindeq_repeaters_sessions', 'tindeq_repetitions', 'tindeq_import_errors'))
      or (schemaname = 'storage' and tablename = 'objects' and policyname like 'tindeq_raw_%')),
  'expected Tindeq table and Storage policies were not created'
);
select pg_temp.assert_true(
  (select public is false from storage.buckets where id = 'tindeq-raw'),
  'tindeq-raw bucket must be private'
);
select pg_temp.assert_true(
  (select file_size_limit = 26214400 from storage.buckets where id = 'tindeq-raw'),
  'tindeq-raw file limit must be 25 MiB'
);
select pg_temp.assert_true(
  (select 'application/zip' = any(allowed_mime_types) from storage.buckets where id = 'tindeq-raw'),
  'tindeq-raw must allow application/zip'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '11111111-1111-4111-8111-111111111111',
    'email', 'martin@vankotraining.cz',
    'role', 'authenticated'
  )::text,
  true
);

insert into public.tindeq_repeaters_sessions (
  owner_user_id,
  file_hash,
  storage_path,
  analysis_version,
  parser_version,
  segmentation_version,
  metrics_version,
  pain_during,
  rpe
)
values (
  '11111111-1111-4111-8111-111111111111',
  'hash-owner-one',
  '11111111-1111-4111-8111-111111111111/session-one/original.zip',
  'test-analysis',
  'test-parser',
  'test-segmentation',
  'test-metrics',
  null,
  null
)
returning id as own_session_id \gset

insert into public.tindeq_repetitions (
  session_id,
  repetition_number,
  work_start_seconds,
  work_end_seconds
)
values (:'own_session_id', 1, 0, 10);

insert into public.tindeq_import_errors (
  owner_user_id,
  file_name,
  error_code,
  user_message
)
values (
  '11111111-1111-4111-8111-111111111111',
  'broken.zip',
  'DAMAGED_ZIP',
  'Test error'
);

insert into storage.objects (bucket_id, name)
values (
  'tindeq-raw',
  '11111111-1111-4111-8111-111111111111/session-one/original.zip'
);

do $$
begin
  begin
    insert into public.tindeq_repeaters_sessions (
      owner_user_id, file_hash, storage_path,
      analysis_version, parser_version, segmentation_version, metrics_version
    ) values (
      '22222222-2222-4222-8222-222222222222',
      'cross-owner-insert',
      '22222222-2222-4222-8222-222222222222/cross/original.zip',
      'test-analysis', 'test-parser', 'test-segmentation', 'test-metrics'
    );
    raise exception 'cross-owner session INSERT unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

do $$
begin
  begin
    update public.tindeq_repeaters_sessions
    set owner_user_id = '22222222-2222-4222-8222-222222222222'
    where id = :'own_session_id';
    raise exception 'owner reassignment unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

do $$
begin
  begin
    insert into storage.objects (bucket_id, name)
    values (
      'tindeq-raw',
      '22222222-2222-4222-8222-222222222222/cross/original.zip'
    );
    raise exception 'cross-owner Storage INSERT unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;

insert into public.tindeq_repeaters_sessions (
  owner_user_id,
  file_hash,
  storage_path,
  analysis_version,
  parser_version,
  segmentation_version,
  metrics_version
)
values (
  '22222222-2222-4222-8222-222222222222',
  'hash-owner-two',
  '22222222-2222-4222-8222-222222222222/session-two/original.zip',
  'test-analysis',
  'test-parser',
  'test-segmentation',
  'test-metrics'
)
returning id as other_session_id \gset

insert into public.tindeq_repetitions (
  session_id,
  repetition_number,
  work_start_seconds,
  work_end_seconds
)
values (:'other_session_id', 1, 0, 10);

insert into storage.objects (bucket_id, name)
values (
  'tindeq-raw',
  '22222222-2222-4222-8222-222222222222/session-two/original.zip'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '11111111-1111-4111-8111-111111111111',
    'email', 'martin@vankotraining.cz',
    'role', 'authenticated'
  )::text,
  true
);

select count(*)::integer as visible_sessions
from public.tindeq_repeaters_sessions
\gset
select count(*)::integer as visible_repetitions
from public.tindeq_repetitions
\gset
select count(*)::integer as visible_errors
from public.tindeq_import_errors
\gset
select count(*)::integer as visible_objects
from storage.objects
where bucket_id = 'tindeq-raw'
\gset

reset role;

select pg_temp.assert_true(:visible_sessions = 1, 'owner must see exactly one session');
select pg_temp.assert_true(:visible_repetitions = 1, 'owner must see only repetitions from own sessions');
select pg_temp.assert_true(:visible_errors = 1, 'owner must see only own import errors');
select pg_temp.assert_true(:visible_objects = 1, 'owner must see only own raw ZIP objects');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', '11111111-1111-4111-8111-111111111111',
    'email', 'not-admin@example.test',
    'role', 'authenticated'
  )::text,
  true
);

do $$
begin
  begin
    insert into public.tindeq_repeaters_sessions (
      owner_user_id, file_hash, storage_path,
      analysis_version, parser_version, segmentation_version, metrics_version
    ) values (
      '11111111-1111-4111-8111-111111111111',
      'non-admin-insert',
      '11111111-1111-4111-8111-111111111111/non-admin/original.zip',
      'test-analysis', 'test-parser', 'test-segmentation', 'test-metrics'
    );
    raise exception 'non-admin session INSERT unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
set local role anon;

do $$
begin
  begin
    perform count(*) from public.tindeq_repeaters_sessions;
    raise exception 'anonymous SELECT unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;

insert into public.tindeq_repeaters_sessions (
  owner_user_id, file_hash, storage_path,
  analysis_version, parser_version, segmentation_version, metrics_version,
  pain_during, rpe
) values
  (
    '11111111-1111-4111-8111-111111111111', 'pain-zero', 'test/pain-zero.zip',
    'test-analysis', 'test-parser', 'test-segmentation', 'test-metrics', 0, 0
  ),
  (
    '11111111-1111-4111-8111-111111111111', 'pain-ten', 'test/pain-ten.zip',
    'test-analysis', 'test-parser', 'test-segmentation', 'test-metrics', 10, 10
  );

do $$
begin
  begin
    insert into public.tindeq_repeaters_sessions (
      owner_user_id, file_hash, storage_path,
      analysis_version, parser_version, segmentation_version, metrics_version,
      pain_during
    ) values (
      '11111111-1111-4111-8111-111111111111', 'pain-invalid', 'test/pain-invalid.zip',
      'test-analysis', 'test-parser', 'test-segmentation', 'test-metrics', 11
    );
    raise exception 'pain value 11 unexpectedly succeeded';
  exception when check_violation then
    null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.tindeq_repeaters_sessions (
      owner_user_id, file_hash, storage_path,
      analysis_version, parser_version, segmentation_version, metrics_version,
      rpe
    ) values (
      '11111111-1111-4111-8111-111111111111', 'rpe-invalid', 'test/rpe-invalid.zip',
      'test-analysis', 'test-parser', 'test-segmentation', 'test-metrics', 11
    );
    raise exception 'RPE value 11 unexpectedly succeeded';
  exception when check_violation then
    null;
  end;
end;
$$;

do $$
begin
  begin
    insert into public.tindeq_repeaters_sessions (
      owner_user_id, file_hash, storage_path,
      analysis_version, parser_version, segmentation_version, metrics_version
    ) values (
      '11111111-1111-4111-8111-111111111111',
      'hash-owner-one',
      'test/duplicate.zip',
      'test-analysis', 'test-parser', 'test-segmentation', 'test-metrics'
    );
    raise exception 'duplicate file hash unexpectedly succeeded';
  exception when unique_violation then
    null;
  end;
end;
$$;

select pg_temp.assert_true(
  (select count(*) = 3 from public.tindeq_repeaters_sessions
   where owner_user_id = '11111111-1111-4111-8111-111111111111'),
  'pain null, 0 and 10 rows should all remain valid'
);

rollback;

select 'Tindeq Stage 1 database integration tests passed.' as result;
