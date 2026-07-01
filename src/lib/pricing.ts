// ============================================================================
// Pricing-Engine (rein & deterministisch) — Roadmap 8
// ============================================================================
// Berechnet den Preis EINES Herstellers für EINE Variante regelbasiert aus
// seinen Preisparametern (Stundenlohn, Marge, Material €/m², Beschläge,
// Türen/Schubladen, Oberfläche, Lieferung/Montage, Mindestauftragswert).
// Preise werden NICHT von der KI erfunden. Bewusst konservativ kalkuliert.
//
// Self-contained (nur Typ-Importe): dadurch ohne Alias-/Netz-Abhängigkeiten
// mit Node type-stripping testbar.
// ============================================================================

import type { ProductSpec } from '@/lib/ideas'
import type { Variant } from '@/lib/variants'

/** Preisparameter eines Herstellers (Tabelle manufacturer_pricing). */
export interface ManufacturerPricing {
  hourly_rate: number
  margin_percent: number
  minimum_order_value: number
  delivery_fee: number
  assembly_fee: number
  surface_treatment_price_per_m2: number
  door_price: number
  drawer_price: number
  standard_hardware_price: number
  premium_hardware_price: number
}

/** Minimal-Sicht eines Materials für die Preisberechnung. */
export interface PricingMaterial {
  name?: string
  category: string
  price_per_m2: number
  is_active: boolean
}

/**
 * Wandelt einen Materialnamen in einen eindeutigen, stabilen Schlüssel um.
 * MUSS identisch zu src/lib/variants.ts → normalizeMaterialKey sein.
 * (Bewusst dupliziert, damit pricing.ts ohne Laufzeit-Importe testbar bleibt.)
 */
export function normalizeMaterialKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/**
 * Sucht EXAKT das Material der Variante im Herstellerprofil – anhand des
 * eindeutigen Material-Schlüssels (variant.material_type). KEIN Kategorie-,
 * KEIN Günstigster-, KEIN Ersatz-Fallback. Gibt nur zurück, wenn das Material
 * existiert, aktiv ist UND einen Preis > 0 hat; sonst null.
 */
export function resolveMaterialForVariant(
  variant: Variant,
  materials: PricingMaterial[],
): PricingMaterial | null {
  const wanted = variant.material_type
  const match = materials.find(
    (m) => normalizeMaterialKey(m.name ?? '') === wanted,
  )

  // Debug-Ausgabe (nur in der Entwicklung).
  if (import.meta.env?.DEV) {
    console.log(
      '[pricing] Variante:', variant.tier,
      '| Material laut Variante:', variant.material,
      '| Schlüssel:', wanted,
    )
    if (!match) {
      console.warn('[pricing] Material nicht gefunden im Herstellerprofil:', wanted)
    } else {
      console.log(
        '[pricing] Gefundenes Material:', match.name,
        '| aktiv:', match.is_active, '| Preis:', match.price_per_m2,
      )
    }
  }

  if (!match || !match.is_active || match.price_per_m2 <= 0) return null
  return match
}

export interface PriceBreakdown {
  material: number
  labor: number
  features: number
  surface: number
  deliveryAssembly: number
  margin: number
}

export interface ComputedPrice {
  price: number
  breakdown: PriceBreakdown
}

// Grobe Standardmaße je Produktart (cm), falls Maße fehlen.
const DEFAULT_DIMS: Record<string, { l: number; h: number; d: number }> = {
  'tv-board': { l: 200, h: 45, d: 40 },
  sideboard: { l: 160, h: 80, d: 45 },
  kommode: { l: 100, h: 85, d: 45 },
  esstisch: { l: 180, h: 75, d: 90 },
  tisch: { l: 160, h: 75, d: 80 },
  schreibtisch: { l: 140, h: 75, d: 70 },
  schrank: { l: 150, h: 200, d: 60 },
  regal: { l: 80, h: 180, d: 30 },
  nachttisch: { l: 45, h: 50, d: 40 },
  bett: { l: 210, h: 40, d: 160 },
  default: { l: 120, h: 80, d: 45 },
}

const BASE_LABOR_HOURS: Record<string, number> = {
  'tv-board': 8,
  sideboard: 10,
  kommode: 10,
  esstisch: 9,
  tisch: 8,
  schreibtisch: 7,
  schrank: 16,
  regal: 6,
  nachttisch: 4,
  bett: 9,
  default: 8,
}

