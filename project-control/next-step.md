# Next Step

## Aktuální fáze

Clinical Exercise Map V1.3 je **implementována, automatizovaně ověřena a nasazena jako branch-specific Preview**, ale není v `main` ani v produkci.

- větev: `feature/clinical-exercise-map-v1`;
- PR: #29 `feat: add read-only Clinical Exercise Map V1`;
- latest runtime/test-changing head: `0b019c31b146a8f7c84f06fe352d0c6abb1025d7`;
- current verified branch head before this docs checkpoint: `74472741b3c30b901a3b0e4b2a6c458bea9c05e7`;
- route: `/clinical/exercises`;
- režim: read-only;
- Preview env: branch-specific dev Supabase `twndqnmrvefhwuwuglju`;
- production Supabase/env: beze změny;
- merge: neproveden.

## V1.3 — clinical reasoning lens

Na základě clinician review byl horní model zjednodušen. Clinical Map nemá fungovat jako rehab protocol nebo checklist, ale jako **vizuální rozvaha proměnných a možností jejich modifikace**.

Hlavní reasoning lens:

`State → Limiter → Modifiers → Options → Response`

### State
- pain / reactivity;
- effusion / swelling;
- ROM;
- quadriceps activation;
- force / capacity;
- load acceptance / confidence.

### Limiter
- extension loss;
- high reactivity / effusion;
- pain-limited loading;
- poor quadriceps activation / AMI;
- quadriceps force deficit;
- poor terminal extension control;
- poor load acceptance / gait;
- apprehension / low confidence;
- procedure / tissue restriction.

### Modifiers
- load;
- ROM;
- contraction type;
- assistance / support;
- laterality;
- tempo / velocity;
- exposure / frequency;
- exercise / environment.

### Options
Management, použité exercise options a adjuncts jsou zobrazené jako možnosti, nikoli jako povinná posloupnost. Současně může běžet více cílů a intervencí.

### Response
- same-day tolerance;
- delayed response;
- swelling / reactivity;
- ROM;
- activation / control;
- force / performance.

`Quiet knee` je prezentováno pouze jako pracovní readiness description — koleno dostatečně klidné pro zamýšlenou progresi — nikoli jako binární pass/fail gate.

## Evidence update

Nově zpracované CSB zdroje:

- `ACL-014` — APPRAISED;
- `AMI-003` — APPRAISED;
- `AMI-004` — APPRAISED;
- `AMI-CLM-003` — ACTIVE.

V1.3 používá guardrails `ACL-CLM-008`, `AMI-CLM-002` a `AMI-CLM-003`. Effusion zůstává důležitý marker joint response, ale nesmí být používán jako proxy pro AMI nebo quadriceps strength.

## Co zůstává zachováno

- capacity matrix;
- exercise family / Training identity;
- A/B/C clinical mapping confidence;
- provenance;
- reviewed goal `Restore knee extension & quadriceps control` jako jeden cíl uvnitř širší rozvahy;
- `Terminal extension / quadriceps activation` jako reviewed direct clinical-use option;
- unresolved mapping queue beze změny.

## Automatizovaná evidence

Runtime/test head `0b019c31b146a8f7c84f06fe352d0c6abb1025d7`:

- unit tests: success;
- lint-vs-main: success;
- build: success;
- TypeScript: success;
- project-control: success;
- browser verification: success po následné whitespace correction na branch head;
- Vercel Preview runtime: READY.

Whitespace issue v dřívějším decision dokumentu byl opraven commitem `74472741b3c30b901a3b0e4b2a6c458bea9c05e7`; následný exact-head verification workflow prošel.

Exact-head Preview před tímto docs-only checkpointem:

- deployment: `dpl_8qXfYoqLmssz7bwyEhEBPyZjB5sP`;
- URL: `https://vankotraining-knee-2g27lrz65-vankotrainings-projects.vercel.app`;
- state: `READY`.

## Nejbližší gate

1. clinician visual review V1.3 reasoning lens na desktopu;
2. neupravovat další exercise family, dokud nebude jasné, že tato úroveň přehledu je prakticky užitečná;
3. PR #29 ponechat open a unmerged do výslovného schválení.

Clinical Map V1.3 není v `main`, není produkčně nasazena a není produkčně ověřena.
