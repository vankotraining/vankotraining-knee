# Project state

## Datum poslední kontroly

`2026-08-16` (Europe/Prague), během stabilizace Android native share receiveru pro Tindeq ZIP v draft PR #21. Produkční aplikace ani produkční databáze nebyly v rámci PR #21 měněny.

## Aktuální `main` commit

Aktuální `main` zůstává:

`d829c086c8013187cb38e26ea77bc63b178fcff2` – `Record PR #20 production acceptance`.

Aktuální runtime-changing produkční checkpoint zůstává:

`1b48da7ed9340e8f53f591f3b427d4d6758246e1` – `Add safe client name editing (#20)`.

## Aktivní větev a PR

Draft PR #21 `Add local Android Tindeq share receiver` je otevřený a nesmí být mergován bez explicitního uživatelského schválení.

- branch: `agent/tindeq-android-share-receiver`;
- base: `main@d829c086c8013187cb38e26ea77bc63b178fcff2`;
- scope: Android `ACTION_SEND` receiver + lokální TWA/MessagePort transport do existujícího Tindeq parseru + testy/dokumentace;
- žádná DB migrace, Supabase schema/policy změna ani serverový ZIP endpoint.

## Produkční runtime commit

Produkční runtime checkpoint zůstává PR #20:

- commit: `1b48da7ed9340e8f53f591f3b427d4d6758246e1`;
- deployment: `dpl_2MpCHrW6vhsReXuWn5kJyZL958SV`;
- stav: `READY`;
- target: `production`;
- branch: `main`.

PR #21 je pouze na Preview a není produkčně nasazený.

## Stav databázových migrací

Produkční Supabase: `zxvndqicslyulrinbpyn`.

PR #21 neprovádí žádnou DB migraci, DDL, RLS/policy/grant/Auth změnu ani automatický produkční datový write. Tindeq structured-result persistence a existující dedupe invariant zůstávají beze změny.

Originální Tindeq ZIP se nepřidává do Supabase Storage, databáze ani jiného serverového úložiště.

## Aktuální fáze

PR #21 je **implementovaný, automatizovaně ověřený a real-device Preview gate výrazně pokročil**.

Na skutečném Android telefonu bylo prokázáno:

- Tindeq `ACTION_SEND` dorazí do Knee;
- ZIP je lokálně staged v app-private cache;
- Chrome/TWA session a Digital Asset Links `use_as_origin` validace projdou;
- `postMessage` channel se vytvoří a MessagePort dorazí do stránky;
- obousměrná komunikace Android ↔ web funguje;
- metadata, binární chunky a complete protokol fungují;
- SHA-256 + existující Tindeq parser zpracují skutečný ZIP;
- skutečný ZIP skončil `ack` z parseru;
- normální `ShareReceiverActivity` byl ověřen přes `Tindeq → Sdílet → Knee` a analýza se zobrazila bez diagnostického receiveru;
- Vercel runtime log při real-ZIP gate neukázal žádný POST/upload archivu.

## Implementováno v `main`

PR #21 zatím není v `main`.

Produkční implementace z PR #20 a dřívějších Tindeq PR zůstává beze změny.

## Rozpracováno mimo `main`

PR #21 na branchi implementuje:

- Android `ACTION_SEND` receiver pro jeden ZIP;
- lokální kopii pouze do app-private `cacheDir/tindeq-share`, max. 32 MB, TTL 30 minut;
- validaci podporovaného ZIPu a ZIP signature před browser transferem;
- Trusted Web Activity / Custom Tabs `postMessage` transport;
- chunkovaný lokální transport 128 KiB a SHA-256 kontrolu integrity;
- rekonstrukci browser `File` a předání do stejného `importTindeqArchive(file)` jako ruční upload;
- zachování explicitního `Uložit měření ke klientovi`; share import sám nic do Supabase neukládá;
- App Link omezený na `/tindeq`;
- `public/.well-known/assetlinks.json` pro přesně vybraný Preview APK fingerprint.

Po úspěšném normálním UX gate byly odstraněny diagnostické vrstvy: `DiagnosticShareReceiverActivity`, její manifest entry, webové debug počítadlo/history a diagnostická port reply. Produkční bootstrap přijímá native share port pouze při `nativeShare=1`, exact `android-app://<current-host>` originu a přítomném `MessagePort`.

## Nasazeno

Produkce:

- PR #21: **ne**.

Preview:

- stable branch alias: `https://vankotraining-knee-git-agent-tin-19838f-vankotrainings-projects.vercel.app`;
- Preview je dostupné a Digital Asset Links byly na skutečném telefonu úspěšně použity;
- post-cleanup head čeká na poslední CI + výběr canonical APK + připnutí jeho fingerprintu.

## Produkčně ověřeno

PR #21: **ne**.

Real-device Preview test je úspěšný důkaz implementace, ale není produkční ověření. Produkční rollout vyžaduje samostatný signing/distribuční krok a explicitní souhlas uživatele.

Dřívější produkční acceptance PR #16, parseru PR #17, responsive opravy PR #19 a PR #20 zůstávají platné.

## Známé problémy

- Preview APK používá ephemeral signing certifikát; každý nový Android rebuild změní fingerprint a vyžaduje nový `assetlinks.json` i přeinstalaci APK;
- produkční Android distribuce/signing zatím není součástí hotového rollout plánu; bude potřeba persistentní release nebo Play App Signing certifikát;
- zbývá post-cleanup real-device test s druhým skutečným ZIPem, ideálně když už je Knee otevřené, aby se ověřil `singleTask/onNewIntent` tok;
- zbývá fail-closed test nepodporovaného souboru a duplicate protection při explicitním save;
- full-repo lint baseline nadále obsahuje předexistující chyby/warning; PR CI má ověřit, že PR nepřidává lint regresi.

## Privacy invariant

Originální Tindeq ZIP během share toku existuje pouze jako sender `content://` zdroj, app-private Android cache a transientní native/browser paměťové bloky.

PR #21 nepřidává ZIP upload route, form POST, Vercel Function, Supabase Storage objekt, raw ZIP DB write ani server-side ZIP logování. Android po webovém `ack` volá `ShareFileStore.consume()` a maže pending cache copy; bez `ack` zůstává pouze lokálně do TTL cleanupu.

## Další krok

- Dokončit CI nad post-cleanup headem, vybrat jeho canonical Preview APK, připnout přesný fingerprint do `assetlinks.json`, nainstalovat tento APK a provést druhý real-ZIP test při již otevřeném Knee; bez explicitního uživatelského schválení nemergovat.
