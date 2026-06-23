-- ============================================================================
-- Migration 0001 — OpenAI-Bildgenerierung (gpt-image-2)
-- ============================================================================
-- Wende dieses Script auf eine BEREITS bestehende IdeaForge-Datenbank an
-- (Supabase Dashboard → SQL Editor → einfügen → Run). Bei einer frischen
-- Installation ist alles schon in schema.sql enthalten; dann ist diese
-- Migration nicht nötig.
--
-- Idempotent: kann gefahrlos mehrfach ausgeführt werden.
-- ============================================================================

-- 1) ideas: neue Status-Werte 'pending' und 'failed' erlauben -----------------
alter table public.ideas
  drop constraint if exists ideas_status_check;

alter table public.ideas
  add constraint ideas_status_check
  check (status in ('draft', 'pending', 'generated', 'failed'));

-- 2) ideas: Spalten für Ergebnis-URL und Fehlerursache -----------------------
alter table public.ideas
  add column if not exists image_url text;

alter table public.ideas
  add column if not exists error text;

-- 3) Storage-Bucket für generierte Konzeptskizzen (öffentlich lesbar) --------
insert into storage.buckets (id, name, public)
values ('idea-sketches', 'idea-sketches', true)
on conflict (id) do nothing;

drop policy if exists "idea-sketches: public read" on storage.objects;
create policy "idea-sketches: public read"
  on storage.objects for select
  using (bucket_id = 'idea-sketches');

-- ============================================================================
-- Ende der Migration 0001
-- ============================================================================
