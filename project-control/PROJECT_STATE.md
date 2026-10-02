# Project state

## Datum poslední kontroly

`2026-10-02` (Europe/Prague): fresh implementační audit a read-only Clinical Exercise Map V1. Produkční runtime ani produkční databáze nebyly měněny a Clinical Map není produkčně ověřena.

## Aktuální `main` commit

`16fac80d02768476a835d448471243fa0e341dcc` – merge PR #27 `docs: record Client/Knee/Training audit and timeline pilot`.

Poslední runtime-changing commit zůstává `59d23c4e18550675b8f5d7401e233ab60cc51d87` – merge PR #25.

## Aktivní větev a PR

Clinical Map implementace:

- větev: `feature/clinical-exercise-map-v1`;
- PR #29: **open, unmerged**;
- base: `main`;
- route: `/clinical/exercises`;
- production databázová migrace: žádná;
- dev-only migration: `20261002181856_align_clinical_map_dev_training_library.sql`;
- production data write: žádný.

PR #28 `docs: record Clinical Exercise Map V1 direction` zůstává otevřený. Feature větev PR #29 byla vytvořena z jeho exact headu `1b014387d750482f10d9272212359586bf3535b2`, takže obsahuje i tento dosud nesloučený projektový zápis. PR #28 se nepovažuje za implementaci.

## Produkční runtime commit

Fresh Vercel kontrola 2026-10-02:

- deployment: `dpl_9PzyKBZ65f4MEmt7FEzcp1AKhx2q`;
- state: `READY`;
- target: `production`;
- branch: `main`;
- commit: `16fac80d02768476a835d448471243fa0e341dcc`.

Jde o současný produkční deployment po docs-only merge PR #27. Clinical Map v něm není. Poslední runtime-changing commit zůstává PR #25.

## Stav databázových migrací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Clinical Map V1 nevyžaduje žádnou production migraci. Do development projektu `twndqnmrvefhwuwuglju` byla aplikována pouze dev-only migration `20261002181856_align_clinical_map_dev_training_library.sql`; produkční migration state zůstává beze změny. `knee_extension_tests.asymmetry_pct` nadále používá procentní body.

Fresh read-only snapshot relevantních tabulek 2026-10-02:

- athletes: 75 / 74 active;
- athlete_profiles: 74;
- knee_extension_tests: 135 / 130 non-deleted;
- tindeq_sessions: 67 / 52 non-deleted;
- exercises: 161 / 158 active;
- plans: 4;
- workouts: 30;
- workout_items: 36;
- feedback: 0.

## Aktuální fáze

Clinical Exercise Map V1 je **implementována ve větvi**, ne v `main`.

Model:

`diagnóza/operace → guardrails → limiter/capacity → load requirement → exercise family → varianta → budoucí dávka → response`.

V1 implementuje pouze read-only mapu po úroveň exercise varianty/provenance/guardrails. Dávkování, plan generation, automatická diagnóza a RTS verdict nejsou součástí V1.

Fresh canonical CLIENTS snapshot:

- 47 Clients;
- 70 Episodes;
- **201 unikátních Visits**;
- 15 primary knee-context Episodes;
- 55 Visits napojených na tyto primary knee-context Episodes;
- 15 Clients s explicitním `Tindeq_Athlete_ID`.

Dřívější předběžný údaj 202 Visits je nahrazen fresh kontrolou 201 unikátních `Visit_ID`.

## Implementováno v `main`

Clinical Map: **ne**.

Dříve nasazené Knee/Tindeq/Fmax funkce a oprava asymmetry percentage-point contract zůstávají v `main` beze změny.

## Rozpracováno mimo `main`

PR #29 obsahuje:

- sdílenou top-level navigaci Klienti / Clinical Map / Tindeq / Reporty;
- auth-gated read-only `/clinical/exercises`;
- capacity matrix 6 × 13 canonical axes/families;
- live GET overlay aktivních Training `exercises`;
- verzovaný source-derived projection manifest z CLIENTS/CSB auditu;
- A/B/C mapping confidence;
- exercise inspector;
- explicitní unknown/unresolved stavy;
- responsive local horizontal scroll;
- unit + Playwright testy;
- project-control aktualizaci.

Žádný runtime zápis do CLIENTS, Training nebo canonical Exercise DB nebyl přidán.

## Automatizovaně otestováno

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

## Nasazeno

Clinical Map V1 je nasazena pouze jako **Vercel Preview mimo produkci**. Není implementována v `main`, není produkčně nasazena a nebyla produkčně ověřena.

## Preview nasazeno

Exact-head Preview pro ověřený cleanup head `62933a6b5c2fc85b61285a0bc53b42c0a0e877e0`:

- deployment: `dpl_3LKXfdxBSzm4rwv4TwB1jNtQnZhd`;
- URL: `https://vankotraining-knee-8ai0l66ew-vankotrainings-projects.vercel.app`;
- state: `READY`.

Preview environment stále nemusí mít veřejnou Supabase konfiguraci a může fail-closed zobrazit „Chybí Supabase konfigurace“. Produkční credentials ani Preview env nebyly v tomto cleanupu měněny.

