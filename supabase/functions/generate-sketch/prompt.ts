// ============================================================================
// Standardisierter Prompt für die KI-Konzeptskizze (gpt-image-2)
// ============================================================================
// Ziel: NICHT ein hübsches Werbebild, sondern eine einheitliche, technische
// Konzeptskizze, die Herstellern als erste Grundlage dient. Jede Ausgabe soll
// denselben Aufbau und Stil haben — unabhängig vom konkreten Produkt.
//
// Der Prompt besteht aus zwei Teilen:
//   1) STYLE_PREAMBLE  – fixe Stil-/Struktur-Vorgaben (immer identisch)
//   2) Produktbeschreibung aus der Nutzereingabe (prompt + Auswahlfelder)
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

// Feste Stil- und Struktur-Vorgaben. Diese Zeilen ändern sich NIE und sorgen
// dafür, dass alle Skizzen konsistent aussehen und leicht weiterverarbeitbar sind.
const STYLE_PREAMBLE = [
  'Create a standardized technical product concept sketch intended for a furniture manufacturer — NOT a marketing render and NOT a photograph.',
  'Always follow this exact, consistent layout and style for every product:',
  '- Clean, neutral presentation on a plain white / very light background.',
  '- The product is the sole focus, centered, with no decorative environment, no room scene, no background props.',
  '- Clear, correct proportions and an easily readable overall form.',
  '- Hand-drawn / CAD-like technical concept sketch style: precise line work, light line shading, muted neutral tones, no glossy advertising lighting.',
  '- Use a clear, legible viewpoint: a slightly isometric three-quarter view OR a straight frontal elevation.',
  '- Absolutely no people, no hands, no text-heavy labels, no logos, no clutter.',
  '- Where it follows from the description, add simple, restrained annotations for key dimensions or materials (thin leader lines, small callouts) — keep them minimal and clean.',
  '- Keep the same fundamental style and structure regardless of the specific product, so all outputs look visually consistent.',
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
    lines.push(`Preferred materials: ${mats.join(', ')}.`)
  }
  return lines.join('\n')
}

/**
 * Baut den vollständigen, internen Prompt: feste Stilvorgaben + Produktdetails.
 * Die feste Präambel steht bewusst zuerst, damit Stil und Struktur dominieren.
 */
export function buildSketchPrompt(idea: IdeaForPrompt): string {
  return `${STYLE_PREAMBLE}\n\n${describeProduct(idea)}`
}
