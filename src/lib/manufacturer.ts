import { supabase } from '@/lib/supabase'
import type { ManufacturerPricing } from '@/lib/pricing'

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
  // Kapazität & Verfügbarkeit (Grundlage fürs spätere Matching).
  is_available: boolean
  auto_accept_enabled: boolean
  max_orders_per_week: number | null
  current_lead_time_weeks: number | null
  delivery_radius_km: number | null
  profile_completed: boolean
  created_at: string
  updated_at: string
}

/** Eingabe aus dem Onboarding-/Bearbeiten-Formular (ohne System-/berechnete Felder). */
export type ManufacturerProfileInput = Omit<
  ManufacturerProfile,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'profile_completed'
>

/**
 * Ein Profil gilt als vollständig, wenn die für ein späteres Matching nötigen
 * Kernangaben vorhanden sind: Firmenname, PLZ, mind. eine Leistung, mind. ein
 * Material, Liefergebiet, Kapazität und aktuelle Lieferzeit.
 */
export function isProfileComplete(p: ManufacturerProfileInput): boolean {
  return Boolean(
    p.company_name?.trim() &&
      p.postal_code?.trim() &&
      p.specializations.length > 0 &&
      p.materials.length > 0 &&
      p.delivery_radius_km &&
      p.max_orders_per_week &&
      p.current_lead_time_weeks,
  )
}

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
 * profile_completed wird serverseitig-nah aus den Eingaben berechnet.
 */
export async function saveManufacturerProfile(
  input: ManufacturerProfileInput,
): Promise<ManufacturerProfile> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Nicht angemeldet.')

  const { data, error } = await supabase
    .from('manufacturer_profiles')
    .upsert(
      { ...input, user_id: user.id, profile_completed: isProfileComplete(input) },
      { onConflict: 'user_id' },
    )
    .select()
    .single()

  if (error)
    throw new Error(`Unternehmensprofil konnte nicht gespeichert werden: ${error.message}`)
  return data as ManufacturerProfile
}

/**
 * Aktualisiert einzelne Steuer-Felder (z. B. Verfügbarkeit / Auto-Accept) des
 * eigenen Profils – für schnelle Umschalter im Dashboard.
 */
export async function updateManufacturerFields(
  fields: Partial<
    Pick<
      ManufacturerProfile,
      | 'is_available'
      | 'auto_accept_enabled'
      | 'max_orders_per_week'
      | 'current_lead_time_weeks'
    >
  >,
): Promise<ManufacturerProfile> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Nicht angemeldet.')

  const { data, error } = await supabase
    .from('manufacturer_profiles')
    .update(fields)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error)
    throw new Error(`Aktualisierung fehlgeschlagen: ${error.message}`)
  return data as ManufacturerProfile
}

/* ─────────────────── Preisparameter (Pricing-Engine) ─────────────────── */

/** Gespeicherte Preisparameter inkl. System-Feldern (Tabelle manufacturer_pricing). */
export interface ManufacturerPricingRow extends ManufacturerPricing {
  id: string
  user_id: string
  pricing_completed: boolean
  created_at: string
  updated_at: string
}

/** Preise gelten als gepflegt, wenn Stundenlohn und Marge gesetzt sind.
 *  (Materialien werden separat in manufacturer_materials gepflegt.) */
export function isPricingComplete(p: ManufacturerPricing): boolean {
  return Boolean(p.hourly_rate > 0 && p.margin_percent > 0)
}

/** Lädt die Preisparameter des aktuell eingeloggten Herstellers (null, wenn keine). */
export async function getMyPricing(): Promise<ManufacturerPricingRow | null> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Nicht angemeldet.')

  const { data, error } = await supabase
    .from('manufacturer_pricing')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw new Error(`Preise konnten nicht geladen werden: ${error.message}`)
  return (data as ManufacturerPricingRow | null) ?? null
}

/** Legt die Preisparameter an oder aktualisiert sie (Upsert über user_id). */
export async function saveMyPricing(
  input: ManufacturerPricing,
): Promise<ManufacturerPricingRow> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Nicht angemeldet.')

  const { data, error } = await supabase
    .from('manufacturer_pricing')
    .upsert(
      { ...input, user_id: user.id, pricing_completed: isPricingComplete(input) },
      { onConflict: 'user_id' },
    )
    .select()
    .single()

  if (error) throw new Error(`Preise konnten nicht gespeichert werden: ${error.message}`)
  return data as ManufacturerPricingRow
}
