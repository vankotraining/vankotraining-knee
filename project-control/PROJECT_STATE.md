# Project state

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po merge a technickém produkčním ověření hotfixu PR #23.

## Aktuální `main` commit

Poslední runtime-changing commit před tímto project-control syncem:

`59e7f362652e2eedff1e5e7764bbc05181ee1aa2` – `Merge PR #23: Fix Tindeq stable ID DB constraint compatibility`.

Tento project-control sync je dokumentační a nemění runtime logiku.

## Aktivní větev a PR

PR #23 `Fix Tindeq stable ID DB constraint compatibility` je **merged a closed**.

- merged at: `2026-08-22T15:59:22Z`;
- merge commit: `59e7f362652e2eedff1e5e7764bbc05181ee1aa2`;
- pre-merge exact head: `0239093b5db96af89dab81d669894e717aa207ec`;
- `Verify Tindeq client view` run `32582271916`: success;
- `Project control` run `32582271918`: success;
- Vercel Preview: success;
- unresolved review threads: none.

## Produkční runtime commit

PR #23 je nasazený v produkci:

- deployment: `dpl_GdVMkTenqui48VLoHNBaVDPHSr4f`;
- commit: `59e7f362652e2eedff1e5e7764bbc05181ee1aa2`;
- state: `READY`;
- target: `production`;
- alias: `knee.vankotraining.cz`;
- `GET /tindeq`: HTTP 200;
- post-deploy log check: žádný `warning`, `error` ani `fatal`.

## Stav databázových migrací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

Fresh read-only audit potvrdil existující CHECK:

`CHECK (COALESCE((raw_metadata->>'tindeqSessionId') ~ '^[0-9a-f]{20}$', false))`

PR #23 nepřidává DB migraci, DDL ani RLS/policy/grant/Auth změnu. Semantic SHA-256 identita se nově ukládá jako prvních 10 bytů digestu = přesně `20` lowercase hex znaků, takže je kompatibilní s existujícím CHECK i UNIQUE indexem. Historické rows s legacy ID nadále pokrývá semantic fallback.

## Aktuální fáze

- PR #21 Android share/import: produkčně ověřen;
- PR #22 semantic duplicate detection: implementován, ale původní `v2:<64 hex>` reprezentace selhala na DB CHECK;
- PR #23 DB-compatibility hotfix: implementován, mergovaný a produkčně nasazený;
- zbývá funkční production acceptance na reálném telefonu.

## Produkčně ověřeno

PR #23 technický deployment: **ano**.

PR #23 funkční duplicate-save acceptance: **zatím ne**.

Očekávaný acceptance test: znovu sdílet stejné měření Rosová Štěpánka `14. 8. 2026 14:31`, potvrdit save a očekávat `Měření již uloženo` / `již dříve uloženo – nevytvořen nový záznam`.

## Produkční data

Před PR #22 vznikly dva potvrzené aktivní rows stejného testovacího měření:

- původní: `b65d0e32-6e68-407c-9d3f-385112111ea9`;
- testovací duplicita: `eacaecc9-9185-4cb8-8e52-561872e49cd5`.

Post-PR #22 pokus s nekompatibilním ID byl CHECK constraintem odmítnut a třetí row nevznikl. Ani PR #23 neprovádí automatické čištění produkčních dat.

## Známé problémy

- testovací duplicate row `eacaecc9-9185-4cb8-8e52-561872e49cd5` zůstává aktivní a nebyl bez explicitního souhlasu odstraněn;
- PR #23 ještě čeká na funkční produkční duplicate-save acceptance;
- první production Android share pokus PR #21 jednou transientně selhal, další pokusy uspěly;
- full-repo lint baseline obsahuje předexistující chyby/warning; PR #23 nepřidal novou lint regresi.

## Další krok

Na telefonu znovu sdílet stejné měření Rosová Štěpánka `14. 8. 2026 14:31`, zvolit stejného klienta a potvrdit save. Poté read-only ověřit, že počet aktivních DB rows zůstává `2` a UI správně hlásí duplicitu.
