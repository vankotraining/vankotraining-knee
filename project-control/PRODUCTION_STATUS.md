# Production status

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po produkčním Android share acceptance PR #21, kontrolovaném save/duplicate testu a zeleném Preview gate opravy PR #22.

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

PR #22 není součástí produkce.

## Čas a výsledek deploymentu

- `dpl_2F4PbWVrEM2ataSaD89WFikV37BR`: `READY`, `production`, `main@133c5bfdc9b0273c1784ef9257010ab736c6fb73`;
- `dpl_2oDEJabfCarrNgbG1P5EnXs3yirU`: `READY`, `production`, merge PR #21;
- production APK z workflow runu `32577314441` byl nainstalován a reálně device-tested;
- PR #22 je pouze na Preview a jeho Vercel status pro runtime/test head `c891a96fc1ebd3bd11c2958160a225523cbafe1c` je `success`.

## Databázové migrace použité produkční aplikací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

PR #22 nepřidává DB migraci. Existující UNIQUE index nad `(athlete_id, analysis_version, raw_metadata->>'tindeqSessionId')` zůstává beze změny.

PR #22 pro nové save persistuje stabilní SHA-256 semantic `tindeqSessionId` ve formátu `v2:<64 hex>`, takže stejné strukturované měření z re-exportu používá stejný unique key. Pro starší rows s legacy ID zůstává obsahový fallback.

## Provedené smoke testy

Android share production acceptance:

- reálný `Tindeq → Sdílet → Knee → analýza` tok z production APK uspěl;
- po jednom transientním prvním neúspěchu uspěl druhý pokus a následný další share uspěl hned;
- produkční Vercel logy v acceptance okně neukázaly `POST`, `zip`, `warning`, `error` ani `fatal`.

Explicitní save/duplicate test:

- klient: `Rosová Štěpánka`;
- měření: `14. 8. 2026 14:31`;
- první save vytvořil row `b65d0e32-6e68-407c-9d3f-385112111ea9`, legacy session ID `7508cd743009fa48715e`;
- opakovaný re-export stejného měření vytvořil row `eacaecc9-9185-4cb8-8e52-561872e49cd5`, legacy session ID `f90b7299be75c228bc45`;
- read-only porovnání potvrdilo shodu všech uložených metrik, summaries, repetitions, warnings a raw metadata kromě `tindeqSessionId`.

Preview gate PR #22 na `c891a96fc1ebd3bd11c2958160a225523cbafe1c`:

- všechny unit testy: success;
- lint comparison vůči main: success, bez nové regrese;
- production build: success;
- TypeScript: success;
- project-control check: success;
- browser Tindeq verification: success;
- `Verify Tindeq client view` run `32580870786`: success;
- `Project control` run `32580870814`: success;
- Vercel: success.

## Poslední výslovné uživatelské produkční ověření

- `2026-08-22`: Android native Tindeq share flow z production APK – funkční na skutečném telefonu;
- `2026-08-22`: první explicitní save měření Rosová Štěpánka – potvrzen UI i DB;
- `2026-08-22`: druhý save stejného re-exportovaného měření – produkční audit prokázal vznik skutečné duplicity;
- dřívější produkční acceptance PR #16, parseru PR #17, responsive opravy PR #19 a editace jména PR #20 zůstávají platné.

## Produkční stav Tindeq

- Android share/import: **produkčně nasazeno a ověřeno**;
- explicitní první save: **produkčně ověřeno**;
- re-export duplicate protection v aktuálním production main: **potvrzeně vadná**;
- PR #22: **implementován a Preview/CI ověřen, zatím nemergován a neprodukční**.

## Známé produkční problémy

- aktuální production main může vytvořit duplicitní Tindeq row při re-exportu stejného obsahu s jiným legacy ID;
- potvrzený testovací duplicitní row `eacaecc9-9185-4cb8-8e52-561872e49cd5` je stále aktivní a nebyl bez explicitního schválení uživatele smazán ani soft-deleted;
- PR #22 čeká na explicitní merge approval a následný production duplicate-save smoke test;
- jeden transientní první Android share fail z rollout PR #21 nebyl reprodukován;
- full-repo lint baseline obsahuje předexistující chyby/warning.
