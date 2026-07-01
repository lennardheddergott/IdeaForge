// ============================================================================
// Phase 2: Ableitung der drei Umsetzungsvarianten (rein & deterministisch)
// ============================================================================
// Aus der strukturierten KI-Analyse (ProductSpec) werden IMMER drei realistische
// Umsetzungsvarianten desselben Möbels abgeleitet: Preisbewusst / Standard /
// Premium. Preise sind bewusst NOCH KEINE echten Herstellerpreise, sondern
// konservative ORIENTIERUNGSpreise (klar gekennzeichnet). Die echte
// Preisberechnung aus Herstellerprofilen kommt in einer späteren Phase.
// ============================================================================

import type { ProductSpec } from '@/lib/ideas'

export type VariantTier = 'budget' | 'standard' | 'premium'

export interface Variant {
  tier: VariantTier
  title: string
  description: string
  /** Material-Schlüssel für Pricing/Matching (z. B. 'mdf', 'massivholz_eiche'). */
  material_type: string
  material: string
  surface: string
  hardware: string
  construction: string
  benefits: string[]
  limitations: string[]
  /** Orientierungspreise (keine echten Herstellerpreise). */
  priceFrom: number
  priceMin: number
  priceMax: number
  leadTimeWeeks: [number, number]
  /** Hervorgehoben anhand der Preis-Absicht des Nutzers. */
  recommended: boolean
  priceSource: 'fallback'
}

// Grobe Standardmaße je Produktart (cm), falls Maße fehlen (Fallback).
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

// Konservative Orientierungs-Materialkosten je m² und Tier.
const PER_M2: Record<VariantTier, number> = { budget: 340, standard: 640, premium: 1180 }
const LEAD: Record<VariantTier, [number, number]> = {
  budget: [3, 4],
  standard: [4, 5],
  premium: [6, 7],
}

const round10 = (n: number) => Math.round(n / 10) * 10

function productKey(spec: ProductSpec): string {
  const t = `${spec.produktart ?? ''} ${spec.kategorie ?? ''} ${spec.titel ?? ''}`.toLowerCase()
  for (const key of Object.keys(DEFAULT_DIMS)) {
    if (key !== 'default' && t.includes(key)) return key
  }
  if (/tisch|desk|table/.test(t)) return 'tisch'
  return 'default'
}

