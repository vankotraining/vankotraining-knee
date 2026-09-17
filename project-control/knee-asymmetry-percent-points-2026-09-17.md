# Knee asymmetry percentage-point contract — 2026-09-17

## Scope

Small isolated correction of `knee_extension_tests.asymmetry_pct`. Tindeq behavior is out of scope.

## Source of truth and rollout

- original fresh `main`: `de077dc688a45ee7124934eca63c7d626e213770`;
- implementation branch: `fix/knee-asymmetry-percent-contract`;
- PR: #25 `Fix knee asymmetry percentage-point contract`;
- final exact head: `4b383d342516fc64c92852483e430a0b16ede2c9`;
- merge commit: `59d23c4e18550675b8f5d7401e233ab60cc51d87`;
- production Supabase: `zxvndqicslyulrinbpyn`;
- production deployment: `dpl_GCreoikFbSWN7MZa8RiSNBDW3dCT`, `READY`, alias `knee.vankotraining.cz`.

## Confirmed root cause

`calculateAsymmetryPct()` already returned percentage points. Current manual writes were therefore correct. `getAsymmetryValue()` nevertheless used the historical magnitude heuristic `abs(value) <= 1 ? abs(value) * 100 : abs(value)`. A valid manual value `0.96` was consequently rendered and charted as approximately `96.0 %`.

## Production audit before migration

Schema confirmed `right_force_kg`, `left_force_kg` and `asymmetry_pct` are `numeric(6,2)`, force/asymmetry values are `NOT NULL`, and `asymmetry_pct` is constrained to `0–100`.

Regression measurement from `2026-09-17`: right `72.40 kg`, left `73.10 kg`, stored `asymmetry_pct = 0.96`, direct force-derived asymmetry `0.957592339... %`, `weaker_side = right`.

All 132 production rows were compared with `abs(right-left)/max(right,left)*100`:

| source | rows | active | archived | canonical before | proven legacy fraction | ambiguous | stored before | canonical target |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `google_sheet_import` | 100 | 100 | 0 | 0 | 100 | 0 | `0.00–0.81` | `0.18–81.50` |
| `manual` | 32 | 27 | 5 | 32 | 0 | 0 | `0.96–51.62` | `0.96–51.62` |

`weaker_side` mismatches: `0`.

Fresh pre-write guard repeated these results immediately before migration, with `0` invalid manual rows and candidate snapshot MD5 `141511a89181810b8ba07f409bd12035`. `public.knee_data_export` covered all 132 measurements and the Knee audit trigger/table were active.

## Canonical contract

`public.knee_extension_tests.asymmetry_pct = percentage points`.

Examples: `0.96 = 0.96 %`, `8.5 = 8.5 %`, `14.0 = 14 %`. `0.14` no longer has any implicit meaning of `14 %`. UI and export code must never infer unit from numeric magnitude.

## Application implementation

Application/test commit `50bfe95`:

- `getAsymmetryValue()` no longer multiplies values `<= 1` by 100;
- formatting is centralized in `formatAsymmetryPercent()`;
- threshold classification is centralized in `getAsymmetryTone()`;
- table, detail, mobile cards, client summary and graph use the same canonical percentage-point interpretation;
- thresholds remain `<10 % = ok`, `10–20 % = warning`, `>20 % = problem`.

Regression tests cover `72.4 / 73.1 -> 0.957592... % -> 1.0 %`, `42 / 35 -> 16.666... %`, `35 / 35 -> 0 %`, `getAsymmetryValue(0.96) -> 0.96`, formatting and threshold boundaries.

## Migration implementation and production application

Migration preparation commit `f4335e0` added:

- `supabase/migrations/20260917_knee_asymmetry_percent_points.sql`;
- read-only precheck and post-check SQL under `supabase/checks/`;
- removal of the legacy `<= 1 -> *100` fallback from repository export SQL.

The migration is fail-closed and idempotent: manual rows must already be canonical; `google_sheet_import` rows must match either canonical or the proven historical fraction representation; only proven legacy rows are recomputed from right/left force; no row is deleted; archive state and `weaker_side` are untouched; a final postcondition aborts if any noncanonical row remains.

After explicit user instruction `Dokonči nasazení`, production migration was applied:

- migration history version: `20260917114606`;
- migration name: `knee_asymmetry_percent_points`.

Post-check:

- 100/100 `google_sheet_import` rows canonical, `0` noncanonical, range `0.18–81.50`;
- 32/32 `manual` rows canonical, `0` noncanonical, range `0.96–51.62`;
- all 5 archived manual rows preserved;
- `weaker_side` mismatches: `0`;
- 100 audit UPDATE rows recorded;
- regression row remained `0.96`, weaker side `right`, force-derived `0.9576 %`.

## Automated verification

Final exact head `4b383d342516fc64c92852483e430a0b16ede2c9`:

- Project control run `35217601098`: success;
- Verify run `35217600919`: success;
- dependency install, unit tests, lint comparison, production build, TypeScript, project-control, whitespace and browser checks: success;
- Preview `dpl_2FbJSmqW12hBtt7BRBUFFca4twEX`: `READY`.

## Merge and production deployment

PR #25 was moved from draft to ready and merged only after the final exact-head gate passed.

- merge commit: `59d23c4e18550675b8f5d7401e233ab60cc51d87`;
- production deployment: `dpl_GCreoikFbSWN7MZa8RiSNBDW3dCT`;
- deployment state: `READY`;
- target: `production`;
- alias: `knee.vankotraining.cz`;
- production root: HTTP 200;
- post-deploy `warning/error/fatal` log query: no findings in the checked window.

## Status

- implemented in branch: **yes**;
- automated exact-head checks: **yes**;
- preview: **yes, READY**;
- production DB migration: **applied and post-checked**;
- implemented in `main`: **yes**;
- production deployment: **yes, READY**;
- production technically checked: **yes**;
- production UI verified by user: **no** — requires explicit confirmation after checking the authenticated Knee UI.

The required manual acceptance is the existing `72.4 / 73.1 kg` measurement: it must display approximately `1.0 %`, never `95.8/96.0 %`, with the right side weaker and consistent output across table, detail, mobile card, client summary and graph.
