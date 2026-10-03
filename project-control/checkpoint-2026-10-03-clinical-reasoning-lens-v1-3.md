# Checkpoint — Clinical reasoning lens V1.3 — 2026-10-03

## Proč vznikla změna

Clinician review potvrdil, že Clinical Map nemá předepisovat šablonovitý postup. Jejím účelem je dát rychlý přehled o relevantních proměnných, limitech, možnostech modifikace a response tak, aby podporovala klinickou rozvahu.

## Accepted product principle

Clinical Map podporuje rozhodování, ale nerozhoduje.

Hlavní vizuální model:

`State → Limiter → Modifiers → Options → Response`.

Nejde o povinnou posloupnost. Jednotlivé prvky lze používat paralelně podle klinického úsudku.

## Quiet knee

`Quiet knee` je pracovní state/readiness construct, nikoli samostatný exercise goal a nikoli binární gate.

Praktický význam: koleno je dostatečně settled pro zamýšlenou progresi. Přítomnost mírné bolesti nebo effusion sama o sobě neznamená zákaz strength work, pokud response a procedure guardrails dovolují zatížení.

## Evidence authority

Čerstvě ověřené CSB:

- ACL-014 — APPRAISED;
- AMI-003 — APPRAISED;
- AMI-004 — APPRAISED;
- AMI-CLM-003 — ACTIVE.

Relevantní Living Claims pro reasoning lens:

- ACL-CLM-008;
- AMI-CLM-002;
- AMI-CLM-003.

AMI-CLM-003 zpřesňuje, že post-ACLR quadriceps dysfunction je multifaktoriální. Effusion je response marker, ale jeho snížení není proxy pro obnovu activation/strength.

## Implementace

Runtime/test commit:

`0b019c31b146a8f7c84f06fe352d0c6abb1025d7` — `feat: simplify Clinical Map into reasoning lens`.

UI nyní zobrazuje:

- State;
- Limiter;
- Modifiers;
- Options;
- Response;
- stručnou `Quiet knee` poznámku;
- CSB guardrails;
- reviewed goal `Restore knee extension & quadriceps control` pouze jako jeden goal uvnitř širšího reasoning modelu.

Použité options zahrnují přehledově terminal extension / quad set, isometric knee extension / Tindeq, machine knee extension a squat / assisted split squat. Management a adjuncts jsou vizuálně oddělené od exercise identity.

## Verification

První runtime workflow narazil pouze na trailing whitespace v dřívějším docs souboru `0003-clinical-goal-layer.md`; unit, lint-vs-main, build, TypeScript a project-control již byly zelené.

Whitespace byl opraven commitem:

`74472741b3c30b901a3b0e4b2a6c458bea9c05e7` — `chore: fix project-control whitespace`.

Následný exact-head verification:

- Project control: success;
- verify workflow: success;
- patch whitespace: success;
- browser verification: success;
- Preview `dpl_8qXfYoqLmssz7bwyEhEBPyZjB5sP`: READY;
- URL: `https://vankotraining-knee-2g27lrz65-vankotrainings-projects.vercel.app`.

## Safety

- PR #29 open/unmerged.
- `main` beze změny.
- Production Vercel beze změny.
- Production/dev Supabase beze změny.
- Žádný generator, dosing engine, auto diagnosis ani RTS verdict.
- Clinical Map zůstává read-only.
