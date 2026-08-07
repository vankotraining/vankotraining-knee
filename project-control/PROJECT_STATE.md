# Project state

## Datum poslední kontroly

`2026-08-07 12:25 CEST` (Europe/Prague).

## Aktuální `main` commit

`71d6b1f0e67c571c71a53db6248e526704bddabe` – `Record UI polish v2 deployment evidence`.

## Aktivní větev a PR

- feature větev `agent/tindeq-results-site`, draft PR `#12` – `Tindeq: klienti, historie a kanonické reporty`, aktuální head při kontrole `1c5c5334c5855fc02107cc05e9fe1668a585f2b2`;
- project-control větev `agent/project-control-sources-of-truth`, draft PR `#14` – `Zavést kanonické zdroje pravdy projektu`; tento dokument je součástí jeho průběžně aktualizovaného headu;
- PR `#15` (`agent/tindeq-client-workflow`) je uzavřen bez merge a jeho paralelní klientský Tindeq workflow není podporovaný směr.

PR #12 ani PR #14 nejsou v okamžiku této kontroly součástí `main`.

## Produkční runtime commit

`71d6b1f0e67c571c71a53db6248e526704bddabe`, deployment `dpl_2eJCprpgEdSqiiQ8qJwoFLfQzV6Q`. Podrobnosti jsou v [`PRODUCTION_STATUS.md`](./PRODUCTION_STATUS.md).

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

- projekt je `ACTIVE_HEALTHY`, PostgreSQL `17.6`;
- databáze aplikována: migrace `20260802124337 tindeq_sessions`;
- `public.tindeq_sessions`: `0` celkových / `0` aktivních řádků;
- `public.athletes`: `67` celkem / `66` aktivních klientů;
- `auth.users`: `1`;
- RLS na `public.tindeq_sessions` je zapnuté;
- produkční `tindeq_sessions` neobsahuje dodatečné PR #15 sloupce ani fingerprint unique index;
- repo soubor Tindeq migrace je stále v PR #12, nikoli v aktuálním `main`;
- sdílená databáze obsahuje také migrace a objekty jiných částí ekosystému.

Produkční security advisor má pre-existující projektové nálezy mimo rozsah PR #14, včetně tří `SECURITY DEFINER` views na úrovni `ERROR` a dalších warningů kolem funkcí/RLS. PR #14 je pouze dokumentuje; databázi nemění.

### Vývojový Supabase `twndqnmrvefhwuwuglju`

- projekt je `ACTIVE_HEALTHY`, PostgreSQL `17.6`;
- migrace: `20260803183144 bootstrap_knee_tindeq_dev`, `20260803183300 harden_knee_helper_functions`, `20260803205810 simplify_tindeq_client_records`;
- `1` auth uživatel, `1` aktivní klient a `1` aktivní Tindeq session;
- `tindeq_sessions` stále obsahuje dodatečné PR #15 sloupce a `tindeq_sessions_active_import_fingerprint_uidx`;
- současná testovací/acceptance data nebyla po předchozím testu odstraněna;
- dev databáze proto není čistě srovnaná s kanonickým ZIP-only rozsahem PR #12.

## Aktuální fáze

Probíhá konsolidace projektu před dalším produktovým vývojem. První gate je zavedení kanonických zdrojů pravdy přes PR #14. Tindeq PR #12 zůstává draft a před merge musí být přestavěn na čistém `main`, refaktorován a projít environment/database acceptance gates.

## Implementováno v `main`

- samostatná Next.js Knee aplikace na `knee.vankotraining.cz`;
- Supabase magic-link přihlášení a interní klientské workflow;
- klienti, profily a knee extension měření;
- výpočty síly, Nm/kg, asymetrie, splnění normy a změny proti předchozímu měření;
- soft delete a obnova klientů i knee extension měření;
- exportní a provozní dokumentace;
- UI polish v2 a automatizované výpočetní testy.

## Rozpracováno mimo `main`

