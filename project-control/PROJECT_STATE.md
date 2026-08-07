# Project state

## Datum poslední kontroly

`2026-08-07 18:27 CEST` (Europe/Prague).

## Aktuální `main` commit

`7e11aa88fb0c14b5216542d4e03101aee082ec17` – `Record project-control phase 1 completion`.

Před změnami fáze 4 byl `main` znovu živě ověřen. PR #12 zůstává založený přímo na tomto commitu; merge-base se nezměnil.

Tento soubor je stavová evidence zapisovaná následným commitem. Nemůže autoritativně obsahovat vlastní výsledný SHA; před další změnou se proto vždy znovu resolve aktuální `main` a head PR #12 přes GitHub.

## Aktivní větev a PR

- `agent/tindeq-results-site`, draft PR `#12`;
- PR je otevřený a při poslední kontrole mergeable;
- fáze 2 je dokončena: původní experimentální historie byla přestavěna na aktuálním `main`;
- původní PR #12 head před přepisem: `1c5c5334c5855fc02107cc05e9fe1668a585f2b2`;
- bezpečná záloha: `backup/tindeq-results-site-2026-08-07-1c5c5334`;
- clean-rebuild commit fáze 2: `717dcfe7056b5547c17dd748c7ed9bb3b301f48e`;
- clean-code exact head fáze 3: `e73730c55f7b2e56f638acf380736deaed628df5`;
- implementační baseline fáze 4: `1891966760c344e0adad645be7469772d441f8bc`;
- PR #14 je merged; PR #15 je uzavřen bez merge;
- review threads PR #12 byly před změnou fáze 4 prázdné.

Exact SHA tohoto následného state-only commitu, jeho CI a preview deployment se vedou v popisu PR #12 a živě se resolve před další prací.

## Produkční runtime commit

Produkční alias `knee.vankotraining.cz` zůstává beze změny:

- Vercel projekt `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`);
- deployment `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- stav `READY`, target `production`;
- commit `7e11aa88fb0c14b5216542d4e03101aee082ec17`.

Fáze 4 nemění produkční Vercel konfiguraci ani produkční runtime. Tindeq runtime z PR #12 stále není v produkčním `main`.

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

Read-only kontrola v rámci fáze 4:

- `1` auth user;
- `67` klientů celkem / `66` aktivních;
- `0` celkových / `0` aktivních Tindeq sessions;
- `public.tindeq_sessions` má kanonických `28` sloupců;
- RLS je zapnuté;
- indexy: primary key, `tindeq_sessions_active_athlete_measured_idx`, `tindeq_sessions_analysis_version_idx`;
- authenticated role má pouze `SELECT`, `INSERT` a column-level `UPDATE` pro `deleted_at`, `deleted_by`, `deleted_context`, `delete_reason`, `updated_at`, `updated_by`;
- fáze 4 neprovedla žádnou produkční DDL ani datovou změnu.

### Vývojový Supabase `twndqnmrvefhwuwuglju`

Před fází 4 měl dev projekt vedle kanonických 28 sloupců dalších 18 polí z uzavřeného PR #15, dva extra indexy, extra constraints, rozšířené policies a příliš široké table-level grants pro `authenticated`.

Před odstraněním driftu bylo ověřeno:

- dev obsahoval `1` auth user, `1` aktivního klienta a `1` aktivní Tindeq session;
- všech 18 PR #15-only polí bylo u jediného Tindeq řádku `NULL`;
- žádný view ani funkce tato extra pole nepoužívaly;
- digest 28 kanonických polí existujícího Tindeq řádku byl `873a32e6111db4c0f550498201b01d73`.

Na dev projekt byla přes `apply_migration` aplikována verzovaná migrace:

- `20260807161852 align_tindeq_dev_schema`;
- zdroj v repozitáři: `supabase/migrations/20260807_align_tindeq_dev_schema.sql`;
- read-only kontrola: `supabase/checks/20260807_align_tindeq_dev_schema_checks.sql`.

Po migraci dev odpovídá kanonickému Tindeq DB modelu:

- přesně `28` kanonických sloupců;
- stejné tři indexy jako produkční baseline;
- stejné tři SELECT/INSERT/UPDATE RLS policies jako produkční baseline;
- RLS zapnuté;
- authenticated grants omezené na `SELECT`, `INSERT` a stejných šest soft-delete/audit UPDATE sloupců jako v produkci;
- všechny PR #15-only sloupce, indexy a constraints odstraněny;
- `1` Tindeq řádek / `1` aktivní řádek zůstal zachovaný;
- digest 28 kanonických polí po migraci je stále `873a32e6111db4c0f550498201b01d73`, takže existující normalizovaný dev záznam nebyl obsahově změněn.

Post-migration security advisor nadále hlásí preexisting warningy na authenticated-executable `SECURITY DEFINER` soft-delete/restore funkce a vypnutou leaked-password protection. Performance advisor hlásí nepoužitý `tindeq_sessions_analysis_version_idx`. Tyto body nebyly fází 4 nově zavedeny a nejsou v této fázi měněny.

## Fáze 4 – DB-aware environment guard

Fáze 4 odstranila implicitní produkční fallback z browser Supabase konfigurace a zavedla fail-closed kontrolu skutečného Supabase project ref před mountem Tindeq workspace.

Kanonická pravidla:

- `knee.vankotraining.cz` + `/tindeq...` očekává pouze produkční ref `zxvndqicslyulrinbpyn`;
- localhost / `127.0.0.1` + `/tindeq...` očekává pouze dev ref `twndqnmrvefhwuwuglju`;
- Knee Vercel preview hostname + `/tindeq...` očekává pouze dev ref `twndqnmrvefhwuwuglju`;
- skutečný project ref se parsuje z `NEXT_PUBLIC_SUPABASE_URL`;
- chybějící, neplatná nebo mismatched URL failuje closed;
- při fail-closed stavu se `TindeqWorkspace` vůbec nevyrenderuje, takže se nespustí session check, načtení klientů ani Tindeq load/save;
- produkční Supabase URL ani browser key již nejsou hardcoded fallback v `src/lib/supabase-browser.ts`;
- browser config preferuje `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, během přechodu podporuje i `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

CI používá explicitní testovací dev URL `https://twndqnmrvefhwuwuglju.supabase.co`; tato CI hodnota není důkazem Vercel Preview environment value.

