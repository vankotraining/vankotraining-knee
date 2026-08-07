# Project state

## Datum poslední kontroly

`2026-08-07 20:02 CEST` (Europe/Prague).

## Aktuální `main` commit

`7e11aa88fb0c14b5216542d4e03101aee082ec17` – `Record project-control phase 1 completion`.

Před kontrolním commitem fáze 6 byl živě ověřen aktuální `main`; PR #12 zůstává založený přímo na tomto commitu.

Tento soubor je stavová evidence zapisovaná následným commitem. Nemůže autoritativně obsahovat vlastní výsledný SHA ani budoucí Vercel deployment; exact-head SHA, CI a deployment evidence se vedou v popisu PR #12 a před další změnou se znovu resolve přes GitHub/Vercel.

## Aktivní větev a PR

- `agent/tindeq-results-site`, draft PR `#12`;
- PR je otevřený a při poslední kontrole mergeable;
- fáze 2 clean rebuild je dokončena;
- bezpečná záloha původního experimentálního headu: `backup/tindeq-results-site-2026-08-07-1c5c5334`;
- phase-3 clean-code exact head: `e73730c55f7b2e56f638acf380736deaed628df5`;
- phase-4 exact head: `d67a89765b59b0f5ca8db4268cf543beac6082b7`;
- phase-5 final exact head: `f3b4dcc5c5904a2560e765deb34986ee716b8387`;
- PR #14 je merged; PR #15 je uzavřen bez merge.

## Produkční runtime commit

Produkční alias `knee.vankotraining.cz` před phase-6 kontrolním commitem zůstává:

