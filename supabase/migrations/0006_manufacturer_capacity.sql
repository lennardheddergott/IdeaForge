-- ============================================================================
-- Migration 0006 — Hersteller: Kapazität, Verfügbarkeit & Liefergebiet
-- ============================================================================
-- Erweitert das Herstellerprofil um steuerbare Felder als Grundlage für das
-- spätere automatische Matching (noch OHNE Preisregeln/Pricing):
--   - is_available            : verfügbar für neue Aufträge
--   - auto_accept_enabled     : Aufträge automatisch annehmen
--   - max_orders_per_week     : Kapazität pro Woche
--   - current_lead_time_weeks : aktuelle Lieferzeit in Wochen
--   - delivery_radius_km      : Liefergebiet in km
--   - profile_completed       : Profil ausreichend gefüllt (für Matching)
--
-- Idempotent: kann gefahrlos mehrfach ausgeführt werden.
-- ============================================================================

alter table public.manufacturer_profiles
  add column if not exists is_available            boolean not null default true;

alter table public.manufacturer_profiles
  add column if not exists auto_accept_enabled     boolean not null default false;

alter table public.manufacturer_profiles
  add column if not exists max_orders_per_week     int;

alter table public.manufacturer_profiles
  add column if not exists current_lead_time_weeks int;

alter table public.manufacturer_profiles
  add column if not exists delivery_radius_km      int;

alter table public.manufacturer_profiles
  add column if not exists profile_completed       boolean not null default false;

-- ============================================================================
-- Ende der Migration 0006
-- ============================================================================