PR #12 na `agent/tindeq-results-site` obsahuje ZIP-only Tindeq import, normalizaci, persistence, historii, klientský/trenérský pohled, reporty a testy. Aktuální branch je proti `main` stále divergentní: `115` commitů ahead a `11` behind; merge-base je `a20a6157330f46e3396e2ef1a2e7206c82835965`.

Exact head PR #12 `1c5c5334c5855fc02107cc05e9fe1668a585f2b2` má workflow run `31168986400` se závěrem `success`:

- `77/77` unit testů PASS;
- build a TypeScript PASS;
- `10/10` Playwright PASS;
- `git diff --check` PASS;
- lint zůstává na baseline `3 errors + 1 warning` stejně jako aktuální `main`;
- `project:check` na PR #12 zatím není definován.

Clean-code audit PR #12 zůstává otevřený: `TindeqAnalyzer.tsx` je velká víceúčelová komponenta, prezentační tone se stále odvozuje z textových `includes(...)`, CSS je monolitické a `fflate` je stále v `devDependencies`.

PR #14 obsahuje pouze dokumentaci, PR template, `package.json` skript, kontrolní skript a CI workflow. Nemění `src/**`, databázové migrace ani Vercel konfiguraci. Jeho merge gate je úspěšný `npm run project:check` na přesném aktuálním head commitu.

## Nasazeno

- produkčně nasazeno: `main` commit `71d6b1f0e67c571c71a53db6248e526704bddabe` v deploymentu `dpl_2eJCprpgEdSqiiQ8qJwoFLfQzV6Q`, stav `READY`;
- exact-head preview PR #12: `dpl_CRKmDChVUjP3DoZbwGcWkND7dNm5`, commit `1c5c5334c5855fc02107cc05e9fe1668a585f2b2`, stav `READY`, kanonický projekt `vankotraining-knee`;
- stejné PR #12 je současně automaticky nasazováno i do nekánonického projektu `vankotraining-knee-mxei` (`prj_6VTh3ivPiUo7soBtzR5Snrrtr9KW`), aktuální exact-head deployment `dpl_FLCYdeL8iHx7s4Sj2w9N2ACZZ2Mk`;
- dostupné deployment metadata nepotvrzují hodnotu runtime Supabase URL preview; zápisová acceptance proto není uzavřena.

## Produkčně ověřeno

- poslední výslovné uživatelské produkční ověření doložené v repozitáři je z `2026-07-30` a týká se mobilního zobrazení splnění normy na implementačním commitu `1de66ddf343c5f0b58a748f0c2c45cca0af51c73`;
- UI polish v2, současný produkční runtime jako celek ani Tindeq PR #12 nejsou označeny jako produkčně ověřené;
- `READY` deployment se za produkční ověření nepovažuje.

## Známé problémy

- kanonické zdroje pravdy z PR #14 ještě nejsou v `main`;
- aplikovaná Tindeq migrace je v produkční databázi, ale její repo soubor zatím není v `main`;
- PR #12 má dlouhou divergentní historii a musí být bezpečně přestavěn na čistém aktuálním `main`;
- exact-head preview PR #12 nemá nezávisle doložený dev Supabase project ref;
- dev Supabase obsahuje PR #15 schema drift i zbylá acceptance data;
- současný environment guard kontroluje hostname/route, nikoli kombinaci Vercel environment ↔ Supabase project ref;
- bez databázového unique constraintu zůstává teoretický souběžný race při aplikační deduplikaci stejného Tindeq importu;
- druhý Vercel projekt stále automaticky nasazuje stejné branche;
- produkční shared Supabase má pre-existující security/performance advisor nálezy, které vyžadují samostatný rozsah;
- úplný mapping historických manuálně aplikovaných Knee SQL změn na repo artefakty není doložen.

## Další krok

- Dokončit exact-head review a CI PR #14 a bezpečně jej sloučit do `main`; teprve poté přestavět historii PR #12 na novém `main`.
