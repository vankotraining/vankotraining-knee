# Project state

## Datum poslední kontroly

`2026-08-10` (Europe/Prague), po uživatelském live new-client Tindeq acceptance, fresh read-only produkčním DB post-checku a reconciliation draft PR #16 proti aktuálnímu `main`.

## Aktuální `main` commit

Exact `main` načtený bezprostředně před reconciliation PR #16:

`2aad506dd482e765c61036a84b6a39a5635c90cf` – `Sync Tindeq production parser acceptance`.

Poslední runtime-changing commit zůstává:

`f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2` – merge PR #19 `Fix Tindeq mobile header navigation overlap`.

`2aad506...` a další následné acceptance/project-control commity jsou docs-only a nejsou novým runtime-changing checkpointem.

## Aktivní větev a PR

PR #19 `Fix Tindeq mobile header navigation overlap` je merged / closed a uživatelsky produkčně ověřený.

PR #16 `Tindeq: clarify metric interpretation states` zůstává samostatný open draft na větvi `agent/tindeq-metric-statuses`. Původní head před reconciliation byl `904da6768fe72ed86973c93fb164dea5e1eacc87` a původní base `8afe1328cfcb8f7ab90bb449775d1de0d441b584`. Reconciliation je postavená nad exact `main@2aad506dd482e765c61036a84b6a39a5635c90cf` a zachovává změny parseru PR #17, responsive navigace PR #19 i následnou project-control evidenci.

PR #16 zůstává draft; reconciliation sama o sobě není schválení merge do `main`.

## Produkční runtime commit

Runtime-changing production checkpoint zůstává:

- commit: `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- deployment: `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`;
- stav: `READY`;
- target: `production`;
- branch: `main`;
- alias zahrnuje `knee.vankotraining.cz`.

Následné docs-only project-control commity a jejich automatické Vercel deploymenty nemění aplikační runtime. Fresh Vercel kontrola potvrzuje nejnovější produkční docs-only deployment `dpl_AUEYkF1LzeeJtXDuQTWKs29oJB89` pro `main@2aad506dd482e765c61036a84b6a39a5635c90cf` jako `READY`.

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

Parser data z PR #17 je rovněž **produkčně ověřený v live new-client workflow**. Uživatel dne `2026-08-10` nahrál nové Tindeq měření, provedl jeho uložení na produkci a výslovně potvrdil, že vše vypadá v pořádku. Fresh read-only DB post-check potvrzuje novou aktivní session bez duplicit, s validním source session ID a `8/8` repetitions.

PR #16 je po reconciliation implementovaný ve své větvi jako prezentační rozšíření. Cílový uživatelský model je **3stupňová barevná škála + neutrální stav**: zelená `good`, oranžová `warning`, červená `problem`; šedá `neutral` není čtvrtý hodnoticí stupeň a slouží pro metriky bez korektní dobré/špatné klasifikace. `tindeq-report-v1`, databáze, persistence, auth a parserové pravidlo se tímto PR nemění.

## Implementováno v `main`

- Knee a Tindeq runtime včetně ZIP-only analýzy, explicitního save, historie a reportů;
- parser data z PR #17 s pevným formátem `YYYY-DD-MM HH:mm[:ss]`, kalendářní validací a fail-closed chováním;
- produkční phase-5 active-session dedupe invariant;
- responsive oprava horní navigace `/tindeq` z PR #19 včetně Playwright regresní kontroly pro 390 px a 320 px.

## Rozpracováno mimo `main`

- PR #16 centralizuje prezentační stavy `good | warning | problem | neutral`, vysvětlivky a typy pravidel Tindeq metrik;
- uživatelsky prezentuje systém jako `3stupňová barevná škála + neutrální stav` a explicitně vysvětluje, že šedá není čtvrtý stupeň hodnocení;
- chybějící nebo skutečně nehodnotitelné údaje jsou neutrální, nikoli automaticky červené;
- při chybějící délce pracovního intervalu se technický náběh na 95 % neklasifikuje jako problém bez dostatečného podkladu;
- pracovní hranice zůstávají označené jako pravidla protokolu, ne validované klinické cut-off hodnoty;
- před merge je autoritativní pouze fresh exact-head workflow a preview stav po reconciliation; historické zelené checky na `904da...` nejsou merge gate.

## Nasazeno

- parser oprava PR #17 je součástí produkčního runtime;
- responsive runtime merge PR #19: `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- runtime-changing production deployment PR #19: `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`, `READY`;
- produkční alias: `knee.vankotraining.cz`;
- produkční DB po novém live save: `40` total / `27` active / `13` soft-deleted, bez aktivních duplicit;
- PR #16: není produkčně nasazený.

## Produkčně ověřeno

Responsive oprava PR #19: **ano** – uživatel ji `2026-08-09` potvrdil na skutečném telefonu screenshotem a stavem `V pořádku`.

Parser data / live new-client workflow po PR #17: **ano** – uživatel `2026-08-10` nahrál a uložil nové měření a potvrdil, že vše vypadá v pořádku; read-only DB evidence potvrzuje novou validní aktivní session s `8/8` repetitions a bez dedupe porušení.

PR #16: **ne** – není v produkci.

## Známé problémy

- PR #16 zůstává draft mimo `main`; před budoucím mergem musí projít fresh exact-head CI/Playwright/Vercel gatem po reconciliation;
- dříve existující shared-production Supabase advisory nálezy zůstávají mimo scope dokončených parser/responsive změn i PR #16.

## Další krok

- Ověřit fresh exact-head checky a preview zreconcilovaného PR #16. Pokud budou zelené, následuje samostatné rozhodnutí o ready-for-review / merge; produkční rollout a uživatelský acceptance zůstávají oddělené gate.
