# Tindeq results site — PR #12 ZIP-only source of truth

Stav auditu: **4. 8. 2026**

## Identifikace

- Repository: `vankotraining/vankotraining-knee`
- Base branch: `main`
- Ověřený base SHA: `71d6b1f0e67c571c71a53db6248e526704bddabe`
- Working branch: `agent/tindeq-results-site`
- Draft PR: `#12`
- Head před konsolidací: `e368500e8c138930d675e9336d4a02dd70e4c3a8`
- Produkční doména: `knee.vankotraining.cz`
- Produkční Vercel projekt: `vankotraining-knee` (`prj_WLfkUldcNfXn43KmsXpJAClaKOsI`)
- Produkční Supabase: `zxvndqicslyulrinbpyn`
- Dev Supabase: `twndqnmrvefhwuwuglju`

Git commit nemůže obsahovat vlastní SHA. Autoritativní exact-head SHA, CI run a Vercel deployment se proto po každém finálním commitu zapisují do popisu PR #12. Tento dokument eviduje auditovaný base/head a stabilní produktová pravidla.

## Stavová terminologie

- **Implementováno**: změna existuje na pracovní větvi.
- **Preview nasazeno**: READY preview má metadata přesného aktuálního head SHA.
- **Produkčně nasazeno**: přesný commit je deploymentem připojen k produkční doméně.
- **Produkčně ověřeno**: uživatel po produkčním nasazení změnu výslovně zkontroloval a potvrdil.

Automatizovaný test ani READY deployment nejsou produkční ověření.

## Závazný rozsah

Jediný podporovaný vstup skutečných Tindeq dat je **ZIP exportovaný z Tindeq**.

Podporovaný tok:

`File` → validace ZIP → lokální rozbalení `info.csv` a `data_set_*.csv` → normalizovaná `TindeqSession` → kontrolní náhled → explicitní výběr klienta → explicitní uložení → historie → klientský/trenérský pohled → kanonický report.

### Non-goals

PR #12 nesmí obsahovat ani znovu zavést:

- ruční session bez analyzovaného ZIPu,
- formulář jako náhradu ZIPu,
- samostatné „Přidat Tindeq záznam“,
- Bluetooth/live měření,
- automatické přiřazení klienta z názvu souboru nebo tagu,
- ukládání původního ZIPu,
- ukládání celé raw časové řady,
- Tindeq plánovač nebo paralelní workflow.

PR #15 `agent/tindeq-client-workflow` byl uzavřen bez merge a vzdálená větev odstraněna. Tento směr je ukončený a nesmí se obnovit pod jiným názvem.

## Audit změněných oblastí PR #12

| Oblast | Hlavní soubory | Hodnocení pro ZIP-only merge |
|---|---|---|
| ZIP parser a analýza | `src/lib/tindeq-browser.ts` | **Nutné.** Jediný runtime vstup, lokální čtení ZIP, `info.csv`, `data_set_*.csv`, normalizace a stabilní session ID. |
| Tindeq datové typy | `src/lib/tindeq-browser.ts`, `src/lib/tindeq-persistence*.ts` | **Nutné.** Sdílený normalizovaný model pro UI, persistence i report. |
| Výpočetní metriky | `tindeq-browser.ts`, `tindeq-client-view.ts`, `tindeq-report.ts` | **Nutné / zachovat.** Standardní knee-extension metriky se touto konsolidací nemění. |
| Klientský pohled | `TindeqAnalyzer.tsx`, `tindeq-client-view.ts` | **Nutné.** Zobrazuje klidný souhrn nad stejnou session jako trenér. |
| Trenérský pohled | `TindeqAnalyzer.tsx` | **Užitečné a již koherentní.** Neobsahuje druhý výpočetní systém; zachováno. |
| Historie a persistence | `TindeqWorkspace.tsx`, `tindeq-persistence*.ts` | **Nutné.** Explicitní klient, normalizovaný payload, partial retry a historie. |
| Kanonický report | `tindeq-report.ts`, `TindeqReportView.tsx`, `/reports` | **Užitečné, ne minimální podmínka importu.** Logika je centralizovaná a testovaná, proto zůstává v PR #12. |
| Demo report | `tindeq-report-demo.ts`, `/reports/demo` | **Užitečné, ne nutné.** Zachováno pouze jako jasně označené anonymní read-only demo bez Supabase. |
| Autentizace a redirect | `TindeqEnvironmentGuard.tsx`, `TindeqWorkspace.tsx`, `use-supabase-session.ts` | **Nutné.** Redirect používá aktuální origin a pevnou trasu `/tindeq`; reálný e-mail je stále ruční gate. |
| Supabase integrace | `tindeq-persistence*.ts`, session hook | **Nutné.** Používá stávající browser client a RLS. |
| SQL/migrace | `20260802_tindeq_sessions.sql`, checks | **Nutné jako již aplikovaný základ.** Konsolidace nevyžaduje novou produkční migraci. |
| Testy | unit + Playwright | **Nutné.** Pokrývají parser, ZIP-only guard, persistence, report, auth source a browser workflow. |
| CI | `.github/workflows/tindeq-client-view.yml` | **Nutné.** Exact checkout, unit, lint baseline, build, optional project check, diff check a browser testy. |
| Dokumentace | `project-control/*`, PR body | **Nutné.** PR body je exact-head evidence ledger; project-control drží stabilní pravidla a gate. |
| Odkaz z hlavní stránky | `src/app/page.tsx` | **Užitečné, ne kritické.** Pouze navigace; nevytváří alternativní vstup. |

