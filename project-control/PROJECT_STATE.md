# Project state

## Datum poslední kontroly

`2026-08-08` (Europe/Prague).

## Aktuální `main` commit

`8afe1328cfcb8f7ab90bb449775d1de0d441b584` — `Merge pull request #12 from agent/tindeq-results-site`.

PR #12 je sloučený do `main`. Živý head byl znovu ověřen přes GitHub 2026-08-08.

## Aktivní větev a PR

- větev: `agent/tindeq-metric-statuses`;
- draft PR: `#16` — `Tindeq: clarify metric interpretation states`;
- base: `main@8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- poslední plně automaticky ověřený kódový checkpoint před project-control syncem: `e887791b41b8750aedd0d7ca683d189f895b9756`;
- PR zůstává draft, není merged a nebyl označen ready-for-review.

## Produkční runtime commit

Produkční alias `knee.vankotraining.cz` používá:

- Vercel projekt `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`);
- deployment `dpl_u4WK75HN4j27Jtpxh4VnQvPb6jWd`;
- stav `READY`, target `production`;
- commit `8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- branch `main`;
- alias error: žádný.

Tindeq Results Site z PR #12 je tedy produkčně nasazený. Změny z draft PR #16 produkčně nasazené nejsou.

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

Phase-5 active-session dedupe migrace byla po explicitním uživatelském schválení aplikována `2026-08-08` jako:

`20260808091809 tindeq_active_session_unique`.

Použit byl repo soubor `supabase/migrations/20260807_tindeq_active_session_unique.sql`.

Ověřený post-check z předchozí fáze:

- `public.tindeq_sessions`: `0` celkem / `0` aktivních;
- invalidní source session ID: `0`;
- active duplicate groups: `0`;
- validated CHECK `tindeq_sessions_source_session_id_valid` existuje a vynucuje `^[0-9a-f]{20}$`;
- partial unique index `tindeq_sessions_active_source_session_uidx` existuje pro aktivní řádky;
- tabulka má `28` sloupců, RLS je zapnuté a `3` policies zůstaly zachované.

PR #16 databázové schéma, produkční data ani migration history nemění.

### Vývojový Supabase `twndqnmrvefhwuwuglju`

Phase-5 invariant zůstává aktivní i na dev; PR #16 do dev ani production DB nezapisuje.

## Aktuální fáze

**Tindeq Results Site je v `main` a produkčně nasazený. Rozpracovaná je čistě prezentační interpretace Tindeq metrik v draft PR #16.**

To neznamená produkční ověření PR #16. Merge a produkční rollout mají samostatné approval gates.

## Implementováno v `main`

- samostatná Next.js Knee aplikace na `knee.vankotraining.cz`;
- přihlášení, klienti, knee extension měření, výpočty, historie, archivace/obnova a UI polish;
- kanonický project-control systém;
- Tindeq `/tindeq` runtime z původního PR #12: ZIP import, klientský a trenérský pohled, explicitní save, historie, kanonický `tindeq-report-v1`, auth/environment guard a persistence workflow;
- produkční phase-5 DB dedupe invariant.

## Rozpracováno mimo `main`

Draft PR #16 obsahuje:

- centralizovaný stav `good | warning | problem | neutral`;
- typ významu `protocol | contextual | descriptive`;
- neutrální `Bez hodnocení` pro chybějící/neinterpretovatelný klinický kontext;
- malé textové badge, jemné barevné akcenty a krátké vysvětlivky;
- klientský pohled se třemi primárními rozhodovacími kartami;
- trenérský a kanonický report s rozlišením pracovních pravidel a kontextových hodnot;
- explicitní rozlišení `normalizedSideDifferencePctPoints` od LSI;
- beze změny výpočtů `src/lib/tindeq-report.ts`, databáze, auth a persistence.

## Nasazeno

- produkční aplikační runtime: `main@8afe1328cfcb8f7ab90bb449775d1de0d441b584` v `dpl_u4WK75HN4j27Jtpxh4VnQvPb6jWd`, `READY`;
- production DB: phase-5 migration `20260808091809 tindeq_active_session_unique` je aplikovaná a databázový post-check byl PASS;
- PR #16: pouze Vercel Preview; kódový checkpoint `e887791b41b8750aedd0d7ca683d189f895b9756` měl `READY` preview `dpl_BRh42z7GTotXNcquxLRb2kZSqBtu`.

## Produkčně ověřeno

- Produkční deployment `main@8afe1328cfcb8f7ab90bb449775d1de0d441b584` je na Vercelu `READY`, ale v této práci nebylo uživatelem provedeno nové výslovné funkční produkční ověření Tindeq workflow.
- PR #16 není produkčně nasazený, a proto není produkčně ověřený.
- READY deployment, CI ani preview acceptance se za explicitní uživatelské produkční ověření nepovažují.

## Známé problémy

- draft PR #16 ještě není merged;
- PR #16 není produkčně nasazený ani produkčně ověřený;
- existující lint baseline v `main` je `3 errors + 1 warning` mimo tuto Tindeq změnu;
- shared production Supabase má dříve existující security/performance advisor nálezy mimo scope PR #16;
- úplný mapping historických manuálních Knee SQL změn na repo migrace není doložen;
- reakce další ráno není v aktuálním Tindeq datovém modelu.

## Ověření draft PR #16

Kódový checkpoint `e887791b41b8750aedd0d7ca683d189f895b9756`:

- unit `103/103` PASS;
- lint branch `3 errors + 1 warning`, shodně s `main` — bez regrese;
- production build + standalone TypeScript: PASS;
- project-control + `git diff --check`: PASS;
- Playwright `10/10` PASS;
- responsive browser screenshoty: klient 360/390/720/1024/1440 px, trenér 390/1024 px;
- kanonický preview `/tindeq/reports/demo`: HTTP 200.

## Další krok

- Po code review rozhodnout o merge PR #16; produkční nasazení ani produkční ověření neprovádět bez samostatného explicitního schválení.
