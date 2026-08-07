# Project state

## Datum poslední kontroly

`2026-08-07 19:03 CEST` (Europe/Prague).

## Aktuální `main` commit

`7e11aa88fb0c14b5216542d4e03101aee082ec17` – `Record project-control phase 1 completion`.

Před změnami fáze 5 byl živě ověřen aktuální `main`; PR #12 zůstává založený přímo na tomto commitu a před phase-5 změnami byl `6` commitů ahead / `0` behind.

Tento soubor je stavová evidence zapisovaná následným commitem. Nemůže autoritativně obsahovat vlastní výsledný SHA; exact-head SHA, CI a případný preview deployment se vedou v popisu PR #12 a před další změnou se znovu resolve přes GitHub/Vercel.

## Aktivní větev a PR

- `agent/tindeq-results-site`, draft PR `#12`;
- PR je otevřený a při poslední kontrole mergeable;
- fáze 2 clean rebuild je dokončena;
- bezpečná záloha původního experimentálního headu: `backup/tindeq-results-site-2026-08-07-1c5c5334`;
- phase-3 clean-code exact head: `e73730c55f7b2e56f638acf380736deaed628df5`;
- phase-4 exact head: `d67a89765b59b0f5ca8db4268cf543beac6082b7`;
- phase-5 implementační/testovací baseline před stavovou dokumentací: `5bb8f93ab293d0385662ce0481bf0f81ced1e52d`;
- PR #14 je merged; PR #15 je uzavřen bez merge.

Finální exact-head evidence phase 5 se zapíše do popisu PR #12 po dokončení state-only commitů a jejich CI.

## Produkční runtime commit

Produkční alias `knee.vankotraining.cz` byl před phase-5 změnou znovu živě ověřen a zůstává:

- Vercel projekt `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`);
- deployment `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- stav `READY`, target `production`;
- commit `7e11aa88fb0c14b5216542d4e03101aee082ec17`.

Tindeq runtime z PR #12 tedy stále není v produkčním `main`.

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

Fresh read-only phase-5 audit:

- PostgreSQL `17.6`;
- `0` Tindeq sessions / `0` aktivních;
- `0` řádků s chybějícím nebo neplatným `raw_metadata.tindeqSessionId`;
- `0` aktivních duplicate groups pro `(athlete_id, analysis_version, tindeqSessionId)`;
- migration history stále končí `20260802124337 tindeq_sessions`.

Phase-5 unique invariant **není na produkci aplikovaný**. Nebyla provedena žádná produkční DDL ani datová mutace.

### Vývojový Supabase `twndqnmrvefhwuwuglju`

Před phase-5 migrací:

- PostgreSQL `17.6`;
- `1` Tindeq session / `1` aktivní;
- source session ID `a10424fb2f9bf4efc2f0` odpovídal parser kontraktu;
- `0` neplatných source session ID;
- `0` aktivních duplicate groups.

Na dev byla aplikována verzovaná migrace:

`20260807170014 tindeq_active_session_unique`.

Repo artefakty:

- `supabase/migrations/20260807_tindeq_active_session_unique.sql`;
- `supabase/checks/20260807_tindeq_active_session_unique_precheck.sql`;
- `supabase/checks/20260807_tindeq_active_session_unique_checks.sql`.

Po migraci:

- validated constraint `tindeq_sessions_source_session_id_valid` vyžaduje `^[0-9a-f]{20}$`;
- unique partial expression index `tindeq_sessions_active_source_session_uidx` vynucuje jednu aktivní identitu `(athlete_id, analysis_version, tindeqSessionId)`;
- `WHERE deleted_at IS NULL` zachovává soft-delete/reimport semantiku;
- `1` Tindeq session / `1` aktivní;
- `0` neplatných source session ID;
- `0` aktivních duplicate groups.

Skutečné dev enforcement probes:

- druhý aktivní insert se stejnou identitou byl odmítnut `unique_violation`; počet řádků zůstal `1`;
- insert s neplatným source session ID byl odmítnut `check_violation`; počet řádků zůstal `1`.

Post-DDL advisors nepřidaly žádný phase-5 specifický problém. Zůstávají dříve evidované SECURITY DEFINER/leaked-password warningy a unused `tindeq_sessions_analysis_version_idx`; nejsou rozsahem této fáze.

## Aktuální fáze

**Fáze 5 – DB-level deduplikace Tindeq source sessions.**

Databázová aktivní identita je:

`(athlete_id, analysis_version, raw_metadata ->> 'tindeqSessionId')`.

Phase-5 migrace:

- fail-closed zastaví aplikaci, pokud existuje neplatné source session ID nebo aktivní duplicate group;
- žádné řádky nemaže, nepřepisuje ani automaticky nededuplikuje;
- přidává validující check constraint;
- přidává partial unique index pouze pro aktivní řádky.

Aplikační persistence zachovává rychlý `findDuplicate()` pre-check. Pokud při souběžných insertech DB vrátí PostgreSQL `23505`, aplikace znovu načte exact aktivní duplicate; pokud ho najde, vrátí idempotentní `duplicate: true`, jinak původní unique error nezamaskuje.

Nové race testy byly přidány do testovacího TypeScript include; před finálním uzavřením musí exact-head CI prokázat, že se skutečně spouštějí.

## Implementováno v `main`

- samostatná Next.js Knee aplikace na `knee.vankotraining.cz`;
- přihlášení, klienti, knee extension měření, výpočty, historie, archivace/obnova a UI polish;
- kanonický project-control systém;
- produkční Tindeq tabulka z původní migrace, ale Tindeq runtime PR #12 není v `main`.

## Rozpracováno mimo `main`

PR #12 zachovává jediný podporovaný tok:

`Tindeq ZIP` → lokální validace/rozbalení → normalizovaná `TindeqSession` → náhled → explicitní klient → explicitní save → historie → klientský/trenérský výstup → `tindeq-report-v1`.

Fáze 3 oddělila prezentační odpovědnosti, fáze 4 srovnala dev DB a zavedla DB-aware environment guard a fáze 5 přidává atomický DB dedupe invariant + race recovery.

Repo stále nemá autentický npm lockfile; deterministická instalace zůstává merge-gate dluhem.

## Nasazeno

- produkčně je nadále nasazen pouze `main` `7e11aa88fb0c14b5216542d4e03101aee082ec17` v deploymentu `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- phase-4 preview `dpl_GYvRgA9ChKg87Sh7pteCnPBUT6DZ` odpovídá historickému phase-4 headu `d67a89765b59b0f5ca8db4268cf543beac6082b7`;
- phase-5 exact-head preview se eviduje až po dokončení finálního state-only commitu a ověření Vercel metadata;
- phase-5 DB invariant je databázově aplikovaný pouze v dev Supabase `twndqnmrvefhwuwuglju`, nikoli v produkci.

## Produkčně ověřeno

Tindeq změny z PR #12 nejsou produkčně nasazené ani produkčně ověřené. Dev DB aplikace, READY preview ani automatizované testy se za produkční ověření nepovažují.

## Známé problémy / otevřené gates

- phase-5 produkční dedupe migrace je připravena, ale není aplikována; před případnou produkční DDL je nutný fresh pre-check, backup/rollback gate a samostatné explicitní schválení uživatele;
- Vercel Preview `NEXT_PUBLIC_SUPABASE_URL` není nezávisle read-only potvrzená, takže write acceptance zůstává blokovaná;
- repo nemá npm lockfile a CI používá `npm install`;
- druhý Vercel projekt `vankotraining-knee-mxei` představuje paralelní deployment riziko;
- reálný magic-link a skutečný ZIP acceptance ještě nejsou dokončeny;
- existující lint baseline v `main` je `3 errors + 1 warning` mimo Tindeq soubory.

## Další krok

- **Fáze 6:** připravit a provést bezpečnou konsolidaci duplicitního Vercel projektu pouze po ověření kanonického projektu/domén a příslušném approval gate; produkční DB dedupe zůstává samostatně neschválená a nesmí být při této fázi aplikována.
