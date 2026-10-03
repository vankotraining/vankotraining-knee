# Clinical Exercise Map V1 — feature brief

Datum rozhodnutí: 2026-10-02
Stav: **schválený směr / implementováno ve větvi PR #29 / není v `main`**

## Hlavní cíl

Dostat vznikající klinickou Exercise Map co nejdříve před uživatele jako skutečný read-only frontend v Knee aplikaci, aby bylo možné iterovat datový a klinický model vizuálně místo práce pouze v chatu nebo tabulkách.

## Navržený frontend

- route: `/clinical/exercises`
- top-level label: **Clinical Map**
- první verze: read-only
- stávající `/` zůstává klient/Fmax workspace
- stávající `/tindeq` zůstává Tindeq workspace

Clinical Map není podmodul Fmax ani Tindeq.

## Zdrojový model V1

Mapu stavět jako projekci existujících zdrojů, ne jako novou paralelní klinickou databázi.

### Autoritativní vrstvy

1. **CLIENTS**
   - Clients
   - Episodes
   - Visits
   - identity/reconciliation vrstvy
   - skutečný průběh péče a doložené intervence

2. **Knee / Tindeq / Fmax**
   - athletes
   - athlete_profiles
   - knee_extension_tests
   - tindeq_sessions
   - objektivní kapacita a longitudinal measurements

3. **Training**
   - exercises
   - exercise_id jako canonical digitální reprezentace, pokud shoda existuje
   - plans/workouts pouze pro read-only kontext, ne pro automatické vytváření plánů ve V1

4. **Historické programy**
   - !!!Exercise_Database
   - KneeRehab
   - BV_knee_aid
   - další starší programy pouze jako sekundární zdroj variant/programovací zkušenosti

5. **Clinical Second Brain / Martin Library**
   - Source Index
   - Knowledge Claims
   - appraised evidence a guardrails
   - evidence authority zůstává v CSB; Clinical Map ji pouze čte/projektuje

## Auditní zjištění 2026-10-02

Full scan canonical CLIENTS Visits:

- 201 unikátních canonical `Visit_ID`;
- 15 epizod s explicitním knee/meniscus/ACL/quadriceps kontextem;
- v přímém knee-contextu orientačně:
  - 21 Visits s Tindeq / knee-extension family;
  - 17 se split-squat family;
  - 16 s bridge / hip-thrust family;
  - 15 s hip-hinge / deadlift family;
  - 10 se squat / deep-flexion family;
  - 9 s wall-isometric family;
  - 7 s jump / hop / drop family;
  - 4 se step-down / single-leg squat family.

Tyto počty vyjadřují dokumentované použití, nikoli účinnost.

## Canonical ontology — V1

Minimální exercise families:

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

Každý cvik/varianta může mít:

- canonical family;
- canonical variant;
- Training `exercise_id` nebo stav unresolved;
- contraction type;
- unilateral/bilateral;
- ROM / knee-flexion demand;
- knee-forward demand;
- velocity;
- impact/loading-rate demand;
- deceleration demand;
- assistance;
- external-load capability;
- provenance;
- mapping confidence.

## Hlavní vizuální osa

Sloupce:

1. Tolerance
2. Force / activation
3. Strength / capacity
4. Deep ROM / knee-forward
5. Dynamic
6. Sport

Řádky jsou exercise families.

Fáze nejsou rigidní kalendář ani univerzální protokol.

## Povinné pohledy V1

### A. Podle kapacity

Výchozí pohled. Matice family × capacity stage.

### B. Podle problému

Filtry/pohled minimálně pro:

- PFP / anterior knee pain;
- patellar / quadriceps tendon context;
- meniscus repair / meniscectomy / non-op;
- ACL / ACLR / non-op;
- postoperative quadriceps deficit;
- nonspecific/load-related knee pain.

Diagnóza/klinický problém filtruje relevantní guardrails a priority; nevytváří pevný seznam cviků.

### C. Podle cviku

Po otevření cviku zobrazit:

- canonical název a family;
- varianty;
- Training mapping;
- kde byl použit ve Visits;
- ve kterých clinical contexts/stages;
- historické programy;
- evidence/guardrail odkazy;
- unresolved mapping;
- budoucí progression/regression edges.

