# Project state

## Datum poslední kontroly

`2026-08-03` (Europe/Prague)

## Aktuální `main` commit

`71d6b1f0e67c571c71a53db6248e526704bddabe` – `Record UI polish v2 deployment evidence`.

## Aktivní větev a PR

- feature větev `agent/tindeq-results-site`, draft PR `#12` – `Tindeq: klienti, historie a kanonické reporty`, head `e368500e8c138930d675e9336d4a02dd70e4c3a8`;
- project-control větev `agent/project-control-sources-of-truth`, draft PR `#14` – `Zavést kanonické zdroje pravdy projektu`;
- oba PR mají base `main` na `71d6b1f0e67c571c71a53db6248e526704bddabe`.

PR #12 ani PR #14 nejsou součástí `main`.

## Produkční runtime commit

`71d6b1f0e67c571c71a53db6248e526704bddabe`, deployment `dpl_2eJCprpgEdSqiiQ8qJwoFLfQzV6Q`. Podrobnosti jsou v [`PRODUCTION_STATUS.md`](./PRODUCTION_STATUS.md).

## Stav databázových migrací

- databáze aplikována: v Supabase projektu `zxvndqicslyulrinbpyn` je migrace `20260802124337 tindeq_sessions`;
- skutečné schéma obsahuje `public.tindeq_sessions`, RLS a soft-delete metadata;
- tabulka má při kontrole `0` řádků;
- SQL soubor `supabase/migrations/20260802_tindeq_sessions.sql` je pouze v PR #12, nikoli v aktuálním `main`;
- sdílená databáze obsahuje také migrace tréninkové aplikace; nejde o samostatný Knee Supabase projekt.

## Aktuální fáze

Produkční Knee MVP je v provozní stabilizaci. Tindeq ukládání, historie a reporty jsou implementovány ve větvi PR #12, zatím mimo `main`. Systém zdrojů pravdy je implementován ve větvi PR #14, zatím mimo `main`.

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

- chráněný modul `/tindeq`;
- lokální analýzu ZIP v prohlížeči;
- explicitní uložení normalizovaného výsledku ke klientovi;
- historii uložených výsledků;
- kanonický report a anonymní syntetické demo;
- testy persistence, reportu, auth toku a Playwright scénáře;
- repo migraci a kontroly pro `tindeq_sessions`.

Head `e368500e8c138930d675e9336d4a02dd70e4c3a8` je automatizovaně otestován workflow runem `30762622830` se závěrem `success`.

PR #14 obsahuje pouze projektovou dokumentaci, PR template, kontrolní skript, npm příkaz a CI workflow. Nemění runtime aplikace, Supabase ani Vercel konfiguraci.

## Nasazeno

- produkčně nasazeno: `main` commit `71d6b1f0e67c571c71a53db6248e526704bddabe`;
- poslední zjištěné READY preview PR #12: deployment `dpl_DXVMT6NaVPgsHB9DC8EtVVipYvWR`, commit `743efaf9dfa0872566e545fb78cd18004c2da6e2`;
- aktuální head PR #12 `e368500e8c138930d675e9336d4a02dd70e4c3a8` nemá při kontrole doložené exact-commit preview.

## Produkčně ověřeno

- poslední výslovné uživatelské produkční ověření v repozitáři je z `2026-07-30` a vztahuje se pouze k mobilnímu zobrazení splnění normy na implementačním commitu `1de66ddf343c5f0b58a748f0c2c45cca0af51c73`;
- UI polish v2, V2-01 jako celek ani Tindeq PR #12 nejsou doloženy jako produkčně ověřené;
- `READY` deployment se za produkční ověření nepovažuje.

## Známé problémy

- historické checkpointy si odporují ve fázi, procentech dokončení a významu „hotovo“;
- starý deploy checklist uvádí Supabase variantu jako nerozhodnutou, ale skutečný stav je sdílený projekt;
- UI polish dokument uvádí implementační deployment `f6c3715…`, zatímco současný produkční alias běží na pozdějším dokumentačním commitu `71d6b1f…`;
- aplikovaná Tindeq migrace je v produkční databázi, ale její repo soubor zatím není v `main`;
- PR #12 body a část feature evidence obsahují starší commitové údaje než aktuální head;
- dnešní smoke test byl pouze nepřihlášený HTTP test; autentizované produkční workflow nebylo znovu provedeno.

## Další krok

- Provést review a sloučit draft PR #14 do `main`; potom rebasovat PR #12 a vyžádat exact-head preview.
