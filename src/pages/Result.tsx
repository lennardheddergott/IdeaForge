import { useState } from 'react'
import {
  ArrowRight,
  Box,
  Check,
  Factory,
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
import { formatEUR } from '@/lib/utils'
import { cn } from '@/lib/utils'

const views = [
  { variant: 'cabinet' as const, label: 'Frontansicht' },
  { variant: 'table' as const, label: 'Perspektive' },
  { variant: 'lamp' as const, label: 'Detail · LED' },
  { variant: 'sofa' as const, label: 'Im Raum' },
]

export function Result() {
  const [active, setActive] = useState(0)

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-cream to-white" />

      <Container className="py-14 sm:py-16">
        <Reveal>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-sm font-medium text-emerald-600">
              <Check size={14} /> Design generiert
            </span>
            <span className="text-sm text-ink-400">Schritt 2 von 3</span>
          </div>
          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-balance text-4xl font-semibold leading-[1.05] text-ink-950 sm:text-5xl">
                {d.title}
              </h1>
              <p className="mt-3 text-lg text-ink-500">{d.tagline}</p>
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
            </div>
          </Reveal>

          {/* summary / pricing */}
          <Reveal delay={0.08}>
            <Card className="sticky top-24 p-7">
              <div className="flex items-center gap-2 text-sm font-medium text-ink-500">
                <Sparkles size={15} className="text-accent-600" /> Preisabschätzung
              </div>
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
              {d.summary}
            </p>
          </Card>
        </Reveal>

        {/* detail grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* materials */}
          <Reveal>
            <Card className="h-full p-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
                <Layers size={18} className="text-accent-600" /> Materialempfehlungen
              </h2>
              <dl className="mt-5 divide-y divide-ink-100">
                {d.materials.map((m) => (
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
                {d.dimensions.map((dim) => (
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
                {d.properties.map((p) => (
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

        {/* sustainability */}
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
      </Container>
    </div>
  )
}
