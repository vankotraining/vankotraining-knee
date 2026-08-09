# Production status

## Datum poslední kontroly

`2026-08-09` (Europe/Prague), po merge a produkčním rollout PR #19 `Fix Tindeq mobile header navigation overlap`.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Runtime-changing produkční deployment PR #19

`dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`

Ověřený stav:

- state: `READY`;
- target: `production`;
- branch: `main`;
- exact runtime-changing commit: `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- GitHub commit message: merge PR #19 `Fix Tindeq mobile header navigation overlap`;
- alias obsahuje `knee.vankotraining.cz`;
- alias error: `null`.

Merge PR #19 proběhl `2026-08-09T19:51:57Z` (`21:51:57` Europe/Prague) z exact headu `0273f81da63a99f0320fdc808d543e249467bb50` s expected-head protection.

Tento následný project-control sync je docs-only. Pokud jeho commit automaticky vytvoří novější Vercel production deployment, jde pouze o dokumentační rollout stejného runtime; runtime-changing checkpoint zůstává `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2` a deployment `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`.

## Production build evidence

Build log deploymentu `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq` potvrzuje:

- clone `github.com/vankotraining/vankotraining-knee`;
- branch `main`;
- commit `f5e4a53`;
- Next.js `16.2.10` production build;
- `Compiled successfully`;
- TypeScript PASS;
- statické routy `/`, `/tindeq`, `/tindeq/reports`, `/tindeq/reports/demo` vygenerované;
- `Build Completed` bez build failure;
- deployment dokončen standardním GitHub → Vercel rolloutem, bez manuálního druhého runtime deploymentu.

## Pre-merge exact-head gate PR #19

Final merged head:

`0273f81da63a99f0320fdc808d543e249467bb50`

- `Project control` run `31332477257`: PASS;
- `Verify Tindeq client view` run `31332477255`: PASS;
- unit testy: PASS;
- lint baseline: PASS;
- production build: PASS;
- TypeScript: PASS;
- `project:check`: PASS;
- `git diff --check` / whitespace check: PASS;
- Playwright/browser suite: PASS;
- responsive regresní test 390 px + 320 px: PASS, bez geometrického překryvu tlačítek a s oběma boxy uvnitř viewportu;
- exact-head Vercel Preview `dpl_4U7kbt32jVgf7ZvFME3YPbYR9nDj`: `READY`, exact head `0273f81da63a99f0320fdc808d543e249467bb50`, alias error `null`.

Runtime-changing checkpoint před dvěma následnými docs-only evidence commity byl `316d394c9608e0f0d7729e48487d265f7b91a5c0`. Změny mezi `316d394...` a `0273f81...` byly pouze `project-control` evidence sync; aplikační runtime se nezměnil.

## Produkční smoke po rollout PR #19

Read-only kontrola:

- `/tindeq`: HTTP `200`;
- produkční HTML `/tindeq` obsahuje nový `mobileHeader`, `nav` a `link` CSS-module layout i oba odkazy `Otevřít reporty` a `Zpět na klienty`;
- `/tindeq/reports/demo`: HTTP `200`;
- error/fatal runtime logy deploymentu `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq` v post-deploy okně: žádné nalezené.

Samostatný produkční browser geometry run na 390 px / 320 px nebyl přes dostupné připojené produkční browser nástroje spuštěn. Browser geometrie je technicky doložena exact-head Playwright gatem před mergem; produkční rollout je navíc doložen exact runtime SHA, READY deploymentem, HTML/HTTP smoke a čistými runtime logy. Toto se neoznačuje jako uživatelské manuální ověření.

## Produkční Supabase

Project ref:

`zxvndqicslyulrinbpyn`

PR #19 neobsahuje Supabase změny, migrace, DDL ani data write. Fresh read-only post-check:

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

## Databázový invariant

Repo SQL zdroj:

`supabase/migrations/20260807_tindeq_active_session_unique.sql`

Aktivní dedupe identita je chráněna kombinací:

- CHECK validující 20znakový lowercase hex `raw_metadata ->> 'tindeqSessionId'`;
- partial unique indexem nad `(athlete_id, analysis_version, raw_metadata ->> 'tindeqSessionId') WHERE deleted_at IS NULL`.

## Stav PR #16

PR #16 `Tindeq: clarify metric interpretation states` zůstává mimo tento rollout:

- open;
- draft;
- merged: ne;
- head `904da6768fe72ed86973c93fb164dea5e1eacc87`;
- mergeable: false;
- nebyl upraven ani mergnut v rámci PR #19.

## Parser acceptance

Parser data z PR #17 zůstává produkčně nasazený. První nový živý klientský ZIP po parser rollout stále nemá explicitní uživatelskou acceptance, takže parser workflow zůstává samostatně pending a PR #19 tento stav nemění.

## Produkční stav responsive opravy

- **implementováno:** ano, v runtime merge `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- **nasazeno:** ano, runtime-changing deployment `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`, `READY`, target `production`;
- **technicky ověřeno:** ano, exact-head CI/Playwright 390 px + 320 px, production build, HTTP/HTML smoke a error/fatal log check;
- **produkčně ověřeno uživatelem na skutečném telefonu:** ne, čeká na explicitní potvrzení uživatele.

## Poslední manuální krok pro PR #19

Otevřít produkční `/tindeq` na skutečném telefonu a potvrdit, že tlačítka `Otevřít reporty` a `Zpět na klienty` se již nepřekrývají, zůstávají uvnitř viewportu a header nerozbíjí zbytek stránky.
