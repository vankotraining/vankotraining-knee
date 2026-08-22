# Production status

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po merge PR #21, produkčním Vercel deploymentu, ověření produkčního Digital Asset Links a úspěšném automatickém production Android release buildu.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## PR #21 rollout

PR #21 `Add local Android Tindeq share receiver` je **merged a produkčně nasazený**.

- merge commit: `1260333236f657da71cf8a31fd98937a704140e6`;
- merge time: `2026-08-22T13:46:17Z`;
- runtime-changing production deployment: `dpl_2oDEJabfCarrNgbG1P5EnXs3yirU`;
- deployment state: `READY`;
- target: `production`;
- branch: `main`.

Následné commity `41ffc6dc868c9c2a4043f51f8919c37567ed7f47` a `58305016e466b59fdde16ee4b539743b7e81cb56` upravují pouze osobní Android release workflow. Poslední auditovaný production deployment před tímto project-control syncem byl:

`dpl_ApgmvdMe72ifV63uhj2vrsUQwxoH`

- state: `READY`;
- target: `production`;
- commit: `58305016e466b59fdde16ee4b539743b7e81cb56`;
- alias obsahuje `knee.vankotraining.cz`.

Project-control synchronizační commity po tomto auditu mohou vytvořit další docs-only Vercel deploymenty; runtime checkpoint PR #21 tím není změněn.

## Produkční Digital Asset Links

`https://knee.vankotraining.cz/.well-known/assetlinks.json` při auditu vrací HTTP 200.

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
- release origin: `https://knee.vankotraining.cz`.

Workflow před uploadem artifactu:

- obnoví dlouhodobý osobní signing key z GitHub repository secrets;
- ověří jeho přesný SHA-256 fingerprint;
- spustí Android unit testy a sestaví release APK;
- ověří výsledný APK podpis přes Android build-tools `apksigner` proti stejnému očekávanému fingerprintu;
- teprve poté uploaduje production APK artifact.

## Databázové migrace

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

PR #21 neprovedl žádnou DB migraci, DDL, RLS/policy/grant/Auth změnu ani automatický produkční datový write. Produkční databázové schéma a Tindeq dedupe invariant zůstávají beze změny.

Originální Tindeq ZIP se neukládá do Supabase Storage ani databáze.

## Provedené produkční technické kontroly

Při auditu `2026-08-22`:

- produkční Vercel deployment je `READY`;
- `https://knee.vankotraining.cz/tindeq` → HTTP 200;
- produkční `/.well-known/assetlinks.json` → HTTP 200;
- DAL obsahuje správný package a production signing fingerprint;
- GitHub status `Vercel` je success;
- GitHub status `Knee personal Android release` je success;
- production Android release workflow run `32577314441` má conclusion `success`;
- v auditovaném hodinovém okně nebyly nalezeny Vercel runtime `error`/`fatal` logy.

## Real-device evidence před merge

Clean canonical Preview APK prošel na skutečném Android telefonu:

- dvěma po sobě jdoucími skutečnými Tindeq ZIP share importy bez restartu Knee;
- repeated-share / lifecycle gate;
- fail-closed testem neplatného ZIPu;
- lokálním transportem bez serverového POST/uploadu originálního archivu.

Toto je silný důkaz funkčnosti implementace, ale není náhradou za finální smoke test production-signed APK artifactu.

## Poslední výslovné uživatelské produkční ověření

PR #21 production Android share flow: **zatím není uživatelem potvrzen na APK z production workflow**.

Dřívější potvrzené acceptance zůstávají platné:

- `2026-08-11`: PR #20 bezpečná editace jména klienta – produkčně potvrzena uživatelem jako funkční;
- `2026-08-10`: PR #16 nový interpretační model Tindeq – produkčně potvrzen uživatelem jako v pořádku;
- `2026-08-10`: parser live new-client upload/save workflow – potvrzen jako v pořádku;
- `2026-08-09`: responsive oprava PR #19 – potvrzena na skutečném telefonu.

## Produkční stav Tindeq

Tindeq runtime nyní zahrnuje také PR #21 Android native share receiver.

Stav PR #21 rozlišujeme takto:

- implementováno v `main`: **ano**;
- webově produkčně nasazeno: **ano**;
- produkční DAL nasazeno: **ano**;
- production APK automaticky sestaveno a podpisově ověřeno: **ano**;
- production share tok na skutečném telefonu uživatelem ověřen: **ne**.

## Známé produkční problémy / otevřené gate

- jediný otevřený rollout gate PR #21 je instalace přesného artifactu `knee-personal-production-apk` z runu `32577314441` a jeden reálný `Tindeq → Sdílet → Knee → analýza` production smoke test;
- neblokující UX discoverability `Upravit klienta` zůstává mimo scope;
- full-repo lint baseline obsahuje předexistující chyby/warning;
- dříve existující shared-production Supabase advisory nálezy zůstávají mimo scope.

## Privacy invariant

Originální Tindeq ZIP během share toku není HTTP request body a nesmí se stát serverovým uploadem ani trvalým cloudovým artefaktem. Existuje pouze jako sender `content://`, app-private Android cache a transientní native/browser paměťové bloky; do databáze se ukládá pouze explicitně potvrzený strukturovaný výsledek.
