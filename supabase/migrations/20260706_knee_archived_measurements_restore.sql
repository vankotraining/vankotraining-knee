-- Archived knee measurement restore support
-- Purpose:
-- 1. Allow the knee app to list archived measurements through a controlled RPC.
-- 2. Keep normal table SELECT policies hiding archived records.
-- 3. Reuse restore_knee_extension_test(uuid) for the actual restore action.
--
-- Run this after supabase/migrations/20260706_knee_rls_policies.sql.

begin;

create or replace function public.list_archived_knee_extension_tests(
  p_athlete_id uuid default null
)
returns table (
  id uuid,
  athlete_id uuid,
  athlete_display_name text,
  test_date text,
  right_force_kg text,
  left_force_kg text,
  asymmetry_pct text,
  deleted_at timestamptz,
  delete_reason text,
  deleted_context text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_knee_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select
    test.id,
    test.athlete_id,
    coalesce(athlete.display_name, 'Neznamy klient') as athlete_display_name,
    test.test_date::text,
    test.right_force_kg::text,
    test.left_force_kg::text,
    test.asymmetry_pct::text,
    test.deleted_at,
    test.delete_reason,
    test.deleted_context
  from public.knee_extension_tests test
  left join public.athletes athlete on athlete.id = test.athlete_id
  where test.deleted_at is not null
    and (p_athlete_id is null or test.athlete_id = p_athlete_id)
  order by test.deleted_at desc, test.test_date desc;
end;
$$;

grant execute on function public.list_archived_knee_extension_tests(uuid) to authenticated;

commit;
