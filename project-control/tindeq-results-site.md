# Tindeq results site — PR #12 ZIP-only evidence

> [!IMPORTANT]
> Tento dokument je implementační a ověřovací evidence k PR #12, nikoli autoritativní zdroj aktuálního stavu. Aktuální stav je v [`PROJECT_STATE.md`](./PROJECT_STATE.md) a produkční stav v [`PRODUCTION_STATUS.md`](./PRODUCTION_STATUS.md). Exact-head SHA, CI run a preview deployment aktuálního PR jsou vedeny v popisu PR #12.

## Identifikace čistého rebuildu

- Repository: `vankotraining/vankotraining-knee`
- Base branch: `main`
- Clean-rebuild base SHA: `7e11aa88fb0c14b5216542d4e03101aee082ec17`
- Working branch: `agent/tindeq-results-site`
- Draft PR: `#12`
- Původní head před přepisem: `1c5c5334c5855fc02107cc05e9fe1668a585f2b2`
- Bezpečná záloha původního headu: `backup/tindeq-results-site-2026-08-07-1c5c5334`
- Produkční Vercel projekt: `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`)
- Produkční Supabase: `zxvndqicslyulrinbpyn`
- Dev Supabase: `twndqnmrvefhwuwuglju`

Git commit nemůže obsahovat vlastní SHA. Autoritativní exact-head SHA čistého rebuildu, CI run a preview deployment se proto zapisují do popisu PR #12.

## Závazný rozsah

Jediný podporovaný vstup skutečných Tindeq dat je **ZIP exportovaný z Tindeq**.

`File (.zip)` → validace ZIP → lokální rozbalení `info.csv` a `data_set_*.csv` → normalizovaná `TindeqSession` → kontrolní náhled → explicitní výběr klienta → explicitní uložení → historie → klientský pohled → trenérský detail → `tindeq-report-v1`.

PR #12 nesmí obsahovat ani znovu zavést:

- ruční session bez analyzovaného ZIPu;
- formulář jako náhradu ZIPu nebo samostatné „Přidat Tindeq záznam“;
- Bluetooth/live měření;
- automatické přiřazení klienta z názvu souboru nebo tagu;
- automatický výběr klienta po načtení databáze;
- ukládání původního ZIPu nebo celé raw časové řady;
- Tindeq plánovač nebo paralelní workflow.

PR #15 `agent/tindeq-client-workflow` byl uzavřen bez merge. Tento směr se nesmí obnovit.

## ZIP import a lokální analýza

- vstup přijímá `.zip`;
- podporuje jeden Tindeq export nebo vnější ZIP s více Tindeq ZIPy;
- ZIP se čte a rozbaluje v prohlížeči;
- původní ZIP se neposílá na server ani do Storage;
- raw časové řady slouží jen k výpočtu a nejsou součástí DB payloadu;
- session ID je deterministické a používá se jako součást aplikační idempotence;
- neplatný nebo poškozený soubor vrací konkrétní chybu.

## Explicitní klient a persistence

Po načtení klientů není nikdo automaticky vybraný. Název ZIPu ani Tindeq tag klienta nepřiřazuje. Uložení je blokované, dokud uživatel ručně nevybere klienta; tag slouží pouze jako kontrolní upozornění.

Před uložením se znovu validuje parserový tvar: 20znakové hex session ID, zdroj `.zip`, dataset `data_set_N.csv`, vypočtená opakování s 101bodovými normalizovanými křivkami, podporovaná jednotka/verze a žádné `NaN` ani `Infinity`.

Payload ukládá pouze normalizované metadata, souhrny, opakování, warnings a auditní údaje. `raw_metadata.importSource = "tindeq-zip"` eviduje povolený zdroj.

Každá session se ukládá samostatně. Částečná chyba je transparentní a retry opakuje pouze neúspěšné sessions.

## Duplicita

Před insert se pro stejného klienta a `analysis_version` hledá aktivní řádek se stejným `raw_metadata.tindeqSessionId`.

- nalezený záznam se vrací jako již uložený;
- nový řádek nevznikne;
- jde o aplikační idempotenci, nikoli databázově atomickou unikátnost;
- DB unique invariant patří do samostatné schválené migrace a není součástí této fáze.

## Klientský, trenérský a kanonický report

Klientský i trenérský pohled používají stejnou normalizovanou `TindeqSession`; rozdíl je v množství detailu. Kanonická rozhodovací vrstva je `src/lib/tindeq-report.ts`, verze `tindeq-report-v1`.

Chybějící údaje zůstávají `null`, včetně bolesti. Technicky nehodnotitelný záznam se nesmí interpretovat jako normální ani generovat jistou progresi/regresi. Pracovní prahy jsou transparentní heuristiky, ne diagnostické cut-off hodnoty.

Demo na `/tindeq/reports/demo` je anonymní, syntetické, read-only, nepoužívá Supabase a nemůže vstoupit do persistence.

## Databázový stav při rebuildu 7. 8. 2026

### Produkce `zxvndqicslyulrinbpyn`

- `67` klientů celkem / `66` aktivních;
- `1` auth user;
- `0` celkových / `0` aktivních Tindeq sessions;
- migrace `20260802124337 tindeq_sessions` je již aplikovaná;
- žádná produkční DDL ani datová změna není součástí clean rebuildu.

### Dev `twndqnmrvefhwuwuglju`

- `1` aktivní klient;
- `1` auth user;
- `1` aktivní Tindeq session;
- tabulka stále obsahuje dodatečné sloupce a `import_fingerprint` z ukončeného PR #15;
- dev proto ještě není srovnaný s cílovým ZIP-only schématem a jeho cleanup patří do následné fáze.

## Auth a environment

Magic link používá `emailRedirectTo = new URL("/tindeq", window.location.origin)` a `shouldCreateUser: false`. Reálný doručený magic-link e-mail a návrat na přesný preview hostname zůstávají ruční acceptance gate.

Současný `TindeqEnvironmentGuard` zatím kontroluje hostname/path, nikoli skutečný Supabase project ref. Před zápisovou acceptance je nutné implementovat a ověřit DB-aware environment guard v následné fázi.

## Známé technické dluhy po čistém rebuildu

Clean history rebuild záměrně nemění funkční rozsah. Následný clean-code krok musí zejména:

- rozdělit příliš velký `TindeqAnalyzer.tsx` podle odpovědností;
- odstranit rozhodování o vizuálním tónu z českých presentation stringů a používat typované statusy;
- zkontrolovat závislosti a deterministickou instalaci;
- zachovat jedinou výpočetní/rozhodovací vrstvu a ZIP-only persistence cestu.

## Merge gates

PR zůstává draft. Před ready for review zbývá exact-head CI na čistém rebuildu, clean-code refactor, srovnání dev Supabase, DB-aware environment guard, exact-head preview se schváleným dev projektem, reálný magic-link/ZIP acceptance a rozhodnutí o DB unique invariant/Vercel duplikátu podle samostatných approval gates.
