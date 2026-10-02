# Dev-only Supabase artifacts

Tento adresář obsahuje auditovatelné SQL artefakty, které byly určeny výhradně pro explicitně identifikovaný development Supabase projekt.

- nejsou canonical production migrations;
- nejsou součástí standardní sekvence `supabase db push`;
- nesmí být přesunuty do `supabase/migrations/` ani aplikovány na production bez samostatného návrhu a výslovného schválení;
- přesun již aplikovaného SQL artefaktu do tohoto adresáře nemění migration history žádného Supabase projektu.

## Clinical Map Training alignment

`20261002181856_align_clinical_map_dev_training_library.sql`:

- cílový a jediný změněný projekt: `twndqnmrvefhwuwuglju` / `vankotraining-knee-dev`;
- migration version: `20261002181856`;
- stav: aplikováno pouze na development;
- production `zxvndqicslyulrinbpyn`: neaplikováno a nesmí se aplikovat;
- účel: jednorázový dev-only alignment `public.exercise_families` a `public.exercises` pro Clinical Exercise Map Preview;
- SQL je zachováno jako historický auditní artefakt, nikoli jako pending production migration.
