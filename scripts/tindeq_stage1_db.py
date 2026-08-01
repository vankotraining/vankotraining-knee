from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.strip() + "\n", encoding="utf-8")


def apply() -> None:
    write(
        ".env.example",
        r'''
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
# Legacy fallback, only when a publishable key is not available:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-legacy-anon-key
''',
    )

    write(
        "supabase/migrations/20260801_tindeq_repeaters_stage1.sql",
        r'''
-- Tindeq Repeaters Stage 1
-- Creates private raw ZIP storage, session/repetition/error tables and strict RLS.
-- The current Knee deployment is single-account; owner_user_id provides account scope.

begin;

create extension if not exists pgcrypto;

create table if not exists public.tindeq_repeaters_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null default auth.uid() references auth.users(id),
  athlete_id uuid references public.athletes(id) on delete set null,
  original_tag text,
  normalized_tag text,
  test_datetime timestamptz,
  protocol_type text,
  left_mvc numeric,
  right_mvc numeric,
  work_percentage numeric,
  left_target numeric,
  right_target numeric,
  work_duration_seconds numeric,
  rest_duration_seconds numeric,
  planned_repetitions integer,
  detected_repetitions integer not null default 0,
  sampling_frequency_hz numeric,
  unit text not null default 'kg',
  file_hash text not null,
  storage_path text not null,
  raw_metadata jsonb not null default '{}'::jsonb,
  summary_metrics jsonb not null default '{}'::jsonb,
  pain_during smallint,
  rpe smallint,
  clinical_note text,
  analysis_version text not null,
  parser_version text not null,
  segmentation_version text not null,
  metrics_version text not null,
  analyzed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tindeq_repeaters_file_hash_unique unique (owner_user_id, file_hash),
  constraint tindeq_repeaters_pain_check check (pain_during is null or pain_during between 0 and 10),
  constraint tindeq_repeaters_rpe_check check (rpe is null or rpe between 0 and 10),
  constraint tindeq_repeaters_work_percentage_check check (work_percentage is null or work_percentage between 0 and 200),
  constraint tindeq_repeaters_repetition_count_check check (
    (planned_repetitions is null or planned_repetitions >= 0)
    and detected_repetitions >= 0
  )
);

create table if not exists public.tindeq_repetitions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.tindeq_repeaters_sessions(id) on delete cascade,
  repetition_number integer not null,
  is_valid boolean not null default true,
  work_start_seconds numeric not null,
  work_end_seconds numeric not null,
  left_metrics jsonb not null default '{}'::jsonb,
  right_metrics jsonb not null default '{}'::jsonb,
  bilateral_metrics jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint tindeq_repetition_number_unique unique (session_id, repetition_number),
  constraint tindeq_repetition_time_check check (work_end_seconds >= work_start_seconds)
);

create table if not exists public.tindeq_import_errors (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null default auth.uid() references auth.users(id),
  file_name text,
  file_hash text,
  error_code text not null,
  user_message text not null,
  technical_detail text,
  created_at timestamptz not null default now()
);

create index if not exists tindeq_repeaters_athlete_datetime_idx
  on public.tindeq_repeaters_sessions (athlete_id, test_datetime desc nulls last, created_at desc);
create index if not exists tindeq_repeaters_unassigned_idx
  on public.tindeq_repeaters_sessions (created_at desc)
  where athlete_id is null;
create index if not exists tindeq_repetitions_session_idx
  on public.tindeq_repetitions (session_id, repetition_number);
create index if not exists tindeq_import_errors_owner_idx
  on public.tindeq_import_errors (owner_user_id, created_at desc);

create or replace function public.set_tindeq_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tindeq_repeaters_set_updated_at on public.tindeq_repeaters_sessions;
create trigger tindeq_repeaters_set_updated_at
  before update on public.tindeq_repeaters_sessions
  for each row execute function public.set_tindeq_updated_at();

alter table public.tindeq_repeaters_sessions enable row level security;
alter table public.tindeq_repetitions enable row level security;
alter table public.tindeq_import_errors enable row level security;

revoke all on public.tindeq_repeaters_sessions from anon;
revoke all on public.tindeq_repetitions from anon;
revoke all on public.tindeq_import_errors from anon;
grant select, insert, update, delete on public.tindeq_repeaters_sessions to authenticated;
grant select, insert, update, delete on public.tindeq_repetitions to authenticated;
grant select, insert on public.tindeq_import_errors to authenticated;

drop policy if exists tindeq_repeaters_select_owner on public.tindeq_repeaters_sessions;
create policy tindeq_repeaters_select_owner
  on public.tindeq_repeaters_sessions for select to authenticated
  using (public.is_knee_admin() and owner_user_id = (select auth.uid()));

drop policy if exists tindeq_repeaters_insert_owner on public.tindeq_repeaters_sessions;
create policy tindeq_repeaters_insert_owner
  on public.tindeq_repeaters_sessions for insert to authenticated
  with check (public.is_knee_admin() and owner_user_id = (select auth.uid()));

drop policy if exists tindeq_repeaters_update_owner on public.tindeq_repeaters_sessions;
create policy tindeq_repeaters_update_owner
  on public.tindeq_repeaters_sessions for update to authenticated
  using (public.is_knee_admin() and owner_user_id = (select auth.uid()))
  with check (public.is_knee_admin() and owner_user_id = (select auth.uid()));

drop policy if exists tindeq_repeaters_delete_owner on public.tindeq_repeaters_sessions;
create policy tindeq_repeaters_delete_owner
  on public.tindeq_repeaters_sessions for delete to authenticated
  using (public.is_knee_admin() and owner_user_id = (select auth.uid()));

drop policy if exists tindeq_repetitions_select_owner on public.tindeq_repetitions;
create policy tindeq_repetitions_select_owner
  on public.tindeq_repetitions for select to authenticated
  using (exists (
    select 1 from public.tindeq_repeaters_sessions session
    where session.id = session_id
      and session.owner_user_id = (select auth.uid())
      and public.is_knee_admin()
  ));

drop policy if exists tindeq_repetitions_insert_owner on public.tindeq_repetitions;
create policy tindeq_repetitions_insert_owner
  on public.tindeq_repetitions for insert to authenticated
  with check (exists (
    select 1 from public.tindeq_repeaters_sessions session
    where session.id = session_id
      and session.owner_user_id = (select auth.uid())
      and public.is_knee_admin()
  ));

drop policy if exists tindeq_repetitions_update_owner on public.tindeq_repetitions;
create policy tindeq_repetitions_update_owner
  on public.tindeq_repetitions for update to authenticated
  using (exists (
    select 1 from public.tindeq_repeaters_sessions session
    where session.id = session_id
      and session.owner_user_id = (select auth.uid())
      and public.is_knee_admin()
  ))
  with check (exists (
    select 1 from public.tindeq_repeaters_sessions session
    where session.id = session_id
      and session.owner_user_id = (select auth.uid())
      and public.is_knee_admin()
  ));

drop policy if exists tindeq_repetitions_delete_owner on public.tindeq_repetitions;
create policy tindeq_repetitions_delete_owner
  on public.tindeq_repetitions for delete to authenticated
  using (exists (
    select 1 from public.tindeq_repeaters_sessions session
    where session.id = session_id
      and session.owner_user_id = (select auth.uid())
      and public.is_knee_admin()
  ));

drop policy if exists tindeq_import_errors_select_owner on public.tindeq_import_errors;
create policy tindeq_import_errors_select_owner
  on public.tindeq_import_errors for select to authenticated
  using (public.is_knee_admin() and owner_user_id = (select auth.uid()));

drop policy if exists tindeq_import_errors_insert_owner on public.tindeq_import_errors;
create policy tindeq_import_errors_insert_owner
  on public.tindeq_import_errors for insert to authenticated
  with check (public.is_knee_admin() and owner_user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tindeq-raw',
  'tindeq-raw',
  false,
  26214400,
  array['application/zip', 'application/x-zip-compressed']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists tindeq_raw_select_owner on storage.objects;
create policy tindeq_raw_select_owner
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tindeq-raw'
    and public.is_knee_admin()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists tindeq_raw_insert_owner on storage.objects;
create policy tindeq_raw_insert_owner
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tindeq-raw'
    and public.is_knee_admin()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists tindeq_raw_delete_owner on storage.objects;
create policy tindeq_raw_delete_owner
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'tindeq-raw'
    and public.is_knee_admin()
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

notify pgrst, 'reload schema';
commit;
''',
    )

    write(
        ".github/workflows/tindeq-repeaters-ci.yml",
        r'''
name: Tindeq Repeaters CI

on:
  push:
    branches:
      - feature/tindeq-repeaters-import
  pull_request:
    branches:
      - main

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run check:types
      - name: Verify no new lint findings
        shell: bash
        run: |
          git worktree add /tmp/knee-main origin/main
          cd /tmp/knee-main
          npm install --silent
          set +e
          npm run lint > /tmp/lint-main.log 2>&1
          set -e
          cd "$GITHUB_WORKSPACE"
          set +e
          npm run lint > /tmp/lint-feature.log 2>&1
          set -e
          python - <<'PY'
          import collections
          import re
          from pathlib import Path

          issue_start = re.compile(r"^\s*\d+:\d+\s+(error|warning)\s+")
          rule_pattern = re.compile(r"\s{2,}(@?[\w-]+(?:/[\w-]+)+)\s*$")

          def parse(path):
              current = None
              severity = None
              issues = []
              for line in Path(path).read_text(encoding="utf-8").splitlines():
                  stripped = line.strip()
                  if stripped.startswith("/") and stripped.endswith((".ts", ".tsx", ".js", ".jsx")):
                      current = "src/" + stripped.split("/src/", 1)[1] if "/src/" in stripped else stripped
                      severity = None
                      continue
                  start = issue_start.match(line)
                  if start:
                      severity = start.group(1)
                  rule = rule_pattern.search(line)
                  if current and severity and rule:
                      issues.append((current, severity, rule.group(1)))
                      severity = None
              return collections.Counter(issues)

          added = parse("/tmp/lint-feature.log") - parse("/tmp/lint-main.log")
          if added:
              raise SystemExit(f"New lint findings: {added}\n" + Path("/tmp/lint-feature.log").read_text())
          PY
      - run: npm run build
''',
    )

    write(
        "project-control/tindeq-repeaters-stage1-2026-08-01.md",
        r'''
# Tindeq Repeaters – etapa 1

Datum: 2026-08-01  
Větev: `feature/tindeq-repeaters-import`  
Produkční aplikace: `https://knee.vankotraining.cz`

## Audit před změnou

- Aplikace je Next.js 16 App Router / React 19 / TypeScript a běží ve stávajícím Vercel projektu `vankotraining-knee`.
- Klienti jsou v `public.athletes`, profily v `public.athlete_profiles` a maximální testy v `public.knee_extension_tests`.
- Existující normalizace jména používá trim, lowercase, odstranění diakritiky a sjednocení oddělovačů do pomlček. Repeaters používají stejný formát `name_key`.
- Přihlášení bylo čistě klientské přes Supabase magic link a browser storage. Route Handler z takové session nemohl bezpečně ověřit uživatele.
- Supabase projekt je sdílený s další aplikací. Stávající tabulky obsahují vedle Knee policies také obecné role `owner`/`coach`; tyto policies etapa 1 z důvodu regresního rizika nemění.
- Před etapou 1 neexistoval žádný Supabase Storage bucket.
- Výchozí stav `main`: 26 testů PASS, TypeScript a production build PASS. Lint má čtyři známé výchozí nálezy; CI porovnává přesnou signaturu s `main` a nepovolí nové nálezy.

## Implementace

### Autentizace

- Browser i server používají `@supabase/ssr`.
- Next.js `proxy.ts` obnovuje cookie session.
- PKCE kód se vyměňuje na serveru na `/auth/callback` a pro zpětnou kompatibilitu také na `/`.
- Import používá `supabase.auth.getUser()` a nepovoluje anonymní upload.

### Datový model a Storage

Migrace `20260801_tindeq_repeaters_stage1.sql` přidává:

- `tindeq_repeaters_sessions`,
- `tindeq_repetitions`,
- `tindeq_import_errors`,
- privátní bucket `tindeq-raw`,
- RLS policies vázané na `owner_user_id = auth.uid()` a současné `is_knee_admin()`.

Projekt zatím nemá organizační model pro Knee. První verze proto používá uživatelský scope a unikátní `(owner_user_id, file_hash)`. Budoucí multi-tenant verze může scope rozšířit o `organization_id` bez změny původních ZIPů.

Původní ZIP se ukládá beze změny do:

`{userId}/{measurementId}/original.zip`

Časová řada se neduplikuje po vzorcích do PostgreSQL. PostgreSQL obsahuje metadata, souhrn série a agregované metriky jednotlivých opakování. Budoucí přepočet načte původní ZIP a vytvoří novou verzi analýzy.

### Import a analýza

- Jeden serverový endpoint `POST /api/import/tindeq` přijímá `multipart/form-data`.
- Podporuje jeden export i ZIP obsahující více jednotlivých ZIP exportů.
- Validuje `info.csv` a `data_set_1.csv` a vrací stabilní chybové kódy.
- SHA-256 původního jednotlivého exportu zabraňuje duplicitám.
- Chybějící tag vytvoří nepřiřazenou session; čitelný nový tag vytvoří klienta.
- Vzorkovací frekvence se počítá z mediánu časových rozdílů.
- Analytická vrstva zachovává raw data, používá přibližně 100ms vyhlazení a centrální konfigurační heuristiky.
- Výpočet zahrnuje průměr, relativní plnění cíle, medián, SD, CV, MAD, RMSE, čas v ±5/±10 %, čas do 90/95 %, přestřelení, nedosažení, drift a délku intervalu.
- Konec záznamu bez relaxace není neplatný, pokud byla dokončena pracovní doba.
- Každá session ukládá verzi parseru, segmentace, metrik a datum analýzy.

### UI

- Na hlavní obrazovce je dominantní mobilní akce `Nahrát Tindeq ZIP` bez předchozího formuláře.
- UI zobrazuje stavy nahrávání, kontroly, analýzy, ukládání a dokončení.
- Po importu se otevře detail session; duplicita otevře existující detail s informací o duplicitě.
- Detail obsahuje nastavení protokolu, souhrn série, upozornění a metriky opakování.
- Bolest a RPE rozlišují `null`, `0` a `1–10`.

## Bezpečnostní rozhodnutí

- Service-role klíč se nepoužívá a není přidán do frontendového kódu.
- Bucket je privátní a cesta začíná `auth.uid()`; RLS dovoluje pouze SELECT/INSERT/DELETE vlastních objektů.
- Technický detail importní chyby je pouze v server logu a chráněné tabulce.
- Stávající širší policies sdílené databáze nebyly automaticky odstraněny. Je vhodné je samostatně auditovat s ohledem na druhou aplikaci.

## Testování

Automatické testy používají syntetické anonymní ZIP fixtures a pokrývají:

- validní jednotlivý ZIP,
- více exportů v jednom ZIPu,
- chybějící `info.csv`,
- chybějící `data_set_1.csv`,
- poškozenou časovou řadu,
- chybějící tag,
- normalizaci s diakritikou,
- bilaterální měření,
- neúplný interval,
- konec bez relaxace,
- bolest `null`, `0` a `1–10`.

Reálné klientské exporty nejsou součástí veřejného repozitáře. Před přijetím PR je nutné provést ruční test s dodaným privátním Tindeq ZIPem v preview prostředí.

## Nasazení migrace

Migrace není automaticky aplikována do produkčního Supabase projektu. Pro bezpečné preview je potřeba Supabase development branch nebo oddělený preview projekt, následně:

1. aplikovat migraci,
2. nastavit preview `NEXT_PUBLIC_SUPABASE_URL` a publishable key,
3. spustit SQL kontrolu RLS,
4. ověřit upload, duplicitu a přístup k privátnímu objektu,
5. teprve potom uvažovat o produkční migraci.

## Známá omezení a další etapa

Etapa 2 (PWA manifest a Android Web Share Target) nebyla zahájena, protože etapa 1 musí nejprve projít preview testem a ověřením RLS/Storage. Grafy, klientská historie Repeaters a ruční správa nepřiřazených měření patří do etapy 3.
''',
    )


if __name__ == "__main__":
    apply()
