# Tindeq results site

## Source of truth

- Base branch: `main`
- Base commit reviewed before implementation: `71d6b1f0e67c571c71a53db6248e526704bddabe`
- Working branch: `agent/tindeq-results-site`
- Draft pull request: `#12`
- Route: `/tindeq`

## Current status

### Implemented

- The result opens in the `Pro klienta` view by default.
- An accessible tab switch exposes `Pro klienta` and `Detail pro trenéra` without importing or analysing the ZIP again.
- After a successful import, the large upload panel is replaced by a compact `Nahrát jiný Tindeq ZIP` control so the result remains immediately visible.
- The client view contains:
  - one plain-language series conclusion,
  - target achievement, force stability and performance maintenance cards,
  - separate left and right leg cards,
  - presentation-only average-force conversion from target force and the existing target percentage,
  - a simplified chart description, axis labels, regions and legend,
  - a maximum two-sentence chart interpretation,
  - plain-language recording warnings,
  - a neutral statement that the result describes only the performed force series.
- Positive, warning and problem labels use explicit verbal states as well as colour; `Bez výrazného poklesu` is classified as a positive state.
- The trainer view retains the existing technical domains, side metrics, protocol data, sampling frequency, warnings, normalized chart, repetition table and method note.
- Existing analytical calculations and heuristic thresholds in `src/lib/tindeq-browser.ts` were not changed.
- Client wording and layout do not provide a diagnosis, readiness decision or automatic load progression.
- Mobile CSS contains safe-area handling, visible focus states and controlled horizontal scrolling only for the chart and trainer table.

### Deployed

- No preview deployment corresponds to the current client-view commit.
- Vercel rejected automatic preview builds for the current commits because the account reached its build-rate limit.
- The last successful Tindeq preview belongs to the earlier commit `f9566bdfcb3ac0150d8aba2af54b99b0ec35698e` and must not be treated as evidence for this client-view change.
- Production remains on `main` commit `71d6b1f0e67c571c71a53db6248e526704bddabe`.

### Production verified

- Not verified by the user.
- No production deployment or merge was performed for this change.

## Automated verification

Code verification commit: `7140e4f20ae11dfb2c16dc8244aee3f6ebc999d2`.
GitHub Actions workflow: `Verify Tindeq client view`, run `30744363313`.

- `npm test`: passed, 38/38 tests.
- Added presentation tests cover the default client mode, mode switch, plain-language labels, good result, target miss, instability, performance decline, side-specific output, warnings, missing/non-finite data, presentation-only force conversion and mobile overflow rules.
- `npm run lint`: exits non-zero on both current `main` and the working branch with the same baseline: 3 errors and 1 warning in pre-existing dashboard/archive components. The Tindeq change introduces no additional lint errors.
- `npm run build`: passed; `/tindeq` is statically generated.
- Playwright browser verification: passed, 2/2 tests.
  - individual synthetic bilateral Repeaters ZIP,
  - outer ZIP containing two measurements,
  - default client mode,
  - compact re-upload control after import,
  - trainer switch and keyboard return,
  - graph accessible name,
  - positive colour treatment for `Bez výrazného poklesu`,
  - no root horizontal overflow at 360, 390, 720, 1024 and 1440 px,
  - stacked side cards through 720 px and side-by-side cards at desktop widths.
- Five responsive screenshots are stored in CI artifact `tindeq-client-view-screenshots`, artifact ID `8832381786`.
- The 360 px and 1024 px screenshots were visually reviewed after the automated run; the result begins near the top of the page, the mobile cards remain readable and the positive maintenance label is no longer shown as a problem state.

## Existing parser validation

- Private individual bilateral Repeaters fixture: 8/8 repetitions detected.
- Private batch archive: 18/18 sessions imported without parser errors; planned repetition count matched in every session.
- Private client fixtures remain excluded from Git.

## Privacy

Raw ZIP files and time-series data remain in browser memory and are cleared on refresh. This version does not upload, persist or associate Tindeq data with Supabase.

## Known limitations

- ZIP decompression relies on `DecompressionStream('deflate-raw')`, targeting current Chrome/Android and current Chromium desktop browsers.
- Thresholds remain working analytical heuristics, not validated clinical cut-off values.
- The browser verification uses generated deterministic fixtures; final visual review with the user's real exports still belongs in the preview review step.
- A current preview URL and exact deployed commit cannot be recorded until Vercel accepts a new preview build.
- Persistence, pain/RPE fields and client history remain deferred.
