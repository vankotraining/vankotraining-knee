# Next Step

## Aktuální fáze

Clinical Exercise Map V1 je **implementována ve feature větvi**, nikoli v `main`.

- větev: `feature/clinical-exercise-map-v1`;
- PR: #29 `feat: add read-only Clinical Exercise Map V1`;
- route: `/clinical/exercises`;
- režim: read-only;
- databázová migrace: žádná;
- produkční data write: žádný;
- merge: neproveden;
- produkční deployment/acceptance: neproveden.

Implementace vychází z dokumentačního směru PR #28; PR #29 obsahuje i tyto dosud nesloučené project-control změny.

## Fresh zdrojový stav 2026-10-02

- current `main`: `16fac80d02768476a835d448471243fa0e341dcc`;
- production Supabase `zxvndqicslyulrinbpyn`: 161 Training exercises / 158 active;
- canonical CLIENTS: 47 Clients / 70 Episodes / **201 unikátních Visits**;
- primary knee-context: 15 Episodes / 55 jejich Visits;
- explicitní CLIENTS → athlete UUID bridge: 15 Clients;
- Clinical Second Brain: Source Index + Knowledge Claims;
- sekundární exercise zdroje: !!!Exercise_Database, KneeRehab, BV_knee_aid.

Dřívější předběžný údaj 202 Visits je fresh kontrolou nahrazen 201 unikátními `Visit_ID`.

## Implementováno v PR #29

- top-level navigace Klienti / Clinical Map / Tindeq / Reporty;
- read-only auth-gated `/clinical/exercises`;
- six-capacity matrix × 13 canonical exercise families;
- source-derived provenance/confidence projection;
- live GET overlay aktivní Training `exercises` podle `exercise_id`;
- A/B/C mapping confidence;
- read-only exercise inspector;
- explicitní `unknown` / `unresolved`;
- CSB evidence/guardrail references oddělené od exercise-specific účinnosti;
- lokální horizontal scroll matice a sticky family labels;
- unit a Playwright coverage včetně 320/390 px.

Není implementován plan generator, dosing engine, automatická diagnóza, automatický RTS verdict ani zápis do CLIENTS/Training.

## Unresolved mapping queue

- SL squat / podřep on stepper;
- step-down;
- TRX-assisted sit-to-heel;
- medicine-ball drop into split squat;
- assisted full-ROM split squat;
- wall-supported split squat;
- band-resisted hamstring curl.

Tyto varianty nesmí být před review automaticky nahrazeny podobným Training `exercise_id`.

## Aktuální ověřovací evidence

Ověřený cleanup head: `7f1394f60655095fba1f82fce88448bf4f8d983d`.

- Project control workflow `37022278902`: success;
- verification workflow `37022278835`: success;
- unit tests: success;
- lint comparison proti aktuálnímu `main`: success, bez nového lint problému nad baseline;
- production build: success;
- TypeScript: success;
- project-control check: success;
- `git diff --check origin/main...HEAD`: success;
- Chromium/Playwright install: success;
- browser E2E: **16/16 passed**;
- auth-gated Clinical Map: success;
- A/B/C inspector: success;
- mobile 320 px a 390 px: success;
- page-level horizontal overflow: žádný;
- matrix horizontal scroll: zůstává lokální.

Exact-head Vercel Preview:

- deployment: `dpl_6cQBCHwkcw7vv6b2espiYRCd4jzf`;
- commit: `7f1394f60655095fba1f82fce88448bf4f8d983d`;
- URL: `https://vankotraining-knee-9ry4ejl9v-vankotrainings-projects.vercel.app`;
- state: `READY`.

Preview může bez veřejné Supabase Preview konfigurace nadále fail-closed zobrazit „Chybí Supabase konfigurace“. Tato konfigurace nebyla v cleanupu měněna.

## Nejbližší gate

1. samostatně nastavit bezpečný Preview Supabase environment;
2. provést vizuální/klinické review exact-head Preview;
3. PR #29 ponechat open a unmerged do výslovného schválení;
4. až po schválení provést fresh pre-merge kontrolu.

Clinical Map je implementována a automatizovaně ověřena ve feature větvi, ale není v `main`, není produkčně nasazena a není produkčně ověřena.

Detail feature scope: `clinical-exercise-map-v1-2026-10-02.md`.
Implementační evidence: `clinical-exercise-map-v1-implementation-2026-10-02.md`.
Architektonické rozhodnutí: `decisions/0002-clinical-exercise-map.md`.
