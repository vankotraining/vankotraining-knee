# Tindeq results site

## Source of truth

- Base branch: `main`
- Base commit reviewed before implementation: `71d6b1f0e67c571c71a53db6248e526704bddabe`
- Working branch: `agent/tindeq-results-site`
- Implementation head verified before this documentation update: `adc6e2a8086a0cc87109e1e1b559f4347d3a33db`
- Draft pull request: `#12`
- Route: `/tindeq`
- Supabase project inspected: `zxvndqicslyulrinbpyn`

## Status vocabulary

- **Implemented** means the change exists on the working branch.
- **Tested** means automated evidence exists for the exact implementation head.
- **Preview deployed** requires a Vercel deployment whose metadata matches the exact final commit.
- **Production deployed** requires a production deployment of that exact commit.
- **Production verified** requires explicit user confirmation after production review.

## Implemented

### Authentication and athlete selection

- `/tindeq` uses the existing browser Supabase client, current session and `onAuthStateChange` subscription.
- Signed-out users see the same magic-link authentication model as the main application.
- Athletes, imported results and history are not rendered without a valid session.
- Active athletes are loaded from `public.athletes`, ordered by `display_name` and searchable by name.
- A result cannot be saved without a valid selected `athlete_id`.
- The Tindeq export tag is shown only as supporting information. A non-matching tag produces a non-blocking warning; no automatic or fuzzy athlete matching is performed.

### Local analysis and explicit save

- ZIP parsing and analysis remain local in the browser.
- `src/lib/tindeq-browser.ts`, its analytical model and heuristic thresholds were not changed.
- Client and trainer views continue to use the same already calculated `TindeqSession` object.
- The user sees the analysed result before save and must explicitly select `Uložit měření ke klientovi`.
- The original ZIP and raw time-series samples are not uploaded to Supabase Storage or the database.
- Multi-session archives are saved as one database row per analysed session in import order.
- Partial failure is reported per session. A retry sends only failed sessions and retains the analysed result on screen.

### Persistence mapping

- Analysis version: `tindeq-repeaters-v1`.
- Relational columns include athlete, measured/imported timestamps, source filename and dataset, source tag, protocol, left/right target force in kg, sampling rate and repetition counts.
- Detailed side summaries, overall summary, repetitions, warnings and normalized metadata are stored as validated `jsonb`.
- Supported force units are normalized to kg before storage (`kg`, `N`, `lb`). Unsupported units are rejected.
- Stored analytical values are not editable through the application. Correction is by soft-delete and re-import.

### Athlete history

- History is filtered by selected athlete and ordered by `measured_at desc, created_at desc`.
- It has loading, empty and error states and is visually separated from the current unsaved analysis.
- Each entry shows measured date, source tag/protocol, target force, left/right result, target achievement, stability and maintenance.
- Saved detail can be opened without reprocessing a ZIP.

## Database migration prepared

Migration file: `supabase/migrations/20260802_tindeq_sessions.sql`.
Verification queries: `supabase/checks/20260802_tindeq_sessions_checks.sql`.

The migration prepares `public.tindeq_sessions` with:

- UUID primary key and UUID foreign key to `athletes(id)` with `on delete cascade`,
- soft-delete and audit metadata consistent with the knee tables,
- active-history index on `(athlete_id, measured_at desc, created_at desc)`,
- analysis-version index,
- positive-value, JSON shape and required-text constraints,
- RLS enabled,
- authenticated `select`/`insert` and column-limited soft-delete `update` grants,
- policies using the existing `public.is_knee_admin()` authorization model,
- insert validation that the referenced athlete exists and is active,
- no ordinary table delete grant,
- guarded security-definer functions for soft-delete/restore with `PUBLIC` and `anon` execution revoked,
- existing `set_knee_updated_at()` and `log_knee_table_change()` triggers,
- athlete-level soft-delete/restore extended to Tindeq rows.

### RLS limitation

The current application is effectively a single authorized knee administrator. `is_knee_admin()` currently authorizes the configured administrator email. This is consistent with the inspected knee tables but is not a multi-tenant ownership model. Before multi-user use, rows need explicit owner/organization columns and ownership-scoped RLS.

### Migration application status

- The migration was **not applied**.
- Only one shared active Supabase project was confirmed; a separate development/preview database was not available.
- Applying this migration to the shared project requires explicit user approval.
- No athlete or measurement records were created, updated or deleted during verification.

## Automated verification

Verified implementation commit: `adc6e2a8086a0cc87109e1e1b559f4347d3a33db`.
GitHub Actions workflow: `Verify Tindeq client view`, run `30746969433`.
Screenshot artifact: `tindeq-client-view-screenshots`, artifact ID `8833200421`.

- `npm test`: passed, **49/49**.
- Persistence tests cover payload mapping, `athlete_id`, units, `analysis_version`, unsupported version, missing athlete, incomplete analysis, single save, multi-save, transparent partial failure and athlete-filtered history.
- `npm run lint`: working branch and current `main` both retain the same existing baseline, **3 errors + 1 warning** in pre-existing archive/dashboard components. No new lint errors are introduced.
- `npm run build`: passed; `/tindeq` is statically generated and performs session/data checks client-side.
- Playwright: passed, **4/4**.
  - signed-out authentication gate,
  - signed-in mocked Supabase client and athlete loading,
  - athlete search/selection,
  - ZIP import and result display,
  - explicit save and history refresh,
  - result preservation after save failure,
  - client/trainer switch,
  - multi-session archive handling,
  - root overflow checks at 360, 390, 720, 1024 and 1440 px.
- Test fixtures are synthetic and contain no production personal data.

## Preview deployment

- The exact implementation commit is **not preview deployed**.
- Both linked Vercel project checks for `adc6e2a...` failed with `build-rate-limit`.
- Older successful previews belong to different commits and are not evidence for this implementation.
- Because the migration is not applied to the shared Supabase database, a real preview persistence smoke test is intentionally pending approval even after Vercel accepts a build.

## Production

- `main` was not changed or merged.
- Production remains on commit `71d6b1f0e67c571c71a53db6248e526704bddabe`.
- The production Supabase schema was not changed.
- Production environment variables were not changed.
- Production verification by the user has not occurred.

## Remaining approval gates

1. Explicit approval to apply `20260802_tindeq_sessions.sql` to the shared Supabase project, or provision a separate development/preview branch first.
2. Database post-migration checks and authenticated smoke test without production athlete modifications.
3. Exact-commit Vercel preview and browser review when the build-rate limit permits it.
4. Explicit approval to merge PR `#12` into `main`.
5. Explicit approval for production deployment, followed by user production verification.

## Known limitations

- ZIP decompression relies on `DecompressionStream('deflate-raw')` for current Chromium-class browsers.
- Analytical thresholds remain working heuristics, not validated clinical cut-off values.
- Browser tests use deterministic mocks and synthetic ZIPs; they do not substitute for a post-migration authenticated database smoke test.
- Pain/RPE entry and longitudinal trend modelling remain outside this persistence change.
