# Next Step

## Aktuální fáze

Clinical Exercise Map V1 je **implementována ve feature větvi**, nikoli v `main`.

- větev: `feature/clinical-exercise-map-v1`;
- PR: #29 `feat: add read-only Clinical Exercise Map V1`;
- route: `/clinical/exercises`;
- režim: read-only;
- production databázová migrace: žádná;
- dev-only migration applied on dev: version `20261002181856`;
- isolated audit artifact: `supabase/dev-migrations/20261002181856_align_clinical_map_dev_training_library.sql`;
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

Ověřený cleanup head: `62933a6b5c2fc85b61285a0bc53b42c0a0e877e0`.

- Project control workflow `37022924517`: success;
- verification workflow `37022925652`: success;
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

- deployment: `dpl_3LKXfdxBSzm4rwv4TwB1jNtQnZhd`;
- commit: `62933a6b5c2fc85b61285a0bc53b42c0a0e877e0`;
- URL: `https://vankotraining-knee-8ai0l66ew-vankotrainings-projects.vercel.app`;
- state: `READY`.

Preview může bez veřejné Supabase Preview konfigurace nadále fail-closed zobrazit „Chybí Supabase konfigurace“. Tato konfigurace nebyla v cleanupu měněna.

## Dev Training alignment — dokončeno 2026-10-02

- dev Supabase `twndqnmrvefhwuwuglju`: `ACTIVE_HEALTHY`;
- `exercise_families`: 32, production parity;
- `exercises`: 161 total / 158 active / 3 inactive, production parity;
- full-row UUID + metadata digest parity: ano;
- Clinical Map manifest: 9/9 UUID present and compatible;
- RLS: enabled;
- `anon`: bez přístupu;
- `authenticated`: read-only, vidí families a pouze active exercises;
- production coach/owner write policy nebyla přenesena;
- production Supabase byla pouze read-only source;
- migration artifact isolated: ano, mimo `supabase/migrations/`;
- dev i production DB stav při izolaci artefaktu: beze změny;
- production migration history: beze změny, version `20261002181856` není aplikovaná;
- dev backend: **READY FOR CLINICAL MAP PREVIEW ENV**;
- Vercel env configured: ne;
- alignment exact-head Preview: automaticky nasazen a `READY`;
- Preview env configured: ne;
- authenticated visual review: ne.

## Nejbližší gate

1. nastavit branch-specific Vercel Preview env pouze pro `feature/clinical-exercise-map-v1`;
2. vytvořit nový exact-head Preview;
3. ověřit authenticated `/clinical/exercises` a provést vizuální/klinické review;
4. PR #29 ponechat open a unmerged do výslovného schválení.

Clinical Map je implementována a automatizovaně ověřena ve feature větvi, ale není v `main`, není produkčně nasazena a není produkčně ověřena.

Detail feature scope: `clinical-exercise-map-v1-2026-10-02.md`.
Implementační evidence: `clinical-exercise-map-v1-implementation-2026-10-02.md`.
Architektonické rozhodnutí: `decisions/0002-clinical-exercise-map.md`.
