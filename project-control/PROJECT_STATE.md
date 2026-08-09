# Project state

## Datum poslední kontroly

`2026-08-09` (Europe/Prague), po merge PR #19, produkčním rollout responsive opravy `/tindeq`, technickém smoke testu, read-only DB post-checku a výslovném uživatelském potvrzení na skutečném telefonu v `21:59` Europe/Prague.

## Aktuální `main` commit

Runtime-changing merge PR #19 je:

`f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2` – merge PR #19 `Fix Tindeq mobile header navigation overlap`.

- merged PR head: `0273f81da63a99f0320fdc808d543e249467bb50`;
- merge čas: `2026-08-09T19:51:57Z` (`21:51:57` Europe/Prague);
- merge metoda: standardní merge commit;
- expected-head protection byla použita proti `0273f81da63a99f0320fdc808d543e249467bb50`.

Po runtime merge vznikly pouze docs-only project-control sync commity. Jejich SHA nejsou runtime-changing checkpointy; exact živý `main` se při další práci vždy resolve přes GitHub.

## Aktivní větev a PR

PR #19 `Fix Tindeq mobile header navigation overlap` je merged / closed.

- větev: `agent/tindeq-mobile-nav-fix`;
- base před mergem: `7b9f40864b35cf75fb12d87aa0de32bd3aafeb93`;
- runtime-changing checkpoint před dvěma následnými evidence commity: `316d394c9608e0f0d7729e48487d265f7b91a5c0`;
- finální merged head: `0273f81da63a99f0320fdc808d543e249467bb50`;
- merge commit: `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- scope zůstal izolovaný na responsive layout `/tindeq`, nový CSS modul a Playwright regresní test;
- žádné změny Tindeq analýzy, auth, Supabase, persistence, schema, environment variables ani produkčních dat.

Exact-head pre-merge gate `0273f81da63a99f0320fdc808d543e249467bb50`:

- `Project control` run `31332477257`: PASS;
- `Verify Tindeq client view` run `31332477255`: PASS;
- unit testy, lint baseline, production build, TypeScript, `project:check`, `git diff --check` a Playwright/browser suite: PASS;
- mobilní regresní kontrola 390 px a 320 px: PASS, bez geometrického překryvu a s oběma tlačítky uvnitř viewportu;
- exact-head Vercel Preview `dpl_4U7kbt32jVgf7ZvFME3YPbYR9nDj`: `READY`, exact SHA `0273f81da63a99f0320fdc808d543e249467bb50`, alias error `null`.

Od runtime checkpointu `316d394c9608e0f0d7729e48487d265f7b91a5c0` do finálního headu vznikly pouze dva `project-control` evidence commity; aplikační runtime se po checkpointu nezměnil.

PR #16 `Tindeq: clarify metric interpretation states` zůstává samostatný draft:

- state: open;
- draft: ano;
- merged: ne;
- head: `904da6768fe72ed86973c93fb164dea5e1eacc87`;
- PR metadata base SHA: `8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- mergeable: false;
- nebyl při práci na PR #19 upraven ani mergnut.

## Produkční runtime commit

Runtime-changing production deployment PR #19:

`dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`

- state: `READY`;
- target: `production`;
- branch: `main`;
- exact runtime-changing commit: `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- source: GitHub;
- alias zahrnuje `knee.vankotraining.cz`;
- alias error: `null`.

Build log potvrzuje checkout `main` na `f5e4a53`, úspěšný Next.js production build, TypeScript a routy `/tindeq`, `/tindeq/reports` a `/tindeq/reports/demo` bez build failure.

Automatické Vercel deploymenty následných docs-only project-control commitů jsou pouze dokumentační rollout stejného aplikačního runtime. Runtime-changing checkpoint zůstává `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2` / `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`.

## Stav databázových migrací

Produkční Supabase: `zxvndqicslyulrinbpyn`.

Phase-5 active-session dedupe invariant zůstává přítomen:

- CHECK `tindeq_sessions_source_session_id_valid`;
- partial unique index `tindeq_sessions_active_source_session_uidx`.

PR #19 nemění databázové schéma ani data.

Fresh read-only post-check po deploymentu:

- sessions celkem: `39`;
- aktivní sessions: `26`;
- soft-deleted sessions: `13`;
- aktivní klienti: `7`;
- invalid source session IDs: `0`;
- active duplicate groups: `0`;
- aktivní sessions s chybějícím nebo nekladným `detected_repetitions`: `0`;
- CHECK přítomen;
- partial unique index přítomen.

Nebyl proveden žádný produkční DB write, DDL ani testovací klient.

## Aktuální fáze

Responsive oprava PR #19 je implementována v runtime merge `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`, nasazena na produkci, technicky ověřena exact-head CI/Playwright gatem plus produkčním build/HTTP/HTML/log smoke testem a dne `2026-08-09` v `21:59` Europe/Prague byla uživatelem výslovně potvrzena na skutečném telefonu jako funkční.

Uživatelský screenshot produkční `/tindeq` potvrzuje, že tlačítka `Otevřít reporty` a `Zpět na klienty` se nepřekrývají, zůstávají uvnitř mobilního viewportu a header vizuálně nerozbíjí navazující obsah stránky.

## Implementováno v `main`

- dosavadní Knee a Tindeq runtime;
- parser data z PR #17 s pevným formátem `YYYY-DD-MM HH:mm[:ss]` a fail-closed validací;
- produkční phase-5 Tindeq dedupe invariant;
- responsive oprava horní navigace `/tindeq` z PR #19:
  - explicitní flex/grid layout;
  - pod 600 px skládání headeru do mobilního layoutu;
  - dvě navigační akce v bezpečném dvousloupcovém gridu;
  - Playwright regresní test pro 390 px a 320 px.

## Rozpracováno mimo `main`

- PR #16 samostatně řeší prezentační stavy a vysvětlivky Tindeq metrik; zůstává draft, není součástí PR #19 a před budoucím mergem vyžaduje reconciliation proti aktuálnímu `main`;
- live new-client parser acceptance po PR #17 zůstává samostatně pending.

## Nasazeno

- responsive runtime merge: `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- runtime-changing production deployment: `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`, `READY`, target `production`;
- produkční alias: `knee.vankotraining.cz`;
- `/tindeq`: HTTP `200`, produkční HTML obsahuje nový `mobileHeader`, `nav` a `link` layout;
- `/tindeq/reports/demo`: HTTP `200`;
- error/fatal runtime logy runtime-changing deploymentu v post-deploy okně: žádné nalezené;
- produkční DB beze změny.

## Produkčně ověřeno

Responsive oprava PR #19 je **produkčně ověřena uživatelem**. Uživatel dne `2026-08-09` v `21:59` Europe/Prague otevřel produkční `/tindeq` na skutečném telefonu a výslovně potvrdil stav jako `V pořádku`; přiložený screenshot zobrazuje obě navigační tlačítka bez překryvu a uvnitř mobilního viewportu.

Parser z PR #17 je produkčně nasazený, ale první nový živý klientský ZIP po parser rollout stále čeká na samostatnou manuální acceptance; tento pending bod nesouvisí s PR #19.

## Známé problémy

- live new-client parser acceptance zůstává samostatně pending;
- PR #16 zůstává samostatný draft a před budoucím mergem vyžaduje reconciliation proti aktuálnímu `main`;
- dříve existující shared-production Supabase advisory nálezy jsou mimo scope PR #19.

## Další krok

- PR #19 je uzavřen a nevyžaduje další zásah; další práce patří do samostatného parser acceptance nebo do odděleného PR #16 podle dalšího rozhodnutí uživatele.
