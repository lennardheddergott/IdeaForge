import { supabase } from '@/lib/supabase'
import type { ProductSpec } from '@/lib/ideas'

/** Status-Lebenszyklus eines Auftrags (vgl. schema.sql / Migration 0003). */
export type OrderStatus =
  | 'submitted'
  | 'assigned'
  | 'accepted'
  | 'rejected'
  | 'in_production'
  | 'completed'

/** Ein Auftrag (Tabelle public.orders). */
export interface Order {
  id: string
  customer_id: string
  manufacturer_id: string | null
  idea_id: string | null
  description: string
  concept_sheet_url: string | null
  preview_image_url: string | null
  /** Snapshot der KI-Spezifikation (Preis, Material, Maße …) zum Bestellzeitpunkt. */
  concept: ProductSpec | null
  status: OrderStatus
  created_at: string
  updated_at: string
}

/** Eingabe beim Anlegen eines Auftrags aus einer Idee. */
export interface OrderInput {
  ideaId: string | null
  description: string
  conceptSheetUrl: string | null
  previewImageUrl: string | null
  /** KI-Spezifikation der Idee – wird in den Auftrag gespiegelt. */
  concept: ProductSpec | null
}

/** Neutrale Status-Metadaten (Label + Badge-Farbe) – Hersteller-/Detailsicht. */
export const orderStatusMeta: Record<OrderStatus, { label: string; color: string }> = {
  submitted: { label: 'Neu eingereicht', color: 'bg-amber-50 text-amber-600' },
  assigned: { label: 'Zugewiesen', color: 'bg-violet-50 text-violet-600' },
  accepted: { label: 'Angenommen', color: 'bg-accent-50 text-accent-600' },
  rejected: { label: 'Abgelehnt', color: 'bg-rose-50 text-rose-600' },
  in_production: { label: 'In Produktion', color: 'bg-blue-50 text-blue-600' },
  completed: { label: 'Abgeschlossen', color: 'bg-emerald-50 text-emerald-600' },
}

/** Kundenperspektivische Kurz-Labels für Status-Badges. */
export const customerOrderBadge: Record<OrderStatus, { label: string; color: string }> = {
  submitted: { label: 'Übermittelt', color: 'bg-amber-50 text-amber-600' },
  assigned: { label: 'Vorgelegt', color: 'bg-violet-50 text-violet-600' },
  accepted: { label: 'Angenommen', color: 'bg-accent-50 text-accent-600' },
  in_production: { label: 'In Produktion', color: 'bg-blue-50 text-blue-600' },
  completed: { label: 'Abgeschlossen', color: 'bg-emerald-50 text-emerald-600' },
  rejected: { label: 'Abgelehnt', color: 'bg-rose-50 text-rose-600' },
}

/**
 * Legt einen neuen Auftrag des aktuell eingeloggten Kunden an (status 'submitted').
 * Noch ohne Hersteller-Zuordnung (manufacturer_id bleibt NULL).
 */
export async function createOrder(input: OrderInput): Promise<Order> {
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Nicht angemeldet.')

  const { data, error } = await supabase
    .from('orders')
    .insert({
      customer_id: user.id,
      idea_id: input.ideaId,
      description: input.description,
      concept_sheet_url: input.conceptSheetUrl,
      preview_image_url: input.previewImageUrl,
      concept: input.concept,
      status: 'submitted',
    })
    .select()
    .single()

  if (error) throw new Error(`Auftrag konnte nicht angelegt werden: ${error.message}`)
  return data as Order
}

/** Lädt alle Aufträge des aktuell eingeloggten Kunden (neueste zuerst). */
export async function listMyOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select()
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Aufträge konnten nicht geladen werden: ${error.message}`)
  return (data ?? []) as Order[]
}

/**
 * Lädt die für den Hersteller sichtbaren Aufträge: ihm zugewiesene Aufträge
 * sowie den offenen "submitted"-Pool (RLS regelt die Sichtbarkeit).
 */
export async function listManufacturerOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select()
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Aufträge konnten nicht geladen werden: ${error.message}`)
  return (data ?? []) as Order[]
}

/** Aktualisiert den Status eines Auftrags (Hersteller- oder Kundensicht; RLS schützt). */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Status konnte nicht geändert werden: ${error.message}`)
  return data as Order
}

/**
 * Weist dem aktuell eingeloggten Hersteller einen offenen Pool-Auftrag zu und
 * nimmt ihn direkt an (manufacturer_id = eigenes Profil, status 'accepted').
 *
 * Die Bedingungen `manufacturer_id is null` und `status = 'submitted'` machen
 * die Annahme atomar: greifen zwei Hersteller gleichzeitig, gewinnt nur der
 * Erste – beim Zweiten trifft das UPDATE keine Zeile mehr (Postgres prüft die
 * WHERE-Bedingung nach dem Commit des Ersten erneut). Dann werfen wir einen
 * klaren Fehler, statt eine bereits vergebene Zuordnung zu überschreiben.
 */
export async function claimOrder(
  id: string,
  manufacturerProfileId: string,
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update({ manufacturer_id: manufacturerProfileId, status: 'accepted' })
    .eq('id', id)
    .is('manufacturer_id', null)
    .eq('status', 'submitted')
    .select()
    .maybeSingle()

  if (error) throw new Error(`Auftrag konnte nicht angenommen werden: ${error.message}`)
  if (!data) throw new Error('Dieser Auftrag wurde bereits vergeben.')
  return data as Order
}

/**
 * Lädt den (neuesten) Auftrag zu einer Idee des aktuell eingeloggten Kunden.
 * Gibt null zurück, wenn zu dieser Idee noch kein Auftrag existiert.
 */
export async function getOrderByIdea(ideaId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select()
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Auftrag konnte nicht geladen werden: ${error.message}`)
  return (data as Order | null) ?? null
}

/**
 * Lädt einen einzelnen Auftrag per id (für die Detailseiten).
 * RLS regelt den Zugriff: Kunde nur eigene, Hersteller offene + zugewiesene.
 */
export async function getOrder(id: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select()
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(`Auftrag konnte nicht geladen werden: ${error.message}`)
  return (data as Order | null) ?? null
}

/** Kundenseitiger Statustext für einen Auftrag (Result-Seite / Dashboard). */
export function customerOrderStatus(status: OrderStatus): {
  title: string
  hint: string
} {
  switch (status) {
    case 'submitted':
      return {
        title: 'Dein Auftrag wurde übermittelt.',
        hint: 'Wir suchen jetzt einen passenden Hersteller für dich.',
      }
    case 'assigned':
      return {
        title: 'Dein Auftrag wurde einem Hersteller vorgelegt.',
        hint: 'Wir warten auf die Bestätigung.',
      }
    case 'accepted':
      return {
        title: 'Dein Auftrag wurde von einem Hersteller angenommen.',
        hint: 'Der Hersteller bereitet die Fertigung vor.',
      }
    case 'in_production':
      return {
        title: 'Dein Auftrag ist in Produktion.',
        hint: 'Dein Möbelstück wird gefertigt.',
      }
    case 'completed':
      return {
        title: 'Dein Auftrag wurde abgeschlossen.',
        hint: 'Die Fertigung ist abgeschlossen.',
      }
    case 'rejected':
      return {
        title: 'Dein Auftrag wurde abgelehnt.',
        hint: 'Wir suchen einen anderen Hersteller für dich.',
      }
  }
}
