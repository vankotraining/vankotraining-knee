# Project state

## Datum kontroly

`2026-08-04` (Europe/Prague)

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

## Databáze a preview

Produkční Supabase zůstává beze změny.

Bezplatný testovací projekt:

- název `vankotraining-knee-dev`;
- project ref `twndqnmrvefhwuwuglju`;
- aplikována migrace `simplify_tindeq_client_records`;
- odstraněna nadbytečná tabulka `tindeq_prescriptions` a její vazby;
- ověřeny tři režimy uložení: bez reference, s referencí bez procenta a s referencí/procentem/cílem;
- stabilní preview alias větve `agent/tindeq-client-workflow` používá tento dev projekt; produkční hostname používá produkční Supabase.

## Autentizovaný live acceptance

Dne `2026-08-04` proběhl jednorázový automatizovaný tok nad dev Supabase a skutečným UI:

1. přihlášení krátkodobého testovacího uživatele přes Supabase Auth;
2. načtení syntetického klienta přes RLS;
3. otevření akce `Přidat Tindeq záznam`;
4. lokální parsování syntetického validního ZIP `info.csv + data_set_1.csv`;
5. uložení levé strany proti historické referenci `50 kg` při `70 %` cíli;
6. uložení bolesti `0 / 2 / 1`;
7. autentizované načtení uloženého řádku přes RLS;
8. reload stránky a znovuotevření historie klienta.

Důkaz:

- acceptance commit `2ab818be45d2efc880e6e90438d50a84b203434a`;
- GitHub Actions run `30877791921`: `success`;
- běžné unit testy `90/90`;
- běžné Playwright testy `9/9`;
- production build a TypeScript: prošlo;
- live authenticated acceptance: prošlo;
- uložený snapshot: reference `50 kg`, předpis `70 %`, cíl `35 kg`, průměr `33,63 kg`, bolest `0 / 2 / 1`.

Po ověření byl jednorázový test odstraněn a syntetický klient, maximum, session i testovací Auth účet byly z dev projektu smazány. Kontrolní počty všech těchto položek jsou `0`.

## Stavové pojmy

- **implementováno ve větvi**: změna je v `agent/tindeq-client-workflow`;
- **automatizovaně otestováno**: exact-head GitHub Actions run je úspěšný;
- **databáze aplikována v dev**: migrace a RLS jsou ověřeny pouze v `twndqnmrvefhwuwuglju`;
- **autentizovaně ověřeno v dev**: import, zápis přes RLS a historie po reloadu prošly nad syntetickými daty;
- **preview nasazeno**: pouze READY Vercel preview přesného head commitu;
- **produkčně nasazeno**: pouze production deployment daného commitu;
- **produkčně ověřeno**: pouze po výslovné uživatelské kontrole produkčního toku.

## Další krok

Po úspěšném finálním exact-head CI rozhodnout o merge stacked PR #15 a samostatně naplánovat produkční migraci. Produkční změna není součástí tohoto acceptance kroku.
