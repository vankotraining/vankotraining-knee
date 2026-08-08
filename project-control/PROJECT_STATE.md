# Project state

## Datum poslední kontroly

`2026-08-08` (Europe/Prague).

## Aktuální `main` commit

`7e11aa88fb0c14b5216542d4e03101aee082ec17` – `Record project-control phase 1 completion`.

PR #12 je stále založený přímo na tomto `main`.

Tento soubor eviduje kanonický stav projektu, ale nemůže autoritativně obsahovat vlastní budoucí commit SHA. Přesný živý head PR, CI a Vercel deployment se před další změnou vždy znovu resolve přes GitHub/Vercel.

## Aktivní větev a PR

- větev: `agent/tindeq-results-site`;
- draft PR: `#12`;
- PR je otevřený, ne-merged a při fresh kontrole `2026-08-08` mergeable;
- submitted reviews: `0`;
- review threads / unresolved review threads: `0`;
- phase-7 runtime head s manuálním acceptance: `3d3bc241b2085ed3c547bdfc219ea1d9f4a4e2c1`;
- phase-7 source-of-truth head před merge-readiness prací: `96ae61a926c8700a0b4ed20fe5540b97f09c7920`;
- poslední exact implementation head deterministické instalace před tímto dokumentačním syncem: `aa4471d90e796a01030622b6b2028f8a28d7156d`.

Od phase-7 headu `96ae61a9...` do `aa4471d9...` se změnily pouze `.github/workflows/tindeq-client-view.yml`, `package-lock.json` a `tsconfig.json`; Tindeq runtime, auth, ZIP parser ani persistence kód se nezměnily.

## Produkční runtime commit

Produkční alias `knee.vankotraining.cz` je živě ověřen na:

- Vercel projekt `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`);
- deployment `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- stav `READY`, target `production`;
- commit `7e11aa88fb0c14b5216542d4e03101aee082ec17`;
- alias error: žádný.

Tindeq runtime z PR #12 tedy stále není v produkčním `main`.

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

Fresh read-only pre-check `2026-08-08`:

- `public.tindeq_sessions`: `0` celkem / `0` aktivních;
- chybějící nebo neplatný `raw_metadata ->> 'tindeqSessionId'`: `0`;
- aktivní duplicate groups podle `(athlete_id, analysis_version, tindeqSessionId)`: `0`;
- constraint `tindeq_sessions_source_session_id_valid`: neexistuje;
- index `tindeq_sessions_active_source_session_uidx`: neexistuje;
- RLS je zapnuté;
- relevantní policies a grants odpovídají dev schématu před phase-5 invariantem;
- repo migration SQL odpovídá skutečnému produkčnímu schématu a přidává pouze očekávaný CHECK + partial unique expression index;
- phase-5 migrace není aplikovaná;
- při této merge-readiness práci nebyla provedena žádná produkční DDL, Auth, environment-variable ani datová mutace.

Připravený migrační soubor:

`supabase/migrations/20260807_tindeq_active_session_unique.sql`.

Pre/post checks:

- `supabase/checks/20260807_tindeq_active_session_unique_precheck.sql`;
- `supabase/checks/20260807_tindeq_active_session_unique_checks.sql`.

### Vývojový Supabase `twndqnmrvefhwuwuglju`

Fresh read-only stav `2026-08-08`:

- `1` Tindeq session / `1` aktivní;
- `0` neplatných source session ID;
- `0` aktivních duplicate groups;
- validated constraint `tindeq_sessions_source_session_id_valid` existuje;
- partial unique index `tindeq_sessions_active_source_session_uidx` existuje;
- phase-5 invariant je tedy na dev aktivní.

## Fáze 7 — acceptance

Fáze 7 je **manuálně ověřeno: PASS**.

Na exact preview pro runtime head `3d3bc241b2085ed3c547bdfc219ea1d9f4a4e2c1` bylo uživatelem potvrzeno:

- dev Supabase environment guard;
- magic-link přihlášení z deployment-specific Vercel Preview;
- návrat magic linku na stejný exact preview `/tindeq` bez localhostu;
- úspěšný `/verify` a aktivní session;
- skutečný Tindeq ZIP import;
- explicitní save;
- následné načtení historie;
- idempotentní duplicate handling stejného skutečného Tindeq výsledku;
- nevznikl druhý aktivní duplicate DB řádek.

Produkční Supabase/Auth ani produkční runtime během fáze 7 změněny nebyly. Preview acceptance není produkční ověření.

## Deterministická instalace a exact-head verification

Autentický `package-lock.json` byl vytvořen standardním npm workflow na GitHub-hosted runneru, nikoli ručně:

- bootstrap run: `31245994950`;
- Node `22.23.1`, npm `10.9.8`;
- `npm install --no-audit --no-fund` vytvořilo lockfile;
- následný čistý `npm ci --no-audit --no-fund` prošel;
- `package.json` zůstal beze změny;
- `package-lock.json` zůstal po `npm ci` byte-identický;
- výsledný lockfile má `lockfileVersion: 3`.

CI bylo změněno z `npm install` na `npm ci`. Lint baseline `main` se porovnává stejným lockfile-backed toolchainem a CI explicitně kontroluje, že current-main dependency specs jsou podmnožinou branch specs.

Při prvním samostatném `tsc --noEmit` se prokázal config-scope problém: root `tsconfig.json` s `target: ES2017` globem zahrnoval `*.test.ts`, zatímco testy jsou záměrně kompilované přes `tsconfig.test.json` s `target: ES2022`. Oprava pouze oddělila app a test TypeScript scope; runtime kód se nezměnil.

Exact implementation head `aa4471d90e796a01030622b6b2028f8a28d7156d` je **automaticky ověřeno** runem `31246203230`:

- čistý `npm ci`: PASS a lockfile/package manifest bez diffu;
- unit testy: `93/93` PASS;
- auth hardening + environment guard testy: PASS;
- ZIP workflow testy: PASS;
- dedupe/race testy: PASS;
- lint: `main = 3 errors + 1 warning`, branch = `3 errors + 1 warning`; žádná nová lint chyba ani warning;
- production build: PASS;
- Next.js TypeScript: PASS;
- standalone app `tsc --noEmit`: PASS;
- project-control check: PASS;
- `git diff --check`: PASS;
- Playwright: `10/10` PASS;
- screenshot artifact: `9018581436`, 5 PNG, SHA-256 `5be6f7bf2122d473f924f13e913e176923eec4a664a15f1601dddc3e8b6bae92`.

Exact preview pro tento implementation head:

- deployment `dpl_7v8m7r2JTHxKMXZtQ36qzAp9v6eg`;
- exact SHA `aa4471d90e796a01030622b6b2028f8a28d7156d`;
- `READY`;
- alias error: `null`;
- branch alias: `vankotraining-knee-git-agent-tin-d8df0b-vankotrainings-projects.vercel.app`;
- Vercel build dokončil dependency install, Next build a TypeScript;
- Vercel log neexponuje přesný interní npm install příkaz, proto se netvrdí, že Vercel explicitně spustil `npm ci`;
- duplicitní Vercel projekt nevytvořil pro nové SHA žádný deployment.

## Aktuální fáze

**PR #12 merge-readiness je technicky připravený k produkčnímu phase-5 DB approval gate.**

Fáze 7 je dokončena. Deterministic lockfile / `npm ci` gate a exact implementation-head verification jsou PASS. Fresh produkční DB pre-check je PASS. Produkční phase-5 migrace je pouze připravená, nikoli aplikovaná.

PR zůstává draft a není automaticky označen ready-for-review ani merged.

## Implementováno v `main`

- samostatná Next.js Knee aplikace na `knee.vankotraining.cz`;
- přihlášení, klienti, knee extension měření, výpočty, historie, archivace/obnova a UI polish;
- kanonický project-control systém;
- produkční `public.tindeq_sessions` tabulka z původní migrace;
- Tindeq runtime z PR #12 stále není v `main`.

## Rozpracováno mimo `main`

PR #12 obsahuje:

- jediný podporovaný Tindeq ZIP-only tok;
- fail-closed auth/environment guard a preview magic-link hardening;
- normalizaci, explicitní save, historii, klientský/trenérský výstup a report;
- DB-aware idempotentní dedupe + race recovery;
- phase-5 DB invariant a checks;
- autentický npm lockfile;
- deterministické CI přes `npm ci`;
- oddělený app/test TypeScript scope pro samostatný typecheck.

## Nasazeno

- produkčně: pouze `main` `7e11aa88fb0c14b5216542d4e03101aee082ec17` v `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- phase-7 manuálně accepted preview: `dpl_ERZJCHPrHL4XgFp23kBPVTmfSmtV` pro `3d3bc241b2085ed3c547bdfc219ea1d9f4a4e2c1`;
- deterministic-install implementation preview: `dpl_7v8m7r2JTHxKMXZtQ36qzAp9v6eg` pro `aa4471d90e796a01030622b6b2028f8a28d7156d`, `READY`;
- phase-5 DB invariant je nasazen pouze v dev Supabase `twndqnmrvefhwuwuglju`, nikoli v produkci.

## Produkčně ověřeno

Tindeq změny z PR #12 nejsou produkčně nasazené ani produkčně ověřené. READY preview, dev DB verification, automatizované testy ani manuální phase-7 preview acceptance se za produkční ověření nepovažují.

## Známé problémy / otevřené gates

- produkční phase-5 dedupe migrace není aplikovaná a vyžaduje samostatné explicitní schválení uživatele;
- před schváleným produkčním DDL musí být podle operations potvrzen použitelný backup/restore nebo export gate;
- PR #12 zůstává draft a není merged;
- produkční Tindeq runtime není nasazen;
- existující lint baseline v `main` je `3 errors + 1 warning` mimo Tindeq změny;
- shared production Supabase má dříve evidované security/performance advisor nálezy mimo tento scope;
- úplný mapping historických manuálních Knee SQL změn na repo migrace není doložen.

## Další krok

- Vyžádat samostatné explicitní schválení produkční phase-5 dedupe migrace; před jejím spuštěním ověřit použitelný backup/restore gate a po aplikaci provést post-check.
