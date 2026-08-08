# PROJECT_STATE — Knee Extension (v2.0)

Aktualizováno: 2026-08-08

## Aktuální stabilní stav

- `main` je na exact SHA `8afe1328cfcb8f7ab90bb449775d1de0d441b584` (`Merge pull request #12 from agent/tindeq-results-site`).
- PR #12 s Tindeq Results Site je sloučený do `main`.
- Produkční Vercel deployment `dpl_u4WK75HN4j27Jtpxh4VnQvPb6jWd` je `READY` a odpovídá `main@8afe1328cfcb8f7ab90bb449775d1de0d441b584`.
- Produkční funkční chování nebylo v této práci explicitně potvrzeno uživatelem.
- Aktivní prezentační změna Tindeq metrik je v draft PR #16 na větvi `agent/tindeq-metric-statuses`; není sloučená ani produkčně nasazená.

## Platný datový a analytický model

- Aplikace používá Next.js App Router, React, TypeScript, Supabase a Vercel.
- Tindeq import, normalizace, persistence a kanonický `tindeq-report-v1` zůstávají zdrojem numerických a rozhodovacích dat.
- PR #16 nemění databázové schéma, auth, persistence model, Supabase data ani Vercel environment variables.
- PR #16 nemění výpočetní algoritmus `src/lib/tindeq-report.ts`; přidává pouze centralizovanou prezentační vrstvu pro stav, vysvětlení a typ pravidla.

## Poslední změny

### 2026-08-08 — Tindeq metric interpretation states (draft PR #16)

- Vznikla centralizovaná typovaná vrstva `good | warning | problem | neutral` a typy pravidel `protocol | contextual | descriptive`.
- Chybějící nebo nehodnotitelný klinický kontext se zobrazuje neutrálně jako `Bez hodnocení`, nikoli automaticky jako červený nález.
- Barevné stavy jsou omezené na metriky s explicitním pracovním pravidlem; MVIC, absolutní síla a stranové rozdíly zůstávají záměrně bez automatické klasifikace.
- Klientský pohled používá tři hlavní rozhodovací karty a textový stav; trenérský a kanonický report zachovávají technická data a přidávají stručné vysvětlivky.
- Pracovní hranice jsou v UI označené jako pravidla protokolu, nikoli jako validované klinické cut-off hodnoty.
- Kódový checkpoint `e887791b41b8750aedd0d7ca683d189f895b9756` prošel exact-head CI: 103 unit testů, lint bez regrese proti `main`, Next build, TypeScript, `project:check`, `git diff --check` a 10 Playwright testů včetně mobilního a desktopového klientského i trenérského pohledu.
- Preview deployment `dpl_DeJzDnWsEHrogyCWYyHG6vtEymCN` pro `e887791b41b8750aedd0d7ca683d189f895b9756` je `READY`; `/tindeq/reports/demo` odpovídá HTTP 200.
- Změna není produkčně nasazená ani produkčně ověřená.

### 2026-08-08 — Tindeq Results Site

- PR #12 byl sloučen do `main` jako `8afe1328cfcb8f7ab90bb449775d1de0d441b584`.
- `/tindeq` obsahuje klientský a trenérský pohled, kanonický report, ukládání Tindeq sessions a související auth/persistence workflow.
- Produkční deployment odpovídající tomuto merge je na Vercelu `READY`; produkční funkční ověření je oddělený manuální gate.

### 2026-08-04 — Tindeq auth / environment hardening

- Tindeq auth redirect a environment guard byly zpřesněny tak, aby Knee preview používalo vývojový Supabase projekt a produkce produkční projekt.
- `localhost` zůstává pouze lokálním vývojovým originem.

## Důležitá rozhodnutí a omezení

- Barevný stav v Tindeq výsledcích znamená splnění pracovního pravidla konkrétního protokolu, nikoli diagnózu nebo univerzální označení zdravého či patologického kolene.
- `normalizedSideDifferencePctPoints` není LSI a nesmí být jako LSI prezentováno.
- Změna maximální síly proti minulému testu se automaticky neklasifikuje bez protokolově specifické chyby měření / MDC.
- Reakce další ráno není v aktuálním datovém modelu a v PR #16 se nepřidává.
- Produkční databázové změny a produkční deployment vyžadují samostatné explicitní schválení.

## Co je nyní uzavřené

- Merge PR #12 do `main`.
- Centralizace Tindeq prezentačních stavů a neutrálního chování pro chybějící kontext v draft PR #16.
- Exact-head automatické ověření kódového checkpointu PR #16 včetně browser screenshotů klientského a trenérského pohledu.

## Co je stále otevřené

- Review a případný merge draft PR #16.
- Produkční deployment PR #16 až po samostatném explicitním schválení.
- Produkční funkční ověření po případném deploymentu pouze s explicitním potvrzením uživatele.
- Případné budoucí rozšíření datového modelu o reakci další ráno.

## Bezprostřední další krok

- Po code review rozhodnout o merge PR #16; produkční nasazení ani produkční ověření neprovádět bez samostatného explicitního schválení.
