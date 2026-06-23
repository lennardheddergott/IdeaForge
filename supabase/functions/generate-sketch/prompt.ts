// ============================================================================
// Prompt für das technische Konzeptblatt (gpt-image-2)
// ============================================================================
// Ziel: KEINE Skizze, KEINE Produktillustration und KEIN fotorealistisches
// Produktbild. Erzeugt wird ein STANDARDISIERTES TECHNISCHES KONZEPTBLATT im
// Stil einer professionellen Produktentwicklungs-/Konstruktionsabteilung
// (CAD-/Industrial-Design-Sheet). Jede Generierung folgt – unabhängig vom
// Produkt – exakt demselben strikten Aufbau, damit alle Blätter konsistent sind.
//
// Aufbau des Prompts (Reihenfolge bewusst gewählt):
//   1) ENGINEERING_SHEET_SPEC – strikte Layout-/Stil-/Verbotsregeln (immer gleich)
//   2) ANALYSIS_STEP          – interne Analyse & Strukturierung der Eingabe
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
// 1) Strikte Vorgaben für das Engineering-Konzeptblatt.
//    Diese Regeln ändern sich NIE → garantieren ein einheitliches, technisches,
//    herstellernahes Layout für jedes Produkt auf der Plattform.
// ----------------------------------------------------------------------------
const ENGINEERING_SHEET_SPEC = [
  'Generate a STANDARDIZED TECHNICAL CONCEPT SHEET in the style of a professional product-development and engineering department (industrial-design / CAD spec sheet). This is a construction-oriented engineering document, NOT a sketch, NOT a product illustration, NOT a marketing render.',
  '',
  'DO NOT attempt to create a photorealistic product photo or a rendered product shot. The image must deliberately look like a CAD drawing / industrial technical design sheet: flat technical line work, no realistic materials, no studio photography.',
  '',
  'Mandatory, fixed layout — apply the SAME structure to every generation, regardless of the product:',
  '- The entire image must read as a technical engineering / industrial-design concept sheet on a plain white background with no decoration.',
  '- One LARGE ISOMETRIC main view of the product as the focal element of the sheet.',
  '- Additionally several smaller ORTHOGRAPHIC views — FRONT, SIDE and TOP — arranged neatly, each with a short caption, wherever they make sense for the product.',
  '- Clean technical lines and crisp, precise contours (uniform stroke weights, construction/center lines where useful).',
  '- DIMENSION LINES with arrowheads and numeric labels for ALL measurements the user provided (and for clearly implied key dimensions).',
  '- MATERIAL CALLOUTS labelling the respective components (e.g. "Oak", "Aluminium", "Stainless steel") via thin leader lines.',
  '- ARROWS and CALLOUTS pointing to important components / construction features.',
  '- Consistent, uniform technical typography and a professional, tidy sheet layout.',
  '',
  'Strictly forbidden (must NOT appear): people; rooms or interiors; lifestyle scenes; advertising; drop shadows, cast shadows or decorative/gradient backgrounds; artistic interpretation; product staging or scenography; photorealistic rendering.',
  '',
  'Focus exclusively on construction and manufacturability. The output must look as if a professional product designer prepared it for a first review with a manufacturer, so the manufacturer can immediately understand the concept and assess feasibility.',
  '',
  'FALLBACK: If multiple coordinated views cannot be produced reliably, instead produce ONE single, highly detailed technical concept drawing of the product, still including dimension lines, material callouts and labelled components in the same strict technical style.',
].join('\n')

