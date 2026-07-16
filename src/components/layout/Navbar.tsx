import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { Sidebar } from './Sidebar'

/**
 * Minimalistische Topbar (Linear/Arc-Ästhetik): links nur ein dezentes
 * Menü-Icon und das Logo, rechts bewusst nichts. Die eigentliche Navigation
 * lebt in einer Sidebar, die sich nur bei Bedarf öffnet – so bleibt die Seite
 * (v. a. der Hero) so ruhig wie möglich.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Das Schließen bei Routenwechsel übernimmt die Sidebar selbst.
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div
          className={cn(
            'transition-colors duration-200',
            scrolled ? 'border-b border-ink-100 bg-white/85 backdrop-blur' : 'bg-transparent',
          )}
        >
          <nav className="flex h-16 w-full items-center gap-2 px-6 sm:px-8">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Menü öffnen"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
            >
              <Menu size={20} />
            </button>
            <Logo />
          </nav>
        </div>
      </header>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