### D. Klient

Read-only projekce pro zvoleného klienta:

- current episode/context;
- relevantní objective measurements;
- cviky použité v čase;
- aktuální/předchozí capacity exposure;
- response/regression/progression, pouze pokud je doložena.

## Provenance / confidence

V UI musí být viditelně odděleno:

- **A — direct clinical use:** explicitní Visit/intervention;
- **B — probable canonical mapping:** klinický název velmi dobře odpovídá Training cviku, ale Visit neukládá exercise_id;
- **C — unresolved / clinician decision:** nelze bezpečně určit variantu nebo fázi.

Historický plán ani obecná exercise library nesmí být prezentovány jako důkaz klinického použití.

## Detail cviku — minimální obsah

Po kliknutí na kartu:

- název;
- family + variant;
- phase/capacity placement;
- clinical-use count + odkazy na Visits/clients bez zbytečné expozice osobních údajů;
- Training mapping a `exercise_id`;
- mapping confidence;
- load signature;
- clinical contexts;
- evidence/guardrails;
- unresolved otázky.

## V1 non-goals

- žádný plan generator;
- žádné automatické dávkování;
- žádný zápis do CLIENTS;
- žádné změny Training plans/workouts;
- žádná automatická diagnóza;
- žádné pevné univerzální „ACL week 1–4“ protokoly;
- žádné nové clinical cut-offs bez canonical evidence;
- žádné násilné mapování unresolved cviků.

## UX principy

- vizuální hustota je žádoucí, ale musí zůstat čitelná;
- desktop: široká mapa/matice;
- mobil: lokální horizontální scroll matice, sticky family column, detail pod mapou;
- kliknutá karta drží výběr;
- evidence/provenance dostupné bez hover-only interaction;
- respektovat současný vizuální jazyk Knee aplikace;
- V1 má být užitečný i bez JavaScriptových „wow“ efektů.

## Acceptance criteria

V1 je připravena k uživatelskému preview, když:

1. route `/clinical/exercises` funguje po přihlášení;
2. hlavní navigace umožní přepnout Klienti / Clinical Map / Tindeq / Reporty bez mobilního překrývání;
3. mapa zobrazuje skutečná read-only data, nikoli hardcoded demo jako source of truth;
4. existuje minimálně výchozí capacity view;
5. minimálně 8–12 nejlépe doložených exercise/variant cards má provenance;
6. exact Training mapping je oddělen od probable/unresolved;
7. kliknutí na kartu zobrazí detail;
8. žádná akce V1 nemění klinická ani Training data;
9. build, typecheck a relevantní testy projdou;
10. preview deployment je READY;
11. produkční označení vznikne až po samostatném schválení/merge/deploymentu;
12. „produkčně ověřeno“ až po výslovném uživatelském acceptance.

## Unresolved exercise queue — známý začátek

- SL squat na stepru;
- step-down varianty;
- TRX dosedávání / sit-to-heel;
- drop medicinbalu do split squatu;
- assisted full-ROM split squat;
- některé wall-supported split-squat varianty.

Tyto položky se nesmí předem násilně sloučit s existujícím Training exercise_id.

## Doporučený implementační pořadník

1. fresh audit aktuálního main + project-control;
2. návrh read-only datového adapteru/projection modelu;
3. canonical mapping jen pro bezpečně rozpoznané cviky;
4. route a základní navigace;
5. capacity matrix;
6. exercise inspector;
7. provenance/confidence badges;
8. responsive/mobile kontrola;
9. testy;
10. preview;
11. uživatelské vizuální připomínky;
12. teprve potom rozhodnutí o dalších views a persistence.

## Safety / klinický guardrail

Clinical Map je clinician-facing informační a rozhodovací pomůcka. Nesmí převést working hypothesis na potvrzenou diagnózu ani zaměnit „cvik použit ve Visit“ za „cvik prokázaně léčí danou diagnózu“. Implementační evidence PR #29 je v `clinical-exercise-map-v1-implementation-2026-10-02.md`.

## Odkazy

- ADR: `project-control/decisions/0002-clinical-exercise-map.md`
- canonical project state: `project-control/PROJECT_STATE.md`
- next step: `project-control/next-step.md`
