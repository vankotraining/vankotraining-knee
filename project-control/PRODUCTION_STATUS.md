# Production status

## Datum poslední kontroly

`2026-08-09` (Europe/Prague), po merge a produkčním rollout PR #19 `Fix Tindeq mobile header navigation overlap`.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Runtime-changing production deployment PR #19:

`dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`

Ověřený stav:

- state: `READY`;
- target: `production`;
- branch: `main`;
- exact runtime-changing commit: `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- alias obsahuje `knee.vankotraining.cz`;
- alias error: `null`.

Merge PR #19 proběhl `2026-08-09T19:51:57Z` (`21:51:57` Europe/Prague) z exact headu `0273f81da63a99f0320fdc808d543e249467bb50` s expected-head protection.

Následný project-control sync je docs-only. Pokud jeho commit automaticky vytvoří novější Vercel production deployment, jde pouze o dokumentační rollout stejného runtime; runtime-changing checkpoint zůstává `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2` a deployment `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`.

## Nasazený commit

Runtime-changing commit je:

`f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2` – merge PR #19 `Fix Tindeq mobile header navigation overlap`.

Merged PR head: `0273f81da63a99f0320fdc808d543e249467bb50`.

Docs-only project-control potomci tohoto commitu nejsou nové runtime-changing checkpointy.

## Čas a výsledek deploymentu

Build log deploymentu `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq` potvrzuje:

- clone `github.com/vankotraining/vankotraining-knee`;
- branch `main`;
- commit `f5e4a53`;
- Next.js `16.2.10` production build;
- `Compiled successfully`;
- TypeScript PASS;
- routy `/`, `/tindeq`, `/tindeq/reports`, `/tindeq/reports/demo` vygenerované;
- `Build Completed` bez build failure;
- deployment dokončen standardním GitHub → Vercel rolloutem, bez manuálního druhého runtime deploymentu.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref:

`zxvndqicslyulrinbpyn`

PR #19 neobsahuje Supabase změny, migrace, DDL ani data write.

Repo SQL zdroj dedupe invariantu:

`supabase/migrations/20260807_tindeq_active_session_unique.sql`

Fresh read-only post-check:

- sessions celkem: `39`;
- aktivní sessions: `26`;
- soft-deleted sessions: `13`;
- aktivní klienti: `7`;
- invalid source session IDs: `0`;
- active duplicate groups: `0`;
- aktivní sessions s chybějícím nebo nekladným `detected_repetitions`: `0`;
- CHECK `tindeq_sessions_source_session_id_valid`: přítomen;
- partial unique index `tindeq_sessions_active_source_session_uidx`: přítomen.

Produkční dataset po rollout zůstal beze změny.

## Provedené smoke testy

Pre-merge final head `0273f81da63a99f0320fdc808d543e249467bb50`:

- `Project control` run `31332477257`: PASS;
- `Verify Tindeq client view` run `31332477255`: PASS;
- unit testy, lint baseline, production build, TypeScript, `project:check`, `git diff --check` a Playwright/browser suite: PASS;
- responsive regresní test 390 px + 320 px: PASS, bez geometrického překryvu tlačítek a s oběma boxy uvnitř viewportu;
- exact-head Vercel Preview `dpl_4U7kbt32jVgf7ZvFME3YPbYR9nDj`: `READY`, exact head `0273f81da63a99f0320fdc808d543e249467bb50`, alias error `null`.

Runtime-changing checkpoint před dvěma následnými docs-only evidence commity byl `316d394c9608e0f0d7729e48487d265f7b91a5c0`; změny mezi `316d394...` a `0273f81...` byly pouze `project-control` evidence sync.

Produkční read-only smoke po rollout PR #19:

- `/tindeq`: HTTP `200`;
- produkční HTML `/tindeq` obsahuje nový `mobileHeader`, `nav` a `link` CSS-module layout i odkazy `Otevřít reporty` a `Zpět na klienty`;
- `/tindeq/reports/demo`: HTTP `200`;
- error/fatal runtime logy deploymentu `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq` v post-deploy okně: žádné nalezené.

Samostatný produkční browser geometry run na 390 px / 320 px nebyl přes dostupné připojené produkční browser nástroje spuštěn. Browser geometrie je technicky doložena exact-head Playwright gatem před mergem; produkční rollout je navíc doložen exact runtime SHA, `READY` deploymentem, HTML/HTTP smoke a čistými runtime logy.

## Poslední výslovné uživatelské produkční ověření

Historická Tindeq datová remediation byla uživatelem dříve ručně potvrzena na problematickém historickém případě se správným datem a 8 repetitions.

Parser data z PR #17 je produkčně nasazený, ale první nový živý klientský ZIP po parser rollout stále nemá explicitní uživatelskou acceptance.

Responsive oprava PR #19 zatím nemá explicitní uživatelské potvrzení na skutečném telefonu. Automatizované technické evidence tento krok nenahrazují.

## Produkční stav Tindeq

- Tindeq runtime je produkčně nasazený;
- parser oprava PR #17 zůstává součástí produkčního runtime;
- responsive oprava PR #19 je implementována v runtime merge `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- runtime-changing deployment `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq` je `READY`, target `production`;
- technické ověření: exact-head CI/Playwright 390 px + 320 px, production build, HTTP/HTML smoke a error/fatal log check;
- produkční DB: beze změny;
- produkčně ověřeno uživatelem na skutečném telefonu: zatím ne.

PR #16 `Tindeq: clarify metric interpretation states` zůstává mimo tento rollout: open, draft, merged: ne, head `904da6768fe72ed86973c93fb164dea5e1eacc87`, mergeable false a nebyl v rámci PR #19 upraven.

## Známé produkční problémy

- pro responsive opravu PR #19 zbývá pouze ruční kontrola na skutečném telefonu;
- live new-client parser acceptance zůstává samostatně pending;
- PR #16 zůstává samostatný draft a před budoucím mergem vyžaduje reconciliation proti aktuálnímu `main`;
- dříve existující shared-production Supabase advisory nálezy jsou mimo scope PR #19.
