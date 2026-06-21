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

## 5. Starten & testen

```bash
npm run dev
```

1. `/login` öffnen → **Registrieren** → Konto anlegen.
2. Auf `/create` eine Idee beschreiben und **Design generieren**.
3. In Supabase **Table Editor → ideas** prüfen: Die Idee ist gespeichert,
   hochgeladene Bilder liegen unter **Storage → idea-images → <deine user_id>**.

## Hinweise

- Der `anon`-Key ist für den Browser gedacht und ungefährlich, **solange RLS
  aktiv ist** (ist es — siehe `schema.sql`). Niemals den `service_role`-Key ins
  Frontend legen.
- Kostenloses Supabase-Projekt pausiert nach ~1 Woche Inaktivität; im Dashboard
  einfach wieder „Restore" klicken.
