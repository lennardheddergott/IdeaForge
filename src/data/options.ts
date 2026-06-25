/* Form options for the "Create Idea" flow */

export interface Option {
  id: string
  label: string
  hint?: string
}

export const styles: Option[] = [
  { id: 'japandi', label: 'Japandi', hint: 'Ruhig, natürlich, reduziert' },
  { id: 'modern', label: 'Modern', hint: 'Klare Linien, zeitlos' },
  { id: 'minimal', label: 'Minimalistisch', hint: 'Weniger ist mehr' },
  { id: 'scandi', label: 'Skandinavisch', hint: 'Hell, warm, funktional' },
  { id: 'industrial', label: 'Industrial', hint: 'Stahl, Beton, Charakter' },
  { id: 'midcentury', label: 'Mid-Century', hint: 'Retro-Eleganz' },
  { id: 'luxury', label: 'Luxuriös', hint: 'Edle Materialien, Details' },
  { id: 'organic', label: 'Organisch', hint: 'Weiche, fließende Formen' },
]

export const materials: Option[] = [
  { id: 'oak', label: 'Eiche' },
  { id: 'walnut', label: 'Nussbaum' },
  { id: 'steel', label: 'Stahl' },
  { id: 'glass', label: 'Glas' },
  { id: 'marble', label: 'Marmor' },
  { id: 'linen', label: 'Leinen' },
  { id: 'brass', label: 'Messing' },
  { id: 'concrete', label: 'Beton' },
]

export const categories: Option[] = [
  { id: 'cabinet', label: 'Schrank & Stauraum' },
  { id: 'table', label: 'Tische' },
  { id: 'seating', label: 'Sitzmöbel' },
  { id: 'lighting', label: 'Beleuchtung' },
  { id: 'tvboard', label: 'TV- & Media-Möbel' },
  { id: 'accessory', label: 'Wohnaccessoires' },
]

export const budgets: Option[] = [
  { id: 'b1', label: '< 500 €', hint: 'Accessoires & Kleinmöbel' },
  { id: 'b2', label: '500 – 1.500 €', hint: 'Einzelstücke' },
  { id: 'b3', label: '1.500 – 4.000 €', hint: 'Hochwertige Möbel' },
  { id: 'b4', label: '4.000 €+', hint: 'Maßanfertigung & Einbau' },
]

/* ── Optionen für das Hersteller-Onboarding ── */

/** Art des Unternehmens. */
export const companyTypes: Option[] = [
  { id: 'carpentry', label: 'Tischlerei' },
  { id: 'metalwork', label: 'Metallbau' },
  { id: 'upholstery', label: 'Polsterei' },
  { id: 'furniture', label: 'Möbelbau' },
  { id: 'joinery', label: 'Schreinerei' },
  { id: 'other', label: 'Sonstiges' },
]

/** Spezialisierungen (Mehrfachauswahl). */
export const specializations: Option[] = [
  { id: 'tables', label: 'Tische' },
  { id: 'cabinets', label: 'Schränke' },
  { id: 'shelves', label: 'Regale' },
  { id: 'kitchen', label: 'Küchenmöbel' },
  { id: 'beds', label: 'Betten' },
  { id: 'seating', label: 'Sitzmöbel' },
  { id: 'builtin', label: 'Einbaumöbel' },
]

/** Verarbeitbare Materialien (Mehrfachauswahl). */
export const manufacturerMaterials: Option[] = [
  { id: 'solidwood', label: 'Massivholz' },
  { id: 'mdf', label: 'MDF' },
  { id: 'metal', label: 'Metall' },
  { id: 'glass', label: 'Glas' },
  { id: 'veneer', label: 'Furnier' },
  { id: 'stone', label: 'Stein / Marmor' },
  { id: 'textile', label: 'Textil / Polster' },
]

export const promptExamples = [
  'Entwirf mir einen beigen Einbauschrank mit Glasfront und indirekter LED-Beleuchtung.',
  'Ich hätte gerne einen modernen Esstisch aus Eiche und schwarzem Stahl.',
  'Erstelle einen minimalistischen Couchtisch im Japandi-Stil.',
  'Ich möchte ein TV-Board mit schwebendem Design und versteckten Kabeln.',
]
