import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  FileText,
  ImagePlus,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { Toast } from '@/components/ui/Toast'
import { RenderingPlaceholder } from '@/components/ui/RenderingPlaceholder'
import { AmbientScene } from '@/components/ui/AmbientScene'
import { AiActivityStream, GenerationOverlay } from '@/components/ui/AiActivity'
import {
  createVersion,
  getIdea,
  listVersions,
  requestSketch,
  type Idea,
} from '@/lib/ideas'
import { customerOrderStatus, getOrderByIdea, type Order } from '@/lib/orders'
import { buildVariants, type Variant, type VariantTier } from '@/lib/variants'
import {
  estimateVariant,
  formatRange,
  loadManufacturerOffers,
  type ManufacturerOffer,
} from '@/lib/estimate'
import { cn } from '@/lib/utils'

const STEPS = ['Idee', 'Entwurf', 'Bearbeiten', 'Perfekt', 'Bestellung']
const DESIGN_STAGES = [
  'Idee wird verstanden',
  'Design wird entworfen',
  'Maße & Material werden festgelegt',
  'Visualisierung wird gerendert',
  'Preis wird berechnet',
]
const CHANGE_STAGES = [
  'Änderung wird verstanden',
  'Design wird angepasst',
  'Konzeptblatt wird aktualisiert',
  'Preis & Varianten werden neu berechnet',
]
const CONCEPT_AREAS = [
  'Maße',
  'Material',
  'Beschläge',
  'Türen',
  'Schubladen',
  'Konstruktion',
] as const

