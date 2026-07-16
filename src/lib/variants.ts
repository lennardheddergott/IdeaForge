// ============================================================================
// Ableitung der drei Umsetzungsvarianten (rein & deterministisch)
// ============================================================================
// Aus der strukturierten KI-Analyse (ProductSpec) werden IMMER drei realistische
// Umsetzungsvarianten desselben Möbels abgeleitet: Preisbewusst / Standard /
// Premium. Diese Datei beschreibt NUR die Varianten (Material, Oberfläche,
// Beschläge, Lieferzeit) – der PREIS wird ausschließlich in der Pricing-Engine
// (src/lib/pricing.ts) aus echten Herstellerdaten berechnet und über
// src/lib/estimate.ts als Preisspanne gebildet. Hier gibt es bewusst KEINE
// eigene, zweite Preislogik mehr.
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
  leadTimeWeeks: [number, number]
  /** Hervorgehoben anhand der Preis-Absicht des Nutzers. */
  recommended: boolean
}

const LEAD: Record<VariantTier, [number, number]> = {
  budget: [3, 4],
  standard: [4, 5],
  premium: [6, 7],
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
    leadTimeWeeks: LEAD.budget,
    recommended: intent === 'budget',
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
    leadTimeWeeks: LEAD.standard,
    recommended: intent === 'flexible',
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
    leadTimeWeeks: LEAD.premium,
    recommended: intent === 'premium',
  }

  return [budget, standard, premium]
}
