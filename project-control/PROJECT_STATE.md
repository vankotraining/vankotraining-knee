# Project state

## Datum poslední kontroly

`2026-09-29` (Europe/Prague): read-only audit Client / Knee / Training a pilot časové osy. Historický rollout a uživatelský acceptance PR #25 ze dne 2026-09-17 zůstávají platné v uvedeném rozsahu.

## Aktuální `main` commit

Při auditu 2026-09-29 načtený main: `33b065456c8d348018438298187d340605919c2c` (merged docs-only PR #26). Následný dokumentační zápis auditu nemění runtime kód.

Poslední runtime-changing commit:

`59d23c4e18550675b8f5d7401e233ab60cc51d87` – `Merge PR #25: Fix knee asymmetry percentage-point contract`.

## Aktivní větev a PR

PR #25 je **merged a closed**.

- final exact head: `4b383d342516fc64c92852483e430a0b16ede2c9`;
- merge commit: `59d23c4e18550675b8f5d7401e233ab60cc51d87`;
- exact-head `Project control` run `35217601098`: success;
- exact-head `Verify Tindeq client view` run `35217600919`: success;
- exact-head Vercel Preview: `dpl_2FbJSmqW12hBtt7BRBUFFca4twEX`, `READY`.

PR #26 je rovněž merged a closed (ověřeno 2026-09-29), merge commit `33b065456c8d348018438298187d340605919c2c`. Audit a jeho dokumentační zápis neotevírají implementační WIP.

## Produkční runtime commit

Snapshot produkce při auditu 2026-09-29: deployment `dpl_Bq9gQ5ZSxeYtzUTi2cNmNDQUxNmM`, READY, alias `knee.vankotraining.cz`, commit `33b065456c8d348018438298187d340605919c2c`. Jde o technické ověření deploymentu, nikoli nový UI acceptance. Pozdější docs-only zápis není nový runtime release.

Historický rollout runtime změny PR #25 dne 2026-09-17:

- runtime commit: `59d23c4e18550675b8f5d7401e233ab60cc51d87`;
- deployment: `dpl_GCreoikFbSWN7MZa8RiSNBDW3dCT`;
- state: `READY`;
- target: `production`;
- alias: `knee.vankotraining.cz`;
- produkční root: HTTP 200;
- post-deploy kontrola `warning/error/fatal`: 0 nalezených logů v kontrolovaném okně.

## Stav databázových migrací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Migrace PR #25 je produkčně aplikována:

- version: `20260917114606`;
- name: `knee_asymmetry_percent_points`;
- repo file: `supabase/migrations/20260917_knee_asymmetry_percent_points.sql`.

Fresh precheck před zápisem:

- `google_sheet_import`: 100 legacy kandidátů, 0 ambiguous;
- `manual`: 32 již kanonických řádků, 0 invalid, 0 ambiguous;
- backup/export surface `public.knee_data_export` pokrýval všech 132 měření;
- candidate snapshot MD5: `141511a89181810b8ba07f409bd12035`.

Post-check:

- `google_sheet_import`: 100/100 canonical, 0 noncanonical, rozsah `0.18–81.50`;
- `manual`: 32/32 canonical, 0 noncanonical, rozsah `0.96–51.62`;
- 5 archivovaných manuálních měření zachováno;
- `weaker_side` mismatches: 0;
- audit log: 100 UPDATE záznamů migrace;
- případ `72.4 / 73.1 kg`: `asymmetry_pct = 0.96`, `weaker_side = right`, přímý výpočet `0.9576 %`.

Kanonický kontrakt:

`knee_extension_tests.asymmetry_pct = procentní body`.

## Aktuální fáze

PR #25 má dokončený datový i aplikační rollout. Heuristika `value <= 1 ? value * 100 : value` byla odstraněna z UI i exportních SQL. Tabulka, detail, mobilní karty, klientský souhrn, graf a barevná klasifikace používají jedinou jednotku – procentní body.

Hlášená produkční regrese je uzavřena i manuálním acceptance: uživatel po nasazení potvrdil v přihlášeném Knee UI zobrazení kontrolního měření `72.4 / 73.1 kg` jako `1 %`, nikoli `96 %`.

## Implementováno v `main`

Ano:

- `getAsymmetryValue(0.96) -> 0.96`;
- sdílené formátování asymetrie na jedno desetinné místo;
- prahy `<10 / 10–20 / >20 %` pracují přímo s procentními body;
- regrese `72.4 / 73.1 -> 0.957592... % -> 1.0 %`;
- odstranění magnitude heuristiky z repository exportů;
- verzovaná fail-closed/idempotentní historická migrace a checks.

## Rozpracováno mimo `main`

Pro PR #25 nezůstává žádná runtime ani databázová změna mimo `main`. Docs-only synchronizační PR #26 byl následně merged; není již otevřený.

## Nasazeno

- aplikace PR #25: **ano**, `dpl_GCreoikFbSWN7MZa8RiSNBDW3dCT`, `READY`;
- DB migrace: **ano**, `20260917114606 knee_asymmetry_percent_points`;
- při auditu 2026-09-29 alias ukazoval na výše uvedený deployment docs-only merge PR #26, obsahující runtime opravu PR #25.

## Produkčně ověřeno

- databázová integrita po migraci: **ano, read-only/automatizovaně ověřena**;
- produkční deployment a dostupnost: **ano, technicky ověřeno**;
- hlášená UI regrese `72.4 / 73.1 -> 1 %` místo `96 %`: **ano, výslovně potvrzeno uživatelem v přihlášené produkci dne 2026-09-17**.

PR #25 je tím ve smyslu projektové terminologie **produkčně ověřen**. Uživatel samostatně nepotvrzoval každou jednotlivou UI reprezentaci; jejich konzistence se stejnou procentní jednotkou je kryta implementací a regresními testy.

## Známé problémy

- pro opravenou chybu asymetrie není po acceptance známý otevřený produkční problém;
- full-repo lint baseline obsahuje dříve evidované problémy; PR #25 nepřidal nový relevantní lint problém;
- Supabase security/performance advisors obsahují existující problémy mimo scope PR #25; tato datová migrace neměnila RLS, grants ani indexy.

## Další krok

- Navrženo: u jednoho pilotního klienta ručně ověřit přesné existující Training cviky proti intervencím ve Visits; bez změny schématu nebo nového plánu. Implementaci případných vazeb otevřít až samostatným zadáním.

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
