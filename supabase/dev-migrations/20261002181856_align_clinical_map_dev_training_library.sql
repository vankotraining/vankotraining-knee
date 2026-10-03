-- DEV-ONLY migration for Supabase project twndqnmrvefhwuwuglju.
-- Applied migration version: 20261002181856.
-- Production zxvndqicslyulrinbpyn is the read-only source and already owns
-- the canonical tables. This migration intentionally fails before mutation
-- when either target table already exists.
--
-- The production set_updated_at() triggers are intentionally omitted:
-- the dev Training snapshot exposes no authenticated write privilege, and
-- creating the shared trigger function would exceed this two-table scope.

do $$
begin
  if to_regclass('public.exercise_families') is not null
     or to_regclass('public.exercises') is not null then
    raise exception 'Clinical Map dev Training alignment expects exercise_families and exercises to be absent';
  end if;
end
$$;

create table public.exercise_families (
  slug text not null,
  label_cs text not null,
  label_en text not null,
  section text not null,
  sort_order integer not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint exercise_families_pkey primary key (slug)
);

create table public.exercises (
  id uuid not null default gen_random_uuid(),
  name text not null,
  category text,
  training_type text,
  laterality text,
  video_url text,
  instructions_cs text,
  instructions_en text,
  equipment text[] not null default '{}'::text[],
  difficulty smallint,
  primary_region text,
  contraindications text,
  coaching_cues text,
  source text not null default 'google_sheets'::text,
  source_row integer,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  segments text[] not null default '{}'::text[],
  family_slug text,
  constraint exercises_pkey primary key (id),
  constraint exercises_name_key unique (name),
  constraint exercises_difficulty_check check (difficulty >= 1 and difficulty <= 5),
  constraint exercises_laterality_check check (
    (laterality = any (array['unilateral'::text, 'bilateral'::text, 'mixed'::text]))
    or laterality is null
  ),
  constraint exercises_family_slug_fkey foreign key (family_slug)
    references public.exercise_families(slug)
    on update cascade
    on delete restrict
);

create index exercises_category_idx
  on public.exercises using btree (category);

create index exercises_name_idx
  on public.exercises using gin (to_tsvector('simple'::regconfig, name));

alter table public.exercise_families enable row level security;
alter table public.exercises enable row level security;

revoke all privileges on table public.exercise_families from anon, authenticated;
revoke all privileges on table public.exercises from anon, authenticated;

grant select on table public.exercise_families to authenticated;
grant select on table public.exercises to authenticated;

create policy "authenticated read exercise families"
  on public.exercise_families
  for select
  to authenticated
  using (true);

create policy "client read active exercises"
  on public.exercises
  for select
  to authenticated
  using (is_active = true);

comment on table public.exercise_families is
  'Dev-only read-only snapshot of the canonical Training exercise family dictionary for Clinical Map Preview.';

comment on table public.exercises is
  'Dev-only read-only snapshot of the canonical Training exercise library for Clinical Map Preview.';
