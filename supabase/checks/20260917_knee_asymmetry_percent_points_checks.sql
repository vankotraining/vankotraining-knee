-- Read-only post-check for 20260917_knee_asymmetry_percent_points.sql.

select count(*) as noncanonical_rows
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

select count(*) as weaker_side_mismatches
from public.knee_extension_tests
where weaker_side is distinct from case
  when abs(right_force_kg - left_force_kg) < 0.01 then 'none'
  when right_force_kg < left_force_kg then 'right'
  else 'left'
end;

with classified as (
  select
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
)
select count(*) as legacy_fraction_rows
from classified
where abs(stored_pct - canonical_pct) > 0.0050001
  and abs(stored_pct * 100 - canonical_pct) <= 0.5000001;
