import { supabase } from '@/lib/supabase'

/** Rolle eines Nutzers — bestimmt den App-Pfad. */
export type UserRole = 'customer' | 'manufacturer'

/** Startseite je nach Rolle. */
export function homeForRole(role: UserRole | null): string {
  return role === 'manufacturer' ? '/manufacturer' : '/dashboard'
}

/** Öffentliche Profildaten (Tabelle public.profiles). */
export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
}

/** Lädt das Profil des aktuell eingeloggten Nutzers (null, wenn nicht angemeldet). */
export async function getMyProfile(): Promise<Profile | null> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw new Error(`Profil konnte nicht geladen werden: ${error.message}`)
  return (data as Profile | null) ?? null
}
