# Production status

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po produkčním duplicate-save testu po PR #23 a root-cause auditu false-negative semantic dedupe.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Runtime deployment PR #23:

`dpl_GdVMkTenqui48VLoHNBaVDPHSr4f`

## Nasazený commit

Runtime-changing production commit:

`59e7f362652e2eedff1e5e7764bbc05181ee1aa2` – merge PR #23.

Aktuální `main@22fd311c727c2917f730b5289bea97737a75246f` je následný docs-only sync.

## Čas a výsledek deploymentu

- PR #23 merged: `2026-08-22T15:59:22Z`;
- deployment `dpl_GdVMkTenqui48VLoHNBaVDPHSr4f`: `READY`;
- target: `production`;
- branch: `main`;
- alias: `knee.vankotraining.cz`;
- `/tindeq`: HTTP 200;
- post-deploy log check: bez `warning/error/fatal`.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

PR #23 ani PR #24 nepřidávají DB migraci. Aktivní CHECK constraint zůstává:

`tindeq_sessions_source_session_id_valid = CHECK (COALESCE((raw_metadata->>'tindeqSessionId') ~ '^[0-9a-f]{20}$', false))`

Existing UNIQUE index nad `(athlete_id, analysis_version, raw_metadata->>'tindeqSessionId')` zůstává beze změny.

## Provedené smoke testy

- Android native share production acceptance: funkční;
- první explicitní save test: funkční;
- opakovaný re-export před PR #22: vytvořil druhý row;
- post-PR #22 save: odmítnut CHECK constraintem kvůli `v2:<64 hex>`;
- post-PR #23 save: DB CHECK již prošel, ale vznikl třetí row místo duplicate feedbacku.

Read-only audit tří rows potvrdil shodu všech semantic dedupe hodnot. Root cause je exact-string porovnání `measured_at`, které nerozpozná ekvivalentní ISO reprezentace stejného okamžiku (`.000Z` vs `+00:00`).

PR #24 head `b293a0ee982ea2c19359624ef79f23c169246807` prošel `125/125` unit testů, lint comparison bez nové regrese, production build a TypeScript; první CI běh zastavil pouze project-control check kvůli povinným názvům sekcí.

## Poslední výslovné uživatelské produkční ověření

- `2026-08-22`: Android share/import z production APK – funkční;
- `2026-08-22`: první save Rosová Štěpánka – funkční;
- `2026-08-22`: post-PR #23 duplicate-save test – UI hlásilo uložení a DB audit potvrdil vznik třetího aktivního row.

## Produkční stav Tindeq

- Android share/import: **produkčně ověřeno**;
- DB-kompatibilní 20hex stable ID: **nasazeno a technicky funkční**;
- semantic duplicate fallback v aktuálním production runtime: **vadný kvůli stringovému timestamp porovnání**;
- PR #24 timestamp-normalization hotfix: **rozpracován mimo main, neprodukční**.

## Známé produkční problémy

- aktuální production runtime může pro stejný okamžik v jiné ISO textové reprezentaci minout semantic duplicate fallback;
- pro testované měření existují tři aktivní rows:
  - `b65d0e32-6e68-407c-9d3f-385112111ea9`;
  - `eacaecc9-9185-4cb8-8e52-561872e49cd5`;
  - `a0a6e36f-6ed7-4c58-9f3c-55247e770d34`;
- žádný z nich nebyl bez explicitního schválení odstraněn ani soft-deleted;
- full-repo lint baseline má předexistující `3 errors / 1 warning`.
