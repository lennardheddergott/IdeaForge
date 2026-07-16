// ============================================================================
// Preis-Brücke: EINE Preislogik für Kunde UND Hersteller
// ============================================================================
// Der Kunde bekommt KEINE unabhängige Schätzung mehr. Stattdessen wird die
// Kundenansicht direkt aus der ECHTEN Herstellerkalkulation gebildet – über
// dieselbe Engine (src/lib/pricing.ts), dieselben Materialkosten, Fertigungs-
// parameter und Aufschläge, die auch der Hersteller in seiner Auftragsansicht
// sieht. Der Hersteller kommt daher auf eine nahezu identische Zahl (die
// Kundenspanne ist um genau diese Zahl zentriert).
//
// Multi-Hersteller-Architektur (heute 1 Hersteller, später beliebig viele):
//   - loadManufacturerOffers() lädt ALLE kalkulationsfähigen Hersteller.
//   - estimateVariant() rechnet jede Variante bei JEDEM Hersteller und bildet
//     daraus eine Preisspanne:
//       • 1 Hersteller  → dessen exakter Preis ± kleine Spanne
//       • N Hersteller → min…max über alle Herstellerkalkulationen
//   Die Logik muss dafür NICHT umgebaut werden – nur die Datenmenge wächst.
// ============================================================================

import { supabase } from '@/lib/supabase'
import type { ProductSpec } from '@/lib/ideas'
import type { Variant } from '@/lib/variants'
import {
  computeVariantPrice,
  type ManufacturerPricing,
  type PricingMaterial,
} from '@/lib/pricing'

/** Ein kalkulationsfähiges Herstellerangebot (Preisparameter + aktive Materialien). */
export interface ManufacturerOffer {
  userId: string
  pricing: ManufacturerPricing
  materials: PricingMaterial[]
}

/** Preisspanne der Kundenansicht (gerundet, EUR). */
export interface PriceRange {
  min: number
  max: number
  /** Anzahl Hersteller, die diese Variante kalkulieren konnten. */
  manufacturerCount: number
}

// Spanne um einen einzelnen Herstellerpreis (±), damit auch bei genau einem
// Hersteller eine realistische „von–bis"-Spanne entsteht. Der Hersteller sieht
// exakt die Mitte dieser Spanne.
const SINGLE_BAND = 0.07

const round10 = (n: number) => Math.round(n / 10) * 10

/**
 * Lädt ALLE kalkulationsfähigen Herstellerangebote (Preisparameter + aktive
 * Materialien). Erfordert Lesezugriff auf manufacturer_pricing/-materials für
 * eingeloggte Nutzer (siehe Migration 0010). Schlägt der Zugriff fehl, wird ein
 * leeres Array zurückgegeben – die Oberfläche zeigt dann „Preis auf Anfrage",
 * statt eine erfundene Schätzung anzuzeigen.
 */
export async function loadManufacturerOffers(): Promise<ManufacturerOffer[]> {
  const [pricingRes, materialRes] = await Promise.all([
    supabase
      .from('manufacturer_pricing')
      .select(
        'user_id, hourly_rate, margin_percent, minimum_order_value, delivery_fee, assembly_fee, surface_treatment_price_per_m2, door_price, drawer_price, standard_hardware_price, premium_hardware_price',
      ),
    supabase
      .from('manufacturer_materials')
      .select('user_id, name, category, price_per_m2, is_active')
      .eq('is_active', true),
  ])

  if (pricingRes.error || materialRes.error) return []

  const materialsByUser = new Map<string, PricingMaterial[]>()
  for (const row of materialRes.data ?? []) {
    const list = materialsByUser.get(row.user_id) ?? []
    list.push({
      name: row.name,
      category: row.category,
      price_per_m2: Number(row.price_per_m2) || 0,
      is_active: row.is_active,
    })
    materialsByUser.set(row.user_id, list)
  }

  const offers: ManufacturerOffer[] = []
  for (const p of pricingRes.data ?? []) {
    const pricing: ManufacturerPricing = {
      hourly_rate: Number(p.hourly_rate) || 0,
      margin_percent: Number(p.margin_percent) || 0,
      minimum_order_value: Number(p.minimum_order_value) || 0,
      delivery_fee: Number(p.delivery_fee) || 0,
      assembly_fee: Number(p.assembly_fee) || 0,
      surface_treatment_price_per_m2: Number(p.surface_treatment_price_per_m2) || 0,
      door_price: Number(p.door_price) || 0,
      drawer_price: Number(p.drawer_price) || 0,
      standard_hardware_price: Number(p.standard_hardware_price) || 0,
      premium_hardware_price: Number(p.premium_hardware_price) || 0,
    }
    // Ohne Stundenlohn/Marge lässt sich kein Preis berechnen → überspringen.
    if (pricing.hourly_rate <= 0 || pricing.margin_percent <= 0) continue
    offers.push({
      userId: p.user_id,
      pricing,
      materials: materialsByUser.get(p.user_id) ?? [],
    })
  }
  return offers
}

/** Bildet aus einer Menge Herstellerpreise die Kundenspanne. */
function toRange(prices: number[]): PriceRange | null {
  if (prices.length === 0) return null
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  if (lo === hi) {
    // Genau ein (identischer) Preis → symmetrische Spanne um diesen Wert.
    return {
      min: round10(lo * (1 - SINGLE_BAND)),
      max: round10(hi * (1 + SINGLE_BAND)),
      manufacturerCount: prices.length,
    }
  }
  return { min: round10(lo), max: round10(hi), manufacturerCount: prices.length }
}

/**
 * Preisspanne EINER Variante aus allen Herstellerkalkulationen.
 * Gibt null zurück, wenn kein Hersteller diese Variante kalkulieren kann
 * (z. B. weil das benötigte Material nirgends aktiv gepflegt ist).
 */
export function estimateVariant(
  spec: ProductSpec,
  variant: Variant,
  offers: ManufacturerOffer[],
): PriceRange | null {
  const prices: number[] = []
  for (const o of offers) {
    const computed = computeVariantPrice(spec, variant, o.pricing, o.materials)
    if (computed) prices.push(computed.price)
  }
  return toRange(prices)
}

/**
 * Gesamt-Preisspanne eines Produkts über mehrere Varianten hinweg
 * (untere Grenze der günstigsten … obere Grenze der teuersten Variante).
 * Für Listen-/Übersichtsansichten (Dashboard, Profil).
 */
export function estimateProduct(
  spec: ProductSpec,
  variants: Variant[],
  offers: ManufacturerOffer[],
): PriceRange | null {
  const ranges = variants
    .map((v) => estimateVariant(spec, v, offers))
    .filter((r): r is PriceRange => r !== null)
  if (ranges.length === 0) return null
  return {
    min: Math.min(...ranges.map((r) => r.min)),
    max: Math.max(...ranges.map((r) => r.max)),
    manufacturerCount: Math.max(...ranges.map((r) => r.manufacturerCount)),
  }
}

/** Formatiert eine Spanne als „980–1.120 €". */
export function formatRange(range: PriceRange): string {
  const nf = new Intl.NumberFormat('de-DE')
  return `${nf.format(range.min)}–${nf.format(range.max)} €`
}
