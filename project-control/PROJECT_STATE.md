# Project state

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po dokončení produkčního real-device smoke testu PR #21 na osobním production Android APK.

## Aktuální `main`

Aktuální `main` před tímto acceptance syncem:

`4689f89a4263505ed2d2ad57b3e07a1db6590356` – `Record PR #21 production rollout status`.

PR #21 byl mergován merge commitem:

`1260333236f657da71cf8a31fd98937a704140e6` – `Merge PR #21: Add local Android Tindeq share receiver`.

Runtime PR #21 se od merge nezměnil; následné commity se týkají Android release workflow a project-control dokumentace.

## PR #21

PR #21 `Add local Android Tindeq share receiver` je **merged, webově produkčně nasazený a produkčně ověřený na reálném telefonu**.

- merge time: `2026-08-22T13:46:17Z`;
- merge commit: `1260333236f657da71cf8a31fd98937a704140e6`;
- žádná DB migrace, Supabase schema/policy změna ani serverový ZIP endpoint.

## Produkční runtime

Runtime-changing production deployment PR #21:

- deployment: `dpl_2oDEJabfCarrNgbG1P5EnXs3yirU`;
- commit: `1260333236f657da71cf8a31fd98937a704140e6`;
- stav: `READY`;
- target: `production`;
- branch: `main`.

Následné production deploymenty po merge jsou workflow/project-control změny; webový runtime share receiveru zůstává checkpoint PR #21.

## Stav databáze

Produkční Supabase: `zxvndqicslyulrinbpyn`.

PR #21 neprovedl žádnou DB migraci, DDL, RLS/policy/grant/Auth změnu ani automatický produkční datový write. Tindeq structured-result persistence a existující dedupe invariant zůstávají beze změny.

Originální Tindeq ZIP se nepřidává do Supabase Storage, databáze ani jiného serverového úložiště.

## Implementováno v `main`

PR #21 obsahuje:

- Android `ACTION_SEND` receiver pro jeden ZIP;
- lokální kopii pouze do app-private `cacheDir/tindeq-share`, max. 32 MB, TTL 30 minut;
- validaci ZIPu před browser transferem;
- Trusted Web Activity / Custom Tabs `postMessage` transport;
- chunkovaný lokální transport 128 KiB a SHA-256 kontrolu integrity;
- rekonstrukci browser `File` a předání do existujícího `importTindeqArchive(file)`;
- explicitní uložení výsledku až po rozhodnutí uživatele;
- App Link omezený na `/tindeq`;
- `public/.well-known/assetlinks.json` pro dlouhodobý osobní production signing certifikát;
- automatický osobní Android production release workflow.

## Production Android release

Dlouhodobý production certificate SHA-256:

`B3:42:51:D0:89:42:CE:86:A3:93:14:9E:44:6B:1B:1D:57:9E:3B:90:0D:87:56:6E:66:38:99:32:E9:25:1D:08`

Stejný fingerprint je publikovaný v produkčním `/.well-known/assetlinks.json`.

Workflow `Knee personal Android release`:

- run ID: `32577314441`;
- head SHA: `58305016e466b59fdde16ee4b539743b7e81cb56`;
- conclusion: `success`;
- artifact: `knee-personal-production-apk`;
- artifact ID: `9476883922`;
- artifact digest: `sha256:6151ddf3e6ebf4c6b8af05c9210056775a6c0dbaca8732171d80d2dd18265d04`;
- release origin: `https://knee.vankotraining.cz`;
- výsledný APK podpis je fail-closed ověřován přes Android build-tools `apksigner`.

## Produkční real-device acceptance

`2026-08-22` uživatel nainstaloval production APK z výše uvedeného workflow artifactu a provedl reálný tok:

`Tindeq → Sdílet → Knee → analýza`.

Výsledek:

- první pokus zobrazil hlášku, že operace nešla; přesný text hlášky nebyl zachycen;
- bez další změny druhý pokus bezprostředně poté uspěl;
- Knee zobrazil očekávanou analýzu skutečného Tindeq souboru;
- uživatel výsledek výslovně potvrdil jako funkční.

Tím je produkční real-device gate PR #21 **splněn**. První jednorázový fail je evidován jako transientní pozorování, nikoli jako vysvětlená nebo reprodukovaná chyba.

## Serverová kontrola po acceptance

V časovém okně přibližně `2026-08-22 16:18–16:38` Europe/Prague:

- production Vercel logy obsahovaly pouze běžné requesty na `/`, `/tindeq` a `/tindeq/reports`;
- nebyl nalezen žádný `warning`, `error` ani `fatal`;
- full-text kontrola `POST` vrátila nula výsledků;
- full-text kontrola `zip` vrátila nula výsledků.

Dostupná serverová evidence tedy neukazuje serverovou chybu ani upload originálního ZIPu při tomto smoke testu. Přesnou příčinu prvního neúspěšného pokusu z těchto logů určit nelze.

## Produkčně ověřeno

PR #21:

- implementováno v `main`: **ano**;
- webově produkčně nasazeno: **ano**;
- produkční Digital Asset Links: **ano**;
- production APK automaticky sestaveno a podpisově ověřeno: **ano**;
- production share tok na skutečném telefonu: **ano**;
- produkční acceptance: **ano, s evidovaným transientním prvním neúspěšným pokusem**.

Dřívější produkční acceptance PR #16, parseru PR #17, responsive opravy PR #19 a PR #20 zůstávají platné.

## Privacy invariant

Originální Tindeq ZIP během share toku existuje pouze jako sender `content://` zdroj, app-private Android cache a transientní native/browser paměťové bloky.

PR #21 nepřidává ZIP upload route, form POST, Vercel Function, Supabase Storage objekt, raw ZIP DB write ani server-side ZIP logování. Android po webovém `ack` maže pending cache copy; bez `ack` zůstává pouze lokálně do TTL cleanupu.

## Známé problémy / pozorování

- při prvním production share pokusu dne `2026-08-22` se jednou objevila obecná hláška neúspěchu; okamžitý druhý pokus uspěl. Bez přesného textu hlášky a reprodukce není příčina známá;
- pokud se problém zopakuje, před změnou kódu zachytit přesný text hlášky/screenshot a čas pokusu a korelovat jej s Android lifecycle/MessagePort tokem;
- neblokující UX discoverability `Upravit klienta` zůstává mimo scope;
- full-repo lint baseline nadále obsahuje předexistující chyby/warning;
- dříve existující shared-production Supabase advisory nálezy zůstávají mimo scope.

## Další krok

Rollout gate PR #21 je uzavřen. Není potřeba další zásah pouze kvůli deploymentu.

Pokud se první-pokusový transientní fail znovu objeví, otevřít cílenou diagnostiku až s přesnou hláškou a časem reprodukce; jinak pokračovat další prioritou projektu.