- Vercel projekt `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`);
- deployment `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- stav `READY`, target `production`;
- commit `7e11aa88fb0c14b5216542d4e03101aee082ec17`.

Tindeq runtime z PR #12 tedy stále není v produkčním `main`.

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

Fresh read-only phase-5 audit:

- PostgreSQL `17.6`;
- `0` Tindeq sessions / `0` aktivních;
- `0` řádků s chybějícím nebo neplatným `raw_metadata.tindeqSessionId`;
- `0` aktivních duplicate groups pro `(athlete_id, analysis_version, tindeqSessionId)`;
- migration history stále končí `20260802124337 tindeq_sessions`.

Phase-5 unique invariant **není na produkci aplikovaný**. Nebyla provedena žádná produkční DDL ani datová mutace.

### Vývojový Supabase `twndqnmrvefhwuwuglju`

Na dev je aplikována verzovaná migrace:

`20260807170014 tindeq_active_session_unique`.

Repo artefakty:

- `supabase/migrations/20260807_tindeq_active_session_unique.sql`;
- `supabase/checks/20260807_tindeq_active_session_unique_precheck.sql`;
- `supabase/checks/20260807_tindeq_active_session_unique_checks.sql`.

Ověřený dev stav po migraci:

- validated constraint `tindeq_sessions_source_session_id_valid` vyžaduje `^[0-9a-f]{20}$`;
- unique partial expression index `tindeq_sessions_active_source_session_uidx` vynucuje jednu aktivní identitu `(athlete_id, analysis_version, tindeqSessionId)`;
- `WHERE deleted_at IS NULL` zachovává soft-delete/reimport semantiku;
- `1` Tindeq session / `1` aktivní;
- `0` neplatných source session ID;
- `0` aktivních duplicate groups;
- duplicate enforcement probe skončil očekávaným `unique_violation`;
- invalid-ID enforcement probe skončil očekávaným `check_violation`.

## Aktuální fáze

**Fáze 6 – konsolidace Vercel projektů.**

Kanonický Vercel projekt je `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`) a jako jediný vlastní `knee.vankotraining.cz`.

Duplicitní projekt `vankotraining-knee-mxei` (`prj_6VTh3ivPiUo7soBtzR5Snrrtr9KW`) měl před konsolidací GitHub repo `vankotraining/vankotraining-knee` připojené paralelně a vytvářel deploymenty pro stejné branche a SHA.

Uživatel dne 2026-08-07 výslovně schválil pouze odpojení Git integrace od duplicitního projektu, nikoli smazání projektu, a následně potvrdil provedení `Disconnect` ve Vercel Settings → Git pro `vankotraining-knee-mxei`.

Bezprostředně před tímto kontrolním commitem byl ověřen baseline:

- kanonický poslední preview: `dpl_5xcgbZhCgG5GdKiaYrTaL4GnYzwn`, SHA `f3b4dcc5c5904a2560e765deb34986ee716b8387`;
- duplicitní poslední preview: `dpl_EfraCnckKVRUHCRuufkaHPHdLZmC`, stejné SHA `f3b4dcc5c5904a2560e765deb34986ee716b8387`;
- po uživatelském odpojení a před tímto commitem nevznikl v žádném projektu novější deployment.

Tento stavový commit je záměrně verifikační trigger. Fáze 6 je technicky uzavřena teprve po read-only Vercel kontrole, která doloží nový deployment tohoto SHA v kanonickém projektu a současně žádný odpovídající nový deployment v `vankotraining-knee-mxei`. Exact evidence se zapíše do PR #12 bez dalšího Git commitu.

Duplicitní projekt se v této fázi **nemaže**.

## Implementováno v `main`

- samostatná Next.js Knee aplikace na `knee.vankotraining.cz`;
- přihlášení, klienti, knee extension měření, výpočty, historie, archivace/obnova a UI polish;
- kanonický project-control systém;
- produkční Tindeq tabulka z původní migrace, ale Tindeq runtime PR #12 není v `main`.

## Rozpracováno mimo `main`

PR #12 zachovává jediný podporovaný tok:

`Tindeq ZIP` → lokální validace/rozbalení → normalizovaná `TindeqSession` → náhled → explicitní klient → explicitní save → historie → klientský/trenérský výstup → `tindeq-report-v1`.

Fáze 3 oddělila prezentační odpovědnosti, fáze 4 srovnala dev DB a zavedla DB-aware environment guard, fáze 5 přidala atomický DB dedupe invariant + race recovery a fáze 6 konsoliduje Vercel Git deployment cestu na jediný kanonický projekt.

Repo stále nemá autentický npm lockfile; deterministická instalace zůstává merge-gate dluhem.

## Nasazeno

- produkčně je nadále nasazen pouze `main` `7e11aa88fb0c14b5216542d4e03101aee082ec17` v deploymentu `dpl_J1ECuULAhWHXHnZvpmJgFMFEbzd1`;
- phase-5 exact-head preview `dpl_5xcgbZhCgG5GdKiaYrTaL4GnYzwn` odpovídá `f3b4dcc5c5904a2560e765deb34986ee716b8387`;
- historický poslední paralelní preview duplicitního projektu před odpojením je `dpl_EfraCnckKVRUHCRuufkaHPHdLZmC`, stejné SHA `f3b4dcc5c5904a2560e765deb34986ee716b8387`;
- phase-5 DB invariant je databázově aplikovaný pouze v dev Supabase `twndqnmrvefhwuwuglju`, nikoli v produkci.

## Produkčně ověřeno

Tindeq změny z PR #12 nejsou produkčně nasazené ani produkčně ověřené. Dev DB aplikace, READY preview ani automatizované testy se za produkční ověření nepovažují.

## Známé problémy / otevřené gates

- phase-6 Git disconnect je uživatelsky provedený, ale tento kontrolní commit ještě musí doložit, že nový Git deployment vzniká pouze v kanonickém Vercel projektu;
- phase-5 produkční dedupe migrace je připravena, ale není aplikována; před případnou produkční DDL je nutný fresh pre-check, backup/rollback gate a samostatné explicitní schválení uživatele;
- Vercel Preview `NEXT_PUBLIC_SUPABASE_URL` není nezávisle read-only potvrzená, takže write acceptance zůstává blokovaná;
- repo nemá npm lockfile a CI používá `npm install`;
- reálný magic-link a skutečný ZIP acceptance ještě nejsou dokončeny;
- existující lint baseline v `main` je `3 errors + 1 warning` mimo Tindeq soubory.

## Další krok

- Ověřit tento phase-6 kontrolní commit ve Vercelu: nový deployment musí vzniknout pouze v `vankotraining-knee`, zatímco `vankotraining-knee-mxei` musí zůstat bez deploymentu tohoto SHA; výsledek zapsat do PR #12 bez dalšího commitu.
