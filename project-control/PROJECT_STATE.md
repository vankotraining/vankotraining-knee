# Project state

## Datum poslední kontroly

`2026-08-10` (Europe/Prague), po uživatelském live new-client Tindeq acceptance a fresh read-only produkčním DB post-checku.

## Aktuální `main` commit

Před tímto docs-only acceptance syncem byl exact `main`:

`0d14d6685415293976a7d607ed0d6392de1aedfe` – docs-only záznam produkčního mobilního acceptance PR #19.

Poslední runtime-changing commit zůstává:

`f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2` – merge PR #19 `Fix Tindeq mobile header navigation overlap`.

Tento acceptance sync mění pouze `project-control`; není novým runtime-changing checkpointem.

## Aktivní větev a PR

PR #19 `Fix Tindeq mobile header navigation overlap` je merged / closed a uživatelsky produkčně ověřený.

PR #16 `Tindeq: clarify metric interpretation states` zůstává samostatný open draft, head `904da6768fe72ed86973c93fb164dea5e1eacc87`, mergeable false; při této práci nebyl upraven ani mergnut.

## Produkční runtime commit

Runtime-changing production checkpoint zůstává:

- commit: `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- deployment: `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`;
- stav: `READY`;
- target: `production`;
- branch: `main`;
- alias zahrnuje `knee.vankotraining.cz`.

Následné docs-only project-control commity a jejich automatické Vercel deploymenty nemění aplikační runtime.

## Stav databázových migrací

Produkční Supabase: `zxvndqicslyulrinbpyn`.

Phase-5 dedupe invariant zůstává aktivní:

- CHECK `tindeq_sessions_source_session_id_valid`;
- partial unique index `tindeq_sessions_active_source_session_uidx`.

Fresh read-only DB post-check po novém live měření:

- sessions celkem: `40`;
- aktivní sessions: `27`;
- soft-deleted sessions: `13`;
- aktivní klienti v Tindeq sessions: `8`;
- invalid source session IDs: `0`;
- active duplicate groups: `0`;
- aktivní sessions s chybějícím nebo nekladným `detected_repetitions`: `0`.

Nejnovější uložená session:

- measured_at: `2026-08-10 06:46:18+00` (`08:46:18` Europe/Prague);
- imported/created_at: `2026-08-10 06:49:37+00` (`08:49:37` Europe/Prague);
- detected / expected repetitions: `8 / 8`;
- analysis version: `tindeq-repeaters-v1`;
- aktivní: ano;
- source session ID validní: ano.

Kontrola byla pouze read-only; nebyl proveden žádný DB write ani DDL.

## Aktuální fáze

Responsive oprava PR #19 je kompletně uzavřena: implementována, nasazena, technicky ověřena a uživatelsky produkčně potvrzena na skutečném telefonu.

Parser data z PR #17 je nyní rovněž **produkčně ověřený v live new-client workflow**. Uživatel dne `2026-08-10` nahrál nové Tindeq měření, provedl jeho uložení na produkci a výslovně potvrdil, že vše vypadá v pořádku. Fresh read-only DB post-check potvrzuje novou aktivní session bez duplicit, s validním source session ID a `8/8` repetitions.

## Implementováno v `main`

- Knee a Tindeq runtime včetně ZIP-only analýzy, explicitního save, historie a reportů;
- parser data z PR #17 s pevným formátem `YYYY-DD-MM HH:mm[:ss]`, kalendářní validací a fail-closed chováním;
- produkční phase-5 active-session dedupe invariant;
- responsive oprava horní navigace `/tindeq` z PR #19 včetně Playwright regresní kontroly pro 390 px a 320 px.

## Rozpracováno mimo `main`

- PR #16 samostatně řeší prezentační stavy a vysvětlivky Tindeq metrik; před budoucím mergem vyžaduje reconciliation proti aktuálnímu `main`.

## Nasazeno

- parser oprava PR #17 je součástí produkčního runtime;
- responsive runtime merge PR #19: `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- runtime-changing production deployment PR #19: `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`, `READY`;
- produkční alias: `knee.vankotraining.cz`;
- produkční DB po novém live save: `40` total / `27` active / `13` soft-deleted, bez aktivních duplicit.

## Produkčně ověřeno

Responsive oprava PR #19: **ano** – uživatel ji `2026-08-09` potvrdil na skutečném telefonu screenshotem a stavem `V pořádku`.

Parser data / live new-client workflow po PR #17: **ano** – uživatel `2026-08-10` nahrál a uložil nové měření a potvrdil, že vše vypadá v pořádku; read-only DB evidence potvrzuje novou validní aktivní session s `8/8` repetitions a bez dedupe porušení.

## Známé problémy

- PR #16 zůstává samostatný draft a před budoucím mergem vyžaduje reconciliation proti aktuálnímu `main`;
- dříve existující shared-production Supabase advisory nálezy zůstávají mimo scope dokončených parser/responsive změn.

## Další krok

- Samostatně rozhodnout o reconciliation a dalším postupu draft PR #16; parser acceptance ani PR #19 již nevyžadují další zásah.