Audit runtime importů a props nenašel v PR #12 produkční formulář, query parametr, localStorage cestu, mockovací tlačítko ani skryté alternativní UI, které by vytvářelo skutečnou session bez ZIPu.

## Výsledný ZIP-only workflow

### 1. Nahrání

- vstupní prvek přijímá `.zip`,
- podporuje jeden Tindeq export nebo vnější ZIP obsahující více Tindeq ZIPů,
- neplatný nebo poškozený soubor vrací konkrétní chybu.

### 2. Lokální analýza

- ZIP se čte a rozbaluje v prohlížeči,
- původní ZIP se neposílá na server ani do Storage,
- raw časové řady se používají jen pro výpočet a nejsou součástí DB payloadu,
- session ID je deterministický zkrácený SHA-256 nad archivem a názvem datasetu.

### 3. Kontrola

Před uložením jsou dostupné:

- nalezené sessions/datasety,
- protokol a metadata,
- počet očekávaných a detekovaných opakování,
- levá/pravá cílová síla a metriky,
- technická varování a neúplnost.

Chybějící nebo nehodnotitelná data se nezaměňují za nulu.

### 4. Explicitní klient

- po načtení klientů není nikdo automaticky vybraný,
- název ZIPu ani Tindeq tag klienta nepřiřazuje,
- uložení je blokované, dokud uživatel ručně nevybere klienta,
- tag slouží pouze jako kontrolní upozornění.

### 5. Persistence

Před uložením se znovu validuje parserový tvar:

- 20znakové hex session ID,
- zdrojový název `.zip`,
- dataset `data_set_N.csv`,
- vypočtená opakování s normalizovanými 101bodovými křivkami,
- žádné `NaN` ani `Infinity`,
- podporovaná `analysis_version`, jednotka a klientské UUID.

Payload ukládá jen normalizované metadata, souhrny, opakování, warnings a auditní údaje. `raw_metadata.importSource = "tindeq-zip"` eviduje povolený zdroj. Původní ZIP ani raw časová řada se neukládají.

### Částečná chyba a retry

- každá session se ukládá samostatně v pořadí importu,
- výsledek každé položky je transparentní,
- úspěšné položky zůstávají označené jako uložené,
- retry odesílá pouze neúspěšné položky.

### Duplicita

Před insert se pro stejného klienta a `analysis_version` hledá aktivní řádek se stejným `raw_metadata.tindeqSessionId`.

- nalezený záznam se považuje za již uložený,
- nový řádek se nevytvoří,
- není vyžadována nová produkční migrace.

Toto je aplikační idempotence, nikoli databázově atomická unikátnost. Dva přesně souběžné inserty mohou teoreticky závodit. DB unikátní index je vhodný až v samostatně schválené migraci, pokud se ukáže reálná potřeba.

## Klientský a trenérský pohled

Oba pohledy přijímají stejnou normalizovanou `TindeqSession` a sdílené helpery. Rozdíl je pouze v detailu zobrazení:

- klient: jednoduchý souhrn výsledku série,
- trenér: jednotlivá opakování, cílové pásmo, variabilita, trend a technické flagy.

Výpočty se neduplikují v oddělených UI systémech.

## Kanonický report

- verze: `tindeq-report-v1`,
- jediná rozhodovací vrstva: `src/lib/tindeq-report.ts`,
- stejný builder pro aktuální, uloženou i demo session,
- každé zjištění uvádí metriku a pravidlo,
- `null` zůstává `null`, včetně chybějící bolesti,
- pracovní prahy jsou transparentní heuristiky, ne diagnostické cut-off hodnoty,
- technicky nehodnotitelný záznam negeneruje jistou progresi/regresi.

Report je pro první merge zachován, protože je centralizovaný a nepřidává alternativní vstup ani persistence cestu. Rozšíření klinických dat a dlouhodobých trendů patří do následného PR.

## Databázový audit

### Produkční Supabase `zxvndqicslyulrinbpyn`

Audit 4. 8. 2026:

