import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  FileText,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AmbientScene } from '@/components/ui/AmbientScene'
import { Toast } from '@/components/ui/Toast'
import { RenderingPlaceholder } from '@/components/ui/RenderingPlaceholder'
import { AiActivityStream } from '@/components/ui/AiActivity'
import { requestSketch, type Idea } from '@/lib/ideas'
import { createOrder } from '@/lib/orders'
import { buildVariants } from '@/lib/variants'
import {
  estimateProduct,
  formatRange,
  loadManufacturerOffers,
  type ManufacturerOffer,
  type PriceRange,
} from '@/lib/estimate'
import {
  getRoomProject,
  labelOfRoom,
  labelOfStyle,
  listRoomProducts,
  markRoomFailed,
  renderRoom,
  setProductSelected,
  type RoomProject as RoomProjectType,
} from '@/lib/roomPlanner'
import { cn, formatEUR } from '@/lib/utils'

const PRODUCT_STAGES = [
  'Wünsche werden ausgewertet',
  'Möbel werden entwickelt',
  'Maße & Material werden festgelegt',
  'Konzeptblätter werden vorbereitet',
]
const RENDER_STAGES = [
  'Möbel werden im Raum platziert',
  'Perspektive & Maßstab werden angepasst',
  'Licht & Schatten werden übernommen',
  'Fotorealistisches Raumbild wird gerendert',
]

