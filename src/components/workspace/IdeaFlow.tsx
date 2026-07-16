import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Check, FileText, Sparkles, Wand2 } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { AmbientScene } from '@/components/ui/AmbientScene'
import { ProcessingBody } from '@/components/ui/ProcessingView'
import { useAuth } from '@/context/AuthContext'
import { createIdea, requestSketch, type Idea } from '@/lib/ideas'
import { buildVariants, type Variant, type VariantTier } from '@/lib/variants'
import {
  estimateVariant,
  formatRange,
  loadManufacturerOffers,
  type ManufacturerOffer,
} from '@/lib/estimate'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'processing' | 'result' | 'rejected' | 'error'

const HERO_EXAMPLES = [
  'Schwebendes TV-Board aus Eiche',
  'Runder Esstisch für 6 Personen',
  'Schreibtisch mit Kabelmanagement',
]

/**
 * Durchgehende „Idee → Konzept"-Erfahrung ohne Seitenwechsel (ChatGPT-artig):
 * Die Hero-Section verwandelt sich nach dem Absenden in einen Workspace. Das
 * Eingabefeld bleibt als schlanke Prompt-Leiste oben sichtbar; direkt darunter
 * entsteht die KI-Verarbeitung und danach nahtlos das Ergebnis – alles auf
 * derselben URL, rein zustandsbasiert.
 */
export function IdeaFlow({ onActiveChange }: { onActiveChange?: (active: boolean) => void }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [phase, setPhase] = useState<Phase>('idle')
  const [prompt, setPrompt] = useState('')
  const [idea, setIdea] = useState<Idea | null>(null)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const active = phase !== 'idle'
  useEffect(() => {
    onActiveChange?.(active)
  }, [active, onActiveChange])

  // Nach oben scrollen, sobald der Workspace startet (Prompt-Leiste in den Blick).
  useEffect(() => {
    if (active) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [active])

  const generate = useCallback(
    async (text: string) => {
      setPrompt(text)
      setIdea(null)
      setReady(false)
      setMessage(null)
      setPhase('processing')
      try {
        const created = await createIdea({
          prompt: text,
          style: null,
          materials: [],
          category: null,
          budget: null,
          images: [],
        })
        const updated = await requestSketch(created.id)
        if (updated.status === 'rejected') {
          setMessage(updated.error)
          setPhase('rejected')
          return
        }
        // Ergebnis bereit → ProcessingBody schließt die Inszenierung sauber ab
        // und ruft danach onDone() auf (→ Phase 'result').
        setIdea(updated)
        setReady(true)
      } catch (e) {
        setMessage(e instanceof Error ? e.message : 'Erstellung fehlgeschlagen.')
        setPhase('error')
      }
    },
    [],
  )

  const start = useCallback(
    (text: string) => {
      const t = text.trim()
      if (!t) return
      // Generierung braucht ein Konto (Auth + JWT für die KI). Anonyme Besucher
      // führen wir sanft zum Login; die Idee bleibt erhalten und startet danach.
      if (!user) {
        sessionStorage.setItem('ideaforge:draft', t)
        navigate('/login', { state: { from: '/create' } })
        return
      }
      generate(t)
    },
    [user, navigate, generate],
  )

  const reset = useCallback(() => {
    setPhase('idle')
    setIdea(null)
    setReady(false)
    setMessage(null)
  }, [])

  return (
    <section className="relative overflow-hidden">
      <AmbientScene className="h-[72vh]" />
      <Container className={cn(active ? 'pt-28 pb-20 sm:pt-32' : 'pt-36 pb-24 sm:pt-44 sm:pb-32')}>
        <AnimatePresence mode="wait" initial={false}>
          {phase === 'idle' ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -28 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center"
            >
              <Hero onStart={start} />
            </motion.div>
          ) : (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-5xl"
            >
              <PromptBar
                value={prompt}
                busy={phase === 'processing'}
                phase={phase}
                onSubmit={start}
              />

              <div className="mt-10">
                <AnimatePresence mode="wait">
                  {phase === 'processing' && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.35 }}
                    >
                      <ProcessingBody
                        prompt={prompt}
                        ready={ready}
                        onDone={() => setPhase('result')}
                      />
                    </motion.div>
                  )}

                  {phase === 'result' && idea && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <IdeaResult idea={idea} />
                    </motion.div>
                  )}

                  {phase === 'rejected' && (
                    <motion.div key="rejected" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <NoticeCard
                        tone="amber"
                        title="Das ist (noch) kein Möbelstück"
                        body={
                          message ??
                          'Forma ist aktuell ausschließlich auf Möbelstücke spezialisiert. Bitte beschreibe ein Möbelstück, das du gestalten möchtest.'
                        }
                        onAction={reset}
                        actionLabel="Neue Möbelidee beschreiben"
                      />
                    </motion.div>
                  )}

                  {phase === 'error' && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <NoticeCard
                        tone="rose"
                        title="Der Entwurf konnte nicht erzeugt werden"
                        body={message ?? 'Bitte versuche es noch einmal.'}
                        onAction={() => start(prompt)}
                        actionLabel="Erneut versuchen"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </section>
  )
}

