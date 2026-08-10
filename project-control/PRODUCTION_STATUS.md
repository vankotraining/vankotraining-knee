# Production status

## Datum poslední kontroly

`2026-08-10` (Europe/Prague), po merge PR #16, Vercel production rollout ověření a HTTP smoke testu `/tindeq` a `/tindeq/reports/demo`.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Aktuální runtime-changing production deployment:

`dpl_B6i49n5RAUuTZADdN8zc3dZN8i9B`

- state: `READY`;
- target: `production`;
- branch: `main`;
- exact runtime-changing commit: `6c2a08352b509d51336e368771edc6e804006008`;
- GitHub commit message: merge PR #16 `Tindeq: clarify metric interpretation states`;
- alias obsahuje `knee.vankotraining.cz`.

Následný project-control evidence sync je docs-only a není novým runtime checkpointem.

## Nasazený commit

Runtime-changing commit:

`6c2a08352b509d51336e368771edc6e804006008` – merge PR #16 `Tindeq: clarify metric interpretation states`.

Parser oprava PR #17 a responsive navigace PR #19 jsou jeho předky a zůstávají součástí aktuálního produkčního runtime.

## Čas a výsledek deploymentu

Vercel deployment `dpl_B6i49n5RAUuTZADdN8zc3dZN8i9B` je `READY`; Vercel metadata potvrzují exact GitHub commit `6c2a08352b509d51336e368771edc6e804006008`, branch `main` a target `production`.

Fresh technický smoke dne `2026-08-10`:

- `https://knee.vankotraining.cz/tindeq` → HTTP 200;
- `https://knee.vankotraining.cz/tindeq/reports/demo` → HTTP 200;
- demo report obsahuje `tindeq-report-v1`, status badge, typy pravidel a vysvětlivky PR #16;
- `/tindeq` zároveň zachovává responsive navigaci z PR #19.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Aktivní dedupe invariant:

- CHECK `tindeq_sessions_source_session_id_valid`;
- partial unique index `tindeq_sessions_active_source_session_uidx`.

Poslední fresh read-only post-check po live parser acceptance:

- sessions celkem: `40`;
- aktivní sessions: `27`;
- soft-deleted sessions: `13`;
- aktivní klienti: `8`;
- invalid source session IDs: `0`;
- active duplicate groups: `0`;
- aktivní sessions s chybějícím nebo nekladným `detected_repetitions`: `0`.

PR #16 neprovádí žádnou databázovou migraci ani write/DDL změnu.

## Provedené smoke testy

Pre-merge exact-head PR #16:

- head `bfc9ba06f165a7659dcf2451a8cc2fdeb9ddf4cc`;
- `behind_by: 0` proti `main@2aad506...`;
- `Project control` run 70: `success`;
- `Verify Tindeq client view` run 214: `success`;
- Vercel Preview `dpl_2k8WvSyHCaPrTM8uxNEXtyFaamNs`: `READY`;
- uživatel Preview funkčně zkontroloval a výslovně uvedl `v pořádku`.

Post-merge:

- GitHub PR #16: `merged: true`, `closed`;
- `main` po merge: `6c2a08352b509d51336e368771edc6e804006008`;
- Vercel production deployment exact merge commitu: `READY`;
- `/tindeq` a `/tindeq/reports/demo`: HTTP 200.

## Poslední výslovné uživatelské produkční ověření

`2026-08-10`: parser live new-client upload/save workflow – potvrzeno uživatelem jako v pořádku.

`2026-08-09`: responsive oprava PR #19 – potvrzena uživatelem na skutečném telefonu.

PR #16 má uživatelsky schválený Preview review před mergem, ale **samostatné produkční funkční potvrzení po rollout zatím chybí**.

## Produkční stav Tindeq

- Tindeq runtime je produkčně nasazený;
- parser PR #17 je nasazený a produkčně uživatelsky ověřený;
- responsive oprava PR #19 je nasazená a produkčně uživatelsky ověřená;
- PR #16 je nasazený v produkci přes `main@6c2a08352...` / `dpl_B6i49n5RAUuTZADdN8zc3dZN8i9B`;
- nový UI model je `3stupňová barevná škála + neutrální stav`; šedá není čtvrtý hodnoticí stupeň;
- technický rollout PR #16 je zelený; zbývá pouze explicitní uživatelský production acceptance.

## Známé produkční problémy

- žádný známý technický blocker související s PR #16 po merge/deploymentu;
- PR #16 zatím nemá samostatné uživatelské produkční potvrzení po rollout;
- dříve existující shared-production Supabase advisory nálezy zůstávají mimo scope PR #16.
