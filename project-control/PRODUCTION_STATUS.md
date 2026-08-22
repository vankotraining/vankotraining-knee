# Production status

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po produkčním Android share acceptance PR #21 a po kontrolovaném explicitním save/duplicate testu.

## Produkční URL

`https://knee.vankotraining.cz`

## Vercel project ID

- project: `vankotraining-knee`;
- project ID: `prj_WLfkUldcNfXn43KmsXpJAClaKOsI`;
- team ID: `team_alNcbbTIb9p5enXHSpEJZpLt`.

## Deployment ID

Aktuální produkční deployment před PR #22:

`dpl_2F4PbWVrEM2ataSaD89WFikV37BR`

Runtime-changing deployment Android share receiveru PR #21:

`dpl_2oDEJabfCarrNgbG1P5EnXs3yirU`

## Nasazený commit

Aktuální produkční `main`:

`133c5bfdc9b0273c1784ef9257010ab736c6fb73` – `Close PR #21 rollout gate`.

Runtime share receiver PR #21 vstoupil do produkce merge commitem:

`1260333236f657da71cf8a31fd98937a704140e6`.

PR #22 není součástí produkce.

## Čas a výsledek deploymentu

- `dpl_2F4PbWVrEM2ataSaD89WFikV37BR`: `READY`, `production`, `main@133c5bfdc9b0273c1784ef9257010ab736c6fb73`;
- `dpl_2oDEJabfCarrNgbG1P5EnXs3yirU`: `READY`, `production`, merge PR #21;
- produkční `/tindeq` a Digital Asset Links byly po rollout PR #21 technicky ověřeny;
- osobní production APK z workflow runu `32577314441` byl nainstalován a reálně device-tested.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

PR #21 ani rozpracovaný PR #22 nepřidávají DB migraci pro Android share/dedupe tok.

Existující Tindeq duplicate DB constraint používá `tindeqSessionId`. Produkční test dne `2026-08-22` prokázal, že stejný strukturovaný obsah re-exportovaného Tindeq měření může dostat jiné legacy `tindeqSessionId`, takže tento constraint sám nepokrývá tento případ.

## Provedené smoke testy

Android share production acceptance:

- produkční APK z artifactu `knee-personal-production-apk` funguje na skutečném telefonu;
- reálný `Tindeq → Sdílet → Knee → analýza` tok uspěl;
- po jednom transientním prvním neúspěchu uspěl druhý pokus a následný další share uspěl hned;
- produkční Vercel logy v acceptance okně neukázaly `POST`, `zip`, `warning`, `error` ani `fatal`.

Explicitní save/duplicate test:

- klient: `Rosová Štěpánka`;
- měření: `14. 8. 2026 14:31`;
- první save vytvořil záznam `b65d0e32-6e68-407c-9d3f-385112111ea9`, session ID `7508cd743009fa48715e`;
- opakovaný import stejného měření vytvořil druhý záznam `eacaecc9-9185-4cb8-8e52-561872e49cd5`, session ID `f90b7299be75c228bc45`;
- oba řádky mají read-only potvrzenou shodu všech uložených metrik, summaries, repetitions, warnings a raw metadata kromě `tindeqSessionId`;
- jde tedy o potvrzenou produkční duplicitní řádku, nikoli pouze zavádějící UI text.

## Poslední výslovné uživatelské produkční ověření

- `2026-08-22`: Android native Tindeq share flow z production APK – funkční na skutečném telefonu;
- `2026-08-22`: první explicitní save měření Rosová Štěpánka – UI potvrdilo uložení a DB row byl read-only ověřen;
- `2026-08-22`: druhý save stejného měření – UI znovu uvedlo `uloženo`; databázový audit následně prokázal skutečně vzniklou duplicitu;
- dřívější produkční acceptance PR #16, parseru PR #17, responsive opravy PR #19 a editace jména PR #20 zůstávají platné.

## Produkční stav Tindeq

- Android share/import: **produkčně nasazeno a ověřeno**;
- explicitní první save: **produkčně ověřeno**;
- duplicate protection pro shodné legacy `tindeqSessionId`: existující mechanismus zůstává;
- duplicate protection pro re-export stejného obsahu s jiným legacy ID: **produkčně vadná v aktuálním main**;
- oprava: PR #22 na Preview, zatím neprodukční.

Preview PR #22 na headu `584b10cac279905a2a0f58f0e42361362a7cedd5` má Vercel deployment `dpl_D3JxpEErMCpbvehTLnCCrL3WEyN3` ve stavu `READY`. Na tomto headu prošlo `124/124` unit testů, lint comparison, production build a TypeScript; CI zastavil pouze zastaralý project-control heading contract, který je v PR nyní opravován.

## Známé produkční problémy

- potvrzený defect: re-export stejného Tindeq měření může obejít dedupe přes změněné legacy `tindeqSessionId` a vytvořit druhý aktivní řádek;
- potvrzený testovací duplicitní row `eacaecc9-9185-4cb8-8e52-561872e49cd5` je stále aktivní; nebyl automaticky smazán ani soft-deleted bez explicitního schválení uživatele;
- PR #22 není zatím mergovaný ani produkčně ověřený;
- jeden transientní první Android share fail z rollout PR #21 nebyl reprodukován;
- full-repo lint baseline obsahuje předexistující chyby/warning.
