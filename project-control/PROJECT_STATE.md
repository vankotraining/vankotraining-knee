# Project state

## Tindeq save UX PR #32 — release 2026-10-30

- PR #32 merged to main: 97e07527af8e5110b076c2d93d1e20dd4fdc63ce. User explicitly approved deployment on 2026-10-30.
- Production deployment dpl_AJCcnkN5BPkyHvM95bupXL5yj4h1 READY; knee.vankotraining.cz alias verified against it.
- GitHub Actions: project control, Tindeq client-view verification (including mocked E2E), and Android share preview passed on head 62fc2425a32d45b5d79d4e634ddb5ec771828317.
- /tindeq returned HTTP 200; unauthenticated Chrome 390/1440 px: sign-in gate, no horizontal overflow or page errors. No Vercel runtime errors detected in the checked one-hour window.
- No database migration or manual production data write. Authenticated production save/read-back and real development Supabase write/read-back remain unverified, pending explicit user acceptance.
- Later documentation-only deploys may move the production alias without changing runtime. Do not label this feature user-verified solely from READY or smoke tests.

## Tindeq save UX — pre-release evidence (historical)

- Stav: **implementováno a automatizovaně otestováno ve větvi** `ux/tindeq-save-review`, base `main` `18b26fcbbbfdc5a7c216f6ed7cf2eb875476fffd`; není merged ani produkčně nasazeno.
- PR: [#32](https://github.com/vankotraining/vankotraining-knee/pull/32), otevřený, `mergeable: true`, base `main` `18b26fcbbbfdc5a7c216f6ed7cf2eb875476fffd`; HEAD před tímto dokumentačním upřesněním `9ef82e5d974c56282b5fdfad06e14d4d2ddd7c6f` (dokumentace navazuje na runtime/test commit `403053d56c8a35fb25cd5a1967d3157d87c99439`). GitHub API již funguje, konflikt s `main` nezjištěn; branch byla 2 commity ahead, 0 behind.
- `/tindeq`: výběr databázového klienta, kontrolní seznam importovaných měření a jediné ukládací tlačítko jsou společně pod analyzovaným výsledkem. Odkaz nad výsledkem umožňuje přeskočit dlouhý detail.
- Před uložením je nutné označit konkrétní měření pro ručně vybraného klienta. ZIP s více klienty lze uložit po vybraných položkách postupně různým klientům, bez automatického přiřazení podle tagu. Každá položka ukazuje přiřazení a kompaktní stav (neuloženo / ukládání / uloženo / duplicita / chyba).
- Výsledky ukládání se uchovávají pro kombinaci klient + měření i po přepnutí klienta. Během ukládání je výběr klienta, kontrola položek a nový import uzamčen; opakování vynechává úspěšné položky. Existující persistence a její duplicate protection jsou beze změn.
- Beze změn: ZIP parser, analýza, klinické metriky, Supabase schéma, migrace a produkční konfigurace.
- Validace v cloudovém prostředí: `npm test` PASS (13 testových souborů dle runneru), produkční build PASS, TypeScript PASS, lint změněných TS/TSX souborů PASS, E2E **18/18 PASS** včetně dvou klientů, nevybraných položek, uzamčení během ukládání, úspěchu, chyby, partial retry a duplicate reimport. Snímky sekce zkontrolovány při 320/1440 px; testy kontrolují přetékání také při 390 px a existující single-client scénář při 360/390/720/1024/1440 px.
- Celorepozitářový lint: existující baseline **3 errors / 1 warning** v `ArchivedClients.tsx`, `AuthGate.tsx`, `KneeDashboard.tsx`; změna nepřidává nové nálezy.
- Vzdálené CI pro přesný HEAD `9ef82e5`: GitHub Actions `Project control` run `41081378414` PASS; `Verify Tindeq client view` run `41081378386` PASS včetně unit testů, porovnání lint s `main`, buildu, TypeScript, `project:check`, patch whitespace a browser E2E; `Tindeq Android share preview` run `41081378244` PASS. Vercel status check SUCCESS. Tato kontrola opravuje dřívější síťově omezený checkpoint, nikoli historickou produkční evidenci.
- První přesný Preview `dpl_8eVdi5ArxM19r221d9rSBb28YmmH` (`9ef82e5`) byl `READY`, ale reálný Chrome ukázal `Chybí Supabase konfigurace`: globální Preview Supabase URL směřovala do vývojového projektu `twndqnmrvefhwuwuglju`, chyběl však klíč pro tuto větev. Doplněn pouze branch-scoped `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` pro `ux/tindeq-save-review` podle již ověřené vývojové Preview konfigurace; produkční env se nezměnilo.
- Nový Preview stejného runtime commitu: `dpl_6d8QF8HhTrao7sm84zMeeRbWqsCn`, `READY`, https://vankotraining-knee-ohrpss5wa-vankotrainings-projects.vercel.app/tindeq . Reálný Chrome smoke 390/1440 px: HTTP 200, potvrzen text `Databáze: vývojový Supabase twndqnmrvefhwuwuglju`, přihlašovací gate se zobrazuje, 0 horizontal overflow, 0 page errors. Oprava je konfigurace Preview, nikoli změna kódu; případný novější docs-only deployment musí být zvlášť navázán na aktuální HEAD.
- Limity ověření: automatizované ukládací E2E používá mock databázových požadavků. Skutečný přihlášený end-to-end zápis/read-back do development Supabase (jeden a více klientů, retry, duplicita) není doložen a vyžaduje řízenou akceptaci s testovacím účtem. Produkční databáze, `main` a produkční deployment zůstaly nedotčené. Merge vyžaduje výslovné schválení.

## Release checkpoint — 2026-10-03 (Europe/Prague)

Status: **CLOSED / VERIFIED — KNEE LEARNING HUB V1; runtime remains in production.**

- Clinician approved V1.3 reasoning lens and coordinated release. Knee PR #29 and #30 and Library PR #10 are merged.
- Original bridge V1 runtime release commits were Knee `5cb052ce47000f6fa05f3c477f96e7f2b7617f32` and Library `1595e497aa911da61a3f16402e02abe728f21332`; these identify the original bridge release. Later Library content publication is recorded separately below; docs-only commits do not change runtime behavior.
- At bridge V1 acceptance, the production learning-map manifest returned HTTP 200 with the two canonical nodes and PFP-004/PFP-002. Live Map → topic → Deep Read → corresponding Map navigation PASS.
- Authenticated Library production sign-in and cloud persistence PASS. Canonical `library_progress` contains PFP-004 / shared / reading-v1 with state `reading`; authenticated own-row RLS read-back PASS.
- Authenticated production Knee browser read-back PASS: Knee extension shows `Cloud: 0 přečteno · 1 rozpracováno · 0 nepřečteno · další stav neznámý` and links to the canonical Library topic.
- Final live responsive/accessibility smoke PASS: Library topic 390/320 px has no horizontal overflow and 0 axe violations scoped to main; PFP-004 bilingual/backlink smoke at 390 px has no overflow and 0 axe violations scoped to main; authenticated Knee learning panel at 390 px has no overflow, 0 axe violations and no page errors.
- Final Vercel runtime-error scans found no runtime errors for Library or Knee in the inspected window.
- No production migration, clinical-data write, new evidence authority, new Deep Read or new feature scope was introduced by this closeout.
- Next operating mode: USE / OBSERVE. Open another feature workstream only from recurring decision-relevant friction/value; existing Deep Read publication gate remains unchanged.

### Subsequent Library content publication — verified current projection

Library PR #12 published AMI-001, AMI-002, AMI-003, ACL-012 and ACL-014 in CZ/EN at runtime commit `140f16e1561a52fd53dedcb5fb8fdb7ef9c051ae`; final documentation commit `f68678940d35c833691711ac483dd86536a24088` is production READY as `dpl_56GHFUWMS3Q41kTwry1kZobVX4eD`. Library now has 11 published Deep Reads. Each of the two existing Knee topics exposes 7 unique sources across Start here / Core / Deep dive / Context / Update. This content expansion is CLOSED / VERIFIED under its explicit one-off publication override; default future publication governance is restored. No new clinical taxonomy or evidence authority was created.

Knee final acceptance documentation commit `07dc0b940b3caecfe7e2842d890caae64b890c44` is production READY as `dpl_FV8J4qqnEHLvjRYxhwYkUKxnjmox`. Current deployment IDs are verification snapshots, not immutable aliases.

## Historical checkpoints — superseded current status

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


## Clinical reasoning lens V1.3 — 2026-10-03

Clinician review zpřesnil produktový účel Clinical Map: mapa má poskytovat **dobrou rozvahu proměnných a možností jejich modifikace**, nikoli šablonovitý rehabilitační protokol.

Horní read-only UI bylo proto změněno z dominantní goal/phase prezentace na:

`State → Limiter → Modifiers → Options → Response`.

State obsahuje přehled pain/reactivity, effusion, ROM, quadriceps activation, force/capacity a load acceptance/confidence. Limiter vrstva zahrnuje mimo jiné extension loss, high reactivity/effusion, pain-limited loading, AMI/poor activation, force deficit, poor terminal control, gait/load acceptance, apprehension a procedure/tissue restriction. Modifiers shrnují load, ROM, contraction, assistance, laterality, tempo/velocity, exposure/frequency a exercise/environment.

Options jsou záměrně přehledové a rozdělené na management, použité exercise options a adjuncts. Nejsou prezentovány jako povinná progrese.

`Quiet knee` je nově popsáno pouze jako working readiness description, nikoli jako pass/fail gate. Nový ACTIVE claim `AMI-CLM-003` zpřesňuje guardrail: quadriceps dysfunction je multifaktoriální a effusion nemá být používán jako proxy pro neuromuscular recovery.

Relevantní CSB update: `ACL-014`, `AMI-003`, `AMI-004` jsou APPRAISED; `AMI-CLM-003` ACTIVE.

Runtime/test commit `0b019c31b146a8f7c84f06fe352d0c6abb1025d7`; následná docs whitespace correction `74472741b3c30b901a3b0e4b2a6c458bea9c05e7`. Exact-head verification a browser workflow prošly, Preview `dpl_8qXfYoqLmssz7bwyEhEBPyZjB5sP` je READY na `https://vankotraining-knee-2g27lrz65-vankotrainings-projects.vercel.app`.

PR #29 zůstává open/unmerged. `main`, production deployment a databáze jsou beze změny.
# Library learning bridge V1 — CLOSED / VERIFIED

The Learn / Evidence bridge is merged and production-verified. Clinical Map owns clinical structure, Library owns reading/learning, and CSB remains evidence authority. The released bridge uses the existing PFP-004/PFP-002 sources and existing family:knee_extension / capacity:strength_capacity nodes; no parallel taxonomy, evidence store or clinical-write path was added.

Final production acceptance on 2026-10-03 includes authenticated Library cloud persistence, authenticated own-row RLS read-back, authenticated Knee Cloud progress projection, bidirectional Map ↔ Library navigation, live 320/390 px responsive smoke, zero scoped axe violations on the new learning surfaces, and clean final runtime-error scans. Workstream state: CLOSED / VERIFIED → USE / OBSERVE.
