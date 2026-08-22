# Project state

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po merge PR #21, produkčním Vercel deploymentu a úspěšném automatickém sestavení osobního production Android APK.

## Aktuální `main` commit

Aktuální `main` před tímto project-control syncem:

`58305016e466b59fdde16ee4b539743b7e81cb56` – `Expose personal Android release run status`.

PR #21 byl mergován merge commitem:

`1260333236f657da71cf8a31fd98937a704140e6` – `Merge PR #21: Add local Android Tindeq share receiver`.

Následné commity `41ffc6dc868c9c2a4043f51f8919c37567ed7f47` a `58305016e466b59fdde16ee4b539743b7e81cb56` upravují pouze automatizaci osobního Android release workflow a nemění Tindeq runtime.

## PR #21

PR #21 `Add local Android Tindeq share receiver` je **merged a closed**.

- merge time: `2026-08-22T13:46:17Z`;
- merge commit: `1260333236f657da71cf8a31fd98937a704140e6`;
- původní branch: `agent/tindeq-android-share-receiver`;
- scope: Android `ACTION_SEND` receiver + lokální TWA/MessagePort transport do existujícího Tindeq parseru + testy/dokumentace;
- žádná DB migrace, Supabase schema/policy změna ani serverový ZIP endpoint.

## Produkční runtime

PR #21 je nyní součástí produkce.

Runtime-changing production deployment po merge:

- deployment: `dpl_2oDEJabfCarrNgbG1P5EnXs3yirU`;
- commit: `1260333236f657da71cf8a31fd98937a704140e6`;
- stav: `READY`;
- target: `production`;
- branch: `main`.

Aktuální produkční deployment před tímto project-control syncem:

- deployment: `dpl_ApgmvdMe72ifV63uhj2vrsUQwxoH`;
- commit: `58305016e466b59fdde16ee4b539743b7e81cb56`;
- stav: `READY`;
- target: `production`;
- alias zahrnuje `knee.vankotraining.cz`.

Následné dva commity po merge mění pouze GitHub Actions workflow; webový runtime PR #21 zůstává stejný.

## Stav databázových migrací

Produkční Supabase: `zxvndqicslyulrinbpyn`.

PR #21 neprovedl žádnou DB migraci, DDL, RLS/policy/grant/Auth změnu ani automatický produkční datový write. Tindeq structured-result persistence a existující dedupe invariant zůstávají beze změny.

Originální Tindeq ZIP se nepřidává do Supabase Storage, databáze ani jiného serverového úložiště.

## Implementováno v `main`

PR #21 je implementován v `main` a obsahuje:

- Android `ACTION_SEND` receiver pro jeden ZIP;
- lokální kopii pouze do app-private `cacheDir/tindeq-share`, max. 32 MB, TTL 30 minut;
- validaci podporovaného ZIPu a ZIP signature před browser transferem;
- Trusted Web Activity / Custom Tabs `postMessage` transport;
- chunkovaný lokální transport 128 KiB a SHA-256 kontrolu integrity;
- rekonstrukci browser `File` a předání do stejného `importTindeqArchive(file)` jako ruční upload;
- zachování explicitního `Uložit měření ke klientovi`; share import sám nic do Supabase neukládá;
- App Link omezený na `/tindeq`;
- `public/.well-known/assetlinks.json` pro dlouhodobý osobní production signing certifikát;
- automatický osobní Android production release workflow.

Diagnostické vrstvy použité během vývoje byly před merge odstraněny. Produkční bootstrap přijímá native share port pouze při `nativeShare=1`, exact `android-app://<current-host>` originu a přítomném `MessagePort`.

## Ověřeno před merge na reálném telefonu

Clean canonical Preview APK prošel dvěma po sobě jdoucími skutečnými Tindeq share importy bez restartu Knee.

Bylo prokázáno:

- `Tindeq ACTION_SEND → app-private cache → Chrome/TWA MessagePort → SHA-256 → existující Tindeq parser → zobrazená analýza`;
- repeated-share / `singleTask` lifecycle funguje;
- fail-closed test neplatného ZIPu funguje;
- Vercel runtime log během gate neukázal žádný POST/upload ZIPu;
- duplicate protection byla ověřena read-only na aplikační vrstvě a existujícím UNIQUE indexu bez live DB zápisu.

## Osobní production Android release

Dlouhodobý production certificate SHA-256:

`B3:42:51:D0:89:42:CE:86:A3:93:14:9E:44:6B:1B:1D:57:9E:3B:90:0D:87:56:6E:66:38:99:32:E9:25:1D:08`

Stejný fingerprint je publikovaný v produkčním `/.well-known/assetlinks.json`.

Workflow `Knee personal Android release`:

- run ID: `32577314441`;
- head SHA: `58305016e466b59fdde16ee4b539743b7e81cb56`;
- conclusion: `success`;
- release build origin: `https://knee.vankotraining.cz`;
- workflow ověřuje přesný očekávaný signing fingerprint pomocí Android build-tools `apksigner`;
- výsledný artifact: `knee-personal-production-apk`.

## Nasazeno

Webová produkce:

- PR #21: **ano**;
- `https://knee.vankotraining.cz/tindeq` → HTTP 200 při auditu `2026-08-22`;
- `https://knee.vankotraining.cz/.well-known/assetlinks.json` → HTTP 200 a správný production fingerprint.

Android production build:

- production-signed APK byl automaticky úspěšně sestaven a uložen jako GitHub Actions artifact;
- zatím není zaznamenáno, že byl tento přesný artifact nainstalován na produkční telefon a prošel production share smoke testem.

## Produkčně ověřeno

PR #21:

- web deployment a Digital Asset Links: **technicky ověřeno**;
- production-signed APK build/signature: **automatizovaně ověřeno**;
- reálný production tok `Tindeq → Sdílet → Knee → analýza` na APK z production workflow: **zatím neověřeno uživatelem**.

Proto PR #21 zatím není označen jako kompletně produkčně akceptovaný na zařízení.

Dřívější produkční acceptance PR #16, parseru PR #17, responsive opravy PR #19 a PR #20 zůstávají platné.

## Privacy invariant

Originální Tindeq ZIP během share toku existuje pouze jako sender `content://` zdroj, app-private Android cache a transientní native/browser paměťové bloky.

PR #21 nepřidává ZIP upload route, form POST, Vercel Function, Supabase Storage objekt, raw ZIP DB write ani server-side ZIP logování. Android po webovém `ack` volá `ShareFileStore.consume()` a maže pending cache copy; bez `ack` zůstává pouze lokálně do TTL cleanupu.

## Známé problémy / otevřené gate

- zbývá jediný rollout gate: nainstalovat přesně production APK artifact z úspěšného workflow runu `32577314441` a provést jeden reálný production share smoke test bez databázového save;
- neblokující UX discoverability `Upravit klienta` zůstává mimo scope;
- full-repo lint baseline nadále obsahuje předexistující chyby/warning;
- dříve existující shared-production Supabase advisory nálezy zůstávají mimo scope.

## Další krok

Stáhnout `knee-personal-production-apk` z workflow runu `32577314441`, nainstalovat jej do telefonu a provést jeden production test:

`Tindeq → Sdílet → Knee → automaticky zobrazená správná analýza`.

Při tomto smoke testu neukládat měření do Supabase, pokud cílem není explicitně testovat save.
