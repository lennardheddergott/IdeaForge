import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Check,
  Clock,
  MapPin,
  Search,
  Send,
  Star,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'
import { manufacturers, type Manufacturer } from '@/data/manufacturers'

const priceFilters = [
  { id: 0, label: 'Alle' },
  { id: 1, label: '€' },
  { id: 2, label: '€€' },
  { id: 3, label: '€€€' },
]

export function Manufacturers() {
  const [query, setQuery] = useState('')
  const [price, setPrice] = useState(0)
  const [sent, setSent] = useState<string[]>([])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return manufacturers.filter((m) => {
      const matchesPrice = price === 0 || m.priceLevel === price
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.specialization.toLowerCase().includes(q) ||
        m.location.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      return matchesPrice && matchesQuery
    })
  }, [query, price])

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-cream to-white" />

      <Container className="py-14 sm:py-16">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-700 shadow-soft">
            <BadgeCheck size={14} className="text-accent-600" />
            Schritt 3 von 3 · Produktionspartner
          </span>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.05] text-ink-950 sm:text-5xl">
            Passende Hersteller für dein Design
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-500">
            Kuratierte, geprüfte Manufakturen, die dein Unikat fertigen können –
            sortiert nach Eignung für „Aurelio — TV-Board".
          </p>
        </Reveal>

        {/* controls */}
        <Reveal>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suche nach Name, Material, Stadt…"
                className="h-12 w-full rounded-full border border-ink-200 bg-white pl-11 pr-4 text-sm text-ink-900 shadow-soft outline-none transition-all placeholder:text-ink-300 focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
              />
            </div>
            <div className="flex gap-2">
              {priceFilters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPrice(f.id)}
                  className={cn(
                    'h-12 rounded-full border px-5 text-sm font-medium transition-all',
                    price === f.id
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* grid */}
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m, i) => (
            <Reveal key={m.id} delay={(i % 3) * 0.06}>
              <ManufacturerCard
                m={m}
                sent={sent.includes(m.id)}
                onSend={() => setSent((prev) => [...prev, m.id])}
              />
            </Reveal>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-16 text-center text-ink-400">
            Keine Hersteller gefunden. Passe deine Suche an.
          </p>
        )}
      </Container>
    </div>
  )
}

function ManufacturerCard({
  m,
  sent,
  onSend,
}: {
  m: Manufacturer
  sent: boolean
  onSend: () => void
}) {
  return (
    <div className="group flex h-full flex-col rounded-3xl border border-ink-100 bg-white p-6 shadow-soft transition-all duration-300 ease-[var(--ease-smooth)] hover:-translate-y-1 hover:border-ink-200 hover:shadow-lift">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-950 text-sm font-semibold text-white">
            {m.initials}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-ink-950">{m.name}</h3>
              {m.verified && (
                <BadgeCheck size={15} className="text-accent-600" />
              )}
            </div>
            <p className="flex items-center gap-1 text-xs text-ink-400">
              <MapPin size={12} /> {m.location} · {m.distanceKm} km
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <Star size={12} className="fill-amber-500 text-amber-500" />
          {m.rating.toFixed(1)}
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-ink-800">{m.specialization}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{m.blurb}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {m.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600"
          >
            {t}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4 text-sm">
        <span className="flex items-center gap-1.5 text-ink-500">
          <Clock size={14} /> {m.leadTime}
        </span>
        <span className="flex items-center gap-1">
          {[1, 2, 3].map((lvl) => (
            <span
              key={lvl}
              className={cn(
                'text-sm font-semibold',
                lvl <= m.priceLevel ? 'text-ink-900' : 'text-ink-200',
              )}
            >
              €
            </span>
          ))}
        </span>
      </div>

      <div className="mt-5">
        {sent ? (
          <div className="flex h-11 items-center justify-center gap-2 rounded-full bg-emerald-50 text-sm font-medium text-emerald-600">
            <Check size={16} /> Anfrage gesendet
          </div>
        ) : (
          <Button onClick={onSend} className="w-full" size="md">
            <Send size={16} /> Anfrage senden
          </Button>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-ink-400">
        {m.reviews} verifizierte Bewertungen
      </p>
    </div>
  )
}
