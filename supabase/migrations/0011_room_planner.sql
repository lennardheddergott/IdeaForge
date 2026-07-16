-- ============================================================================
-- 0011 — Pro-Funktion: Raumplanung ("Raum gestalten")
-- ============================================================================
-- Architektur (bewusst OHNE Doppelmodell):
--   • room_projects   = übergeordnetes Raumprojekt (Foto, Stil, Raumtyp, …).
--   • Einzelne Möbel  = ganz normale Zeilen in public.ideas, verknüpft über
--     ideas.room_project_id. Dadurch nutzen Raum-Produkte die bestehende
--     Pipeline (KI-Spec, Konzeptblatt, Visualisierung, Preis, Bestellung).
--   • profiles.subscription_tier = Grundlage der Pro-Berechtigung (isPro).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1) Pro-Berechtigung am Profil
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists subscription_tier text not null default 'free'
    check (subscription_tier in ('free', 'pro'));


-- ----------------------------------------------------------------------------
-- 2) room_projects — ein Raumprojekt je Gestaltung
-- ----------------------------------------------------------------------------
create table if not exists public.room_projects (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  name              text not null default 'Mein Raum',
  room_type         text,                          -- z. B. 'wohnzimmer'
  style             text,                          -- z. B. 'japandi' / Freitext
  description       text,                          -- vollständige Nutzerbeschreibung
  photo_path        text,                          -- Originalfoto im Bucket 'idea-images'
  result_image_url  text,                          -- fertige Raumvisualisierung (später)
  -- processing = Möbel werden erzeugt · ready = fertig · failed = Fehler
  status            text not null default 'processing'
                    check (status in ('processing', 'ready', 'failed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists room_projects_user_id_idx on public.room_projects (user_id);

alter table public.room_projects enable row level security;

drop policy if exists "room_projects: select own" on public.room_projects;
create policy "room_projects: select own"
  on public.room_projects for select using (auth.uid() = user_id);

drop policy if exists "room_projects: insert own" on public.room_projects;
create policy "room_projects: insert own"
  on public.room_projects for insert with check (auth.uid() = user_id);

drop policy if exists "room_projects: update own" on public.room_projects;
create policy "room_projects: update own"
  on public.room_projects for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "room_projects: delete own" on public.room_projects;
create policy "room_projects: delete own"
  on public.room_projects for delete using (auth.uid() = user_id);

drop trigger if exists trg_room_projects_updated_at on public.room_projects;
create trigger trg_room_projects_updated_at
  before update on public.room_projects
  for each row execute function public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 3) ideas um die Raum-Verknüpfung erweitern (Möbel = Idee im Raumprojekt)
-- ----------------------------------------------------------------------------
alter table public.ideas
  add column if not exists room_project_id uuid
    references public.room_projects (id) on delete cascade,
  add column if not exists room_position text,               -- Position im Raum (Freitext)
  add column if not exists room_selected boolean not null default true; -- vom Kunden gewählt

create index if not exists ideas_room_project_id_idx on public.ideas (room_project_id);
