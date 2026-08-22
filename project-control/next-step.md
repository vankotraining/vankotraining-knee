# Next Step

## Aktuální fáze

PR #21 `Add local Android Tindeq share receiver` je mergovaný do `main` a webová část je produkčně nasazená.

Produkční `/.well-known/assetlinks.json` vrací HTTP 200 a obsahuje dlouhodobý osobní production signing fingerprint:

`B3:42:51:D0:89:42:CE:86:A3:93:14:9E:44:6B:1B:1D:57:9E:3B:90:0D:87:56:6E:66:38:99:32:E9:25:1D:08`.

Automatický workflow `Knee personal Android release` úspěšně sestavil a podpisově ověřil production APK:

- workflow run: `32577314441`;
- head SHA: `58305016e466b59fdde16ee4b539743b7e81cb56`;
- conclusion: `success`;
- artifact: `knee-personal-production-apk`.

## Ověřené invarianty

Před merge byly na skutečném Android telefonu prokázány:

- `Tindeq ACTION_SEND → app-private cache → Chrome/TWA MessagePort → SHA-256 → existující Tindeq parser → zobrazená analýza`;
- dva po sobě jdoucí reálné share importy bez restartu Knee;
- správný repeated-share lifecycle;
- fail-closed odmítnutí neplatného ZIPu;
- žádný POST/upload originálního ZIPu na Vercel;
- share import nevolá automatické uložení do Supabase;
- duplicate protection byla ověřena read-only bez live DB zápisu.

Po merge jsou navíc technicky ověřeny:

- produkční Vercel deployment PR #21 je `READY`;
- produkční `/tindeq` odpovídá HTTP 200;
- produkční Digital Asset Links odpovídá HTTP 200 se správným production fingerprintem;
- production APK build prošel unit testy, release buildem a kontrolou podpisu přes `apksigner`.

## Nejbližší manuální gate

Zbývá jediný rollout gate:

1. stáhnout přesně artifact `knee-personal-production-apk` z workflow runu `32577314441`;
2. nainstalovat tento APK do telefonu;
3. otevřít Knee / případně ponechat aplikaci běžet;
4. v Tindeq sdílet jeden platný skutečný ZIP přes `Tindeq → Sdílet → Knee`;
5. ověřit, že se automaticky zobrazí správná analýza bez diagnostické obrazovky;
6. během tohoto smoke testu měření neukládat do Supabase, pokud cílem není explicitně testovat save.

Po úspěšném potvrzení uživatelem lze PR #21 označit jako kompletně produkčně ověřený na reálném zařízení.

## Důležitý invariant

Originální Tindeq ZIP se nesmí stát serverovým uploadem ani trvalým cloudovým artefaktem. Produkční share tok musí nadále zachovat lokální Android/browser transport a explicitní uložení strukturovaného výsledku až po rozhodnutí uživatele.
