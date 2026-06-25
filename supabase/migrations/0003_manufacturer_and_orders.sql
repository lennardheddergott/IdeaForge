-- ============================================================================
-- Migration 0003 — Hersteller-Pfad: Rollen, Unternehmensprofile & Aufträge
-- ============================================================================
-- Führt den zweiten Nutzerpfad (Hersteller) ein:
--   - profiles.role             : 'customer' | 'manufacturer'
--   - manufacturer_profiles      : Unternehmensdaten eines Herstellers
--   - orders                     : Aufträge (Kunde → optional Hersteller)
--
-- Auf eine BEREITS bestehende IdeaForge-Datenbank anwenden
-- (Supabase Dashboard → SQL Editor → einfügen → Run). Bei einer frischen
-- Installation steckt alles bereits in schema.sql.
-- Idempotent: kann gefahrlos mehrfach ausgeführt werden.
-- ============================================================================


-- 1) profiles: Rolle ---------------------------------------------------------
-- Jeder Nutzer ist entweder Kunde (Standard) oder Hersteller.
alter table public.profiles
  add column if not exists role text not null default 'customer';

alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer', 'manufacturer'));


-- 2) Trigger: Rolle bei Registrierung mit übernehmen ------------------------
-- Liest 'role' aus den Signup-Metadaten (options.data.role im Frontend).
-- Fällt bei fehlender/ungültiger Angabe sicher auf 'customer' zurück.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    case when meta_role in ('customer', 'manufacturer') then meta_role else 'customer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


-- 3) manufacturer_profiles: Unternehmensdaten eines Herstellers --------------
-- 1:1 zu einem Hersteller-Nutzer (user_id unique). Entspricht dem
-- Onboarding-Formular in src/pages/ManufacturerOnboarding.tsx.
create table if not exists public.manufacturer_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users (id) on delete cascade,
  company_name      text not null,                       -- Unternehmensname
  contact_person    text,                                -- Ansprechpartner
  email             text,                                -- Kontakt-E-Mail
  phone             text,                                -- Telefonnummer
  website           text,                                -- Website (optional)
  address           text,                                -- Adresse / Straße
  postal_code       text,                                -- PLZ
  city              text,                                -- Stadt
  country           text,                                -- Land
  company_type      text,                                -- Art (Tischlerei, Metallbau, …)
  specializations   text[] not null default '{}',        -- Tische, Schränke, Regale, …
  materials         text[] not null default '{}',        -- Massivholz, MDF, Metall, Glas, …
  service_area      text,                                -- Liefergebiet / Region
  description       text,                                -- Beschreibung des Unternehmens
  monthly_capacity  int,                                 -- Kapazität pro Monat (optional)
  avg_lead_time     text,                                -- durchschn. Bearbeitungszeit (optional)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists manufacturer_profiles_user_id_idx
  on public.manufacturer_profiles (user_id);

alter table public.manufacturer_profiles enable row level security;

-- Öffentlich lesbar (für späteres Hersteller-Matching / Katalog).
drop policy if exists "manufacturer_profiles: public read" on public.manufacturer_profiles;
create policy "manufacturer_profiles: public read"
  on public.manufacturer_profiles for select using (true);

drop policy if exists "manufacturer_profiles: insert own" on public.manufacturer_profiles;
create policy "manufacturer_profiles: insert own"
  on public.manufacturer_profiles for insert with check (auth.uid() = user_id);

drop policy if exists "manufacturer_profiles: update own" on public.manufacturer_profiles;
create policy "manufacturer_profiles: update own"
  on public.manufacturer_profiles for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "manufacturer_profiles: delete own" on public.manufacturer_profiles;
create policy "manufacturer_profiles: delete own"
  on public.manufacturer_profiles for delete using (auth.uid() = user_id);

drop trigger if exists trg_manufacturer_profiles_updated_at on public.manufacturer_profiles;
create trigger trg_manufacturer_profiles_updated_at
  before update on public.manufacturer_profiles
  for each row execute function public.set_updated_at();


