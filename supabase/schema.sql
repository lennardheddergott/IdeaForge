-- ============================================================================
-- IdeaForge — Datenbank-Schema (Supabase / PostgreSQL)
-- ============================================================================
-- Auth-Methode: E-Mail + Passwort (Supabase Auth, Tabelle auth.users)
--
-- Ausführen: Supabase Dashboard → SQL Editor → komplettes Script einfügen → Run.
-- Das Script ist idempotent gehalten (IF NOT EXISTS / CREATE OR REPLACE),
-- kann also gefahrlos erneut ausgeführt werden.
--
-- Sicherheitsmodell: Row-Level-Security (RLS) auf JEDER Tabelle. Jeder Nutzer
-- kann ausschließlich seine eigenen Zeilen lesen/schreiben (user_id = auth.uid()).
-- Hersteller sind öffentlich lesbar (Katalog), aber nur per Service-Role
-- schreibbar.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0) Hilfsfunktion: updated_at automatisch pflegen
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ----------------------------------------------------------------------------
-- 1) profiles  —  1:1 zu auth.users (öffentliche Nutzerdaten)
-- ----------------------------------------------------------------------------
-- auth.users wird von Supabase verwaltet (E-Mail, Passwort-Hash, Session).
-- Diese Tabelle hält zusätzliche, von der App nutzbare Profildaten.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INSERT erfolgt automatisch per Trigger (s. u.), daher keine INSERT-Policy nötig.

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 1b) Trigger: Profil automatisch bei Registrierung anlegen
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ----------------------------------------------------------------------------
-- 2) ideas  —  gespeicherte Ideen aus dem "Idee erstellen"-Flow
-- ----------------------------------------------------------------------------
-- Felder entsprechen dem Formular in src/pages/CreateIdea.tsx:
--   prompt, style (1x), materials (mehrere), category (1x), budget (1x),
--   image_paths (Uploads im Storage-Bucket "idea-images").
-- "status" beschreibt den Lebenszyklus der KI-Bildgenerierung:
--   draft     – Entwurf ohne Generierung (Altbestand / manuell gespeichert)
--   pending   – gespeichert, KI-Konzeptskizze wird gerade erzeugt
--   generated – Skizze erfolgreich erzeugt (image_url gesetzt)
--   failed    – Generierung fehlgeschlagen (error enthält die Ursache)
create table if not exists public.ideas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  prompt      text not null,
  style       text,                                  -- options.ts → styles.id (z. B. 'japandi')
  -- Materialpräferenzen (optional, Mehrfachauswahl): leeres Array = keine Angabe
  materials   text[] not null default '{}',          -- options.ts → materials.id[] (z. B. {'oak','glass'})
  category    text,                                  -- options.ts → categories.id (z. B. 'tvboard')
  -- Budget (optional): NULL = keine Angabe; speichert die Budget-Stufen-id aus options.ts
  budget      text,                                  -- options.ts → budgets.id (z. B. 'b3')
  image_paths text[] not null default '{}',          -- Inspirationsbilder im Bucket 'idea-images'
  status      text not null default 'draft'
              check (status in ('draft', 'pending', 'generated', 'failed')),
  -- Öffentliche URLs der von gpt-image erzeugten Bilder (Bucket 'idea-sketches'):
  image_url          text,  -- Abwärtskompatibilität: gespiegelt = concept_sheet_url
  concept_sheet_url  text,  -- technisches Engineering-/CAD-Konzeptblatt
  preview_image_url  text,  -- fotorealistische Produktvorschau
  -- Fehlerursache, falls status = 'failed' (für saubere Fehleranzeige im Frontend).
  error       text,
  -- Optionales strukturiertes KI-Ergebnis (entspricht designConcept in projects.ts):
  concept     jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ideas_user_id_idx on public.ideas (user_id);

alter table public.ideas enable row level security;

drop policy if exists "ideas: select own" on public.ideas;
create policy "ideas: select own"
  on public.ideas for select using (auth.uid() = user_id);

drop policy if exists "ideas: insert own" on public.ideas;
create policy "ideas: insert own"
  on public.ideas for insert with check (auth.uid() = user_id);

drop policy if exists "ideas: update own" on public.ideas;
create policy "ideas: update own"
  on public.ideas for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ideas: delete own" on public.ideas;
create policy "ideas: delete own"
  on public.ideas for delete using (auth.uid() = user_id);

drop trigger if exists trg_ideas_updated_at on public.ideas;
create trigger trg_ideas_updated_at
  before update on public.ideas
  for each row execute function public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 3) projects  —  Dashboard-Projekte (aus einer Idee entstanden)
-- ----------------------------------------------------------------------------
-- Entspricht dem Interface Project in src/data/projects.ts.
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  idea_id       uuid references public.ideas (id) on delete set null,
  name          text not null,
  category      text,
  status        text not null default 'design'
                check (status in ('design', 'matching', 'production', 'delivered')),
  progress      int  not null default 0 check (progress between 0 and 100),
  manufacturer  text,                                -- Freitext oder später FK auf manufacturers
  price         numeric(10,2),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);

alter table public.projects enable row level security;

drop policy if exists "projects: select own" on public.projects;
create policy "projects: select own"
  on public.projects for select using (auth.uid() = user_id);

