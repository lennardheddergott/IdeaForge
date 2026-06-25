// ============================================================================
// Schritt 2 der KI-Pipeline: aus der strukturierten Spec → zwei Bild-Prompts
// ============================================================================
// Beide Prompts (technisches Konzeptblatt + fotorealistische Visualisierung)
// werden aus DERSELBEN ProductSpec gebaut. Dadurch beschreiben beide Bilder
// exakt dasselbe Möbelstück (gleiche Maße, Proportionen, Form, Bauteile,
// Material, Farbe, Konstruktion, Details).
//
// Das Konzeptblatt wird VOLLSTÄNDIG AUF DEUTSCH beschriftet (keine englischen
// Begriffe wie "Top View", "Front View", "Dimensions", "Oak").
// ============================================================================

import type { ProductSpec } from './spec.ts'

// ----------------------------------------------------------------------------
// Gemeinsame, spec-basierte Produktbeschreibung (Deutsch).
// Dies ist die identische Grundlage für BEIDE Bilder.
// ----------------------------------------------------------------------------
function specToDescription(spec: ProductSpec): string {
  const lines: string[] = []
  lines.push(`Produkt: ${spec.titel} (${spec.kategorie}).`)
  if (spec.kurzbeschreibung) lines.push(`Beschreibung: ${spec.kurzbeschreibung}`)

  const masse: string[] = []
  if (spec.masse.breite_cm) masse.push(`Breite ${spec.masse.breite_cm} cm`)
  if (spec.masse.hoehe_cm) masse.push(`Höhe ${spec.masse.hoehe_cm} cm`)
  if (spec.masse.tiefe_cm) masse.push(`Tiefe ${spec.masse.tiefe_cm} cm`)
  for (const w of spec.masse.weitere ?? []) masse.push(`${w.label} ${w.wert}`)
  if (masse.length) lines.push(`Maße: ${masse.join(', ')}.`)

  if (spec.materialien.length) {
    lines.push(
      `Materialien je Bauteil: ${spec.materialien
        .map((m) => `${m.bauteil} = ${m.material}`)
        .join('; ')}.`,
    )
  }
  if (spec.farben.length) lines.push(`Farben: ${spec.farben.join(', ')}.`)
  if (spec.bauteile.length) {
    lines.push(
      `Bauteile (${spec.anzahl_bauteile}): ${spec.bauteile.join(', ')}.`,
    )
  }
  if (spec.konstruktion) lines.push(`Konstruktion: ${spec.konstruktion}`)
  if (spec.besondere_details.length) {
    lines.push(`Besondere Details: ${spec.besondere_details.join(', ')}.`)
  }
  return lines.join('\n')
}

// Gemeinsame Anweisung: NUR exakt dieses Produkt zeichnen, nichts erfinden.
const FIDELITY_RULE =
  'Zeichne AUSSCHLIESSLICH genau das unten spezifizierte Möbelstück. Füge keine Bauteile hinzu und lasse keine weg. Übernimm Maße, Proportionen, Form, Anzahl der Elemente, Material, Farbe, Konstruktion und besondere Details exakt wie angegeben.'

