# Tindeq metric interpretation states — 2026-08-08

## Zdroj pravdy

- Původní výchozí `main`: `8afe1328cfcb8f7ab90bb449775d1de0d441b584`.
- Pracovní větev: `agent/tindeq-metric-statuses`.
- Draft PR: #16.
- Původní head před reconciliation: `904da6768fe72ed86973c93fb164dea5e1eacc87`.
- Fresh `main` při reconciliation dne `2026-08-10`: `2aad506dd482e765c61036a84b6a39a5635c90cf`.
- Fresh automaticky ověřený kódový checkpoint po reconciliation: `88dc6cce27321306f4770285c3d35d904022f669`.

## Cíl změny

Rozšířit `/tindeq` o konzistentní, textově čitelné stavové hodnocení rozhodovacích metrik bez falešného dojmu, že každá Tindeq hodnota má univerzální klinickou hranici dobré/špatné.

Uživatelský model je výslovně:

**3stupňová barevná škála + neutrální stav.**

- zelená = v pořádku / v cílovém rozmezí;
- oranžová = hraniční / vyžaduje pozornost;
- červená = problém / výrazná odchylka;
- šedá = neutrální stav pro metriku, kterou nelze korektně klasifikovat jako dobrou nebo špatnou.

Šedá není čtvrtý hodnoticí stupeň.

## Implementace

- Interní centralizovaný tón zůstává `good | warning | problem | neutral`.
- Centralizovaný typ významu: `protocol | contextual | descriptive`.
- Viditelné labely: `V cíli`, `Sleduj`, `Mimo cíl`, `Bez hodnocení` a přesnější technické varianty podle významu.
- Výsledek pro klienta i detail pro trenéra zobrazují stručnou legendu `3stupňová barevná škála + neutrální stav`; legenda explicitně říká, že šedá není čtvrtý stupeň hodnocení.
- Chybějící klinický kontext a nehodnotitelná data jsou neutrální; technicky vadný záznam zůstává explicitně označen jako technický problém, nikoli patologický nález.
- Pokud není známá platná délka pracovního intervalu, chybějící `timeTo95Seconds` se neinterpretuje jako červené `Cíl nedosažen`; bez protokolového kontextu je neutrální. Při známém intervalu a skutečně nedosaženém 95% cíli zůstává stav červený.
- Barva je pouze sekundární nosič informace: tmavá hodnota + textový badge + jemný akcent.
- Klientský pohled má tři hlavní rozhodovací karty; trenérský a kanonický report zachovávají podrobné metriky a přidávají vysvětlivky a progressive disclosure.

## Metriky s pracovním stavem

- dosažení cílové síly,
- čas v cílovém pásmu,
- úspěšnost opakování,
- CV uvnitř kontrakce,
- CV mezi opakováními,
- kombinovaný vývoj série,
- technické flagy / důvěra v záznam,
- reakce bolesti při úplných datech,
- souhrnné findingy a doporučení kanonického reportu.

## Metriky záměrně bez automatické klinické klasifikace

- předchozí maximum / MVIC,
- předepsaná intenzita jako popis předpisu,
- cílová síla jako popis zadaného cíle,
- absolutní průměrná síla,
- samotný počet úspěšných opakování `x/y`,
- samostatný trend série,
- první–poslední,
- změna času v pásmu,
- rozdíl náběhu stran,
- rozdíl normalizovaného výkonu stran,
- rozdíl absolutní průměrné síly stran.

`normalizedSideDifferencePctPoints` je výslovně označen jako rozdíl plnění vlastního cíle obou stran a není prezentován jako LSI.

## Pracovní pravidla protokolu

Zachované hranice nejsou prezentované jako klinické normy:

- dosažení cíle: 95–105 % `good`; 90–<95 % nebo >105–110 % `warning`; mimo tento rozsah `problem`;
- čas v cíli: ≥60 % `good`; 40–59 % `warning`; <40 % `problem`;
- úspěšnost opakování: ≥70 % `good`; 50–69 % `warning`; <50 % `problem`;
- CV uvnitř kontrakce: ≤5 % stabilní; >5–8 % sledovat; >8 % vysoká variabilita;
- CV mezi opakováními: ≤8 % stabilní; >8–12 % sledovat; >12 % vysoká variabilita;
- technické flagy: ≤10 % technicky v pořádku; >10–30 % sledovat; >30 % nízká důvěra;
- bolest: zachována stávající pracovní toleranční logika `tindeq-report-v1`; chybějící údaje znamenají `Bez hodnocení`;
- kombinovaný vývoj série: zachován stávající algoritmus `tindeq-report-v1`; UI jej neoznačuje za přímé měření fyziologické únavy.

