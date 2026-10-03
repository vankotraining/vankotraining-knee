# Next Step

## Aktuální fáze

Clinical Exercise Map V1.2 je **implementována, automatizovaně ověřena a nasazena jako branch-specific Preview**, ale není v `main` ani v produkci.

- větev: `feature/clinical-exercise-map-v1`;
- PR: #29 `feat: add read-only Clinical Exercise Map V1`;
- latest runtime/test-changing head: `45d7fbea195a4906889da9fa6c91cb723a775f5a`;
- route: `/clinical/exercises`;
- režim: read-only;
- Preview env: branch-specific dev Supabase `twndqnmrvefhwuwuglju`;
- production Supabase/env: beze změny;
- merge: neproveden;
- production deployment/acceptance Clinical Map: neproveden.

## V1.2 dokončeno

V1.1 UX zůstává zachována a nad exercise matrix je přidána první explicitní **clinical goal / limiter layer**.

Canonical pilot goal:

`Restore knee extension & quadriceps control`

Komponenty cíle:

- Extension ROM;
- Quadriceps activation;
- Active terminal extension control;
- Early load acceptance / movement control.

Typické limitery:

- extension loss;
- effusion / pain-limited activation;
- poor voluntary quadriceps activation / AMI;
- quadriceps force deficit;
- poor active terminal extension control.

CSB authority:

- `ACL-CLM-008` — criteria-driven ACLR rehabilitation;
- `AMI-CLM-001` — bilateral quadriceps activation deficits / interpretation;
- `AMI-CLM-002` — AMI / quadriceps activation management.

Clinical Map výslovně uvádí, že goal není rigidní pooperační fáze ani univerzální protokol a že současná evidence authority je nejsilnější pro ACL/ACLR; procedure-specific restrictions mají přednost.

## Knee extension review — zapsaná změna

Přidána reviewed clinical option:

`Terminal extension / quadriceps activation`

- family: `knee_extension`;
- primary capacity: `force_activation`;
- Clinical mapping confidence: **A · direct clinical use**;
- Training library link: **none** — žádný exact canonical Training exercise_id nebyl schválen;
- direct CLIENTS provenance: Visit `7d26481e-3e88-46ab-9b7c-9f0fcf93d862`, 2026-09-29;
- Visit dokumentuje obtížnější quadriceps activation v terminal extension, towel press a heel-supported active terminal extension;
- napojení na goal: extension ROM + quadriceps activation + active terminal extension control;
- evidence guardrails: `ACL-CLM-008`, `AMI-CLM-002`.

Existující `Isometric knee extension` je označena jako **supporting option** pro quadriceps activation / force deficit. Její B probable Training mapping se nemění.

`Knee extension - machine` se v tomto kroku **nemění**; zejména se bez samostatného klinického gate nemění B → A.

## Automatizovaná evidence

Runtime/test head `45d7fbea195a4906889da9fa6c91cb723a775f5a`:

- Project control workflow `37108795338`: success;
- verification workflow `37108795533`: success;
- unit tests: success;
- lint-vs-main gate: success;
- production build: success;
- TypeScript: success;
- project-control / whitespace checks: success;
- browser verification: success.

Exact runtime-head Preview:

- deployment: `dpl_9uFSvX1XL4Nec78LW2wHjx2rizcf`;
- URL: `https://vankotraining-knee-6cl626jmd-vankotrainings-projects.vercel.app`;
- state: `READY`;
- branch/SHA: `feature/clinical-exercise-map-v1` / `45d7fbea195a4906889da9fa6c91cb723a775f5a`.

## Unresolved mapping queue

Beze změny:

- SL squat / podřep on stepper;
- step-down;
- TRX-assisted sit-to-heel;
- medicine-ball drop into split squat;
- assisted full-ROM split squat;
- wall-supported split squat;
- band-resisted hamstring curl.

## Clinician acceptance — 2026-10-03

Uživatel po desktop review výslovně potvrdil, že zobrazené early-phase cíle, limitery a jejich vazba na terminal extension / quadriceps activation odpovídají jeho reálným klinickým postupům v této fázi.

Tím je V1.2 goal layer přijata jako pracovní klinický model pro pokračující review. Nejde o schválení merge do `main`, produkčního deploymentu ani automatického decision supportu.

## Nejbližší gate

1. dokončit clinical review rodiny Knee extension — samostatně posoudit `Knee extension - machine`, zejména clinical-use confidence vs přesnost Training mappingu;
2. pokračovat `Wall isometric → Split squat`;
3. PR #29 ponechat open a unmerged do výslovného schválení.

Clinical Map V1.2 není v `main`, není produkčně nasazena a není produkčně ověřena.
