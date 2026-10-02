# Next Step

## Aktuální fáze

Clinical Exercise Map V1.1 je **implementována, automatizovaně ověřena a nasazena jako branch-specific Preview**, ale není v `main` ani v produkci.

- větev: `feature/clinical-exercise-map-v1`;
- PR: #29 `feat: add read-only Clinical Exercise Map V1`;
- latest runtime/test-changing head: `738a4145c0f47d636f1c8433d7de1811182167df`;
- route: `/clinical/exercises`;
- režim: read-only;
- Preview env: branch-specific dev Supabase `twndqnmrvefhwuwuglju`;
- production Supabase/env: beze změny;
- merge: neproveden;
- production deployment/acceptance Clinical Map: neproveden.

## V1.1 dokončeno

- kompaktnější matrix density;
- sticky capacity header + sticky family column;
- oddělené Clinical mapping confidence a Training library link;
- clinician-first inspector;
- Clinical family vs Training library family explicitně odděleny;
- Context guardrails nepůsobí jako exercise-specific efficacy evidence;
- technická metadata pod Data / provenance;
- mobile readability pass;
- clinical mappings/data beze změny.

## Automatizovaná evidence

Runtime/test head `738a4145c0f47d636f1c8433d7de1811182167df`:

- Project control workflow `37063052302`: success;
- verification workflow `37063052373`: success;
- browser E2E: **17/17 passed**;
- unit/lint/build/TypeScript/project-control/whitespace: success;
- mobile 320/390 px: success;
- desktop sticky/density checks: success.

Exact-head Preview:

- deployment: `dpl_AKpbZ6Ao5pyKUdaTUv8dwYnAGrPo`;
- URL: `https://vankotraining-knee-23pn447xw-vankotrainings-projects.vercel.app`;
- state: `READY`;
- `/clinical/exercises` nehlásí chybějící Supabase konfiguraci.

## Unresolved mapping queue

- SL squat / podřep on stepper;
- step-down;
- TRX-assisted sit-to-heel;
- medicine-ball drop into split squat;
- assisted full-ROM split squat;
- wall-supported split squat;
- band-resisted hamstring curl.

Tyto mappingy se v V1.1 neměnily.

## Nejbližší gate

1. authenticated vizuální akceptace V1.1 na desktopu a mobilu;
2. pokud UX projde, klinické review `Knee extension → Wall isometric → Split squat`;
3. PR #29 ponechat open a unmerged do výslovného schválení.

Clinical Map V1.1 není v `main`, není produkčně nasazena a není produkčně ověřena.
