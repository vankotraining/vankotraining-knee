# Tindeq canonical reports

## Scope

- Working branch: `agent/tindeq-results-site`
- Draft pull request: `#12`
- Routes: `/tindeq` and `/tindeq/reports`
- Canonical report version: `tindeq-report-v1`
- Source: stored normalized `public.tindeq_sessions` results
- No database migration is required for this report iteration.
- Original ZIP files and raw time series remain local and are not stored.

## Architecture

`src/lib/tindeq-report.ts` is the single pure TypeScript decision layer. It accepts either the current `TindeqSession` object or a stored `StoredTindeqSession` and returns the same `TindeqCanonicalReport` structure. UI, history and a future export must consume this object rather than reimplement report calculations.

The report contains:

1. measurement context,
2. left/right performance,
3. control and stability,
4. fatigue and series development,
5. traceable interpretation,
6. one rule-based recommendation.

Optional knee angle and pain before/during/after are explicit report inputs. Missing values remain `null` and are listed under missing data. In this iteration they are used only for the current report calculation and are not persisted.

## Working rules

These thresholds are transparent implementation rules, not validated diagnostic cut-offs.

### Performance

- Successful repetition: mean force `95–105 %` of target and at least `60 %` of contraction time in the ±5 % target band.
- Fulfilled side: mean target achievement `95–105 %`, mean time in target at least `60 %`, repetition success at least `70 %`.
- Borderline side: mean target achievement `90–110 %`, mean time in target at least `40 %`, repetition success at least `50 %`.

### Control

- Fulfilled: median within-repetition CV at most `5 %` and between-repetition CV at most `8 %`.
- Borderline: within-repetition CV at most `8 %` and between-repetition CV at most `12 %`.
- More than `30 %` of repetitions with a technical flag is not fulfilled.

### Fatigue

- No meaningful decline: worst trend at least `−0.75 percentage points/repetition`, first-to-last change at least `−5 percentage points`, target-time loss no worse than `−15 percentage points` when available.
- Expected fatigue: worst trend at least `−1.5`, first-to-last change at least `−15`, target-time loss no worse than `−30` when available.
- Worse values are classified as marked decline.
- If control is not fulfilled, decline is classified as inconsistent/technical rather than automatically attributed to fatigue.

### Technical evaluability

The report is technically non-evaluable when fewer than `max(3, ceil(75 % of expected repetitions))` are detected, more than one quarter of repetitions have an incomplete end, or a core side summary is missing.

### Pain reaction

- Fulfilled for progression: pain during at most `3/10` and pain after at most one point above baseline.
- Not fulfilled: pain during at least `5/10`, or pain after at least `4/10` together with an increase of at least two points from baseline.
- Intermediate complete values are borderline.
- Missing pain prevents an automatic progression recommendation.

## Recommendations

- `progrese`: all domains fulfilled, complete acceptable pain, success at least `80 %` and mean target time at least `70 %` on both sides.
- `zachování`: a domain is borderline or stricter progression rules are not met.
- `regrese`: pain reaction or performance/fatigue rule is not fulfilled.
- `opakování měření`: technically non-evaluable record.
- `technická úprava provedení`: control/technical issue dominates.
- `doplnění údajů před rozhodnutím`: performance is acceptable but pain data are incomplete.

Every finding includes the metric value and the rule used. The report does not diagnose disease or determine medical fitness.

## Verification plan

- Pure TypeScript unit tests cover progression, missing pain, expected fatigue, technical non-evaluability, technical instability, borderline pain, regression and reconstruction from stored JSON.
- Playwright uses a stubbed Supabase session and synthetic normalized history to verify signed-out gating, history loading and recommendation changes after clinical context entry.
- Final evidence must distinguish implemented, tested and exact-commit preview deployed states.

## Known auth blocker

The existing Knee/Workout magic-link redirect issue remains a separate blocker for final production verification. No shared Supabase Auth configuration, Workout code or additional magic-link diagnostics are changed by this report work.
