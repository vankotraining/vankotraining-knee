# Production status

## Datum poslední kontroly

`2026-08-11` (Europe/Prague), po explicitním uživatelském souhlasu s nasazením PR #20, squash merge, Vercel production rollout a technickém HTTP smoke testu. Funkční produkční acceptance editace klienta zatím uživatel explicitně nepotvrdil.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Aktuální runtime-changing production deployment:

`dpl_2MpCHrW6vhsReXuWn5kJyZL958SV`

- state: `READY`;
- target: `production`;
- branch: `main`;
- exact runtime-changing commit: `1b48da7ed9340e8f53f591f3b427d4d6758246e1`;
- GitHub commit message: `Add safe client name editing (#20)`;
- alias obsahuje `knee.vankotraining.cz`.

Následné project-control sync commity jsou docs-only a nejsou novými runtime checkpointy.

## Nasazený commit

Runtime-changing commit:

`1b48da7ed9340e8f53f591f3b427d4d6758246e1` – squash merge PR #20 `Add safe client name editing`.

PR #20 přidává pouze editaci identity existujícího klienta (`display_name` + synchronní `name_key`) a nemění profilové parametry, měření, Tindeq parser/persistence ani DB schéma/security.

## Čas a výsledek deploymentu

Vercel deployment `dpl_2MpCHrW6vhsReXuWn5kJyZL958SV` je `READY`; Vercel metadata potvrzují exact GitHub commit `1b48da7ed9340e8f53f591f3b427d4d6758246e1`, branch `main` a target `production`.

Technický smoke dne `2026-08-11`:

- `https://knee.vankotraining.cz/` → HTTP 200;
- `https://knee.vankotraining.cz/tindeq` → HTTP 200;
- Vercel lookup produkční domény `knee.vankotraining.cz` vrací deployment `dpl_2MpCHrW6vhsReXuWn5kJyZL958SV` s exact SHA `1b48da7...`.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

PR #20 neprovedl žádnou DB migraci, DDL, RLS/policy/grant/Auth změnu ani produkční datový write.

Fresh read-only audit před implementací potvrdil, že `public.athletes` už obsahuje potřebné non-blank constraints, unikátní `name_key`, UPDATE RLS a auditní/`updated_at` triggery.

Aktivní Tindeq dedupe invariant zůstává beze změny.

## Provedené smoke testy

Pre-merge exact-head PR #20:

- base `main@350d450e336d15fffcd7fc3d33ff41e342f5cd0d`;
- head `de98726c5bcd76d042b57af6f0228c505891f5ac`;
- `behind_by: 0`;
- PR mergeable;
- `npm test`: 118/118 passed, včetně 7 testů editace identity klienta;
- lint comparison proti `main`: stejný baseline 3 errors + 1 warning, bez nové regrese;
- `npm run build`: passed;
- `npx tsc --noEmit`: passed;
- `npm run project:check`: passed;
- `git diff --check origin/main...HEAD`: passed;
- Playwright: 12/12 passed;
- GitHub Actions `Verify Tindeq client view` run #217: success;
- GitHub Actions `Project control` run #75: success;
- Preview `dpl_6xn3UAZt9BA8JDVzh5w4Vc2Y9TWT`: `READY`, exact head `de98726...`.

Post-merge:

- PR #20: merged / closed;
- squash merge commit: `1b48da7ed9340e8f53f591f3b427d4d6758246e1`;
- production deployment exact merge commitu: `dpl_2MpCHrW6vhsReXuWn5kJyZL958SV`, `READY`;
- `/` a `/tindeq`: HTTP 200.

## Poslední výslovné uživatelské produkční ověření

PR #20: **zatím ne**. Uživatel dne `2026-08-11` explicitně schválil nasazení, ale zatím nepotvrdil funkční produkční rename workflow po rollout.

`2026-08-10`: PR #16 nový interpretační model Tindeq – produkčně potvrzen uživatelem jako `v pořádku`.

`2026-08-10`: parser live new-client upload/save workflow – potvrzeno uživatelem jako v pořádku.

`2026-08-09`: responsive oprava PR #19 – potvrzena uživatelem na skutečném telefonu.

## Produkční stav Tindeq

Tindeq runtime, parser PR #17, responsive oprava PR #19 a interpretační model PR #16 zůstávají produkčně nasazené; PR #20 jejich parser, persistence ani prezentaci nemění.

## Známé produkční problémy

- PR #20 nemá známý technický rollout blocker; funkční produkční acceptance čeká na uživatele;
- full-repo lint baseline obsahuje 3 předexistující chyby a 1 warning, PR #20 nepřidal další;
- dříve existující shared-production Supabase advisory nálezy zůstávají mimo scope PR #20.
