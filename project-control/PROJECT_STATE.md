# Project state

## Datum poslední kontroly

`2026-08-09` (Europe/Prague), po merge PR #19, produkčním rollout responsive opravy `/tindeq`, technickém smoke testu a read-only DB post-checku.

## Runtime-changing `main` checkpoint

Responsive oprava mobilní navigace byla mergnuta jako PR #19 `Fix Tindeq mobile header navigation overlap`.

- merged PR head: `0273f81da63a99f0320fdc808d543e249467bb50`;
- runtime-changing merge commit: `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- merge čas: `2026-08-09T19:51:57Z` (`21:51:57` Europe/Prague);
- merge metoda: standardní merge commit;
- expected-head protection byla použita proti `0273f81da63a99f0320fdc808d543e249467bb50`.

Tento project-control sync je čistě dokumentační potomek runtime checkpointu `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`. Jeho vlastní budoucí SHA nelze korektně self-referencovat uvnitř stejného commitu; exact živý `main` se při další práci vždy resolve přes GitHub. Dokumentační SHA není nový runtime-changing checkpoint.

## Pull requesty

### PR #19 `Fix Tindeq mobile header navigation overlap`

- stav: merged / closed;
- větev: `agent/tindeq-mobile-nav-fix`;
- base před mergem: `7b9f40864b35cf75fb12d87aa0de32bd3aafeb93`;
- runtime-changing checkpoint před docs-only evidence syncem: `316d394c9608e0f0d7729e48487d265f7b91a5c0`;
- finální merged head: `0273f81da63a99f0320fdc808d543e249467bb50`;
- merge commit: `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- scope zůstal izolovaný na responsive layout `/tindeq`, nový CSS modul a Playwright regresní test;
- žádné změny Tindeq analýzy, auth, Supabase, persistence, schema, environment variables ani produkčních dat.

Exact-head pre-merge gate `0273f81da63a99f0320fdc808d543e249467bb50`:

- `Project control` run `31332477257`: PASS;
- `Verify Tindeq client view` run `31332477255`: PASS;
- unit testy: PASS;
- lint baseline: PASS;
- production build: PASS;
- TypeScript: PASS;
- `project:check`: PASS;
- `git diff --check` / whitespace check: PASS;
- Playwright/browser suite: PASS;
- mobilní regresní kontrola 390 px a 320 px: PASS, bez geometrického překryvu a s oběma tlačítky uvnitř viewportu;
- exact-head Vercel Preview `dpl_4U7kbt32jVgf7ZvFME3YPbYR9nDj`: `READY`, exact SHA `0273f81da63a99f0320fdc808d543e249467bb50`, alias error `null`.

Od runtime checkpointu `316d394c9608e0f0d7729e48487d265f7b91a5c0` do finálního headu vznikly pouze dva project-control/evidence commity; aplikační runtime se po tomto checkpointu nezměnil.

### PR #16 `Tindeq: clarify metric interpretation states`

Fresh stav po merge PR #19:

- stav: open;
- draft: ano;
- merged: ne;
- head: `904da6768fe72ed86973c93fb164dea5e1eacc87`;
- PR metadata base SHA zůstává `8afe1328cfcb8f7ab90bb449775d1de0d441b584`;
- GitHub uvádí `mergeable: false`;
- PR #16 nebyl při práci na PR #19 upraven ani mergnut a zůstává samostatným budoucím krokem.

## Produkční deployment responsive opravy

Runtime-changing produkční rollout PR #19:

`dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`

Vercel metadata:

