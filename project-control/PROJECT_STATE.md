# Project state

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po merge PR #22 a technickém ověření produkčního deploymentu.

## Aktuální `main` commit

Poslední runtime-changing commit před tímto docs-only syncem:

`ec7979e233f846e4af3cdb740c1265150722b27b` – `Merge PR #22: Fix Tindeq duplicate detection for re-exported ZIPs`.

Tento project-control sync je pouze dokumentační a nemění runtime logiku.

## Aktivní větev a PR

PR #22 `Fix Tindeq duplicate detection for re-exported ZIPs` je **merged**.

- merged at: `2026-08-22T15:17:32Z`;
- merge commit: `ec7979e233f846e4af3cdb740c1265150722b27b`;
- žádný další runtime PR pro tuto opravu není otevřený.

## Produkční runtime commit

PR #22 je nasazený v produkci přes deployment:

- deployment: `dpl_DwAn14ANzVWFZBYk6i6bXyhttyct`;
- commit: `ec7979e233f846e4af3cdb740c1265150722b27b`;
- stav: `READY`;
- target: `production`;
- alias obsahuje `knee.vankotraining.cz`;
- `GET /tindeq` po deploymentu vrátil HTTP 200;
- post-deploy Vercel log check nenašel `warning`, `error` ani `fatal`.

## Stav databázových migrací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

PR #22 nepřidává DB migraci, DDL, RLS/policy/grant/Auth změnu ani automatické čištění dat.

Existující UNIQUE index nad `(athlete_id, analysis_version, raw_metadata->>'tindeqSessionId')` zůstává beze změny. Nové save operace nyní používají stabilní SHA-256 semantic `tindeqSessionId` ve formátu `v2:<64 hex>`; historické rows s legacy ID pokrývá semantic fallback.

## Aktuální fáze

Implementace, merge a technický produkční deployment PR #22 jsou dokončené.

Zbývá funkční produkční acceptance: na telefonu znovu sdílet stejné měření Rosová Štěpánka `14. 8. 2026 14:31` a potvrdit save. Očekávaný výsledek je `Měření již uloženo` / `již dříve uloženo – nevytvořen nový záznam` a žádný nový aktivní DB row.

## Implementováno v `main`

PR #22 přidává dvě vrstvy ochrany proti duplicitám:

- stabilní semantic SHA-256 ID pro nové save;
- backward-compatible obsahový fallback pro historické rows s legacy ID.

Stávající UI při `duplicate: true` zobrazuje, že měření již bylo uloženo a nový záznam nevznikl.

Pre-merge exact-head gate `9590068bf04cce4807f22947f63ee3e9a051543f` prošel:

- `Project control` run `32581024950`: success;
- `Verify Tindeq client view` run `32581024910`: success;
- Vercel Preview: success;
- bez unresolved review threads.

## Rozpracováno mimo `main`

Pro PR #22 není rozpracovaný další runtime patch.

Produkční funkční acceptance a případné následné vyčištění testovací duplicity jsou samostatné kroky; odstranění dat není schválené.

## Nasazeno

- PR #21 Android share receiver: ano;
- PR #22 duplicate detection fix: ano;
- produkční deployment PR #22 `dpl_DwAn14ANzVWFZBYk6i6bXyhttyct`: `READY`.

## Produkčně ověřeno

- PR #21 Android share/import tok: **ano**;
- PR #22 technicky nasazeno na produkci: **ano**;
- produkční `/tindeq` po PR #22: **HTTP 200**;
- PR #22 funkční duplicate-save acceptance na skutečném telefonu: **zatím ne**.

## Známé problémy

- během původního produkčního testu vznikl potvrzený duplicitní row `eacaecc9-9185-4cb8-8e52-561872e49cd5`; původní row je `b65d0e32-6e68-407c-9d3f-385112111ea9`;
- testovací duplicate row zůstává aktivní a nebyl bez explicitního souhlasu smazán ani soft-deleted;
- funkční produkční acceptance PR #22 ještě čeká na opakovaný save test;
- první production Android share pokus PR #21 jednou transientně selhal, další pokusy uspěly;
- full-repo lint baseline obsahuje předexistující `3 errors / 1 warning`; PR #22 nepřidal novou lint regresi.

## Další krok

- Na telefonu znovu sdílet stejné měření Rosová Štěpánka `14. 8. 2026 14:31`, zvolit stejného klienta a potvrdit save; poté ověřit UI duplicate hlášku a read-only zkontrolovat, že nepřibyl nový aktivní DB row.
