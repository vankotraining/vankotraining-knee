# Production status

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po merge a technickém produkčním ověření PR #23.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Nasazený runtime commit

`59e7f362652e2eedff1e5e7764bbc05181ee1aa2` – merge PR #23 `Fix Tindeq stable ID DB constraint compatibility`.

## Produkční deployment

`dpl_GdVMkTenqui48VLoHNBaVDPHSr4f`

- state: `READY`;
- target: `production`;
- branch: `main`;
- commit: `59e7f362652e2eedff1e5e7764bbc05181ee1aa2`;
- production alias: `knee.vankotraining.cz`;
- `/tindeq`: HTTP 200;
- post-deploy runtime log check: žádný `warning`, `error` ani `fatal`.

## Databázový kontrakt

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Aktivní CHECK constraint:

`tindeq_sessions_source_session_id_valid = CHECK (COALESCE((raw_metadata->>'tindeqSessionId') ~ '^[0-9a-f]{20}$', false))`

PR #23 zachovává semantic SHA-256 identitu, ale do `raw_metadata.tindeqSessionId` zapisuje prvních 10 bytů digestu = `20` lowercase hex znaků. Tím je nová identita kompatibilní se stávajícím CHECK constraintem i UNIQUE indexem. DB migrace nebyla provedena ani není pro hotfix potřeba.

## Automatizované ověření PR #23

Exact-head `0239093b5db96af89dab81d669894e717aa207ec` před merge:

- unit testy: success;
- lint comparison vůči main: success;
- production build: success;
- TypeScript: success;
- project-control check: success;
- browser Tindeq verification: success;
- `Verify Tindeq client view` run `32582271916`: success;
- `Project control` run `32582271918`: success;
- Vercel Preview: success;
- unresolved review threads: none.

## Produkční smoke historie

- Android native Tindeq share z production APK: ověřeno na skutečném telefonu;
- první save měření Rosová Štěpánka `14. 8. 2026 14:31`: úspěšný;
- opakovaný re-export před PR #22: vytvořil skutečnou duplicitu;
- post-PR #22 save: odmítnut DB CHECK constraintem kvůli `v2:<64 hex>` ID; třetí row nevznikl;
- PR #23 technický deployment: úspěšný;
- PR #23 funkční duplicate-save test na telefonu: **zatím otevřený**.

## Produkční data testu

Stále existují dva aktivní rows stejného testovacího měření:

- `b65d0e32-6e68-407c-9d3f-385112111ea9`;
- `eacaecc9-9185-4cb8-8e52-561872e49cd5`.

Testovací duplicate row nebyl odstraněn ani soft-deleted. Jakékoliv čištění je samostatná produkční datová mutace a vyžaduje explicitní schválení.

## Aktuální produkční stav Tindeq

- Android share/import: **nasazeno a produkčně ověřeno**;
- semantic dedupe logika: **nasazena**;
- DB-kompatibilní stable ID hotfix PR #23: **nasazen a technicky ověřen**;
- funkční duplicate-save acceptance po PR #23: **open**.
