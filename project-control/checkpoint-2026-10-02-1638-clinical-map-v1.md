# Checkpoint — Clinical Exercise Map V1

Datum: 2026-10-02 16:38 CEST

## Stav práce

- projekt: `knee.vankotraining.cz`;
- feature větev: `feature/clinical-exercise-map-v1`;
- PR: #29 `feat: add read-only Clinical Exercise Map V1`;
- PR je otevřený, mergeable a **není merged**;
- base: `main@16fac80d02768476a835d448471243fa0e341dcc`;
- poslední ověřený head před checkpoint zápisem: `bcfa99b2219428a6ad8a91f9946c44b2b7946809`.

## Implementováno ve větvi

- top-level navigace Klienti / Clinical Map / Tindeq / Reporty;
- read-only route `/clinical/exercises`;
- capacity matrix 6 stages × 13 canonical exercise families;
- exercise inspector;
- live read-only Training `exercises` overlay;
- A/B/C mapping confidence;
- Visit provenance;
- Clinical Second Brain guardrails;
- explicitní `unknown` / `unresolved`;
- responsive local horizontal scroll;
- unit a Playwright test coverage.

Žádná databázová migrace, production data write, plan generator, dosing engine, automatická diagnóza ani RTS verdict nebyly přidány.

## Fresh data snapshot použitý pro V1

- CLIENTS: 47 Clients, 70 Episodes, 201 unikátních Visits;
- primary knee-context: 15 Episodes / 55 Visits;
- explicitní CLIENTS → athlete UUID bridge: 15 Clients;
- Training: 161 exercises / 158 active;
- source layers: CLIENTS, production Supabase, !!!Exercise_Database, KneeRehab, BV_knee_aid, Clinical Second Brain.

## Test / CI stav při checkpointu

Head `bcfa99b2219428a6ad8a91f9946c44b2b7946809`:

- unit tests: success;
- lint comparison vs current main: success;
- production build: success;
- TypeScript: success;
- project-control check: failure pouze proto, že `PROJECT_STATE.md` postrádal povinnou sekci `## Nasazeno`;
- Playwright se kvůli fail-fast po project-control kroku na tomto headu nespustil.

Checkpoint commit povinnou sekci `## Nasazeno` doplňuje, takže nový exact-head CI je po tomto zápisu pending.

## Preview

Poslední pre-checkpoint head Preview:

- deployment: `dpl_DtcrUrW26vLrvPGWGDY6L5A2jTcS`;
- commit: `bcfa99b2219428a6ad8a91f9946c44b2b7946809`;
- state: `READY`;
- URL: `https://vankotraining-knee-6ci0jgdg6-vankotrainings-projects.vercel.app`.

Preview není produkční deployment ani uživatelské produkční ověření.

## Unresolved mapping queue

- SL squat / podřep on stepper;
- step-down;
- TRX-assisted sit-to-heel;
- medicine-ball drop into split squat;
- assisted full-ROM split squat;
- wall-supported split squat;
- band-resisted hamstring curl.

## Další gate

1. ověřit nový exact-head CI po checkpoint commitech;
2. vyžadovat success unit/lint/build/TypeScript/project-control/whitespace/Playwright;
3. ověřit READY Preview stejného exact headu;
4. následně pouze review PR #29;
5. bez výslovného schválení uživatele PR #29 nemergovat a nic neposílat do produkce.

## Cleanup closeout — 2026-10-02

Tato sekce nahrazuje dřívější pending CI stav výše.

- ověřený cleanup head: `7f1394f60655095fba1f82fce88448bf4f8d983d`;
- Project control workflow `37022278902`: success;
- verification workflow `37022278835`: success;
- unit/lint/build/TypeScript/project-control/whitespace/Chromium: success;
- browser E2E: 16/16 passed;
- auth gate, A/B/C inspector, mobile 320/390 px a overflow kontrakt: success;
- Preview: `dpl_6cQBCHwkcw7vv6b2espiYRCd4jzf`, `READY`;
- URL: `https://vankotraining-knee-9ry4ejl9v-vankotrainings-projects.vercel.app`;
- PR #29 zůstává open a unmerged;
- Clinical Map není v `main`, není produkčně nasazena a není produkčně ověřena;
- další gate: samostatná Preview Supabase environment konfigurace a vizuální review.
