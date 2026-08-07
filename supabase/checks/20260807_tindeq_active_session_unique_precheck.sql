-- Read-only pre-check for the phase-5 Tindeq dedupe migration.
-- Run on the exact target project immediately before any approved migration.

select
  count(*) as total_rows,
  count(*) filter (where deleted_at is null) as active_rows,
  count(*) filter (
    where not coalesce(
      (raw_metadata ->> 'tindeqSessionId') ~ '^[0-9a-f]{20}$',
      false
    )
  ) as invalid_source_session_id_rows
from public.tindeq_sessions;

select
  athlete_id,
  analysis_version,
  raw_metadata ->> 'tindeqSessionId' as source_session_id,
  count(*) as active_duplicate_count
from public.tindeq_sessions
where deleted_at is null
group by athlete_id, analysis_version, raw_metadata ->> 'tindeqSessionId'
having count(*) > 1
order by active_duplicate_count desc;
