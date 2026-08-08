# Tindeq metric interpretation states — 2026-08-08

## Zdroj pravdy

- Výchozí `main`: `8afe1328cfcb8f7ab90bb449775d1de0d441b584`.
- Pracovní větev: `agent/tindeq-metric-statuses`.
- Draft PR: #16.
- Kódový checkpoint před evidenčním commitem: `e887791b41b8750aedd0d7ca683d189f895b9756`.

## Cíl změny

Rozšířit `/tindeq` o konzistentní, textově čitelné stavové hodnocení rozhodovacích metrik bez falešného dojmu, že každá Tindeq hodnota má univerzální klinickou hranici dobré/špatné.

## Implementace

- Centralizovaný tón: `good`, `warning`, `problem`, `neutral`.
- Centralizovaný typ významu: `protocol`, `contextual`, `descriptive`.
- Viditelné labely: `V cíli`, `Sleduj`, `Mimo cíl`, `Bez hodnocení` a přesnější technické varianty podle významu.
- Chybějící klinický kontext a nehodnotitelná data jsou neutrální; technicky vadný záznam zůstává explicitně označen jako technický problém, nikoli patologický nález.
- Barva je pouze sekundární nosič informace: tmavá hodnota + malý badge + jemný akcent.
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

- dosažení cíle: 95–105 % `good`; 90–<95 % nebo >105–110 % `warning`; mimo tento rozsah `problem`,
- čas v cíli: ≥60 % `good`; 40–59 % `warning`; <40 % `problem`,
- úspěšnost opakování: ≥70 % `good`; 50–69 % `warning`; <50 % `problem`,
- CV uvnitř kontrakce: ≤5 % stabilní; >5–8 % sledovat; >8 % vysoká variabilita,
- CV mezi opakováními: ≤8 % stabilní; >8–12 % sledovat; >12 % vysoká variabilita,
- technické flagy: ≤10 % technicky v pořádku; >10–30 % sledovat; >30 % nízká důvěra,
- bolest: zachována stávající pracovní toleranční logika `tindeq-report-v1`; chybějící údaje znamenají `Bez hodnocení`,
- kombinovaný vývoj série: zachován stávající algoritmus `tindeq-report-v1`; UI jej neoznačuje za přímé měření fyziologické únavy.

## Výpočet a data

- `src/lib/tindeq-report.ts` nebyl změněn.
- Databázové schéma, persistence, auth a environment variables nebyly změněny.
- Reakce další ráno nebyla přidána, protože není v aktuálním datovém modelu.

## Automatické ověření kódového checkpointu

Exact head: `e887791b41b8750aedd0d7ca683d189f895b9756`.

- unit tests: 103 passed, 0 failed,
- lint: branch 3 errors + 1 warning; `main` 3 errors + 1 warning — bez regrese,
- Next production build: passed,
- TypeScript `--noEmit`: passed,
- `project:check`: passed,
- `git diff --check origin/main...HEAD`: passed,
- Playwright: 10 passed,
- responsive screenshoty: klient 360/390/720/1024/1440 px; trenér 390/1024 px; bez horizontálního overflow mimo určený grafový scroller.

## Preview

- Vercel preview pro kódový checkpoint: `dpl_DeJzDnWsEHrogyCWYyHG6vtEymCN` — `READY`.
- Kanonický `/tindeq/reports/demo` byl na preview načten s HTTP 200.
- Produkční deployment této změny nebyl proveden.
- Produkční funkční ověření této změny nebylo provedeno.
