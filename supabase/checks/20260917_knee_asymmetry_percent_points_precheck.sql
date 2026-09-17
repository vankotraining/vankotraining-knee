-- Read-only precheck for 20260917_knee_asymmetry_percent_points.sql.
-- Run immediately before any production write and stop if ambiguous_rows > 0.

with classified as (
  select
    source,
    deleted_at,
    asymmetry_pct::numeric as stored_pct,
    round(
      (
        abs(right_force_kg - left_force_kg)
        / nullif(greatest(right_force_kg, left_force_kg), 0)
        * 100
      )::numeric,
      2
    ) as canonical_pct
  from public.knee_extension_tests
), flags as (
  select
    *,
    abs(stored_pct - canonical_pct) <= 0.0050001 as canonical_match,
    abs(stored_pct - canonical_pct) > 0.0050001
      and abs(stored_pct * 100 - canonical_pct) <= 0.5000001 as legacy_fraction_match
  from classified
)
select
  source,
  count(*) as row_count,
  count(*) filter (where deleted_at is null) as active_count,
  count(*) filter (where deleted_at is not null) as archived_count,
  count(*) filter (where canonical_match) as canonical_rows,
  count(*) filter (where legacy_fraction_match) as migration_candidates,
  count(*) filter (where not canonical_match and not legacy_fraction_match) as ambiguous_rows,
  min(stored_pct) as stored_min,
  max(stored_pct) as stored_max,
  min(canonical_pct) as canonical_min,
  max(canonical_pct) as canonical_max
from flags
group by source
order by source;

-- Any returned row here blocks production migration.
with classified as (
  select
    id,
    source,
    asymmetry_pct::numeric as stored_pct,
    round(
      (
        abs(right_force_kg - left_force_kg)
        / nullif(greatest(right_force_kg, left_force_kg), 0)
        * 100
      )::numeric,
      2
    ) as canonical_pct
  from public.knee_extension_tests
), flags as (
  select
    *,
    abs(stored_pct - canonical_pct) <= 0.0050001 as canonical_match,
    abs(stored_pct - canonical_pct) > 0.0050001
      and abs(stored_pct * 100 - canonical_pct) <= 0.5000001 as legacy_fraction_match
  from classified
)
select id, source, stored_pct, canonical_pct
from flags
where not canonical_match
  and not legacy_fraction_match
order by source, id;
