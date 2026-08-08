-- Phase 5: enforce one active normalized Tindeq source session per athlete and analysis version.
-- Production application requires a separate explicit user approval and a fresh pre-check.

begin;

-- Fail explicitly instead of letting index creation fail with an opaque duplicate-key error.
do $$
begin
  if exists (
    select 1
    from public.tindeq_sessions
    where not coalesce(
      (raw_metadata ->> 'tindeqSessionId') ~ '^[0-9a-f]{20}$',
      false
    )
  ) then
    raise exception 'Cannot enforce Tindeq dedupe: invalid or missing raw_metadata.tindeqSessionId exists';
  end if;

  if exists (
    select 1
    from public.tindeq_sessions
    where deleted_at is null
    group by athlete_id, analysis_version, raw_metadata ->> 'tindeqSessionId'
    having count(*) > 1
  ) then
    raise exception 'Cannot enforce Tindeq dedupe: active duplicate source sessions exist';
  end if;
end;
$$;

alter table public.tindeq_sessions
  add constraint tindeq_sessions_source_session_id_valid
  check (
    coalesce(
      (raw_metadata ->> 'tindeqSessionId') ~ '^[0-9a-f]{20}$',
      false
    )
  );

-- Soft-deleted rows are intentionally outside the unique set so a previously
-- archived ZIP may be imported again. Restoring an older row is still prevented
-- if another active row already owns the same source-session identity.
create unique index tindeq_sessions_active_source_session_uidx
  on public.tindeq_sessions (
    athlete_id,
    analysis_version,
    (raw_metadata ->> 'tindeqSessionId')
  )
  where deleted_at is null;

commit;

-- Rollback / mitigation (run only as a separately reviewed migration):
-- drop index if exists public.tindeq_sessions_active_source_session_uidx;
-- alter table public.tindeq_sessions
--   drop constraint if exists tindeq_sessions_source_session_id_valid;
