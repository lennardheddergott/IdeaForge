// ============================================================================
// Projekt-Sicht (View-Model) für das Kunden-Dashboard
// ============================================================================
// In Forma IST eine generierte Idee das "Projekt": Titel, Kategorie, Maße,
// Material, Bild, Konzeptblatt und Preis liegen in `ideas` / `ideas.concept`.
// Eine `order` ist die "Herstelleranfrage". Dieses Modul fügt beide zu einer
// nutzerfreundlichen Projekt-Ansicht mit kombiniertem Status zusammen –
// ausschließlich aus echten Supabase-Daten.
// ============================================================================

import { listIdeas, type Idea } from '@/lib/ideas'
import { listMyOrders, type Order } from '@/lib/orders'
import { buildVariants } from '@/lib/variants'
import {
  estimateProduct,
  loadManufacturerOffers,
  type ManufacturerOffer,
} from '@/lib/estimate'
import { categories } from '@/data/options'

export interface ProjectStatus {
  key: string
  label: string
  /** Tailwind-Klassen für das Status-Badge. */
  color: string
}

/** Zusammengeführte Projekt-Ansicht (Idee + optionale Herstelleranfrage). */
export interface Project {
  id: string // = idea.id (Route /result/:id)
  title: string
  category: string
  description: string
  price: { min: number; max: number } | null
  status: ProjectStatus
  createdAt: string
  previewUrl: string | null
  conceptSheetUrl: string | null
  /** true, sobald eine Herstelleranfrage (order) existiert. */
  hasRequest: boolean
  orderId: string | null
}

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.label]),
)

/** Kombinierter Anzeige-Status aus Idee- und (optionalem) Auftragsstatus. */
function statusFor(idea: Idea, order: Order | null): ProjectStatus {
  if (order) {
    switch (order.status) {
      case 'submitted':
        return { key: 'matching', label: 'Hersteller-Matching', color: 'bg-amber-50 text-amber-600' }
      case 'assigned':
        return { key: 'assigned', label: 'Vorgelegt', color: 'bg-violet-50 text-violet-600' }
      case 'accepted':
        return { key: 'accepted', label: 'Angenommen', color: 'bg-accent-50 text-accent-600' }
      case 'in_production':
        return { key: 'in_production', label: 'In Produktion', color: 'bg-blue-50 text-blue-600' }
      case 'completed':
        return { key: 'completed', label: 'Abgeschlossen', color: 'bg-emerald-50 text-emerald-600' }
      case 'rejected':
        return { key: 'rejected', label: 'Abgelehnt', color: 'bg-rose-50 text-rose-600' }
    }
  }
  switch (idea.status) {
    case 'pending':
      return { key: 'pending', label: 'Wird erstellt …', color: 'bg-amber-50 text-amber-600' }
    case 'generated':
      return { key: 'design', label: 'Design erstellt', color: 'bg-accent-50 text-accent-600' }
    case 'failed':
      return { key: 'failed', label: 'Fehlgeschlagen', color: 'bg-rose-50 text-rose-600' }
    default:
      return { key: 'draft', label: 'Entwurf', color: 'bg-ink-100 text-ink-600' }
  }
}

/** Baut aus einer Idee (+ optionaler Order) die Projekt-Ansicht. */
export function toProject(
  idea: Idea,
  order: Order | null,
  offers: ManufacturerOffer[],
): Project {
  const spec = idea.concept
  const category =
    spec?.kategorie ??
    (idea.category ? CATEGORY_LABELS[idea.category] ?? idea.category : 'Möbel')
  return {
    id: idea.id,
    title: spec?.titel ?? idea.prompt.slice(0, 60),
    category,
    description: spec?.kurzbeschreibung || idea.prompt,
    // Preisspanne AUSSCHLIESSLICH aus der echten Herstellerkalkulation.
    price: spec ? estimateProduct(spec, buildVariants(spec), offers) : null,
    status: statusFor(idea, order),
    createdAt: idea.created_at,
    previewUrl: idea.preview_image_url ?? idea.image_url,
    conceptSheetUrl: idea.concept_sheet_url ?? idea.image_url,
    hasRequest: Boolean(order),
    orderId: order?.id ?? null,
  }
}

/**
 * Lädt die echten Projekte des aktuell eingeloggten Kunden (Ideen + Aufträge).
 * Themenfremde (rejected) und leere Entwürfe (draft) werden ausgeblendet.
 */
export async function listMyProjects(): Promise<Project[]> {
  const [ideas, orders, offers] = await Promise.all([
    listIdeas(),
    listMyOrders(),
    loadManufacturerOffers(),
  ])

  // Neueste Order je Idee (listMyOrders liefert neueste zuerst).
  const orderByIdea = new Map<string, Order>()
  for (const o of orders) {
    if (o.idea_id && !orderByIdea.has(o.idea_id)) orderByIdea.set(o.idea_id, o)
  }

  return ideas
    .filter((i) => i.status !== 'rejected' && i.status !== 'draft')
    .map((i) => toProject(i, orderByIdea.get(i.id) ?? null, offers))
}
