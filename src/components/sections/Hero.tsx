import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Wand2 } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { RenderingPlaceholder } from '@/components/ui/RenderingPlaceholder'

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-28 sm:pt-32">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-white to-white" />
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-accent-200/40 blur-[120px]" />
        <div className="absolute right-[8%] top-[20%] h-[320px] w-[320px] rounded-full bg-violet-accent/20 blur-[110px]" />
        <div className="absolute inset-0 grain opacity-60" />
      </div>

      <Container className="flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-ink-700 shadow-soft backdrop-blur">
            <Sparkles size={14} className="text-accent-600" />
            KI-gestütztes Produktdesign
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.06, ease }}
          className="mt-7 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-tight text-ink-950 sm:text-6xl md:text-7xl"
        >
          Bring deine Idee <br className="hidden sm:block" />
          in die <span className="gradient-text">Realität.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.14, ease }}
          className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-ink-500 sm:text-xl"
        >
          Beschreibe dein Wunschprodukt – unsere KI entwickelt daraus ein Design
          und verbindet dich mit den passenden Herstellern.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.22, ease }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Button to="/create" size="lg" className="group">
            Jetzt starten
            <ArrowRight
              size={18}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </Button>
          <Button to="/result" size="lg" variant="secondary">
            Beispiel-Design ansehen
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-5 text-sm text-ink-400"
        >
          Kostenlos starten · Keine Kreditkarte · In 30 Sekunden zum Design
        </motion.p>
      </Container>

      {/* animated preview */}
      <Container className="mt-16">
        <HeroPreview />
      </Container>
    </section>
  )
}

function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.34, ease }}
      className="relative mx-auto max-w-4xl"
    >
      <div className="glass overflow-hidden rounded-3xl border border-ink-100 shadow-lift">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-3.5">
          <span className="h-3 w-3 rounded-full bg-ink-200" />
          <span className="h-3 w-3 rounded-full bg-ink-200" />
          <span className="h-3 w-3 rounded-full bg-ink-200" />
          <div className="ml-3 flex-1 rounded-md bg-ink-100/70 px-3 py-1 text-left text-xs text-ink-400">
            ideaforge.app/create
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-2">
          {/* prompt side */}
          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-medium text-ink-500">
              <Wand2 size={15} className="text-accent-600" />
              Deine Idee
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-4 text-left text-[0.95rem] leading-relaxed text-ink-800">
              <TypingLine />
            </div>
            <div className="flex flex-wrap gap-2">
              {['Japandi', 'Eiche', 'Indirekte LED'].map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-auto flex items-center gap-2 rounded-xl bg-accent-600 px-4 py-2.5 text-sm font-medium text-white">
              <Sparkles size={15} />
              Design wird generiert…
            </div>
          </div>

          {/* rendering side */}
          <div className="border-t border-ink-100 p-6 sm:p-8 md:border-l md:border-t-0">
            <RenderingPlaceholder variant="cabinet" className="shadow-float" />
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-950">
                  Aurelio — TV-Board
                </p>
                <p className="text-xs text-ink-400">
                  Japandi · Eiche & Anthrazit
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                ~ 2.480 €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* floating chip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.9, ease }}
        className="absolute -right-3 top-1/3 hidden rounded-2xl border border-ink-100 bg-white px-4 py-3 shadow-lift sm:flex"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Sparkles size={16} />
          </span>
          <div className="text-left">
            <p className="text-xs font-semibold text-ink-950">6 Hersteller</p>
            <p className="text-[11px] text-ink-400">in deiner Nähe</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function TypingLine() {
  const text =
    'Ich möchte ein TV-Board mit schwebendem Design und versteckten Kabeln im Japandi-Stil.'
  return (
    <span>
      {text}
      <motion.span
        aria-hidden
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
        className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-accent-600"
      />
    </span>
  )
}
