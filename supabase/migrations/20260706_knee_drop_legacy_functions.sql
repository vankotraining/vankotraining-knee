-- Drop legacy knee RPC functions before rerunning the robust safety migration.
-- This fixes PostgreSQL error 42P13 when an older function used parameter name p_id.

begin;

drop function if exists public.soft_delete_athlete(uuid);
drop function if exists public.restore_athlete(uuid);
drop function if exists public.soft_delete_knee_extension_test(uuid, text);
drop function if exists public.restore_knee_extension_test(uuid);

commit;