const COMPLEXITY_FACTOR: Record<ProductSpec['komplexitaet'], number> = {
  niedrig: 0.8,
  mittel: 1.0,
  hoch: 1.35,
}

const TIER_LABOR: Record<Variant['tier'], number> = {
  budget: 0.85,
  standard: 1.0,
  premium: 1.25,
}

const round10 = (n: number) => Math.round(n / 10) * 10
const round2 = (n: number) => Math.round(n * 100) / 100

function productKey(spec: ProductSpec): string {
  const t = `${spec.produktart ?? ''} ${spec.kategorie ?? ''} ${spec.titel ?? ''}`.toLowerCase()
  for (const key of Object.keys(DEFAULT_DIMS)) {
    if (key !== 'default' && t.includes(key)) return key
  }
  if (/tisch|desk|table/.test(t)) return 'tisch'
  return 'default'
}

/** Grobe, konservative Materialflächen-Schätzung in m². */
export function estimateAreaM2(spec: ProductSpec): number {
  const def = DEFAULT_DIMS[productKey(spec)] ?? DEFAULT_DIMS.default
  const l = spec.masse?.breite_cm ?? def.l
  const h = spec.masse?.hoehe_cm ?? def.h
  const d = spec.masse?.tiefe_cm ?? def.d
  const isTable = /tisch|desk|table/.test(productKey(spec))
  let cm2: number
  if (isTable) {
    cm2 = l * d * 1.6
  } else {
    cm2 = 2 * l * h + 2 * h * d + 2 * l * d
    const shelves = Math.max(0, Math.floor(h / 40) - 1)
    cm2 += shelves * l * d
  }
  return cm2 / 10000
}

const round1 = (n: number) => Math.round(n * 10) / 10

/* ─────────── Detaillierte, nachvollziehbare Kalkulation ─────────── */

export interface CalcMaterialLine {
  name: string
  area: number
  pricePerM2: number
  total: number
}
export interface CalcLaborStep {
  label: string
  hours: number
}
export interface CalcHardwareLine {
  label: string
  unitPrice: number
  qty: number
  total: number
}

/** Vollständige, transparente Kalkulation einer Variante. */
export interface Calculation {
  material: {
    lines: CalcMaterialLine[]
    area: number
    total: number
    /** Material laut KI-Variante (Anzeigename). */
    variantMaterial: string
    /** Material aus dem Herstellerprofil (identisch, per Schlüssel gematcht). */
    profileMaterial: string
    /** true, wenn Variantenmaterial und Profilmaterial übereinstimmen. */
    identical: boolean
  }
  labor: {
    steps: CalcLaborStep[] // KI-Schätzung
    totalHours: number
    hourlyRate: number
    total: number
  }
  surface: {
    applies: boolean
    label: string
    pricePerM2: number
    area: number
    total: number
  }
  hardware: { lines: CalcHardwareLine[]; total: number }
  delivery: { total: number }
  assembly: { selected: boolean; total: number }
  subtotal: number
  margin: { percent: number; total: number }
  minimumApplied: boolean
  price: number
}

// KI-geschätzte Aufteilung der Gesamt-Arbeitszeit auf Arbeitsschritte.
const LABOR_STEPS: { label: string; share: number }[] = [
  { label: 'Zuschnitt', share: 0.18 },
  { label: 'Verleimen', share: 0.22 },
  { label: 'Schleifen', share: 0.15 },
  { label: 'Oberflächenbearbeitung', share: 0.15 },
  { label: 'Montage', share: 0.2 },
  { label: 'Endkontrolle', share: 0.1 },
]

/**
 * Vollständige Kalkulation mit allen Zwischenschritten (für die transparente
 * Herstelleransicht). Gibt null zurück, wenn kein passendes aktives Material
 * der benötigten Kategorie gepflegt ist.
 */