export function Result() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(Boolean(id))
  const [retrying, setRetrying] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [versions, setVersions] = useState<Idea[]>([])
  const [selectedTier, setSelectedTier] = useState<VariantTier | null>(null)
  const [changeText, setChangeText] = useState('')
  const [sketches, setSketches] = useState<File[]>([])
  const [applying, setApplying] = useState(false)
  const [conceptOpen, setConceptOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  // Herstellerangebote (einzige Preisquelle); null = wird geladen.
  const [offers, setOffers] = useState<ManufacturerOffer[] | null>(null)

  // Idee laden; solange sie generiert wird ('pending'), nachpollen.
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
    setSelectedTier(null)
    load()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [id])

  // Herstellerangebote einmalig laden – Basis der Preisspanne.
  useEffect(() => {
    let cancelled = false
    loadManufacturerOffers()
      .then((o) => !cancelled && setOffers(o))
      .catch(() => !cancelled && setOffers([]))
    return () => {
      cancelled = true
    }
  }, [])

  const retry = async () => {
    if (!id) return
    setRetrying(true)
    try {
      setIdea(await requestSketch(id))
    } catch (e) {
      setIdea((prev) =>
        prev
          ? { ...prev, status: 'failed', error: e instanceof Error ? e.message : 'Fehlgeschlagen.' }
          : prev,
      )
    } finally {
      setRetrying(false)
    }
  }

  // Versionskette laden (bei Wechsel der angezeigten Version).
  useEffect(() => {
    if (!idea) return
    let cancelled = false
    listVersions(idea)
      .then((v) => !cancelled && setVersions(v))
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // Bewusst nur bei Wechsel der Version/Status neu laden (nicht bei jedem Poll-Objekt).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idea?.id, idea?.status])

  // Bestehenden Auftrag laden + offenen Status nachpollen.
  useEffect(() => {
    if (!idea || idea.status !== 'generated') return
    let cancelled = false
    getOrderByIdea(idea.id)
      .then((o) => !cancelled && setOrder(o))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [idea])
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
  const generated = status === 'generated'
  const canOrder = Boolean(idea && generated)
  const spec = idea?.concept ?? null
  const variants = spec ? buildVariants(spec) : null
  const activeTier: VariantTier =
    selectedTier ?? variants?.find((v) => v.recommended)?.tier ?? 'standard'

  // Preis-Label einer Variante – ausschließlich aus der Herstellerkalkulation.
  const priceLabel = (v: Variant): string => {
    if (!spec) return ''
    if (offers === null) return 'Preis wird berechnet …'
    const r = estimateVariant(spec, v, offers)
    return r ? formatRange(r) : 'Preis auf Anfrage'
  }

  const goToCheckout = () => {
    if (idea) navigate(`/checkout/${idea.id}?variant=${activeTier}`)
  }

  // Änderung anwenden → neue Version erzeugen + neu generieren + hinwechseln.
  const applyChange = async () => {
    if (!idea) return
    const text = changeText.trim() || (sketches.length ? 'Neue Skizze als Referenz' : '')
    if (!text) return
    setApplying(true)
    try {
      const v = await createVersion(idea, text, sketches)
      await requestSketch(v.id)
      setChangeText('')
      setSketches([])
      setApplying(false)
      navigate(`/result/${v.id}`)
    } catch (e) {
      setApplying(false)
      setToast(e instanceof Error ? e.message : 'Änderung fehlgeschlagen.')
    }
  }

  const stepIndex = order ? 4 : generated ? 2 : 1
  const latestNum = versions.length ? Math.max(...versions.map((v) => v.version_number)) : 1
  const prevVersion = versions.find(
    (v) => v.version_number === (idea?.version_number ?? 1) - 1,
  )

  if (status === 'rejected') return <RejectedView message={idea?.error ?? null} />

  if (!id) {
    return (
      <StudioShell stepIndex={0}>
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <RenderingPlaceholder variant="cabinet" className="w-full max-w-md shadow-lift" />
          <p className="text-ink-500">Beschreibe deine Möbelidee, um deinen Entwurf zu starten.</p>
          <Button to="/create">Neue Idee erstellen</Button>
        </div>
      </StudioShell>
    )
  }

  const conceptUrl = idea?.concept_sheet_url ?? idea?.image_url ?? null

  return (
    <StudioShell stepIndex={stepIndex}>
      {!idea ? (
        <div className="flex min-h-[40vh] items-center justify-center text-ink-400">Lädt …</div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
          {/* LINKS — Möbel, Versionen, Änderungen */}
          <section className="flex w-full min-w-0 flex-col">
            {/* Kopf: Name · Version · Konzeptblatt */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold text-ink-950 sm:text-3xl">
                  {spec?.titel ?? 'Dein Entwurf'}
                </h1>
                {versions.length > 0 && (
                  <select
                    value={idea.id}
                    onChange={(e) => e.target.value !== idea.id && navigate(`/result/${e.target.value}`)}
                    className="mt-2 h-9 rounded-full border border-ink-200 bg-white px-3.5 text-sm font-medium text-ink-700 outline-none transition-colors hover:border-ink-300 focus:border-accent-400"
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        Version {v.version_number}
                        {v.version_number === latestNum ? ' · aktuell' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConceptOpen(true)}
                disabled={!conceptUrl}
              >
                <FileText size={16} /> Konzeptblatt ansehen
              </Button>
            </div>

            {/* Hauptbild */}
            <div className="mt-4">
              <HeroStage idea={idea} loading={loading} retrying={retrying} onRetry={retry} />
            </div>

            {/* Unter dem Bild */}
            {prevVersion && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/result/${prevVersion.id}`)}
                >
                  <ChevronLeft size={16} /> Zur vorherigen Version
                </Button>
              </div>
            )}

            {/* Versionsübersicht */}
            {versions.length > 0 && (
              <VersionList
                versions={versions}
                currentId={idea.id}
                latestNum={latestNum}
                onSelect={(vid) => vid !== idea.id && navigate(`/result/${vid}`)}
              />
            )}

            {/* Änderungsbereich */}
            <ChangeArea
              disabled={!generated || applying}
              changeText={changeText}
              setChangeText={setChangeText}
              sketches={sketches}
              setSketches={setSketches}
              onOpenConcept={() => setConceptOpen(true)}
              onApply={applyChange}
            />

            <button
              onClick={() => setShowDetails((v) => !v)}
              className="mt-6 self-start text-sm font-medium text-ink-400 transition-colors hover:text-ink-700"
            >
              {showDetails ? 'Technische Daten ausblenden' : 'Technische Daten anzeigen'}
            </button>
            {showDetails && spec && <DesignDetails spec={spec} fallbackPrompt={idea.prompt} />}
          </section>

          {/* RECHTS — Varianten + Bestellung */}
          <aside className="flex w-full min-w-0 flex-col gap-3">
            <p className="text-sm font-medium text-ink-500">Umsetzung</p>
            {variants ? (
              variants.map((v) => (
                <VariantMini
                  key={v.tier}
                  variant={v}
                  active={v.tier === activeTier}
                  disabled={Boolean(order)}
                  onSelect={() => setSelectedTier(v.tier)}
                  priceLabel={priceLabel(v)}
                />
              ))
            ) : (
              <p className="text-sm text-ink-400">Varianten entstehen …</p>
            )}
            {variants && (
              <p className="text-[11px] leading-relaxed text-ink-400">
                Geschätzte Preisspanne auf Basis der tatsächlichen Herstellerkalkulation.
              </p>
            )}
            <div className="mt-1">
              {order ? (
                <OrderStatusCard order={order} />
              ) : canOrder ? (
                <Button size="lg" onClick={goToCheckout} className="group w-full">
                  Zur Bestellung
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  />
                </Button>
              ) : null}
            </div>
          </aside>
        </div>
      )}

      <ConceptModal
        open={conceptOpen}
        url={conceptUrl}
        onClose={() => setConceptOpen(false)}
        onAnnotate={(area, comment) => {
          const line = area ? `[${area}] ${comment}` : comment
          setChangeText((t) => (t ? `${t}\n${line}` : line))
          setConceptOpen(false)
        }}
      />
      <GenerationOverlay
        show={applying}
        title="Neue Version entsteht"
        subtitle="Renderbild, Konzeptblatt, Maße und Preis werden gemeinsam neu erzeugt."
        stages={CHANGE_STAGES}
      />
      <Toast message={toast} onClose={() => setToast(null)} />
    </StudioShell>
  )
}

/* ───────────── Rahmen & Prozess-Navigation ───────────── */

function StudioShell({ stepIndex, children }: { stepIndex: number; children: React.ReactNode }) {
  return (
    <div className="relative">
      <AmbientScene className="h-[60vh]" />
      <Container className="py-10 sm:py-12">
        <ProcessNav activeIndex={stepIndex} />
        <div className="mt-10">{children}</div>
      </Container>
    </div>
  )
}

function ProcessNav({ activeIndex }: { activeIndex: number }) {
  return (
    <nav className="flex items-center justify-center">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <span
            className={cn(
              'flex items-center gap-1.5 text-sm',
              i === activeIndex
                ? 'font-medium text-ink-950'
                : i < activeIndex
                  ? 'text-ink-500'
                  : 'text-ink-300',
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                i < activeIndex
                  ? 'bg-ink-950 text-white'
                  : i === activeIndex
                    ? 'bg-accent-600 text-white'
                    : 'bg-ink-100 text-ink-400',
              )}
            >
              {i < activeIndex ? <Check size={11} /> : i + 1}
            </span>
            <span className="hidden sm:inline">{s}</span>
          </span>
          {i < STEPS.length - 1 && <span className="mx-2 h-px w-4 bg-ink-200 sm:mx-3 sm:w-8" />}
        </div>
      ))}
    </nav>
  )
}

/* ───────────── Hero (das Möbel) ───────────── */

function HeroStage({
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
  if (loading || retrying || !idea || idea.status === 'pending') {
    return (
      <div className="relative flex aspect-[4/3] w-full flex-col justify-center gap-5 overflow-hidden rounded-3xl border border-ink-100 bg-white p-8 shadow-lift">
        <AmbientScene />
        <div className="flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center">
            <span className="animate-status absolute inline-flex h-full w-full rounded-full bg-accent-400/30" />
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-ink-950 text-white">
              <Sparkles size={15} />
            </span>
          </span>
          <div>
            <p className="font-semibold text-ink-950">Dein Entwurf entsteht</p>
            <p className="text-xs text-ink-400">Die KI arbeitet an deinem Möbel.</p>
          </div>
        </div>
        <AiActivityStream stages={DESIGN_STAGES} />
      </div>
    )
  }
  if (idea.status === 'failed') {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 rounded-3xl border border-red-100 bg-red-50/60 p-6 text-center">
        <p className="text-sm font-medium text-red-700">Der Entwurf konnte nicht erzeugt werden.</p>
        {idea.error && <p className="max-w-md text-xs text-red-500">{idea.error}</p>}
        <Button size="sm" onClick={onRetry}>
          Erneut versuchen <ArrowRight size={16} />
        </Button>
      </div>
    )
  }
  const src = idea.preview_image_url ?? idea.concept_sheet_url ?? idea.image_url
  if (!src) return <RenderingPlaceholder variant="cabinet" className="shadow-lift" />
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="group block">
      <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-lift transition-shadow group-hover:shadow-float">
        <img src={src} alt="Produktvorschau" className="aspect-[4/3] w-full max-w-full object-cover" />
      </div>
    </a>
  )
}

/* ───────────── Versionsübersicht ───────────── */

function relativeTime(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'gerade eben'
  if (min < 60) return `vor ${min} Min.`
  const h = Math.round(min / 60)
  if (h < 24) return `vor ${h} Std.`
  return `vor ${Math.round(h / 24)} Tg.`
}

function VersionList({
  versions,
  currentId,
  latestNum,
  onSelect,
}: {
  versions: Idea[]
  currentId: string
  latestNum: number
  onSelect: (id: string) => void
}) {
  return (
    <div className="mt-6">
      <p className="text-sm font-medium text-ink-500">Versionen</p>
      <div className="mt-3 flex flex-col gap-2">
        {versions.map((v) => {
          const isCurrent = v.id === currentId
          const isLatest = v.version_number === latestNum
          return (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className={cn(
                'flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition-colors',
                isCurrent
                  ? 'border-accent-600 bg-accent-50/40 ring-1 ring-accent-600'
                  : 'border-ink-100 hover:border-ink-200 hover:bg-ink-50/40',
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-950">Version {v.version_number}</p>
                <p className="truncate text-xs text-ink-500">
                  {v.change_note ?? 'Erste Erstellung'}
                </p>
              </div>
              <span className="shrink-0 text-xs text-ink-400">
                {isLatest ? 'Aktuell' : relativeTime(v.created_at)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ───────────── Änderungsbereich ───────────── */

function ChangeArea({
  disabled,
  changeText,
  setChangeText,
  sketches,
  setSketches,
  onOpenConcept,
  onApply,
}: {
  disabled: boolean
  changeText: string
  setChangeText: (v: string) => void
  sketches: File[]
  setSketches: (f: File[]) => void
  onOpenConcept: () => void
  onApply: () => void
}) {
  const canApply = !disabled && (changeText.trim().length > 0 || sketches.length > 0)
  return (
    <div className="mt-8 rounded-3xl border border-ink-100 bg-white p-6 shadow-soft">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
        <Wand2 size={18} className="text-accent-600" /> Änderungen vornehmen
      </h2>
      <p className="mt-1 text-sm text-ink-500">
        Beschreibe die gewünschte Anpassung – daraus entsteht eine neue Version.
      </p>

      <textarea
        value={changeText}
        onChange={(e) => setChangeText(e.target.value)}
        rows={3}
        disabled={disabled}
        placeholder="z. B. Tischplatte etwas dicker · Nussbaum statt Eiche · 20 cm breiter · grifflose Front …"
        className="mt-4 w-full resize-none rounded-2xl border border-ink-200 bg-white p-4 text-[0.95rem] leading-relaxed text-ink-900 outline-none transition-all placeholder:text-ink-300 focus:border-accent-400 focus:ring-4 focus:ring-accent-100 disabled:opacity-60"
      />

      {/* Zusatzoptionen */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label
          className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-2 text-sm text-ink-600 transition-colors hover:border-ink-300',
            disabled && 'pointer-events-none opacity-60',
          )}
        >
          <ImagePlus size={15} /> Neue Skizze hochladen
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              if (files.length) setSketches([...sketches, ...files].slice(0, 4))
            }}
          />
        </label>
        <button
          type="button"
          onClick={onOpenConcept}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-2 text-sm text-ink-600 transition-colors hover:border-ink-300 disabled:opacity-60"
        >
          <FileText size={15} /> Konzeptblatt bearbeiten
        </button>
      </div>

      {sketches.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {sketches.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 rounded-full bg-ink-100 py-1 pl-3 pr-1.5 text-xs text-ink-700"
            >
              {f.name.length > 22 ? f.name.slice(0, 22) + '…' : f.name}
              <button
                onClick={() => setSketches(sketches.filter((_, idx) => idx !== i))}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-200 text-ink-600 hover:bg-ink-300"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <span className="self-center text-[11px] text-ink-400">
            Skizze wird als Referenz gespeichert.
          </span>
        </div>
      )}

      <Button onClick={onApply} disabled={!canApply} className="group mt-5 w-full sm:w-auto">
        <Wand2 size={17} /> Änderung anwenden
        <ArrowRight
          size={17}
          className="transition-transform duration-300 group-hover:translate-x-0.5"
        />
      </Button>
      <p className="mt-2 text-[11px] text-ink-400">
        Es entsteht eine neue Version; die bisherige bleibt erhalten. Renderbild und
        Konzeptblatt werden dabei gemeinsam neu erzeugt.
      </p>
    </div>
  )
}

/* ───────────── Konzeptblatt-Modal (ansehen & annotieren) ───────────── */

function ConceptModal({
  open,
  url,
  onClose,
  onAnnotate,
}: {
  open: boolean
  url: string | null
  onClose: () => void
  onAnnotate: (area: string | null, comment: string) => void
}) {
  const [area, setArea] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  const close = () => {
    setArea(null)
    setComment('')
    onClose()
  }
  const submit = () => {
    const c = comment.trim()
    if (!c) return
    const a = area
    setArea(null)
    setComment('')
    onAnnotate(a, c)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/50 p-4"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-float md:flex-row"
          >
            {/* Konzeptblatt */}
            <div className="flex flex-1 items-center justify-center bg-ink-50 p-3">
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" title="In voller Auflösung öffnen">
                  <img src={url} alt="Konzeptblatt" className="max-h-[80vh] w-full object-contain" />
                </a>
              ) : (
                <p className="p-10 text-sm text-ink-400">Kein Konzeptblatt vorhanden.</p>
              )}
            </div>

            {/* Annotation */}
            <div className="flex w-full flex-col border-t border-ink-100 p-6 md:w-80 md:border-l md:border-t-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink-950">Bereich markieren</h3>
                <button onClick={close} className="text-ink-400 hover:text-ink-700">
                  <X size={18} />
                </button>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                Wähle einen Bereich und beschreibe die gewünschte Änderung.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {CONCEPT_AREAS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setArea(area === a ? null : a)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      area === a
                        ? 'border-accent-600 bg-accent-600 text-white'
                        : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder='z. B. „Hier statt Eiche Nussbaum" oder „Diese Tür entfernen"'
                className="mt-4 w-full resize-none rounded-2xl border border-ink-200 bg-white p-3 text-sm text-ink-900 outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
              />
              <Button onClick={submit} disabled={!comment.trim()} className="mt-4 w-full">
                Als Änderung übernehmen
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ───────────── Varianten (kompakt) ───────────── */

function VariantMini({
  variant: v,
  active,
  disabled,
  onSelect,
  priceLabel,
}: {
  variant: Variant
  active: boolean
  disabled: boolean
  onSelect: () => void
  priceLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'w-full rounded-2xl border p-4 text-left transition-all',
        active
          ? 'border-accent-600 bg-accent-50/40 ring-1 ring-accent-600'
          : 'border-ink-100 hover:border-ink-200 hover:bg-ink-50/40',
        disabled && !active && 'opacity-70',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-semibold text-ink-950">
          <span
            className={cn(
              'flex h-4 w-4 items-center justify-center rounded-full border',
              active ? 'border-accent-600 bg-accent-600 text-white' : 'border-ink-300',
            )}
          >
            {active && <Check size={11} />}
          </span>
          {v.title}
        </span>
        {v.recommended && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-accent-600">
            Empfohlen
          </span>
        )}
      </div>
      <ul className="mt-2.5 space-y-1 pl-6 text-xs text-ink-500">
        <li>{v.material}</li>
        <li>{v.surface}</li>
        <li>{v.hardware}</li>
      </ul>
      <div className="mt-3 flex items-center justify-between gap-2 pl-6">
        <span className="text-base font-semibold text-ink-950">{priceLabel}</span>
        <span className="shrink-0 text-xs text-ink-400">
          {v.leadTimeWeeks[0]}–{v.leadTimeWeeks[1]} Wochen
        </span>
      </div>
    </button>
  )
}

/* ───────────── Details (zurückhaltend) ───────────── */

function DesignDetails({
  spec,
  fallbackPrompt,
}: {
  spec: NonNullable<Idea['concept']>
  fallbackPrompt: string
}) {
  const dims: { label: string; value: string }[] = []
  if (spec.masse.breite_cm) dims.push({ label: 'Breite', value: `${spec.masse.breite_cm} cm` })
  if (spec.masse.hoehe_cm) dims.push({ label: 'Höhe', value: `${spec.masse.hoehe_cm} cm` })
  if (spec.masse.tiefe_cm) dims.push({ label: 'Tiefe', value: `${spec.masse.tiefe_cm} cm` })
  for (const w of spec.masse.weitere ?? []) dims.push({ label: w.label, value: w.wert })

  return (
    <div className="mt-4 space-y-6 border-t border-ink-100 pt-6">
      <p className="max-w-2xl text-pretty leading-relaxed text-ink-600">
        {spec.kurzbeschreibung || fallbackPrompt}
      </p>
      {dims.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {dims.map((d) => (
            <span key={d.label} className="rounded-full bg-ink-50 px-3 py-1.5 text-sm text-ink-600">
              <span className="text-ink-400">{d.label}:</span>{' '}
              <span className="font-medium text-ink-900">{d.value}</span>
            </span>
          ))}
        </div>
      )}
      {spec.materialien.length > 0 && (
        <dl className="max-w-md divide-y divide-ink-100">
          {spec.materialien.map((m) => (
            <div key={m.bauteil} className="flex items-center justify-between py-2 text-sm">
              <dt className="text-ink-500">{m.bauteil}</dt>
              <dd className="font-medium text-ink-900">{m.material}</dd>
            </div>
          ))}
        </dl>
      )}
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
    <div className={cn('rounded-2xl border p-5 text-center', tone)}>
      {open ? (
        <Sparkles size={22} className="mx-auto animate-spin" />
      ) : rejected ? (
        <ArrowLeft size={22} className="mx-auto" />
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

/* ───────────── Ablehnung (kein Möbelstück) ───────────── */

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
                'Forma ist aktuell ausschließlich auf die Entwicklung und Anfertigung von Möbelstücken spezialisiert. Bitte beschreibe ein Möbelstück, das du gestalten möchtest.'}
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
