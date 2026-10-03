# Checkpoint — Clinical goal layer V1.2 — 2026-10-03

## Scope

Read-only rozšíření Clinical Exercise Map o první canonical clinical goal / limiter layer po schváleném klinickém review a po zpracování relevantních zdrojů v Clinical Second Brain.

Žádná produkční DB změna, žádná migrace, žádný plan generator, dosing engine, automatická diagnóza ani RTS verdict.

## Evidence authority

CSB bylo čerstvě ověřeno jako zpracované:

- `ACL-012` Aspetar ACLR rehabilitation guideline — APPRAISED;
- `ACL-013` Buckthorpe et al. early-stage ACLR framework — APPRAISED;
- `AMI-001` Hart et al. quadriceps activation systematic review — APPRAISED;
- `AMI-002` Sonnery-Cottet et al. AMI interventions review — APPRAISED.

Relevant ACTIVE Living Claims:

- `ACL-CLM-008`;
- `AMI-CLM-001`;
- `AMI-CLM-002`.

Clinical Map je pouze projekce těchto guardrails; nevytváří novou evidence authority.

## Architecture decision

Původní model:

`diagnosis/operation → guardrails → limiter/capacity → load requirement → exercise family → variant → future dose → response`

je zpřesněn na:

`diagnosis/operation → guardrails → clinical goal → limiter → capacity → exercise family → variant → future dose → response`.

Clinical goal a exercise identity jsou oddělené vrstvy.

První canonical goal:

`Restore knee extension & quadriceps control`.

Goal není rigidní časová fáze. Konkrétní exercise varianty jsou options pod cílem a musí být reviewované samostatně.

## Implementace

Runtime/test commit:

`45d7fbea195a4906889da9fa6c91cb723a775f5a` — `feat: add clinical goal layer for early knee rehab`

Změny:

- goal layer nad stávající capacity matrix;
- čtyři goal components a pět limiterů;
- explicitní CSB authority chips;
- reviewed card `Terminal extension / quadriceps activation`;
- direct CLIENTS provenance z C044 Visit 2026-09-29;
- Training link ponechán `none`, protože exact canonical Training variant není reviewována;
- `Isometric knee extension` napojena jako supporting option;
- inspector zobrazuje Clinical goal links, components a limiter targets;
- absence goal linku neznamená klinickou irelevanci — další linky vznikají pouze review procesem.

## Verification

- Project control workflow `37108795338`: success.
- Verify Tindeq client view workflow `37108795533`: success.
- Unit / lint-vs-main / build / TypeScript / project-control / whitespace / browser verification: success.
- Vercel Preview `dpl_9uFSvX1XL4Nec78LW2wHjx2rizcf`: READY.
- Preview URL: `https://vankotraining-knee-6cl626jmd-vankotrainings-projects.vercel.app`.

## Safety

- PR #29 open, unmerged.
- `main` beze změny.
- Production Vercel beze změny.
- Production Supabase byl v tomto kroku pouze read-only ověřen kvůli Training library.
- Dev/prod DB nebyla měněna.
- Unresolved mapping queue nebyla automaticky canonicalizována.
- Machine knee extension confidence se v tomto kroku neměnila.

## Next gate

Authenticated desktop visual review nové goal layer, poté dokončení Knee extension clinical review a pokračování Wall isometric → Split squat.