/* ───────────── Hero (Ruhezustand) ───────────── */

function Hero({ onStart }: { onStart: (text: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <>
      <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/70 px-3.5 py-1.5 text-sm font-medium text-ink-600 backdrop-blur">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-status absolute inline-flex h-full w-full rounded-full bg-accent-500" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-600" />
        </span>
        Ideen werden Realität
      </span>
      <h1 className="mt-7 max-w-4xl text-balance text-[3.5rem] font-extralight leading-[0.98] tracking-tight text-ink-950 sm:text-[5.25rem]">
        Aus deiner Idee wird ein{' '}
        <span className="font-serif italic font-normal">Produkt</span>.
      </h1>
      <p className="mt-5 max-w-lg text-balance text-lg leading-relaxed text-ink-500">
        Aus deiner Idee entsteht ein echtes Produkt – entwickelt, gefertigt und zu dir
        geliefert.
      </p>
      <p className="mt-4 text-xs text-ink-300">
        Startend mit individuellen Möbeln. Weitere Produktkategorien folgen.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          onStart(value)
        }}
        className="group relative mt-11 w-full max-w-xl"
      >
        <div className="pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] bg-accent-400/0 blur-2xl transition-colors duration-500 group-focus-within:bg-accent-400/20" />
        <div className="flex flex-col gap-2 rounded-2xl border border-ink-200 bg-white/90 p-2 shadow-soft backdrop-blur transition-colors focus-within:border-accent-400 sm:flex-row sm:items-center sm:gap-2 sm:pl-5">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Beschreibe deine Idee …"
            aria-label="Beschreibe deine Idee"
            autoFocus
            className="h-11 w-full min-w-0 flex-1 bg-transparent px-3 text-[1.05rem] text-ink-900 outline-none placeholder:text-ink-300 sm:px-0"
          />
          <button
            type="submit"
            className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-medium text-white transition-colors hover:bg-ink-800 sm:w-auto"
          >
            Idee starten
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {HERO_EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setValue(ex)}
              className="rounded-full border border-ink-100 bg-white/60 px-3 py-1.5 text-xs text-ink-500 backdrop-blur transition-colors hover:border-ink-300 hover:text-ink-800"
            >
              {ex}
            </button>
          ))}
        </div>
      </form>
    </>
  )
}

/* ───────────── Prompt-Leiste (bleibt oben sichtbar) ───────────── */

function PromptBar({
  value,
  busy,
  phase,
  onSubmit,
}: {
  value: string
  busy: boolean
  phase: Phase
  onSubmit: (text: string) => void
}) {
  const [text, setText] = useState(value)
  const dirty = useRef(false)
  // Von außen gesetzten Prompt übernehmen, solange der Nutzer nicht selbst tippt.
  useEffect(() => {
    if (!dirty.current) setText(value)
  }, [value])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (busy) return
        dirty.current = false
        onSubmit(text)
      }}
      className="group relative"
    >
      <div className="pointer-events-none absolute -inset-1.5 -z-10 rounded-[1.75rem] bg-accent-400/0 blur-2xl transition-colors duration-500 group-focus-within:bg-accent-400/15" />
      <div className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white/90 p-2 pl-5 shadow-soft backdrop-blur transition-colors focus-within:border-accent-400">
        <StatusDot phase={phase} />
        <input
          value={text}
          onChange={(e) => {
            dirty.current = true
            setText(e.target.value)
          }}
          disabled={busy}
          aria-label="Deine Idee"
          placeholder="Beschreibe deine Idee …"
          className="h-10 flex-1 bg-transparent text-[1.02rem] text-ink-900 outline-none placeholder:text-ink-300 disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-medium text-white transition-colors hover:bg-ink-800 disabled:opacity-40"
        >
          {busy ? 'Arbeitet …' : phase === 'result' ? 'Neue Idee' : 'Los'}
          {!busy && <ArrowRight size={16} />}
        </button>
      </div>
    </form>
  )
}

function StatusDot({ phase }: { phase: Phase }) {
  if (phase === 'processing') {
    return (
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-status absolute inline-flex h-full w-full rounded-full bg-accent-500" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-600" />
      </span>
    )
  }
  if (phase === 'result') {
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white">
        <Check size={11} />
      </span>
    )
  }
  return <Sparkles size={16} className="shrink-0 text-ink-400" />
}

/* ───────────── Inline-Ergebnis (ersetzt die Ladeansicht) ───────────── */

