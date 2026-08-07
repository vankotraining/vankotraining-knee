# Project state

## Datum poslední kontroly

`2026-08-07 12:37 CEST` (Europe/Prague).

## Aktuální `main` commit

PR #14 byl bezpečně squash-mergnut do `main` jako `704950a7a5a0516175126f7761adf1ccb34dc043` – `Establish canonical project control sources (#14)`.

Tento soubor je následná stavová evidence nad uvedeným merge commitem. Jeho vlastní commit SHA se z principu nezapisuje do sebe; před jakoukoli další změnou je nutné znovu živě vyřešit aktuální head `main` a nepřebírat SHA pouze z dokumentace.

## Aktivní větev a PR

- PR `#14` – **merged** squash mergem do `main`; původní pracovní historie se do `main` nepřenesla;
- feature větev `agent/tindeq-results-site`, draft PR `#12` – aktuální auditovaný head `1c5c5334c5855fc02107cc05e9fe1668a585f2b2`;
- PR `#15` (`agent/tindeq-client-workflow`) je uzavřen bez merge a jeho paralelní klientský Tindeq workflow není podporovaný směr.

PR #12 zůstává mimo `main`.

## Produkční runtime commit

Produkční alias byl po merge PR #14 nasazen na commit `704950a7a5a0516175126f7761adf1ccb34dc043` v deploymentu `dpl_G4iaoxQ9f4DztA76djs8hfaceouZ`, stav `READY`.

Diff `71d6b1f0e67c571c71a53db6248e526704bddabe..704950a7a5a0516175126f7761adf1ccb34dc043` neobsahuje žádný `src/**`, databázový migrační soubor ani Vercel konfigurační soubor. Aplikační runtime kód tedy merge PR #14 nezměnil.

Podrobnosti jsou v [`PRODUCTION_STATUS.md`](./PRODUCTION_STATUS.md).

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

Po merge PR #14 znovu ověřeno read-only dotazem:

- `public.athletes`: `67` celkem / `66` aktivních klientů;
- `auth.users`: `1`;
- `public.tindeq_sessions`: `0` celkových / `0` aktivních řádků;
- `tindeq_sessions` má stále pouze původní normalizované sloupce a indexy `tindeq_sessions_active_athlete_measured_idx`, `tindeq_sessions_analysis_version_idx`, `tindeq_sessions_pkey`;
- PR #14 databázi ani data nezměnil.

Aplikovaná produkční Tindeq migrace zůstává `20260802124337 tindeq_sessions`; její repo soubor je zatím pouze v PR #12, ne v `main`.

### Vývojový Supabase `twndqnmrvefhwuwuglju`

Poslední audit před merge PR #14:

- `1` auth uživatel;
- `1` aktivní klient;
- `1` aktivní Tindeq session;
- stále obsahuje dodatečné PR #15 sloupce a fingerprint unique index;
- dev proto není čistě srovnaný s kanonickým ZIP-only rozsahem PR #12.

## Aktuální fáze

**Fáze 1 – project-control je dokončena.** Kanonické zdroje pravdy, ADR, bezpečný provozní postup a automatický `npm run project:check` jsou v `main`.

Exact merge commit `704950a7a5a0516175126f7761adf1ccb34dc043` má GitHub Actions `Project control` run `31170713406` se závěrem `success`.

Další produktové funkce se nepřidávají; pokračuje konsolidace PR #12.

## Implementováno v `main`

- kanonické `PROJECT_SPEC.md`, `PROJECT_STATE.md`, `PRODUCTION_STATUS.md`;
- `project-control/README.md` jako rozcestník autority;
- ADR pro základní architekturu a datové zacházení;
- `operations.md` s verzovanými migracemi, explicitním schválením produkční DDL/zápisu a preview safety pravidly;
- `npm run project:check` a GitHub Actions workflow pro project-control;
- původní produkční Knee aplikace a její runtime zůstávají funkčně beze změny oproti předchozímu runtime baseline.

## Rozpracováno mimo `main`

PR #12 na `agent/tindeq-results-site` zůstává draft. Při posledním auditu byl proti předchozímu `main` divergentní `115` commitů ahead / `11` behind a obsahoval dlouhou experimentální historii.

Exact head `1c5c5334c5855fc02107cc05e9fe1668a585f2b2` měl CI run `31168986400` se závěrem `success`: `77/77` unit testů, build/TypeScript PASS, `10/10` Playwright a `git diff --check` PASS. Finální merge gates ale nebyly splněny: lint zůstával `3 errors + 1 warning`, `project:check` nebyl na větvi definován a clean-code/environment/database konsolidace nebyla dokončena.

## Nasazeno

- produkčně nasazeno po fázi 1: `704950a7a5a0516175126f7761adf1ccb34dc043`, deployment `dpl_G4iaoxQ9f4DztA76djs8hfaceouZ`, `READY`, target `production`, alias `knee.vankotraining.cz`;
- tento deployment je dokumentační/řídicí změna bez změny `src/**`;
- exact-head preview PR #12 před přestavbou: `dpl_CRKmDChVUjP3DoZbwGcWkND7dNm5`, commit `1c5c5334c5855fc02107cc05e9fe1668a585f2b2`, `READY`;
- nekánonický projekt `vankotraining-knee-mxei` stále vyžaduje pozdější konsolidaci.

Následný state-only commit tohoto souboru může vytvořit novější Vercel deployment se stejným aplikačním runtime. Přesný živý deployment je proto před další změnou vždy nutné ověřit přímo ve Vercelu.

## Produkčně ověřeno

- fáze 1 je **produkčně nasazena**, nikoli uživatelsky produkčně ověřena;
- `READY` ani CI nejsou produkční ověření;
- poslední výslovné uživatelské produkční ověření doložené v repozitáři zůstává omezené na dřívější mobilní zobrazení splnění normy.

## Známé problémy

- PR #12 musí být přestavěn na čistém novém `main` a jeho původní head musí být nejdřív bezpečně zálohován;
- dev Supabase obsahuje PR #15 schema drift a zbylá acceptance data;
- exact-head preview PR #12 nemá nezávisle doložený dev Supabase project ref;
- současný Tindeq environment guard nekontroluje kombinaci Vercel environment ↔ Supabase project ref;
- produkční DB zatím negarantuje Tindeq deduplikaci unique constraintem;
- druhý Vercel projekt stále automaticky nasazuje stejné repo;
- shared production Supabase má pre-existující security/performance advisor nálezy mimo rozsah fáze 1;
- úplný mapping historických manuálních Knee SQL změn na repo migrace není doložen.

## Další krok

- Zahájit fázi 2: před jakýmkoli přepisem zálohovat původní head PR #12 a přestavět `agent/tindeq-results-site` na čistém aktuálním `main` pouze s výsledným schváleným ZIP-only stavem.
