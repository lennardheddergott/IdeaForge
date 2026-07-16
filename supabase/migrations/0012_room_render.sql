-- ============================================================================
-- 0012 — Echte Raumvisualisierung (GPT Image) + unsichtbare Hotspots
-- ============================================================================
-- Ergänzt:
--   • ideas.room_bbox        — vom Nutzer markierte Zielregion je Möbel
--     (normalisiert 0..1: { x, y, w, h, polygon? }) = zugleich die Klickfläche
--     des unsichtbaren Hotspots im fertigen Raumbild.
--   • room_projects Render-Metadaten (Modell, Prompt, Fehler) + Status 'rendering'.
--   • room_projects.result_image_url wird von der Edge Function 'render-room'
--     mit dem fotorealistischen Ergebnisbild gefüllt.
-- ============================================================================

alter table public.ideas
  add column if not exists room_bbox jsonb; -- { x, y, w, h, polygon? } normalisiert (0..1)

alter table public.room_projects
  add column if not exists render_model text,
  add column if not exists render_prompt text,
  add column if not exists render_error text;

-- Status um die Render-Phase erweitern: processing → rendering → ready | failed.
alter table public.room_projects drop constraint if exists room_projects_status_check;
alter table public.room_projects
  add constraint room_projects_status_check
  check (status in ('processing', 'rendering', 'ready', 'failed'));
