import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { AmbientScene } from '@/components/ui/AmbientScene'
import { ProcessingView } from '@/components/ui/ProcessingView'
import { useAuth } from '@/context/AuthContext'
import { getMyProfile } from '@/lib/profile'
import { createIdea, requestSketch } from '@/lib/ideas'

const EXAMPLES = [
  'Ein 2,30 m langes TV-Board in schwarzer Eichenoptik mit drei Türen.',
  'Ein runder Esstisch aus Eiche für 6 Personen, modern, nicht zu teuer.',
  'Ein Schreibtisch aus massiver Eiche mit Kabelmanagement.',
]

export function CreateIdea() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Idee vom Startseiten-Eingabefeld direkt übernehmen (einmalig).
  const [firstName, setFirstName] = useState('')
  const [prompt, setPrompt] = useState(() => sessionStorage.getItem('ideaforge:draft') ?? '')
  // Kam die Idee von der Startseite, starten wir sofort – ohne Zwischenschritt.
  const [generating, setGenerating] = useState(
    () => Boolean(sessionStorage.getItem('ideaforge:draft')?.trim()),
  )
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rejection, setRejection] = useState<string | null>(null)
  const readyIdRef = useRef<string | null>(null)
  const autoStarted = useRef(false)

  useEffect(() => {
    let cancelled = false
    getMyProfile()
      .then((p) => {
        if (cancelled) return
        const source = p?.full_name || user?.email || ''
        setFirstName(source.split(/[\s@.]+/)[0] ?? '')
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user?.email])

  const generate = async () => {
    if (!prompt.trim()) {
      setError('Bitte beschreibe zuerst deine Möbelidee.')
      return
    }
    setError(null)
    setRejection(null)
    setReady(false)
    readyIdRef.current = null
    setGenerating(true)
    try {
      const idea = await createIdea({
        prompt,
        style: null,
        materials: [],
        category: null,
        budget: null,
        images: [],
      })
      readyIdRef.current = idea.id
      const updated = await requestSketch(idea.id)
      if (updated.status === 'rejected') {
        setGenerating(false)
        setRejection(
          updated.error ??
            'Forma ist aktuell ausschließlich auf die Entwicklung und Anfertigung von Möbelstücken spezialisiert. Bitte beschreibe ein Möbelstück, das du gestalten möchtest.',
        )
        return
      }
      setReady(true)
    } catch (e) {
      setGenerating(false)
      setError(e instanceof Error ? e.message : 'Erstellung fehlgeschlagen.')
    }
  }

  // Von der Startseite übergebene Idee sofort verarbeiten (kein zweiter Hero).
  useEffect(() => {
    const draft = sessionStorage.getItem('ideaforge:draft')
    sessionStorage.removeItem('ideaforge:draft')
    if (!autoStarted.current && draft?.trim()) {
      autoStarted.current = true
      generate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDone = useCallback(() => {
    if (readyIdRef.current) navigate(`/result/${readyIdRef.current}`)
  }, [navigate])

  const greeting = firstName ? `Hallo ${firstName},` : 'Los geht’s –'

  return (
    <div className="relative min-h-[85vh]">
      <AnimatePresence mode="wait">
        {generating ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ProcessingView prompt={prompt} ready={ready} onDone={handleDone} />
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <AmbientScene className="h-[70vh]" />
            <Container className="flex min-h-[80vh] max-w-2xl flex-col justify-center py-16">
              <h1 className="text-center text-2xl font-semibold tracking-tight text-ink-950 sm:text-[2rem]">
                {greeting} was sollen wir entwerfen?
              </h1>

              <div className="mt-8">
                {/* Eingabe mit dezentem Fokus-Licht */}
                <div className="group relative">
                  <div className="pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] bg-accent-400/0 blur-2xl transition-colors duration-500 group-focus-within:bg-accent-400/20" />
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generate()
                    }}
                    rows={4}
                    autoFocus
                    placeholder="z. B. Ein schwebendes TV-Board aus Eiche mit versteckten Kabeln …"
                    className="w-full resize-none rounded-3xl border border-ink-200 bg-white/90 p-5 text-[1.05rem] leading-relaxed text-ink-900 shadow-soft outline-none backdrop-blur transition-all placeholder:text-ink-300 focus:border-accent-400"
                  />
                </div>

                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setPrompt(ex)}
                      className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-left text-xs text-ink-500 transition-colors hover:border-ink-300 hover:text-ink-800"
                    >
                      {ex.length > 46 ? ex.slice(0, 46) + '…' : ex}
                    </button>
                  ))}
                </div>

                {error && (
                  <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                )}
                {rejection && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <Sparkles size={16} className="mt-0.5 shrink-0 text-amber-500" />
                    <span>{rejection}</span>
                  </div>
                )}

                <Button size="lg" onClick={generate} className="group mt-6 w-full">
                  <Sparkles size={18} />
                  Entwurf erstellen
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  />
                </Button>
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
