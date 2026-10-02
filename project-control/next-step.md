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

Na pre-doc code headu `c30a566f64bd4207ddc14f2b748bbd86d42987d4`:

- unit tests: success;
- lint comparison vs current main: success;
- production build: success;
- TypeScript: success;
- project-control check: success;
- Vercel Preview `dpl_9p6gk3YdsvRiQVoeYsx3dMay66Mw`: READY;
- whitespace gate našel pouze dvě trailing spaces v docs převzatých z PR #28; v PR #29 jsou opraveny;
- browser E2E na tomto headu kvůli fail-fast ještě nebylo spuštěno.

Preview bez veřejné Supabase Preview konfigurace fail-closed zobrazí „Chybí Supabase konfigurace“; produkční credentials nebyly kvůli tomu do Preview kopírovány. Final exact-head CI s testovým Supabase environmentem musí ověřit authenticated UI a mobile behavior.

## Nejbližší gate

1. nechat final exact head PR #29 projít celým CI včetně Playwright;
2. ověřit READY Preview stejného headu;
3. předložit PR #29 uživateli k vizuálnímu/klinickému review;
4. bez výslovného schválení uživatele PR nemergovat;
5. po případném schválení provést fresh pre-merge kontrolu a teprve pak řešit merge/produkční ověření.

Detail feature scope: `clinical-exercise-map-v1-2026-10-02.md`.
Implementační evidence: `clinical-exercise-map-v1-implementation-2026-10-02.md`.
Architektonické rozhodnutí: `decisions/0002-clinical-exercise-map.md`.
