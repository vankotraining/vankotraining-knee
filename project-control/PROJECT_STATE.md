# Project state

## Datum poslední kontroly

`2026-08-07 15:11 CEST` (Europe/Prague).

## Aktuální `main` commit

`7e11aa88fb0c14b5216542d4e03101aee082ec17` – `Record project-control phase 1 completion`.

Před zahájením fáze 3 byl živě ověřen aktuální GitHub `main`; PR #12 je vůči němu `1` commit ahead / `0` behind a merge-base je přesně tento commit.

## Aktivní větev a PR

- `agent/tindeq-results-site`, draft PR `#12`;
- fáze 2 je dokončena: původní experimentální historie byla přestavěna na jediný výsledný commit na aktuálním `main`;
- původní PR #12 head před přepisem: `1c5c5334c5855fc02107cc05e9fe1668a585f2b2`;
- bezpečná záloha: `backup/tindeq-results-site-2026-08-07-1c5c5334`, ověřená jako obsahově identická se starým headem;
- exact-head fáze 2 před clean-code změnou: `717dcfe7056b5547c17dd748c7ed9bb3b301f48e`;
- PR #14 je merged; PR #15 je uzavřen bez merge.

Exact SHA následného phase-3 commitu, jeho CI runy a případný preview deployment se vedou v popisu PR #12, protože commit nemůže autoritativně obsahovat vlastní SHA ani budoucí CI evidence.

## Produkční runtime commit

Před změnou fáze 3 byl živě ověřen produkční alias `knee.vankotraining.cz`:

- Vercel projekt `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`);
- deployment `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- stav `READY`, target `production`;
- commit `7e11aa88fb0c14b5216542d4e03101aee082ec17`.

Tindeq runtime z PR #12 tedy stále není v produkčním `main`.

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

Read-only kontrola před fází 3:

- `67` klientů celkem / `66` aktivních;
- `1` auth user;
- `0` celkových / `0` aktivních Tindeq sessions;
- migrace `20260802124337 tindeq_sessions` zůstává aplikovaná;
- fáze 3 neprovádí produkční DDL ani datový zápis.

### Vývojový Supabase `twndqnmrvefhwuwuglju`

Read-only kontrola před fází 3:

- `1` aktivní klient;
- `1` auth user;
- `1` celková / `1` aktivní Tindeq session;
- známý PR #15 schema drift zůstává neřešený;
- srovnání dev databáze a environment safety patří do následné fáze, nikoli do clean-code refaktoru.

## Aktuální fáze

**Fáze 3 – clean-code Tindeq refactor bez rozšíření funkčního rozsahu.**

Cíl této fáze:

- rozdělit monolitický `TindeqAnalyzer.tsx` podle odpovědností;
- oddělit graf, výsledkový rendering, side cards a prezentační utility;
- odstranit fuzzy rozhodování o vizuálním tónu podle českých prezentačních řetězců;
- používat explicitní prezentační status/tone hodnoty odvozené z analytických dat a kanonických domén;
- zachovat stejné ZIP-only chování, výpočty, persistence payload, auth, reporty a uživatelské texty.

Fáze 3 záměrně neřeší Supabase project-ref guard, schema drift, DB unique invariant ani Vercel konsolidaci.

## Implementováno v `main`

- samostatná Next.js Knee aplikace na `knee.vankotraining.cz`;
- přihlášení, klienti, knee extension měření, výpočty, historie, archivace/obnova a UI polish;
- kanonický project-control systém z PR #14 včetně bezpečných pravidel pro DB změny;
- Tindeq databázová tabulka je aplikovaná v produkční DB, ale Tindeq runtime není v `main`.

## Rozpracováno mimo `main`

PR #12 zachovává jediný podporovaný Tindeq workflow:

`Tindeq ZIP` → lokální validace/rozbalení → normalizovaná `TindeqSession` → kontrolní náhled → explicitní klient → explicitní save → historie → klientský pohled → trenérský detail → `tindeq-report-v1`.

Phase-3 refactor mění pouze interní strukturu prezentace:

- `TindeqAnalyzer.tsx` zůstává orchestrátorem importu, save/retry a výběru importované session;
- výsledkový klientský/trenérský rendering je oddělen do vlastní komponenty;
- graf a side cards mají samostatné komponenty;
- formátování a mapování typovaného tónu mají sdílenou prezentační utilitu;
- `src/lib/tindeq-client-view.ts` vrací explicitní `good | warning | problem | neutral` tone místo toho, aby UI odvozovalo barvu pomocí `includes()` nad českým textem;
- výpočetní prahy a textové výsledky zůstávají beze změny.

Závislost `fflate` byla znovu auditována: používá ji syntetický test fixture, nikoli produkční browser parser, takže její zařazení mezi `devDependencies` je správné. Repo stále nemá npm lockfile; deterministická instalace zůstává samostatným merge-gate dluhem.

## Nasazeno

- produkčně nasazen je pouze aktuální `main` `7e11aa88fb0c14b5216542d4e03101aee082ec17` v deploymentu `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- phase-2 exact-head preview PR #12 `dpl_Fygtnnqsem1BvCY5Q72HqtBGxSSY` odpovídá commitu `717dcfe7056b5547c17dd748c7ed9bb3b301f48e` a je pouze historická evidence po vzniku phase-3 commitu;
- nový phase-3 preview musí být doložen samostatně; Vercel Free plan v době zahájení fáze hlásil limit počtu deploymentů, takže CI success a preview deployment jsou samostatné stavy;
- nekánonický projekt `vankotraining-knee-mxei` stále automaticky reaguje na repo a vyžaduje pozdější konsolidaci.

## Produkčně ověřeno

Phase-3 Tindeq refactor není produkčně nasazen ani produkčně ověřen. `READY` deployment ani automatizované testy se za uživatelské produkční ověření nepovažují.

## Známé problémy

- `TindeqEnvironmentGuard` zatím nekontroluje skutečný Supabase project ref;
- dev Supabase obsahuje PR #15 schema drift a jedno testovací Tindeq měření;
- Tindeq aplikační deduplikace nemá DB unique invariant proti přesně souběžným insertům;
- repo nemá npm lockfile a CI stále používá nedeterministické `npm install`;
- druhý Vercel projekt `vankotraining-knee-mxei` představuje paralelní deployment riziko;
- reálný magic-link a skutečný ZIP acceptance na bezpečně potvrzeném dev preview ještě nejsou dokončeny;
- existující lint baseline v `main` je `3 errors + 1 warning` mimo Tindeq soubory a phase-3 refactor ji nesmí zhoršit.

## Další krok

- Po exact-head CI fáze 3 pokračovat fází 4: srovnat dev Supabase s kanonickým ZIP-only schématem a implementovat DB-aware environment guard před jakoukoli zápisovou preview acceptance.