function IdeaResult({ idea }: { idea: Idea }) {
  const navigate = useNavigate()
  const spec = idea.concept
  const variants = spec ? buildVariants(spec) : []
  const recommended = variants.find((v) => v.recommended)?.tier ?? 'standard'
  const [tier, setTier] = useState<VariantTier>(recommended)

  // Preisspanne kommt ausschließlich aus der echten Herstellerkalkulation.
  const [offers, setOffers] = useState<ManufacturerOffer[] | null>(null)
  useEffect(() => {
    let cancelled = false
    loadManufacturerOffers()
      .then((o) => !cancelled && setOffers(o))
      .catch(() => !cancelled && setOffers([]))
    return () => {
      cancelled = true
    }
  }, [])
  const priceLabel = (v: Variant): string => {
    if (!spec) return ''
    if (offers === null) return 'Preis wird berechnet …'
    const r = estimateVariant(spec, v, offers)
    return r ? formatRange(r) : 'Preis auf Anfrage'
  }

  const previewUrl = idea.preview_image_url ?? idea.concept_sheet_url ?? idea.image_url
  const conceptUrl = idea.concept_sheet_url ?? idea.image_url

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      {/* Visualisierung + Konzeptblatt */}
      <div>
        <div className="flex items-center gap-2 text-accent-600">
          <Sparkles size={16} />
          <span className="text-sm font-medium">Dein Konzept ist fertig</span>
        </div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
          {spec?.titel ?? 'Dein Entwurf'}
        </h2>
        {spec?.kurzbeschreibung && (
          <p className="mt-2 max-w-2xl text-pretty leading-relaxed text-ink-500">
            {spec.kurzbeschreibung}
          </p>
        )}

        <motion.a
          href={previewUrl ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="group mt-5 block overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-lift"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={spec?.titel ?? 'Produktvorschau'}
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center text-ink-300">
              Keine Vorschau
            </div>
          )}
        </motion.a>

        {conceptUrl && (
          <a
            href={conceptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-soft transition-colors hover:border-ink-300"
          >
            <FileText size={15} /> Verbindliches Konzeptblatt ansehen
            <ArrowUpRight size={14} className="text-ink-400" />
          </a>
        )}
      </div>

      {/* Varianten + Aktionen */}
      <aside className="flex flex-col gap-3">
        <p className="text-sm font-medium text-ink-500">Umsetzung wählen</p>
        {variants.map((v) => {
          const activeTier = v.tier === tier
          return (
            <button
              key={v.tier}
              type="button"
              onClick={() => setTier(v.tier)}
              className={cn(
                'w-full rounded-2xl border p-4 text-left transition-all',
                activeTier
                  ? 'border-accent-600 bg-accent-50/40 ring-1 ring-accent-600'
                  : 'border-ink-100 hover:border-ink-200 hover:bg-ink-50/40',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-semibold text-ink-950">
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full border',
                      activeTier ? 'border-accent-600 bg-accent-600 text-white' : 'border-ink-300',
                    )}
                  >
                    {activeTier && <Check size={11} />}
                  </span>
                  {v.title}
                </span>
                {v.recommended && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-accent-600">
                    Empfohlen
                  </span>
                )}
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2 pl-6">
                <span className="text-base font-semibold text-ink-950">
                  {priceLabel(v)}
                </span>
                <span className="shrink-0 text-xs text-ink-400">
                  {v.leadTimeWeeks[0]}–{v.leadTimeWeeks[1]} Wochen
                </span>
              </div>
            </button>
          )
        })}

        {variants.length > 0 && (
          <p className="text-[11px] leading-relaxed text-ink-400">
            Geschätzte Preisspanne auf Basis der tatsächlichen Herstellerkalkulation.
          </p>
        )}

        <Button
          size="lg"
          onClick={() => navigate(`/checkout/${idea.id}?variant=${tier}`)}
          className="group mt-1 w-full"
        >
          Zur Bestellung
          <ArrowRight
            size={18}
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </Button>
        <button
          type="button"
          onClick={() => navigate(`/result/${idea.id}`)}
          className="inline-flex items-center justify-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
        >
          <Wand2 size={15} /> Im Design-Studio verfeinern
        </button>
      </aside>
    </div>
  )
}

/* ───────────── Hinweis-Karte (Ablehnung / Fehler) ───────────── */

function NoticeCard({
  tone,
  title,
  body,
  onAction,
  actionLabel,
}: {
  tone: 'amber' | 'rose'
  title: string
  body: string
  onAction: () => void
  actionLabel: string
}) {
  const styles =
    tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-500'
      : 'border-rose-200 bg-rose-50 text-rose-500'
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-soft">
      <span className={cn('mx-auto flex h-14 w-14 items-center justify-center rounded-2xl', styles)}>
        <Sparkles size={26} />
      </span>
      <h3 className="mt-5 text-2xl font-semibold text-ink-950">{title}</h3>
      <p className="mt-3 text-pretty leading-relaxed text-ink-500">{body}</p>
      <Button onClick={onAction} className="group mt-6">
        {actionLabel}
        <ArrowRight
          size={18}
          className="transition-transform duration-300 group-hover:translate-x-0.5"
        />
      </Button>
    </div>
  )
}
