# Checkpoint — Clinical goal layer clinician acceptance — 2026-10-03

## User acceptance

Po review aktuální Clinical Map V1.2 na desktopu uživatel potvrdil, že uvedené early-phase postupy odpovídají jeho reálné klinické praxi.

Accepted working model:

- `Restore knee extension & quadriceps control`;
- Extension ROM;
- Quadriceps activation;
- Active terminal extension control;
- Early load acceptance / movement control;
- limitery: extension loss, effusion/pain-limited activation, poor voluntary quadriceps activation / AMI, quadriceps force deficit a poor active terminal extension control;
- `Terminal extension / quadriceps activation` jako reviewed exercise option pod cílem;
- `Isometric knee extension` jako supporting option.

## Interpretation

Acceptance potvrzuje klinickou vhodnost tohoto modelu pro danou early-rehab fázi. Neznamená univerzální protokol pro všechny operace/diagnózy; procedure-specific guardrails zůstávají nadřazené.

## Safety / scope

- PR #29 zůstává open/unmerged.
- `main` a produkce beze změny.
- Žádný production DB write.
- Žádný plan generator, dosing engine, auto-diagnosis ani RTS verdict.
- `Knee extension - machine` nebyla touto akceptací automaticky překlasifikována.
- Další klinický review gate: `Knee extension - machine`, poté `Wall isometric → Split squat`.