export function RoomProject() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<RoomProjectType | null>(null)
  const [products, setProducts] = useState<Idea[] | null>(null)
  const [offers, setOffers] = useState<ManufacturerOffer[] | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [detail, setDetail] = useState<Idea | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const genTriggered = useRef<Set<string>>(new Set())
  const renderTriggered = useRef(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const [proj, prods] = await Promise.all([getRoomProject(id), listRoomProducts(id)])
      if (!proj) {
        setNotFound(true)
        return
      }
      setProject(proj)
      setProducts(prods)
    } catch {
      setNotFound(true)
    }
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    loadManufacturerOffers()
      .then(setOffers)
      .catch(() => setOffers([]))
  }, [load])

  // 1) Möbel erzeugen (resilient: einmal pro Produkt/Session).
  useEffect(() => {
    if (!products) return
    const pending = products.filter(
      (p) => p.status === 'pending' && !genTriggered.current.has(p.id),
    )
    if (pending.length === 0) return
    pending.forEach((p) => genTriggered.current.add(p.id))
    Promise.allSettled(pending.map((p) => requestSketch(p.id))).then(() => load())
  }, [products, load])

  // 2) Solange Möbel entstehen: nachladen.
  useEffect(() => {
    if (!products) return
    if (products.some((p) => p.status === 'pending')) {
      const t = setTimeout(load, 4000)
      return () => clearTimeout(t)
    }
  }, [products, load])

  // 3) Sind alle Möbel fertig → das Raumbild rendern (Products-first).
  //    Feuert einmal pro Session (renderTriggered). Läuft auch für einen bereits
  //    als 'rendering' geladenen (in einer früheren Sitzung hängengebliebenen)
  //    Zustand → Selbstheilung beim erneuten Öffnen. Ergebnis wird ausgewertet:
  //    schlägt der Aufruf fehl, wird der Fehler persistiert (sonst Endlos-Laden).
  useEffect(() => {
    if (!products || !project) return
    if (products.some((p) => p.status === 'pending')) return
    if (project.status === 'ready' || project.status === 'failed') return
    if (renderTriggered.current) return
    renderTriggered.current = true
    // Verwendbar = fertig erzeugt + mind. ein Bild (wie render-room es erwartet).
    const usable = products.filter(
      (p) =>
        p.status === 'generated' &&
        (p.preview_image_url || p.concept_sheet_url || p.image_url),
    )
    console.log('[render-room] Eingabedaten', {
      projectId: project.id,
      productCount: products.length,
      usable: usable.length,
      productStatuses: products.map((p) => p.status),
    })
    ;(async () => {
      // Kein verwendbares Möbel → render-room GAR NICHT aufrufen (das würde nur
      // „0 verwendbar" melden). Stattdessen klaren Fehler zur Einzel-Erzeugung.
      if (usable.length === 0) {
        // Den ECHTEN Grund je Möbel sichtbar machen (Status + gespeicherter Fehler
        // aus generate-sketch), statt einer generischen Meldung.
        console.error(
          '[render-room] Keine verwendbaren Produkte',
          products.map((p) => ({
            id: p.id,
            status: p.status,
            error: p.error,
            hasPreview: !!p.preview_image_url,
          })),
        )
        const reasons = products
          .map((p) => {
            const name = p.concept?.titel ?? p.prompt.slice(0, 40)
            return `„${name}": ${p.status}${p.error ? ` – ${p.error}` : ''}`
          })
          .join(' | ')
        const msg = `Es konnte kein Möbelstück erzeugt werden. ${reasons}`
        await markRoomFailed(project.id, msg)
        setProject((pr) => (pr ? { ...pr, status: 'failed', render_error: msg } : pr))
        return
      }
      const result = await renderRoom(project.id)
      console.log('[render-room] Ergebnis im Frontend', result)
      if (result.status === 'failed') {
        await markRoomFailed(project.id, result.error ?? 'Unbekannter Fehler.')
        setProject((pr) => (pr ? { ...pr, status: 'failed', render_error: result.error ?? null } : pr))
        return
      }
      await load()
    })()
  }, [products, project, load])

  // 4) Während das Raumbild erzeugt wird: nachladen, bis ready/failed (robust,
  //    auch wenn der Invoke-Aufruf zwischenzeitlich abbricht).
  useEffect(() => {
    if (!products || !project) return
    if (products.some((p) => p.status === 'pending')) return
    if (project.status === 'ready' || project.status === 'failed') return
    const t = setTimeout(load, 5000)
    return () => clearTimeout(t)
  }, [products, project, load])

  const productRange = useCallback(
    (idea: Idea): PriceRange | null => {
      if (!idea.concept || !offers) return null
      return estimateProduct(idea.concept, buildVariants(idea.concept), offers)
    },
    [offers],
  )

  const toggleSelect = async (idea: Idea, selected: boolean) => {
    setProducts((cur) =>
      (cur ?? []).map((p) => (p.id === idea.id ? { ...p, room_selected: selected } : p)),
    )
    try {
      await setProductSelected(idea.id, selected)
    } catch {
      setToast('Auswahl konnte nicht gespeichert werden.')
    }
  }

  const retryRender = async () => {
    if (!project) return
    renderTriggered.current = true
    setProject((pr) => (pr ? { ...pr, status: 'rendering', render_error: null } : pr))
    console.log('[render-room] Retry gestartet', { projectId: project.id })
    const result = await renderRoom(project.id)
    console.log('[render-room] Retry-Ergebnis', result)
    if (result.status === 'failed') {
      await markRoomFailed(project.id, result.error ?? 'Unbekannter Fehler.')
      setProject((pr) => (pr ? { ...pr, status: 'failed', render_error: result.error ?? null } : pr))
      return
    }
    await load()
  }

  const requestSelection = async () => {
    const selected = (products ?? []).filter((p) => p.room_selected && p.status === 'generated')
    if (selected.length === 0) {
      setToast('Bitte wähle mindestens ein fertiges Produkt aus.')
      return
    }
    setSubmitting(true)
    try {
      for (const p of selected) {
        await createOrder({
          ideaId: p.id,
          description: p.prompt,
          conceptSheetUrl: p.concept_sheet_url ?? p.image_url,
          previewImageUrl: p.preview_image_url,
          concept: p.concept,
        })
      }
      setToast('Deine Auswahl wurde als Anfrage übermittelt.')
      setTimeout(() => navigate('/dashboard'), 1300)
    } catch (e) {
      setSubmitting(false)
      setToast(e instanceof Error ? e.message : 'Anfrage fehlgeschlagen.')
    }
  }

  if (notFound) {
    return (
      <Container className="max-w-xl py-20 text-center">
        <h1 className="text-2xl font-semibold text-ink-950">Raumprojekt nicht gefunden</h1>
        <p className="mt-2 text-ink-500">
          Dieses Raumprojekt existiert nicht oder gehört nicht zu deinem Konto.
        </p>
        <Link to="/dashboard" className="mt-6 inline-block font-medium text-accent-600">
          ← Zurück zum Dashboard
        </Link>
      </Container>
    )
  }
  if (!project || products === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-400">Lädt …</div>
    )
  }

  const anyPending = products.some((p) => p.status === 'pending')
  const phase: 'products' | 'rendering' | 'ready' | 'failed' = anyPending
    ? 'products'
    : project.status === 'ready'
      ? 'ready'
      : project.status === 'failed'
        ? 'failed'
        : 'rendering'

  return (
    <div className="relative">
      <AmbientScene className="h-[55vh]" />
      <Container className="max-w-5xl py-12 sm:py-14">
        {phase === 'products' && (
          <BuildingScreen
            photoUrl={project.photoUrl ?? null}
            title="Deine Möbel werden entwickelt"
            subtitle={`${products.filter((p) => p.status !== 'pending').length}/${products.length} fertig`}
            stages={PRODUCT_STAGES}
          />
        )}
        {phase === 'rendering' && (
          <BuildingScreen
            photoUrl={project.photoUrl ?? null}
            title="Dein Raum wird fotorealistisch erzeugt"
            subtitle="Die entwickelten Möbel werden in dein Foto eingesetzt."
            stages={RENDER_STAGES}
          />
        )}
        {phase === 'failed' && (
          <RoomFailed
            project={project}
            products={products}
            productRange={productRange}
            onRetry={retryRender}
            onOpenDetail={setDetail}
          />
        )}
        {phase === 'ready' && (
          <RoomResult
            project={project}
            products={products}
            productRange={productRange}
            onOpenDetail={setDetail}
            onToggle={toggleSelect}
            onRequest={requestSelection}
            onRerender={retryRender}
            submitting={submitting}
          />
        )}
      </Container>

      <ProductDetailModal
        idea={detail}
        range={detail ? productRange(detail) : null}
        selected={detail ? Boolean(products.find((p) => p.id === detail.id)?.room_selected) : false}
        selectable={phase === 'ready'}
        onToggle={(sel) => detail && toggleSelect(detail, sel)}
        onClose={() => setDetail(null)}
      />
      <Toast message={toast} tone="info" onClose={() => setToast(null)} />
    </div>
  )
}