## Produkčně nasazeno

Clinical Map V1: **ne**.

## Produkčně ověřeno

Clinical Map V1: **ne**.

Vercel `READY` ani CI nejsou uživatelské produkční ověření.

## Development Supabase pro Preview — alignment 2026-10-02

Development projekt `twndqnmrvefhwuwuglju` / `vankotraining-knee-dev` je `ACTIVE_HEALTHY`.

Dokončený úzký dev-only alignment:

- vytvořeny pouze `public.exercise_families` a `public.exercises`;
- production-compatible columns, defaults, constraints a indexy;
- 32 exercise families;
- 161 exercises / 158 active / 3 inactive;
- full-row digest parity production ↔ dev pro obě tabulky;
- žádné orphan family links;
- všech 9 Training UUID z aktuálního Clinical Map manifestu je v dev přítomných a kompatibilních názvem, active stavem i family linkage;
- RLS enabled;
- `anon` bez SELECT i write přístupu;
- `authenticated` pouze SELECT: 32 families a 158 active exercises;
- production coach/owner write policy nebyla kopírována;
- production `zxvndqicslyulrinbpyn` byla pouze read-only source.

Verdikt backendu: **READY FOR CLINICAL MAP PREVIEW ENV**.

Tento stav neznamená, že Preview env je nakonfigurovaný, že vznikl nový exact-head Preview nebo že proběhlo vizuální review. Vercel env, `main`, production deployment i production databáze zůstaly beze změny.

## Známé problémy

- Preview environment nemá použitelnou veřejnou Supabase konfiguraci pro ruční authenticated review; production credentials se do Preview nesmí kopírovat.
- Full-repo lint baseline na současném `main` obsahuje 3 existující errors + 1 warning; PR gate porovnává branch vůči baseline.
- Unresolved exact mappings zůstávají: step-down, SL squat/stepper, TRX sit-to-heel, medicine-ball drop to split squat, assisted full-ROM split squat, wall-supported split squat a band-resisted hamstring curl.
- CLIENTS Visit neukládá explicitní `exercise_id`; probable mapping proto zůstává oddělený od direct clinical-use provenance.

## Další krok

- Nastavit branch-specific Vercel Preview env pouze pro `feature/clinical-exercise-map-v1`, vytvořit nový exact-head Preview a provést authenticated vizuální review. PR #29 ponechat open a unmerged, neměnit `main` a nenasazovat do produkce.

## Audit Client / Knee / Training a pilot — 2026-09-29

### Hranice a zdroje
Audit a následný pilot dne 2026-09-29 byly pouze read-only. Doloženo čerstvým čtením hlavních větví, produkčního schématu a dat v Supabase a provozních listů CLIENTS. Neproběhl nový přihlášený UI acceptance ani změna databáze, migrací, UI nebo runtime. Tato aktualizace zapisuje výsledky do dokumentace; neotevírá implementační WIP.

Rozdělení odpovědnosti zůstává: **CLIENTS = skutečný průběh péče; Knee/Tindeq/Fmax = objektivní měření; App/Training = existující cviky a jejich dávkování.** Rehabilitační a evidence-based logika je budoucí směr, nikoli implementovaná funkčnost.

### Ověřená vazba mezi produkty
`CLIENTS.Clients.Tindeq_Athlete_ID -> public.athletes.id <- public.plans.athlete_id`.

Knee a App sdílejí produkční Supabase `zxvndqicslyulrinbpyn`. V CLIENTS má explicitní platný athlete UUID 15 ze 47 klientů; ostatních 32 nemá most vyplněný. Shoda jména není spolehlivá identita. `public.clients` je volitelný account/profile most, nikoli klinický CLIENTS systém. Není doložena automatická synchronizace Google Sheets a Supabase.

### Pilot longitudinální časové osy
U dvou existujících klientů byla v samostatném neveřejném podkladu rekonstruována návaznost epizody, 6 návštěv, 6 Fmax měření a 8 Tindeq sessions. Identita je spojena přes explicitní UUID; přiřazení měření ke konkrétní návštěvě vychází z data a obsahu, nikoli z uloženého foreign key. Měření nemají `Visit_ID` ani `Episode_ID`.

Pilot prokázal použitelnost současných dat i meze srovnání: uložené MVC v session nemusí odpovídat nejnovějšímu Fmax; protokoly se mezi sessions mění; Fmax obsahuje datum bez času. Systematická opožděná/24h reakce chybí. Žádný tréninkový plán ani automatické mapování intervencí na cviky nebyly vytvořeny. Individuální klinické zápisy, jména, UUID a výsledky zůstávají v autorizovaných klinických zdrojích a neveřejných auditních podkladech.

Podklady: `Audit_Client_Knee_Training_2026-09-29.md` a `Casova_osa_C004_C009_2026-09-29.md` (uložené výstupy této pracovní relace; nejde o soubory repozitáře ani novou autoritu klinických dat).

### Data a použitelné části Knee
Snapshot 2026-09-29: 75 athletes (74 nearchivovaných), 74 aktuálních athlete_profiles, 135 Fmax záznamů (130 nearchivovaných), 67 Tindeq sessions (52 nearchivovaných). Profil je aktuální stav, nikoli plná historie antropometrie.

