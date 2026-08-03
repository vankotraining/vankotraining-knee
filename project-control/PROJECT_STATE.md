# Project state

## Datum kontroly

`2026-08-03` (Europe/Prague)

## Výchozí stav

- `main`: `71d6b1f0e67c571c71a53db6248e526704bddabe`;
- Tindeq runtime: draft PR #12, větev `agent/tindeq-results-site`;
- aktuální práce: draft PR #15, větev `agent/tindeq-client-workflow`, navrstvená nad PR #12;
- produkční aplikace a produkční Supabase nebyly touto prací změněny.

## Schválené zjednodušení PR #15

Původní samostatné šestikrokové workflow bylo nahrazeno přímou akcí u vybraného klienta na hlavní Knee stránce.

Implementováno ve větvi:

- panel `Tindeq záznamy klienta` v hlavní aplikaci;
- akce `Přidat Tindeq záznam` pouze pro právě vybraného klienta;
- lokální import podporovaného Tindeq ZIP;
- volba strany;
- volitelná historická reference, procento maxima a bolest;
- uložení normalizovaného výsledku do `tindeq_sessions`;
- SHA-256 deduplikace;
- historie Tindeq přímo u klienta;
- odstranění samostatné trasy `/tindeq/workflow` a duplicitního vytváření klienta, antropometrie, maxima a předpisu;
- obecná `/tindeq` ponechána jako sekundární analyzátor.

## Databáze

Produkční Supabase zůstává beze změny.

Bezplatný testovací projekt:

- název `vankotraining-knee-dev`;
- project ref `twndqnmrvefhwuwuglju`;
- aplikována migrace `simplify_tindeq_client_records`;
- odstraněna nadbytečná tabulka `tindeq_prescriptions` a její vazby;
- ověřeny tři režimy uložení: bez reference, s referencí bez procenta a s referencí/procentem/cílem;
- acceptance data byla po testu vrácena rollbackem, tabulka sessions zůstala prázdná.

## Stavové pojmy

- **implementováno ve větvi**: změna je v `agent/tindeq-client-workflow`;
- **automatizovaně otestováno**: až po úspěšném exact-head GitHub Actions runu;
- **databáze aplikována v dev**: migrace a RLS jsou ověřeny pouze v `twndqnmrvefhwuwuglju`;
- **preview nasazeno**: pouze READY Vercel preview přesného head commitu;
- **produkčně nasazeno**: pouze production deployment daného commitu;
- **produkčně ověřeno**: pouze po výslovné uživatelské kontrole.

## Další krok

Dokončit exact-head CI a následně provést autentizovaný import skutečného ZIP na preview připojeném k bezplatnému dev Supabase. Merge ani produkční migrace nejsou součástí tohoto kroku.
