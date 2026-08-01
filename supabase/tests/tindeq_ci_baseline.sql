-- Minimal production-compatible baseline used only by the isolated CI database.
-- It intentionally contains no production data and is never pushed to hosted Supabase.

create extension if not exists pgcrypto;

create table if not exists public.athletes (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  name_key text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  created_by uuid default auth.uid(),
  updated_by uuid,
  deleted_by uuid,
  deleted_context text,
  delete_reason text
);

create unique index if not exists athletes_name_key_active_unique
  on public.athletes (name_key)
  where deleted_at is null;

create or replace function public.is_knee_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'martin@vankotraining.cz';
$$;
