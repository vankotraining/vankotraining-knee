# Project state

## Datum poslední kontroly

`2026-10-02` (Europe/Prague): Clinical Exercise Map V1.1 UX/readability pass je implementován a automatizovaně ověřen ve feature větvi. Produkční runtime ani produkční databáze nebyly měněny a Clinical Map není produkčně ověřena.

## Aktuální `main` commit

`16fac80d02768476a835d448471243fa0e341dcc` – merge PR #27 `docs: record Client/Knee/Training audit and timeline pilot`.

Poslední runtime-changing commit zůstává `59d23c4e18550675b8f5d7401e233ab60cc51d87` – merge PR #25.

## Aktivní větev a PR

Clinical Map implementace:

- větev: `feature/clinical-exercise-map-v1`;
- PR #29: **open, unmerged, mergeable**;
- base: `main`;
- latest runtime/test-changing head: `738a4145c0f47d636f1c8433d7de1811182167df`;
- route: `/clinical/exercises`;
- production databázová migrace: žádná;
- dev-only migration applied on dev: `20261002181856_align_clinical_map_dev_training_library`;
- isolated audit artifact: `supabase/dev-migrations/20261002181856_align_clinical_map_dev_training_library.sql`;
- production data write: žádný.

PR #28 `docs: record Clinical Exercise Map V1 direction` zůstává otevřený. Feature větev PR #29 byla vytvořena z jeho směru a obsahuje i dosud nesloučené project-control změny. PR #28 se nepovažuje za implementaci.

## Produkční runtime commit

Fresh Vercel kontrola 2026-10-02:

- deployment: `dpl_AxYSQ8avnvgytBm6x6oQLQPERYhw`;
- state: `READY`;
- target: `production`;
- branch: `main`;
- commit: `16fac80d02768476a835d448471243fa0e341dcc`.

Tento redeploy používá stejný `main` commit. Clinical Map v produkci není. Poslední runtime-changing commit v `main` zůstává PR #25.

## Stav databázových migrací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Clinical Map V1 nevyžaduje žádnou production migraci. Do development projektu `twndqnmrvefhwuwuglju` byla aplikována pouze dev-only migration version `20261002181856` (`align_clinical_map_dev_training_library`); produkční migration history ji neobsahuje. SQL artefakt je po repo-hygiene gate izolovaný v `supabase/dev-migrations/20261002181856_align_clinical_map_dev_training_library.sql`, mimo production-capable `supabase/migrations/`. Přesun neprovedl žádný DB write, migration repair ani změnu dev/production migration history. `knee_extension_tests.asymmetry_pct` nadále používá procentní body.

Stav gate:

- dev schema aligned: ano;
- dev Training data synced: ano;
- migration artifact isolated: ano;
- Preview env configured: ano, branch-specific pouze pro `feature/clinical-exercise-map-v1` a dev Supabase;
- Preview visually reviewed: V1 baseline ano; V1.1 authenticated visual acceptance pending;
- merged do `main`: ne;
- production deployed: ne;
- production verified: ne.

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
- A/B/C clinical mapping confidence;
- samostatný Training library link status;
- V1.1 kompaktnější matrix density;
- sticky capacity header + sticky family column;
- clinician-first inspector hierarchy;
- explicitní `Clinical family` vs `Training library family`;
- `Context guardrails` oddělené od exercise-specific efficacy;
- technická metadata pod rozbalitelným `Data / provenance`;
- mobile readability pass a lokální horizontal scroll;
- explicitní unknown/unresolved stavy;
- unit + Playwright coverage včetně 320/390 px;
- project-control aktualizaci.

V1.1 nemění clinical capacity placement, A/B/C hodnoty, canonical families, Training exercise IDs, CSB claims, Visit provenance ani unresolved mapping queue.

Žádný runtime zápis do CLIENTS, Training nebo canonical Exercise DB nebyl přidán.

## Automatizovaně otestováno

Ověřený V1.1 runtime/test head: `738a4145c0f47d636f1c8433d7de1811182167df`.

- Project control workflow `37063052302`: success;
- verification workflow `37063052373`: success;
- unit tests: success;
- lint comparison proti aktuálnímu `main`: success;
- production build: success;
- TypeScript: success;
- project-control check: success;
- patch whitespace gate: success;
- Chromium/Playwright install: success;
- browser E2E: **17/17 passed**;
- auth-gated Clinical Map: success;
- A/B/C inspector + Training link separation: success;
- clinician-first inspector / Data-provenance disclosure: success;
- desktop sticky axes/density assertions: success;
- mobile 320 px a 390 px: success;
- page-level horizontal overflow: žádný;
- matrix horizontal scroll: zůstává lokální.

Předchozí V1.1 head `13c3c93b9ec87b197d9c3b1c5dcf92096f93c727` měl jediný test-selector failure kvůli dvěma legitimním labelům `Laterality`. Test-only commit `738a414...` selector scoped na `Live Training metadata`; runtime se tím nezměnil.

Exact-head Vercel Preview:

