# Knee asymmetry percentage-point contract — 2026-09-17

## Scope

Small isolated correction of `knee_extension_tests.asymmetry_pct`. Tindeq behavior is out of scope.

## Fresh source of truth

- fresh `main`: `de077dc688a45ee7124934eca63c7d626e213770`;
- branch: `fix/knee-asymmetry-percent-contract`;
- draft PR: `#25`;
- production Supabase: `zxvndqicslyulrinbpyn`;
- production before this change: deployment `dpl_2QUPUFDTe4uvKtRagWHBxSrVvKiP`, `READY`, commit `de077dc688a45ee7124934eca63c7d626e213770`, alias `knee.vankotraining.cz`.

## Confirmed root cause

`calculateAsymmetryPct()` already returns percentage points. Current manual writes are therefore correct. `getAsymmetryValue()` nevertheless used the historical magnitude heuristic `abs(value) <= 1 ? abs(value) * 100 : abs(value)`. A valid manual value such as `0.96` was consequently rendered and charted as `96.0 %`.

## Production read-only audit

Schema confirms `right_force_kg`, `left_force_kg` and `asymmetry_pct` are `numeric(6,2)`, force/asymmetry values are `NOT NULL`, and `asymmetry_pct` is constrained to `0–100`.

Regression measurement from `2026-09-17`: right `72.40 kg`, left `73.10 kg`, stored `asymmetry_pct = 0.96`, direct force-derived asymmetry `0.957592339... %`, `weaker_side = right`.

All 132 production rows were compared directly with `abs(right-left)/max(right,left)*100`:

| source | rows | active | archived | canonical now | proven legacy fraction | ambiguous | stored range | canonical range |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `google_sheet_import` | 100 | 100 | 0 | 0 | 100 | 0 | `0.00–0.81` | `0.18–81.50` |
| `manual` | 32 | 27 | 5 | 32 | 0 | 0 | `0.96–51.62` | `0.96–51.62` |

`weaker_side` mismatches: `0`.

## Canonical contract

`public.knee_extension_tests.asymmetry_pct = percentage points`.

Examples: `0.96 = 0.96 %`, `8.5 = 8.5 %`, `14.0 = 14 %`. After canonicalization `0.14` never means `14 %`. UI/export code must not infer unit from numeric magnitude.

## Application implementation

Commit `50bfe95`:

- `getAsymmetryValue()` no longer multiplies values `<= 1` by 100;
- formatting is centralized in `formatAsymmetryPercent()`;
- threshold classification is centralized in `getAsymmetryTone()`;
- table, detail, mobile cards, client summary and graph use the same canonical percentage-point interpretation;
- thresholds remain `<10 % = ok`, `10–20 % = warning`, `>20 % = problem`.

Regression tests cover `72.4 / 73.1 -> 0.957592... % -> 1.0 %`, `42 / 35 -> 16.666... %`, `35 / 35 -> 0 %`, `getAsymmetryValue(0.96) -> 0.96`, and threshold boundaries.

## Migration implementation

Commit `f4335e0` prepares but does not apply:

- `supabase/migrations/20260917_knee_asymmetry_percent_points.sql`;
- read-only precheck and post-check SQL under `supabase/checks/`;
- removal of the legacy `<= 1 -> *100` fallback from repository export SQL.

The migration is fail-closed and idempotent: manual rows must already be canonical; `google_sheet_import` rows must match either canonical or the proven historical fraction representation; only proven legacy rows are recomputed from right/left force; no row is deleted; archive state and `weaker_side` are untouched; a final postcondition aborts if any noncanonical row remains.

## Safety gate and status

Production DB migration: **not applied**. Merge: **not performed**.

Before any production data mutation, rerun the read-only precheck, create/confirm the backup/export required by `operations.md`, confirm `ambiguous_rows = 0`, and obtain explicit user approval.

- implemented in branch: **yes**;
- automated final-head checks: **pending final PR #25 head**;
- preview: **pending final PR #25 head**;
- production DB migration: **not applied**;
- implemented in `main`: **no**;
- production deployment: **no**;
- production verified: **no** — only after explicit user confirmation after rollout.
