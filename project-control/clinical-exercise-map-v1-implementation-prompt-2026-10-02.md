# Implementation prompt — Clinical Exercise Map V1

Pokračujeme v projektu `knee.vankotraining.cz` / Vanko Training Knee.

## Hlavní úkol

Navrhni a implementuj první skutečný **read-only frontend Clinical Exercise Map V1** jako samostatný top-level workspace Knee aplikace.

Cílem tohoto kroku není generovat rehabilitační plány ani měnit klinická data. Cílem je dostat existující klinické, exercise-library a evidence informace vizuálně do produkčního typu rozhraní, aby nad nimi bylo možné dále klinicky a produktově přemýšlet.

Navržená route:

`/clinical/exercises`

Uživatelský název:

**Clinical Map**

## Nezačínej implementací naslepo

Před jakoukoli změnou fresh načti skutečný stav a považuj ho za autoritativní.

Ověř minimálně:

1. aktuální `main` repozitáře `vankotraining/vankotraining-knee`;
2. celý adresář `project-control`, zejména:
   - `README.md`
   - `PROJECT_SPEC.md`
   - `PROJECT_STATE.md`
   - `PRODUCTION_STATUS.md`
   - `next-step.md`
   - `decisions/0001-foundational-architecture-and-data.md`
   - `decisions/0002-clinical-exercise-map.md`
   - `clinical-exercise-map-v1-2026-10-02.md`;
3. současnou Next.js route/navigation strukturu včetně:
   - `src/app/page.tsx`
   - `src/app/layout.tsx`
   - `src/app/components/KneeApp.tsx`
   - `src/app/components/KneeDashboard.tsx`
   - `src/app/tindeq/**`
   - relevantních CSS;
4. `package.json`, testy a CI;
5. aktuální Vercel project/deployment stav;
6. produkční Supabase `vankotraining` / project ref `zxvndqicslyulrinbpyn`;
7. relevantní tabulky Training/Knee:
   - `athletes`
   - `athlete_profiles`
   - `knee_extension_tests`
   - `tindeq_sessions`
   - `exercises`
   - `plans`
   - `workouts`
   - `workout_items`
   - `feedback`;
8. CLIENTS Google Sheet:
   - `Clients`
   - `Episodes`
   - `Visits`
   - relevantní identity/alias/reconciliation vrstvy;
9. další exercise zdroje nalezené při auditu:
   - `!!!Exercise_Database`
   - `KneeRehab`
   - `BV_knee_aid`;
10. Clinical Second Brain:
   - `Source Index`
   - `Knowledge Claims`
   - relevantní PFP / patellar tendon / meniscus / ACL claims.

Nevycházej pouze z tohoto promptu, pokud se skutečné zdroje mezitím změnily.

## Authority model

Důsledně zachovej tyto hranice:

- **CLIENTS** = skutečný průběh péče a doložené intervence;
- **Knee/Tindeq/Fmax** = objektivní měření a longitudinal capacity kontext;
- **Training** = canonical exercise library a digitální `exercise_id`;
- **historické programy** = sekundární zdroj exercise variant a programovací zkušenosti;
- **Clinical Second Brain** = evidence authority a klinické guardrails.

Clinical Map je pouze read-only projekce těchto vrstev.

Nevytvářej novou paralelní klinickou ani evidence autoritu.

## Co už audit orientačně ukázal

Při read-only auditu 2026-10-02 bylo v canonical CLIENTS:

- 202 Visits;
- 15 epizod s explicitním knee/meniscus/ACL/quadriceps kontextem.

V přímém knee-contextu se opakovaně objevovaly rodiny:

- Tindeq / knee extension;
- wall isometrics;
- split squat;
- squat / deep flexion;
- step-down / single-leg squat;
- hip hinge / deadlift;
- bridge / hip thrust;
- hamstring curl;
- calf;
- jump / hop / drop.

Tyto počty a výskyty znovu fresh ověř. Jsou to provenance data, nikoli evidence účinnosti.

## Produktové rozhodnutí V1

