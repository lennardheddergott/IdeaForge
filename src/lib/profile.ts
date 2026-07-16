import { supabase } from '@/lib/supabase'

/** Rolle eines Nutzers — bestimmt den App-Pfad. */
export type UserRole = 'customer' | 'manufacturer'

/** Startseite je nach Rolle. */
export function homeForRole(role: UserRole | null): string {
  return role === 'manufacturer' ? '/manufacturer' : '/dashboard'
}

/** Abo-Stufe – Grundlage der Pro-Berechtigung. */
export type SubscriptionTier = 'free' | 'pro'

/** Öffentliche Profildaten (Tabelle public.profiles). */
export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  subscription_tier: SubscriptionTier
}

/** Zentrale Berechtigungsprüfung für Pro-Funktionen. */
export function profileIsPro(profile: Profile | null): boolean {
  return profile?.subscription_tier === 'pro'
}

/** Lädt das Profil des aktuell eingeloggten Nutzers (null, wenn nicht angemeldet). */
export async function getMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, subscription_tier')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw new Error(`Profil konnte nicht geladen werden: ${error.message}`)
  if (!data) return null
  const p = data as Profile
  // Abwärtskompatibel, falls die Spalte (noch) fehlt: als 'free' behandeln.
  return { ...p, subscription_tier: p.subscription_tier ?? 'free' }
}

/**
 * MVP-Platzhalter für die Pro-Freischaltung: setzt das Abo-Flag echt in der DB
 * (keine Fake-UI). Hier wird später die echte Zahlungsabwicklung angebunden –
 * die UI/Guards bleiben dann unverändert.
 */
export async function activateProPreview(): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Nicht angemeldet.')

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_tier: 'pro' })
    .eq('id', user.id)

  if (error) throw new Error(`Pro konnte nicht aktiviert werden: ${error.message}`)
}

/** Aktualisiert das Profil des aktuell eingeloggten Nutzers (z. B. Name). */
export async function updateMyProfile(fields: {
  full_name?: string
}): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Nicht angemeldet.')

  const { error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', user.id)

  if (error) throw new Error(`Profil konnte nicht gespeichert werden: ${error.message}`)
}
