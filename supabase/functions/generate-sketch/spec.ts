// ============================================================================
// Schritt 1 der KI-Pipeline: Analyse → Klassifikation → strukturierte Spec
// ============================================================================
// Ein Text-Modell erzeugt aus der Nutzereingabe EINE strukturierte, deutsche
// Produktspezifikation. Diese Spec ist die EINZIGE Quelle für:
//   - die fotorealistische Visualisierung
//   - das technische Konzeptblatt
//   - die Preisabschätzung
//   - spätere Herstellerdaten
// Gleichzeitig entscheidet der Schritt, ob die Eingabe überhaupt ein Möbelstück
// ist. Wenn nicht, wird KEIN Bild erzeugt (ist_moebel = false + Ablehnungstext).
// ============================================================================

const OPENAI_CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

/** Freundliche Standard-Ablehnung für themenfremde Eingaben. */
export const REJECTION_MESSAGE =
  'Faiviq ist aktuell ausschließlich auf die Entwicklung und Anfertigung von Möbelstücken spezialisiert. Bitte beschreibe ein Möbelstück, das du gestalten möchtest.'

/** Maß-Angabe. */
export interface SpecMasse {
  breite_cm?: number | null
  hoehe_cm?: number | null
  tiefe_cm?: number | null
  /** Weitere relevante Maße als Label/Wert (z. B. "Bodenabstand": "20 cm"). */
  weitere?: { label: string; wert: string }[]
}

/** Material je Bauteil (z. B. Front: "Eiche, geölt"). */
export interface SpecMaterial {
  bauteil: string
  material: string
}

/** Preisabschätzung (Spanne). */
export interface SpecPreis {
  min: number
  max: number
  waehrung: string
  hinweis: string
}

/** Strukturierte Produktspezifikation – einzige Quelle für alle Ausgaben. */
export interface ProductSpec {
  ist_moebel: boolean
  /** Nur gesetzt, wenn ist_moebel === false. */
  ablehnung?: string
  titel: string
  kategorie: string
  kurzbeschreibung: string
  masse: SpecMasse
  materialien: SpecMaterial[]
  farben: string[]
  bauteile: string[]
  anzahl_bauteile: number
  konstruktion: string
  besondere_details: string[]
  komplexitaet: 'niedrig' | 'mittel' | 'hoch'
  fertigungsaufwand_stunden: number
  preis: SpecPreis
  // ── Phase 2: strukturierte Analyse für die Varianten-Ableitung ──
  produktart: string
  material_absicht: 'wood_look' | 'real_wood' | 'solid_wood' | 'metal' | 'glass' | 'mixed'
  material_muss_echt: boolean
  preis_absicht: 'budget' | 'flexible' | 'premium'
  features: string[]
  anzahl_tueren: number
  anzahl_schubladen: number
}

// Deutsche Labels für die Auswahlfelder (IDs aus src/data/options.ts).
const STYLE_LABELS: Record<string, string> = {
  japandi: 'Japandi (ruhig, natürlich, reduziert)',
  modern: 'modern (klare Linien, zeitlos)',
  minimal: 'minimalistisch (weniger ist mehr)',
  scandi: 'skandinavisch (hell, warm, funktional)',
  industrial: 'industrial (Stahl, Beton, Charakter)',
  midcentury: 'Mid-Century (Retro-Eleganz)',
  luxury: 'luxuriös (edle Materialien, Details)',
  organic: 'organisch (weiche, fließende Formen)',
}

const MATERIAL_LABELS: Record<string, string> = {
  oak: 'Eiche',
  walnut: 'Nussbaum',
  steel: 'Stahl',
  glass: 'Glas',
  marble: 'Marmor',
  linen: 'Leinen',
  brass: 'Messing',
  concrete: 'Beton',
}