Clinical Map má být třetí top-level pracovní surface vedle:

- klient/Fmax workspace;
- Tindeq workspace.

Nedávej ji dovnitř Fmax detailu ani Tindeq.

### Primární route

`/clinical/exercises`

### V1 režim

**read-only**

V tomto kroku:

- nevytvářej rehabilitační plán;
- nezapisuj do Visits;
- neměň Training plans/workouts;
- neměň canonical Exercise DB;
- nevytvářej automatickou diagnózu;
- nevytvářej automatický RTS verdict;
- neimplementuj dosing engine;
- nedělej databázovou migraci, pokud fresh technický audit neprokáže, že bez ní nelze bezpečně udělat read-only V1. Pokud by migrace byla skutečně nutná, nejprve ji pouze navrhni a vysvětli; neaplikuj ji bez samostatného schválení.

## Klinický model

Nevytvářej strukturu typu:

`diagnóza → pevný protokol cviků`.

Použij exercise-first/capacity-first model:

`diagnóza/operace → guardrails → limiter/capacity → load requirement → exercise family → varianta → budoucí dávka → response`.

### Hlavní capacity osa V1

1. **Tolerance**
2. **Force / activation**
3. **Strength / capacity**
4. **Deep ROM / knee-forward**
5. **Dynamic**
6. **Sport**

Toto není rigidní lineární časová osa.

## Canonical Exercise Map

Začni minimálně s těmito families:

- knee_extension
- wall_isometric
- split_squat
- squat
- step
- single_leg_squat
- hip_hinge
- bridge
- hamstring_curl
- calf
- landing
- hop_jump
- mobility_adjunct

Jeden canonical cvik nesmí být duplikovaný pro každou diagnózu.

Každá karta/varianta má podle dostupnosti nést:

- canonical family;
- variant;
- Training `exercise_id` nebo `unresolved`;
- contraction type;
- unilateral/bilateral;
- ROM / knee-flexion demand;
- knee-forward demand;
- velocity;
- impact/loading-rate demand;
- deceleration demand;
- assistance;
- možnost external load;
- clinical-use provenance;
- mapping confidence;
- relevantní clinical contexts;
- evidence/guardrail reference.

Nevymýšlej metadata, která nejsou doložena. Unknown může zůstat unknown.

## Mapping confidence

Použij explicitně minimálně:

- **A — direct clinical use**: cvik/varianta je explicitně doložena ve Visit;
- **B — probable canonical mapping**: text ve Visit velmi dobře odpovídá Training cviku, ale Visit neukládá explicitní exercise_id;
- **C — unresolved / clinician decision**: variantu nebo mapping nelze bezpečně určit.

Historický program nesmí být prezentován jako direct clinical use.

Evidence source nesmí být prezentován jako důkaz, že konkrétní cvik „léčí“ konkrétní diagnózu.

## Povinný frontend V1

### 1. Top-level navigace

Navrhni bezpečnou navigaci, která umožní přepínat minimálně:

- Klienti
- Clinical Map
- Tindeq
- Reporty

Respektuj existující mobilní responsive pravidla. Nesmí se opakovat dřívější překrývání horních tlačítek.

### 2. Capacity view

Výchozí obrazovka:

- sloupce = 6 capacity stages;
- řádky = exercise families;
- uvnitř = exercise/variant cards;
- široká desktop matice;
- na mobilu lokální horizontální scroll, ne page-level overflow;
- family label pokud možno sticky;
- karta musí být použitelná tap/click, ne jen hover.

### 3. Exercise inspector

Po výběru karty ukaž read-only detail:

- canonical name;
- family / variant;
- phase/capacity placement;
- Training mapping + exercise_id;
- mapping confidence;
- clinical use / provenance;
- relevantní contexts;
- load signature;
- evidence/guardrails;
- unresolved otázky.

### 4. Další views

Navrhni UI a datový model tak, aby stejná data mohla později podporovat:

- podle kapacity;
- podle problému / diagnózy;
- podle cviku;
- klient.

Pokud by implementace všech čtyř pohledů významně nafoukla první PR, priorita je:

1. capacity view;
2. exercise inspector;
3. provenance/confidence;
4. architektura připravená pro další views.

Neimplementuj prázdná nebo fake tlačítka.

## Diagnostické / klinické filtry do budoucna

Model musí být kompatibilní minimálně s:

- PFP / anterior knee pain;
- patellar / quadriceps tendon context;
- meniscus repair / meniscectomy / non-op;
- ACL / ACLR / non-op;
- postoperative quadriceps deficit;
- nonspecific/load-related knee pain.

Working hypothesis z Visit se nesmí automaticky proměnit na potvrzenou diagnózu.

## Známá unresolved fronta

Minimálně ověř:

- SL squat na stepru;
- step-down varianty;
- TRX dosedávání / sit-to-heel;
- drop medicinbalu do split squatu;
- assisted full-ROM split squat;
- wall-supported split-squat varianty.

Pokud neexistuje bezpečný exact mapping, zobraz `unresolved`.

## Data implementation preference

Preferuj nejmenší bezpečné řešení.

Pokud lze V1 udělat jako read-only server-side projection/adaptor nad existujícími daty, preferuj to před novým persistentním schema modelem.

Hardcoded demo data mohou sloužit jen k testu layoutu, nikdy jako produkční source of truth.

Dávej pozor na:

- soft-deleted records;
- identity bridge mezi CLIENTS a athlete UUID;
- neexistující explicitní Visit → exercise_id foreign key;
- volný text ve Visits;
- rozdíl mezi clinical use, library availability a evidence.

## UX

Vzhled má navazovat na současnou Knee aplikaci:

- stávající green/neutral design tokens;
- vysoká informační hustota, ale dobrá čitelnost;
- desktop i mobil;
- žádné zbytečné vizuální efekty;
- kliknutý cvik drží výběr;
- provenance musí být viditelná;
- unknown/unresolved stav neskrývat.

Uživatel chce mít věci vizuálně před sebou, protože podle produkčního UI lépe přemýšlí o klinickém a produktovém modelu. Proto je smyslem V1 rychlá, bezpečná vizuální iterace, ne dokonalý finální decision engine.

## Acceptance criteria

Před označením implementace za připravenou k review musí platit:

1. `/clinical/exercises` funguje po přihlášení;
2. top-level navigace funguje desktop/mobile;
3. capacity matrix používá skutečná read-only data/projection;
4. minimálně 8–12 nejlépe doložených cards má provenance;
5. exact / probable / unresolved mapping jsou rozlišeny;
6. exercise inspector funguje tap/click;
7. V1 nemá žádnou akci, která zapisuje klinická nebo Training data;
8. žádná pracovní hypotéza není povýšena na diagnózu;
9. build projde;
10. TypeScript projde;
11. relevantní testy projdou;
12. mobile responsive kontrola projde;
13. preview deployment je READY;
14. `project-control` je aktualizován ve stejném PR.

## Project-control terminologie

Důsledně rozlišuj:

- **navrženo**
- **implementováno ve větvi**
- **automatizovaně otestováno**
- **preview nasazeno**
- **implementováno v main**
- **produkčně nasazeno**
- **produkčně ověřeno**

Vercel `READY` není uživatelské produkční ověření.

## Git / deployment gate

Pracuj v nové feature větvi a vytvoř PR.

Bez mého dalšího výslovného schválení:

- nemerguj PR do `main`;
- neaplikuj databázovou migraci;
- nedělej produkční data write;
- neoznačuj změnu jako produkčně ověřenou.

Můžeš vytvořit a ověřit Preview.

## Výstup pracovního běhu

Na konci stručně uveď:

1. co jsi fresh ověřil;
2. jaký projection/datový model jsi použil;
3. jaké exercise mappings jsou A/B/C;
4. co je implementováno;
5. co je pouze navrženo;
6. testy/CI;
7. Preview URL/deployment stav;
8. otevřené unresolved varianty;
9. přesný další gate pro mě.

Nevytvářej v tomto kroku plan generator ani dosing logiku.
