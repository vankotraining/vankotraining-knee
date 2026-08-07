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
- Phase-2 exact head: `717dcfe7056b5547c17dd748c7ed9bb3b301f48e`
- Produkční Vercel projekt: `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`)
- Produkční Supabase: `zxvndqicslyulrinbpyn`
- Dev Supabase: `twndqnmrvefhwuwuglju`

Git commit nemůže obsahovat vlastní SHA. Autoritativní exact-head SHA fáze 3, její CI run a případný preview deployment se proto zapisují do popisu PR #12.

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

PR #15 byl uzavřen bez merge. Tento směr se nesmí obnovit.

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

Před uložením se znovu validuje parserový tvar, podporovaná jednotka/verze, vypočtená opakování, normalizované křivky a absence `NaN`/`Infinity`.

Payload ukládá pouze normalizované metadata, souhrny, opakování, warnings a auditní údaje. `raw_metadata.importSource = "tindeq-zip"` eviduje povolený zdroj. Původní ZIP ani raw časová řada nejsou persistované.

Každá session se ukládá samostatně. Částečná chyba je transparentní a retry opakuje pouze neúspěšné sessions.

## Duplicita

Před insert se pro stejného klienta a `analysis_version` hledá aktivní řádek se stejným `raw_metadata.tindeqSessionId`.

- nalezený záznam se vrací jako již uložený;
- nový řádek nevznikne;
- jde o aplikační idempotenci, nikoli databázově atomickou unikátnost;
- DB unique invariant patří do samostatné schválené migrace a není součástí fáze 3.

## Klientský, trenérský a kanonický report

Klientský i trenérský pohled používají stejnou normalizovanou `TindeqSession`; rozdíl je v množství detailu. Kanonická rozhodovací vrstva zůstává `src/lib/tindeq-report.ts`, verze `tindeq-report-v1`.

Chybějící údaje zůstávají `null`, včetně bolesti. Technicky nehodnotitelný záznam se nesmí interpretovat jako normální ani generovat jistou progresi/regresi. Pracovní prahy jsou transparentní heuristiky, ne diagnostické cut-off hodnoty.

Demo na `/tindeq/reports/demo` zůstává anonymní, syntetické, read-only, nepoužívá Supabase a nemůže vstoupit do persistence.

## Fáze 3 — clean-code refactor

Phase-2 baseline měl `TindeqAnalyzer.tsx` o 910 řádcích. Soubor míchal import, persistence orchestration, formátování, graf, klientský pohled, trenérský detail a tabulku opakování. Současně funkce `toneForStatus(value: string)` určovala CSS tón fuzzy vyhledáváním českých slov přes `toLocaleLowerCase()` a `includes()`.

Fáze 3 zachovává stejné výpočty, prahy, texty a persistence data, ale rozděluje odpovědnosti:

- `TindeqAnalyzer.tsx` — ZIP import, session selection a save/retry orchestrace;
- `TindeqSessionResult.tsx` — klientský/trenérský výsledkový panel a tabulkový detail;
- `TindeqResultChart.tsx` — normalizovaný overlay graf;
- `TindeqResultCards.tsx` — levá/pravá side-card prezentace;
- `tindeq-presentation.ts` — sdílené formátování a mapování explicitního tone na CSS;
- `tindeq-client-view.ts` — view-model vrstva vracející explicitní `good | warning | problem | neutral` tone společně s uživatelským label-em.

Vizuální tón se už v React renderingu neodvozuje z formulace prezentačního textu. Status je určen z numerické metriky nebo přesné kanonické analytické domény a UI pouze mapuje typovaný tone na existující CSS class. Totéž platí pro neutrální stav klientských warnings; UI už nekontroluje, zda text začíná konkrétní českou větou.

Výpočetní parser `tindeq-browser.ts`, persistence payload, DB schema, `tindeq-report-v1`, auth flow a environment guard nejsou touto fází funkčně měněny.

## Testy clean-code invariantu

Unit/source regression testy nově hlídají zejména:

- výsledkový tablist je v samostatné výsledkové komponentě a nepouští novou analýzu;
- `TindeqAnalyzer` už neobsahuje graf ani side-card komponenty;
- výsledkový React rendering neobsahuje `toneForStatus` ani fuzzy lowercase/`includes()` klasifikaci prezentačních statusů;
- dobrý, varovný, problémový a nehodnotitelný stav mají explicitní tone;
- stávající textové labely, warning překlady, null handling a klientské výstupy zůstávají regresně kryté.

Exact-head výsledky GitHub Actions se zapisují do popisu PR #12 až po vytvoření commitu.

## Audit závislostí

`fflate` je importována pouze syntetickým test fixture pro vytváření ZIPů v testech; produkční `tindeq-browser.ts` používá vlastní browser-side ZIP parser. `fflate` proto správně zůstává v `devDependencies`.

Repo stále nemá `package-lock.json` a workflow používá `npm install`. Deterministická instalace je známý merge-gate dluh. Lockfile se nesmí ručně fabricovat bez skutečného npm resolution; bude řešen samostatně, jakmile lze vytvořit a CI ověřit autentický lockfile.

## Databázový stav před fází 3

### Produkce `zxvndqicslyulrinbpyn`

- `67` klientů celkem / `66` aktivních;
- `1` auth user;
- `0` celkových / `0` aktivních Tindeq sessions;
- žádná produkční DDL ani datová změna není součástí clean-code refaktoru.

### Dev `twndqnmrvefhwuwuglju`

- `1` aktivní klient;
- `1` auth user;
- `1` aktivní Tindeq session;
- schema drift z ukončeného PR #15 zůstává pro následující fázi.

## Auth a environment

Magic link nadále používá návrat na aktuální Knee origin a `/tindeq`; auth chování fáze 3 nemění.

Současný `TindeqEnvironmentGuard` stále kontroluje hostname/path, nikoli skutečný Supabase project ref. DB-aware environment guard je záměrně odložen do následné samostatné fáze, aby se bezpečnostní změna nemíchala s čistým refaktorem.

## Merge gates po fázi 3

PR zůstává draft. Po exact-head CI clean-code commitu zbývá zejména:

- srovnat dev Supabase s kanonickým ZIP-only stavem;
- implementovat a ověřit DB-aware environment guard;
- vyřešit deterministickou instalaci;
- navrhnout DB unique invariant a produkční DDL provést pouze po explicitním schválení;
- konsolidovat druhý Vercel projekt podle samostatného approval gate;
- projít reálný magic-link a skutečný ZIP acceptance na exact-head preview s nezávisle potvrzeným dev Supabase.
