# Supabase-Einrichtung für IdeaForge

Schritt-für-Schritt-Anleitung, um Benutzerkonten (E-Mail + Passwort) und das
Speichern von Ideen zu aktivieren. Dauert ca. 10 Minuten.

## 1. Projekt anlegen

1. Auf <https://supabase.com> registrieren / einloggen.
2. **New project** → Name `ideaforge`, Datenbank-Passwort vergeben (notieren!).
3. **Region: Central EU (Frankfurt)** wählen (DSGVO).
4. Auf das Provisioning warten (~2 Min).

## 2. Datenbank-Schema einspielen

1. Im Projekt: **SQL Editor → New query**.
2. Den kompletten Inhalt von [`schema.sql`](./schema.sql) einfügen.
3. **Run** klicken. Es legt Tabellen (`profiles`, `ideas`, `projects`, …),
   Row-Level-Security-Policies, Trigger und den Storage-Bucket `idea-images` an.

## 3. E-Mail/Passwort-Login aktivieren

1. **Authentication → Sign In / Providers → Email** ist standardmäßig aktiv.
2. Zum schnellen lokalen Testen: **Authentication → Sign In / Providers → Email →
   „Confirm email" vorübergehend ausschalten.** Dann kannst du dich sofort nach
   der Registrierung anmelden, ohne den Bestätigungslink. (Für Produktion wieder
   einschalten.)

## 4. Zugangsdaten ins Frontend

1. **Project Settings → API** öffnen.
2. `Project URL` und den `Publishable key` (`sb_publishable_…`) kopieren.
   (Falls dein Projekt noch die alte Ansicht hat: der `anon public` Key
   funktioniert identisch.)
3. Im Projektordner `.env.local` öffnen (Vorlage: `.env.example`) und eintragen:

   ```bash
   VITE_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
   ```

   > `.env.local` wird von Git ignoriert — die Keys landen nicht im Repo.
   > NIEMALS den `Service Role`-Key hier eintragen.

## 5. OpenAI-Bildgenerierung (Edge Function)

Die KI-Konzeptskizzen werden von der Edge Function
[`functions/generate-sketch`](./functions/generate-sketch/index.ts) erzeugt.
Der **OpenAI-API-Schlüssel liegt ausschließlich serverseitig** als
Function-Secret — niemals im Frontend (`.env.local`/`VITE_*`).

### 5.1 Bei einer bereits bestehenden Datenbank: Migration einspielen

> Bei einer **frischen** Installation ist alles schon in `schema.sql` enthalten —
> dann überspringen.

**SQL Editor → New query** → Inhalt von
[`migrations/0001_image_generation.sql`](./migrations/0001_image_generation.sql)
einfügen → **Run**. Das ergänzt die Status-Werte `pending`/`failed`, die Spalten
`image_url`/`error` und den öffentlichen Bucket `idea-sketches`.

### 5.2 Supabase CLI installieren & Projekt verknüpfen

```bash
npm install -g supabase            # oder: brew install supabase/tap/supabase
supabase login
supabase link --project-ref <DEIN-PROJECT-REF>   # Ref steht in der Project-URL
```

### 5.3 OpenAI-Schlüssel als Secret hinterlegen

```bash
supabase secrets set OPENAI_API_KEY=sk-...
# optional: Modell/Parameter überschreiben (Defaults: gpt-image-2 / 1024x1024 / medium)
# supabase secrets set OPENAI_IMAGE_MODEL=gpt-image-2
```

> `SUPABASE_URL`, `SUPABASE_ANON_KEY` und `SUPABASE_SERVICE_ROLE_KEY` stellt die
> Laufzeitumgebung automatisch bereit — die müssen **nicht** gesetzt werden.

### 5.4 Function deployen

```bash
supabase functions deploy generate-sketch
```

**Lokal testen** (statt deploy): Secrets in `supabase/functions/.env` (Vorlage:
`functions/.env.example`) eintragen und

```bash
supabase functions serve generate-sketch --env-file supabase/functions/.env
```

## 6. Starten & testen

```bash
npm run dev
```

1. `/login` öffnen → **Registrieren** → Konto anlegen.
2. Auf `/create` eine Idee beschreiben und **Design generieren**.
   Die Idee wird mit Status `pending` gespeichert, die Function erzeugt die
   Skizze und setzt den Status auf `generated` (bei Fehlern `failed`).
3. In Supabase prüfen: **Table Editor → ideas** (Status + `image_url`),
   die Skizze liegt unter **Storage → idea-sketches → <deine user_id>**,
   Inspirationsbilder unter **Storage → idea-images → <deine user_id>**.

## Hinweise

- Der `anon`-Key ist für den Browser gedacht und ungefährlich, **solange RLS
  aktiv ist** (ist es — siehe `schema.sql`). Niemals den `service_role`-Key ins
  Frontend legen.
- Kostenloses Supabase-Projekt pausiert nach ~1 Woche Inaktivität; im Dashboard
  einfach wieder „Restore" klicken.
