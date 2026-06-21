import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
// Akzeptiert den neuen "Publishable key" (sb_publishable_…) oder den
// klassischen "anon"-Key — beide sind für den Browser bestimmt und sicher,
// solange Row-Level-Security aktiv ist. NIEMALS den Service-Role-Key hier nutzen.
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !publishableKey) {
  // Klarer Hinweis statt kryptischer Laufzeitfehler, falls .env.local fehlt.
  throw new Error(
    'Supabase ist nicht konfiguriert. Lege .env.local an (Vorlage: .env.example) ' +
      'und trage VITE_SUPABASE_URL und VITE_SUPABASE_PUBLISHABLE_KEY ein.',
  )
}

/** Globaler Supabase-Client (Auth-Session wird automatisch im localStorage gehalten). */
export const supabase = createClient(url, publishableKey)
