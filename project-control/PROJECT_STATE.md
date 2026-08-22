# Project state

## Datum poslední kontroly

`2026-08-22` (Europe/Prague), po produkčním real-device ověření Android share toku PR #21 a po odhalení skutečné chyby duplicate protection při opakovaném re-exportu stejného Tindeq měření.

## Aktuální `main` commit

Aktuální `main`:

`133c5bfdc9b0273c1784ef9257010ab736c6fb73` – `Close PR #21 rollout gate`.

PR #21 byl mergován merge commitem:

`1260333236f657da71cf8a31fd98937a704140e6` – `Merge PR #21: Add local Android Tindeq share receiver`.

## Aktivní větev a PR

Aktivní oprava je PR #22 `Fix Tindeq duplicate detection for re-exported ZIPs`.

- branch: `agent/tindeq-duplicate-feedback`;
- base: `main@133c5bfdc9b0273c1784ef9257010ab736c6fb73`;
- poslední runtime/test head před tímto project-control syncem: `584b10cac279905a2a0f58f0e42361362a7cedd5`;
- PR je otevřený, mergeable a není mergovaný;
- merge až po fresh zeleném CI/Preview gate a explicitním souhlasu uživatele.

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

PR #22 neobsahuje DB migraci, DDL, RLS/policy/grant/Auth změnu ani automatickou datovou opravu. Oprava je aplikační fallback duplicate detection nad již uloženým strukturovaným výsledkem.

Existující UNIQUE index nad `(athlete_id, analysis_version, raw_metadata->>'tindeqSessionId')` chrání pouze případy se shodným `tindeqSessionId`; produkční test ukázal, že stejný re-exportovaný obsah může dostat odlišné legacy session ID.

## Aktuální fáze

PR #21 share/import tok je produkčně ověřený. Následný explicitní save/duplicate test ale odhalil chybu dedupe identity:

- první uložení měření Rosová Štěpánka `14. 8. 2026 14:31` vytvořilo očekávaný řádek;
- druhý import stejného měření vytvořil další řádek místo návratu `duplicate: true`;
- oba produkční řádky byly read-only porovnány a mají shodné uložené metriky, repetitions, summaries, warnings i `raw_metadata` kromě `tindeqSessionId`;
- rozdílné IDs jsou `7508cd743009fa48715e` a `f90b7299be75c228bc45`;
- příčina: legacy session ID je odvozené z bytes celého ZIP kontejneru, takže re-export může změnit ID i při identickém strukturovaném měření.

## Implementováno v `main`

V `main` zůstává produkčně ověřený PR #21:

- Android `ACTION_SEND` receiver;
- lokální app-private staging ZIPu;
- TWA/Custom Tabs MessagePort transport;
- SHA-256 kontrola přenesených bytes;
- použití existujícího `importTindeqArchive(file)`;
- explicitní save až po rozhodnutí uživatele;
- production Digital Asset Links a osobní podepsaný Android release workflow.

Aktuální `main` stále používá duplicate lookup založený primárně na `tindeqSessionId`, který se v produkčním re-export testu ukázal jako nedostatečný.

## Rozpracováno mimo `main`

PR #22 přidává backward-compatible semantic duplicate fallback:

- nejprve zachová rychlý exact lookup podle `tindeqSessionId`;
- při miss vyhledá omezenou množinu aktivních kandidátů stejného klienta, `analysis_version`, `measured_at` a datasetu;
- kandidáty porovná podle persistovaného strukturovaného výsledku a metadat;
- při porovnání ignoruje pouze nestabilní `tindeqSessionId` a název ZIP souboru;
- identický obsah vrátí `duplicate: true`, takže existující UI zobrazí `Měření již uloženo` / `již dříve uloženo – nevytvořen nový záznam`;
- odlišný obsah se stejným časem není považován za duplicitu;
- race-condition testy zůstávají zachované.

Na headu `584b10cac279905a2a0f58f0e42361362a7cedd5` prošlo `124/124` unit testů, lint comparison bez nové regrese, production build a TypeScript check. CI se zastavilo pouze na project-control checkeru kvůli dříve přejmenovaným povinným nadpisům; tento dokumentační sync je opravuje.

## Nasazeno

Produkce:

- PR #21: ano;
- PR #22: ne.

Preview PR #22:

- deployment pro head `584b10cac279905a2a0f58f0e42361362a7cedd5`: `dpl_D3JxpEErMCpbvehTLnCCrL3WEyN3`;
- stav: `READY`;
- target: Preview.

## Produkčně ověřeno

PR #21 Android share/import tok: **ano**.

Production save test:

- první explicitní save: **ano, funkční**;
- opakovaný re-export stejného měření: **odhalil chybu duplicate protection**;
- PR #22 oprava: **zatím není produkčně ověřena**, protože není mergovaná ani nasazená do produkce.

## Známé problémy

- produkce aktuálně může vytvořit duplicitní Tindeq řádek, pokud stejný obsah dorazí v re-exportovaném ZIPu s jiným legacy `tindeqSessionId`;
- během kontrolovaného testu vznikl potvrzený druhý duplicitní řádek `eacaecc9-9185-4cb8-8e52-561872e49cd5`; původní řádek je `b65d0e32-6e68-407c-9d3f-385112111ea9`;
- duplicitní testovací řádek zatím nebyl smazán ani soft-deleted, protože produkční datovou mutaci je nutné provést pouze po explicitním schválení uživatele;
- první production Android share pokus PR #21 jednou transientně selhal, další dva pokusy uspěly; příčina nebyla reprodukována;
- full-repo lint baseline obsahuje předexistující `3 errors / 1 warning`, PR #22 nepřidává další lint regresi.

## Další krok

- Dokončit zelený CI/Preview gate PR #22; poté před merge vyžádat explicitní souhlas uživatele a až po produkčním deploymentu zopakovat stejný duplicate-save test.
