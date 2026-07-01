-- ============================================================================
-- Migration 0008 — Dynamisches Materialsystem (manufacturer_materials)
-- ============================================================================
-- Ersetzt die festen Materialpreis-Felder (jsonb material_prices) durch eine
-- eigene Tabelle: Hersteller können beliebig viele Materialien mit Kategorie,
-- €/m², Beschreibung und Aktiv-Status pflegen.
--
-- Bestehende Daten bleiben unangetastet: die alte Spalte
-- manufacturer_pricing.material_prices wird NICHT entfernt. Vorhandene feste
-- Preise (mdf / echtholzfurnier / massivholz_eiche) werden best-effort in
-- Zeilen übernommen. Idempotent: mehrfach ausführbar.
-- ============================================================================

create table if not exists public.manufacturer_materials (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  -- Kategorie: holzwerkstoff | massivholz | furnier | dekorplatte | hpl | metall | glas | sonstiges
  category      text not null default 'sonstiges',
  price_per_m2  numeric(10,2) not null default 0,
  description   text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists manufacturer_materials_user_id_idx
  on public.manufacturer_materials (user_id);

alter table public.manufacturer_materials enable row level security;

-- Nur der Eigentümer darf lesen/schreiben (Preisdaten sind privat).
drop policy if exists "manufacturer_materials: select own" on public.manufacturer_materials;
create policy "manufacturer_materials: select own"
  on public.manufacturer_materials for select using (auth.uid() = user_id);

drop policy if exists "manufacturer_materials: insert own" on public.manufacturer_materials;
create policy "manufacturer_materials: insert own"
  on public.manufacturer_materials for insert with check (auth.uid() = user_id);

drop policy if exists "manufacturer_materials: update own" on public.manufacturer_materials;
create policy "manufacturer_materials: update own"
  on public.manufacturer_materials for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "manufacturer_materials: delete own" on public.manufacturer_materials;
create policy "manufacturer_materials: delete own"
  on public.manufacturer_materials for delete using (auth.uid() = user_id);

drop trigger if exists trg_manufacturer_materials_updated_at on public.manufacturer_materials;
create trigger trg_manufacturer_materials_updated_at
  before update on public.manufacturer_materials
  for each row execute function public.set_updated_at();

-- Best-effort-Übernahme bestehender fester Materialpreise in Zeilen.
insert into public.manufacturer_materials (user_id, name, category, price_per_m2, is_active)
select mp.user_id, m.name, m.category, (mp.material_prices ->> m.key)::numeric, true
from public.manufacturer_pricing mp
cross join (values
  ('mdf',              'MDF',                'holzwerkstoff'),
  ('echtholzfurnier',  'Echtholzfurnier',    'furnier'),
  ('massivholz_eiche', 'Massivholz Eiche',   'massivholz')
) as m(key, name, category)
where mp.material_prices ? m.key
  and (mp.material_prices ->> m.key) ~ '^[0-9]+(\.[0-9]+)?$'
  and (mp.material_prices ->> m.key)::numeric > 0
on conflict (user_id, name) do nothing;

-- ============================================================================
-- Ende der Migration 0008
-- ============================================================================