drop policy if exists "projects: insert own" on public.projects;
create policy "projects: insert own"
  on public.projects for insert with check (auth.uid() = user_id);

drop policy if exists "projects: update own" on public.projects;
create policy "projects: update own"
  on public.projects for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "projects: delete own" on public.projects;
create policy "projects: delete own"
  on public.projects for delete using (auth.uid() = user_id);

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();


-- ----------------------------------------------------------------------------
-- 4) manufacturers  —  öffentlicher Hersteller-Katalog
-- ----------------------------------------------------------------------------
-- Aktuell als Dummy-Daten in src/data/manufacturers.ts. Optional in die DB
-- migrierbar. Öffentlich lesbar; Schreibzugriff nur per Service-Role (Seeding).
create table if not exists public.manufacturers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  data        jsonb,                                 -- restliche Felder flexibel ablegbar
  created_at  timestamptz not null default now()
);

alter table public.manufacturers enable row level security;

drop policy if exists "manufacturers: public read" on public.manufacturers;
create policy "manufacturers: public read"
  on public.manufacturers for select using (true);
-- Kein INSERT/UPDATE/DELETE für normale Nutzer → nur Service-Role darf schreiben.


-- ----------------------------------------------------------------------------
-- 5) favorites  —  vom Nutzer favorisierte Hersteller (Profil → Favoriten)
-- ----------------------------------------------------------------------------
create table if not exists public.favorites (
  user_id         uuid not null references auth.users (id) on delete cascade,
  manufacturer_id uuid not null references public.manufacturers (id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (user_id, manufacturer_id)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites: select own" on public.favorites;
create policy "favorites: select own"
  on public.favorites for select using (auth.uid() = user_id);

drop policy if exists "favorites: insert own" on public.favorites;
create policy "favorites: insert own"
  on public.favorites for insert with check (auth.uid() = user_id);

drop policy if exists "favorites: delete own" on public.favorites;
create policy "favorites: delete own"
  on public.favorites for delete using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 6) manufacturer_requests  —  offene Anfragen an Hersteller (Dashboard)
-- ----------------------------------------------------------------------------
-- Entspricht dem Array "requests" in src/data/projects.ts.
create table if not exists public.manufacturer_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  project_id   uuid references public.projects (id) on delete cascade,
  manufacturer text not null,
  status       text not null default 'pending',
  created_at   timestamptz not null default now()
);

create index if not exists requests_user_id_idx on public.manufacturer_requests (user_id);

alter table public.manufacturer_requests enable row level security;

drop policy if exists "requests: select own" on public.manufacturer_requests;
create policy "requests: select own"
  on public.manufacturer_requests for select using (auth.uid() = user_id);

drop policy if exists "requests: insert own" on public.manufacturer_requests;
create policy "requests: insert own"
  on public.manufacturer_requests for insert with check (auth.uid() = user_id);

drop policy if exists "requests: update own" on public.manufacturer_requests;
create policy "requests: update own"
  on public.manufacturer_requests for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "requests: delete own" on public.manufacturer_requests;
create policy "requests: delete own"
  on public.manufacturer_requests for delete using (auth.uid() = user_id);


-- ============================================================================
-- 7) STORAGE — Bucket für Idee-Bilder (Uploads aus CreateIdea.tsx)
-- ============================================================================
-- Bucket privat anlegen. Dateien werden unter <user_id>/<dateiname> abgelegt,
-- sodass die Policy pro Ordner = pro Nutzer greift.
insert into storage.buckets (id, name, public)
values ('idea-images', 'idea-images', false)
on conflict (id) do nothing;

drop policy if exists "idea-images: read own" on storage.objects;
create policy "idea-images: read own"
  on storage.objects for select
  using (
    bucket_id = 'idea-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "idea-images: insert own" on storage.objects;
create policy "idea-images: insert own"
  on storage.objects for insert
  with check (
    bucket_id = 'idea-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "idea-images: delete own" on storage.objects;
create policy "idea-images: delete own"
  on storage.objects for delete
  using (
    bucket_id = 'idea-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================================
-- 8) STORAGE — Bucket für die von der KI generierten Konzeptskizzen
-- ============================================================================
-- Geschrieben wird ausschließlich von der Edge Function 'generate-sketch'
-- (mit Service-Role, umgeht RLS). Der Bucket ist ÖFFENTLICH lesbar, damit die
-- in ideas.image_url gespeicherte URL stabil bleibt und z. B. direkt an
-- Hersteller weitergegeben werden kann. Dateien liegen unter <user_id>/<idea_id>.png.
insert into storage.buckets (id, name, public)
values ('idea-sketches', 'idea-sketches', true)
on conflict (id) do nothing;

-- Öffentlicher Lesezugriff (der Bucket ist public; diese Policy macht das explizit).
drop policy if exists "idea-sketches: public read" on storage.objects;
create policy "idea-sketches: public read"
  on storage.objects for select
  using (bucket_id = 'idea-sketches');
-- Kein INSERT/UPDATE/DELETE für normale Nutzer → nur die Service-Role (Edge
-- Function) schreibt in diesen Bucket.

-- ============================================================================
-- Ende des Schemas
-- ============================================================================
