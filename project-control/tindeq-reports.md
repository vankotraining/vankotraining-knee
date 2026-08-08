# Tindeq canonical reports

> [!IMPORTANT]
> Tento dokument je implementační a ověřovací evidence k PR #12, nikoli autoritativní zdroj aktuálního stavu. Aktuální stav je v [`PROJECT_STATE.md`](./PROJECT_STATE.md) a produkční stav v [`PRODUCTION_STATUS.md`](./PRODUCTION_STATUS.md).

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

`src/lib/tindeq-report.ts` is the pure TypeScript decision layer. Current analysis, stored history, client/trainer report and anonymous demo consume the same `TindeqCanonicalReport` structure rather than reimplementing decisions in UI components.

The report contains measurement context, performance, control/stability, fatigue/series development, technical evaluability, traceable interpretation and one rule-based recommendation.

Optional knee angle and pain before/during/after are explicit inputs. Missing values remain `null`; missing pain is never treated as `0`.

## Anonymous demo

`/tindeq/reports/demo` is a clearly labelled, anonymous, fictional read-only demonstration.

- no Supabase session is required;
- no Supabase query or write is executed;
- no real client is referenced;
- the fixture passes through the same stored-session report builder;
- demo data cannot enter the ZIP persistence path.

## Transparent working rules

All thresholds below are implementation heuristics, not validated diagnostic cut-offs.

### Performance

- successful repetition: mean force `95–105 %` of target and at least `60 %` of contraction time in the ±5 % target band;
- fulfilled side: mean target achievement `95–105 %`, mean time in target at least `60 %`, repetition success at least `70 %`;
- borderline side: mean target achievement `90–110 %`, mean time in target at least `40 %`, repetition success at least `50 %`.

### Control

- fulfilled: median within-repetition CV at most `5 %` and between-repetition CV at most `8 %`;
- borderline: within-repetition CV at most `8 %` and between-repetition CV at most `12 %`;
- more than `30 %` of repetitions with a technical flag is not fulfilled.

### Fatigue

- no meaningful decline: worst trend at least `−0.75` percentage points/repetition, first-to-last change at least `−5` percentage points and target-time loss no worse than `−15` percentage points when available;
- expected fatigue: worst trend at least `−1.5`, first-to-last change at least `−15` and target-time loss no worse than `−30` when available;
- worse values are marked decline;
- if control is not fulfilled, decline is classified as inconsistent/technical rather than automatically attributed to fatigue.

### Technical evaluability

The report is technically non-evaluable when fewer than `max(3, ceil(75 % of expected repetitions))` are detected, more than one quarter of repetitions have an incomplete end, or a core side summary is missing.

### Pain reaction

- fulfilled for progression: pain during at most `3/10` and pain after at most one point above baseline;
- not fulfilled: pain during at least `5/10`, or pain after at least `4/10` with an increase of at least two points from baseline;
- intermediate complete values are borderline;
- missing pain prevents automatic progression.

## Recommendations

- `progrese`: all domains fulfilled, complete acceptable pain, success at least `80 %` and mean target time at least `70 %` on both sides;
- `zachování`: a domain is borderline or stricter progression criteria are not met;
- `regrese`: pain reaction or performance/fatigue rule is not fulfilled;
- `opakování měření`: technically non-evaluable record;
- `technická úprava provedení`: control/technical issue dominates;
- `doplnění údajů před rozhodnutím`: performance is acceptable but pain data are incomplete.

Every finding names the metric and rule. The report does not diagnose disease or determine medical fitness.

## First-merge decision

The canonical report remains in PR #12 because it reads the same normalized source as history, centralizes calculations, makes missing/non-evaluable data explicit and does not add another persistence path. Future persistence of clinical context, longitudinal modelling and export formats belong in separate PRs.

## Verification and gates

Unit tests cover progression, maintenance, regression, missing pain, technical non-evaluability, reconstruction from stored JSON and demo parity. Browser tests cover protected report history and anonymous demo.

Final acceptance still requires exact-head CI, exact-head preview using approved dev Supabase, real magic-link return testing and manual comparison of a real ZIP with expected session count, sides and principal metrics.