/** Grobe Materialflächen-Schätzung in m² (konservativ). */
function estimateAreaM2(spec: ProductSpec): number {
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

function priceFor(spec: ProductSpec, tier: VariantTier) {
  const area = estimateAreaM2(spec)
  const doors = spec.anzahl_tueren ?? 0
  const drawers = spec.anzahl_schubladen ?? 0
  const base = area * PER_M2[tier] + doors * 80 + drawers * 60
  const min = round10(base * 0.85)
  const max = round10(base * 1.3)
  return { priceFrom: min, priceMin: min, priceMax: max }
}

/**
 * Wandelt einen Materialnamen in einen eindeutigen, stabilen Schlüssel um.
 * "Massivholz Nussbaum" → "massivholz_nussbaum", "Weiß Hochglanz" → "weiss_hochglanz".
 * WICHTIG: identische Implementierung in src/lib/pricing.ts (Matching-Schlüssel).
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

// Holzart-Registry: liefert je Art die konkreten Materialnamen der drei Tiers.
interface SpeciesDef {
  label: string
  massiv: string
  furnier: string | null
  dekor: string | null
}
const SPECIES: Record<string, SpeciesDef> = {
  eiche: { label: 'Eiche', massiv: 'Massivholz Eiche', furnier: 'Eichenfurnier', dekor: 'Holzdekor Eiche' },
  nussbaum: { label: 'Nussbaum', massiv: 'Massivholz Nussbaum', furnier: 'Nussbaumfurnier', dekor: 'Holzdekor Nussbaum' },
  buche: { label: 'Buche', massiv: 'Massivholz Buche', furnier: 'Buchenfurnier', dekor: null },
  esche: { label: 'Esche', massiv: 'Massivholz Esche', furnier: 'Eschenfurnier', dekor: null },
  ahorn: { label: 'Ahorn', massiv: 'Massivholz Ahorn', furnier: 'Ahornfurnier', dekor: null },
  birke: { label: 'Birke', massiv: 'Massivholz Birke', furnier: null, dekor: null },
  kiefer: { label: 'Kiefer', massiv: 'Massivholz Kiefer', furnier: null, dekor: null },
  fichte: { label: 'Fichte', massiv: 'Massivholz Fichte', furnier: null, dekor: null },
  laerche: { label: 'Lärche', massiv: 'Massivholz Lärche', furnier: null, dekor: null },
  kirschbaum: { label: 'Kirschbaum', massiv: 'Massivholz Kirschbaum', furnier: null, dekor: null },
  douglasie: { label: 'Douglasie', massiv: 'Douglasie', furnier: null, dekor: null },
}
// Erkennungs-Stichwörter → Holzart (spezifische zuerst).
const SPECIES_KEYWORDS: [string, string][] = [
  ['nussbaum', 'nussbaum'],
  ['walnuss', 'nussbaum'],
  ['kirschbaum', 'kirschbaum'],
  ['kirsche', 'kirschbaum'],
  ['douglasie', 'douglasie'],
  ['lärche', 'laerche'],
  ['laerche', 'laerche'],
  ['eiche', 'eiche'],
  ['buche', 'buche'],
  ['esche', 'esche'],
  ['ahorn', 'ahorn'],
  ['birke', 'birke'],
  ['kiefer', 'kiefer'],
  ['fichte', 'fichte'],
]

/**
 * Ermittelt die Holzart aus der strukturierten Analyse (bevorzugt spec.holzart)
 * bzw. deterministisch aus den Textfeldern der Spec. Default: Eiche.
 * (Das Ergebnis fließt in einen EINDEUTIGEN Material-Schlüssel – die
 * Preisberechnung selbst nutzt danach ausschließlich diesen Schlüssel.)
 */
export function detectSpecies(spec: ProductSpec): string {
  const h = (spec.holzart ?? '').toLowerCase().trim()
  if (h && SPECIES[h]) return h
  const hay = [
    spec.titel,
    spec.kurzbeschreibung,
    spec.produktart,
    ...(spec.materialien ?? []).map((m) => m.material),
    ...(spec.farben ?? []),
  ]
    .join(' ')
    .toLowerCase()
  for (const [kw, sp] of SPECIES_KEYWORDS) if (hay.includes(kw)) return sp
  return 'eiche'
}

/**
 * Baut die drei Umsetzungsvarianten. Jede Variante trägt ein EINDEUTIGES,
 * strukturiertes Material (Schlüssel), das exakt der erkannten Holzart
 * entspricht (z. B. Nussbaum → Massivholz Nussbaum). Die Preisberechnung nutzt
 * ausschließlich diesen Schlüssel – niemals ein Ersatzmaterial.
 */
export function buildVariants(spec: ProductSpec): Variant[] {
  const mustReal = spec.material_muss_echt ?? false
  const intent = spec.preis_absicht ?? 'flexible'
  const sp = SPECIES[detectSpecies(spec)] ?? SPECIES.eiche

  const budgetName = sp.dekor ?? 'Spanplatte beschichtet'
  const standardName = sp.furnier ?? 'Eichenfurnier'
  const premiumName = sp.massiv

  const budget: Variant = {
    tier: 'budget',
    title: 'Preisbewusst',
    description:
      'Solide Umsetzung in Holzoptik – gutes Ergebnis zum niedrigsten realistischen Preis.',
    material_type: normalizeMaterialKey(budgetName),
    material: budgetName,
    surface: 'Dekoroberfläche',
    hardware: 'Standardbeschläge',
    construction: 'Einfache, saubere Konstruktion',
    benefits: ['Günstigster Preis', 'Kurze Lieferzeit', 'Optik nah am Wunschmaterial'],
    limitations: [
      mustReal ? `${sp.label}-Optik statt Massivholz` : 'Dekoroptik statt Echtholz',
    ],
    ...priceFor(spec, 'budget'),
    leadTimeWeeks: LEAD.budget,
    recommended: intent === 'budget',
    priceSource: 'fallback',
  }

  const standard: Variant = {
    tier: 'standard',
    title: 'Standard',
    description:
      'Hochwertigere Verarbeitung mit Echtholzfurnier und besseren Beschlägen – gutes Preis-Leistungs-Verhältnis.',
    material_type: normalizeMaterialKey(standardName),
    material: standardName,
    surface: 'Lackierte Oberfläche',
    hardware: 'Hochwertige Beschläge',
    construction: 'Sorgfältige Verarbeitung',
    benefits: ['Echtholzoberfläche', 'Bessere Beschläge', 'Ausgewogenes Preis-Leistungs-Verhältnis'],
    limitations: [mustReal ? 'Furnier statt durchgehendem Massivholz' : 'Kein Massivholz'],
    ...priceFor(spec, 'standard'),
    leadTimeWeeks: LEAD.standard,
    recommended: intent === 'flexible',
    priceSource: 'fallback',
  }

  const premium: Variant = {
    tier: 'premium',
    title: 'Premium',
    description: `Massivholz (${sp.label}), Premium-Beschläge und handwerklich hochwertige Fertigung.`,
    material_type: normalizeMaterialKey(premiumName),
    material: premiumName,
    surface: 'Geölt/gewachst',
    hardware: 'Premium-Beschläge',
    construction: 'Massivholzkonstruktion',
    benefits: ['Echtes Massivholz', 'Höchste Langlebigkeit', 'Premium-Beschläge & Oberfläche'],
    limitations: ['Höchster Preis', 'Etwas längere Lieferzeit'],
    ...priceFor(spec, 'premium'),
    leadTimeWeeks: LEAD.premium,
    recommended: intent === 'premium',
    priceSource: 'fallback',
  }

  return [budget, standard, premium]
}
