# Project state

## Datum poslední kontroly

`2026-08-08` (Europe/Prague).

## Aktuální `main` commit

`7e11aa88fb0c14b5216542d4e03101aee082ec17` – `Record project-control phase 1 completion`.

PR #12 je stále založený přímo na tomto `main`. Tento soubor nemůže autoritativně obsahovat SHA vlastního budoucího synchronizačního commitu; před další změnou se živý head, CI a deployment vždy znovu resolve přes GitHub/Vercel.

## Aktivní větev a PR

- větev: `agent/tindeq-results-site`;
- draft PR: `#12`;
- PR je open, ne-merged a při posledním fresh re-checku mergeable;
- submitted reviews: `0`;
- review threads / unresolved review threads: `0`;
- phase-7 manuálně accepted runtime head: `3d3bc241b2085ed3c547bdfc219ea1d9f4a4e2c1`;
- poslední plně automaticky ověřený merge-readiness head před tímto DB-state syncem: `2b8094629e9c689894648e38ff1194e228fe2f2b`.

## Produkční runtime commit

Produkční alias `knee.vankotraining.cz` nadále používá:

- Vercel projekt `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`);
- deployment `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- stav `READY`, target `production`;
- commit `7e11aa88fb0c14b5216542d4e03101aee082ec17`;
- alias error: žádný.

Tindeq aplikační runtime z PR #12 tedy stále není produkčně nasazen.

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

Phase-5 active-session dedupe migrace byla po explicitním uživatelském schválení aplikována `2026-08-08` jako:

`20260808091809 tindeq_active_session_unique`.

Použit byl přesně repo SQL soubor `supabase/migrations/20260807_tindeq_active_session_unique.sql`.

Fresh pre-check bezprostředně před DDL:

- `public.tindeq_sessions`: `0` celkem / `0` aktivních;
- invalidní nebo chybějící `raw_metadata ->> 'tindeqSessionId'`: `0`;
- active duplicate groups podle `(athlete_id, analysis_version, tindeqSessionId)`: `0`;
- phase-5 CHECK: neexistoval;
- phase-5 partial UNIQUE index: neexistoval;
- tabulka měla `28` sloupců, RLS zapnuté a `3` policies.

Backup/export gate:

- read-only logický export `public.tindeq_sessions` byl vytvořen těsně před migrací;
- protože tabulka měla `0` řádků, export relevantních dat byl přesně `[]`;
- rollback je omezen na odstranění nového indexu a CHECK constraintu a je dokumentovaný v repo migraci/operations.

Post-check po commitnuté migraci:

- `public.tindeq_sessions`: stále `0` celkem / `0` aktivních;
- invalid source session ID: `0`;
- active duplicate groups: `0`;
- validated CHECK `tindeq_sessions_source_session_id_valid`: existuje a vynucuje `^[0-9a-f]{20}$`;
- partial unique index `tindeq_sessions_active_source_session_uidx`: existuje pro `(athlete_id, analysis_version, raw_metadata ->> 'tindeqSessionId') WHERE deleted_at IS NULL`;
- tabulka zůstala na `28` sloupcích, RLS je zapnuté, `3` policies a relevantní grants zůstaly zachované;
- security/performance advisors byly po DDL spuštěny; neobjevil se nový phase-5 nález na `public.tindeq_sessions`. Dříve existující shared-production advisory nálezy zůstávají mimo scope této migrace.

### Vývojový Supabase `twndqnmrvefhwuwuglju`

Phase-5 invariant zůstává aktivní i na dev:

- `1` Tindeq session / `1` aktivní;
- `0` invalidních source session ID;
- `0` active duplicate groups;
- validated CHECK a partial unique index existují.

## Fáze 7 — acceptance

Fáze 7 je **manuálně ověřeno: PASS** na dev Supabase a exact Vercel Preview.

Bylo potvrzeno:

- dev environment guard;
- deployment-specific magic-link bez localhost fallbacku;
- úspěšný `/verify` a aktivní session;
- skutečný Tindeq ZIP import;
- explicitní save a historie;
- idempotentní duplicate handling bez druhého aktivního řádku.

Preview acceptance není produkční ověření.

## Deterministická instalace a exact-head verification

Repo obsahuje autentický `package-lock.json`; CI používá `npm ci` a kontroluje nulový diff `package.json`/`package-lock.json`.

Poslední plně ověřený head před tímto dokumentačním syncem `2b8094629e9c689894648e38ff1194e228fe2f2b`:

- Verify Tindeq client view: success;
- Project control: success;
- unit `93/93` PASS;
- lint baseline `main = 3 errors + 1 warning`, branch = `3 errors + 1 warning`;
- production build + Next TypeScript + standalone `tsc --noEmit`: PASS;
- project-control + `git diff --check`: PASS;
- Playwright `10/10` PASS;
- 5 screenshot PNG;
- preview `dpl_B2wQpWAA46EaoCEbiwHXpofoNXj9`: `READY`, alias error `null`;
- duplicitní Vercel projekt pro tento head: `0` nových deploymentů.

## Aktuální fáze

**Produkční phase-5 DB gate je dokončený a databázově ověřený. PR #12 je nyní připravený k finálnímu merge-readiness rozhodnutí.**

To neznamená ready-for-review, merge, produkční runtime deployment ani produkční ověření; tyto kroky mají samostatné approval gates.

## Implementováno v `main`

- samostatná Next.js Knee aplikace na `knee.vankotraining.cz`;
- přihlášení, klienti, knee extension měření, výpočty, historie, archivace/obnova a UI polish;
- kanonický project-control systém;
- produkční `public.tindeq_sessions` tabulka z původní migrace;
- Tindeq runtime z PR #12 stále není v `main`.

## Rozpracováno mimo `main`

PR #12 obsahuje:

- kanonický ZIP-only Tindeq tok;
- fail-closed auth/environment guard a magic-link hardening;
- normalizaci, explicitní save, historii a reporty;
- DB-aware idempotentní dedupe + race recovery;
- phase-5 DB invariant a checks;
- autentický npm lockfile a deterministické CI přes `npm ci`;
- oddělený app/test TypeScript scope.

## Nasazeno

- produkční aplikační runtime: pouze `main` `7e11aa88fb0c14b5216542d4e03101aee082ec17` v `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- production DB: phase-5 migration `20260808091809 tindeq_active_session_unique` je aplikovaná a post-check PASS;
- phase-7 manuálně accepted preview: `dpl_ERZJCHPrHL4XgFp23kBPVTmfSmtV`;
- poslední ověřený merge-readiness preview před tímto syncem: `dpl_B2wQpWAA46EaoCEbiwHXpofoNXj9` pro `2b8094629e9c689894648e38ff1194e228fe2f2b`, `READY`.

## Produkčně ověřeno

Produkční DB schema change je **automaticky/databázově ověřená**, nikoli uživatelsky produkčně ověřená aplikace.

Tindeq runtime z PR #12 není produkčně nasazen a Tindeq workflow na produkční doméně nebylo uživatelem ověřeno. READY deployment, DB post-check ani preview acceptance se za produkční runtime ověření nepovažují.

## Známé problémy

- PR #12 zůstává draft a není merged;
- produkční Tindeq runtime není nasazen;
- existující lint baseline v `main` je `3 errors + 1 warning` mimo Tindeq změny;
- shared production Supabase má dříve existující security/performance advisor nálezy mimo phase-5 scope;
- úplný mapping historických manuálních Knee SQL změn na repo migrace není doložen.

## Další krok

- Provést finální exact-head merge-readiness re-check a poté vyžádat samostatné rozhodnutí, zda PR #12 přepnout z draftu na ready-for-review / merge; bez explicitního souhlasu nic nemergovat ani produkčně nenasazovat.