const CATEGORY_LABELS: Record<string, string> = {
  cabinet: 'Schrank / Stauraummöbel',
  table: 'Tisch',
  seating: 'Sitzmöbel',
  lighting: 'Beleuchtung',
  tvboard: 'TV- / Media-Möbel',
  accessory: 'Wohnaccessoire',
}

export interface IdeaInputForSpec {
  prompt: string
  style: string | null
  materials: string[] | null
  category: string | null
}

/** System-Prompt: zwingt Klassifikation + strukturierte deutsche JSON-Spec. */
const SPEC_SYSTEM_PROMPT = [
  'Du bist der Produktanalyst von Faiviq, einer Plattform AUSSCHLIESSLICH für die Gestaltung und Anfertigung von Möbelstücken.',
  '',
  'AUFGABE: Analysiere die Nutzereingabe und gib AUSSCHLIESSLICH ein JSON-Objekt zurück (kein Markdown, kein Fließtext drumherum).',
  '',
  'SCHRITT 1 — Klassifikation: Entscheide, ob die Eingabe EINDEUTIG ein Möbelstück oder eine Möbelkomponente beschreibt.',
  'Erlaubt: Tische, Stühle, Sofas, Schränke, Regale, Betten, Kommoden, Sideboards, Nachttische, Küchenmöbel, TV-Möbel, Garderoben, Bänke, Couchtische, Esstische, Büromöbel, Outdoor-Möbel und ähnliche Möbelstücke.',
  'NICHT erlaubt: Fahrzeuge, Maschinen, Gebäude, Kleidung, Waffen, Elektronik, Texte, Hausaufgaben, allgemeine Chat-Anfragen oder jeglicher sonstiger themenfremder Inhalt.',
  'Wenn die Eingabe NICHT eindeutig ein Möbelstück ist, gib NUR zurück: {"ist_moebel": false, "ablehnung": "<freundliche deutsche Meldung>"}. Erfinde dann KEINE Möbeldaten.',
  '',
  'SCHRITT 2 — Wenn es ein Möbelstück ist (ist_moebel = true): erzeuge eine vollständige, in sich konsistente, realistische Spezifikation. Übernimm alles, was der Nutzer ausdrücklich angegeben hat (Maße, Material, Funktion, Stil), EXAKT. Ergänze offensichtlich fehlende, plausible technische Details, aber verändere die eigentliche Idee NIEMALS.',
  '',
  'SCHRITT 3 — Preisabschätzung: Schätze einen realistischen Endkundenpreis (in EUR) auf Basis von Möbelart, Maßen, Material, Komplexität, Konstruktion, Anzahl der Bauteile und geschätztem Fertigungsaufwand. Gib eine sinnvolle Spanne (min < max) an. Es ist ausdrücklich eine Schätzung.',
  '',
  'SCHRITT 4 — Struktur-Analyse für Varianten. Leite zusätzlich folgende Felder ab:',
  '- "produktart": kurze Möbelart, z. B. "TV-Board", "Esstisch", "Schreibtisch", "Kleiderschrank".',
  '- "material_absicht": Material-Absicht des Nutzers. Regeln:',
  '    * "Eichenoptik", "Holzoptik", "in ... optik" → "wood_look" (günstige Holzoptik ist erlaubt).',
  '    * "Eiche"/"Nussbaum" allein (ohne "massiv"/"Optik") → "real_wood" (unklar, Varianten möglich).',
  '    * "massive Eiche", "Massivholz", "echtes Holz", "Vollholz" → "solid_wood".',
  '    * überwiegend Metall → "metal"; Glas → "glass"; gemischt → "mixed".',
  '- "material_muss_echt": true NUR, wenn der Nutzer ausdrücklich Massivholz/echtes Holz verlangt ("massiv", "Massivholz", "echtes Holz"). Bei "Eichenoptik"/"Holzoptik" IMMER false.',
  '- "preis_absicht": "budget" bei "günstig", "nicht zu teuer", "preiswert"; "premium" bei "hochwertig", "Premium", "edel", "fürs Leben"; sonst "flexible".',
  '- "features": Liste kurzer Merkmale, z. B. ["drei Türen", "Kabelmanagement"].',
  '- "anzahl_tueren" und "anzahl_schubladen": ganze Zahlen (0, wenn keine).',
  '',
  'WICHTIG: ALLE Textwerte im JSON müssen auf DEUTSCH sein (Titel, Kategorie, Materialbezeichnungen, Bauteile, Konstruktion, Details). Keine englischen Begriffe. (Die Schlüssel material_absicht/preis_absicht nutzen die vorgegebenen englischen Codewörter.)',
  '',
  'Gib das JSON exakt in diesem Schema zurück:',
  '{',
  '  "ist_moebel": true,',
  '  "titel": "kurzer Produktname auf Deutsch",',
  '  "kategorie": "z. B. Esstisch, TV-Möbel, Kleiderschrank",',
  '  "kurzbeschreibung": "2–3 Sätze auf Deutsch",',
  '  "masse": { "breite_cm": 180, "hoehe_cm": 38, "tiefe_cm": 42, "weitere": [{ "label": "Bodenabstand", "wert": "20 cm" }] },',
  '  "materialien": [{ "bauteil": "Front", "material": "Eiche, natur geölt" }],',
  '  "farben": ["natur", "anthrazit"],',
  '  "bauteile": ["Korpus", "2 Schubladen", "Rückwand"],',
  '  "anzahl_bauteile": 7,',
  '  "konstruktion": "kurze Beschreibung der Konstruktion/Verbindungen auf Deutsch",',
  '  "besondere_details": ["indirekte LED-Beleuchtung", "Push-to-open"],',
  '  "komplexitaet": "niedrig | mittel | hoch",',
  '  "fertigungsaufwand_stunden": 18,',
  '  "preis": { "min": 850, "max": 1050, "waehrung": "EUR", "hinweis": "Schätzung, ±10 %" },',
  '  "produktart": "TV-Board",',
  '  "material_absicht": "wood_look",',
  '  "material_muss_echt": false,',
  '  "preis_absicht": "flexible",',
  '  "features": ["drei Türen", "Kabelmanagement"],',
  '  "anzahl_tueren": 3,',
  '  "anzahl_schubladen": 0',
  '}',
].join('\n')

