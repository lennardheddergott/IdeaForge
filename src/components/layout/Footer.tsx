import { Container } from '@/components/ui/Container'
import { Logo } from './Logo'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-ink-100 py-10">
      <Container className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <Logo />
        <p className="text-sm text-ink-400">
          © {year} Forma · Vom Text zum fertigen Möbel
        </p>
      </Container>
    </footer>
  )
}
