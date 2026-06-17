export interface Manufacturer {
  id: string
  name: string
  initials: string
  rating: number
  reviews: number
  location: string
  distanceKm: number
  specialization: string
  tags: string[]
  leadTime: string
  priceLevel: 1 | 2 | 3
  verified: boolean
  blurb: string
}

export const manufacturers: Manufacturer[] = [
  {
    id: 'hoffmann',
    name: 'Hoffmann Manufaktur',
    initials: 'HM',
    rating: 4.9,
    reviews: 128,
    location: 'München',
    distanceKm: 12,
    specialization: 'Massivholz-Möbel & Einbauten',
    tags: ['Eiche', 'Nussbaum', 'Einbau'],
    leadTime: '4–6 Wochen',
    priceLevel: 3,
    verified: true,
    blurb:
      'Familienbetrieb in dritter Generation, spezialisiert auf maßgefertigte Massivholzmöbel mit makelloser Verarbeitung.',
  },
  {
    id: 'metallform',
    name: 'MetallForm GmbH',
    initials: 'MF',
    rating: 4.8,
    reviews: 94,
    location: 'Stuttgart',
    distanceKm: 38,
    specialization: 'Stahl- & Metallbau',
    tags: ['Stahl', 'Pulverbeschichtung', 'Gestelle'],
    leadTime: '3–5 Wochen',
    priceLevel: 2,
    verified: true,
    blurb:
      'Präziser Metallbau für Tischgestelle, Regale und Hybridmöbel. CNC-gestützt mit feinsten Toleranzen.',
  },
  {
    id: 'eichenwerk',
    name: 'Eichenwerk',
    initials: 'EW',
    rating: 4.7,
    reviews: 211,
    location: 'Hamburg',
    distanceKm: 64,
    specialization: 'Designtische & Unikate',
    tags: ['Eiche', 'Epoxid', 'Tische'],
    leadTime: '5–7 Wochen',
    priceLevel: 3,
    verified: true,
    blurb:
      'Bekannt für markante Esstische aus europäischer Eiche – jedes Stück ein Unikat mit Zertifikat.',
  },
  {
    id: 'studionorra',
    name: 'Studio Norra',
    initials: 'SN',
    rating: 5.0,
    reviews: 67,
    location: 'Berlin',
    distanceKm: 21,
    specialization: 'Japandi & minimalistische Möbel',
    tags: ['Japandi', 'Esche', 'Leinen'],
    leadTime: '4–6 Wochen',
    priceLevel: 2,
    verified: true,
    blurb:
      'Berliner Studio mit Fokus auf reduziertes, ruhiges Design. Nachhaltige Materialien, perfekte Proportionen.',
  },
  {
    id: 'vidal',
    name: 'Atelier Vidal',
    initials: 'AV',
    rating: 4.6,
    reviews: 53,
    location: 'Köln',
    distanceKm: 49,
    specialization: 'Luxus-Accessoires & Marmor',
    tags: ['Marmor', 'Messing', 'Glas'],
    leadTime: '6–8 Wochen',
    priceLevel: 3,
    verified: true,
    blurb:
      'Manufaktur für edle Wohnaccessoires. Kombiniert Marmor, Messing und Glas zu skulpturalen Objekten.',
  },
  {
    id: 'nordlicht',
    name: 'Nordlicht Studio',
    initials: 'NS',
    rating: 4.8,
    reviews: 89,
    location: 'Leipzig',
    distanceKm: 33,
    specialization: 'Beleuchtung & LED-Integration',
    tags: ['Beleuchtung', 'LED', 'Aluminium'],
    leadTime: '2–4 Wochen',
    priceLevel: 2,
    verified: true,
    blurb:
      'Spezialisten für integrierte Lichtkonzepte – von indirekter LED-Beleuchtung bis zu maßgefertigten Leuchten.',
  },
]
