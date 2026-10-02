# Checkpoint — dev Training library alignment for Clinical Map Preview

Datum: 2026-10-02

## Scope a stav

- PR #29 pre-change head: `a3a1fa442478cf75e674dd06901f4c23a169e8fb`;
- PR: open, unmerged, base `main`;
- production Supabase: `zxvndqicslyulrinbpyn` / `vankotraining`, `ACTIVE_HEALTHY`;
- development Supabase: `twndqnmrvefhwuwuglju` / `vankotraining-knee-dev`, `ACTIVE_HEALTHY`;
- production byla použita pouze jako read-only source;
- změněn byl pouze development projekt a pouze `exercise_families` + `exercises`.

## Fresh production discovery

Canonical source:

- `exercise_families`: 32;
- `exercises`: 161 total / 158 active / 3 inactive;
- 32 unikátních family slugů;
- 161 unikátních exercise UUID a names;
- žádný orphan ani null family link.

Dependency graph:

- jediný outbound FK: `exercises.family_slug → exercise_families.slug`;
- příchozí production FK `workout_items.exercise_id → exercises.id` nebyl v dev přenesen;
- žádná sequence dependency;
- production update triggery používají `set_updated_at()`, který v dev neexistoval. Triggery ani funkce nebyly přeneseny, protože snapshot je bez authenticated write oprávnění a třetí objekt by překročil scope.

## Dev schema alignment

Aplikovaná dev migration:

- version: `20261002181856`;
- name: `align_clinical_map_dev_training_library`;
- repo: `supabase/migrations/20261002181856_align_clinical_map_dev_training_library.sql`.

Vytvořeno:

- production-compatible columns, defaults, nullability;
- PK `exercise_families(slug)`;
- PK `exercises(id)`;
- UNIQUE `exercises(name)`;
- difficulty a laterality CHECK constraints;
- FK `exercises.family_slug → exercise_families.slug` s production-compatible UPDATE/DELETE akcemi;
- production-compatible category a full-text name indexy;
- RLS na obou tabulkách.

Schema signatures pro columns, constraints a indexes jsou shodné production ↔ dev.

## Jednorázový snapshot

Do dev byly transakčně vloženy pouze:

- 32 exercise families;
- 161 exercises;
- 158 active;
- 3 inactive.

Zachovány byly UUID, family linkage, names, metadata, source fields, `is_active`, created/updated timestamps a všechny schema-compatible sloupce.

Full-row digests production ↔ dev:

- families: `ef8f61a705f19121f21767e7717b6b5a`;
- exercises: `acb8bf59e87e314a8590ec024251a72b`.

Oba digests jsou shodné.

## Clinical Map manifest

Fresh manifest z PR #29 stále obsahuje 9 Training UUID.

Výsledek:

- production: 9/9 present;
- development: 9/9 present;
- UUID, canonical name, `is_active` a `family_slug`: 9/9 compatible.

## RLS a přístup

Dev Training library je uživatelsky read-only:

- `anon`: bez SELECT a bez write grants;
- `authenticated`: SELECT na obou tabulkách;
- `authenticated` vidí 32 families a pouze 158 active exercises;
- `authenticated`: bez INSERT/UPDATE/DELETE/TRUNCATE;
- coach/owner write policy z production nebyla kopírována.

Post-migration security advisor nepřidal nový finding pro tyto tabulky. Dřívější čtyři admin-guardované Knee/Tindeq SECURITY DEFINER RPC a Auth leaked-password warning zůstávají beze změny a nejsou součástí tohoto gate.

## Stav vůči Preview a production

- dev schema aligned: ano;
- dev Training data synced: ano;
- dev backend: **READY FOR CLINICAL MAP PREVIEW ENV**;
- Preview env configured: ne;
- nový Preview deployed: ne;
- Preview visually reviewed: ne;
- merged do `main`: ne;
- production deployed: ne;
- production verified: ne.

Vercel environment variables, Auth, klientská/klinická data, Knee/Tindeq data, plans/workouts a production databáze nebyly změněny.
