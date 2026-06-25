import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  Factory,
  Hammer,
  Layers,
  Leaf,
  Ruler,
  Share2,
  Sparkles,
  Bookmark,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { RenderingPlaceholder } from '@/components/ui/RenderingPlaceholder'
import { designConcept as d } from '@/data/projects'
import { getIdea, requestSketch, type Idea } from '@/lib/ideas'
import {
  createOrder,
  customerOrderStatus,
  getOrderByIdea,
  type Order,
} from '@/lib/orders'
import { formatEUR } from '@/lib/utils'
import { cn } from '@/lib/utils'

const views = [
  { variant: 'cabinet' as const, label: 'Frontansicht' },
  { variant: 'table' as const, label: 'Perspektive' },
  { variant: 'lamp' as const, label: 'Detail · LED' },
  { variant: 'sofa' as const, label: 'Im Raum' },
]

export function Result() {
  const { id } = useParams()
  const [active, setActive] = useState(0)
  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [retrying, setRetrying] = useState(false)
  // Auftrag aus dieser Idee ("Jetzt anfertigen lassen").
  const [ordering, setOrdering] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)

  // Idee laden; solange die Skizze noch generiert wird ('pending'), nachpollen.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = async () => {
      try {
        const next = await getIdea(id)
        if (cancelled) return
        setIdea(next)
        setLoading(false)
        if (next.status === 'pending') timer = setTimeout(load, 2500)
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    setLoading(true)
    load()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [id])

  // Erneuter Versuch nach einem Fehler.
  const retry = async () => {
    if (!id) return
    setRetrying(true)
    try {
      setIdea(await requestSketch(id))
    } catch (e) {
      setIdea((prev) =>
        prev
          ? {
              ...prev,
              status: 'failed',
              error: e instanceof Error ? e.message : 'Fehlgeschlagen.',
            }
          : prev,
      )
    } finally {
      setRetrying(false)
    }
  }

  // 1) Bestehenden Auftrag zur Idee einmalig laden, sobald sie fertig ist.
  useEffect(() => {
    if (!idea || idea.status !== 'generated') return
    let cancelled = false
    getOrderByIdea(idea.id)
      .then((o) => {
        if (!cancelled) setOrder(o)
      })
      .catch(() => {
        /* Auftragsanzeige ist optional */
      })
    return () => {
      cancelled = true
    }
  }, [idea])

  // 2) Solange der Auftrag offen ('submitted') ist, Status nachpollen –
  //    so wird eine Annahme durch einen Hersteller live sichtbar. Greift auch
  //    direkt nach dem Klick auf "Jetzt anfertigen lassen".
  useEffect(() => {
    const ideaId = idea?.id
    if (!ideaId || order?.status !== 'submitted') return
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const next = await getOrderByIdea(ideaId)
        if (!cancelled) setOrder(next)
      } catch {
        /* ignorieren */
      }
    }, 4000)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [order?.status, order?.id, idea?.id])

  const status = idea?.status
  // Auftrag erst möglich, wenn die echte Idee fertig generiert ist.
  const canOrder = Boolean(idea && status === 'generated')

  const placeOrder = async () => {
    if (!idea) return
    setOrdering(true)
    setOrderError(null)
    try {
      const created = await createOrder({
        ideaId: idea.id,
        description: idea.prompt,
        conceptSheetUrl: idea.concept_sheet_url ?? idea.image_url,
        previewImageUrl: idea.preview_image_url,
        concept: idea.concept,
      })
      setOrder(created)
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : 'Auftrag fehlgeschlagen.')
    } finally {
      setOrdering(false)
    }
  }

  // Strukturierte KI-Spec (Quelle für Titel, Maße, Material, Preis …).
  const spec = idea?.concept ?? null

  // Anzeige-Werte: echte Spec wenn vorhanden, sonst Demo-Daten (d).
  const displayTitle = spec?.titel ?? (idea ? 'Dein Design' : d.title)
  const displayTagline = spec
    ? [spec.kategorie, ...spec.farben].filter(Boolean).join(' · ')
    : idea
      ? idea.prompt
      : d.tagline
  const summary = spec?.kurzbeschreibung || (idea ? idea.prompt : d.summary)
  const materials = spec
    ? spec.materialien.map((m) => ({ name: m.bauteil, value: m.material }))
    : d.materials
  const dimensions = spec ? specDimensions(spec) : d.dimensions
  const properties = spec
    ? [...spec.besondere_details, ...(spec.konstruktion ? [spec.konstruktion] : [])]
    : d.properties

  // Themenfremde Eingabe (kein Möbelstück) → freundlicher Hinweis, kein Design.
  if (status === 'rejected') {
    return <RejectedView message={idea?.error ?? null} />
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-cream to-white" />

      <Container className="py-14 sm:py-16">
        <Reveal>
          <div className="flex flex-wrap items-center gap-3">
            {status === 'failed' ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3.5 py-1.5 text-sm font-medium text-red-600">
                Generierung fehlgeschlagen
              </span>
            ) : status === 'pending' || (loading && id) ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1.5 text-sm font-medium text-amber-600">
                <Sparkles size={14} className="animate-spin" /> Bilder werden
                generiert…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-sm font-medium text-emerald-600">
                <Check size={14} /> Design generiert
              </span>
            )}
            <span className="text-sm text-ink-400">Schritt 2 von 3</span>
          </div>
          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-balance text-4xl font-semibold leading-[1.05] text-ink-950 sm:text-5xl">
                {displayTitle}
              </h1>
              <p className="mt-3 text-lg text-ink-500">{displayTagline}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">
                <Bookmark size={16} /> Speichern
              </Button>
              <Button variant="secondary" size="sm">
                <Share2 size={16} /> Teilen
              </Button>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* gallery */}
          <Reveal>
            <div className="flex flex-col gap-4">
              {id ? (
                <SketchView
                  idea={idea}
                  loading={loading}
                  retrying={retrying}
                  onRetry={retry}
                />
              ) : (
                <>
                  <RenderingPlaceholder
                    variant={views[active].variant}
                    className="shadow-lift"
                  />
                  <div className="grid grid-cols-4 gap-3">
                    {views.map((v, i) => (
                      <button
                        key={v.label}
                        onClick={() => setActive(i)}
                        className={cn(
                          'overflow-hidden rounded-xl border-2 transition-all',
                          active === i
                            ? 'border-accent-600 ring-2 ring-accent-100'
                            : 'border-transparent opacity-70 hover:opacity-100',
                        )}
                      >
                        <RenderingPlaceholder variant={v.variant} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Reveal>

          {/* summary / pricing */}
          <Reveal delay={0.08}>
            <Card className="sticky top-24 p-7">
              <div className="flex items-center gap-2 text-sm font-medium text-ink-500">
                <Sparkles size={15} className="text-accent-600" /> Geschätzter Preis
              </div>
              {spec ? (
                <>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-3xl font-semibold text-ink-950">
                      ca. {formatEUR(spec.preis.min)} – {formatEUR(spec.preis.max)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-400">{spec.preis.hinweis}</p>

                  <div className="mt-6 space-y-2.5 border-t border-ink-100 pt-5 text-sm">
                    <Factor label="Komplexität" value={spec.komplexitaet} />
                    <Factor
                      label="Bauteile"
                      value={String(spec.anzahl_bauteile)}
                    />
                    <Factor
                      label="Fertigungsaufwand"
                      value={`${spec.fertigungsaufwand_stunden} h`}
                    />
                  </div>

                  <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
                    Dies ist eine automatische Schätzung zur Orientierung und
                    ersetzt kein finales Angebot eines Herstellers.
                  </p>
                </>
              ) : (
                <>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-4xl font-semibold text-ink-950">
                      {formatEUR(d.pricing.estimate)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-400">
                    Spanne {d.pricing.range}
                  </p>

                  <div className="mt-6 space-y-2.5 border-t border-ink-100 pt-5">
                    {d.pricing.breakdown.map((b) => (
                      <div
                        key={b.label}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-ink-500">{b.label}</span>
                        <span className="font-medium text-ink-900">
                          {formatEUR(b.value)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl bg-ink-50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-ink-600">
                        <Factory size={15} /> Produktionskosten
                      </span>
                      <span className="font-semibold text-ink-950">
                        {formatEUR(d.pricing.production)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {order ? (
                <OrderStatusCard order={order} />
              ) : canOrder ? (
                <>
                  <Button
                    size="lg"
                    onClick={placeOrder}
                    disabled={ordering}
                    className="group mt-6 w-full"
                  >
                    <Hammer size={18} />
                    {ordering ? 'Wird gesendet …' : 'Jetzt anfertigen lassen'}
                    <ArrowRight
                      size={18}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </Button>
                  {orderError && (
                    <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-center text-xs text-red-700">
                      {orderError}
                    </p>
                  )}
                  <p className="mt-3 text-center text-xs text-ink-400">
                    Unverbindlich · wir finden den passenden Hersteller
                  </p>
                </>
              ) : (
                <>
                  <Button to="/manufacturers" size="lg" className="group mt-6 w-full">
                    Hersteller finden
                    <ArrowRight
                      size={18}
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </Button>
                  <p className="mt-3 text-center text-xs text-ink-400">
                    6 passende Partner in deiner Region
                  </p>
                </>
              )}
            </Card>
          </Reveal>
        </div>

        {/* description */}
        <Reveal>
          <Card className="mt-8 p-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
              <Box size={18} className="text-accent-600" /> Designbeschreibung
            </h2>
            <p className="mt-4 max-w-3xl text-pretty text-[1.05rem] leading-relaxed text-ink-600">
              {summary}
            </p>
          </Card>
        </Reveal>

        {/* detail grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* materials */}
          <Reveal>
            <Card className="h-full p-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
                <Layers size={18} className="text-accent-600" /> Materialien
              </h2>
              <dl className="mt-5 divide-y divide-ink-100">
                {materials.map((m) => (
                  <div
                    key={m.name}
                    className="flex items-center justify-between py-3"
                  >
                    <dt className="text-sm text-ink-500">{m.name}</dt>
                    <dd className="text-sm font-medium text-ink-900">
                      {m.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          </Reveal>

          {/* dimensions + properties */}
          <Reveal delay={0.06}>
            <Card className="h-full p-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
                <Ruler size={18} className="text-accent-600" /> Maße & Eigenschaften
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {dimensions.map((dim) => (
                  <div
                    key={dim.label}
                    className="rounded-xl border border-ink-100 bg-ink-50/50 p-4"
                  >
                    <p className="text-xs text-ink-400">{dim.label}</p>
                    <p className="mt-1 text-xl font-semibold text-ink-950">
                      {dim.value}
                    </p>
                  </div>
                ))}
              </div>
              <ul className="mt-5 space-y-2.5">
                {properties.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-ink-600">
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-500"
                    />
                    {p}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>

        {/* sustainability (nur Demo-Ansicht ohne echte Spec) */}
        {!spec && (
        <Reveal>
          <Card className="mt-8 overflow-hidden p-0">
            <div className="grid gap-0 md:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center justify-center gap-3 bg-emerald-50 p-8 md:w-64">
                <div className="relative flex h-28 w-28 items-center justify-center">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="#d1fae5"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="44"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 44}
                      strokeDashoffset={
                        2 * Math.PI * 44 * (1 - d.sustainability.score / 100)
                      }
                    />
                  </svg>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-emerald-700">
                      {d.sustainability.score}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide text-emerald-600">
                      Score
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                  <Leaf size={15} /> {d.sustainability.label}
                </span>
              </div>
              <div className="p-8">
                <h2 className="text-lg font-semibold text-ink-950">
                  Nachhaltigkeit
                </h2>
                <p className="mt-2 text-sm text-ink-500">
                  Transparente Bewertung zu Material, Langlebigkeit und Herkunft.
                </p>
                <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                  {d.sustainability.points.map((p) => (
                    <li
                      key={p}
                      className="flex items-start gap-2.5 text-sm text-ink-600"
                    >
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0 text-emerald-500"
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </Reveal>
        )}
      </Container>
    </div>
  )
}

/* ───────────── Hilfsfunktionen & Teilkomponenten ───────────── */

/** Wandelt die Maße der Spec in {label, value}-Paare für die Anzeige. */
function specDimensions(spec: NonNullable<Idea['concept']>): {
  label: string
  value: string
}[] {
  const dims: { label: string; value: string }[] = []
  if (spec.masse.breite_cm) dims.push({ label: 'Breite', value: `${spec.masse.breite_cm} cm` })
  if (spec.masse.hoehe_cm) dims.push({ label: 'Höhe', value: `${spec.masse.hoehe_cm} cm` })
  if (spec.masse.tiefe_cm) dims.push({ label: 'Tiefe', value: `${spec.masse.tiefe_cm} cm` })
  for (const w of spec.masse.weitere ?? []) dims.push({ label: w.label, value: w.wert })
  return dims
}

/** Eine Preis-Einflussgröße (Label + Wert) in der Preis-Card. */
function Factor({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium capitalize text-ink-900">{value}</span>
    </div>
  )
}

/** Freundliche Ablehnung für themenfremde Eingaben (kein Möbelstück). */
function RejectedView({ message }: { message: string | null }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-cream to-white" />
      <Container className="max-w-xl py-20">
        <Reveal>
          <Card className="p-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
              <Sparkles size={26} />
            </span>
            <h1 className="mt-5 text-2xl font-semibold text-ink-950">
              Das ist (noch) kein Möbelstück
            </h1>
            <p className="mt-3 text-pretty leading-relaxed text-ink-500">
              {message ??
                'IdeaForge ist aktuell ausschließlich auf die Entwicklung und Anfertigung von Möbelstücken spezialisiert. Bitte beschreibe ein Möbelstück, das du gestalten möchtest.'}
            </p>
            <Button to="/create" className="group mt-6">
              Neue Möbelidee beschreiben
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Button>
          </Card>
        </Reveal>
      </Container>
    </div>
  )
}

/* ───────────── Auftragsstatus (Kundensicht) ───────────── */

function OrderStatusCard({ order }: { order: Order }) {
  const { title, hint } = customerOrderStatus(order.status)
  const open = order.status === 'submitted'
  const rejected = order.status === 'rejected'
  const tone = rejected
    ? 'border-rose-100 bg-rose-50 text-rose-700'
    : open
      ? 'border-amber-100 bg-amber-50 text-amber-700'
      : 'border-emerald-100 bg-emerald-50 text-emerald-700'
  return (
    <div className={cn('mt-6 rounded-2xl border p-5 text-center', tone)}>
      {open ? (
        <Sparkles size={22} className="mx-auto animate-spin" />
      ) : rejected ? (
        <ArrowRight size={22} className="mx-auto rotate-180" />
      ) : (
        <CheckCircle2 size={22} className="mx-auto" />
      )}
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs opacity-90">{hint}</p>
      <Link
        to="/dashboard"
        className="mt-3 inline-block text-sm font-medium underline-offset-2 hover:underline"
      >
        Zu deinen Aufträgen
      </Link>
    </div>
  )
}

/* ───────────── generierte Konzeptskizze ───────────── */

function SketchView({
  idea,
  loading,
  retrying,
  onRetry,
}: {
  idea: Idea | null
  loading: boolean
  retrying: boolean
  onRetry: () => void
}) {
  // Lädt noch / wird gerade generiert.
  if (loading || retrying || !idea || idea.status === 'pending') {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-ink-100 bg-white shadow-lift">
        <Sparkles size={28} className="animate-spin text-accent-600" />
        <p className="text-sm text-ink-500">
          Deine Produktvorschau &amp; dein Konzeptblatt werden erzeugt…
        </p>
      </div>
    )
  }

  // Fehlgeschlagen → Ursache + erneuter Versuch.
  if (idea.status === 'failed') {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 rounded-2xl border border-red-100 bg-red-50/60 p-6 text-center">
        <p className="text-sm font-medium text-red-700">
          Die Bilder konnten nicht generiert werden.
        </p>
        {idea.error && (
          <p className="max-w-md text-xs text-red-500">{idea.error}</p>
        )}
        <Button size="sm" onClick={onRetry}>
          Erneut versuchen
          <ArrowRight size={16} />
        </Button>
      </div>
    )
  }

  // Erfolgreich → zuerst die fotorealistische Vorschau, darunter das Konzeptblatt.
  // (concept_sheet_url fällt für ältere Ideen auf image_url zurück.)
  const previewUrl = idea.preview_image_url
  const conceptUrl = idea.concept_sheet_url ?? idea.image_url
  if (previewUrl || conceptUrl) {
    return (
      <div className="flex flex-col gap-6">
        {previewUrl && (
          <SheetFigure
            src={previewUrl}
            alt="Fotorealistische Produktvorschau"
            caption="Fotorealistische Produktvorschau · zum Vergrößern anklicken"
          />
        )}
        {conceptUrl && (
          <SheetFigure
            src={conceptUrl}
            alt="Technisches Konzeptblatt"
            caption="Technisches Konzeptblatt · zum Vergrößern anklicken"
          />
        )}
      </div>
    )
  }

  // Fallback (sollte praktisch nicht eintreten).
  return <RenderingPlaceholder variant="cabinet" className="shadow-lift" />
}

/** Ein generiertes Bild: klickbar in voller Auflösung, mit Bildunterschrift. */
function SheetFigure({
  src,
  alt,
  caption,
}: {
  src: string
  alt: string
  caption: string
}) {
  return (
    <figure className="flex flex-col gap-2">
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <img
          src={src}
          alt={alt}
          className="aspect-[4/3] w-full rounded-2xl border border-ink-100 bg-white object-contain p-2 shadow-lift transition-shadow group-hover:shadow-float"
        />
      </a>
      <figcaption className="text-center text-xs text-ink-400">
        {caption}
      </figcaption>
    </figure>
  )
}
