import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AmbientScene } from '@/components/ui/AmbientScene'

/**
 * Sichtbare KI-Aktivität: die Schritte laufen ruhig nacheinander durch – der
 * aktuelle Schritt schimmert, erledigte bekommen ein Häkchen. Die Komponente
 * verwaltet ihren Fortschritt selbst; sie mountet frisch bei jedem Erscheinen.
 */
export function AiActivityStream({
  stages,
  interval = 2600,
  className,
}: {
  stages: string[]
  interval?: number
  className?: string
}) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setInterval(
      () => setStep((s) => Math.min(s + 1, stages.length - 1)),
      interval,
    )
    return () => clearInterval(t)
  }, [stages.length, interval])

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {stages.map((s, i) => {
        const finished = i < step
        const active = i === step
        return (
          <div key={s} className="flex items-center gap-3 text-sm">
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                finished
                  ? 'border-accent-600 bg-accent-600 text-white'
                  : active
                    ? 'border-accent-500'
                    : 'border-ink-200',
              )}
            >
              {finished ? (
                <Check size={11} />
              ) : active ? (
                <span className="animate-status h-1.5 w-1.5 rounded-full bg-accent-500" />
              ) : null}
            </span>
            <span
              className={cn(
                active ? 'text-shimmer font-medium' : finished ? 'text-ink-700' : 'text-ink-400',
              )}
            >
              {s}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Vollflächiges, ruhiges Overlay während die KI arbeitet – mit Ambient-Licht,
 * pulsierendem Fokuspunkt und der Aktivitäts-Liste.
 */
export function GenerationOverlay({
  show,
  title = 'Dein Entwurf entsteht',
  subtitle = 'Das dauert nur einen Moment.',
  stages,
}: {
  show: boolean
  title?: string
  subtitle?: string
  stages: string[]
}) {
  return <AnimatePresence>{show && <OverlayCard title={title} subtitle={subtitle} stages={stages} />}</AnimatePresence>
}

function OverlayCard({
  title,
  subtitle,
  stages,
}: {
  title: string
  subtitle: string
  stages: string[]
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-white/70 p-6 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-ink-100 bg-white p-8 shadow-lift"
      >
        <AmbientScene />
        <div className="mx-auto flex h-14 w-14 items-center justify-center">
          <span className="relative flex h-14 w-14 items-center justify-center">
            <span className="animate-status absolute inline-flex h-full w-full rounded-full bg-accent-400/30" />
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ink-950 text-white">
              <Sparkles size={20} />
            </span>
          </span>
        </div>
        <h3 className="mt-5 text-center text-xl font-semibold text-ink-950">{title}</h3>
        <p className="mt-1 text-center text-sm text-ink-400">{subtitle}</p>
        <AiActivityStream stages={stages} className="mt-6" />
      </motion.div>
    </motion.div>
  )
}
