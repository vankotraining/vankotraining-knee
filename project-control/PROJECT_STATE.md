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

## Produkční runtime

Produkční runtime checkpoint zůstává PR #20:

- commit: `1b48da7ed9340e8f53f591f3b427d4d6758246e1`;
- deployment: `dpl_2MpCHrW6vhsReXuWn5kJyZL958SV`;
- stav: `READY`;
- target: `production`;
- branch: `main`.

PR #21 je pouze na Preview a není produkčně nasazený.

## Databáze

Produkční Supabase: `zxvndqicslyulrinbpyn`.

PR #21 neprovádí žádnou DB migraci, DDL, RLS/policy/grant/Auth změnu ani automatický produkční datový write. Tindeq structured-result persistence a existující dedupe invariant zůstávají beze změny.

Originální Tindeq ZIP se nepřidává do Supabase Storage, databáze ani jiného serverového úložiště.

## Aktuální fáze PR #21

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
- normální `ShareReceiverActivity` byl následně ověřen přes `Tindeq → Sdílet → Knee` a analýza se zobrazila bez diagnostického receiveru;
- Vercel runtime log při real-ZIP gate neukázal žádný POST/upload archivu.

## Stabilizace po úspěšném gate

Po úspěšném normálním UX testu byly odstraněny diagnostické vrstvy:

- `DiagnosticShareReceiverActivity` odstraněna;
- manifest obsahuje pouze normální `ShareReceiverActivity` jako `ACTION_SEND` target;
- webové debug počítadlo/history a diagnostická odpověď odstraněny;
- before-interactive bootstrap přijímá native share port pouze při `nativeShare=1`, exact `android-app://<current-host>` originu a přítomném `MessagePort`;
- běžný receiver používá `meta → chunk → complete → ack/nack` a po `ack` volá `ShareFileStore.consume()`.

## Privacy invariant

Originální Tindeq ZIP během share toku existuje pouze jako:

- sender `content://` zdroj;
- app-private Android cache;
- transientní native/browser paměťové bloky.

PR #21 nepřidává ZIP upload route, form POST, Vercel Function, Supabase Storage objekt, raw ZIP DB write ani server-side ZIP logování.

## Preview signing

Preview APK workflow používá ephemeral signing certifikát. Každý rebuild generuje nový fingerprint, takže manuální test musí vždy používat přesně artifact, jehož fingerprint je následně připnutý do Preview `/.well-known/assetlinks.json`.

Produkční rollout vyžaduje persistentní release certifikát nebo Play App Signing; Preview ephemeral signing není produkční strategie.

## Známé zbývající body

- ověřit post-cleanup build se **druhým skutečným ZIPem**, ideálně když už je Knee otevřené, aby se ověřil `singleTask/onNewIntent` tok;
- znovu ověřit Vercel runtime log bez POST/uploadu;
- ověřit fail-closed odmítnutí nepodporovaného souboru;
- při explicitním save ověřit duplicate protection;
- rozhodnout produkční Android signing/distribuci;
- PR #21 zůstává draft a není produkčně ověřený.

## Další krok

Dokončit CI nad post-cleanup headem, vybrat jeho canonical Preview APK, připnout přesný fingerprint do `assetlinks.json`, nainstalovat tento APK a provést druhý real-ZIP test při již otevřeném Knee. Bez explicitního uživatelského schválení nemergovat.
