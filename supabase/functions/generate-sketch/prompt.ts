// ============================================================================
// Prompt für das technische Konzeptblatt (gpt-image-2)
// ============================================================================
// Ziel: KEINE einfache Skizze und kein Werbebild, sondern ein standardisiertes
// TECHNISCHES KONZEPTBLATT, das Herstellern als erste Planungsgrundlage dient.
// Jede Ausgabe folgt – unabhängig vom Produkt – exakt demselben professionellen
// Aufbau, damit alle Blätter auf der Plattform konsistent aussehen.
//
// Der Prompt besteht aus drei Teilen (Reihenfolge bewusst gewählt):
//   1) SHEET_SPEC      – fixe Layout-/Stilvorgaben des Konzeptblatts (immer gleich)
//   2) ANALYSIS_STEP   – interne Analyse: offensichtlich fehlende Details ergänzen
//   3) Produktbeschreibung aus der Nutzereingabe (prompt + Auswahlfelder)
// ============================================================================

/** Spiegelt die IDs aus src/data/options.ts auf lesbare Labels (für den Prompt). */
const STYLE_LABELS: Record<string, string> = {
  japandi: 'Japandi (calm, natural, reduced)',
  modern: 'modern (clean lines, timeless)',
  minimal: 'minimalist (less is more)',
  scandi: 'Scandinavian (light, warm, functional)',
  industrial: 'industrial (steel, concrete, character)',
  midcentury: 'mid-century (retro elegance)',
  luxury: 'luxurious (fine materials, detailing)',
  organic: 'organic (soft, flowing shapes)',
}

const MATERIAL_LABELS: Record<string, string> = {
  oak: 'oak',
  walnut: 'walnut',
  steel: 'steel',
  glass: 'glass',
  marble: 'marble',
  linen: 'linen',
  brass: 'brass',
  concrete: 'concrete',
}

const CATEGORY_LABELS: Record<string, string> = {
  cabinet: 'cabinet / storage furniture',
  table: 'table',
  seating: 'seating furniture',
  lighting: 'lighting fixture',
  tvboard: 'TV / media console',
  accessory: 'home accessory',
}

// ----------------------------------------------------------------------------
// 1) Feste Vorgaben für Aufbau & Stil des Konzeptblatts.
//    Diese Zeilen ändern sich NIE → garantieren ein einheitliches, hochwertiges
//    Layout für jedes Produkt auf der Plattform.
// ----------------------------------------------------------------------------
const SHEET_SPEC = [
  'Produce a single, standardized TECHNICAL PRODUCT CONCEPT SHEET — the kind a product-development department prepares as a first planning basis for a manufacturer. It must look like a professional engineering/concept drawing, NOT a marketing render, NOT a photograph, NOT a lifestyle scene.',
  '',
  'Use this EXACT, consistent sheet layout for every product, regardless of what the product is:',
  '- A clean white or very light neutral background, with a calm, uniform technical-sheet layout and generous, balanced spacing (like a spec/concept sheet).',
  '- ONE LARGE MAIN VIEW as the hero of the sheet: an isometric or three-quarter perspective drawing of the complete product, centered and clearly readable.',
  '- Smaller SECONDARY ORTHOGRAPHIC VIEWS arranged neatly around or below the main view where they make sense: a FRONT view, a SIDE view and a TOP view, each with a short caption ("Front", "Side", "Top").',
  '- Consistent, precise technical line work in a CAD / engineering-drawing style: crisp outlines, light construction lines, restrained neutral shading, and a high level of detail.',
  '',
  'Annotations on the drawing:',
  '- If the description states or clearly implies measurements, draw proper DIMENSION LINES with arrowheads and numeric labels (width, height, depth, key offsets) on the relevant views.',
  '- If materials are mentioned, clearly LABEL them on the product using thin leader lines and short callouts (e.g. "Oak", "Aluminium", "Stainless steel").',
  '- Keep all text short, legible and in a uniform technical style; no paragraphs of prose, no logos, no decorative typography, no watermarks.',
  '',
  'Strictly avoid: people, hands, decorative styling props, room or interior scenes, plants, mood lighting, advertising, and any lifestyle imagery.',
  '',
  'The product must be shown completely and unambiguously so a manufacturer can quickly understand the idea and assess its feasibility. Keep the same fundamental layout, line style, level of detail and overall quality for every product, so all concept sheets on the platform look consistent.',
].join('\n')

// ----------------------------------------------------------------------------
// 2) Interne Analyse: offensichtlich fehlende technische Details sinnvoll
//    ergänzen, ohne die eigentliche Idee des Nutzers zu verändern.
// ----------------------------------------------------------------------------
const ANALYSIS_STEP = [
  'Before drawing, internally analyse the user description and sensibly infer obvious but missing technical details — typical proportions, construction, joints, mounting and plausible standard dimensions and materials — so the sheet is complete and manufacturer-ready.',
  'Do NOT change, contradict or invent beyond the actual idea: whenever the user specified something (size, material, style, function), respect it exactly; only fill gaps that are clearly implied.',
].join('\n')

export interface IdeaForPrompt {
  prompt: string
  style: string | null
  materials: string[] | null
  category: string | null
}

/** Setzt aus der Nutzereingabe die produktspezifische Beschreibung zusammen. */
function describeProduct(idea: IdeaForPrompt): string {
  const lines: string[] = []
  lines.push(`Product description (from the user): ${idea.prompt.trim()}`)

  if (idea.category && CATEGORY_LABELS[idea.category]) {
    lines.push(`Product category: ${CATEGORY_LABELS[idea.category]}.`)
  }
  if (idea.style && STYLE_LABELS[idea.style]) {
    lines.push(`Design style: ${STYLE_LABELS[idea.style]}.`)
  }
  const mats = (idea.materials ?? [])
    .map((m) => MATERIAL_LABELS[m] ?? m)
    .filter(Boolean)
  if (mats.length > 0) {
    lines.push(`Stated materials (label these on the drawing): ${mats.join(', ')}.`)
  }
  return lines.join('\n')
}

/**
 * Baut den vollständigen, internen Prompt: feste Konzeptblatt-Vorgaben +
 * Analyse-Anweisung + Produktdetails. Die festen Vorgaben stehen bewusst zuerst,
 * damit Aufbau und Stil über alle Produkte hinweg dominieren und konsistent sind.
 */
export function buildSketchPrompt(idea: IdeaForPrompt): string {
  return `${SHEET_SPEC}\n\n${ANALYSIS_STEP}\n\n${describeProduct(idea)}`
}
