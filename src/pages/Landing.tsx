import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, PencilLine, Sparkles, Truck } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { IdeaFlow } from '@/components/workspace/IdeaFlow'
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
  const [workspaceActive, setWorkspaceActive] = useState(false)
  if (role === 'manufacturer') return <Navigate to="/manufacturer" replace />

  return (
    <div className="bg-white">
      {/* Hero verwandelt sich zustandsbasiert in den KI-Workspace (kein Routing) */}
      <IdeaFlow onActiveChange={setWorkspaceActive} />

      {/* Marketing-Sektionen nur im Ruhezustand – im Workspace voller Fokus */}
      <AnimatePresence>
        {!workspaceActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