export function computeCalculation(
  spec: ProductSpec,
  variant: Variant,
  p: ManufacturerPricing,
  materials: PricingMaterial[],
): Calculation | null {
  const mat = resolveMaterialForVariant(variant, materials)
  if (!mat) return null

  const area = round2(estimateAreaM2(spec))

  // Material (aktuell ein Material je Variante; Struktur erlaubt mehrere).
  const materialLines: CalcMaterialLine[] = [
    {
      name: mat.name ?? 'Material',
      area,
      pricePerM2: mat.price_per_m2,
      total: round2(area * mat.price_per_m2),
    },
  ]
  const materialTotal = materialLines.reduce((s, l) => s + l.total, 0)

  // Arbeitszeit (KI-Schätzung) + Aufteilung auf Arbeitsschritte.
  const baseHours = BASE_LABOR_HOURS[productKey(spec)] ?? BASE_LABOR_HOURS.default
  const totalHours = round1(
    baseHours * COMPLEXITY_FACTOR[spec.komplexitaet] * TIER_LABOR[variant.tier],
  )
  const steps = LABOR_STEPS.map((s) => ({
    label: s.label,
    hours: round1(totalHours * s.share),
  }))
  const laborTotal = round2(totalHours * p.hourly_rate)

  // Oberfläche (Budget: keine Behandlung).
  const surfaceApplies = variant.tier !== 'budget'
  const surfaceTotal = surfaceApplies ? round2(area * p.surface_treatment_price_per_m2) : 0

  // Beschläge & Elemente.
  const usesPremiumHw = variant.tier !== 'budget'
  const hwLines: CalcHardwareLine[] = [
    {
      label: variant.hardware,
      unitPrice: usesPremiumHw ? p.premium_hardware_price : p.standard_hardware_price,
      qty: 1,
      total: usesPremiumHw ? p.premium_hardware_price : p.standard_hardware_price,
    },
  ]
  const doors = spec.anzahl_tueren ?? 0
  if (doors > 0)
    hwLines.push({ label: 'Türen', unitPrice: p.door_price, qty: doors, total: doors * p.door_price })
  const drawers = spec.anzahl_schubladen ?? 0
  if (drawers > 0)
    hwLines.push({
      label: 'Schubladen',
      unitPrice: p.drawer_price,
      qty: drawers,
      total: drawers * p.drawer_price,
    })
  const hardwareTotal = hwLines.reduce((s, l) => s + l.total, 0)

  const deliveryTotal = p.delivery_fee
  const assemblySelected = p.assembly_fee > 0
  const assemblyTotal = p.assembly_fee

  const subtotal =
    materialTotal + laborTotal + surfaceTotal + hardwareTotal + deliveryTotal + assemblyTotal
  const marginTotal = subtotal * (p.margin_percent / 100)
  const rawTotal = subtotal + marginTotal
  const minimumApplied = rawTotal < (p.minimum_order_value || 0)
  const price = round10(Math.max(rawTotal, p.minimum_order_value || 0))

  const profileMaterial = mat.name ?? ''
  return {
    material: {
      lines: materialLines,
      area,
      total: round2(materialTotal),
      variantMaterial: variant.material,
      profileMaterial,
      identical: normalizeMaterialKey(profileMaterial) === variant.material_type,
    },
    labor: { steps, totalHours, hourlyRate: p.hourly_rate, total: laborTotal },
    surface: {
      applies: surfaceApplies,
      label: variant.surface,
      pricePerM2: p.surface_treatment_price_per_m2,
      area,
      total: surfaceTotal,
    },
    hardware: { lines: hwLines, total: round2(hardwareTotal) },
    delivery: { total: deliveryTotal },
    assembly: { selected: assemblySelected, total: assemblyTotal },
    subtotal: round2(subtotal),
    margin: { percent: p.margin_percent, total: round2(marginTotal) },
    minimumApplied,
    price,
  }
}

/**
 * Kompakte Preis-/Blocksumme (nutzt dieselbe Kalkulation als einzige Quelle).
 * Gibt null zurück, wenn kein passendes aktives Material gepflegt ist.
 */
export function computeVariantPrice(
  spec: ProductSpec,
  variant: Variant,
  p: ManufacturerPricing,
  materials: PricingMaterial[],
): ComputedPrice | null {
  const c = computeCalculation(spec, variant, p, materials)
  if (!c) return null
  return {
    price: c.price,
    breakdown: {
      material: c.material.total,
      labor: c.labor.total,
      features: c.hardware.total,
      surface: c.surface.total,
      deliveryAssembly: round2(c.delivery.total + c.assembly.total),
      margin: c.margin.total,
    },
  }
}
