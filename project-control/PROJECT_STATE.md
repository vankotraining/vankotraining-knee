# Project state

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po produkčním duplicate-save testu PR #22, který odhalil nekompatibilitu nového stable ID s existujícím DB CHECK constraintem, a po zeleném CI/Preview gate hotfixu PR #23.

## Aktuální `main` commit

Aktuální `main` před merge PR #23:

`2fe99608985312c3dfc72fa2f7b9d914b2b83955` – docs-only `Sync project control after PR #22 deployment`.

Poslední runtime-changing commit:

`ec7979e233f846e4af3cdb740c1265150722b27b` – `Merge PR #22: Fix Tindeq duplicate detection for re-exported ZIPs`.

## Aktivní větev a PR

Aktivní hotfix je PR #23 `Fix Tindeq stable ID DB constraint compatibility`.

- branch: `agent/tindeq-stable-id-check-hotfix`;
- base: `main@2fe99608985312c3dfc72fa2f7b9d914b2b83955`;
- runtime/test head před tímto project-control syncem: `c423cb15fef6763918cfe5f34c150c70049e7282`;
- PR #23 je zatím nemergovaný;
- merge pouze po fresh zeleném exact-head gate a explicitním souhlasu uživatele.

## Produkční runtime commit

Produkční runtime stále obsahuje PR #22:

- runtime commit: `ec7979e233f846e4af3cdb740c1265150722b27b`;
- deployment: `dpl_DwAn14ANzVWFZBYk6i6bXyhttyct`;
- stav: `READY`;
- target: `production`;
- alias: `knee.vankotraining.cz`.

PR #23 je zatím pouze Preview a není v produkci.

## Stav databázových migrací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Fresh read-only audit potvrdil constraint:

`CHECK (COALESCE((raw_metadata->>'tindeqSessionId') ~ '^[0-9a-f]{20}$', false))`

PR #22 generoval stable semantic ID jako `v2:<64 hex>`, což tento constraint odmítá. PR #23 proto zachovává SHA-256 semantic identitu, ale ukládá prvních 10 bytů digestu jako přesně `20` lowercase hex znaků. Existující CHECK i UNIQUE index zůstávají beze změny.

PR #23 nepřidává DB migraci, DDL, RLS/policy/grant/Auth změnu ani automatickou produkční datovou mutaci.

## Aktuální fáze

Produkční test po PR #22 proběhl na skutečném telefonu. Share/import fungoval, ale explicitní save skončil chybou:

`new row for relation "tindeq_sessions" violates check constraint "tindeq_sessions_source_session_id_valid"`

Příčina je potvrzená: nový `v2:<64 hex>` stable ID neodpovídá existujícímu 20hex DB storage contractu.

Neúspěšný insert byl databází odmítnut. Dva dříve potvrzené testovací rows zůstávají aktivní a nebyly tímto pokusem změněny.

## Implementováno v `main`

V `main` je PR #22:

- semantic duplicate fallback pro historické legacy rows;
- stable semantic SHA-256 identita pro nové save;
- UI umí při `duplicate: true` zobrazit `Měření již uloženo` / `již dříve uloženo – nevytvořen nový záznam`.

Aktuální produkční problém je pouze formát stable ID před DB lookup/insertem: `v2:<64 hex>` neprojde existujícím CHECK constraintem.

## Rozpracováno mimo `main`

PR #23 provádí minimální hotfix:

- semantic payload i SHA-256 zůstávají stejné;
- stable ID je prvních 10 bytů SHA-256, tedy přesně `20` lowercase hex znaků;
- ID je stále nezávislé na názvu vnějšího ZIPu a legacy parser ID;
- historical semantic fallback zůstává beze změny;
- regresní test explicitně hlídá formát `^[0-9a-f]{20}$`.

Runtime/test head `c423cb15fef6763918cfe5f34c150c70049e7282` prošel unit testy, lint comparison, production buildem, TypeScript checkem, project-control checkem, browser Tindeq verification a Vercel Preview statusem `success`.

## Nasazeno

- PR #21 Android share receiver: ano;
- PR #22 duplicate detection fix: ano, ale jeho stable-ID formát je produkčně nekompatibilní s DB CHECK;
- PR #23 DB-compatibility hotfix: ne, zatím Preview.

## Produkčně ověřeno

- PR #21 Android share/import tok: **ano**;
- PR #22 technický deployment: **ano**;
- PR #22 funkční duplicate-save acceptance: **ne, odhalila DB CHECK chybu**;
- PR #23: **CI/Preview ověřen, zatím neprodukční**.

## Známé problémy

- produkční save s PR #22 může skončit CHECK constraint chybou kvůli `v2:<64 hex>` session ID;
- potvrzený testovací duplicate row `eacaecc9-9185-4cb8-8e52-561872e49cd5` je stále aktivní; původní row je `b65d0e32-6e68-407c-9d3f-385112111ea9`;
- oba rows zůstávají nedotčené, dokud nebude samostatně schváleno jejich případné vyčištění;
- první production Android share pokus PR #21 jednou transientně selhal, další pokusy uspěly;
- full-repo lint baseline obsahuje předexistující chyby/warning; PR #23 nepřidává novou lint regresi.

## Další krok

- Po fresh exact-head kontrole a explicitním souhlasu uživatele mergovat PR #23, ověřit produkční deployment a zopakovat stejný duplicate-save test. Očekávání: UI oznámí, že měření již existuje, a v DB nevznikne další aktivní row.