## Výpočet a data

- `src/lib/tindeq-report.ts` se tímto PR nemění.
- Databázové schéma, persistence, auth a environment variables se tímto PR nemění.
- Parserové pravidlo data z PR #17 musí při reconciliation zůstat beze změny.
- Responsive navigace z PR #19 musí při reconciliation zůstat beze změny.
- Reakce další ráno nebyla přidána, protože není v aktuálním datovém modelu.

## Reconciliation 2026-08-10

Původní PR vznikl proti `main@8afe1328...`. Mezitím `main` postoupil na `2aad506...` a obsahuje mimo jiné parser opravu PR #17, responsive opravu PR #19 a následné project-control evidence commity.

Reconciliation používá jako výsledný strom aktuální `main` a přenáší do něj pouze změny vlastního scope PR #16. Výsledný merge commit `88dc6cce...` má rodiče původní PR head `904da676...` a `main@2aad506...`; GitHub po aktualizaci větve hlásí PR jako `mergeable: true`, `behind_by: 0`.

Fresh compare `main@2aad506...` → `88dc6cce...` obsahuje přesně 13 souborů scope PR #16. Neobsahuje `src/lib/tindeq-browser.ts`, `src/lib/tindeq-browser.test.ts`, `src/app/tindeq/page.tsx`, `src/app/tindeq/tindeq-nav.module.css` ani `tests/e2e/tindeq-mobile-nav.spec.ts`; nevznikl tedy rollback parseru ani mobilní navigace.

Produkční stav zůstává beze změny: poslední runtime-changing checkpoint je PR #19 (`f5e4a53...`, deployment `dpl_9MsYQkzpTgq8ENusVgjg3vpe8qVq`); nejnovější docs-only produkční deployment `main@2aad506...` je `READY`.

## Fresh automatické ověření po reconciliation

Kódový checkpoint: `88dc6cce27321306f4770285c3d35d904022f669`.

GitHub Actions:

- `Project control` run `69`: `success`;
- `Verify Tindeq client view` run `213`: `success`;
- checkout exact source commit: PASS;
- unit tests: PASS;
- lint comparison proti current main: PASS;
- Next production build: PASS;
- TypeScript check: PASS;
- project-control check: PASS;
- patch whitespace check: PASS;
- Chromium install: PASS;
- Playwright/browser verification: PASS;
- responsive screenshot artifact upload: PASS.

Vercel preview stejného checkpointu:

- deployment `dpl_6bFRYvkszDqJrq1MC4rx9BeU4nUy`;
- state: `READY`;
- branch: `agent/tindeq-metric-statuses`;
- PR: `#16`;
- GitHub combined status `Vercel`: `success`.

Preview je chráněné Vercel SSO; nepřihlášený přímý request na `/tindeq/reports/demo` proto vrací očekávaný redirect do Vercel SSO. Browser funkčnost byla ověřena v exact-head CI lokálním preview serverem.

## Historická evidence

Původní kódový checkpoint před reconciliation `e887791b41b8750aedd0d7ca683d189f895b9756` prošel 103 unit testy, buildem, TypeScriptem, lint-baseline, `project:check`, `git diff --check` a 10 Playwright testy. Také starý head `904da676...` měl oba GitHub Actions workflow checky úspěšné a Vercel status `success`.

Po změně `main` je tato stará evidence pouze historická; aktuální pre-merge evidence je fresh checkpoint `88dc6cce...` výše.

## Preview / produkce

- Fresh preview PR #16 je `READY` na kódovém checkpointu `88dc6cce...`.
- Produkční deployment PR #16 nebyl proveden.
- Produkční funkční ověření PR #16 nebylo provedeno.
- PR zůstává draft; další krok je samostatné rozhodnutí o ready-for-review / merge.
