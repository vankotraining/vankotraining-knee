# Tindeq results site

## Source of truth

- Base branch: `main`
- Base commit reviewed before implementation: `71d6b1f0e67c571c71a53db6248e526704bddabe`
- Working branch: `agent/tindeq-results-site`
- Implementation commit verified by automated tests: `e480fc3f8563f158cf406f4464b7b2602f227246`
- Documentation head after approved migration evidence: `ca59d9341d942dbf1db0b79242f8905d6cfd521c`
- Draft pull request: `#12`
- Route: `/tindeq`
- Shared Supabase project: `zxvndqicslyulrinbpyn`

## Status vocabulary

- **Implemented** means the change exists on the working branch.
- **Tested** means automated evidence exists for the exact implementation commit.
- **Database applied** means the migration exists in the shared Supabase migration history and post-migration checks passed.
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

## Database migration applied

Migration file: `supabase/migrations/20260802_tindeq_sessions.sql`.
Verification queries: `supabase/checks/20260802_tindeq_sessions_checks.sql`.

The migration created `public.tindeq_sessions` with:

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

### Application evidence

- User approval received on `2026-08-02`.
- Applied to shared project `zxvndqicslyulrinbpyn`.
- Supabase migration history entry: version `20260802124337`, name `tindeq_sessions`.
- PostgreSQL version at application: `17.6` on Supabase GA.
- The table existed after application with RLS enabled and zero rows.
- All expected columns, constraints, indexes, three RLS policies, grants and triggers were present.
- `anon` has no table `select` or `insert` privilege.
- `authenticated` has `select` and `insert`; update is limited to soft-delete/audit columns and does not permit changing stored analytical source fields.
- New Tindeq soft-delete/restore functions are not executable by `PUBLIC` or `anon`; they are executable by `authenticated` and additionally require `auth.uid()` plus `is_knee_admin()`.

### Authenticated transactional smoke test

A database-level smoke test was executed as the existing authenticated knee administrator against an existing active athlete, entirely inside a transaction that was rolled back.

Verified behavior:

- an authenticated administrator can insert a valid normalized Tindeq row,
- the inserted row is visible through RLS,
- direct update of `source_filename` is rejected,
- soft-delete hides the row through RLS,
- restore makes the row visible again,
- the transaction rollback completed,
- `public.tindeq_sessions` contained **0 rows** after the test.

No athlete, profile, knee-extension measurement or persistent Tindeq record was created, updated or deleted by the smoke test.

### RLS limitation

The current application is effectively a single authorized knee administrator. `is_knee_admin()` currently authorizes the configured administrator email. This is consistent with the inspected knee tables but is not a multi-tenant ownership model. Before multi-user use, rows need explicit owner/organization columns and ownership-scoped RLS.

### Advisor findings

Supabase security and performance advisors were run after the migration.

- No missing RLS policy, missing primary key or unindexed foreign-key finding was reported for `tindeq_sessions`.
- The two new indexes are reported as unused because the table is currently empty; this is expected before real history queries occur.
- The generic security advisor warns about authenticated access to the two intentional security-definer Tindeq soft-delete/restore functions. Their bodies require a non-null authenticated user and `is_knee_admin()`, and the transactional smoke test verified the intended path.
- Existing project-wide advisor findings remain outside this migration, including security-definer views, mutable function search paths, and pre-existing athlete/knee RPC execute grants. These should be handled as a separate security-hardening change rather than silently mixed into this feature migration.

## Automated verification

Verified implementation commit: `e480fc3f8563f158cf406f4464b7b2602f227246`.
GitHub Actions workflow: `Verify Tindeq client view`, run `30747106945`.
Screenshot artifact: `tindeq-client-view-screenshots`, artifact ID `8833240463`.

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
- Both linked Vercel project checks for `e480fc3f...` failed with `build-rate-limit`.
- Older successful previews belong to different commits and are not evidence for this implementation.
- The database prerequisite is now satisfied. A real browser/Data API persistence smoke test remains pending an exact-commit preview.

## Production

- `main` was not changed or merged.
- Production application remains on commit `71d6b1f0e67c571c71a53db6248e526704bddabe`.
- The shared Supabase schema **was changed** by the approved migration described above.
- Production environment variables were not changed.
- No persistent Tindeq measurement data was created during verification.
- Production application verification by the user has not occurred.

## Remaining approval gates

1. Obtain an exact-commit Vercel preview when the build-rate limit permits it.
2. Run a real browser/Data API save-and-history smoke test in preview without retaining test data.
3. Explicit approval to merge PR `#12` into `main`.
4. Explicit approval for production deployment, followed by user production verification.

## Known limitations

- ZIP decompression relies on `DecompressionStream('deflate-raw')` for current Chromium-class browsers.
- Analytical thresholds remain working heuristics, not validated clinical cut-off values.
- Browser tests use deterministic mocks and synthetic ZIPs; the database path has been transactionally verified, but end-to-end browser/Data API verification still requires the exact preview.
- Pain/RPE entry and longitudinal trend modelling remain outside this persistence change.
