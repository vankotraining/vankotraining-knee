# Production status

## Datum poslední kontroly

`2026-08-15` (Europe/Prague), během fresh ověření produkčního stavu před/po přípravě draft PR #21 Android Tindeq share receiveru. PR #21 není produkčně nasazený a produkční databáze nebyla měněna.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Runtime-changing production deployment PR #20:

`dpl_2MpCHrW6vhsReXuWn5kJyZL958SV`

- state: `READY`;
- target: `production`;
- branch: `main`;
- exact runtime-changing commit: `1b48da7ed9340e8f53f591f3b427d4d6758246e1`;
- GitHub commit message: `Add safe client name editing (#20)`.

Fresh poslední produkční deployment je docs-only:

`dpl_B5ogPtD6BNsTbUdahMwX31e8zfzj`

- state: `READY`;
- target: `production`;
- branch: `main`;
- exact commit: `d829c086c8013187cb38e26ea77bc63b178fcff2`;
- GitHub commit message: `Record PR #20 production acceptance`.

Tento docs-only deployment nemění runtime checkpoint PR #20.

## Nasazený commit

Runtime-changing commit:

`1b48da7ed9340e8f53f591f3b427d4d6758246e1` – squash merge PR #20 `Add safe client name editing`.

Aktuální `main` je `d829c086c8013187cb38e26ea77bc63b178fcff2`; následné změny po runtime checkpointu jsou project-control sync.

PR #21 Android Tindeq share receiver je pouze na feature branch / Preview a **není součástí produkce**.

## Čas a výsledek deploymentu

Runtime-changing Vercel deployment `dpl_2MpCHrW6vhsReXuWn5kJyZL958SV` zůstává `READY`.

Fresh docs-only Vercel production deployment `dpl_B5ogPtD6BNsTbUdahMwX31e8zfzj` je `READY` nad aktuálním `main@d829c086c8013187cb38e26ea77bc63b178fcff2`.

Poslední potvrzený technický production smoke zůstává:

- `https://knee.vankotraining.cz/` → HTTP 200;
- `https://knee.vankotraining.cz/tindeq` → HTTP 200.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

PR #21 neprovedl žádnou DB migraci, DDL, RLS/policy/grant/Auth změnu ani produkční datový write. Produkční databázové schéma a Tindeq dedupe invariant zůstávají beze změny.

## Provedené smoke testy

Produkční acceptance PR #20 zůstává platná: merge/deployment `READY`, `/` a `/tindeq` HTTP 200 a uživatel dne `2026-08-11` explicitně potvrdil funkčnost přejmenování klienta.

PR #21 je oddělený Preview-only task. Jeho CI/Preview výsledky nejsou produkční smoke test a nejsou důkaz produkčního nasazení.

## Poslední výslovné uživatelské produkční ověření

`2026-08-11`: PR #20 bezpečná editace jména klienta – **produkčně potvrzena uživatelem jako funkční**.

`2026-08-10`: PR #16 nový interpretační model Tindeq – produkčně potvrzen uživatelem jako `v pořádku`.

`2026-08-10`: parser live new-client upload/save workflow – potvrzeno uživatelem jako v pořádku.

`2026-08-09`: responsive oprava PR #19 – potvrzena uživatelem na skutečném telefonu.

## Produkční stav Tindeq

Tindeq runtime, parser PR #17, responsive oprava PR #19, interpretační model PR #16 a client-name edit PR #20 zůstávají produkčně nasazené/ověřené v dříve zaznamenaném rozsahu.

Android native share receiver PR #21 je **implementovaný pouze mimo `main` a nasazený pouze na Preview**. Nesmí být označen jako produkčně nasazený ani produkčně ověřený před merge, production rollout a explicitní real-device acceptance.

## Známé produkční problémy

- PR #21 nevytváří žádný nový produkční problém, protože není v produkci;
- neblokující UX discoverability: `Upravit klienta` nemusí na první pohled působit dostatečně jako tlačítko;
- full-repo lint baseline obsahuje předexistující chyby/warning;
- dříve existující shared-production Supabase advisory nálezy zůstávají mimo scope.