-- 4) orders: Aufträge --------------------------------------------------------
-- Ein Auftrag entsteht aus einer Idee, wenn der Kunde "Jetzt anfertigen lassen"
-- klickt. manufacturer_id bleibt zunächst NULL (noch keine automatische
-- Zuordnung). Status-Lebenszyklus:
--   submitted     – vom Kunden eingereicht (Standard)
--   assigned      – einem Hersteller zugewiesen
--   accepted      – vom Hersteller angenommen
--   rejected      – vom Hersteller abgelehnt
--   in_production – in Fertigung
--   completed     – abgeschlossen
create table if not exists public.orders (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid not null references auth.users (id) on delete cascade,
  manufacturer_id    uuid references public.manufacturer_profiles (id) on delete set null,
  idea_id            uuid references public.ideas (id) on delete set null,
  description        text not null,                       -- ursprüngliche Nutzerbeschreibung
  concept_sheet_url  text,                                -- Konzeptblatt
  preview_image_url  text,                                -- Visualisierung (optional)
  concept            jsonb,                               -- optionales strukturiertes KI-Ergebnis
  status             text not null default 'submitted'
                     check (status in ('submitted', 'assigned', 'accepted',
                                       'rejected', 'in_production', 'completed')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists orders_customer_id_idx     on public.orders (customer_id);
create index if not exists orders_manufacturer_id_idx on public.orders (manufacturer_id);
create index if not exists orders_status_idx          on public.orders (status);

alter table public.orders enable row level security;

-- --- Kunde: volle Kontrolle über die EIGENEN Aufträge ---------------------
drop policy if exists "orders: customer select own" on public.orders;
create policy "orders: customer select own"
  on public.orders for select using (auth.uid() = customer_id);

drop policy if exists "orders: customer insert own" on public.orders;
create policy "orders: customer insert own"
  on public.orders for insert with check (auth.uid() = customer_id);

drop policy if exists "orders: customer update own" on public.orders;
create policy "orders: customer update own"
  on public.orders for update
  using (auth.uid() = customer_id) with check (auth.uid() = customer_id);

-- --- Hersteller: zugewiesene Aufträge + offener "submitted"-Pool ----------
-- Ein Hersteller sieht (a) Aufträge, die seinem Unternehmensprofil zugeordnet
-- sind, und (b) noch nicht zugeordnete, eingereichte Aufträge (offener Pool),
-- damit der Bereich "Neue Aufträge" auch ohne Auto-Zuordnung Sinn ergibt.
drop policy if exists "orders: manufacturer select" on public.orders;
create policy "orders: manufacturer select"
  on public.orders for select
  using (
    exists (
      select 1 from public.manufacturer_profiles mp
      where mp.id = orders.manufacturer_id and mp.user_id = auth.uid()
    )
    or (
      orders.manufacturer_id is null
      and orders.status = 'submitted'
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'manufacturer'
      )
    )
  );

-- Hersteller darf einen Pool-Auftrag an sich ziehen ODER seine eigenen
-- zugewiesenen Aufträge aktualisieren (Status / Zuweisung).
-- USING erlaubt Pool + bereits zugewiesen; WITH CHECK erzwingt, dass das
-- Ergebnis dem eigenen Unternehmensprofil gehört.
drop policy if exists "orders: manufacturer update" on public.orders;
create policy "orders: manufacturer update"
  on public.orders for update
  using (
    exists (
      select 1 from public.manufacturer_profiles mp
      where mp.id = orders.manufacturer_id and mp.user_id = auth.uid()
    )
    or (
      orders.manufacturer_id is null
      and orders.status = 'submitted'
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'manufacturer'
      )
    )
  )
  with check (
    exists (
      select 1 from public.manufacturer_profiles mp
      where mp.id = orders.manufacturer_id and mp.user_id = auth.uid()
    )
  );

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Ende der Migration 0003
-- ============================================================================