- deployment: `dpl_AKpbZ6Ao5pyKUdaTUv8dwYnAGrPo`;
- commit: `738a4145c0f47d636f1c8433d7de1811182167df`;
- URL: `https://vankotraining-knee-23pn447xw-vankotrainings-projects.vercel.app`;
- state: `READY`;
- `/clinical/exercises`: Clinical Map route načtena, bez fail-closed hlášky „Chybí Supabase konfigurace“.

## Nasazeno

Clinical Map V1 je nasazena pouze jako **Vercel Preview mimo produkci**. Není implementována v `main`, není produkčně nasazena a nebyla produkčně ověřena.

## Preview nasazeno

Exact-head Preview pro V1.1 runtime/test head `738a4145c0f47d636f1c8433d7de1811182167df`:

- deployment: `dpl_AKpbZ6Ao5pyKUdaTUv8dwYnAGrPo`;
- URL: `https://vankotraining-knee-23pn447xw-vankotrainings-projects.vercel.app`;
- state: `READY`;
- branch-specific Preview env: nakonfigurován na dev Supabase `twndqnmrvefhwuwuglju`;
- Production env nebyl pro Clinical Map použit ani změněn;
- route už nepadá do stavu „Chybí Supabase konfigurace“.

Authenticated uživatelská akceptace konkrétního V1.1 layoutu je ještě pending.

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

Git integrace pro alignment head `dd0f4df5a37aa202ced81313ce6d31924424e718` automaticky vytvořila Preview `dpl_D8UKxYDckmS3WxZrNKjxM65fqPLm` (`READY`, `https://vankotraining-knee-n8s6xcmbf-vankotrainings-projects.vercel.app`). Vercel env nebyl změněn ani připojen k dev Supabase a Preview nebyl vizuálně reviewován. `main`, production deployment i production databáze zůstaly beze změny.

## Známé problémy

- V1.1 potřebuje ještě uživatelskou authenticated vizuální akceptaci na desktopu/mobilu; automatické responsive testy jsou zelené.
- Full-repo lint baseline na současném `main` obsahuje existující problémy; PR gate porovnává branch vůči baseline a aktuální V1.1 gate prošel.
- Unresolved exact mappings zůstávají: step-down, SL squat/stepper, TRX sit-to-heel, medicine-ball drop to split squat, assisted full-ROM split squat, wall-supported split squat a band-resisted hamstring curl.
- CLIENTS Visit neukládá explicitní `exercise_id`; probable mapping proto zůstává oddělený od direct clinical-use provenance.

## Další krok

- Provést authenticated vizuální akceptaci V1.1 na desktopu a mobilu; pokud UX projde, pokračovat klinickým review mappingů v pořadí `Knee extension → Wall isometric → Split squat`; PR #29 ponechat open a unmerged do výslovného schválení a neměnit `main` ani produkci.

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


## Clinical goal layer V1.2 — 2026-10-03

Po klinickém review časné rehabilitace kolene a po zpracování relevantní evidence v Clinical Second Brain byl Clinical Map model rozšířen o explicitní vrstvu **clinical goal → limiter**.

Schválený řetězec je nyní:

`diagnosis/operation → guardrails → clinical goal → limiter → capacity → exercise family → variant → future dose → response`.

První canonical goal je `Restore knee extension & quadriceps control` se čtyřmi komponentami: extension ROM, quadriceps activation, active terminal extension control a early load acceptance / movement control. Goal není rigidní časová fáze ani univerzální pooperační protokol.

Evidence authority pro tento pilot tvoří ACTIVE CSB claims `ACL-CLM-008`, `AMI-CLM-001` a `AMI-CLM-002`. Current evidence anchor je nejsilnější pro ACL/ACLR; procedure-specific restrictions mají přednost.

Do Knee extension rodiny byla přidána direct clinical-use option `Terminal extension / quadriceps activation` s provenance z Visit `7d26481e-3e88-46ab-9b7c-9f0fcf93d862` (2026-09-29). Clinical confidence je A, ale Training link zůstává `none`, protože exact canonical Training variant nebyla reviewována. Existující `Isometric knee extension` je supporting goal option a její B probable Training mapping zůstává beze změny. Machine knee extension nebyla v tomto kroku přehodnocena.

Runtime/test commit `45d7fbea195a4906889da9fa6c91cb723a775f5a` prošel workflow `37108795338` a `37108795533`; Vercel Preview `dpl_9uFSvX1XL4Nec78LW2wHjx2rizcf` je READY na `https://vankotraining-knee-6cl626jmd-vankotrainings-projects.vercel.app`.

PR #29 zůstává open/unmerged. Main, production deployment a production/dev databáze nebyly změněny.


### Clinician acceptance V1.2 — 2026-10-03

Po desktop review uživatel výslovně potvrdil, že early-phase goal model `Restore knee extension & quadriceps control`, jeho komponenty a limitery i napojení `Terminal extension / quadriceps activation` odpovídají jeho reálnému klinickému postupu v této fázi.

Toto je clinical/model acceptance pro pokračování review v PR #29. Není to souhlas s merge, production deploymentem, automatickým generováním plánu ani decision supportem. Další klinický gate je `Knee extension - machine`, následně `Wall isometric → Split squat`.
