import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Reveal } from '@/components/ui/Reveal'

/**
 * Gemeinsames, zurückhaltendes Layout für die Rechtstexte (Impressum,
 * Datenschutz, AGB, Cookie-Hinweis). Nutzt dieselben Design-Tokens wie der
 * Rest der App – kein neues Design, nur konsistente Lesetypografie.
 */
export function LegalLayout({
  title,
  updated,
  intro,
  children,
}: {
  title: string
  updated: string
  intro?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="relative min-h-[70vh] bg-white">
      <Container className="max-w-3xl py-16 sm:py-20">
        <Reveal>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-ink-400 transition-colors hover:text-ink-700"
          >
            <ChevronLeft size={16} /> Zur Startseite
          </Link>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-ink-400">Stand: {updated}</p>
          {intro && <div className="mt-6 leading-relaxed text-ink-600">{intro}</div>}
          <div className="mt-10 space-y-9">{children}</div>
        </Reveal>
      </Container>
    </div>
  )
}

/** Abschnitt mit Überschrift und einheitlichem Textfluss. */
export function LegalSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-ink-950">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-ink-600">{children}</div>
    </section>
  )
}