- `public.tindeq_sessions` existuje,
- 0 celkových a 0 aktivních Tindeq řádků,
- RLS je zapnuté,
- vazba na `athletes(id)` a soft-delete/auditní sloupce existují,
- produkční migrace PR #12 je v historii,
- současné schéma bezpečně podporuje normalizovaný ZIP-only payload,
- **žádná další produkční migrace není pro konsolidaci nutná ani povolená bez schválení**.

### Dev Supabase `twndqnmrvefhwuwuglju`

Audit 4. 8. 2026:

- projekt je technicky zdravý,
- `tindeq_sessions` je prázdná,
- projekt nemá auth uživatele ani klienty pro acceptance,
- schéma obsahuje pozůstatky uzavřeného PR #15 (dodatečná pole a fingerprint index),
- dev prostředí proto **není acceptance-ready**.

Před ručním acceptance je nutné dev projekt cíleně srovnat se schváleným PR #12 schématem a vytvořit pouze schválená testovací data. Produkční data se k acceptance nepoužijí. Tato konsolidace dev databázi automaticky nemění.

## Magic-link redirect

Implementovaný požadavek:

- `emailRedirectTo = new URL("/tindeq", window.location.origin)`,
- `shouldCreateUser: false`,
- žádný `next` query parametr se nepoužívá,
- environment guard povoluje jen Knee produkci, localhost a hostname projektu `vankotraining-knee-*` na `/tindeq`.

Automatizované testy ověřují zdrojovou logiku a session callback. Nenahrazují reálný test doručeného magic-link e-mailu. Preview a produkční návrat z e-mailu jsou ruční approval gate; dočasný produkční auth uživatel se bez schválení nevytváří.

## CI a exact-head evidence

Workflow pro exact source commit provádí:

1. checkout přesného PR head/push SHA,
2. `npm test`,
3. porovnání lint chyb s aktuálním `main`,
4. `npm run build`,
5. `npm run project:check`, pokud script existuje,
6. `git diff --check origin/main...HEAD`,
7. `npm run test:e2e`,
8. upload screenshot artifactu označeného head SHA.

Konkrétní final head, unit/Playwright počty, lint baseline, run ID a deployment ID se zapisují až po doběhnutí do PR body. Starší SHA/run/deployment nejsou exact-head evidence.

## Nevyřešená rizika a merge gates

1. Dev Supabase musí být srovnaný a bezpečně připravený pro acceptance.
2. Exact-head GitHub Actions musí projít.
3. Musí existovat READY preview přesného commitu se schváleným dev Supabase.
4. Uživatel musí ověřit skutečný magic link a návrat na stejný preview hostname.
5. Uživatel musí dokončit ruční ZIP acceptance níže.
6. Aplikační deduplikace není atomická proti souběžnému závodu; pro běžný ruční import je chování definované.
7. Kryptografický důkaz původu bez odeslání ZIPu není možný; persistence proto validuje parserový tvar a důvěřuje lokálnímu analyzátoru v chráněném runtime.
8. PR zůstává draft, dokud nejsou gate splněné.

## Ruční acceptance checklist

- [ ] Otevřít exact-head preview uvedené v PR body.
- [ ] Odeslat magic link z tohoto preview.
- [ ] Kliknout na doručený e-mail a potvrdit návrat na stejný preview hostname a `/tindeq`.
- [ ] Nahrát jeden skutečný ZIP exportovaný z Tindeq.
- [ ] Ověřit rozpoznaný protokol.
- [ ] Ověřit počet nalezených sessions.
- [ ] Ověřit levé a pravé hodnoty/strany.
- [ ] Ověřit hlavní metriky a technická upozornění.
- [ ] Potvrdit, že před ručním výběrem není zvolen klient a save je blokovaný.
- [ ] Ručně vybrat správného testovacího klienta.
- [ ] Explicitně uložit.
- [ ] Reloadnout stránku.
- [ ] Ověřit historii vybraného klienta.
- [ ] Ověřit klientský pohled.
- [ ] Ověřit trenérský detail.
- [ ] Ověřit `tindeq-report-v1`.
- [ ] Nahrát neplatný/poškozený ZIP a ověřit konkrétní chybu.
- [ ] Nahrát stejný ZIP znovu a potvrdit, že nevznikl druhý aktivní řádek.
- [ ] Ověřit mobilní zobrazení.
- [ ] Ověřit desktopové zobrazení.
- [ ] Potvrdit, že nikde není jiný vstup skutečných Tindeq dat než ZIP.
- [ ] Odstranit všechna acceptance testovací data z dev prostředí.

## Produkční stav

Konsolidace PR #12:

- nemění `main`, dokud nedojde k řízenému merge,
- nespouští produkční deployment,
- nespouští produkční migraci,
- neoznačuje nic jako produkčně ověřené bez explicitního potvrzení uživatele.
