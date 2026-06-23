-- ============================================================================
-- Migration 0002 — Zweites Bild: fotorealistische Produktvorschau
-- ============================================================================
-- Pro Idee werden jetzt ZWEI Bilder erzeugt:
--   - concept_sheet_url : technisches Engineering-/CAD-Konzeptblatt (bisher image_url)
--   - preview_image_url : fotorealistische Produktvorschau (NEU)
--
-- Auf eine bestehende IdeaForge-Datenbank anwenden (Supabase → SQL Editor → Run).
-- Bei einer frischen Installation steckt alles bereits in schema.sql.
-- Idempotent: kann gefahrlos mehrfach ausgeführt werden.
-- ============================================================================

alter table public.ideas
  add column if not exists concept_sheet_url text;

alter table public.ideas
  add column if not exists preview_image_url text;

-- Vorhandene Ideen mit altem Einzelbild abwärtskompatibel übernehmen:
update public.ideas
  set concept_sheet_url = image_url
  where concept_sheet_url is null and image_url is not null;

-- ============================================================================
-- Ende der Migration 0002
-- ============================================================================
