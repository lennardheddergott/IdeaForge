/* The generated AI design concept shown on the Result page */
export const designConcept = {
  title: 'Aurelio — Schwebendes TV-Board',
  tagline: 'Japandi · Eiche & Anthrazit · Versteckte Kabelführung',
  summary:
    'Ein schwebendes TV-Board mit klaren Linien und warmer Ausstrahlung. Die Front aus geölter Eiche trifft auf einen anthrazitfarbenen Korpus mit grifflosen Push-to-open-Fronten. Eine integrierte, indirekte LED-Beleuchtung lässt das Möbel optisch über dem Boden schweben, während ein durchdachtes Kabelmanagement für eine vollkommen aufgeräumte Optik sorgt.',
  materials: [
    { name: 'Front', value: 'Eiche, natur geölt' },
    { name: 'Korpus', value: 'MDF, anthrazit matt lackiert' },
    { name: 'Griffe', value: 'Grifflos · Push-to-open' },
    { name: 'Beleuchtung', value: 'Indirekte LED, 2700 K' },
    { name: 'Beschläge', value: 'Blum, gedämpft' },
  ],
  dimensions: [
    { label: 'Breite', value: '180 cm' },
    { label: 'Höhe', value: '38 cm' },
    { label: 'Tiefe', value: '42 cm' },
    { label: 'Bodenabstand', value: '20 cm' },
  ],
  properties: [
    'Wandmontage mit verdeckter Aufhängung',
    'Kabeldurchführungen in jedem Fach',
    'Soft-Close auf allen Fronten',
    'Belastbar bis 60 kg',
  ],
  sustainability: {
    score: 86,
    label: 'Sehr nachhaltig',
    points: [
      'FSC-zertifizierte Eiche aus Europa',
      'Lösungsmittelfreie Öle & Lacke',
      'Reparierbar & modular aufgebaut',
    ],
  },
  pricing: {
    estimate: 2480,
    range: '2.100 – 2.900 €',
    production: 1680,
    breakdown: [
      { label: 'Material', value: 720 },
      { label: 'Fertigung', value: 960 },
      { label: 'Beschläge & LED', value: 280 },
      { label: 'IdeaForge Service', value: 520 },
    ],
  },
}

/* Dashboard projects */
export type ProjectStatus = 'design' | 'matching' | 'production' | 'delivered'

export interface Project {
  id: string
  name: string
  category: string
  status: ProjectStatus
  progress: number
  updated: string
  manufacturer?: string
  price: number
}

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'Aurelio — TV-Board',
    category: 'TV- & Media-Möbel',
    status: 'production',
    progress: 68,
    updated: 'vor 2 Stunden',
    manufacturer: 'Hoffmann Manufaktur',
    price: 2480,
  },
  {
    id: 'p2',
    name: 'Esstisch „Linnea“',
    category: 'Tische',
    status: 'matching',
    progress: 42,
    updated: 'gestern',
    manufacturer: undefined,
    price: 1890,
  },
  {
    id: 'p3',
    name: 'Couchtisch „Suna“',
    category: 'Tische',
    status: 'design',
    progress: 20,
    updated: 'vor 3 Tagen',
    manufacturer: undefined,
    price: 740,
  },
  {
    id: 'p4',
    name: 'Garderobe „Halle 7“',
    category: 'Schrank & Stauraum',
    status: 'delivered',
    progress: 100,
    updated: 'vor 2 Wochen',
    manufacturer: 'Studio Norra',
    price: 1280,
  },
]

export const statusMeta: Record<
  ProjectStatus,
  { label: string; color: string }
> = {
  design: { label: 'Design', color: 'text-accent-600 bg-accent-50' },
  matching: { label: 'Hersteller-Matching', color: 'text-amber-600 bg-amber-50' },
  production: { label: 'In Produktion', color: 'text-blue-600 bg-blue-50' },
  delivered: { label: 'Geliefert', color: 'text-emerald-600 bg-emerald-50' },
}

/* Status timeline for the active project */
export const timeline = [
  { label: 'Idee erstellt', date: '12. Juni', done: true },
  { label: 'Design generiert', date: '12. Juni', done: true },
  { label: 'Hersteller beauftragt', date: '14. Juni', done: true },
  { label: 'In Produktion', date: '16. Juni', done: true, active: true },
  { label: 'Qualitätsprüfung', date: 'erwartet 28. Juni', done: false },
  { label: 'Lieferung', date: 'erwartet 2. Juli', done: false },
]

/* Saved ideas (dashboard) */
export const savedIdeas = [
  { id: 's1', text: 'Bücherregal mit asymmetrischen Fächern, Eiche', tag: 'Stauraum' },
  { id: 's2', text: 'Bett mit gepolstertem Leinen-Kopfteil', tag: 'Schlafen' },
  { id: 's3', text: 'Steh-Schreibtisch, Walnuss & schwarzer Stahl', tag: 'Office' },
]

/* Open manufacturer requests (dashboard) */
export const requests = [
  { id: 'r1', project: 'Esstisch „Linnea“', manufacturer: 'Eichenwerk', status: 'Angebot erhalten', date: 'vor 1 Tag' },
  { id: 'r2', project: 'Esstisch „Linnea“', manufacturer: 'Studio Norra', status: 'Wartet auf Antwort', date: 'vor 1 Tag' },
  { id: 'r3', project: 'Couchtisch „Suna“', manufacturer: 'MetallForm GmbH', status: 'In Prüfung', date: 'vor 3 Tagen' },
]
