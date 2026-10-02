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

## Final exact-head automated verification

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

## Stav vůči main/production

- implementováno ve větvi: ano, PR #29;
- automatizovaně otestováno: ano, na exact headu `7f1394f60655095fba1f82fce88448bf4f8d983d`;
- preview nasazeno: ano, exact-head deployment `READY`;
- PR #29: open a unmerged;
- implementováno v `main`: ne;
- produkčně nasazeno: ne;
- produkčně ověřeno: ne.

Další samostatný gate je Preview Supabase environment a vizuální review; cleanup nemění Preview env, `main` ani produkci.

## Merge gate

Bez dalšího výslovného schválení uživatele PR #29 nemergovat. Před merge musí final exact head projít CI a mít READY Preview. Produkční ověření lze označit až po případném merge/deploymentu a samostatném uživatelském acceptance.
