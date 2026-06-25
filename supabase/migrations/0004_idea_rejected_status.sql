-- ============================================================================
-- Migration 0004 — Idee-Status 'rejected' (themenfremde Eingabe)
-- ============================================================================
-- IdeaForge ist ausschließlich auf Möbel spezialisiert. Erkennt die KI-Analyse,
-- dass eine Eingabe KEIN Möbelstück beschreibt, wird die Idee mit status
-- 'rejected' markiert (keine Bildgenerierung, kein Konzeptblatt). Die freundliche
-- Begründung steht im bestehenden Feld "error".
--
-- Idempotent: kann gefahrlos mehrfach ausgeführt werden.
-- ============================================================================

alter table public.ideas
  drop constraint if exists ideas_status_check;

alter table public.ideas
  add constraint ideas_status_check
  check (status in ('draft', 'pending', 'generated', 'failed', 'rejected'));

-- ============================================================================
-- Ende der Migration 0004
-- ============================================================================
