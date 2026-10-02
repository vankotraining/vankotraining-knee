# Next Step

## Aktuální fáze

Knee asymmetry runtime rollout zůstává produkčně ověřen v dříve zaznamenaném rozsahu. Read-only cross-product audit z 2026-09-29 byl merged přes PR #27.

Dne 2026-10-02 byl po hlubším auditu CLIENTS Visits a propojených zdrojů schválen nový produktový směr:

**Clinical Exercise Map V1**

- route: `/clinical/exercises`;
- top-level label: **Clinical Map**;
- V1: **read-only**;
- žádný plan generator;
- žádný zápis do CLIENTS nebo Training;
- žádná automatická diagnóza;
- žádná databázová migrace předem, pokud fresh implementační audit neprokáže, že je skutečně potřebná.

## Co je nyní doloženo

- canonical Visits obsahují výrazně více knee exercise dat než původní pilot C004/C009;
- full scan použitý 2026-10-02: 202 Visits a 15 epizod s explicitním knee/meniscus/ACL/quadriceps kontextem;
- Training exercise library obsahuje řadu exact nebo near-exact variant;
- historické KneeRehab / BV_knee_aid / !!!Exercise_Database zdroje přidávají exercise varianty a programovací zkušenost;
- Clinical Second Brain poskytuje oddělenou evidence/guardrail autoritu;
- unresolved exercise variants musí zůstat explicitně unresolved.

## Bezprostřední další krok

Po merge tohoto docs-only zápisu spustit samostatný implementační běh pro **read-only frontend Clinical Map V1**.

Implementační běh musí nejprve fresh ověřit:

1. aktuální `main`;
2. celý `project-control`;
3. současnou route/navigation strukturu;
4. produkční Supabase schema a relevantní Training data;
5. canonical CLIENTS Visits/Episodes a identity bridge;
6. zdroje Exercise Database / KneeRehab / BV_knee_aid;
7. CSB evidence boundaries.

Pak má navrhnout a implementovat nejmenší bezpečnou read-only projekci:

- top-level navigaci;
- `/clinical/exercises`;
- capacity matrix;
- canonical exercise cards;
- provenance + confidence;
- exercise inspector;
- responsive desktop/mobile layout.

## Gate

Neprovádět automatické merge/deployment rozhodnutí mimo existující projektový proces.

Stavy musí zůstat odděleny:

- navrženo;
- implementováno ve větvi;
- automatizovaně otestováno;
- preview nasazeno;
- implementováno v main;
- produkčně nasazeno;
- produkčně ověřeno.

Detailní feature brief: `clinical-exercise-map-v1-2026-10-02.md`.  
Architektonické rozhodnutí: `decisions/0002-clinical-exercise-map.md`.
