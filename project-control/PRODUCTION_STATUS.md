# Production status

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po úspěšném production real-device smoke testu Android share toku PR #21.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## PR #21 rollout

PR #21 `Add local Android Tindeq share receiver` je **merged, produkčně nasazený a produkčně akceptovaný na reálném Android telefonu**.

- merge commit: `1260333236f657da71cf8a31fd98937a704140e6`;
- merge time: `2026-08-22T13:46:17Z`;
- runtime-changing production deployment: `dpl_2oDEJabfCarrNgbG1P5EnXs3yirU`;
- deployment state: `READY`;
- target: `production`;
- branch: `main`.

Pozdější deploymenty mění pouze Android release workflow nebo project-control dokumentaci; runtime share receiveru zůstává checkpoint PR #21.

## Produkční Digital Asset Links

`https://knee.vankotraining.cz/.well-known/assetlinks.json` vrací HTTP 200.

Publikovaný Android package:

`cz.vankotraining.knee`

Produkční certificate SHA-256:

`B3:42:51:D0:89:42:CE:86:A3:93:14:9E:44:6B:1B:1D:57:9E:3B:90:0D:87:56:6E:66:38:99:32:E9:25:1D:08`

Stejný fingerprint je fail-closed očekáván v production Android release workflow.

## Osobní production Android release

Workflow `Knee personal Android release` byl úspěšně dokončen:

- run ID: `32577314441`;
- head SHA: `58305016e466b59fdde16ee4b539743b7e81cb56`;
- status: `completed`;
- conclusion: `success`;
- artifact: `knee-personal-production-apk`;
- artifact ID: `9476883922`;
- artifact digest: `sha256:6151ddf3e6ebf4c6b8af05c9210056775a6c0dbaca8732171d80d2dd18265d04`;
- release origin: `https://knee.vankotraining.cz`.

Workflow před uploadem artifactu ověřuje signing key i výsledný APK podpis proti produkčnímu fingerprintu přes Android build-tools `apksigner`.

## Databázové migrace

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

PR #21 neprovedl žádnou DB migraci, DDL, RLS/policy/grant/Auth změnu ani automatický produkční datový write. Produkční databázové schéma a Tindeq dedupe invariant zůstávají beze změny.

Originální Tindeq ZIP se neukládá do Supabase Storage ani databáze.

## Produkční real-device acceptance PR #21

`2026-08-22` uživatel nainstaloval přesný production APK z workflow artifactu a provedl skutečný share tok:

`Tindeq → Sdílet → Knee → analýza`.

Výsledek:

- první pokus zobrazil neúspěšnou hlášku; přesný text nebyl zachycen;
- okamžitý druhý pokus bez změny uspěl;
- očekávaná Tindeq analýza se zobrazila;
- uživatel výslovně potvrdil: `Funguje`.

Production real-device rollout gate je tím **splněn**. První jednorázový neúspěch je ponechán jako transientní pozorování k případné budoucí reprodukci.

## Serverová kontrola po smoke testu

V produkčních Vercel logách za přibližně posledních 20 minut kolem acceptance:

- běžné requesty byly pouze na `/`, `/tindeq` a `/tindeq/reports`;
- nebyly nalezeny žádné `warning`, `error` ani `fatal` záznamy;
- full-text hledání `POST` vrátilo nula výsledků;
- full-text hledání `zip` vrátilo nula výsledků.

Dostupná serverová evidence tedy nepodporuje hypotézu serverové chyby ani serverového uploadu originálního ZIPu. Příčinu prvního lokálního neúspěchu bez přesné hlášky nelze určit.

## Poslední výslovné uživatelské produkční ověření

- `2026-08-22`: PR #21 Android native Tindeq share flow – production APK na skutečném telefonu, druhý pokus úspěšný, analýza zobrazena; acceptance potvrzena uživatelem;
- `2026-08-11`: PR #20 bezpečná editace jména klienta – produkčně potvrzena uživatelem jako funkční;
- `2026-08-10`: PR #16 nový interpretační model Tindeq – produkčně potvrzen uživatelem jako v pořádku;
- `2026-08-10`: parser live new-client upload/save workflow – potvrzen jako v pořádku;
- `2026-08-09`: responsive oprava PR #19 – potvrzena na skutečném telefonu.

## Produkční stav Tindeq

Stav PR #21:

- implementováno v `main`: **ano**;
- webově produkčně nasazeno: **ano**;
- produkční DAL nasazeno: **ano**;
- production APK automaticky sestaveno a podpisově ověřeno: **ano**;
- production share tok na skutečném telefonu uživatelem ověřen: **ano**;
- rollout gate: **uzavřen**.

## Známé produkční problémy / pozorování

- při prvním production share pokusu dne `2026-08-22` se jednou objevila neúspěšná hláška; bezprostřední druhý pokus uspěl. Není potvrzeno, že jde o reprodukovatelnou chybu;
- pokud se situace zopakuje, zachytit přesný text hlášky/screenshot a čas pokusu před jakoukoli změnou kódu;
- neblokující UX discoverability `Upravit klienta` zůstává mimo scope;
- full-repo lint baseline obsahuje předexistující chyby/warning;
- dříve existující shared-production Supabase advisory nálezy zůstávají mimo scope.

## Privacy invariant

Originální Tindeq ZIP během share toku není HTTP request body a nesmí se stát serverovým uploadem ani trvalým cloudovým artefaktem. Existuje pouze jako sender `content://`, app-private Android cache a transientní native/browser paměťové bloky; do databáze se ukládá pouze explicitně potvrzený strukturovaný výsledek.
