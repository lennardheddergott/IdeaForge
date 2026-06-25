import { supabase } from '@/lib/supabase'

/** Unternehmensprofil eines Herstellers (Tabelle public.manufacturer_profiles). */
export interface ManufacturerProfile {
  id: string
  user_id: string
  company_name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  website: string | null
  address: string | null
  postal_code: string | null
  city: string | null
  country: string | null
  company_type: string | null
  specializations: string[]
  materials: string[]
  service_area: string | null
  description: string | null
  monthly_capacity: number | null
  avg_lead_time: string | null
  created_at: string
  updated_at: string
}

/** Eingabe aus dem Onboarding-/Bearbeiten-Formular (ohne System-Felder). */
export type ManufacturerProfileInput = Omit<
  ManufacturerProfile,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

/**
 * Lädt das Unternehmensprofil des aktuell eingeloggten Herstellers.
 * Gibt null zurück, wenn noch kein Profil angelegt wurde (→ Onboarding nötig).
 */
export async function getMyManufacturerProfile(): Promise<ManufacturerProfile | null> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Nicht angemeldet.')

  const { data, error } = await supabase
    .from('manufacturer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error)
    throw new Error(`Unternehmensprofil konnte nicht geladen werden: ${error.message}`)
  return (data as ManufacturerProfile | null) ?? null
}

/**
 * Legt das Unternehmensprofil an oder aktualisiert es (Upsert über user_id).
 * Gibt das gespeicherte Profil zurück.
 */
export async function saveManufacturerProfile(
  input: ManufacturerProfileInput,
): Promise<ManufacturerProfile> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Nicht angemeldet.')

  const { data, error } = await supabase
    .from('manufacturer_profiles')
    .upsert({ ...input, user_id: user.id }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error)
    throw new Error(`Unternehmensprofil konnte nicht gespeichert werden: ${error.message}`)
  return data as ManufacturerProfile
}
