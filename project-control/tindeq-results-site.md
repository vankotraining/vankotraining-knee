# Tindeq results MVP

## Scope

- New `/tindeq` route.
- Parses individual Tindeq ZIP exports and outer ZIP packages in the browser.
- Computes target accuracy, within-repetition variability, between-repetition trend, bilateral onset timing and warning flags.
- Shows normalized repetition curves and repetition-level metrics.
- Does not upload, persist or associate files with Supabase in this version.

## Privacy

Raw ZIP files and time-series data remain in the browser memory and are cleared on refresh. Private client fixtures are intentionally excluded from Git.

## Validation fixtures

- Individual bilateral Repeaters export: 8/8 repetitions detected.
- Batch archive: 18/18 sessions imported without parser errors; planned repetition count matched in every session.

## Known limitations

- ZIP decompression relies on `DecompressionStream('deflate-raw')`, targeting current Chrome/Android and current Chromium desktop browsers.
- Thresholds are working heuristics and are not clinically validated cut-offs.
- Persistence, pain/RPE fields and client history are deferred to the next iteration after visual and clinical review.
