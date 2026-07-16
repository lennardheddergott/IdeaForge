import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { AmbientScene } from '@/components/ui/AmbientScene'
import { cn } from '@/lib/utils'

/**
 * Vollflächige „KI denkt"-Ansicht: ersetzt den leeren Ladezustand. Zeigt eine
 * ruhige Timeline echter Arbeitsschritte, ein Live-Aktivitäts-Log, eine sichtbar
 * entstehende – zum erkannten Möbel passende – Skizze und ein Schritt für Schritt
 * aufgebautes Konzept.
 *
 * Timing-Philosophie: Die Animation läuft eigenständig und respektiert eine
 * Mindest-Spielzeit, damit der Abschluss nie hart abschneidet, wenn die echte
 * Generierung schnell ist. Dauert sie länger, hält die Ansicht ruhig am letzten
 * Schritt, bis `ready` true wird – dann werden alle Schritte sauber abgeschlossen,
 * kurz „fertig" gezeigt und danach `onDone()` aufgerufen.
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
  return (
    <div className="relative min-h-[85vh]">
      <AmbientScene className="h-[70vh]" />
      <Container className="max-w-5xl py-16 sm:py-20">
        <ProcessingBody prompt={prompt} ready={ready} onDone={onDone} withHeader />
      </Container>
    </div>
  )
}

/**
 * Wiederverwendbarer Kern der KI-Arbeitsansicht – ohne Seiten-Chrome (kein
 * min-height, kein Container). Wird sowohl von der eigenständigen `ProcessingView`
 * (Route /create) als auch inline im Landing-Workspace genutzt, damit sich der
 * Ablauf wie eine einzige durchgehende Erfahrung ohne Seitenwechsel anfühlt.
 */
