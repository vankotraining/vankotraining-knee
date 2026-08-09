# Production status

## Datum poslední kontroly

`2026-08-09` (Europe/Prague), po dokončení pre-merge preview gate responsive opravy z draft PR #19; produkce zůstává beze změny.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Fresh ověřený aktuální produkční deployment je:

`dpl_EgsTqXyojtoD84y11KdBukcDeR4F`.

Jde o deployment docs-only merge PR #18. Vercel metadata potvrzují:

- stav: `READY`;
- target: `production`;
- branch: `main`;
- exact commit: `7b9f40864b35cf75fb12d87aa0de32bd3aafeb93`.

Poslední runtime-changing produkční rollout před tímto docs-only mergem zůstává parser deployment:

`dpl_7TYSD6qnLQS4WgkkF9RsprDcetpD`.

Responsive oprava PR #19 má pouze preview deployment runtime checkpointu:

`dpl_6hupqcary9MtnVBDcN2Din21K2z7` – `READY`, exact runtime head `316d394c9608e0f0d7729e48487d265f7b91a5c0`, target preview, alias error `null`.

## Nasazený commit

Aktuální exact produkční `main` commit je:

`7b9f40864b35cf75fb12d87aa0de32bd3aafeb93` – merge PR #18 `Sync Tindeq parser production evidence`.

PR #18 měnil pouze kanonickou dokumentaci. Poslední commit, který mění produkční aplikační runtime, zůstává:

`47d8be4b51141da7e1960f2b555588b90c5a5ed8` – merge PR #17 `Fix Tindeq Repeater date parsing`.

Responsive oprava horní navigace `/tindeq` z PR #19 není součástí aktuální produkce.

## Čas a výsledek deploymentu

Aktuální produkční deployment `dpl_EgsTqXyojtoD84y11KdBukcDeR4F`:

- stav: `READY`;
- target: `production`;
- project: `vankotraining-knee`;
- exact commit: `7b9f40864b35cf75fb12d87aa0de32bd3aafeb93`;
- branch: `main`.

Parser rollout deployment `dpl_7TYSD6qnLQS4WgkkF9RsprDcetpD` doložil runtime-changing commit `47d8be4b51141da7e1960f2b555588b90c5a5ed8`, úspěšný Next.js production compile, TypeScript a statické routy včetně `/tindeq`, `/tindeq/reports` a `/tindeq/reports/demo`.

Preview runtime checkpointu PR #19 `dpl_6hupqcary9MtnVBDcN2Din21K2z7` je `READY` a bez alias error. Tento stav dokládá pouze preview nasazení, ne produkční rollout.

`READY` dokládá nasazení daného deploymentu. Produkční ověření ve smyslu project-control vyžaduje samostatné výslovné uživatelské potvrzení konkrétního funkčního toku na produkci.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref:

`zxvndqicslyulrinbpyn`.

Phase-5 active-session dedupe migrace zůstává aplikována jako:

`20260808091809 tindeq_active_session_unique`.

Repo SQL zdroj:

`supabase/migrations/20260807_tindeq_active_session_unique.sql`.

PR #17, docs-only PR #18 ani responsive PR #19 nepřidávají nebo nemění databázové schéma.

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

Produkční rollout parseru dataset nezměnil. Docs-only PR #18 ani responsive PR #19 do produkční databáze nezapisují.

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

Responsive oprava PR #19 na runtime checkpointu `316d394c9608e0f0d7729e48487d265f7b91a5c0` prošla samostatným pre-merge gate:

- `Project control` run `31332338247`: PASS;
- `Verify Tindeq client view` run `31332338254`: PASS;
- unit testy, lint baseline proti aktuálnímu `main`, production build, TypeScript, `project:check`, `git diff --check` a celý Playwright browser suite: PASS;
- nový Playwright regresní test kontroluje navigaci `/tindeq` na 390 px a 320 px a potvrzuje nulový geometrický překryv obou tlačítek a jejich setrvání uvnitř viewportu;
- preview `dpl_6hupqcary9MtnVBDcN2Din21K2z7`: `READY`, alias error `null`.

Následný kanonický evidence sync v PR #19 je docs-only a runtime checkpoint již nemění; exact živý head PR se při merge rozhodnutí resolve přes GitHub.

## Poslední výslovné uživatelské produkční ověření

Uživatel po historické remediation v produkční aplikaci ručně zkontroloval dříve problematický historický případ a potvrdil správné datum a 8 repetitions.

Tento PASS se vztahuje na historickou remediation a nikoli na nový parser runtime z PR #17.

Parser z PR #17 je produkčně nasazený, ale první nový živý klientský ZIP po tomto rollout ještě nebyl uživatelem manuálně ověřen. Proto parser workflow zatím není označen jako **produkčně ověřeno**.

Uživatel `2026-08-09` doložil screenshotem produkční responsive problém na `/tindeq`: při malé šířce viewportu se vpravo nahoře překrývají tlačítka `Otevřít reporty` a `Zpět na klienty`. Tento screenshot potvrzuje existenci produkčního UI problému, nikoli ještě produkční opravu.

## Produkční stav Tindeq

- Tindeq ZIP-only runtime je produkčně nasazený;
- opravený `parseTindeqDate()` z PR #17 je v runtime-changing commitu `47d8be4b51141da7e1960f2b555588b90c5a5ed8`;
- Tindeq datum se interpretuje jako pevný formát `YYYY-DD-MM HH:mm[:ss]`;
- kalendářní datum a čas se validují a neplatný/nepodporovaný formát failne místo heuristického odhadu;
- výpočty síly a `digest()` / dedupe identita nebyly změněny;
- historický dataset zůstává stabilní 26 aktivních + 13 soft-deleted rows;
- post-deploy HTTP/read-only smoke parser rollout je PASS;
- aktuální produkční deployment `dpl_EgsTqXyojtoD84y11KdBukcDeR4F` je `READY` na exact `main` `7b9f40864b35cf75fb12d87aa0de32bd3aafeb93`;
- responsive oprava PR #19 má preview gate PASS, ale zatím není v produkci;
- live new-client parser acceptance je stále pending.

## Známé produkční problémy

- na `/tindeq` se při malé mobilní šířce mohou v aktuální produkci stále překrývat tlačítka horní navigace; izolovaná oprava v draft PR #19 má pre-merge preview/browser gate PASS, ale čeká na samostatné merge rozhodnutí;
- první nové živé klientské měření po parser rollout zatím nebylo manuálně produkčně ověřeno;
- PR #16 je stále založený na stavu před merge PR #17 a před budoucím mergem vyžaduje rebase/reconciliation dvou kanonických project-control souborů;
- shared production Supabase má dříve existující advisory nálezy mimo rozsah parser a responsive opravy.
