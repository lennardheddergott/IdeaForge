-- ============================================================================
-- Migration 0009 — Versionierung des Designprozesses
-- ============================================================================
-- Jede Änderung am Entwurf erzeugt eine NEUE Version (eine eigenständige Idee
-- mit eigenem Renderbild, Konzeptblatt und Spec). Die Kette wird über
-- root_idea_id verknüpft, die Reihenfolge über version_number, und change_note
-- dokumentiert die jeweilige Änderung.
--
-- Additiv & idempotent: bestehende Ideen bleiben Version 1 (Defaults greifen).
-- ============================================================================

alter table public.ideas
  add column if not exists root_idea_id uuid references public.ideas (id) on delete set null;

alter table public.ideas
  add column if not exists version_number int not null default 1;

alter table public.ideas
  add column if not exists change_note text;

create index if not exists ideas_root_idea_id_idx on public.ideas (root_idea_id);

-- ============================================================================
-- Ende der Migration 0009
-- ============================================================================
