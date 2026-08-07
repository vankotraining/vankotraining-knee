# Project state

## Datum poslední kontroly

`2026-08-07 12:40 CEST` (Europe/Prague).

## Aktuální `main` commit

`7e11aa88fb0c14b5216542d4e03101aee082ec17` – `Record project-control phase 1 completion`.

## Aktivní větev a PR

- `agent/tindeq-results-site`, draft PR `#12` – probíhá fáze 2: čistý rebuild ZIP-only výsledného stavu přímo na aktuálním `main`;
- původní PR #12 head před přepisem: `1c5c5334c5855fc02107cc05e9fe1668a585f2b2`;
- bezpečná záloha původního headu: `backup/tindeq-results-site-2026-08-07-1c5c5334`, obsahově identická s uvedeným SHA;
- exact-head SHA čistého rebuildu se zapisuje do popisu PR #12, protože commit nemůže autoritativně obsahovat vlastní SHA;
- PR #14 je merged; PR #15 je uzavřen bez merge.

## Produkční runtime commit

Aktuální živý produkční deployment při kontrole je `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`, stav `READY`, target `production`, commit `7e11aa88fb0c14b5216542d4e03101aee082ec17`. Alias zahrnuje `knee.vankotraining.cz`.

Tento commit je stavová evidence nad dokumentačním mergem fáze 1; Tindeq runtime z PR #12 stále není v produkčním `main`.

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

- `67` klientů celkem / `66` aktivních;
- `1` auth user;
- `0` celkových / `0` aktivních Tindeq sessions;
- migrace `20260802124337 tindeq_sessions` je aplikovaná;
- clean rebuild PR #12 neprovádí žádnou produkční DDL ani změnu produkčních dat.

### Vývojový Supabase `twndqnmrvefhwuwuglju`

- `1` aktivní klient;
- `1` auth user;
- `1` celková / `1` aktivní Tindeq session;
- `tindeq_sessions` stále obsahuje dodatečná pole a `import_fingerprint` z ukončeného PR #15;
- srovnání dev schématu a testovacích dat je samostatná následná fáze.

## Aktuální fáze

Fáze 1 je dokončena. Fáze 2 čistí Git historii PR #12 bez změny schváleného funkčního rozsahu: starý head je zálohován a výsledný ZIP-only stav se skládá jako nový commit přímo na současném `main`.

## Implementováno v `main`

- samostatná Next.js Knee aplikace na `knee.vankotraining.cz`;
- přihlášení, klienti, knee extension měření, výpočty, historie, archivace/obnova a UI polish;
- kanonický project-control systém z PR #14 včetně bezpečných pravidel pro DB změny;
- Tindeq databázová tabulka je aplikovaná v produkční DB, ale Tindeq runtime není v `main`.

## Rozpracováno mimo `main`

PR #12 zachovává jediný podporovaný Tindeq workflow:

`Tindeq ZIP` → lokální validace/rozbalení → normalizovaná `TindeqSession` → kontrolní náhled → explicitní klient → explicitní save → historie → klientský pohled → trenérský detail → `tindeq-report-v1`.

Clean rebuild zachovává parser, persistence, historii, reporty, anonymní read-only demo, auth flow, testy a repo Tindeq migraci/checks. Nezavádí ruční session, Bluetooth/live, klientský inference/autoselect, raw ZIP/timeseries storage ani plánovač.

## Nasazeno

- produkčně nasazeno: pouze aktuální `main` `7e11aa88fb0c14b5216542d4e03101aee082ec17` v deploymentu `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- starý PR #12 head `1c5c5334c5855fc02107cc05e9fe1668a585f2b2` měl READY canonical preview `dpl_CRKmDChVUjP3DoZbwGcWkND7dNm5`, ale po přepisu je pouze historická evidence;
- exact-head preview čistého rebuildu se musí znovu ověřit po přepisu větve.

## Produkčně ověřeno

Clean rebuild PR #12 není produkčně nasazen ani produkčně ověřen. `READY` deployment a automatizované testy se za uživatelské produkční ověření nepovažují.

## Známé problémy

- `TindeqAnalyzer.tsx` je stále příliš velký a odvozuje část vizuálního statusu z českých presentation stringů;
- `TindeqEnvironmentGuard` zatím nekontroluje skutečný Supabase project ref;
- dev Supabase obsahuje PR #15 schema drift a jedno testovací Tindeq data setnutí;
- Tindeq aplikační deduplikace nemá DB unique invariant proti přesně souběžným insertům;
- pracovní větev používá nedeterministické `npm install` a závislosti vyžadují clean-code audit;
- druhý Vercel projekt `vankotraining-knee-mxei` stále představuje paralelní deployment riziko;
- ruční magic-link a reálný ZIP acceptance na bezpečně potvrzeném dev preview ještě nejsou dokončeny.

## Další krok

- Dokončit exact-head CI čistého rebuildu PR #12 a poté přejít do fáze 3: clean-code refactor bez rozšíření funkčního rozsahu.
