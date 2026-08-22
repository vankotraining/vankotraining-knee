# Project state

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po produkčním real-device ověření Android share toku PR #21, odhalení skutečné chyby duplicate protection a zeleném pre-merge gate opravy PR #22.

## Aktuální `main` commit

Aktuální `main`:

`133c5bfdc9b0273c1784ef9257010ab736c6fb73` – `Close PR #21 rollout gate`.

PR #21 byl mergován merge commitem:

`1260333236f657da71cf8a31fd98937a704140e6` – `Merge PR #21: Add local Android Tindeq share receiver`.

## Aktivní větev a PR

Aktivní oprava je PR #22 `Fix Tindeq duplicate detection for re-exported ZIPs`.

- branch: `agent/tindeq-duplicate-feedback`;
- base: `main@133c5bfdc9b0273c1784ef9257010ab736c6fb73`;
- poslední runtime/test head před tímto finálním project-control syncem: `c891a96fc1ebd3bd11c2958160a225523cbafe1c`;
- PR je otevřený, mergeable a není mergovaný;
- merge pouze po explicitním souhlasu uživatele.

## Produkční runtime commit

Runtime Android share receiveru PR #21 je v produkci od merge commitu:

`1260333236f657da71cf8a31fd98937a704140e6`.

Aktuální produkční `main` deployment před PR #22:

- deployment: `dpl_2F4PbWVrEM2ataSaD89WFikV37BR`;
- commit: `133c5bfdc9b0273c1784ef9257010ab736c6fb73`;
- stav: `READY`;
- target: `production`.

PR #22 je zatím pouze na Preview a není produkčně nasazený.

## Stav databázových migrací

Produkční Supabase project ref: `zxvndqicslyulrinbpyn`.

PR #22 neobsahuje DB migraci, DDL, RLS/policy/grant/Auth změnu ani automatickou datovou opravu.

Existující UNIQUE index nad `(athlete_id, analysis_version, raw_metadata->>'tindeqSessionId')` zůstává beze změny. PR #22 jej nově využívá lépe: nové save operace persistují stabilní SHA-256 semantic `tindeqSessionId`, takže stejný strukturovaný re-export konverguje na stejný DB unique key. Starší řádky s legacy ID pokrývá backward-compatible semantic fallback.

## Aktuální fáze

PR #21 share/import tok je produkčně ověřený. Následný explicitní save/duplicate test odhalil chybu dedupe identity:

- první uložení měření Rosová Štěpánka `14. 8. 2026 14:31` vytvořilo očekávaný řádek;
- druhý import stejného měření vytvořil další řádek místo návratu `duplicate: true`;
- oba produkční řádky byly read-only porovnány a mají shodné uložené metriky, repetitions, summaries, warnings i `raw_metadata` kromě `tindeqSessionId`;
- rozdílné legacy IDs jsou `7508cd743009fa48715e` a `f90b7299be75c228bc45`;
- příčina: legacy parser ID je odvozené z bytes celého ZIP kontejneru, takže re-export může změnit ID i při identickém strukturovaném měření.

PR #22 je implementovaný a automatizovaně ověřený; čeká pouze na explicitní merge approval.

## Implementováno v `main`

V `main` zůstává produkčně ověřený PR #21:

- Android `ACTION_SEND` receiver;
- lokální app-private staging ZIPu;
- TWA/Custom Tabs MessagePort transport;
- SHA-256 kontrola přenesených bytes;
- použití existujícího `importTindeqArchive(file)`;
- explicitní save až po rozhodnutí uživatele;
- production Digital Asset Links a osobní podepsaný Android release workflow.

Aktuální `main` stále může u re-exportovaného stejného obsahu obejít duplicate lookup přes jiné legacy `tindeqSessionId`; oprava je zatím pouze v PR #22.

## Rozpracováno mimo `main`

PR #22 kombinuje dvě vrstvy ochrany:

1. **Stabilní identita pro nové save**
   - z persistovaného strukturovaného výsledku se vytvoří canonical JSON;
   - identita záměrně neobsahuje klienta, název vnějšího ZIPu ani legacy parser ID;
   - SHA-256 fingerprint se ukládá jako `v2:<64 hex>` do `raw_metadata.tindeqSessionId`;
   - opakovaný re-export stejného obsahu proto používá stejný DB unique key a existující UNIQUE index chrání i race-condition insert.

2. **Backward-compatible fallback pro starší rows**
   - při exact-ID miss se vyhledají omezení kandidáti stejného klienta, `analysis_version`, `measured_at` a datasetu;
   - kandidáti se porovnají podle persistovaného strukturovaného výsledku a metadat;
   - ignoruje se pouze nestabilní ID a název ZIP souboru;
   - identický legacy row se vrátí jako `duplicate: true`;
   - odlišný obsah se stejným časem není označen jako duplicita.

Na runtime/test headu `c891a96fc1ebd3bd11c2958160a225523cbafe1c` prošly všechny unit testy včetně semantic dedupe, stable-ID a race-condition regresí, lint comparison bez nové regrese, production build, TypeScript, project-control check i browser Tindeq verification.

## Nasazeno

Produkce:

- PR #21: ano;
- PR #22: ne.

Preview PR #22:

- Vercel status pro `c891a96fc1ebd3bd11c2958160a225523cbafe1c`: `success`;
- `Verify Tindeq client view` run `32580870786`: `success`;
- `Project control` run `32580870814`: `success`.

## Produkčně ověřeno

PR #21 Android share/import tok: **ano**.

Production save test:

- první explicitní save: **ano, funkční**;
- opakovaný re-export stejného měření na aktuálním production main: **odhalil chybu duplicate protection**;
- PR #22 oprava: **automatizovaně a na Preview ověřena, ale zatím není produkčně ověřena**, protože není mergovaná.

## Známé problémy

- produkce aktuálně může vytvořit duplicitní Tindeq řádek, pokud stejný obsah dorazí v re-exportovaném ZIPu s jiným legacy `tindeqSessionId`;
- během kontrolovaného testu vznikl potvrzený druhý duplicitní řádek `eacaecc9-9185-4cb8-8e52-561872e49cd5`; původní řádek je `b65d0e32-6e68-407c-9d3f-385112111ea9`;
- duplicitní testovací řádek zatím nebyl smazán ani soft-deleted, protože produkční datovou mutaci je nutné provést pouze po explicitním schválení uživatele;
- první production Android share pokus PR #21 jednou transientně selhal, další dva pokusy uspěly; příčina nebyla reprodukována;
- full-repo lint baseline obsahuje předexistující `3 errors / 1 warning`, PR #22 nepřidává další lint regresi.

## Další krok

- Vyžádat explicitní souhlas uživatele k merge PR #22; po merge ověřit production deployment a zopakovat stejný re-export/save test s očekáváním `Měření již uloženo` a bez nového DB row.
