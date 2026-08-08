# Production status

## Datum poslední kontroly

`2026-08-08` (Europe/Prague), po produkčním rollout PR #17 a při kanonickém docs-only syncu PR #18.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Poslední runtime-changing produkční rollout parseru byl ověřen na deploymentu:

`dpl_7TYSD6qnLQS4WgkkF9RsprDcetpD`.

PR #18 je pouze dokumentační sync. Jeho merge do `main` může automaticky vytvořit novější produkční deployment se stejným aplikačním runtime kódem. Exact ID takového deploymentu vzniká až po merge tohoto souboru a proto jej nelze bez self-reference spolehlivě předem vložit do stejného commitu. Aktuální exact deployment se při další práci resolve přes Vercel; finální post-merge evidence PR #18 zaznamenává jeho ID a SHA.

## Nasazený commit

Poslední commit, který mění aplikační runtime, je:

`47d8be4b51141da7e1960f2b555588b90c5a5ed8` z větve `main` – merge PR #17 `Fix Tindeq Repeater date parsing`.

Docs-only merge PR #18 může posunout `main` na novější commit, ale nemění parser ani jiný aplikační runtime kód.

## Čas a výsledek deploymentu

Parser rollout deployment `dpl_7TYSD6qnLQS4WgkkF9RsprDcetpD`:

- stav: `READY`;
- target: `production`;
- project: `vankotraining-knee`;
- runtime-changing commit: `47d8be4b51141da7e1960f2b555588b90c5a5ed8`;
- branch: `main`;
- alias zahrnuje `knee.vankotraining.cz`;
- alias error: `null`.

Vercel build log parser rollout potvrzuje:

- checkout `main` na commitu `47d8be4`;
- Next.js production compile PASS;
- TypeScript PASS;
- statické routy včetně `/tindeq`, `/tindeq/reports` a `/tindeq/reports/demo` vygenerované;
- `Build Completed` bez build failure.

`READY` dokládá produkční nasazení. Produkční ověření ve smyslu project-control vyžaduje samostatné výslovné uživatelské potvrzení konkrétního funkčního toku.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref:

`zxvndqicslyulrinbpyn`.

Phase-5 active-session dedupe migrace zůstává aplikována jako:

`20260808091809 tindeq_active_session_unique`.

Repo SQL zdroj:

`supabase/migrations/20260807_tindeq_active_session_unique.sql`.

PR #17 ani docs-only PR #18 nepřidávají nebo nemění databázové schéma.

### Produkční historický Tindeq dataset

Schválená remediation z `2026-08-08` zůstává zachována:

- 26 aktivních správných historických sessions;
- 13 soft-deleted chybných původních importních rows jako auditní stopa;
- 7 klientů mezi aktivními sessions;
- původní manifest post-check: missing `0`, extra `0`, metadata mismatch `0`, active duplicate groups `0`, quality violations `0`.

Fresh read-only post-deploy DB re-check po nasazení PR #17:

- active rows: `26`;
- soft-deleted rows: `13`;
- active clients: `7`;
- invalid source session IDs: `0`;
- active duplicate groups: `0`;
- active sessions s chybějícím nebo nekladným `detected_repetitions`: `0`.

Produkční rollout parseru dataset nezměnil. Docs-only PR #18 do databáze nezapisuje.

## Provedené smoke testy

Po přepnutí produkčního aliasu na parser rollout `dpl_7TYSD6qnLQS4WgkkF9RsprDcetpD` bylo neinvazivně ověřeno:

- deployment `READY` a exact runtime-changing SHA `47d8be4b51141da7e1960f2b555588b90c5a5ed8`;
- `knee.vankotraining.cz` je mezi aliasy deploymentu;
- alias error `null`;
- `/tindeq`: HTTP `200` a render očekávané stránky `Tindeq Repeaters`;
- `/tindeq/reports/demo`: HTTP `200` a render anonymního kanonického reportu;
- error/fatal runtime logy rollout deploymentu v post-deploy kontrolním okně: žádné nalezené;
- produkční DB post-check: beze změny a bez aktivních duplicit.

Před merge exact head PR #17 `a6216eaf2e1cd6f4a85d3fe884074ddec9a46e47` prošel:

- `Verify Tindeq client view` run `31275223170`: PASS;
- `Project control` run `31275223171`: PASS;
- deterministic `npm ci`, unit/date regressions, lint-baseline, production build, standalone TypeScript, `project:check`, `git diff --check` a Playwright/browser verification: PASS;
- exact preview `dpl_AbeXLcb7a7CDTJKsi5wpo7V7zSo2`: `READY`.

Docs-only PR #18 má před merge vlastní exact-head CI a preview gate; po merge se pouze ověřuje, že nový produkční deployment je `READY`, exact `main`, bez alias/build error a se stejným runtime chováním.

## Poslední výslovné uživatelské produkční ověření

Uživatel po historické remediation v produkční aplikaci ručně zkontroloval dříve problematický historický případ a potvrdil správné datum a 8 repetitions.

Tento PASS se vztahuje na historickou remediation a nikoli na nový parser runtime z PR #17.

Parser z PR #17 je nyní produkčně nasazený, ale první nový živý klientský ZIP po tomto rollout ještě nebyl uživatelem manuálně ověřen. Proto parser workflow zatím není označen jako **produkčně ověřeno**.

## Produkční stav Tindeq

- Tindeq ZIP-only runtime je produkčně nasazený;
- opravený `parseTindeqDate()` z PR #17 je v runtime-changing commitu `47d8be4b51141da7e1960f2b555588b90c5a5ed8`;
- Tindeq datum se interpretuje jako pevný formát `YYYY-DD-MM HH:mm[:ss]`;
- kalendářní datum a čas se validují a neplatný/nepodporovaný formát failne místo heuristického odhadu;
- výpočty síly a `digest()` / dedupe identita nebyly změněny;
- historický dataset zůstává stabilní 26 aktivních + 13 soft-deleted rows;
- post-deploy HTTP/read-only smoke parser rollout je PASS;
- docs-only PR #18 nemění aplikační runtime ani DB;
- live new-client acceptance je stále pending.

## Známé produkční problémy

- první nové živé klientské měření po parser rollout zatím nebylo manuálně produkčně ověřeno;
- PR #16 je stále založený na stavu před merge PR #17 a před budoucím mergem vyžaduje rebase/reconciliation dvou kanonických project-control souborů;
- shared production Supabase má dříve existující advisory nálezy mimo rozsah parser opravy.
