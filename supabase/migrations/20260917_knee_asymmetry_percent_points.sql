-- Canonicalize knee_extension_tests.asymmetry_pct to percentage points.
-- Historical google_sheet_import rows stored a decimal fraction rounded to 2 decimals.
-- Current/manual rows already store percentage points rounded by numeric(6,2).
--
-- This migration is intentionally fail-closed and idempotent:
-- - manual rows must already match the force-derived percentage-point value;
-- - google_sheet_import rows must match either the canonical value or the proven
--   legacy fraction convention;
-- - only proven legacy rows are updated;
-- - a second run has zero candidates because all rows are then canonical.

begin;

do $$
declare
  invalid_manual_count integer;
  ambiguous_import_count integer;
begin
  with classified as (
    select
      source,
      asymmetry_pct,
      round(
        (
          abs(right_force_kg - left_force_kg)
          / nullif(greatest(right_force_kg, left_force_kg), 0)
          * 100
        )::numeric,
        2
      ) as canonical_pct
    from public.knee_extension_tests
  )
  select count(*)
  into invalid_manual_count
  from classified
  where source = 'manual'
    and abs(asymmetry_pct - canonical_pct) > 0.0050001;

  if invalid_manual_count > 0 then
    raise exception
      'knee asymmetry migration aborted: % manual rows do not match canonical percentage points',
      invalid_manual_count;
  end if;

  with classified as (
    select
      source,
      asymmetry_pct,
      round(
        (
          abs(right_force_kg - left_force_kg)
          / nullif(greatest(right_force_kg, left_force_kg), 0)
          * 100
        )::numeric,
        2
      ) as canonical_pct
    from public.knee_extension_tests
  )
  select count(*)
  into ambiguous_import_count
  from classified
  where source = 'google_sheet_import'
    and abs(asymmetry_pct - canonical_pct) > 0.0050001
    and abs(asymmetry_pct * 100 - canonical_pct) > 0.5000001;

  if ambiguous_import_count > 0 then
    raise exception
      'knee asymmetry migration aborted: % google_sheet_import rows are ambiguous',
      ambiguous_import_count;
  end if;
end
$$;

with candidates as (
  select
    id,
    round(
      (
        abs(right_force_kg - left_force_kg)
        / nullif(greatest(right_force_kg, left_force_kg), 0)
        * 100
      )::numeric,
      2
    ) as canonical_pct
  from public.knee_extension_tests
  where source = 'google_sheet_import'
)
update public.knee_extension_tests as test
set asymmetry_pct = candidates.canonical_pct
from candidates
where test.id = candidates.id
  and abs(test.asymmetry_pct - candidates.canonical_pct) > 0.0050001
  and abs(test.asymmetry_pct * 100 - candidates.canonical_pct) <= 0.5000001;

do $$
declare
  noncanonical_count integer;
begin
  select count(*)
  into noncanonical_count
  from public.knee_extension_tests
  where abs(
    asymmetry_pct
    - round(
        (
          abs(right_force_kg - left_force_kg)
          / nullif(greatest(right_force_kg, left_force_kg), 0)
          * 100
        )::numeric,
        2
      )
  ) > 0.0050001;

  if noncanonical_count > 0 then
    raise exception
      'knee asymmetry migration postcondition failed: % rows remain noncanonical',
      noncanonical_count;
  end if;
end
$$;

commit;
