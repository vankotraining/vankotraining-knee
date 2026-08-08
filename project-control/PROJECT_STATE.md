# Project state

## Datum poslední kontroly

`2026-08-08` (Europe/Prague), po merge a produkčním rollout PR #17 a při kanonickém docs-only syncu PR #18.

## Aktuální `main` commit

Poslední commit, který mění aplikační runtime, je:

`47d8be4b51141da7e1960f2b555588b90c5a5ed8` – merge PR #17 `Fix Tindeq Repeater date parsing`.

PR #18 je pouze kanonický dokumentační sync. Po jeho merge je aktuální `main` commit merge commit obsahující tento soubor; jeho vlastní budoucí SHA nelze korektně vložit do souboru před vytvořením merge commitu. Exact živý `main` se proto při každé další práci resolve přes GitHub. Aplikační runtime kód po PR #18 zůstává potomkem runtime checkpointu `47d8be4b51141da7e1960f2b555588b90c5a5ed8` bez další funkční změny.

Merge PR #17 má rodiče `8afe1328cfcb8f7ab90bb449775d1de0d441b584` a exact PR head `a6216eaf2e1cd6f4a85d3fe884074ddec9a46e47`.

## Aktivní větev a PR

PR #17 je merged a closed.

PR #18 `Sync Tindeq parser production evidence` je docs-only kanonický sync tohoto produkčního rollout evidence. Po jeho merge nevzniká nová aplikační funkcionalita ani DB změna.

Paralelně zůstává otevřený draft PR #16 `Tindeq: clarify metric interpretation states`:

- větev: `agent/tindeq-metric-statuses`;
- head před rebase: `904da6768fe72ed86973c93fb164dea5e1eacc87`;
- PR zůstává samostatná prezentační změna;
- runtime/presentation soubory PR #16 se s parser soubory PR #17 nepřekrývají;
- PR #16 mění `PROJECT_STATE.md` a `PRODUCTION_STATUS.md`, proto před budoucím mergem vyžaduje rebase/reconciliation proti post-PR-17/18 `main`.

## Produkční runtime commit

Runtime-changing produkční checkpoint parseru je:

`47d8be4b51141da7e1960f2b555588b90c5a5ed8`.

Parser rollout byl ověřen na produkčním deploymentu:

`dpl_7TYSD6qnLQS4WgkkF9RsprDcetpD`.

Doložený stav rollout checkpointu:

- target: `production`;
- state: `READY`;
- commit: `47d8be4b51141da7e1960f2b555588b90c5a5ed8`;
- branch: `main`;
- alias zahrnuje `knee.vankotraining.cz`;
- alias error: `null`.

Docs-only merge PR #18 může vytvořit novější produkční deployment ID, ale nemění aplikační runtime kód. Exact aktuální deployment po takovém self-referential docs merge se resolve přes Vercel; finální evidence se zapisuje také do PR #18, protože deployment ID vzniká až po merge tohoto souboru.

Oprava `parseTindeqDate()` z PR #17 je tedy **implementována v `main` a produkčně nasazena**.

## Stav databázových migrací

### Produkční Supabase `zxvndqicslyulrinbpyn`

Phase-5 active-session dedupe migrace zůstává aplikovaná jako:

`20260808091809 tindeq_active_session_unique`.

Doložený invariant:

- validated CHECK `tindeq_sessions_source_session_id_valid` vyžaduje 20znakový lowercase hex `raw_metadata ->> 'tindeqSessionId'`;
- partial unique index `tindeq_sessions_active_source_session_uidx` chrání aktivní identitu `(athlete_id, analysis_version, raw_metadata ->> 'tindeqSessionId') WHERE deleted_at IS NULL`;
- PR #17 ani PR #18 databázové schéma nemění.

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

PR #17 ani docs-only PR #18 do dev databáze nezapisují a nevyžadují schema změnu.

## Aktuální fáze

**Oprava Tindeq parseru data je mergnutá a produkčně nasazená. Stabilizace nyní čeká na první nové živé klientské měření jako manuální produkční acceptance.**

Produkční parser interpretuje Tindeq `info.csv` datum jako pevný formát `YYYY-DD-MM HH:mm[:ss]`, validuje kalendářní datum a čas a při neplatném/nepodporovaném formátu failne místo heuristického odhadu.

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

PR #16 samostatně řeší prezentační stavy a vysvětlivky Tindeq metrik. Před dalším mergem musí být rebased/reconciled proti post-PR-17/18 `main`, zejména ve dvou kanonických project-control souborech.

## Nasazeno

- parser runtime checkpoint: `dpl_7TYSD6qnLQS4WgkkF9RsprDcetpD`, commit `47d8be4b51141da7e1960f2b555588b90c5a5ed8`, `READY`, alias error `null`;
- předmerge exact preview PR #17: `dpl_AbeXLcb7a7CDTJKsi5wpo7V7zSo2`, exact head `a6216eaf2e1cd6f4a85d3fe884074ddec9a46e47`, `READY`;
- exact-head CI PR #17: `Verify Tindeq client view` run `31275223170` PASS a `Project control` run `31275223171` PASS;
- docs-only PR #18 má vlastní exact-head CI/preview gate před merge; jeho produkční deployment po merge nemění runtime funkcionalitu.

Post-deploy read-only smoke parser rollout:

- `/tindeq`: HTTP `200`;
- `/tindeq/reports/demo`: HTTP `200`;
- Vercel build: compile + TypeScript PASS;
- error/fatal runtime logy pro parser rollout deployment v post-deploy okně: žádné nalezené;
- produkční Tindeq dataset: beze změny.

## Produkčně ověřeno

Historická datová remediation je manuálně produkčně ověřena pouze v dříve problematickém historickém případě, kde uživatel potvrdil správné datum a 8 repetitions.

Parser kód z PR #17 je **produkčně nasazený**, ale zatím není označen jako **produkčně ověřený** ve smyslu project-control. Automatizovaný CI, READY deployment, HTTP smoke a DB post-check tento stav nenahrazují.

Manuální produkční acceptance parseru bude provedena při prvním novém živém klientském měření.

## Známé problémy

- PR #16 je stále založený na pre-PR-17 `main` a před budoucím mergem potřebuje rebase/reconciliation kanonické dokumentace;
- shared production Supabase má dříve existující advisory nálezy mimo rozsah parser opravy;
- první nový live ZIP workflow po parser rollout zatím nebyl uživatelem manuálně potvrzen.

## Další krok

- Při prvním novém klientském měření během běžné lekce provést acceptance `nový ZIP → správný klient → správné datum/čas → správný počet repetitions → analýza → save → historie → report → reload` a teprve po PASS označit parser workflow jako produkčně ověřený.