/* ───────────── Verarbeitungs-/Render-Screen ───────────── */

function BuildingScreen({
  photoUrl,
  title,
  subtitle,
  stages,
}: {
  photoUrl: string | null
  title: string
  subtitle: string
  stages: string[]
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <span className="relative flex h-9 w-9 items-center justify-center">
          <span className="animate-status absolute inline-flex h-full w-full rounded-full bg-accent-400/30" />
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-ink-950 text-white">
            <span className="text-shimmer text-[13px] font-semibold">AI</span>
          </span>
        </span>
        <div>
          <p className="font-semibold text-ink-950">{title}</p>
          <p className="text-sm text-ink-400">{subtitle}</p>
        </div>
      </div>
      {photoUrl && (
        <div className="mt-6 overflow-hidden rounded-3xl border border-ink-100 shadow-soft">
          <img src={photoUrl} alt="Dein Raum" className="max-h-72 w-full object-cover" />
        </div>
      )}
      <Card className="mt-6 p-6">
        <AiActivityStream stages={stages} />
      </Card>
    </div>
  )
}

/* ───────────── Fehlerfall: Raumbild fehlgeschlagen ───────────── */

function RoomFailed({
  project,
  products,
  productRange,
  onRetry,
  onOpenDetail,
}: {
  project: RoomProjectType
  products: Idea[]
  productRange: (idea: Idea) => PriceRange | null
  onRetry: () => void
  onOpenDetail: (idea: Idea) => void
}) {
  const [busy, setBusy] = useState(false)
  const ready = products.filter((p) => p.status === 'generated')
  return (
    <div>
      <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-soft">
            <TriangleAlert size={22} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-ink-950">
              Die Raumvisualisierung ist fehlgeschlagen
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
              Dein fotorealistisches Raumbild konnte nicht erzeugt werden. Deine entwickelten
              Möbel, Preise und Konzeptblätter bleiben erhalten – du kannst es erneut versuchen.
            </p>
            {project.render_error && (
              <p className="mt-2 text-xs text-amber-700">Details: {project.render_error}</p>
            )}
            <Button
              onClick={async () => {
                setBusy(true)
                await onRetry()
                setBusy(false)
              }}
              disabled={busy}
              className="mt-4"
            >
              <RefreshCw size={16} /> {busy ? 'Wird erzeugt …' : 'Erneut versuchen'}
            </Button>
          </div>
        </div>
      </div>

      {ready.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-ink-950">Deine entwickelten Möbel</h2>
          <p className="mt-1 text-sm text-ink-400">
            Eine Bestellung ist erst nach erfolgreicher Raumvisualisierung möglich.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {ready.map((p) => (
              <ProductRow
                key={p.id}
                idea={p}
                range={productRange(p)}
                selectable={false}
                onOpenDetail={() => onOpenDetail(p)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ───────────── Ergebnis: fotorealistischer Raum + unsichtbare Hotspots ───────────── */

function RoomResult({
  project,
  products,
  productRange,
  onOpenDetail,
  onToggle,
  onRequest,
  onRerender,
  submitting,
}: {
  project: RoomProjectType
  products: Idea[]
  productRange: (idea: Idea) => PriceRange | null
  onOpenDetail: (idea: Idea) => void
  onToggle: (idea: Idea, selected: boolean) => void
  onRequest: () => void
  onRerender: () => void
  submitting: boolean
}) {
  const ready = products.filter((p) => p.status === 'generated')
  const selected = ready.filter((p) => p.room_selected)

  let sumMin = 0
  let sumMax = 0
  let priced = 0
  for (const p of selected) {
    const r = productRange(p)
    if (r) {
      sumMin += r.min
      sumMax += r.max
      priced += 1
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm text-ink-400">
            <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-700">
              Raumprojekt
            </span>
            {[labelOfRoom(project.room_type), labelOfStyle(project.style)]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
            {project.name}
          </h1>
        </div>
        <Link to="/dashboard" className="text-sm font-medium text-ink-500 hover:text-ink-900">
          Zum Dashboard
        </Link>
      </div>

      {/* Fotorealistischer Raum mit unsichtbaren, klickbaren Hotspots */}
      {project.result_image_url ? (
        <RoomHotspots
          imageUrl={project.result_image_url}
          products={ready}
          onOpen={onOpenDetail}
        />
      ) : (
        <div className="mt-5 flex aspect-[16/9] items-center justify-center rounded-3xl border border-ink-100 text-ink-300">
          Kein Raumbild
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-ink-400">
          Tipp: Fahre über ein Möbel im Bild (oder tippe es an), um die Produktdetails zu öffnen.
        </p>
        <button
          onClick={onRerender}
          className="text-[11px] font-medium text-ink-400 hover:text-ink-700"
        >
          Raum neu visualisieren
        </button>
      </div>

      {/* Produktliste + Auswahl */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.7fr_1fr]">
        <div>
          <h2 className="text-lg font-semibold text-ink-950">Möbel in diesem Raum</h2>
          <div className="mt-4 flex flex-col gap-3">
            {ready.map((p) => (
              <ProductRow
                key={p.id}
                idea={p}
                range={productRange(p)}
                selectable
                onOpenDetail={() => onOpenDetail(p)}
                onToggle={(sel) => onToggle(p, sel)}
              />
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink-950">Deine Auswahl</h2>
            {selected.length === 0 ? (
              <p className="mt-3 text-sm text-ink-400">
                Wähle die Möbel aus, die du tatsächlich anfertigen lassen möchtest.
              </p>
            ) : (
              <>
                <ul className="mt-4 flex flex-col divide-y divide-ink-100">
                  {selected.map((p) => {
                    const r = productRange(p)
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                        <span className="min-w-0 truncate text-sm text-ink-700">
                          {p.concept?.titel ?? p.prompt}
                        </span>
                        <span className="shrink-0 text-sm font-medium text-ink-900">
                          {r ? formatRange(r) : 'auf Anfrage'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
                  <span className="text-sm font-medium text-ink-700">Geschätzter Gesamtpreis</span>
                  <span className="text-lg font-semibold text-ink-950">
                    {priced > 0 ? `${formatEUR(sumMin)} – ${formatEUR(sumMax)}` : 'auf Anfrage'}
                  </span>
                </div>
              </>
            )}
            <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-500">
              Individuelle Fertigung nach dem verbindlichen Konzeptblatt jedes Produkts.
              Unverbindliche Anfrage – noch keine Zahlung fällig.
            </p>
            <Button
              size="lg"
              onClick={onRequest}
              disabled={submitting || selected.length === 0}
              className="group mt-4 w-full"
            >
              {submitting ? 'Wird übermittelt …' : 'Auswahl anfragen'}
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  )
}

/** Fotorealistisches Raumbild mit transparenten, im Ruhezustand unsichtbaren Hotspots. */
function RoomHotspots({
  imageUrl,
  products,
  onOpen,
}: {
  imageUrl: string
  products: Idea[]
  onOpen: (idea: Idea) => void
}) {
  return (
    <div className="relative mt-5 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-lift">
      <img src={imageUrl} alt="Fotorealistischer Raum" className="block w-full" />
      {products
        .filter((p) => p.room_bbox)
        .map((p) => {
          const b = p.room_bbox!
          const name = p.concept?.titel ?? p.prompt
          return (
            <button
              key={p.id}
              onClick={() => onOpen(p)}
              aria-label={`${name} – Details öffnen`}
              className="group absolute rounded-lg outline-none ring-0 ring-accent-400/90 transition-all duration-200 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(255,255,255,0.6)] hover:ring-2 focus-visible:ring-2"
              style={{
                left: `${b.x * 100}%`,
                top: `${b.y * 100}%`,
                width: `${b.w * 100}%`,
                height: `${b.h * 100}%`,
              }}
            >
              <span className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink-950/85 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lift backdrop-blur transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                {name}
              </span>
            </button>
          )
        })}
    </div>
  )
}

/* ───────────── Produktzeile (ohne sichtbare Nummern) ───────────── */

function ProductRow({
  idea,
  range,
  selectable,
  onOpenDetail,
  onToggle,
}: {
  idea: Idea
  range: PriceRange | null
  selectable: boolean
  onOpenDetail: () => void
  onToggle?: (selected: boolean) => void
}) {
  const spec = idea.concept
  const img = idea.preview_image_url ?? idea.concept_sheet_url ?? idea.image_url
  const material = spec?.materialien?.[0]?.material
  const masse = spec
    ? [
        spec.masse.breite_cm && `B ${spec.masse.breite_cm}`,
        spec.masse.hoehe_cm && `H ${spec.masse.hoehe_cm}`,
        spec.masse.tiefe_cm && `T ${spec.masse.tiefe_cm}`,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <div
      className={cn(
        'flex gap-4 rounded-2xl border p-4 transition-colors',
        selectable && idea.room_selected ? 'border-accent-300 bg-accent-50/30' : 'border-ink-100',
      )}
    >
      <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-ink-50 sm:block">
        {img ? (
          <img src={img} alt="" className="h-full w-full object-cover" />
        ) : (
          <RenderingPlaceholder variant="cabinet" className="!rounded-none" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-ink-950">{spec?.titel ?? idea.prompt}</h3>
          <span className="shrink-0 text-sm font-semibold text-ink-950">
            {range ? formatRange(range) : 'auf Anfrage'}
          </span>
        </div>
        {spec?.kurzbeschreibung && (
          <p className="mt-1 line-clamp-1 text-sm text-ink-500">{spec.kurzbeschreibung}</p>
        )}
        <p className="mt-1 text-xs text-ink-400">
          {[material, masse].filter(Boolean).join(' · ') || 'Details in der Ansicht'}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenDetail}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-800 hover:border-ink-300"
          >
            <FileText size={13} /> Details ansehen
          </button>
          {selectable && onToggle && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-700">
              <input
                type="checkbox"
                checked={idea.room_selected}
                onChange={(e) => onToggle(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-accent-600)]"
              />
              Zur Auswahl
            </label>
          )}
        </div>
      </div>
    </div>
  )
}

/* ───────────── Produkt-Detail-Modal ───────────── */

function ProductDetailModal({
  idea,
  range,
  selected,
  selectable,
  onToggle,
  onClose,
}: {
  idea: Idea | null
  range: PriceRange | null
  selected: boolean
  selectable: boolean
  onToggle: (selected: boolean) => void
  onClose: () => void
}) {
  const spec = idea?.concept ?? null
  const img = idea?.preview_image_url ?? idea?.concept_sheet_url ?? idea?.image_url
  const conceptUrl = idea?.concept_sheet_url ?? idea?.image_url

  const dims: string[] = []
  if (spec?.masse.breite_cm) dims.push(`Breite ${spec.masse.breite_cm} cm`)
  if (spec?.masse.hoehe_cm) dims.push(`Höhe ${spec.masse.hoehe_cm} cm`)
  if (spec?.masse.tiefe_cm) dims.push(`Tiefe ${spec.masse.tiefe_cm} cm`)

  return (
    <AnimatePresence>
      {idea && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-950/50 p-4"
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-float"
          >
            <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
              <h3 className="truncate text-lg font-semibold text-ink-950">
                {spec?.titel ?? idea.prompt}
              </h3>
              <button onClick={onClose} className="text-ink-400 hover:text-ink-700">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-ink-100 bg-ink-50">
                  {img ? (
                    <img src={img} alt="" className="aspect-[4/3] w-full object-cover" />
                  ) : (
                    <RenderingPlaceholder variant="cabinet" />
                  )}
                </div>
                <div>
                  {spec?.kurzbeschreibung && (
                    <p className="text-pretty text-sm leading-relaxed text-ink-600">
                      {spec.kurzbeschreibung}
                    </p>
                  )}
                  <dl className="mt-4 space-y-2 text-sm">
                    {dims.length > 0 && <Row label="Maße" value={dims.join(' · ')} />}
                    {spec?.materialien?.[0] && (
                      <Row label="Material" value={spec.materialien[0].material} />
                    )}
                    {spec?.farben && spec.farben.length > 0 && (
                      <Row label="Farbe" value={spec.farben.join(', ')} />
                    )}
                    {spec?.konstruktion && <Row label="Konstruktion" value={spec.konstruktion} />}
                  </dl>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
                    <span className="text-sm text-ink-500">Geschätzter Preis</span>
                    <span className="text-lg font-semibold text-ink-950">
                      {range ? formatRange(range) : 'auf Anfrage'}
                    </span>
                  </div>
                </div>
              </div>

              {spec?.besondere_details && spec.besondere_details.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                    Funktionen &amp; Details
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {spec.besondere_details.map((d) => (
                      <li
                        key={d}
                        className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600"
                      >
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-ink-100 bg-ink-50/60 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-accent-600 shadow-soft">
                    <FileText size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-950">Verbindliches Konzeptblatt</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">
                      Das Konzeptblatt ist die verbindliche Grundlage für die Fertigung dieses
                      Möbelstücks. Die Raumvisualisierung dient ausschließlich der Veranschaulichung.
                    </p>
                    {conceptUrl && (
                      <a
                        href={conceptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-accent-700 hover:text-accent-800"
                      >
                        <FileText size={15} /> Konzeptblatt ansehen
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {selectable && (
              <div className="flex items-center justify-end gap-3 border-t border-ink-100 px-6 py-4">
                <Button
                  variant={selected ? 'secondary' : 'primary'}
                  onClick={() => onToggle(!selected)}
                >
                  {selected ? (
                    <>
                      <Check size={16} /> Ausgewählt
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Dieses Produkt auswählen
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-ink-400">{label}</dt>
      <dd className="text-right font-medium text-ink-900">{value}</dd>
    </div>
  )
}
