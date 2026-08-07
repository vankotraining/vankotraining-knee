# Project state

## Datum poslední kontroly

`2026-08-07 21:07 CEST` (Europe/Prague).

## Aktuální `main` commit

`7e11aa88fb0c14b5216542d4e03101aee082ec17` – `Record project-control phase 1 completion`.

PR #12 zůstává založený přímo na tomto `main`.

Tento soubor eviduje kanonický stav projektu, ale nemůže autoritativně obsahovat vlastní budoucí commit SHA. Přesný živý head PR, CI a Vercel deployment se před další změnou vždy znovu resolve přes GitHub/Vercel.

## Aktivní větev a PR

- větev: `agent/tindeq-results-site`;
- draft PR: `#12`;
- PR je otevřený, ne-merged a při poslední kontrole mergeable;
- bezpečná záloha původního experimentálního headu: `backup/tindeq-results-site-2026-08-07-1c5c5334`;
- phase-3 exact head: `e73730c55f7b2e56f638acf380736deaed628df5`;
- phase-4 exact head: `d67a89765b59b0f5ca8db4268cf543beac6082b7`;
- phase-5 exact head: `f3b4dcc5c5904a2560e765deb34986ee716b8387`;
- phase-6 verification head před tímto synchronizačním commitem: `2f1c6c0c127b35020f32da97a886111648a46342`;
- PR #14 je merged; PR #15 je uzavřen bez merge.

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

Fresh read-only kontrola `2026-08-07`:

- `67` klientů / `66` aktivních;
- `0` Tindeq sessions / `0` aktivních;
- phase-5 index `tindeq_sessions_active_source_session_uidx`: neexistuje;
- phase-5 constraint `tindeq_sessions_source_session_id_valid`: neexistuje;
- phase-5 dedupe migrace není na produkci aplikovaná;
- žádná produkční DDL ani datová mutace nebyla při fázích 5–6 provedena.

### Vývojový Supabase `twndqnmrvefhwuwuglju`

Na dev je aplikována migrace:

`20260807170014 tindeq_active_session_unique`.

Ověřený stav:

- validated constraint `tindeq_sessions_source_session_id_valid` vyžaduje `^[0-9a-f]{20}$`;
- partial unique expression index `tindeq_sessions_active_source_session_uidx` vynucuje jednu aktivní identitu `(athlete_id, analysis_version, tindeqSessionId)`;
- `WHERE deleted_at IS NULL` zachovává soft-delete/reimport semantiku;
- `1` Tindeq session / `1` aktivní;
- `0` neplatných source session ID;
- `0` aktivních duplicate groups;
- duplicate enforcement probe → očekávaný `unique_violation`;
- invalid-ID enforcement probe → očekávaný `check_violation`.

Repo artefakty:

- `supabase/migrations/20260807_tindeq_active_session_unique.sql`;
- `supabase/checks/20260807_tindeq_active_session_unique_precheck.sql`;
- `supabase/checks/20260807_tindeq_active_session_unique_checks.sql`.

## Aktuální fáze

**Fáze 6 – Vercel konsolidace je dokončena a deploymentem ověřena.**

Kanonický Vercel projekt je `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`) a jako jediný vlastní `knee.vankotraining.cz`.

Duplicitní projekt `vankotraining-knee-mxei` (`prj_6VTh3ivPiUo7soBtzR5Snrrtr9KW`) zůstává zachovaný, ale jeho GitHub repository bylo po explicitním schválení uživatele odpojeno.

Kontrolní commit fáze 6:

`2f1c6c0c127b35020f32da97a886111648a46342` – `Verify Vercel project consolidation`.

Důkaz konsolidace:

- canonical `vankotraining-knee` vytvořil pro tento SHA preview `dpl_7PZGdzPyBv9NAc8PJr7fqS2Y7XD4`, stav `READY`;
- duplicate `vankotraining-knee-mxei` nevytvořil pro tento SHA žádný nový deployment;
- jeho poslední deployment zůstal historický `dpl_EfraCnckKVRUHCRuufkaHPHdLZmC` pro starší SHA `f3b4dcc5...`;
- produkční doména zůstala na kanonickém projektu a produkční stránka prošla read-only HTTP smoke `200 OK`.

Exact-head CI pro `2f1c6c0c127b35020f32da97a886111648a46342`:

- `Project control`, run `31205341531`: `success`;
- `Verify Tindeq client view`, run `31205341537`: `success`;
- unit test krok: PASS;
- lint baseline comparison: PASS;
- build: PASS;
- project-control check: PASS;
- diff check: PASS;
- Chromium install: PASS;
- browser/Playwright verification: PASS;
- screenshot upload: PASS.

Fáze 6 je tedy uzavřená. Projekt je připraven pro fázi 7.

## Implementováno v `main`

- samostatná Next.js Knee aplikace na `knee.vankotraining.cz`;
- přihlášení, klienti, knee extension měření, výpočty, historie, archivace/obnova a UI polish;
- kanonický project-control systém;
- produkční `public.tindeq_sessions` tabulka z původní migrace;
- Tindeq runtime z PR #12 stále není v `main`.

## Rozpracováno mimo `main`

PR #12 zachovává jediný podporovaný tok:

`Tindeq ZIP` → lokální validace/rozbalení → normalizovaná `TindeqSession` → náhled → explicitní klient → explicitní save → historie → klientský/trenérský výstup → `tindeq-report-v1`.

Fáze 3 oddělila prezentační odpovědnosti, fáze 4 srovnala dev DB a zavedla DB-aware environment guard, fáze 5 přidala atomický DB dedupe invariant + race recovery a fáze 6 odstranila paralelní Git auto-deployment cestu ve Vercelu.

## Nasazeno

- produkčně: pouze `main` `7e11aa88fb0c14b5216542d4e03101aee082ec17` v `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- phase-6 preview před tímto synchronizačním commitem: `dpl_7PZGdzPyBv9NAc8PJr7fqS2Y7XD4` pro `2f1c6c0c127b35020f32da97a886111648a46342`;
- phase-5 DB invariant je aplikovaný pouze v dev Supabase `twndqnmrvefhwuwuglju`, nikoli v produkci;
- duplicitní Vercel projekt je zachovaný, ale Git je odpojen.

## Produkčně ověřeno

Tindeq změny z PR #12 nejsou produkčně nasazené ani produkčně ověřené. READY preview, dev DB verification ani automatizované testy se za produkční ověření nepovažují.

## Známé problémy / otevřené gates

- Vercel Preview `NEXT_PUBLIC_SUPABASE_URL` není nezávisle read-only potvrzená, takže write acceptance zůstává blokovaná;
- repo nemá autentický npm lockfile a CI používá `npm install`;
- reálný magic-link a skutečný ZIP acceptance ještě nejsou dokončeny;
- phase-5 produkční dedupe migrace je připravena, ale není aplikována; produkční DDL vyžaduje fresh pre-check, backup/rollback gate a samostatné explicitní schválení;
- existující lint baseline v `main` je `3 errors + 1 warning` mimo Tindeq soubory.

## Další krok

- **Fáze 7:** provést exact-head acceptance na aktuálním PR headu, vyřešit nezávislé potvrzení Preview Supabase ref, otestovat reálný magic-link a skutečný Tindeq ZIP a uzavřít zbývající merge gates bez produkčního zápisu nebo produkční DDL bez samostatného schválení.
