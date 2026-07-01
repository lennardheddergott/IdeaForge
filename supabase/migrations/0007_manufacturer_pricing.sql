-- ============================================================================
-- Migration 0007 — Hersteller-Preisregeln (Grundlage der Pricing-Engine)
-- ============================================================================
-- Je Hersteller EINE Zeile mit den regelbasierten Preisparametern. Daraus
-- berechnet die Pricing-Engine (src/lib/pricing.ts) den Preis für eine Variante.
-- Die Kalkulationsdaten sind PRIVAT (nur der Eigentümer darf lesen/schreiben);
-- Kunden sehen später nur berechnete Ergebnisse (via Matching).
--
-- Idempotent: kann gefahrlos mehrfach ausgeführt werden.
-- ============================================================================

create table if not exists public.manufacturer_pricing (
  id                             uuid primary key default gen_random_uuid(),
  user_id                        uuid not null unique references auth.users (id) on delete cascade,
  hourly_rate                    numeric(10,2) not null default 0,   -- Stundenlohn
  margin_percent                 numeric(6,2)  not null default 0,   -- Marge in %
  minimum_order_value            numeric(10,2) not null default 0,   -- Mindestauftragswert
  delivery_fee                   numeric(10,2) not null default 0,   -- Lieferkosten
  assembly_fee                   numeric(10,2) not null default 0,   -- Montagekosten
  surface_treatment_price_per_m2 numeric(10,2) not null default 0,   -- Oberfläche/Lack/Öl je m²
  door_price                     numeric(10,2) not null default 0,   -- Preis je Tür
  drawer_price                   numeric(10,2) not null default 0,   -- Preis je Schublade
  standard_hardware_price        numeric(10,2) not null default 0,   -- Beschläge Standard
  premium_hardware_price         numeric(10,2) not null default 0,   -- Beschläge Premium
  material_prices                jsonb not null default '{}',        -- { material_type: €/m² }
  pricing_completed              boolean not null default false,     -- Preise ausreichend gepflegt
  created_at                     timestamptz not null default now(),
  updated_at                     timestamptz not null default now()
);

alter table public.manufacturer_pricing enable row level security;

-- NUR der Eigentümer darf seine Kalkulation lesen/schreiben (nicht öffentlich).
drop policy if exists "manufacturer_pricing: select own" on public.manufacturer_pricing;
create policy "manufacturer_pricing: select own"
  on public.manufacturer_pricing for select using (auth.uid() = user_id);

drop policy if exists "manufacturer_pricing: insert own" on public.manufacturer_pricing;
create policy "manufacturer_pricing: insert own"
  on public.manufacturer_pricing for insert with check (auth.uid() = user_id);

drop policy if exists "manufacturer_pricing: update own" on public.manufacturer_pricing;
create policy "manufacturer_pricing: update own"
  on public.manufacturer_pricing for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "manufacturer_pricing: delete own" on public.manufacturer_pricing;
create policy "manufacturer_pricing: delete own"
  on public.manufacturer_pricing for delete using (auth.uid() = user_id);

drop trigger if exists trg_manufacturer_pricing_updated_at on public.manufacturer_pricing;
create trigger trg_manufacturer_pricing_updated_at
  before update on public.manufacturer_pricing
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Ende der Migration 0007
-- ============================================================================
