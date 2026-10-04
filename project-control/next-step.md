# Next Step

## Aktuální fáze

Clinical Map V1.3 a Library learning bridge jsou CLOSED / VERIFIED a produkčně nasazené. Také následná publikace pěti studií v Library je CLOSED / VERIFIED. Pro toto propojení není otevřený implementační workstream; režim USE / OBSERVE.

## Release checkpoint — 2026-10-03 (Europe/Prague)

Status: **CLOSED / VERIFIED — KNEE LEARNING HUB V1; runtime remains in production.**

- Clinician approved V1.3 reasoning lens and coordinated release. Knee PR #29 and #30 and Library PR #10 are merged.
- Original bridge V1 runtime release commits were Knee `5cb052ce47000f6fa05f3c477f96e7f2b7617f32` and Library `1595e497aa911da61a3f16402e02abe728f21332`; these identify the original bridge release. Later Library content publication is recorded separately below; docs-only commits do not change runtime behavior.
- At bridge V1 acceptance, the production learning-map manifest returned HTTP 200 with the two canonical nodes and PFP-004/PFP-002. Live Map → topic → Deep Read → corresponding Map navigation PASS.
- Authenticated Library production sign-in and cloud persistence PASS. Canonical `library_progress` contains PFP-004 / shared / reading-v1 with state `reading`; authenticated own-row RLS read-back PASS.
- Authenticated production Knee browser read-back PASS: Knee extension shows `Cloud: 0 přečteno · 1 rozpracováno · 0 nepřečteno · další stav neznámý` and links to the canonical Library topic.
- Final live responsive/accessibility smoke PASS: Library topic 390/320 px has no horizontal overflow and 0 axe violations scoped to main; PFP-004 bilingual/backlink smoke at 390 px has no overflow and 0 axe violations scoped to main; authenticated Knee learning panel at 390 px has no overflow, 0 axe violations and no page errors.
- Final Vercel runtime-error scans found no runtime errors for Library or Knee in the inspected window.
- No production migration, clinical-data write, new evidence authority, new Deep Read or new feature scope was introduced by this closeout.
- Next operating mode: USE / OBSERVE. Open another feature workstream only from recurring decision-relevant friction/value; existing Deep Read publication gate remains unchanged.

### Subsequent Library content publication — verified current projection

Library PR #12 published AMI-001, AMI-002, AMI-003, ACL-012 and ACL-014 in CZ/EN at runtime commit `140f16e1561a52fd53dedcb5fb8fdb7ef9c051ae`; final documentation commit `f68678940d35c833691711ac483dd86536a24088` is production READY as `dpl_56GHFUWMS3Q41kTwry1kZobVX4eD`. Library now has 11 published Deep Reads. Each of the two existing Knee topics exposes 7 unique sources across Start here / Core / Deep dive / Context / Update. This content expansion is CLOSED / VERIFIED under its explicit one-off publication override; default future publication governance is restored. No new clinical taxonomy or evidence authority was created.

Knee final acceptance documentation commit `07dc0b940b3caecfe7e2842d890caae64b890c44` is production READY as `dpl_FV8J4qqnEHLvjRYxhwYkUKxnjmox`. Current deployment IDs are verification snapshots, not immutable aliases.

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

## Další provozní krok

Používat ověřené propojení Clinical Map → téma → Deep Read → odpovídající Clinical Map a sledovat opakovanou produktovou friction. Pro bridge V1 nezůstává otevřený přihlašovací, cloudový ani production acceptance gate. Další feature workstream vyžaduje samostatný podnět; pro další publikace platí obnovené výchozí Library governance.
