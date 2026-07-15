import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { AmbientScene } from '@/components/ui/AmbientScene'
import { cn } from '@/lib/utils'

/**
 * Vollflächige „KI denkt"-Ansicht: ersetzt den leeren Ladezustand. Zeigt eine
 * ruhige Timeline echter Arbeitsschritte, ein Live-Aktivitäts-Log, eine sichtbar
 * entstehende Skizze und ein Schritt für Schritt aufgebautes Konzept.
 *
 * Die Animation läuft eigenständig; sobald `ready` true wird (die echte
 * Generierung ist fertig), werden alle Schritte abgeschlossen, kurz „fertig"
 * gezeigt und danach `onDone()` aufgerufen.
 */
export function ProcessingView({
  prompt,
  ready,
  onDone,
}: {
  prompt: string
  ready: boolean
  onDone: () => void
}) {
  const p = prompt.toLowerCase()
  const materials = MATERIALS.filter(([k]) => p.includes(k)).map(([, l]) => l)
  const productType = PRODUCT_TYPES.find(([k]) => p.includes(k))?.[1] ?? null

  const steps = buildSteps(materials, productType)

  const [step, setStep] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [finished, setFinished] = useState(false)

  // Schritte ruhig durchlaufen (am letzten Schritt halten, bis `ready`).
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 2100)
    return () => clearInterval(t)
  }, [steps.length])

  // Live-Log strömt unabhängig ein.
  useEffect(() => {
    const t = setInterval(
      () => setLog((l) => (l.length < LOG.length ? [...l, LOG[l.length]] : l)),
      1300,
    )
    return () => clearInterval(t)
  }, [])

  // Abschluss, sobald die echte Generierung fertig ist.
  useEffect(() => {
    if (!ready) return
    const t1 = setTimeout(() => setStep(steps.length), 250)
    const t2 = setTimeout(() => setFinished(true), 750)
    const t3 = setTimeout(onDone, 2400)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [ready, onDone, steps.length])

  const progress = finished ? 1 : Math.min(step, steps.length - 1) / Math.max(1, steps.length - 1)

  return (
    <div className="relative min-h-[85vh]">
      <AmbientScene className="h-[70vh]" />
      <Container className="max-w-5xl py-16 sm:py-20">
        {/* Kopf */}
        <div className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center">
            <span className="animate-status absolute inline-flex h-full w-full rounded-full bg-accent-400/30" />
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-ink-950 text-white">
              <span className="text-shimmer text-[13px] font-semibold">AI</span>
            </span>
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink-950">
              {finished ? 'Dein Konzept ist fertig.' : 'IdeaForge entwickelt deine Idee'}
            </p>
            <p className="truncate text-sm text-ink-400">„{prompt}“</p>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          {/* Timeline + Live-Log */}
          <div>
            <Timeline steps={steps} step={step} finished={finished} />
            <div className="mt-8">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Live-Aktivität
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                <AnimatePresence initial={false}>
                  {log.slice(-5).map((line) => (
                    <motion.p
                      key={line}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-center gap-2 text-sm text-ink-500"
                    >
                      <span className="h-1 w-1 rounded-full bg-accent-500" />
                      {line}
                    </motion.p>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Skizze + Konzeptaufbau */}
          <div>
            <BuildingSketch progress={progress} finished={finished} />
            <ConceptAssembly step={step} finished={finished} />
          </div>
        </div>
      </Container>
    </div>
  )
}

/* ───────────── Inhalt ───────────── */

const MATERIALS: [string, string][] = [
  ['eiche', 'Eiche'],
  ['nussbaum', 'Nussbaum'],
  ['buche', 'Buche'],
  ['esche', 'Esche'],
  ['massivholz', 'Massivholz'],
  ['stahl', 'Stahl'],
  ['metall', 'Metall'],
  ['glas', 'Glas'],
  ['marmor', 'Marmor'],
  ['mdf', 'MDF'],
]
const PRODUCT_TYPES: [string, string][] = [
  ['tv', 'TV-Möbel'],
  ['sideboard', 'Sideboard'],
  ['esstisch', 'Esstisch'],
  ['schreibtisch', 'Schreibtisch'],
  ['tisch', 'Tisch'],
  ['kleiderschrank', 'Kleiderschrank'],
  ['schrank', 'Schrank'],
  ['regal', 'Regal'],
  ['kommode', 'Kommode'],
  ['nachttisch', 'Nachttisch'],
  ['bett', 'Bett'],
  ['bank', 'Bank'],
]

const LOG = [
  'Materialdatenbank durchsucht',
  '5 Designrichtungen gefunden',
  'Proportionen optimiert',
  'Fertigungsparameter berechnet',
  'Kostenmodell aktualisiert',
  'Variante „Preisbewusst" entworfen',
  'Variante „Standard" entworfen',
  'Variante „Premium" entworfen',
  'Konzeptblatt strukturiert',
  'Visualisierung vorbereitet',
]

function buildSteps(
  materials: string[],
  productType: string | null,
): { title: string; detail: string }[] {
  return [
    { title: 'Idee verstanden', detail: 'Wir analysieren deine Beschreibung.' },
    {
      title: 'Materialien abgestimmt',
      detail: materials.length
        ? `${materials.join(', ')} erkannt.`
        : 'Passende Materialien werden bestimmt.',
    },
    {
      title: 'Möbelart erkannt',
      detail: productType ? `${productType} erkannt.` : 'Der Einsatzbereich wird bestimmt.',
    },
    { title: 'Vergleichbare Umsetzungen', detail: 'Ähnliche Lösungen werden analysiert.' },
    { title: 'Designrichtungen entstehen', detail: 'Mehrere Entwürfe werden entwickelt.' },
    { title: 'Maße werden berechnet', detail: 'Proportionen werden optimiert.' },
    { title: 'Kosten werden geschätzt', detail: 'Material- und Fertigungskosten werden ermittelt.' },
    { title: 'Konzept wird zusammengeführt', detail: 'Alle Informationen fließen zusammen.' },
    { title: 'Visualisierung entsteht', detail: 'Die erste Skizze wird gezeichnet.' },
  ]
}

/* ───────────── Timeline ───────────── */

function Timeline({
  steps,
  step,
  finished,
}: {
  steps: { title: string; detail: string }[]
  step: number
  finished: boolean
}) {
  return (
    <ol className="flex flex-col">
      {steps.map((s, i) => {
        const done = finished || i < step
        const active = !finished && i === step
        const last = i === steps.length - 1
        return (
          <li key={s.title} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border transition-colors',
                  done
                    ? 'border-accent-600 bg-accent-600 text-white'
                    : active
                      ? 'border-accent-500'
                      : 'border-ink-200',
                )}
              >
                {done ? (
                  <Check size={12} />
                ) : active ? (
                  <span className="animate-status h-2 w-2 rounded-full bg-accent-500" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-ink-200" />
                )}
              </span>
              {!last && (
                <span
                  className={cn(
                    'my-1 w-px flex-1 transition-colors',
                    done ? 'bg-accent-200' : 'bg-ink-100',
                  )}
                />
              )}
            </div>
            <div className={cn('pb-5', last && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium transition-colors',
                  done ? 'text-ink-900' : active ? 'text-ink-950' : 'text-ink-400',
                )}
              >
                {active ? <span className="text-shimmer">{s.title}</span> : s.title}
              </p>
              {(active || done) && (
                <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{s.detail}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/* ───────────── Skizze entsteht ───────────── */

function BuildingSketch({ progress, finished }: { progress: number; finished: boolean }) {
  const showFill = progress > 0.42
  const showShadow = progress > 0.62
  const s = { stroke: 'var(--color-ink-800)', strokeWidth: 2, fill: 'none' } as const

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-soft">
      <AmbientScene />
      <svg viewBox="0 0 320 240" className="relative h-full w-full">
        {/* Schatten */}
        <ellipse
          cx="160"
          cy="206"
          rx="116"
          ry="11"
          fill="var(--color-ink-950)"
          style={{ opacity: showShadow ? 0.06 : 0, transition: 'opacity .8s ease' }}
        />
        {/* Materialfüllung */}
        <rect
          x="54"
          y="74"
          width="212"
          height="100"
          rx="8"
          fill="var(--color-ink-50)"
          style={{ opacity: showFill ? 1 : 0, transition: 'opacity .9s ease' }}
        />
        {/* Korpus */}
        <rect x="54" y="74" width="212" height="100" rx="8" pathLength={1} className="sketch-draw" {...s} style={{ animationDelay: '.1s' }} strokeLinejoin="round" />
        {/* Deckplatte */}
        <rect x="46" y="62" width="228" height="12" rx="4" pathLength={1} className="sketch-draw" {...s} style={{ animationDelay: '.35s' }} strokeLinejoin="round" />
        {/* Türteilungen */}
        <line x1="126" y1="74" x2="126" y2="174" pathLength={1} className="sketch-draw" {...s} style={{ animationDelay: '.95s' }} strokeLinecap="round" />
        <line x1="194" y1="74" x2="194" y2="174" pathLength={1} className="sketch-draw" {...s} style={{ animationDelay: '1.1s' }} strokeLinecap="round" />
        {/* Beine */}
        <line x1="70" y1="174" x2="70" y2="192" pathLength={1} className="sketch-draw" {...s} style={{ animationDelay: '1.25s' }} strokeLinecap="round" />
        <line x1="250" y1="174" x2="250" y2="192" pathLength={1} className="sketch-draw" {...s} style={{ animationDelay: '1.35s' }} strokeLinecap="round" />
        {/* Griffe */}
        <line x1="112" y1="116" x2="112" y2="132" pathLength={1} className="sketch-draw" {...s} style={{ animationDelay: '1.5s' }} strokeLinecap="round" />
        <line x1="208" y1="116" x2="208" y2="132" pathLength={1} className="sketch-draw" {...s} style={{ animationDelay: '1.6s' }} strokeLinecap="round" />
      </svg>

      {/* sanfter Abschluss-Glanz */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"
        style={{ opacity: finished ? 1 : 0, transition: 'opacity 1s ease' }}
      />
      <span
        className="absolute bottom-3 left-4 text-[11px] text-ink-300"
        style={{ opacity: progress > 0.15 ? 1 : 0, transition: 'opacity .6s' }}
      >
        {finished ? 'Skizze fertig' : 'Skizze entsteht …'}
      </span>
    </div>
  )
}

/* ───────────── Konzept wird aufgebaut ───────────── */

const CONCEPT_FIELDS: { label: string; at: number }[] = [
  { label: 'Titel', at: 1 },
  { label: 'Produktbeschreibung', at: 2 },
  { label: 'Materialien', at: 3 },
  { label: 'Maße', at: 5 },
  { label: 'Herstellungsempfehlung', at: 6 },
  { label: 'Kostenschätzung', at: 7 },
  { label: 'Empfohlener Preis', at: 7 },
  { label: 'Markteinschätzung', at: 8 },
]

function ConceptAssembly({ step, finished }: { step: number; finished: boolean }) {
  return (
    <div className="mt-6 rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
        Konzeptblatt entsteht
      </p>
      <div className="mt-3 flex flex-col divide-y divide-ink-100">
        {CONCEPT_FIELDS.map((f) => {
          const visible = finished || step >= f.at
          return (
            <div
              key={f.label}
              className="flex items-center justify-between gap-4 py-2.5 transition-all duration-500"
              style={{ opacity: visible ? 1 : 0.25 }}
            >
              <span className={cn('text-sm', visible ? 'text-ink-700' : 'text-ink-300')}>
                {f.label}
              </span>
              {finished ? (
                <Check size={14} className="text-accent-600" />
              ) : visible ? (
                <span className="h-2.5 w-24 overflow-hidden rounded-full bg-ink-100">
                  <span className="text-shimmer block h-full w-full bg-ink-200" />
                </span>
              ) : (
                <span className="h-2.5 w-24 rounded-full bg-ink-50" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
