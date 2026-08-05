import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Logo } from './Logo'

const LEGAL_LINKS = [
  { to: '/impressum', label: 'Impressum' },
  { to: '/datenschutz', label: 'Datenschutz' },
  { to: '/agb', label: 'AGB' },
  { to: '/cookies', label: 'Cookie-Hinweis' },
]

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-ink-100 py-10">
      <Container className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <Logo />
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-ink-400">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="transition-colors hover:text-ink-700">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-sm text-ink-400">
          © {year} Faiviq · Vom Text zum fertigen Möbel
        </p>
      </Container>
    </footer>
  )
}
