import { Link } from 'react-router-dom'
import { AtSign, Globe, MessageCircle } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Logo } from './Logo'

const groups = [
  {
    title: 'Produkt',
    links: [
      { label: 'Idee erstellen', to: '/create' },
      { label: 'Hersteller', to: '/manufacturers' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Preise', to: '/' },
    ],
  },
  {
    title: 'Unternehmen',
    links: [
      { label: 'Über uns', to: '/' },
      { label: 'Karriere', to: '/' },
      { label: 'Presse', to: '/' },
      { label: 'Kontakt', to: '/' },
    ],
  },
  {
    title: 'Ressourcen',
    links: [
      { label: 'Blog', to: '/' },
      { label: 'Hilfe-Center', to: '/' },
      { label: 'Für Hersteller', to: '/manufacturers' },
      { label: 'Status', to: '/' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-cream">
      <Container className="py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-ink-500">
              Von der Idee zum Unikat. IdeaForge verbindet KI-gestütztes Design
              mit erstklassigen Herstellern.
            </p>
            <div className="mt-2 flex gap-2">
              {[MessageCircle, AtSign, Globe].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-500 transition-all hover:border-ink-300 hover:text-ink-900"
                  aria-label="Social"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-ink-900">
                {group.title}
              </h4>
              {group.links.map((link, i) => (
                <Link
                  key={i}
                  to={link.to}
                  className="text-sm text-ink-500 transition-colors hover:text-ink-900"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ink-100 pt-8 text-sm text-ink-400 sm:flex-row">
          <p>© 2026 IdeaForge. Alle Rechte vorbehalten.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-ink-700">
              Datenschutz
            </a>
            <a href="#" className="transition-colors hover:text-ink-700">
              AGB
            </a>
            <a href="#" className="transition-colors hover:text-ink-700">
              Impressum
            </a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
