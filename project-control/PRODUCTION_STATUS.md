# Production status

## Datum poslední kontroly

`2026-08-10` (Europe/Prague), po live new-client Tindeq upload/save acceptance a fresh read-only produkčním DB post-checku.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Poslední runtime-changing deployment zůstává PR #19:

`dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`

- state: `READY`;
- target: `production`;
- branch: `main`;
- exact runtime-changing commit: `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- alias obsahuje `knee.vankotraining.cz`.

Následné acceptance/project-control deploymenty jsou docs-only a nejsou novými runtime checkpointy.

## Nasazený commit

Runtime-changing commit:

`f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2` – merge PR #19 `Fix Tindeq mobile header navigation overlap`.

Parser oprava PR #17 je jeho předkem a zůstává součástí aktuálního produkčního runtime.

## Čas a výsledek deploymentu

Runtime deployment `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq` byl ověřen jako `READY`; build log potvrzuje správný checkout `main`, úspěšný Next.js production build, TypeScript a generování rout `/`, `/tindeq`, `/tindeq/reports` a `/tindeq/reports/demo` bez build failure.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Aktivní dedupe invariant:

- CHECK `tindeq_sessions_source_session_id_valid`;
- partial unique index `tindeq_sessions_active_source_session_uidx`.

Fresh read-only post-check po novém live save:

- sessions celkem: `40`;
- aktivní sessions: `27`;
- soft-deleted sessions: `13`;
- aktivní klienti: `8`;
- invalid source session IDs: `0`;
- active duplicate groups: `0`;
- aktivní sessions s chybějícím nebo nekladným `detected_repetitions`: `0`.

Nejnovější session je aktivní, má validní source session ID, `8` detected a `8` expected repetitions, analysis version `tindeq-repeaters-v1`, measured_at `2026-08-10 06:46:18+00` a imported/created_at `2026-08-10 06:49:37+00`.

Kontrola byla pouze read-only.

## Provedené smoke testy

PR #19 prošel před mergem exact-head CI/Playwright gatem včetně mobilních viewportů 390 px a 320 px. Produkční rollout následně prošel build/HTTP/HTML/log smoke testem a uživatel jej ručně potvrdil na skutečném telefonu.

Parser PR #17 měl před rolloutem vlastní exact-head testy a produkční technický smoke. Dne `2026-08-10` byl doplněn chybějící live acceptance: uživatel nahrál nové Tindeq měření a úspěšně vyzkoušel jeho uložení; fresh DB post-check potvrzuje novou aktivní validní session bez dedupe porušení.

## Poslední výslovné uživatelské produkční ověření

`2026-08-10`: uživatel výslovně potvrdil nové live Tindeq měření slovy, že jej nahrál, vyzkoušel uložení a vše vypadá v pořádku. Toto potvrzení uzavírá live new-client parser acceptance po PR #17.

`2026-08-09 21:59` Europe/Prague: uživatel na skutečném telefonu potvrdil responsive opravu PR #19 jako `V pořádku`.

## Produkční stav Tindeq

- Tindeq runtime je produkčně nasazený;
- parser data z PR #17 je produkčně nasazený a nyní také uživatelsky ověřený v novém live upload/save workflow;
- responsive oprava PR #19 je produkčně nasazená a uživatelsky ověřená na skutečném telefonu;
- produkční DB po live save: `40` total / `27` active / `13` soft-deleted, `8` aktivních klientů, bez invalid source IDs a bez aktivních duplicit;
- parser acceptance ani responsive oprava již nemají otevřený produkční acceptance bod.

PR #16 `Tindeq: clarify metric interpretation states` zůstává samostatný open draft a není součástí dokončených rolloutů.

## Známé produkční problémy

- PR #16 před budoucím mergem vyžaduje reconciliation proti aktuálnímu `main`;
- dříve existující shared-production Supabase advisory nálezy zůstávají mimo scope dokončených parser/responsive změn.
