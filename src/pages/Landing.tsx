import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, PencilLine, Sparkles, Truck } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { AmbientScene } from '@/components/ui/AmbientScene'
import { useAuth } from '@/context/AuthContext'

const STEPS = [
  {
    icon: PencilLine,
    title: 'Idee beschreiben',
    text: 'Sag in einem Satz, was du dir vorstellst – ganz normale Sprache genügt.',
  },
  {
    icon: Sparkles,
    title: 'Konzept & Preis erhalten',
    text: 'Die KI entwickelt Design, Maße und Preis – in wenigen Minuten.',
  },
  {
    icon: Truck,
    title: 'Umsetzen lassen',
    text: 'Wähle eine Variante und lass sie von einem passenden Hersteller anfertigen.',
  },
]

const FAQ = [
  {
    q: 'Was kostet es, eine Idee zu entwickeln?',
    a: 'Das Beschreiben und Gestalten ist kostenlos. Einen Preis siehst du direkt beim Konzept.',
  },
  {
    q: 'Wer setzt mein Produkt um?',
    a: 'Ein Hersteller aus unserem Netzwerk übernimmt die Umsetzung, sobald du eine Variante anfragst.',
  },
  {
    q: 'Muss ich Fachwissen mitbringen?',
    a: 'Nein. Du beschreibst, was du dir vorstellst – um alles Weitere kümmert sich die KI.',
  },
]

export function Landing() {
  const { role } = useAuth()
  if (role === 'manufacturer') return <Navigate to="/manufacturer" replace />

  return (
    <div className="bg-white">
      {/* Hero – die Eingabe ist der Mittelpunkt */}
      <section className="relative overflow-hidden pt-36 pb-24 sm:pt-44 sm:pb-32">
        <AmbientScene />
        <Container className="flex flex-col items-center text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white/70 px-3.5 py-1.5 text-sm font-medium text-ink-600 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-status absolute inline-flex h-full w-full rounded-full bg-accent-500" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-600" />
              </span>
              Ideen werden Realität
            </span>
          </Reveal>
          <Reveal>
            <h1 className="mt-7 max-w-3xl text-balance text-5xl font-semibold leading-[1.03] tracking-tight text-ink-950 sm:text-7xl">
              Aus deiner Idee wird ein Produkt.
            </h1>
          </Reveal>
          <Reveal>
            <p className="mt-6 max-w-lg text-balance text-lg leading-relaxed text-ink-500">
              Beschreibe deine Idee. IdeaForge entwickelt daraus ein fertiges
              Konzept – in wenigen Minuten.
            </p>
          </Reveal>

          <Reveal>
            <HeroInput />
          </Reveal>
        </Container>
      </section>

      {/* So funktioniert's */}
      <section className="border-t border-ink-100 py-20 sm:py-28">
        <Container>
          <Reveal>
            <h2 className="text-center text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
              In drei Schritten zum Produkt
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.05}>
                <div className="text-center sm:text-left">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-50 text-accent-600 sm:mx-0">
                    <s.icon size={20} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-ink-950">
                    {i + 1}. {s.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-ink-500">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* Kurze FAQ */}
      <section className="border-t border-ink-100 py-20 sm:py-28">
        <Container className="max-w-2xl">
          <Reveal>
            <h2 className="text-center text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
              Häufige Fragen
            </h2>
          </Reveal>
          <div className="mt-10 divide-y divide-ink-100">
            {FAQ.map((f) => (
              <div key={f.q} className="py-6">
                <h3 className="font-semibold text-ink-950">{f.q}</h3>
                <p className="mt-2 leading-relaxed text-ink-500">{f.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Abschluss */}
      <section className="border-t border-ink-100 py-20 sm:py-24">
        <Container className="flex flex-col items-center text-center">
          <h2 className="max-w-xl text-balance text-2xl font-semibold tracking-tight text-ink-950 sm:text-3xl">
            Bereit, deine Idee zu starten?
          </h2>
          <div className="mt-8">
            <Button to="/create" size="lg" className="group">
              Idee starten
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Button>
          </div>
        </Container>
      </section>
    </div>
  )
}

/* ───────────── Das zentrale Eingabefeld ───────────── */

function HeroInput() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')

  const start = () => {
    const text = value.trim()
    if (text) sessionStorage.setItem('ideaforge:draft', text)
    navigate('/create')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        start()
      }}
      className="group relative mt-11 w-full max-w-xl"
    >
      {/* dezentes Fokus-Licht */}
      <div className="pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] bg-accent-400/0 blur-2xl transition-colors duration-500 group-focus-within:bg-accent-400/20" />
      <div className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-white/90 p-2 pl-5 shadow-soft backdrop-blur transition-colors focus-within:border-accent-400">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Beschreibe deine Idee …"
          aria-label="Beschreibe deine Idee"
          className="h-11 flex-1 bg-transparent text-[1.05rem] text-ink-900 outline-none placeholder:text-ink-300"
        />
        <button
          type="submit"
          className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-ink-950 px-4 text-sm font-medium text-white transition-colors hover:bg-ink-800"
        >
          Idee starten
          <ArrowRight size={16} />
        </button>
      </div>

      {/* klickbare Vorschläge */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {[
          'Schwebendes TV-Board aus Eiche',
          'Runder Esstisch für 6 Personen',
          'Schreibtisch mit Kabelmanagement',
        ].map((ex) => (
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
  )
}
