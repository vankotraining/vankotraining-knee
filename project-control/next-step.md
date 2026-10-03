# Next Step

## Aktuální fáze

Clinical Map V1.3 a Library learning bridge jsou schváleny, sloučeny a nasazeny do produkce. Finální acceptance zůstává otevřený.

## Release checkpoint — 2026-10-03 (Europe/Prague)

Status: **DEPLOYED — final production acceptance pending; not CLOSED / VERIFIED.**

- Clinician approved V1.3 reasoning lens and coordinated release. Knee PR #29 and #30 and Library PR #10 are merged.
- Knee runtime release commit: `5cb052ce47000f6fa05f3c477f96e7f2b7617f32`; production deployment `dpl_79w5zK6DffT537wi88aQhdAw1EAQ` READY at https://knee.vankotraining.cz.
- Library runtime release commit: `1595e497aa911da61a3f16402e02abe728f21332`; production deployment `dpl_2YriU6sTECurd4zvs8PszLZpJNns` READY at https://library.vankotraining.cz.
- Authenticated production Knee loads 158 active Training exercises and V1.3 reasoning lens. Knee-extension inspector distinguishes B mapping confidence from verified Training identity.
- Live production Map → Knee-extension topic → PFP-004 Deep Read → corresponding family Map PASS. Return selects the family; it does not promise restoration of the exact previous exercise variant.
- Public learning-map manifest HTTP 200; two canonical nodes, PFP-004/PFP-002. Production PFP-004 ČJ→EN UI switch retains topic and renders English reader.
- Knee without a session is auth gated. Library shows local-only Reading; local progress is not shared between domains. Production error/fatal runtime-log query found no entries in the checked window.
- Production Library login remains absent. Its new secure credential request was blocked by automatic approval review after an earlier declined production login; no credentials or magic-link email were submitted. Live cloud persistence/synchronization and authenticated current-user RLS behavior are unverified.
- Existing bounded exact-build desktop/mobile/axe checks remain evidence; final live production mobile/accessibility checks remain pending. No production migration or clinical-data write was performed by this release.

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

1. Po výslovném schválení samostatného přihlášení do produkční Library ověřit stejný účet, cloud persistence po reloadu a Map cloud counts.
2. Dokončit live produkční mobile/accessibility smoke a autoritativní documentation read-back.
3. Teprve po těchto kontrolách označit release CLOSED / VERIFIED. Žádná nová exercise family, publikace ani Deep Read v tomto gate.
