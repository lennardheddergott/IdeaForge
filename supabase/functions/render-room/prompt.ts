// ============================================================================
// Prompt-Bau für die fotorealistische Raumvisualisierung (GPT Image / edits)
// ============================================================================
// Products-first: Es werden AUSSCHLIESSLICH die bereits entwickelten Möbel in
// das echte Raumfoto integriert – keine erfundenen Zusatzmöbel. Die mitgegebenen
// Referenzbilder (Einzelvisualisierungen) definieren das exakte Aussehen.
//
// AUTOMATISCHE PLATZIERUNG: Das Modell analysiert Wände, Fenster, Türen und freie
// Flächen selbst und platziert die Möbel sinnvoll. Eine gewünschte Position ist
// optional (Freitext); fehlt sie, entscheidet das Modell.
// ============================================================================

export interface RoomProductForPrompt {
  name: string
  material?: string | null
  farbe?: string | null
  position?: string | null // optionaler Positionswunsch des Nutzers
}

/** Baut den vollständigen Editing-Prompt für das Raumbild. */
export function buildRoomPrompt(opts: {
  style: string | null
  products: RoomProductForPrompt[]
}): string {
  const lines: string[] = []
  lines.push(
    'Fotorealistische Innenraum-Visualisierung. Nimm das erste Bild als den ECHTEN Raum und',
    'behalte ihn exakt bei: Wände, Fenster, Türen, Boden, Decke, Perspektive, Kameraposition,',
    'Beleuchtung und Farbstimmung dürfen NICHT verändert werden.',
    '',
    'Analysiere den Raum eigenständig (Wände, Fenster, Türen, freie Bodenflächen, Perspektive,',
    'Lichteinfall) und platziere die folgenden, bereits entwickelten Möbelstücke fotorealistisch,',
    'funktional und ästhetisch sinnvoll im Raum. Die weiteren mitgegebenen Bilder sind die exakten',
    'Produktreferenzen – übernimm Form, Material, Farbe und Proportionen möglichst genau:',
  )

  opts.products.forEach((p, i) => {
    const parts = [`${i + 1}. ${p.name}`]
    if (p.material) parts.push(`Material: ${p.material}`)
    if (p.farbe) parts.push(`Farbe: ${p.farbe}`)
    parts.push(
      p.position?.trim()
        ? `Gewünschte Position: ${p.position.trim()}`
        : 'Position: sinnvoll und funktional selbst wählen',
    )
    lines.push(`- ${parts.join(' · ')}`)
  })

  if (opts.style) lines.push('', `Gesamtstil des Raums: ${opts.style}.`)

  lines.push(
    '',
    'Wichtig:',
    '- Integriere die Möbel mit korrekter Perspektive, realistischem Maßstab sowie passenden',
    '  Schatten und Reflexionen entsprechend dem vorhandenen Licht.',
    '- Stelle sie plausibel auf den Boden bzw. an die Wand; keine Überlappungen, keine schwebenden',
    '  Objekte (außer ausdrücklich als schwebend/wandhängend beschrieben).',
    '- Füge KEINE weiteren Möbel, Deko, Personen oder Objekte hinzu, die nicht oben genannt sind.',
    '- KEINE Beschriftungen, Nummern, Marker, Wasserzeichen oder Text im Bild.',
    '- Das Ergebnis ist ein einzelnes, sauberes, fotorealistisches Foto des eingerichteten Raums.',
  )

  return lines.join('\n')
}