// ----------------------------------------------------------------------------
// 2) Interne Analyse & Strukturierung: offensichtlich fehlende technische
//    Details dürfen ergänzt werden, die eigentliche Idee NIEMALS verändert.
// ----------------------------------------------------------------------------
const ANALYSIS_STEP = [
  'Before drawing, internally analyse and structure the user input: identify the product, its main components, plausible construction, joints, mounting, proportions and the dimensions/materials that are stated or clearly implied.',
  'You may add obvious missing technical details to make the sheet complete and manufacturer-ready, but you must NEVER change, contradict or replace the user\'s actual idea. Anything the user explicitly stated (size, material, function, style) must be reproduced exactly.',
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
    lines.push(
      `Design intent (for proportions/form only, NOT for rendering style): ${STYLE_LABELS[idea.style]}.`,
    )
  }
  const mats = (idea.materials ?? [])
    .map((m) => MATERIAL_LABELS[m] ?? m)
    .filter(Boolean)
  if (mats.length > 0) {
    lines.push(
      `Stated materials (add material callouts for these on the drawing): ${mats.join(', ')}.`,
    )
  }
  return lines.join('\n')
}

/**
 * Baut den vollständigen, internen Prompt: strikte Konzeptblatt-Vorgaben +
 * Analyse-Anweisung + Produktdetails. Die strikten Vorgaben stehen bewusst
 * zuerst, damit der technische Aufbau über alle Produkte hinweg dominiert.
 */
export function buildSketchPrompt(idea: IdeaForPrompt): string {
  return `${ENGINEERING_SHEET_SPEC}\n\n${ANALYSIS_STEP}\n\n${describeProduct(idea)}`
}

// ============================================================================
// Fotorealistische Produktvorschau (NEU)
// ============================================================================
// Zweites Bild aus DERSELBEN Nutzereingabe: ein hochwertiges, realistisches
// Rendering, das zeigt, wie das fertige Produkt ungefähr aussehen könnte.
// Bewusst KEIN technisches Blatt — und konsistent zum Konzeptblatt (gleiches
// Produkt, gleiche Form/Proportionen/Materialien).
// ----------------------------------------------------------------------------
const PREVIEW_SPEC = [
  'Generate a single, high-quality PHOTOREALISTIC product visualization (realistic 3D product render) of the product described below. The purpose is to show the user what the finished product could roughly look like.',
  '',
  'Requirements:',
  '- Realistic materials and finishes shown in their natural colors, matching the description (e.g. real oak wood grain, brushed stainless steel, clear glass).',
  '- Clean studio lighting OR a neutral, bright, seamless background; soft, realistic contact shadows are acceptable, but keep the background plain and undecorated.',
  '- The product is the SOLE focus, shown completely in an attractive, neutral three-quarter / perspective view.',
  '- NO dimension lines, NO technical annotations, callouts, leader lines or measurement labels.',
  '- NO people, NO room or interior scene, NO decorations or props, NO text, NO logos, NO advertising or lifestyle staging.',
  '',
  "Keep the product's form, proportions, components and materials consistent with the technical concept sheet generated from the same description, so both images clearly represent the same product.",
].join('\n')

/**
 * Produktbeschreibung für die fotorealistische Vorschau. Anders als beim
 * Konzeptblatt darf der gewählte Stil hier die Ästhetik/Anmutung beeinflussen.
 */
function describeProductForPreview(idea: IdeaForPrompt): string {
  const lines: string[] = []
  lines.push(`Product description (from the user): ${idea.prompt.trim()}`)

  if (idea.category && CATEGORY_LABELS[idea.category]) {
    lines.push(`Product category: ${CATEGORY_LABELS[idea.category]}.`)
  }
  if (idea.style && STYLE_LABELS[idea.style]) {
    lines.push(`Design style / aesthetic: ${STYLE_LABELS[idea.style]}.`)
  }
  const mats = (idea.materials ?? [])
    .map((m) => MATERIAL_LABELS[m] ?? m)
    .filter(Boolean)
  if (mats.length > 0) {
    lines.push(`Materials to render realistically: ${mats.join(', ')}.`)
  }
  return lines.join('\n')
}

/**
 * Baut den Prompt für die fotorealistische Produktvorschau. Nutzt dieselbe
 * interne Analyse wie das Konzeptblatt, damit beide Bilder konsistent sind.
 */
export function buildPreviewPrompt(idea: IdeaForPrompt): string {
  return `${PREVIEW_SPEC}\n\n${ANALYSIS_STEP}\n\n${describeProductForPreview(idea)}`
}
