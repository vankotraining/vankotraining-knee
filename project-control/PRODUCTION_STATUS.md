# Production status

## Datum poslední kontroly

`2026-08-08` (Europe/Prague).

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Aktuální produkční deployment:

`dpl_u4WK75HN4j27Jtpxh4VnQvPb6jWd`.

## Nasazený commit

`8afe1328cfcb8f7ab90bb449775d1de0d441b584` z větve `main` — merge PR #12 `Tindeq: klienti, historie a kanonické reporty`.

Draft PR #16 `agent/tindeq-metric-statuses` v tomto produkčním deploymentu není.

## Čas a výsledek deploymentu

Deployment `dpl_u4WK75HN4j27Jtpxh4VnQvPb6jWd`:

- vytvořen: `2026-08-08 12:24:13` Europe/Prague;
- `READY`: `2026-08-08 12:24:40` Europe/Prague;
- target: `production`;
- project: `vankotraining-knee`;
- commit: `8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- branch: `main`;
- alias zahrnuje `knee.vankotraining.cz`;
- alias error: žádný.

`READY` znamená produkčně nasazeno, nikoli automaticky produkčně ověřeno uživatelem.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref:

`zxvndqicslyulrinbpyn`.

Po explicitním schválení uživatele byla `2026-08-08` aplikována phase-5 migrace z repo souboru:

`supabase/migrations/20260807_tindeq_active_session_unique.sql`.

Supabase migration history ji eviduje jako:

`20260808091809 tindeq_active_session_unique`.

Ověřený post-check z předchozí fáze:

- `public.tindeq_sessions`: `0` celkem / `0` aktivních;
- invalidní source session ID: `0`;
- active duplicate groups: `0`;
- validated CHECK `tindeq_sessions_source_session_id_valid` existuje a vynucuje `^[0-9a-f]{20}$`;
- partial unique index `tindeq_sessions_active_source_session_uidx` existuje pro aktivní řádky;
- počet sloupců zůstal `28`;
- RLS je zapnuté a `3` policies zůstaly zachované.

PR #16 databázové migrace, produkční schéma ani data nemění.

## Provedené smoke testy

V této práci byly provedeny read-only/deployment kontroly:

- Vercel produkční deployment byl znovu načten a potvrzen jako `READY` na exact SHA `8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- nebyl proveden produkční aplikační zápis, vytvoření testovacího klienta ani Tindeq session;
- nebyla provedena produkční DB mutace ani změna environment variables.

Předchozí phase-5 DB post-check zůstává zaznamenaný jako PASS. Funkční změny PR #16 jsou ověřované pouze na preview a v automatických testech.

## Poslední výslovné uživatelské produkční ověření

V této práci uživatel neprovedl nové výslovné funkční produkční ověření Tindeq workflow po merge PR #12.

PR #16 není produkčně nasazený, proto jej nelze označit jako produkčně ověřený. `READY` deployment, CI ani preview acceptance nejsou náhradou za explicitní uživatelské produkční potvrzení.

## Produkční stav Tindeq

- Tindeq runtime z PR #12 je od `main@8afe1328cfcb8f7ab90bb449775d1de0d441b584` produkčně nasazený;
- production DB má aplikovaný phase-5 dedupe invariant;
- prezentační rozšíření stavů/vysvětlivek z draft PR #16 v produkci není;
- tato práce neprovedla žádný produkční save ani jinou produkční mutaci.

## Preview stav PR #16

Kódový checkpoint `e887791b41b8750aedd0d7ca683d189f895b9756`:

- Vercel preview `dpl_BRh42z7GTotXNcquxLRb2kZSqBtu`: `READY`;
- exact-head CI: unit `103/103`, build, TypeScript, lint bez regrese, project-control, `git diff --check` a Playwright `10/10` PASS;
- responsive browser kontrola zahrnula klientský i trenérský pohled;
- `/tindeq/reports/demo` na preview odpověděl HTTP 200.

Toto je preview evidence, nikoli produkční deployment PR #16.

## Známé produkční problémy

- PR #16 není produkčně nasazený ani produkčně ověřený;
- nové výslovné uživatelské funkční ověření produkčního Tindeq workflow po merge PR #12 v této práci neproběhlo;
- shared production Supabase má dříve existující security/performance advisor nálezy mimo scope PR #16;
- úplný mapping historických manuálních Knee SQL změn na repo migrace není doložen.
