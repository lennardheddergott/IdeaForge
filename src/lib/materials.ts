import { supabase } from '@/lib/supabase'

export type MaterialCategory =
  | 'holzwerkstoff'
  | 'massivholz'
  | 'furnier'
  | 'dekorplatte'
  | 'hpl'
  | 'metall'
  | 'glas'
  | 'sonstiges'

/** Ein Material im Herstellerprofil (Tabelle manufacturer_materials). */
export interface Material {
  id: string
  user_id: string
  name: string
  category: MaterialCategory
  price_per_m2: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MaterialInput {
  name: string
  category: MaterialCategory
  price_per_m2: number
  description?: string | null
  is_active?: boolean
}

/** Auswählbare Kategorien mit Anzeige-Label. */
export const MATERIAL_CATEGORIES: { id: MaterialCategory; label: string }[] = [
  { id: 'holzwerkstoff', label: 'Holzwerkstoff' },
  { id: 'massivholz', label: 'Massivholz' },
  { id: 'furnier', label: 'Furnier' },
  { id: 'dekorplatte', label: 'Dekorplatte' },
  { id: 'hpl', label: 'HPL' },
  { id: 'metall', label: 'Metall' },
  { id: 'glas', label: 'Glas' },
  { id: 'sonstiges', label: 'Sonstiges' },
]

export function categoryLabel(id: string): string {
  return MATERIAL_CATEGORIES.find((c) => c.id === id)?.label ?? id
}

/** Sinnvolle Standardmaterialien (Preis pflegt der Hersteller selbst). */
export const DEFAULT_MATERIALS: { name: string; category: MaterialCategory }[] = [
  { name: 'MDF', category: 'holzwerkstoff' },
  { name: 'HDF', category: 'holzwerkstoff' },
  { name: 'Spanplatte roh', category: 'holzwerkstoff' },
  { name: 'Spanplatte beschichtet', category: 'dekorplatte' },
  { name: 'Multiplex Birke', category: 'holzwerkstoff' },
  { name: 'Multiplex Buche', category: 'holzwerkstoff' },
  { name: 'Sperrholz', category: 'holzwerkstoff' },
  { name: 'Tischlerplatte', category: 'holzwerkstoff' },
  { name: 'OSB', category: 'holzwerkstoff' },
  { name: 'Massivholz Eiche', category: 'massivholz' },
  { name: 'Massivholz Buche', category: 'massivholz' },
  { name: 'Massivholz Esche', category: 'massivholz' },
  { name: 'Massivholz Ahorn', category: 'massivholz' },
  { name: 'Massivholz Birke', category: 'massivholz' },
  { name: 'Massivholz Kiefer', category: 'massivholz' },
  { name: 'Massivholz Fichte', category: 'massivholz' },
  { name: 'Massivholz Lärche', category: 'massivholz' },
  { name: 'Massivholz Nussbaum', category: 'massivholz' },
  { name: 'Massivholz Kirschbaum', category: 'massivholz' },
  { name: 'Douglasie', category: 'massivholz' },
  { name: 'Eichenfurnier', category: 'furnier' },
  { name: 'Nussbaumfurnier', category: 'furnier' },
  { name: 'Buchenfurnier', category: 'furnier' },
  { name: 'Eschenfurnier', category: 'furnier' },
  { name: 'Ahornfurnier', category: 'furnier' },
  { name: 'Weiß matt', category: 'dekorplatte' },
  { name: 'Weiß Hochglanz', category: 'dekorplatte' },
  { name: 'Schwarz matt', category: 'dekorplatte' },
  { name: 'Anthrazit', category: 'dekorplatte' },
  { name: 'Betonoptik', category: 'dekorplatte' },
  { name: 'Marmoroptik', category: 'dekorplatte' },
  { name: 'Holzdekor Eiche', category: 'dekorplatte' },
  { name: 'Holzdekor Nussbaum', category: 'dekorplatte' },
]

/** Wandelt eine DB-Zeile in ein Material (numerische Felder absichern). */
function toMaterial(row: Record<string, unknown>): Material {
  return {
    ...(row as unknown as Material),
    price_per_m2: Number(row.price_per_m2) || 0,
  }
}

/** Lädt alle Materialien des aktuell eingeloggten Herstellers (aktive zuerst). */
export async function listMyMaterials(): Promise<Material[]> {
  const { data, error } = await supabase
    .from('manufacturer_materials')
    .select('*')
    .order('is_active', { ascending: false })
    .order('name', { ascending: true })

  if (error) throw new Error(`Materialien konnten nicht geladen werden: ${error.message}`)
  return (data ?? []).map((r) => toMaterial(r as Record<string, unknown>))
}

export async function addMaterial(input: MaterialInput): Promise<Material> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Nicht angemeldet.')

  const { data, error } = await supabase
    .from('manufacturer_materials')
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      category: input.category,
      price_per_m2: input.price_per_m2,
      description: input.description ?? null,
      is_active: input.is_active ?? true,
    })
    .select()
    .single()

  if (error) {
    if (/duplicate key|unique/i.test(error.message))
      throw new Error('Ein Material mit diesem Namen existiert bereits.')
    throw new Error(`Material konnte nicht angelegt werden: ${error.message}`)
  }
  return toMaterial(data as Record<string, unknown>)
}

export async function updateMaterial(
  id: string,
  fields: Partial<Pick<Material, 'name' | 'category' | 'price_per_m2' | 'description' | 'is_active'>>,
): Promise<Material> {
  const { data, error } = await supabase
    .from('manufacturer_materials')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Material konnte nicht gespeichert werden: ${error.message}`)
  return toMaterial(data as Record<string, unknown>)
}

export async function deleteMaterial(id: string): Promise<void> {
  const { error } = await supabase.from('manufacturer_materials').delete().eq('id', id)
  if (error) throw new Error(`Material konnte nicht gelöscht werden: ${error.message}`)
}

/**
 * Legt fehlende Standardmaterialien an (Preis 0, aktiv). Vorhandene bleiben
 * unverändert (Konflikt auf user_id+name wird ignoriert). Gibt die Anzahl der
 * angelegten Materialien zurück.
 */
export async function seedDefaultMaterials(): Promise<number> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Nicht angemeldet.')

  const existing = await listMyMaterials()
  const have = new Set(existing.map((m) => m.name.toLowerCase()))
  const missing = DEFAULT_MATERIALS.filter((d) => !have.has(d.name.toLowerCase()))
  if (missing.length === 0) return 0

  const rows = missing.map((d) => ({
    user_id: user.id,
    name: d.name,
    category: d.category,
    price_per_m2: 0,
    is_active: true,
  }))
  const { error } = await supabase
    .from('manufacturer_materials')
    .upsert(rows, { onConflict: 'user_id,name', ignoreDuplicates: true })

  if (error) throw new Error(`Standardmaterialien konnten nicht angelegt werden: ${error.message}`)
  return missing.length
}