- state: `READY`;
- target: `production`;
- branch: `main`;
- exact commit: `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- source: GitHub;
- alias zahrnuje `knee.vankotraining.cz`;
- alias error: `null`.

Build log potvrzuje checkout `main` na `f5e4a53`, úspěšný Next.js production build, TypeScript a vygenerované routy `/tindeq`, `/tindeq/reports` a `/tindeq/reports/demo` bez build failure.

Případný automatický Vercel deployment tohoto následného docs-only project-control commitu je pouze dokumentační rollout stejného aplikačního runtime. Runtime-changing produkční checkpoint zůstává `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2` / `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`.

## Produkční technické ověření

Po rollout PR #19 bylo read-only ověřeno:

- `/tindeq`: HTTP `200` a produkční HTML obsahuje nový `mobileHeader`, `nav` a `link` CSS module layout s oběma navigačními odkazy;
- `/tindeq/reports/demo`: HTTP `200`;
- error/fatal runtime logy deploymentu `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq` v post-deploy okně: žádné nalezené;
- build: Next.js compile + TypeScript PASS.

Samostatný produkční browser geometry run na 390 px / 320 px nebyl v tomto kroku technicky dostupný přes připojené produkční browser nástroje. Browser geometrie je proto doložena exact-head Playwright gatem na 390 px a 320 px před mergem, zatímco produkce je doložena exact runtime SHA, READY deploymentem, HTML/HTTP smoke a runtime logy. Toto je technické ověření, ne uživatelské potvrzení na skutečném telefonu.

## Produkční Supabase `zxvndqicslyulrinbpyn`

PR #19 nemění databázi. Fresh read-only post-check po deploymentu:

- sessions celkem: `39`;
- aktivní sessions: `26`;
- soft-deleted sessions: `13`;
- aktivní klienti: `7`;
- invalid source session IDs: `0`;
- active duplicate groups: `0`;
- aktivní sessions s chybějícím nebo nekladným `detected_repetitions`: `0`;
- CHECK `tindeq_sessions_source_session_id_valid`: přítomen;
- partial unique index `tindeq_sessions_active_source_session_uidx`: přítomen.

Dataset a dedupe invariants zůstaly beze změny; nebyl proveden žádný produkční DB write, DDL ani testovací klient.

## Implementováno v `main`

- dosavadní Knee a Tindeq runtime;
- parser data z PR #17 s pevným formátem `YYYY-DD-MM HH:mm[:ss]` a fail-closed validací;
- produkční phase-5 Tindeq dedupe invariant;
- responsive oprava horní navigace `/tindeq` z PR #19:
  - explicitní flex/grid layout;
  - pod 600 px skládání headeru do mobilního layoutu;
  - dvě navigační akce v bezpečném dvousloupcovém gridu;
  - Playwright regresní test pro 390 px a 320 px.

## Nasazeno

- responsive runtime merge: `f5e4a53c0aa00a1a1c046b22a5968e192fdb36a2`;
- runtime-changing production deployment: `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`, `READY`, target `production`;
- produkční alias: `knee.vankotraining.cz`;
- parser runtime z PR #17 zůstává součástí stejného produkčního stromu;
- produkční DB beze změny.

## Produkčně ověřeno uživatelem

Responsive oprava PR #19 zatím **není označena jako produkčně ověřená uživatelem**. Automatizované CI/browser preview, READY production deployment, HTTP/HTML smoke, build a log kontroly jsou technické evidence a nenahrazují ruční kontrolu na skutečném telefonu.

Parser z PR #17 je produkčně nasazený, ale první nový živý klientský ZIP po parser rollout stále čeká na samostatnou manuální acceptance; tento pending bod nesouvisí s PR #19.

## Známé otevřené body

- manuální kontrola produkčního `/tindeq` na skutečném telefonu pro potvrzení, že `Otevřít reporty` a `Zpět na klienty` se již nepřekrývají;
- live new-client parser acceptance zůstává samostatně pending;
- PR #16 zůstává samostatný draft a před budoucím mergem vyžaduje reconciliation proti aktuálnímu `main`;
- dříve existující shared-production Supabase advisory nálezy jsou mimo scope PR #19.

## Další krok

Pro responsive opravu je jediný zbývající manuální krok: otevřít produkční `/tindeq` na skutečném telefonu a potvrdit, že se obě horní navigační tlačítka nepřekrývají a zůstávají použitelná.
