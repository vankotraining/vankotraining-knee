# Production status

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po merge PR #24 a technickém produkčním ověření timestamp dedupe hotfixu.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Runtime deployment PR #24:

`dpl_EvmonjKfidzs8a1unGL7xEbz845j`

## Nasazený commit

Runtime-changing production commit:

`4a3cc8e5fe7010a647ad6bfe844bcc6c804f9812` – merge PR #24 `Fix Tindeq semantic dedupe timestamp comparison`.

Následné project-control commity jsou docs-only a nemění runtime opravy.

## Čas a výsledek deploymentu

- datum: `2026-08-22`;
- deployment `dpl_EvmonjKfidzs8a1unGL7xEbz845j`: `READY`;
- target: `production`;
- branch: `main`;
- commit: `4a3cc8e5fe7010a647ad6bfe844bcc6c804f9812`;
- alias: `knee.vankotraining.cz`;
- `/tindeq`: HTTP 200;
- post-deploy runtime log check: bez `warning`, `error` a `fatal`.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

PR #24 nepřidává DB migraci. Aktivní CHECK constraint zůstává:

`tindeq_sessions_source_session_id_valid = CHECK (COALESCE((raw_metadata->>'tindeqSessionId') ~ '^[0-9a-f]{20}$', false))`

Existující UNIQUE index nad `(athlete_id, analysis_version, raw_metadata->>'tindeqSessionId')` zůstává beze změny.

## Provedené smoke testy

- Android native share production acceptance: funkční;
- první explicitní save test: funkční;
- opakovaný re-export před PR #22: vytvořil druhý row;
- post-PR #22 save: odmítnut CHECK constraintem kvůli `v2:<64 hex>`;
- post-PR #23 save: CHECK prošel, ale vznikl třetí row kvůli exact-string timestamp porovnání;
- PR #24 pre-merge exact head `29cb44533a76bed3f0493218e336763a4e525a7d`: Project control run `32583799152` success, Verify Tindeq client view run `32583799252` success, Vercel Preview success;
- PR #24 production deployment: `READY`, `/tindeq` HTTP 200, bez runtime warning/error/fatal.

Funkční duplicate-save smoke po PR #24 zatím nebyl proveden.

## Poslední výslovné uživatelské produkční ověření

- `2026-08-22`: Android share/import z production APK – funkční;
- `2026-08-22`: první save Rosová Štěpánka – funkční;
- `2026-08-22`: post-PR #23 duplicate-save test – UI hlásilo uložení a DB audit potvrdil vznik třetího aktivního row.

## Produkční stav Tindeq

- Android share/import: **produkčně ověřeno**;
- DB-kompatibilní 20hex stable ID: **nasazeno**;
- semantic duplicate fallback s timestamp normalizací PR #24: **nasazeno a technicky ověřeno**;
- funkční duplicate-save acceptance PR #24: **open**.

## Známé produkční problémy

- před PR #24 vznikly pro testované měření tři aktivní rows:
  - `b65d0e32-6e68-407c-9d3f-385112111ea9`;
  - `eacaecc9-9185-4cb8-8e52-561872e49cd5`;
  - `a0a6e36f-6ed7-4c58-9f3c-55247e770d34`;
- žádný z nich nebyl bez explicitního schválení odstraněn ani soft-deleted;
- PR #24 ještě potřebuje jeden funkční production duplicate-save acceptance test;
- full-repo lint baseline má předexistující `3 errors / 1 warning`.