export function ProcessingBody({
  prompt,
  ready,
  onDone,
  withHeader = false,
}: {
  prompt: string
  ready: boolean
  onDone: () => void
  withHeader?: boolean
}) {
  const p = prompt.toLowerCase()
  const materials = MATERIALS.filter(([k]) => p.includes(k)).map(([, l]) => l)
  const productType = PRODUCT_TYPES.find(([k]) => p.includes(k))?.[1] ?? null
  const shape = useMemo(() => detectShape(p), [p])

  const steps = useMemo(() => buildSteps(materials, productType), [materials, productType])
  const logLines = useMemo(() => buildLog(materials, productType), [materials, productType])

  const [step, setStep] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [finished, setFinished] = useState(false)
  // Mindest-Spielzeit: die Inszenierung läuft immer kurz, auch wenn die echte
  // Generierung sofort fertig wäre – so wirkt der Abschluss nie abgeschnitten.
  const [minPlayed, setMinPlayed] = useState(false)
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  // Schritte ruhig durchlaufen (am vorletzten Schritt halten, bis `ready`).
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 2100)
    return () => clearInterval(t)
  }, [steps.length])

  // Live-Log strömt unabhängig ein und wiederholt sich am Ende ruhig.
  useEffect(() => {
    const t = setInterval(
      () => setLog((l) => (l.length < logLines.length ? [...l, logLines[l.length]] : l)),
      1250,
    )
    return () => clearInterval(t)
  }, [logLines])

  // Mindest-Spielzeit freischalten.
  useEffect(() => {
    const t = setTimeout(() => setMinPlayed(true), 4200)
    return () => clearTimeout(t)
  }, [])

  // Abschluss, sobald die echte Generierung fertig ist UND die Mindestzeit lief.
  useEffect(() => {
    if (!ready || !minPlayed) return
    const t1 = setTimeout(() => setStep(steps.length), 300)
    const t2 = setTimeout(() => setFinished(true), 850)
    const t3 = setTimeout(() => onDoneRef.current(), 2600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [ready, minPlayed, steps.length])

  const progress = finished ? 1 : Math.min(step, steps.length - 1) / Math.max(1, steps.length - 1)
  // Solange die echte Generierung noch läuft, deckeln wir den sichtbaren
  // Fortschritt knapp unter 100 % – das signalisiert „arbeitet noch".
  const shownProgress = finished ? 1 : Math.min(progress, 0.94)

  return (
    <>
      {/* Kopf (nur außerhalb des Workspace) */}
      {withHeader && (
        <div className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center">
            <span className="animate-status absolute inline-flex h-full w-full rounded-full bg-accent-400/30" />
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-ink-950 text-white">
              <span className="text-shimmer text-[13px] font-semibold">AI</span>
            </span>
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink-950">
              {finished
                ? 'Dein Konzept ist fertig.'
                : productType
                  ? `Faiviq entwickelt dein ${productType}`
                  : 'Faiviq entwickelt deine Idee'}
            </p>
            <p className="truncate text-sm text-ink-400">„{prompt}“</p>
          </div>
        </div>
      )}

      {/* Feiner Gesamtfortschritt */}
      <div className={cn('h-1 w-full overflow-hidden rounded-full bg-ink-100', withHeader && 'mt-6')}>
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-500 to-violet-accent"
          style={{
            width: `${Math.round(shownProgress * 100)}%`,
            transition: 'width 1.6s var(--ease-smooth)',
          }}
        />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        {/* Timeline + Live-Log */}
        <div>
          <Timeline steps={steps} step={step} finished={finished} />
          <div className="mt-8">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-400">
              <span className="animate-status h-1.5 w-1.5 rounded-full bg-accent-500" />
              Live-Aktivität
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              <AnimatePresence initial={false}>
                {log.slice(-5).map((line, i) => (
                  <motion.p
                    key={`${line}-${log.length - 5 + i}`}
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
          <BuildingSketch shape={shape} progress={progress} finished={finished} />
          <ConceptAssembly step={step} finished={finished} />
        </div>
      </div>
    </>
  )
}

/* ───────────── Inhalt ───────────── */

const MATERIALS: [string, string][] = [
  ['eiche', 'Eiche'],
  ['nussbaum', 'Nussbaum'],
  ['walnuss', 'Nussbaum'],
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
  ['couchtisch', 'Couchtisch'],
  ['nachttisch', 'Nachttisch'],
  ['tisch', 'Tisch'],
  ['kleiderschrank', 'Kleiderschrank'],
  ['schrank', 'Schrank'],
  ['regal', 'Regal'],
  ['kommode', 'Kommode'],
  ['bett', 'Bett'],
  ['sofa', 'Sofa'],
  ['sessel', 'Sessel'],
  ['stuhl', 'Stuhl'],
  ['bank', 'Bank'],
]

/** Möbelart → Skizzen-Silhouette. Reihenfolge: spezifisch vor generisch. */
type Shape = 'cabinet' | 'table' | 'roundTable' | 'desk' | 'shelf' | 'bed' | 'seating'
const SHAPE_KEYS: [string, Shape][] = [
  ['tv', 'cabinet'],
  ['sideboard', 'cabinet'],
  ['kommode', 'cabinet'],
  ['kleiderschrank', 'cabinet'],
  ['schrank', 'cabinet'],
  ['regal', 'shelf'],
  ['bücherregal', 'shelf'],
  ['schreibtisch', 'desk'],
  ['couchtisch', 'table'],
  ['nachttisch', 'table'],
  ['esstisch', 'table'],
  ['tisch', 'table'],
  ['bett', 'bed'],
  ['sofa', 'seating'],
  ['couch', 'seating'],
  ['sessel', 'seating'],
  ['stuhl', 'seating'],
  ['bank', 'seating'],
  ['hocker', 'seating'],
]
function detectShape(p: string): Shape {
  const round = /\brund|kreis|oval/.test(p)
  for (const [kw, sh] of SHAPE_KEYS) {
    if (p.includes(kw)) return sh === 'table' && round ? 'roundTable' : sh
  }
  return 'cabinet'
}

function buildLog(materials: string[], productType: string | null): string[] {
  const mat = materials[0]
  return [
    'Beschreibung analysiert',
    mat ? `${mat} als Material erkannt` : 'Materialoptionen abgewogen',
    productType ? `Referenzen für ${productType} gesichtet` : 'Vergleichbare Umsetzungen gesichtet',
    'Proportionen & Ergonomie geprüft',
    'Konstruktion abgeleitet',
    'Fertigungsaufwand geschätzt',
    'Variante „Preisbewusst" kalkuliert',
    'Variante „Standard" kalkuliert',
    'Variante „Premium" kalkuliert',
    'Konzeptblatt strukturiert',
    'Visualisierung gerendert',
  ]
}

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

/* ───────────── Skizze entsteht (zum Möbel passend) ───────────── */

function BuildingSketch({
  shape,
  progress,
  finished,
}: {
  shape: Shape
  progress: number
  finished: boolean
}) {
  const showFill = progress > 0.42
  const showShadow = progress > 0.62

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-soft">
      <AmbientScene />
      <svg
        viewBox="0 0 320 240"
        className="relative h-full w-full"
        style={{
          transform: finished ? 'scale(1.015)' : 'scale(1)',
          transition: 'transform 1.2s var(--ease-smooth)',
        }}
      >
        {/* Bodenschatten */}
        <ellipse
          cx="160"
          cy="208"
          rx="118"
          ry="10"
          fill="var(--color-ink-950)"
          style={{ opacity: showShadow ? 0.06 : 0, transition: 'opacity .8s ease' }}
        />
        <Silhouette shape={shape} showFill={showFill} />
      </svg>

      {/* sanfter Abschluss-Glanz */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"
        style={{ opacity: finished ? 1 : 0, transition: 'opacity 1s ease' }}
      />

      {/* Fortschrittslinie unten */}
      <div className="pointer-events-none absolute inset-x-4 bottom-3 flex items-center gap-3">
        <span className="text-[11px] text-ink-300">
          {finished ? 'Skizze fertig' : 'Skizze entsteht …'}
        </span>
        <span className="h-px flex-1 overflow-hidden bg-ink-100">
          <span
            className="block h-full bg-accent-400"
            style={{
              width: `${Math.round((finished ? 1 : Math.min(progress, 0.94)) * 100)}%`,
              transition: 'width 1.6s var(--ease-smooth)',
            }}
          />
        </span>
      </div>
    </div>
  )
}

/** Gemeinsamer Strichstil aller Skizzen. */
const STROKE = { stroke: 'var(--color-ink-800)', strokeWidth: 2, fill: 'none' } as const
const FILL = 'var(--color-ink-50)'
const fillStyle = (show: boolean) => ({
  opacity: show ? 1 : 0,
  transition: 'opacity .9s ease',
})

/** Zeichnet die zur Möbelart passende Silhouette (Linien werden „gezeichnet"). */
function Silhouette({ shape, showFill }: { shape: Shape; showFill: boolean }) {
  switch (shape) {
    case 'table':
      return (
        <>
          <rect x="48" y="86" width="224" height="16" rx="5" fill={FILL} style={fillStyle(showFill)} />
          <rect x="44" y="84" width="232" height="18" rx="5" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.1s' }} strokeLinejoin="round" />
          <line x1="60" y1="106" x2="260" y2="106" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.45s' }} strokeLinecap="round" />
          <line x1="70" y1="102" x2="70" y2="190" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.6s' }} strokeLinecap="round" />
          <line x1="250" y1="102" x2="250" y2="190" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.72s' }} strokeLinecap="round" />
          <line x1="120" y1="106" x2="120" y2="190" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.86s' }} strokeLinecap="round" />
          <line x1="200" y1="106" x2="200" y2="190" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.98s' }} strokeLinecap="round" />
        </>
      )
    case 'roundTable':
      return (
        <>
          <ellipse cx="160" cy="94" rx="112" ry="22" fill={FILL} style={fillStyle(showFill)} />
          <ellipse cx="160" cy="94" rx="112" ry="22" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.1s' }} />
          <line x1="146" y1="112" x2="130" y2="184" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.55s' }} strokeLinecap="round" />
          <line x1="174" y1="112" x2="190" y2="184" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.68s' }} strokeLinecap="round" />
          <ellipse cx="160" cy="186" rx="48" ry="9" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.95s' }} />
        </>
      )
    case 'desk':
      return (
        <>
          <rect x="48" y="86" width="224" height="14" rx="4" fill={FILL} style={fillStyle(showFill)} />
          <rect x="46" y="84" width="228" height="16" rx="4" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.1s' }} strokeLinejoin="round" />
          <line x1="72" y1="100" x2="72" y2="190" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.5s' }} strokeLinecap="round" />
          <line x1="116" y1="100" x2="116" y2="190" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.62s' }} strokeLinecap="round" />
          <rect x="196" y="100" width="62" height="90" rx="4" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.8s' }} strokeLinejoin="round" />
          <line x1="200" y1="128" x2="254" y2="128" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '1s' }} strokeLinecap="round" />
          <line x1="200" y1="156" x2="254" y2="156" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '1.12s' }} strokeLinecap="round" />
        </>
      )
    case 'shelf':
      return (
        <>
          <rect x="92" y="48" width="136" height="148" rx="4" fill={FILL} style={fillStyle(showFill)} />
          <rect x="92" y="48" width="136" height="148" rx="4" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.1s' }} strokeLinejoin="round" />
          <line x1="92" y1="86" x2="228" y2="86" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.55s' }} strokeLinecap="round" />
          <line x1="92" y1="123" x2="228" y2="123" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.7s' }} strokeLinecap="round" />
          <line x1="92" y1="160" x2="228" y2="160" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.85s' }} strokeLinecap="round" />
          <line x1="160" y1="123" x2="160" y2="196" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '1s' }} strokeLinecap="round" />
        </>
      )
    case 'bed':
      return (
        <>
          <rect x="50" y="142" width="222" height="38" rx="6" fill={FILL} style={fillStyle(showFill)} />
          <rect x="50" y="140" width="222" height="42" rx="8" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.1s' }} strokeLinejoin="round" />
          <rect x="50" y="92" width="22" height="90" rx="4" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.4s' }} strokeLinejoin="round" />
          <rect x="86" y="150" width="64" height="22" rx="6" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.75s' }} strokeLinejoin="round" />
          <line x1="66" y1="182" x2="66" y2="194" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.95s' }} strokeLinecap="round" />
          <line x1="262" y1="182" x2="262" y2="194" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '1.05s' }} strokeLinecap="round" />
        </>
      )
    case 'seating':
      return (
        <>
          <rect x="66" y="120" width="188" height="58" rx="12" fill={FILL} style={fillStyle(showFill)} />
          <rect x="66" y="128" width="188" height="50" rx="12" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.1s' }} strokeLinejoin="round" />
          <rect x="66" y="92" width="188" height="42" rx="12" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.35s' }} strokeLinejoin="round" />
          <line x1="160" y1="132" x2="160" y2="172" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.8s' }} strokeLinecap="round" />
          <line x1="82" y1="178" x2="82" y2="192" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.95s' }} strokeLinecap="round" />
          <line x1="238" y1="178" x2="238" y2="192" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '1.05s' }} strokeLinecap="round" />
        </>
      )
    case 'cabinet':
    default:
      return (
        <>
          <rect x="54" y="74" width="212" height="100" rx="8" fill={FILL} style={fillStyle(showFill)} />
          <rect x="54" y="74" width="212" height="100" rx="8" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.1s' }} strokeLinejoin="round" />
          <rect x="46" y="62" width="228" height="12" rx="4" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.35s' }} strokeLinejoin="round" />
          <line x1="126" y1="74" x2="126" y2="174" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '.95s' }} strokeLinecap="round" />
          <line x1="194" y1="74" x2="194" y2="174" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '1.1s' }} strokeLinecap="round" />
          <line x1="70" y1="174" x2="70" y2="192" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '1.25s' }} strokeLinecap="round" />
          <line x1="250" y1="174" x2="250" y2="192" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '1.35s' }} strokeLinecap="round" />
          <line x1="112" y1="116" x2="112" y2="132" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '1.5s' }} strokeLinecap="round" />
          <line x1="208" y1="116" x2="208" y2="132" pathLength={1} className="sketch-draw" {...STROKE} style={{ animationDelay: '1.6s' }} strokeLinecap="round" />
        </>
      )
  }
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
