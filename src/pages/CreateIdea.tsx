import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  ImagePlus,
  Layers,
  Palette,
  Sparkles,
  Tag,
  Wallet,
  X,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'
import { createIdea, requestSketch } from '@/lib/ideas'
import {
  budgets,
  categories,
  materials,
  promptExamples,
  styles,
} from '@/data/options'

export function CreateIdea() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<string | null>('japandi')
  const [mats, setMats] = useState<string[]>(['oak'])
  const [category, setCategory] = useState<string | null>('tvboard')
  const [budget, setBudget] = useState<string | null>('b3')
  const [images, setImages] = useState<File[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleMat = (id: string) =>
    setMats((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    )

  const addImages = (files: FileList | null) => {
    if (!files) return
    const next = Array.from(files).slice(0, 4 - images.length)
    setImages((prev) => [...prev, ...next])
  }

  const generate = async () => {
    if (!prompt.trim()) {
      setError('Bitte beschreibe zuerst deine Idee.')
      return
    }
    setError(null)
    setGenerating(true)
    try {
      // 1) Idee speichern (status 'pending', user_id + Zeitstempel in der DB).
      const idea = await createIdea({
        prompt,
        style,
        materials: mats,
        category,
        budget,
        images,
      })
      // 2) KI-Konzeptskizze erzeugen lassen (OpenAI via Edge Function).
      //    Die Function schreibt image_url + Status zurück in die DB.
      await requestSketch(idea.id)
      // 3) Ergebnis anzeigen.
      navigate(`/result/${idea.id}`)
    } catch (e) {
      setGenerating(false)
      setError(
        e instanceof Error ? e.message : 'Generierung fehlgeschlagen.',
      )
    }
  }

  return (
    <div className="relative">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-cream to-white" />

      <Container className="max-w-4xl py-16 sm:py-20">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-700 shadow-soft">
            <Sparkles size={14} className="text-accent-600" />
            Schritt 1 von 3 · Idee
          </span>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.06] text-ink-950 sm:text-5xl">
            Beschreibe dein Wunschprodukt
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-500">
            Je konkreter du wirst, desto besser das Ergebnis. Stil, Material und
            Budget helfen unserer KI, dein Design zu treffen.
          </p>
        </Reveal>

        <div className="mt-12 flex flex-col gap-10">
          {/* prompt */}
          <Field
            icon={Sparkles}
            label="Deine Idee"
            hint="In natürlicher Sprache – ein Satz reicht."
          >
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="z. B. Ich möchte ein TV-Board mit schwebendem Design und versteckten Kabeln…"
              className="w-full resize-none rounded-2xl border border-ink-200 bg-white p-5 text-[1.05rem] leading-relaxed text-ink-900 shadow-soft outline-none transition-all placeholder:text-ink-300 focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {promptExamples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-left text-xs text-ink-500 transition-colors hover:border-ink-300 hover:text-ink-800"
                >
                  {ex.length > 52 ? ex.slice(0, 52) + '…' : ex}
                </button>
              ))}
            </div>
          </Field>

          {/* image upload */}
          <Field
            icon={ImagePlus}
            label="Inspirationsbilder"
            hint="Optional · bis zu 4 Bilder"
          >
            <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-300 bg-white/60 px-6 py-9 text-center transition-colors hover:border-accent-400 hover:bg-accent-50/40">
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => addImages(e.target.files)}
              />
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-ink-500 transition-colors group-hover:bg-accent-100 group-hover:text-accent-600">
                <ImagePlus size={20} />
              </span>
              <span className="text-sm font-medium text-ink-700">
                Bilder hierher ziehen oder auswählen
              </span>
              <span className="text-xs text-ink-400">PNG, JPG bis 10 MB</span>
            </label>
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((file, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 rounded-full bg-ink-100 py-1 pl-3 pr-1.5 text-xs text-ink-700"
                  >
                    {file.name.length > 22 ? file.name.slice(0, 22) + '…' : file.name}
                    <button
                      onClick={() =>
                        setImages((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-200 text-ink-600 hover:bg-ink-300"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Field>

          {/* style */}
          <Field icon={Palette} label="Stil" hint="Wähle eine Richtung">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {styles.map((s) => (
                <SelectCard
                  key={s.id}
                  active={style === s.id}
                  onClick={() => setStyle(s.id)}
                  title={s.label}
                  hint={s.hint}
                />
              ))}
            </div>
          </Field>

          {/* materials */}
          <Field
            icon={Layers}
            label="Materialpräferenzen"
            hint="Mehrfachauswahl möglich"
          >
            <div className="flex flex-wrap gap-2.5">
              {materials.map((m) => (
                <Chip
                  key={m.id}
                  active={mats.includes(m.id)}
                  onClick={() => toggleMat(m.id)}
                >
                  {m.label}
                </Chip>
              ))}
            </div>
          </Field>

          {/* category */}
          <Field icon={Tag} label="Kategorie">
            <div className="flex flex-wrap gap-2.5">
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  active={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                </Chip>
              ))}
            </div>
          </Field>

          {/* budget */}
          <Field icon={Wallet} label="Budget">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {budgets.map((b) => (
                <SelectCard
                  key={b.id}
                  active={budget === b.id}
                  onClick={() => setBudget(b.id)}
                  title={b.label}
                  hint={b.hint}
                />
              ))}
            </div>
          </Field>
        </div>

        {/* submit */}
        <div className="sticky bottom-6 mt-12">
          {error && (
            <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="glass flex flex-col items-center justify-between gap-4 rounded-2xl border border-ink-100 p-4 shadow-lift sm:flex-row sm:px-6">
            <p className="text-sm text-ink-500">
              Bereit? Deine KI-Vorschau ist in ~30 Sekunden fertig.
            </p>
            <Button
              size="lg"
              onClick={generate}
              className="group w-full sm:w-auto"
            >
              <Sparkles size={18} />
              Design generieren
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Button>
          </div>
        </div>
      </Container>

      <GeneratingOverlay show={generating} />
    </div>
  )
}

/* ───────────── helpers ───────────── */

function Field({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <Reveal>
      <div>
        <div className="mb-3.5 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950 text-white">
            <Icon size={15} />
          </span>
          <h3 className="text-base font-semibold text-ink-950">{label}</h3>
          {hint && <span className="text-sm text-ink-400">· {hint}</span>}
        </div>
        {children}
      </div>
    </Reveal>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
        active
          ? 'border-accent-600 bg-accent-600 text-white shadow-soft'
          : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900',
      )}
    >
      {children}
    </button>
  )
}

function SelectCard({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean
  onClick: () => void
  title: string
  hint?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col gap-0.5 rounded-2xl border p-4 text-left transition-all duration-200',
        active
          ? 'border-accent-600 bg-accent-50 ring-1 ring-accent-600'
          : 'border-ink-200 bg-white hover:border-ink-300 hover:shadow-soft',
      )}
    >
      <span
        className={cn(
          'text-sm font-semibold',
          active ? 'text-accent-700' : 'text-ink-900',
        )}
      >
        {title}
      </span>
      {hint && <span className="text-xs text-ink-400">{hint}</span>}
    </button>
  )
}

function GeneratingOverlay({ show }: { show: boolean }) {
  const stages = [
    'Idee wird analysiert',
    'Designkonzept wird entworfen',
    'Renderings werden gerendert',
    'Materialien & Maße werden berechnet',
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
              Dein Design entsteht
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
