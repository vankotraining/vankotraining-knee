-- Manual data export for knee.vankotraining.cz
--
-- Purpose:
-- - one safe export surface for active and archived knee data
-- - runnable in Supabase SQL Editor
-- - no changes to app workflows
--
-- How to use:
-- 1. Run this whole file once in Supabase SQL Editor.
-- 2. Then run the SELECT at the bottom whenever you need a CSV backup.
-- 3. Download the SQL Editor result as CSV.

create or replace view public.knee_data_export as
with latest_profile as (
  select distinct on (ap.athlete_id)
    ap.id,
    ap.athlete_id,
    ap.birth_date,
    ap.shin_length_cm,
    ap.body_weight_kg,
    ap.age,
    ap.profile_date,
    ap.updated_at
  from public.athlete_profiles ap
  order by
    ap.athlete_id,
    ap.profile_date desc nulls last,
    ap.updated_at desc nulls last,
    ap.id desc
), export_rows as (
  select
    a.id as athlete_id,
    a.display_name as client_name,
    a.name_key as client_name_key,
    a.note as client_note,
    case when a.deleted_at is null then 'active' else 'archived' end as client_archive_status,
    a.deleted_at as client_archived_at,
    a.delete_reason as client_archive_reason,
    a.deleted_context as client_archive_context,

    lp.id as profile_id,
    lp.birth_date,
    lp.profile_date,
    lp.body_weight_kg as latest_profile_body_weight_kg,
    lp.shin_length_cm as latest_profile_shin_length_cm,
    lp.age as latest_profile_age,
    lp.updated_at as latest_profile_updated_at,

    t.id as measurement_id,
    case
      when t.id is null then 'no_measurement'
      when t.deleted_at is null then 'active'
      else 'archived'
    end as measurement_archive_status,
    case
      when t.id is null then 'no_measurement'
      when a.deleted_at is not null and t.deleted_at is not null then 'archived_measurement_and_archived_client'
      when a.deleted_at is not null then 'hidden_by_archived_client'
      when t.deleted_at is not null then 'archived_measurement'
      else 'active'
    end as effective_measurement_status,
    t.deleted_at as measurement_archived_at,
    t.delete_reason as measurement_archive_reason,
    t.deleted_context as measurement_archive_context,

    t.test_date as measurement_date,
    t.left_force_kg,
    t.right_force_kg,
    coalesce(
      t.left_nm_per_kg,
      case
        when t.left_force_kg > 0 and t.shin_length_cm > 0 and t.body_weight_kg > 0
          then (t.left_force_kg * 9.80665 * (t.shin_length_cm / 100.0)) / t.body_weight_kg
        else null
      end
    ) as left_nm_per_kg,
    coalesce(
      t.right_nm_per_kg,
      case
        when t.right_force_kg > 0 and t.shin_length_cm > 0 and t.body_weight_kg > 0
          then (t.right_force_kg * 9.80665 * (t.shin_length_cm / 100.0)) / t.body_weight_kg
        else null
      end
    ) as right_nm_per_kg,
    case
      when greatest(t.left_force_kg, t.right_force_kg) > 0
        then (abs(t.right_force_kg - t.left_force_kg) / greatest(t.left_force_kg, t.right_force_kg)) * 100
      when t.asymmetry_pct is not null and abs(t.asymmetry_pct) <= 1
        then abs(t.asymmetry_pct) * 100
      when t.asymmetry_pct is not null
        then abs(t.asymmetry_pct)
      else null
    end as asymmetry_pct,
    coalesce(
      t.weaker_side,
      case
        when t.left_force_kg is null or t.right_force_kg is null then null
        when abs(t.right_force_kg - t.left_force_kg) < 0.01 then 'none'
        when t.right_force_kg < t.left_force_kg then 'right'
        else 'left'
      end
    ) as weaker_side,
    t.body_weight_kg as body_weight_at_measurement_kg,
    t.shin_length_cm as shin_length_at_measurement_cm,
    coalesce(
      t.age_at_test_years,
      case
        when lp.birth_date is not null and t.test_date is not null
          then extract(epoch from (t.test_date::timestamp - lp.birth_date::timestamp)) / (365.25 * 24 * 60 * 60)
        else null
      end
    ) as age_at_measurement_years,
    t.note as measurement_note,
    t.source as measurement_source,
    t.source_row as measurement_source_row
  from public.athletes a
  left join latest_profile lp on lp.athlete_id = a.id
  left join public.knee_extension_tests t on t.athlete_id = a.id
)
select
  athlete_id,
  client_name,
  client_name_key,
  client_note,
  client_archive_status,
  client_archived_at,
  client_archive_reason,
  client_archive_context,
  profile_id,
  birth_date,
  profile_date,
  latest_profile_body_weight_kg,
  latest_profile_shin_length_cm,
  latest_profile_age,
  latest_profile_updated_at,
  measurement_id,
  measurement_archive_status,
  effective_measurement_status,
  measurement_archived_at,
  measurement_archive_reason,
  measurement_archive_context,
  measurement_date,
  left_force_kg,
  right_force_kg,
  round(left_nm_per_kg::numeric, 2) as left_nm_per_kg,
  round(right_nm_per_kg::numeric, 2) as right_nm_per_kg,
  round(asymmetry_pct::numeric, 1) as asymmetry_pct,
  weaker_side,
  body_weight_at_measurement_kg,
  shin_length_at_measurement_cm,
  round(age_at_measurement_years::numeric, 1) as age_at_measurement_years,
  measurement_note,
  measurement_source,
  measurement_source_row
from export_rows;

-- Manual CSV backup query:
-- Run this after creating the view above and download the result as CSV.
select *
from public.knee_data_export
order by
  client_name asc,
  measurement_date desc nulls last,
  measurement_source_row desc nulls last;