/** Baut den Nutzer-Prompt aus Eingabe + Auswahlfeldern (deutsch). */
function buildUserMessage(idea: IdeaInputForSpec): string {
  const lines: string[] = []
  lines.push(`Nutzerbeschreibung: ${idea.prompt.trim()}`)
  if (idea.category && CATEGORY_LABELS[idea.category]) {
    lines.push(`Gewählte Kategorie: ${CATEGORY_LABELS[idea.category]}.`)
  }
  if (idea.style && STYLE_LABELS[idea.style]) {
    lines.push(`Gewünschter Stil: ${STYLE_LABELS[idea.style]}.`)
  }
  const mats = (idea.materials ?? [])
    .map((m) => MATERIAL_LABELS[m] ?? m)
    .filter(Boolean)
  if (mats.length > 0) {
    lines.push(`Gewünschte Materialien: ${mats.join(', ')}.`)
  }
  return lines.join('\n')
}

/** Minimal-Validierung + Defaults, damit die Spec robust nutzbar ist. */
function normalizeSpec(raw: unknown): ProductSpec {
  const s = (raw ?? {}) as Record<string, unknown>
  if (s.ist_moebel === false) {
    return {
      ist_moebel: false,
      ablehnung:
        typeof s.ablehnung === 'string' && s.ablehnung.trim()
          ? s.ablehnung.trim()
          : REJECTION_MESSAGE,
    } as ProductSpec
  }
  const preis = (s.preis ?? {}) as Record<string, unknown>
  const masse = (s.masse ?? {}) as Record<string, unknown>
  const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
  return {
    ist_moebel: true,
    titel: typeof s.titel === 'string' ? s.titel : 'Möbelstück',
    kategorie: typeof s.kategorie === 'string' ? s.kategorie : 'Möbel',
    kurzbeschreibung:
      typeof s.kurzbeschreibung === 'string' ? s.kurzbeschreibung : '',
    masse: {
      breite_cm: typeof masse.breite_cm === 'number' ? masse.breite_cm : null,
      hoehe_cm: typeof masse.hoehe_cm === 'number' ? masse.hoehe_cm : null,
      tiefe_cm: typeof masse.tiefe_cm === 'number' ? masse.tiefe_cm : null,
      weitere: asArray<{ label: string; wert: string }>(masse.weitere),
    },
    materialien: asArray<SpecMaterial>(s.materialien),
    farben: asArray<string>(s.farben),
    bauteile: asArray<string>(s.bauteile),
    anzahl_bauteile:
      typeof s.anzahl_bauteile === 'number' ? s.anzahl_bauteile : 0,
    konstruktion: typeof s.konstruktion === 'string' ? s.konstruktion : '',
    besondere_details: asArray<string>(s.besondere_details),
    komplexitaet:
      s.komplexitaet === 'niedrig' ||
      s.komplexitaet === 'mittel' ||
      s.komplexitaet === 'hoch'
        ? s.komplexitaet
        : 'mittel',
    fertigungsaufwand_stunden:
      typeof s.fertigungsaufwand_stunden === 'number'
        ? s.fertigungsaufwand_stunden
        : 0,
    preis: {
      min: typeof preis.min === 'number' ? preis.min : 0,
      max: typeof preis.max === 'number' ? preis.max : 0,
      waehrung: typeof preis.waehrung === 'string' ? preis.waehrung : 'EUR',
      hinweis:
        typeof preis.hinweis === 'string' ? preis.hinweis : 'Schätzung, ±10 %',
    },
    produktart:
      typeof s.produktart === 'string' && s.produktart.trim()
        ? s.produktart
        : typeof s.kategorie === 'string'
          ? s.kategorie
          : 'Möbel',
    material_absicht:
      s.material_absicht === 'wood_look' ||
      s.material_absicht === 'real_wood' ||
      s.material_absicht === 'solid_wood' ||
      s.material_absicht === 'metal' ||
      s.material_absicht === 'glass' ||
      s.material_absicht === 'mixed'
        ? s.material_absicht
        : 'real_wood',
    material_muss_echt: s.material_muss_echt === true,
    preis_absicht:
      s.preis_absicht === 'budget' ||
      s.preis_absicht === 'premium' ||
      s.preis_absicht === 'flexible'
        ? s.preis_absicht
        : 'flexible',
    features: asArray<string>(s.features),
    anzahl_tueren: typeof s.anzahl_tueren === 'number' ? s.anzahl_tueren : 0,
    anzahl_schubladen:
      typeof s.anzahl_schubladen === 'number' ? s.anzahl_schubladen : 0,
  }
}

/**
 * Erzeugt die strukturierte Produktspezifikation (inkl. Möbel-Klassifikation).
 * Wirft bei API-/Parsing-Fehlern; gibt sonst eine normalisierte Spec zurück.
 */
export async function generateSpec(opts: {
  apiKey: string
  model: string
  idea: IdeaInputForSpec
}): Promise<ProductSpec> {
  const resp = await fetch(OPENAI_CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: 'system', content: SPEC_SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(opts.idea) },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  })

  if (!resp.ok) {
    const detail = await resp.text()
    throw new Error(
      `OpenAI-Analyse fehlgeschlagen (${resp.status}): ${detail.slice(0, 400)}`,
    )
  }

  const result = await resp.json()
  const content: string | undefined = result?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI hat keine Analyse zurückgegeben.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new Error('Analyse-Antwort war kein gültiges JSON.')
  }
  return normalizeSpec(parsed)
}
