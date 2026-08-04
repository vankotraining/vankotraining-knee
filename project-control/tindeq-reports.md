# Tindeq canonical reports

## Scope

- Branch: `agent/tindeq-results-site`
- Draft PR: `#12`
- Routes: `/tindeq`, `/tindeq/reports`, `/tindeq/reports/demo`
- Canonical version: `tindeq-report-v1`
- Real-data source: normalized ZIP imports stored in `public.tindeq_sessions`
- Report iteration requires no additional production migration.

The report is downstream of the only supported real-data input:

`Tindeq ZIP` → local parser → normalized `TindeqSession` → explicit client/save → stored normalized result → canonical report.

It does not parse a second source, create sessions manually, upload ZIP files, or persist raw time series.

## Single decision layer

`src/lib/tindeq-report.ts` is the pure TypeScript decision layer. Current analysis, stored history, client/trainer report and anonymous demo must consume the same `TindeqCanonicalReport` structure instead of reimplementing calculations in UI components.

The report contains:

1. measurement context,
2. performance,
3. control and stability,
4. fatigue/series development,
5. technical evaluability,
6. traceable interpretation,
7. one rule-based recommendation.

Optional knee angle and pain before/during/after are explicit inputs. Missing values remain `null`; missing pain is never treated as `0`.

## Anonymous demo

`/tindeq/reports/demo` is a clearly labelled, anonymous, fictional read-only demonstration.

- no Supabase session is required,
- no Supabase query or write is executed,
- no real client is referenced,
- the fixture passes through the same stored-session report builder,
- demo data cannot enter the ZIP persistence path.

## Transparent working rules

All thresholds below are implementation heuristics, not validated diagnostic cut-offs.

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
- Worse values are marked decline.
- If control is not fulfilled, decline is classified as inconsistent/technical rather than automatically attributed to fatigue.

### Technical evaluability

The report is technically non-evaluable when fewer than `max(3, ceil(75 % of expected repetitions))` are detected, more than one quarter of repetitions have an incomplete end, or a core side summary is missing.

### Pain reaction

- Fulfilled for progression: pain during at most `3/10` and pain after at most one point above baseline.
- Not fulfilled: pain during at least `5/10`, or pain after at least `4/10` with an increase of at least two points from baseline.
- Intermediate complete values are borderline.
- Missing pain prevents automatic progression.

## Recommendations

- `progrese`: all domains fulfilled, complete acceptable pain, success at least `80 %` and mean target time at least `70 %` on both sides.
- `zachování`: a domain is borderline or stricter progression criteria are not met.
- `regrese`: pain reaction or performance/fatigue rule is not fulfilled.
- `opakování měření`: technically non-evaluable record.
- `technická úprava provedení`: control/technical issue dominates.
- `doplnění údajů před rozhodnutím`: performance is acceptable but pain data are incomplete.

Every finding names the metric and rule. The report does not diagnose disease or determine medical fitness.

## First-merge decision

The canonical report is not required to prove that ZIP parsing/persistence works, but it is retained in PR #12 because:

- it reads the same normalized source as history,
- its calculations are centralized,
- missing data and technical non-evaluability are explicit,
- the demo is read-only and isolated,
- removing it would create more churn without eliminating a concrete safety risk.

Future persistence of clinical context, longitudinal modelling and export formats belong in separate PRs.

## Verification and gates

Unit tests cover progression, maintenance, regression, missing pain, technical non-evaluability, reconstruction from stored JSON and demo parity. Browser tests cover protected report history and anonymous demo.

Final acceptance still requires:

- exact-head CI,
- exact-head preview using approved dev Supabase,
- real magic-link return test,
- manual comparison of a real ZIP result with expected session count, sides and principal metrics.
