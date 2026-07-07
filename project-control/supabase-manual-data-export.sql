-- knee.vankotraining.cz manual data export
-- Date: 2026-07-07
-- Purpose: safe read-only backup/export from Supabase SQL editor.
--
-- How to use:
-- 1. Open Supabase project -> SQL Editor -> New query.
-- 2. Copy one export block at a time.
-- 3. Run it and download the result as CSV.
-- 4. Repeat for clients, profiles and measurements.
--
-- These queries do not change data. They include active and archived records.


-- ============================================================
-- EXPORT 1: clients from public.athletes
-- File name suggestion: knee_export_clients_YYYY-MM-DD.csv
-- ============================================================

select
  a.id as athlete_id,
  a.display_name,
  a.name_key,
  a.note as athlete_note,
  case
    when a.deleted_at is null then 'active'
    else 'archived'
  end as athlete_archive_status,
  a.deleted_at as athlete_archived_at,
  a.delete_reason as athlete_archive_reason,
  a.deleted_context as athlete_archive_context,
  count(distinct p.id) as profile_count,
  count(distinct k.id) as measurement_count_total,
  count(distinct k.id) filter (where k.deleted_at is null) as measurement_count_active,
  count(distinct k.id) filter (where k.deleted_at is not null) as measurement_count_archived
from public.athletes as a
left join public.athlete_profiles as p
  on p.athlete_id = a.id
left join public.knee_extension_tests as k
  on k.athlete_id = a.id
group by
  a.id,
  a.display_name,
  a.name_key,
  a.note,
  a.deleted_at,
  a.delete_reason,
  a.deleted_context
order by
  a.deleted_at asc nulls first,
  a.display_name asc;


-- ============================================================
-- EXPORT 2: profiles from public.athlete_profiles
-- File name suggestion: knee_export_profiles_YYYY-MM-DD.csv
-- ============================================================

select
  p.id as profile_id,
  p.athlete_id,
  a.display_name as athlete_display_name,
  case
    when a.deleted_at is null then 'active'
    else 'archived'
  end as athlete_archive_status,
  a.deleted_at as athlete_archived_at,
  p.birth_date,
  p.profile_date,
  p.body_weight_kg,
  p.shin_length_cm,
  p.age as profile_age_years,
  p.updated_at as profile_updated_at
from public.athlete_profiles as p
join public.athletes as a
  on a.id = p.athlete_id
order by
  a.display_name asc,
  p.profile_date desc nulls last,
  p.updated_at desc nulls last;


-- ============================================================
-- EXPORT 3: knee extension measurements
-- File name suggestion: knee_export_measurements_YYYY-MM-DD.csv
-- ============================================================

with latest_profile as (
  select distinct on (p.athlete_id)
    p.athlete_id,
    p.birth_date,
    p.profile_date,
    p.body_weight_kg,
    p.shin_length_cm,
    p.age,
    p.updated_at
  from public.athlete_profiles as p
  order by
    p.athlete_id,
    p.profile_date desc nulls last,
    p.updated_at desc nulls last
)
select
  k.id as measurement_id,
  k.athlete_id,
  a.display_name as athlete_display_name,
  case
    when a.deleted_at is null then 'active'
    else 'archived'
  end as athlete_archive_status,
  a.deleted_at as athlete_archived_at,
  a.delete_reason as athlete_archive_reason,
  a.deleted_context as athlete_archive_context,
  case
    when k.deleted_at is null then 'active'
    else 'archived'
  end as measurement_archive_status,
  k.deleted_at as measurement_archived_at,
  k.delete_reason as measurement_archive_reason,
  k.deleted_context as measurement_archive_context,
  case
    when a.deleted_at is null and k.deleted_at is null then true
    else false
  end as visible_in_active_app,
  k.test_date,
  k.left_force_kg,
  k.right_force_kg,
  round(
    coalesce(
      k.left_nm_per_kg,
      case
        when k.left_force_kg > 0 and k.shin_length_cm > 0 and k.body_weight_kg > 0
          then (k.left_force_kg * 9.80665 * (k.shin_length_cm / 100.0)) / k.body_weight_kg
        else null
      end
    )::numeric,
    3
  ) as left_nm_per_kg,
  round(
    coalesce(
      k.right_nm_per_kg,
      case
        when k.right_force_kg > 0 and k.shin_length_cm > 0 and k.body_weight_kg > 0
          then (k.right_force_kg * 9.80665 * (k.shin_length_cm / 100.0)) / k.body_weight_kg
        else null
      end
    )::numeric,
    3
  ) as right_nm_per_kg,
  round(
    case
      when greatest(k.left_force_kg, k.right_force_kg) > 0
        then abs(k.right_force_kg - k.left_force_kg) / greatest(k.left_force_kg, k.right_force_kg) * 100
      when k.asymmetry_pct is not null and abs(k.asymmetry_pct) <= 1
        then abs(k.asymmetry_pct) * 100
      when k.asymmetry_pct is not null
        then abs(k.asymmetry_pct)
      else null
    end::numeric,
    2
  ) as asymmetry_pct,
  coalesce(
    k.weaker_side,
    case
      when k.left_force_kg is null or k.right_force_kg is null then null
      when abs(k.right_force_kg - k.left_force_kg) < 0.01 then 'none'
      when k.right_force_kg < k.left_force_kg then 'right'
      else 'left'
    end
  ) as weaker_side,
  k.body_weight_kg as body_weight_at_test_kg,
  k.shin_length_cm as shin_length_at_test_cm,
  lp.birth_date,
  round(
    coalesce(
      k.age_at_test_years,
      case
        when lp.birth_date is not null and k.test_date is not null
          then ((k.test_date - lp.birth_date)::numeric / 365.25)
        else null
      end
    )::numeric,
    2
  ) as age_at_test_years,
  k.note as measurement_note,
  k.source,
  k.source_row
from public.knee_extension_tests as k
join public.athletes as a
  on a.id = k.athlete_id
left join latest_profile as lp
  on lp.athlete_id = k.athlete_id
order by
  a.display_name asc,
  k.test_date desc nulls last,
  k.source_row desc nulls last;
