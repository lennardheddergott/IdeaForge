import {
  Sparkles,
  Boxes,
  Factory,
  Leaf,
  Ruler,
  PencilRuler,
  ScanLine,
  Handshake,
  type LucideIcon,
} from 'lucide-react'

/* ───────────────── Landing: Features ───────────────── */
export interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export const features: Feature[] = [
  {
    icon: Sparkles,
    title: 'KI-gestütztes Design',
    description:
      'Beschreibe deine Idee in eigenen Worten. Unsere KI übersetzt sie in ein durchdachtes, herstellbares Designkonzept.',
  },
  {
    icon: ScanLine,
    title: 'Fotorealistische Renderings',
    description:
      'Sieh dein Produkt, bevor es existiert – in mehreren Perspektiven, Materialien und Lichtstimmungen.',
  },
  {
    icon: Ruler,
    title: 'Präzise Maße & Specs',
    description:
      'Automatisch generierte Maße, Materiallisten und technische Eigenschaften – bereit für die Fertigung.',
  },
  {
    icon: Leaf,
    title: 'Nachhaltigkeitsindex',
    description:
      'Jedes Design erhält eine transparente Bewertung zu Materialherkunft, Langlebigkeit und CO₂-Fußabdruck.',
  },
  {
    icon: Factory,
    title: 'Geprüfte Hersteller',
    description:
      'Wir verbinden dich mit kuratierten Manufakturen, Tischlereien und Metallbauern in deiner Nähe.',
  },
  {
    icon: Boxes,
    title: 'Eine durchgängige Journey',
    description:
      'Von der ersten Idee bis zur Lieferung – verfolge jeden Schritt in einem einzigen, eleganten Dashboard.',
  },
]

/* ───────────────── Landing: How it works ───────────────── */
export interface Step {
  icon: LucideIcon
  step: string
  title: string
  description: string
}

export const steps: Step[] = [
  {
    icon: PencilRuler,
    step: '01',
    title: 'Idee beschreiben',
    description:
      'Sag uns in natürlicher Sprache, was du dir vorstellst – Stil, Material, Budget. Optional mit Inspirationsbildern.',
  },
  {
    icon: Sparkles,
    step: '02',
    title: 'KI entwirft',
    description:
      'In Sekunden entsteht ein vollständiges Designkonzept mit Renderings, Maßen und Materialempfehlungen.',
  },
  {
    icon: Handshake,
    step: '03',
    title: 'Hersteller finden',
    description:
      'Wir matchen dein Design mit passenden Produktionspartnern. Du sendest Anfragen mit einem Klick.',
  },
  {
    icon: Factory,
    step: '04',
    title: 'Fertigung & Lieferung',
    description:
      'Verfolge Produktion und Versand transparent im Dashboard – bis dein Unikat vor der Tür steht.',
  },
]

/* ───────────────── Landing: Testimonials ───────────────── */
export interface Testimonial {
  quote: string
  name: string
  role: string
  initials: string
}

export const testimonials: Testimonial[] = [
  {
    quote:
      'Ich hatte nur eine vage Idee für mein Sideboard. Innerhalb von Minuten hatte ich ein Rendering, das schöner war als alles, was ich im Möbelhaus gefunden habe.',
    name: 'Lena Brandt',
    role: 'Innenarchitektin, Berlin',
    initials: 'LB',
  },
  {
    quote:
      'Als Tischlerei bekommen wir über IdeaForge perfekt vorbereitete Anfragen – mit Maßen, Materialien und Budget. Das spart uns enorm viel Zeit.',
    name: 'Markus Hoffmann',
    role: 'Inhaber, Hoffmann Manufaktur',
    initials: 'MH',
  },
  {
    quote:
      'Das Tool fühlt sich an wie ein eigener Designer in der Hosentasche. Vom Konzept bis zur Bestellung war alles erstaunlich reibungslos.',
    name: 'Sofia Almeida',
    role: 'Gründerin, Studio Norra',
    initials: 'SA',
  },
  {
    quote:
      'Wir haben unsere komplette Büroeinrichtung über IdeaForge entworfen. Investoren waren begeistert, wie professionell das Ergebnis wirkt.',
    name: 'Daniel Krüger',
    role: 'COO, Northbound',
    initials: 'DK',
  },
]

/* ───────────────── Landing: FAQ ───────────────── */
export interface Faq {
  question: string
  answer: string
}

export const faqs: Faq[] = [
  {
    question: 'Wie genau funktioniert die KI?',
    answer:
      'Du beschreibst dein Wunschprodukt in natürlicher Sprache. Unsere KI analysiert Stil, Funktion und Kontext und erzeugt daraus ein vollständiges Designkonzept inklusive Renderings, Maßen und Materialempfehlungen.',
  },
  {
    question: 'Was kostet die Nutzung?',
    answer:
      'Das Entwerfen und Visualisieren ist kostenlos. Erst wenn du ein Design tatsächlich fertigen lässt, fallen Kosten an – transparent und direkt mit dem Hersteller abgestimmt.',
  },
  {
    question: 'Sind die Hersteller geprüft?',
    answer:
      'Ja. Jeder Produktionspartner durchläuft einen Qualitäts- und Verifizierungsprozess. Bewertungen stammen ausschließlich von realen, abgeschlossenen Projekten.',
  },
  {
    question: 'Kann ich das Design anpassen?',
    answer:
      'Selbstverständlich. Du kannst jedes generierte Konzept iterativ verfeinern – Maße, Materialien, Farben und Details lassen sich beliebig anpassen, bis es perfekt ist.',
  },
  {
    question: 'Wie lange dauert die Fertigung?',
    answer:
      'Das hängt vom Produkt und Hersteller ab. Jeder Partner gibt eine geschätzte Lieferzeit an – typischerweise zwischen 2 und 8 Wochen für Maßanfertigungen.',
  },
]

/* ───────────────── Logo cloud ───────────────── */
export const trustedBy = [
  'Studio Norra',
  'Hoffmann Manufaktur',
  'Northbound',
  'Atelier Vidal',
  'Eichenwerk',
  'MetallForm',
]