- `knee_extension_tests`: athlete UUID, datum, síla P/L v kgf, asymetrie v procentních bodech, slabší strana, Nm/kg, hmotnost a délka bérce použité při testu, zdroj a auditní metadata. Asymetrie a relativní síla jsou dopočítané a uložené; změny proti předchozímu testu a některé cílové hodnoty dopočítává UI.
- `tindeq_sessions`: athlete UUID, čas, protokol, target P/L, počty opakování, verze analýzy, souhrny/rep metriky a metadata včetně použitého MVC a dávky. Ukládají se např. % target, variabilita, čas v pásmu, overshoot, drift a time-to-95 %. Time-to-95 % není RFD. Plné původní raw signály nejsou v DB doložené.
- Existují historie, grafy, reporty a archivace/obnova. Bolest, úhel kolene a klinický kontext nejsou normalizovanou součástí měřicího modelu.
- Pro nové read-only využití explicitně filtrovat `deleted_at`; pohledy `knee_extension_latest` a `athlete_knee_overview` nemají vlastní archive filtr. Export je záměrně širší.

### Klinická a tréninková vrstva
CLIENTS obsahuje 47 klientů, 70 epizod, 196 návštěv a 16 záznamů Measurements. Návštěvy mají stabilní Visit_ID, klienta, jednu či více epizod, symptomy, intervence, reakci, decision a next step, převážně jako volný text. Opožděná reakce je vyplněna jen u 5/196 návštěv a ani ty nejsou jednotným 24h outcome.

App má 161 cviků (158 aktivních), existující dávkování a vazbu `athlete -> plans -> workouts -> workout_items -> exercises`. Čtyři současné draft plány patří jednomu testovacímu/trenérskému athlete; nejsou klinickou historií pilotních klientů. Skutečná historie odcvičeného není naplněna. Podrobnosti vlastní [App README](https://github.com/vankotraining/vanko-training-web/blob/main/README.md).

### Mezery a navržené pokračování
Chybí přímá vazba měření na návštěvu/epizodu, konzistentní reakce po zátěži a ověřené propojení textových intervencí s exercise UUID. Existující model umožňuje nejprve malý ruční pilot bez nové databáze. Další implementace, nové fáze rehabilitace, plošné tagování cviků ani clinical decision support nejsou tímto auditem schváleny.


## Clinical Exercise Map decision — 2026-10-02

### Co bylo čerstvě ověřeno

Deep read-only inventura nevycházela pouze z klientů C004/C009. Canonical `Visits` byly načteny v plném rozsahu a spojeny přes `Episode_ID` s klinickým kontextem. Audit pracoval také s Training `exercises`, historickými KneeRehab / BV_knee_aid / !!!Exercise_Database zdroji a s appraised Clinical Second Brain vrstvou.

Snapshot použité inventury:

- 201 unikátních canonical `Visit_ID`;
- 15 epizod s explicitním knee/meniscus/ACL/quadriceps kontextem;
- opakovaně doložené exercise families zahrnují knee extension/Tindeq, wall isometrics, split squat, squat/deep flexion, step-down/SL squat, hip hinge/deadlift, bridge, hamstring curl, calf a jump/hop/drop;
- Training knihovna má řadu exact/near canonical variant, ale část klinických variant zůstává unresolved a nesmí se mapovat násilně.

Počty použití jsou clinical-use provenance, nikoli účinnost nebo evidence rank.

### Schválený front-end koncept

Nový workspace:

`/clinical/exercises` — **Clinical Map**

V1 je read-only. Výchozí vizuální forma je matice exercise family × capacity stage s přepínatelnými pohledy podle kapacity, problému/diagnózy, cviku a klienta.

Hlavní capacity osa:

`Tolerance → Force/activation → Strength/capacity → Deep ROM/knee-forward → Dynamic → Sport`.

Jde o mapu kapacit, nikoli rigidní lineární protokol.

### Authority boundaries

- CLIENTS = skutečný průběh péče a doložené intervence;
- Knee/Tindeq/Fmax = objektivní měření a response/capacity kontext;
- Training = canonical exercise library a digitální exercise identity;
- historické plány = sekundární zdroj variant a programovací zkušenosti;
- Clinical Second Brain = evidence authority a klinické guardrails.

Clinical Map tyto vrstvy projektuje, ale nesmí vytvořit novou konkurenční klinickou nebo evidence autoritu.

### Implementační stav

Route `/clinical/exercises`, top-level navigace, capacity matrix, provenance/confidence projection a read-only exercise inspector jsou implementovány ve větvi `feature/clinical-exercise-map-v1` / PR #29. Nejsou v `main` ani produkčně nasazeny. Persistence, automatický plan generator, dosing engine, automatická diagnóza a RTS decision support implementovány nejsou.

Podrobnosti: `project-control/clinical-exercise-map-v1-2026-10-02.md`, `project-control/clinical-exercise-map-v1-implementation-2026-10-02.md` a `project-control/decisions/0002-clinical-exercise-map.md`.