// ----------------------------------------------------------------------------
// 1) Technisches Konzeptblatt — strikte, IMMER gleiche Vorgaben, DEUTSCH.
// ----------------------------------------------------------------------------
const ENGINEERING_SHEET_SPEC = [
  'Erzeuge ein STANDARDISIERTES TECHNISCHES KONZEPTBLATT im Stil einer professionellen Produktentwicklungs- und Konstruktionsabteilung (CAD-/Industrial-Design-Datenblatt). Es ist ein konstruktionsorientiertes technisches Dokument – KEINE Skizze, KEINE Produktillustration, KEIN Marketing-Render.',
  '',
  'Das Bild MUSS bewusst wie eine technische CAD-Zeichnung aussehen: flache technische Linienführung, keine realistischen Materialien, keine Studiofotografie.',
  '',
  // Bewusst NUR positive deutsche Vorgabe + deutsche Vokabeln. Englische
  // Verbots-Beispiele werden NICHT zitiert: Bildmodelle übernehmen wörtlich
  // genannte Begriffe sonst gelegentlich trotz Verbot ins Bild.
  'WICHTIG – SPRACHE: ALLE Texte, Überschriften, Beschriftungen, Maßangaben, Materialangaben, Hinweise und Annotationen MÜSSEN ausschließlich auf DEUTSCH sein – niemals in einer anderen Sprache. Verwende ausschließlich deutsche Fachbegriffe, zum Beispiel: "Vorderansicht", "Seitenansicht", "Draufsicht", "Isometrische Ansicht", "Maße", "Material", "Detail", "Schnitt", "Maßstab".',
  '',
  'Verbindliches, festes Layout — bei JEDER Generierung gleich, unabhängig vom Produkt:',
  '- Das gesamte Bild liest sich als technisches Konstruktions-/Konzeptblatt auf reinem weißem Hintergrund, ohne Dekoration.',
  '- Eine GROSSE ISOMETRISCHE Hauptansicht des Produkts als zentrales Element.',
  '- Zusätzlich mehrere kleinere ORTHOGONALE Ansichten — „Vorderansicht“, „Seitenansicht“ und „Draufsicht“ — ordentlich angeordnet, jeweils mit kurzer deutscher Beschriftung.',
  '- Saubere technische Linien und präzise Konturen (gleichmäßige Strichstärken, Konstruktions-/Mittellinien wo sinnvoll).',
  '- MASSLINIEN mit Pfeilen und numerischen Beschriftungen für alle angegebenen Maße (und für klar implizierte Schlüsselmaße).',
  '- MATERIAL-BESCHRIFTUNGEN, die die jeweiligen Bauteile mit dünnen Hinweislinien benennen (z. B. „Eiche“, „Stahl“, „Glas“) – auf Deutsch.',
  '- PFEILE und BESCHRIFTUNGEN, die auf wichtige Bauteile / Konstruktionsmerkmale zeigen.',
  '- Einheitliche technische Typografie und ein professionelles, aufgeräumtes Blatt-Layout.',
  '',
  'Strikt verboten (darf NICHT erscheinen): Menschen; Räume oder Interieurs; Lifestyle-Szenen; Werbung; Schlagschatten oder dekorative/Verlaufs-Hintergründe; künstlerische Interpretation; Produkt-Inszenierung; fotorealistisches Rendering.',
  '',
  'Fokus ausschließlich auf Konstruktion und Fertigbarkeit, sodass ein Hersteller das Konzept sofort versteht und die Machbarkeit einschätzen kann.',
  '',
  'FALLBACK: Falls mehrere koordinierte Ansichten nicht zuverlässig erzeugbar sind, erzeuge EINE einzelne, sehr detaillierte technische Konzeptzeichnung des Produkts – weiterhin mit Maßlinien, Materialbeschriftungen und benannten Bauteilen im selben strikten technischen Stil, alles auf Deutsch.',
].join('\n')

/** Baut den vollständigen Prompt für das technische Konzeptblatt (Deutsch). */
export function buildSketchPrompt(spec: ProductSpec): string {
  return `${ENGINEERING_SHEET_SPEC}\n\n${FIDELITY_RULE}\n\n${specToDescription(spec)}`
}

// ----------------------------------------------------------------------------
// 2) Fotorealistische Produktvorschau — konsistent zur selben Spec.
// ----------------------------------------------------------------------------
const PREVIEW_SPEC = [
  'Erzeuge eine einzelne, hochwertige FOTOREALISTISCHE Produktvisualisierung (realistisches 3D-Produktrendering) des unten beschriebenen Möbelstücks. Zweck: zeigen, wie das fertige Produkt ungefähr aussehen könnte.',
  '',
  'Anforderungen:',
  '- Realistische Materialien und Oberflächen in ihren natürlichen Farben, passend zur Beschreibung (z. B. echte Eichen-Maserung, gebürsteter Stahl, klares Glas).',
  '- Sauberes Studiolicht ODER ein neutraler, heller, nahtloser Hintergrund; weiche, realistische Kontaktschatten sind erlaubt, der Hintergrund bleibt schlicht und ohne Dekoration.',
  '- Das Produkt ist der ALLEINIGE Fokus, vollständig in einer attraktiven, neutralen Dreiviertel-/Perspektivansicht.',
  '- KEINE Maßlinien, KEINE technischen Annotationen, Hinweislinien oder Maßbeschriftungen.',
  '- KEINE Menschen, KEIN Raum/Interieur, KEINE Deko oder Requisiten, KEIN Text, KEINE Logos, KEINE Werbung.',
  '',
  'Das Produkt muss in Form, Proportionen, Bauteilen und Materialien exakt dem technischen Konzeptblatt aus derselben Spezifikation entsprechen, damit beide Bilder eindeutig dasselbe Produkt zeigen.',
].join('\n')

/** Baut den Prompt für die fotorealistische Produktvorschau (gleiche Spec). */
export function buildPreviewPrompt(spec: ProductSpec): string {
  return `${PREVIEW_SPEC}\n\n${FIDELITY_RULE}\n\n${specToDescription(spec)}`
}
