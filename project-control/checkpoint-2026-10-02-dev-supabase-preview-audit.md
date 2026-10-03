# Checkpoint — dev Supabase audit pro Clinical Map Preview

Datum: 2026-10-02

## Fresh autoritativní stav

- PR #29: open, unmerged, base `main`;
- pre-audit PR head: `c9cbd20770d671058175e52878ec9ccb804cdb22`;
- feature branch: `feature/clinical-exercise-map-v1`;
- production Supabase: `zxvndqicslyulrinbpyn` / `vankotraining`, `eu-central-1`, `ACTIVE_HEALTHY`;
- development Supabase: `twndqnmrvefhwuwuglju` / `vankotraining-knee-dev`, `eu-central-1`, fresh stav `INACTIVE`.

Identity projektů odpovídala project-control a environment guardu v kódu.

## Jediná provedená backend změna

Development projekt `twndqnmrvefhwuwuglju` byl obnoven:

`INACTIVE → COMING_UP → RESTORING → ACTIVE_HEALTHY`.

Reaktivace nevyžádala neočekávanou billing ani configuration změnu. Production projekt nebyl měněn. Po reaktivaci byl audit výhradně read-only.

## Dev schema a data

Existující veřejné tabulky relevantní pro Knee:

- `athletes`: RLS enabled, exact 1 řádek;
- `athlete_profiles`: RLS enabled, exact 0 řádků;
- `knee_extension_tests`: RLS enabled, exact 0 řádků;
- `tindeq_sessions`: RLS enabled, exact 1 řádek;
- `knee_audit_log`: RLS enabled, exact 12 řádků.

Chybí:

- `exercises`;
- `exercise_families`;
- `plans`;
- `workouts`;
- `workout_items`;
- `feedback`;
- `clients`.

Proto nelze v dev vykonat očekávaný Clinical Map dotaz `.from("exercises").eq("is_active", true).order("name")`.

## Training compatibility

Fresh production snapshot pouze read-only:

- `exercises`: 161 total / 158 active;
- `exercise_families`: 32.

Aktuální projection manifest obsahuje 9 Training UUID. Production: 9/9 present, active a name-compatible. Dev: 0/9 present, 9/9 unavailable, protože `public.exercises` neexistuje. Metadata diff nelze počítat bez kompatibilní dev tabulky; extra rows 0, chybí efektivně všech 161 production exercises.

## Auth, RLS a write riziko

- Auth infrastruktura je dostupná;
- jeden neodstraněný e-mailový user odpovídá `is_knee_admin()` allowlistu;
- existuje aktivní legacy anon i publishable browser key;
- `anon` nemá k existujícím relevantním tabulkám SELECT/INSERT/UPDATE/DELETE;
- `authenticated` přístup je RLS omezen `is_knee_admin()`;
- allowlisted user má SELECT/INSERT/UPDATE na `athletes`, `athlete_profiles` a `knee_extension_tests`; na `tindeq_sessions` SELECT/INSERT;
- čtyři `SECURITY DEFINER` soft-delete/restore RPC jsou executable pro `authenticated`, všechny obsahují `is_knee_admin()` guard;
- připojení dev credentials k Preview zpřístupní i ostatní Knee/Tindeq route tohoto deploymentu, ne pouze Clinical Map;
- Auth redirect URLs, users ani nastavení nebyly měněny.

## Verdict a další gate

Development Supabase je **NOT READY** pro Clinical Map Preview: je zdravý a Auth/RLS základ existuje, ale chybí schema i data Training `exercise_families` / `exercises` a všech 9 manifest ID.

Nejmenší samostatný další gate:

1. schválit dev-only schema alignment pouze pro `exercise_families` a `exercises`;
2. jednorázově synchronizovat read-only Training snapshot z production do dev se zachováním UUID;
3. ověřit 161 total / 158 active, 32 families a 9/9 manifest ID;
4. teprve potom nastavit branch-specific Vercel Preview env a vytvořit nový exact-head Preview.

V tomto kroku nebyly změněny Vercel env, Clinical Map kód, mapping, RLS, Auth, schema ani data. PR #29 nebyl merged; `main` a production deployment zůstaly beze změny.
