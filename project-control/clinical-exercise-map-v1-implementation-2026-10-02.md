# Clinical Exercise Map V1 — implementation evidence

Datum: 2026-10-02  
Větev: `feature/clinical-exercise-map-v1`  
PR: #29 `feat: add read-only Clinical Exercise Map V1`

## Authority a scope

Implementace je read-only projekce. Nemění CLIENTS, Training plans/workouts, canonical Exercise DB ani Clinical Second Brain a neobsahuje databázovou migraci.

- CLIENTS = doložený klinický průběh a použití intervencí;
- Knee/Tindeq/Fmax = objektivní longitudinal capacity kontext;
- Training = canonical exercise library a `exercise_id`;
- historické programy = sekundární provenance;
- Clinical Second Brain = evidence/guardrail autorita.

Projection manifest v `src/lib/clinical-exercise-map-v1.ts` je verzovaný adaptér vytvořený z fresh auditu. Není novým source of truth. Aktivní Training `exercises` se po přihlášení čtou live ze Supabase a overlayují na projection podle `exercise_id`.

## Fresh audit 2026-10-02

Autoritativně ověřeno před implementací:

- `main`: `16fac80d02768476a835d448471243fa0e341dcc`;
- produkční Supabase: `zxvndqicslyulrinbpyn`;
- Training: 161 exercises / 158 active;
- canonical CLIENTS: 47 Clients, 70 Episodes, **201 unikátních Visits**;
- primary knee-context: 15 Episodes / 55 jejich Visits;
- identity bridge: 15 Clients s explicitním `Tindeq_Athlete_ID`;
- Clinical Second Brain: Source Index + Knowledge Claims;
- další exercise zdroje: !!!Exercise_Database, KneeRehab, BV_knee_aid.

Dřívější číslo 202 Visits z prvního auditu je fresh kontrolou nahrazeno hodnotou 201 unikátních `Visit_ID`. Počty použití cviků jsou provenance, ne evidence účinnosti.

## Datový/projection model

V1 používá dva read-only vstupy:

1. **live Training overlay**
   - klientský GET z `public.exercises`;
   - pouze `is_active = true`;
   - žádný INSERT/UPDATE/DELETE;
   - live record ověřuje, že snapshot `exercise_id` stále existuje a ukazuje aktuální Training metadata.

2. **source-derived projection manifest**
   - capacity placement;
   - clinical family + variant;
   - A/B/C confidence;
   - Visit provenance bez jmen klientů;
   - relevantní clinical contexts;
   - load signature pouze tam, kde je doložená;
   - CSB claim/guardrail references;
   - explicitní unresolved questions.

Unknown zůstává `unknown`; chybějící Training mapping zůstává `unresolved`.

## Implementováno ve větvi

- top-level navigace `Klienti / Clinical Map / Tindeq / Reporty`;
- route `/clinical/exercises`;
- auth gate přes existující Knee Supabase session;
- šest capacity columns:
  - Tolerance;
  - Force / activation;
  - Strength / capacity;
  - Deep ROM / knee-forward;
  - Dynamic;
  - Sport;
- 13 canonical exercise-family rows;
- horizontální scroll uvnitř matrix viewportu, nikoli page-level;
- sticky family labels;
- tap/click karty se stabilním selected stavem;
- exercise inspector;
- live Training mapping a `exercise_id`;
- A/B/C provenance/confidence;
- load signature s explicitním `unknown`;
- clinical contexts bez automatického povýšení na diagnózu;
- Clinical Second Brain guardrails bez tvrzení, že konkrétní cvik léčí konkrétní diagnózu;
- unit tests a Playwright coverage pro auth, A/B/C a mobile 320/390 px.

Nejsou implementovány prázdné future-view přepínače.

## Mapping snapshot V1

### A — direct clinical use

- Single-leg wall sit → Training `Single leg wall sit`;
- generic Split squat → Training `Split squat`.

A znamená, že varianta je explicitně doložena ve Visit. Není to evidence rank ani automatický prescription.

### B — probable canonical mapping

- isometric knee extension → `Isometric seated leg extension with miniband`;
- machine knee extension → `Knee extension - machine`;
- split-stance hip hinge → `Dumbbell/kettlebell staggered-stance deadlift`;
- split-stance bridge → `Staggered stance hip lifts with dumbbell`;
- single-leg calf raise → `Calf raises`;
- split-squat hop/jump → `Split squat jump`.

Visit text dobře odpovídá Training variantě, ale Visit neukládá explicitní `exercise_id` nebo není doložený celý setup.

### C — unresolved / clinician decision

- step-down;
- SL squat / podřep on stepper;
- TRX-assisted sit-to-heel;
- medicine-ball drop into split squat;
- assisted full-ROM split squat;
- wall-supported split squat;
- band-resisted hamstring curl;
- half-kneeling ankle dorsiflexion je v mapě pouze jako Training/historical library availability, ne jako doložené knee-context direct clinical use.

U C se exact mapping automaticky nenahrazuje podobným Training cvikem.

## Evidence guardrails

V1 odkazuje zejména na:

- `PFP-CLM-003`;
- `PT-CLM-001`;
- `MEN-CLM-002`;
- `MEN-CLM-006`;
- `ACL-CLM-005`.

Jde o guardrails pro kontext a progresi, ne důkaz exercise-specific účinnosti.

## Test/deployment evidence před finálním docs commitem

Code head `c30a566f64bd4207ddc14f2b748bbd86d42987d4`:

- unit tests: success;
- lint comparison proti current `main`: success; branch nepřidal nový lint error/warning nad baseline;
- production build: success;
- `npx tsc --noEmit`: success;
- `project:check`: success;
- `git diff --check`: zastavil workflow pouze na dvou trailing-space řádcích přinesených docs PR #28; oba jsou v tomto implementačním PR opraveny;
- browser E2E se na tomto pre-doc headu kvůli fail-fast po whitespace kroku ještě nespustilo.

Pre-doc exact-head Preview:

- deployment: `dpl_9p6gk3YdsvRiQVoeYsx3dMay66Mw`;
- commit: `c30a566f64bd4207ddc14f2b748bbd86d42987d4`;
- state: `READY`;
- URL: `https://vankotraining-knee-nz14kp73m-vankotrainings-projects.vercel.app`;
- `/clinical/exercises`: HTTP 200.

Preview target aktuálně nemá veřejnou Supabase konfiguraci dostupnou buildu/browseru a proto bez doplnění správného Preview environmentu zobrazí fail-closed stav „Chybí Supabase konfigurace“. Produkční Supabase údaje se kvůli tomu do Preview nekopírovaly. Authenticated/live-data chování je kryté browser testem s testovým Supabase environmentem; finální exact-head CI musí ještě projít po tomto docs update.

## Stav vůči main/production

- navrženo: ano;
- implementováno ve větvi: ano, PR #29;
- automatizovaně otestováno: částečně na pre-doc headu; finální exact-head gate pending v okamžiku tohoto zápisu;
- preview nasazeno: ano, pre-doc head READY;
- implementováno v `main`: ne;
- produkčně nasazeno: ne;
- produkčně ověřeno: ne.

## Merge gate

Bez dalšího výslovného schválení uživatele PR #29 nemergovat. Před merge musí final exact head projít CI a mít READY Preview. Produkční ověření lze označit až po případném merge/deploymentu a samostatném uživatelském acceptance.
