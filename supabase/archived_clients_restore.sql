-- Safe read-only listing for the archived clients panel.
-- Run this in Supabase SQL editor if the app says the client archive is not active yet.

create or replace function public.list_archived_athletes()
returns table (
  id uuid,
  display_name text,
  name_key text,
  note text,
  deleted_at timestamptz,
  delete_reason text,
  deleted_context text,
  archived_measurement_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  return query
  select
    a.id,
    a.display_name,
    a.name_key,
    a.note,
    a.deleted_at,
    a.delete_reason,
    a.deleted_context,
    count(k.id) filter (where k.deleted_at is not null) as archived_measurement_count
  from public.athletes as a
  left join public.knee_extension_tests as k
    on k.athlete_id = a.id
  where a.deleted_at is not null
  group by
    a.id,
    a.display_name,
    a.name_key,
    a.note,
    a.deleted_at,
    a.delete_reason,
    a.deleted_context
  order by a.deleted_at desc nulls last, a.display_name asc;
end;
$$;

revoke all on function public.list_archived_athletes() from public;
revoke all on function public.list_archived_athletes() from anon;
grant execute on function public.list_archived_athletes() to authenticated;
