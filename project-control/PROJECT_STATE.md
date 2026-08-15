# Project state

## Datum poslední kontroly

`2026-08-15` (Europe/Prague), během implementace izolovaného Android native share receiveru pro Tindeq ZIP v draft PR #21. Fresh audit ověřil `main`, otevřené PR, Tindeq parser/persistence/auth, test stack a Vercel deploymenty. Produkční aplikace ani produkční databáze nebyly v rámci PR #21 měněny.

## Aktuální `main` commit

Aktuální `main`:

`d829c086c8013187cb38e26ea77bc63b178fcff2` – `Record PR #20 production acceptance`.

Aktuální runtime-changing produkční checkpoint zůstává:

`1b48da7ed9340e8f53f591f3b427d4d6758246e1` – `Add safe client name editing (#20)`.

Následné `project-control` commity na `main` jsou docs-only a aplikační runtime ani databázi nemění.

## Aktivní větev a PR

Draft PR #21 `Add local Android Tindeq share receiver` je otevřený a **nesmí být mergován před reálným Android acceptance gate**.

- branch: `agent/tindeq-android-share-receiver`;
- exact base: `main@d829c086c8013187cb38e26ea77bc63b178fcff2`;
- implementační head před tímto dokumentačním syncem: `d1d98ec91948c252b0cbc74f8422f722e55fbd4b`;
- PR vznikl z fresh `main` a před implementací nebyl otevřený jiný PR;
- scope je pouze Android share receiver + lokální web transport do existujícího Tindeq parseru + testy/dokumentace;
- žádná DB migrace, Supabase schema/policy změna ani serverový ZIP endpoint.

## Produkční runtime commit

Runtime-changing production checkpoint zůstává PR #20:

- commit: `1b48da7ed9340e8f53f591f3b427d4d6758246e1`;
- deployment: `dpl_2MpCHrW6vhsReXuWn5kJyZL958SV`;
- stav: `READY`;
- target: `production`;
- branch: `main`.

Fresh poslední produkční deployment nad aktuálním `main@d829c086c8013187cb38e26ea77bc63b178fcff2` je docs-only `dpl_B5ogPtD6BNsTbUdahMwX31e8zfzj`, `READY`. Runtime kód PR #20 tím není změněn.

PR #21 je pouze na Preview a není produkčně nasazený.

## Stav databázových migrací

Produkční Supabase: `zxvndqicslyulrinbpyn`.

PR #21 nevyžaduje a neprovádí žádnou DB migraci, DDL, RLS/policy/grant/Auth změnu ani produkční datový write. Tindeq structured-result persistence a existující dedupe invariant zůstávají beze změny.

Originální Tindeq ZIP se v PR #21 nepřidává do Supabase Storage, databáze ani jiného serverového úložiště.

## Aktuální fáze

PR #21 je **implementovaný na feature branch, automatizovaně build/test ověřený a nasazený na Vercel Preview**, ale zatím není možné provést platný Android Digital Asset Links acceptance test, protože branch Preview je chráněný Vercel Authentication a anonymní request je přesměrován na Vercel SSO.

Android CI nad implementací úspěšně sestavil podepsaný preview APK a prošel Android unit testy. Webová CI nad stejnou webovou implementací prošla unit testy, lint baseline comparison, build, TypeScript, project-control, whitespace a Playwright E2E.

## Implementováno v `main`

PR #21 zatím není v `main`.

Produkční implementace z PR #20 a dřívějších Tindeq PR zůstává beze změny.

## Rozpracováno mimo `main`

PR #21 implementuje:

- Android `ACTION_SEND` receiver pro jeden ZIP;
- lokální kopii pouze do app-private `cacheDir/tindeq-share`, max. 32 MB, TTL 30 minut;
- validaci podporovaného ZIPu a ZIP signature před browser transferem;
- Trusted Web Activity / Custom Tabs `postMessage` transport po úspěšném Digital Asset Links origin validation;
- chunkovaný lokální transport 128 KiB a SHA-256 kontrolu integrity;
- rekonstrukci browser `File` a předání do stejného `importTindeqArchive(file)` jako ruční upload;
- zachování explicitního `Uložit měření ke klientovi`; share import sám nic do Supabase neukládá;
- App Link omezený na `/tindeq` pro bezpečný auth/resume flow;
- `public/.well-known/assetlinks.json` pro aktuální ephemeral preview signing fingerprint.

Preview origin připnutý v Android buildu:

`https://vankotraining-knee-git-agent-tin-19838f-vankotrainings-projects.vercel.app`

Aktuální preview signing fingerprint:

`B9:7F:94:BA:0D:C6:EC:46:FC:94:8B:3C:57:24:EC:A7:95:B9:92:7E:F9:4C:F9:E9:33:C1:B9:B7:C5:E2:D7:2A`.

## Nasazeno

Produkce:

- PR #21: **ne**.

Preview:

- Vercel deployment `dpl_9xDFinsNq3Du1E99uEYYrg3mKLAa`: `READY` nad `d1d98ec91948c252b0cbc74f8422f722e55fbd4b` před následným assetlinks/docs syncem;
- stable branch alias: `https://vankotraining-knee-git-agent-tin-19838f-vankotrainings-projects.vercel.app`;
- Android workflow run `31911229864`: success;
- preview APK artifact ID `9253720882`;
- APK signing fingerprint viz výše.

Vercel Preview je aktuálně chráněný Vercel Authentication. To je blocker pro veřejné načtení `/.well-known/assetlinks.json` Androidem/Chromem a tedy pro platné DAL/TWA device ověření.

## Produkčně ověřeno

PR #21: **ne**.

Android Share Target workflow nesmí být označen jako produkčně ověřený na základě CI, Vercel Preview nebo desktop/browser testu. Vyžaduje explicitní potvrzení uživatele po testu na skutečném Android telefonu.

Dřívější produkční acceptance PR #16, parseru PR #17, responsive opravy PR #19 a PR #20 zůstávají platné.

## Známé problémy

- blocker PR #21 Preview acceptance: Vercel Authentication chrání branch Preview a anonymní request na Preview origin je redirectován na Vercel SSO; Digital Asset Links potřebuje veřejně dostupný přesný `/.well-known/assetlinks.json` bez auth cookie/query bypassu;
- preferovaná oprava je Deployment Protection Exception pouze pro přesný preview alias, pokud ji aktuální Vercel plan umožňuje; projektové vypnutí Preview Authentication by zpřístupnilo i ostatní preview a nesmí se provést bez explicitního rozhodnutí uživatele;
- preview APK používá ephemeral signing certifikát; jakýkoli nový Android rebuild změní fingerprint a vyžaduje nový `assetlinks.json` i přeinstalaci APK;
- produkční Android distribuce/signing zatím není součástí PR #21; po acceptance bude potřeba persistentní release nebo Play App Signing certifikát;
- full-repo lint baseline nadále obsahuje předexistující chyby/warning; PR CI ověřuje, že PR nepřidává lint regresi;
- neblokující UX discoverability `Upravit klienta` zůstává mimo scope.

## Další krok

- Zpřístupnit pouze přesný PR #21 Preview origin pro Digital Asset Links (preferovaně branch-specific Deployment Protection Exception), ověřit veřejný HTTP 200 JSON na `/.well-known/assetlinks.json` a teprve poté provést reálný Android Sharesheet acceptance test s finálním APK artifactem.
