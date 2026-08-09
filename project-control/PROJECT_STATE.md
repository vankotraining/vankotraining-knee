# Project state

## Datum poslední kontroly

`2026-08-09` (Europe/Prague), při izolované opravě mobilní navigace `/tindeq` v draft PR #19.

## Aktuální `main` commit

Aktuální exact `main` je:

`7b9f40864b35cf75fb12d87aa0de32bd3aafeb93` – merge PR #18 `Sync Tindeq parser production evidence`.

Poslední commit, který před PR #19 měnil aplikační runtime, zůstává:

`47d8be4b51141da7e1960f2b555588b90c5a5ed8` – merge PR #17 `Fix Tindeq Repeater date parsing`.

PR #18 byl docs-only kanonický sync a parser ani jiný aplikační runtime kód nezměnil.

Merge PR #17 má rodiče `8afe1328cfcb8f7ab90bb449775d1de0d441b584` a exact PR head `a6216eaf2e1cd6f4a85d3fe884074ddec9a46e47`.

## Aktivní větev a PR

Otevřené jsou dva oddělené draft PR:

### PR #16 `Tindeq: clarify metric interpretation states`

- větev: `agent/tindeq-metric-statuses`;
- head: `904da6768fe72ed86973c93fb164dea5e1eacc87`;
- base v PR metadata zůstává pre-PR-17 commit `8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- GitHub jej při fresh kontrole `2026-08-09` označil jako `mergeable: false`;
- před budoucím mergem vyžaduje rebase/reconciliation proti aktuálnímu `main`, zejména v kanonických project-control souborech.

### PR #19 `Fix Tindeq mobile header navigation overlap`

- větev: `agent/tindeq-mobile-nav-fix`;
- base: exact `main` `7b9f40864b35cf75fb12d87aa0de32bd3aafeb93`;
- scope: pouze responsive layout horní navigace `/tindeq` a cílený Playwright regresní test;
- žádné změny Tindeq analýzy, auth, Supabase, persistence, schema, environment variables ani produkčních dat;
- oprava je **implementována ve větvi**, ale ještě není v `main` ani produkci;
- před merge vyžaduje exact-head CI, `project:check`, Vercel preview a mobilní browser gate.

PR #19 záměrně nezasahuje do větve PR #16.

## Produkční runtime commit

Aktuální produkční deployment po docs-only merge PR #18 je:

`dpl_EgsTqXyojtoD84y11KdBukcDeR4F`.

Doložený stav:

- target: `production`;
- state: `READY`;
- commit: `7b9f40864b35cf75fb12d87aa0de32bd3aafeb93`;
- branch: `main`.

Protože PR #18 byl docs-only, poslední aplikační runtime změna uvnitř tohoto produkčního commitu zůstává parser checkpoint:

`47d8be4b51141da7e1960f2b555588b90c5a5ed8`.

Oprava `parseTindeqDate()` z PR #17 je tedy **implementována v `main` a produkčně nasazena**.

Responsive oprava z PR #19 zatím **není produkčně nasazena**.

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

Phase-5 active-session dedupe migrace zůstává aplikovaná jako:

`20260808091809 tindeq_active_session_unique`.

Doložený invariant:

- validated CHECK `tindeq_sessions_source_session_id_valid` vyžaduje 20znakový lowercase hex `raw_metadata ->> 'tindeqSessionId'`;
- partial unique index `tindeq_sessions_active_source_session_uidx` chrání aktivní identitu `(athlete_id, analysis_version, raw_metadata ->> 'tindeqSessionId') WHERE deleted_at IS NULL`;
- PR #19 databázové schéma ani data nemění.

### Produkční historický Tindeq dataset

Schválená historická remediation z `2026-08-08` zůstává beze změny:

- 26 aktivních správných historických sessions;
- 13 soft-deleted chybných původních importních rows jako auditní stopa;
- 7 klientů mezi aktivními sessions;
- původní manifest post-check: missing `0`, extra `0`, metadata mismatch `0`, active duplicate groups `0`, quality violations `0`.

Fresh read-only post-deploy re-check po rollout PR #17 potvrdil:

- `active_count = 26`;
- `soft_deleted_count = 13`;
- `active_athletes = 7`;
- invalid source session IDs `0`;
- active duplicate groups `0`;
- aktivní sessions s chybějícím nebo nekladným `detected_repetitions`: `0`.

Detailní anonymizovaný evidence záznam je v [`tindeq-historical-import-remediation-2026-08-08.md`](./tindeq-historical-import-remediation-2026-08-08.md).

### Vývojový Supabase `twndqnmrvefhwuwuglju`

PR #19 do dev databáze nezapisuje a nevyžaduje schema změnu.

## Aktuální fáze

Parser data je mergnutý a produkčně nasazený; jeho první nové živé klientské měření stále čeká na manuální produkční acceptance.

Paralelně se v PR #19 řeší izolovaný produkčně pozorovaný responsive bug horní navigace `/tindeq`, kde se při malé šířce viewportu překrývají tlačítka `Otevřít reporty` a `Zpět na klienty`.

## Implementováno v `main`

- samostatná Next.js Knee aplikace na `knee.vankotraining.cz`;
- přihlášení, klienti, knee-extension měření, historie a související UI;
- Tindeq ZIP-only runtime včetně lokální analýzy, explicitního save, historie, reportů a DB-aware deduplikace;
- produkční phase-5 databázový dedupe invariant;
- deterministická npm instalace a CI;
- opravený Tindeq parser data z PR #17: pevné `YYYY-DD-MM HH:mm[:ss]`, kalendářní validace a fail-closed chování;
- regresní testy potvrzující problematická srpnová data, nezměněnou silovou analýzu a stabilní session ID;
- kanonická anonymizovaná evidence historické remediation a produkčního parser rollout.

## Rozpracováno mimo `main`

- PR #16 samostatně řeší prezentační stavy a vysvětlivky Tindeq metrik a před dalším mergem potřebuje rebase/reconciliation proti aktuálnímu `main`;
- PR #19 řeší pouze responsive horní navigaci `/tindeq`; používá explicitní flex/grid layout a obsahuje E2E regresní kontrolu pro mobilní viewporty 390 px a 320 px.

## Nasazeno

- aktuální produkční deployment: `dpl_EgsTqXyojtoD84y11KdBukcDeR4F`, commit `7b9f40864b35cf75fb12d87aa0de32bd3aafeb93`, `READY`, target `production`;
- parser runtime checkpoint uvnitř aktuálního produkčního commitu: `47d8be4b51141da7e1960f2b555588b90c5a5ed8`;
- předmerge exact preview PR #17: `dpl_AbeXLcb7a7CDTJKsi5wpo7V7zSo2`, exact head `a6216eaf2e1cd6f4a85d3fe884074ddec9a46e47`, `READY`;
- responsive oprava PR #19 zatím není produkčně nasazena.

Post-deploy read-only smoke parser rollout:

- `/tindeq`: HTTP `200`;
- `/tindeq/reports/demo`: HTTP `200`;
- Vercel build: compile + TypeScript PASS;
- error/fatal runtime logy pro parser rollout deployment v post-deploy okně: žádné nalezené;
- produkční Tindeq dataset: beze změny.

## Produkčně ověřeno

Historická datová remediation je manuálně produkčně ověřena pouze v dříve problematickém historickém případě, kde uživatel potvrdil správné datum a 8 repetitions.

Parser kód z PR #17 je **produkčně nasazený**, ale zatím není označen jako **produkčně ověřený** ve smyslu project-control. Automatizovaný CI, READY deployment, HTTP smoke a DB post-check tento stav nenahrazují.

Responsive bug horní navigace `/tindeq` byl uživatelem doložen screenshotem z produkce; oprava PR #19 zatím čeká na preview/browser ověření a není produkčně ověřena.

## Známé problémy

- na aktuálním produkčním `/tindeq` se při malé mobilní šířce mohou překrývat navigační tlačítka; oprava je pouze v draft PR #19;
- PR #16 je stále založený na pre-PR-17 `main` a před budoucím mergem potřebuje rebase/reconciliation kanonické dokumentace;
- shared production Supabase má dříve existující advisory nálezy mimo rozsah této UI opravy;
- první nový live ZIP workflow po parser rollout zatím nebyl uživatelem manuálně potvrzen.

## Další krok

- Dokončit exact-head CI, project-control, Vercel preview a mobilní browser gate PR #19 bez zásahu do PR #16; merge řešit až samostatným rozhodnutím a produkční ověření responsive opravy až po výslovné ruční kontrole na mobilním zařízení.
