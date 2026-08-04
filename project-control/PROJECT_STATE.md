# Project state

## Datum poslední kontroly

`2026-08-04 10:04 CEST` (Europe/Prague).

## Aktuální `main` commit

`71d6b1f0e67c571c71a53db6248e526704bddabe` – `Record UI polish v2 deployment evidence`.

## Aktivní větev a PR

- feature větev `agent/tindeq-results-site`, draft PR `#12` – `Tindeq: klienti, historie a kanonické reporty`, head `9eb970254a2ad954cae179f82bee54a55af7e5f5`;
- project-control větev `agent/project-control-sources-of-truth`, draft PR `#14` – `Zavést kanonické zdroje pravdy projektu`;
- PR `#15` (`agent/tindeq-client-workflow`) byl `2026-08-04` uzavřen bez merge a jeho přímý klientský Tindeq workflow není podporovaný směr.

PR #12 ani PR #14 nejsou součástí `main`.

## Produkční runtime commit

`71d6b1f0e67c571c71a53db6248e526704bddabe`, deployment `dpl_2eJCprpgEdSqiiQ8qJwoFLfQzV6Q`. Podrobnosti jsou v [`PRODUCTION_STATUS.md`](./PRODUCTION_STATUS.md).

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

- databáze aplikována: migrace `20260802124337 tindeq_sessions`;
- PostgreSQL `17.6`;
- `public.tindeq_sessions` existuje, má zapnuté RLS a při kontrole `0` celkových i aktivních řádků;
- `public.athletes` má `66` aktivních klientů;
- produkční tabulka obsahuje původní normalizované Tindeq sloupce, auditní metadata a soft delete;
- SQL soubor `supabase/migrations/20260802_tindeq_sessions.sql` je v PR #12, nikoli v aktuálním `main`;
- sdílená databáze obsahuje také migrace tréninkové aplikace; nejde o samostatný Knee Supabase projekt.

### Vývojový Supabase `twndqnmrvefhwuwuglju`

- migrace: `20260803183144 bootstrap_knee_tindeq_dev`, `20260803183300 harden_knee_helper_functions`, `20260803205810 simplify_tindeq_client_records`;
- PostgreSQL `17.6`, RLS na `tindeq_sessions` je zapnuté;
- `0` aktivních klientů, `0` auth uživatelů a `0` Tindeq řádků;
- schéma obsahuje dodatečné sloupce a fingerprint index z ukončeného PR #15;
- dev databáze není připravena pro ruční acceptance PR #12, dokud nebude cíleně srovnána se schváleným ZIP-only rozsahem.

## Aktuální fáze

Produkční Knee MVP je v provozní stabilizaci. ZIP-only Tindeq ukládání, historie a reporty jsou implementovány ve větvi PR #12, automatizovaně otestovány a nasazeny na exact-head preview, ale zůstávají mimo `main` a bez dokončené ruční acceptance. Systém zdrojů pravdy je implementován ve větvi PR #14, zatím mimo `main`.

## Implementováno v `main`

- samostatná Next.js Knee aplikace na `knee.vankotraining.cz`;
- Supabase magic-link přihlášení a interní klientské workflow;
- klienti, profily a knee extension měření;
- výpočty síly, Nm/kg, asymetrie, splnění normy a změny proti předchozímu měření;
- soft delete a obnova klientů i knee extension měření;
- exportní a provozní dokumentace;
- UI polish v2 a automatizované výpočetní testy.

## Rozpracováno mimo `main`

PR #12 na `agent/tindeq-results-site` obsahuje zejména:

- chráněný modul `/tindeq` s jediným podporovaným vstupem skutečných dat přes Tindeq ZIP;
- lokální analýzu ZIP v prohlížeči bez ukládání původního ZIPu nebo raw časové řady;
- kontrolní náhled a explicitní výběr klienta bez automatického přiřazování;
- explicitní uložení normalizovaného výsledku, aplikační deduplikaci a transparentní retry;
- historii uložených výsledků, klientský a trenérský pohled;
- kanonický report `tindeq-report-v1` a anonymní syntetické demo;
- testy parseru, persistence, reportu, auth toku a Playwright scénáře;
- repo migraci a kontroly pro `tindeq_sessions`.

Exact head `9eb970254a2ad954cae179f82bee54a55af7e5f5` je automatizovaně otestován workflow runem `30888164016` se závěrem `success`: `76/76` unit testů, build PASS, bez nové lint regrese proti `main`, `git diff --check` PASS a `10/10` Playwright testů.

PR #14 obsahuje pouze projektovou dokumentaci, PR template, kontrolní skript, npm příkaz a CI workflow. Nemění runtime aplikace, Supabase ani Vercel konfiguraci.

## Nasazeno

- produkčně nasazeno: `main` commit `71d6b1f0e67c571c71a53db6248e526704bddabe` v deploymentu `dpl_2eJCprpgEdSqiiQ8qJwoFLfQzV6Q`;
- preview nasazeno: exact head PR #12 `9eb970254a2ad954cae179f82bee54a55af7e5f5` v deploymentu `dpl_5Zbh43s6Ccf4yiE9MSsLbkTr7fUP`, stav `READY`, pouze branch alias bez produkčního targetu;
- Vercel metadata potvrzují větev a commit preview, ale dostupný connector nepotvrzuje hodnotu runtime Supabase environment variable.

## Produkčně ověřeno

- poslední výslovné uživatelské produkční ověření v repozitáři je z `2026-07-30` a vztahuje se pouze k mobilnímu zobrazení splnění normy na implementačním commitu `1de66ddf343c5f0b58a748f0c2c45cca0af51c73`;
- UI polish v2, současný produkční runtime jako celek ani Tindeq PR #12 nejsou doloženy jako produkčně ověřené;
- `READY` deployment se za produkční ověření nepovažuje.

## Známé problémy

- kanonické zdroje pravdy z PR #14 dosud nejsou v `main`;
- aplikovaná Tindeq migrace je v produkční databázi, ale její repo soubor zatím není v `main`;
- exact-head preview PR #12 je nasazeno, ale není nezávisle potvrzeno, že používá dev Supabase místo produkce;
- dev Supabase obsahuje pozůstatky uzavřeného PR #15 a není acceptance-ready pro ZIP-only PR #12;
- bez databázového unique constraintu zůstává teoretický souběžný race při aplikační deduplikaci stejného Tindeq importu;
- reálný doručený magic link, návrat na stejný preview hostname a zápis skutečného ZIPu nebyly pro aktuální head ručně ověřeny;
- historické checkpointy si odporují ve fázi, procentech dokončení a významu slova „hotovo“;
- úplný mapping historických manuálně aplikovaných Knee SQL změn na repo artefakty není doložen.

## Další krok

- Po úspěšném exact-head CI provést review a sloučit draft PR #14 do `main`, aby byly kanonické zdroje pravdy dostupné všem dalším pracovním chatům.
