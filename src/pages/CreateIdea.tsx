import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { useAuth } from '@/context/AuthContext'
import { getMyProfile } from '@/lib/profile'
import { createIdea, requestSketch } from '@/lib/ideas'

// Beispiel-Eingaben in natürlicher Sprache (keine Formularfelder).
const EXAMPLES = [
  'Ich möchte ein 2,30 m langes TV-Board in schwarzer Eichenoptik mit drei Türen.',
  'Ich möchte einen runden Esstisch aus Eiche für 6 Personen, modern, aber nicht zu teuer.',
  'Ich möchte einen hochwertigen Schreibtisch aus massiver Eiche mit Kabelmanagement.',
]

export function CreateIdea() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Freundlicher Hinweis, wenn die Eingabe kein Möbelstück ist (status 'rejected').
  const [rejection, setRejection] = useState<string | null>(null)

  // Vornamen für die persönliche Begrüßung laden (Fallback: E-Mail-Teil).
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
    setGenerating(true)
    try {
      // Idee als echtes Projekt speichern (freie Beschreibung, keine Formularfelder).
      const idea = await createIdea({
        prompt,
        style: null,
        materials: [],
        category: null,
        budget: null,
        images: [],
      })
      // KI-Pipeline: Analyse → (Möbel?) → Bild + Konzeptblatt.
      const updated = await requestSketch(idea.id)
      if (updated.status === 'rejected') {
        setGenerating(false)
        setRejection(
          updated.error ??
            'IdeaForge ist aktuell ausschließlich auf die Entwicklung und Anfertigung von Möbelstücken spezialisiert. Bitte beschreibe ein Möbelstück, das du gestalten möchtest.',
        )
        return
      }
      navigate(`/result/${idea.id}`)
    } catch (e) {
      setGenerating(false)
      setError(e instanceof Error ? e.message : 'Erstellung fehlgeschlagen.')
    }
  }

  const greetingName = firstName ? `${firstName}` : 'da'

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-cream to-white" />

      <Container className="max-w-2xl py-20 sm:py-24">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-700 shadow-soft">
            <Sparkles size={14} className="text-accent-600" />
            Neue Möbelidee
          </span>
          <h1 className="mt-6 text-balance text-3xl font-semibold leading-[1.15] text-ink-950 sm:text-4xl">
            Hallo {greetingName}, welche Idee wollen wir heute in die Realität
            umsetzen?
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-500">
            Beschreibe dein Wunschmöbel einfach in deinen eigenen Worten – der
            Rest passiert automatisch.
          </p>
        </Reveal>

        <Reveal>
          <div className="mt-8">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              autoFocus
              placeholder="z. B. Ich möchte ein 2,30 m langes TV-Board in schwarzer Eichenoptik mit drei Türen …"
              className="w-full resize-none rounded-3xl border border-ink-200 bg-white p-5 text-[1.05rem] leading-relaxed text-ink-900 shadow-soft outline-none transition-all placeholder:text-ink-300 focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
            />

            {/* Beispiel-Chips (nur zum Reinklicken, kein Pflichtfeld) */}
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setPrompt(ex)}
                  className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-left text-xs text-ink-500 transition-colors hover:border-ink-300 hover:text-ink-800"
                >
                  {ex.length > 56 ? ex.slice(0, 56) + '…' : ex}
                </button>
              ))}
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}
            {rejection && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <Sparkles size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <span>{rejection}</span>
              </div>
            )}

            <Button
              size="lg"
              onClick={generate}
              disabled={generating}
              className="group mt-6 w-full"
            >
              <Sparkles size={18} />
              {generating ? 'Idee wird erstellt …' : 'Idee erstellen'}
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Button>
            <p className="mt-3 text-center text-xs text-ink-400">
              Aus deiner Beschreibung entstehen Visualisierung, Konzeptblatt und
              Preisabschätzung.
            </p>
          </div>
        </Reveal>
      </Container>

      <GeneratingOverlay show={generating} />
    </div>
  )
}

/* ───────────── Overlay während der Generierung ───────────── */

function GeneratingOverlay({ show }: { show: boolean }) {
  const stages = [
    'Idee wird analysiert',
    'Designkonzept wird entworfen',
    'Visualisierung wird gerendert',
    'Konzeptblatt & Maße werden erstellt',
  ]
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="glass fixed inset-0 z-[60] flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-ink-100 bg-white p-9 text-center shadow-lift"
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-violet-accent text-white shadow-float"
            >
              <Sparkles size={26} />
            </motion.span>
            <h3 className="mt-6 text-xl font-semibold text-ink-950">
              Deine Idee entsteht
            </h3>
            <div className="mt-6 flex w-full flex-col gap-3">
              {stages.map((s, i) => (
                <motion.div
                  key={s}
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.5, duration: 0.4 }}
                  className="flex items-center gap-3 text-left text-sm text-ink-600"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.5 + 0.2 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-100 text-accent-600"
                  >
                    <Sparkles size={11} />
                  </motion.span>
                  {s}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