## Exact-head evidence implementačního baseline fáze 4

Pro commit `1891966760c344e0adad645be7469772d441f8bc`:

- Project control run `31196947220`: `success`;
- Tindeq workflow `31196945307`, job `92927376563`: `success`;
- exact checkout: `1891966760c344e0adad645be7469772d441f8bc`;
- unit testy: `87/87 passed`;
- lint: branch `3 errors + 1 warning`, stejné jako `main`; žádná nová lint regrese;
- build + TypeScript: `PASS`;
- `npm run project:check`: `PASS`;
- `git diff --check origin/main...HEAD`: `PASS`;
- Playwright: `10/10 passed`;
- screenshot artifact ID `9001259886`, 5 PNG souborů, SHA256 `929bfa864dcdd11c209112115e3865f8e5df65cbec203a836d5097d37777f750`.

## Nasazeno na preview

Implementační baseline fáze 4 má kanonický Vercel preview:

- deployment `dpl_8gPbMLpa5AmCbXJR78jVfGkoVcZ1`;
- exact commit `1891966760c344e0adad645be7469772d441f8bc`;
- project `vankotraining-knee`;
- state `READY`, target Preview;
- `/tindeq` vrací HTTP 200;
- compiled client bundle obsahuje nový guard a očekávané prod/dev project-ref mapování.

V tomto konektoru není Vercel environment-variable read API a SSO-protected static chunk s konkrétní inlined `NEXT_PUBLIC_SUPABASE_URL` se nepodařilo read-only stáhnout bez browser cookie. Skutečná Vercel Preview hodnota proto zatím není nezávisle potvrzená. To není bezpečnostní bypass: nový guard v případě chybějícího nebo nesprávného refu workspace fail-closed zablokuje. Zápisová preview acceptance však zůstává blokovaná, dokud nebude dev ref nezávisle potvrzen jinou autorizovanou cestou.

Nekánonický Vercel projekt `vankotraining-knee-mxei` zůstává samostatné známé deployment riziko k pozdější konsolidaci.

## Implementováno v `main`

- samostatná Next.js Knee aplikace na `knee.vankotraining.cz`;
- přihlášení, klienti, knee extension měření, výpočty, historie, archivace/obnova a UI polish;
- kanonický project-control systém z PR #14;
- Tindeq databázová tabulka je aplikovaná v produkční DB, ale Tindeq runtime není v `main`.

## Rozpracováno mimo `main`

PR #12 zachovává jediný podporovaný Tindeq workflow:

`Tindeq ZIP` → lokální validace/rozbalení → normalizovaná `TindeqSession` → kontrolní náhled → explicitní klient → explicitní save → historie → klientský pohled → trenérský detail → `tindeq-report-v1`.

Fáze 3 oddělila prezentační odpovědnosti a odstranila fuzzy textové rozhodování. Fáze 4 navíc srovnala dev DB s kanonickým ZIP-only modelem a vložila DB-aware environment gate před celý Tindeq workspace.

Závislost `fflate` je správně v `devDependencies`, protože ji používá syntetický test fixture. Repo stále nemá npm lockfile a CI používá `npm install`; deterministická instalace zůstává samostatným merge-gate dluhem.

## Produkčně ověřeno

Tindeq změny z PR #12 nejsou produkčně nasazené ani produkčně ověřené. `READY` preview, DB audit ani automatizované testy se za uživatelské produkční ověření nepovažují.

## Známé problémy / otevřené gates

- Vercel Preview `NEXT_PUBLIC_SUPABASE_URL` zatím není nezávisle read-only potvrzená; guard je fail-closed a write acceptance je proto zatím blokovaná;
- Tindeq aplikační deduplikace nemá DB unique invariant proti přesně souběžným insertům;
- repo nemá npm lockfile a CI stále používá nedeterministické `npm install`;
- druhý Vercel projekt `vankotraining-knee-mxei` představuje paralelní deployment riziko;
- reálný magic-link a skutečný ZIP acceptance ještě nejsou dokončeny;
- existující lint baseline v `main` je `3 errors + 1 warning` mimo Tindeq soubory.

## Další krok

**Fáze 5:** navrhnout DB-level deduplikaci jako explicitní databázový invariant proti souběžným insertům. Produkční DDL se nesmí aplikovat bez samostatného výslovného schválení uživatele. Součástí návrhu musí být migration SQL, pre-check, post-check, dopad na existující řádky a rollback/mitigation postup.
