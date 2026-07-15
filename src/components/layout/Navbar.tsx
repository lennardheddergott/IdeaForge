import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { Logo } from './Logo'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, role, signOut } = useAuth()

  const isManufacturer = role === 'manufacturer'
  const loggedIn = Boolean(user)

  // Sehr kurze, rollenabhängige Navigation. Ausgeloggt: keine Links.
  const links = !loggedIn
    ? []
    : isManufacturer
      ? [
          { to: '/manufacturer', label: 'Aufträge' },
          { to: '/manufacturer/onboarding', label: 'Mein Unternehmen' },
        ]
      : [
          { to: '/dashboard', label: 'Meine Projekte' },
          { to: '/profile', label: 'Profil' },
        ]

  // Genau eine Hauptaktion (für Hersteller keine – ihr Fokus liegt im Dashboard).
  const primary = !loggedIn
    ? { to: '/login', label: 'Kostenlos starten' }
    : isManufacturer
      ? null
      : { to: '/create', label: 'Neue Idee' }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          'transition-colors duration-200',
          scrolled ? 'border-b border-ink-100 bg-white/85 backdrop-blur' : 'bg-transparent',
        )}
      >
        <nav className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <Logo />

          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-ink-950' : 'text-ink-500 hover:text-ink-900',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {loggedIn ? (
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
              >
                Abmelden
              </button>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium text-ink-500 transition-colors hover:text-ink-900"
              >
                Anmelden
              </Link>
            )}
            {primary && (
              <Button to={primary.to} size="sm">
                {primary.label}
              </Button>
            )}
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-800 transition-colors hover:bg-ink-100 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menü"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="mx-4 mt-2 rounded-2xl border border-ink-100 bg-white p-3 shadow-lift md:hidden"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'block rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive ? 'bg-ink-100 text-ink-950' : 'text-ink-600 hover:bg-ink-50',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-ink-100 pt-3">
              {loggedIn ? (
                <button
                  onClick={handleSignOut}
                  className="mb-2 block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-ink-600 hover:bg-ink-50"
                >
                  Abmelden
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className="mb-2 block rounded-xl px-4 py-3 text-sm font-medium text-ink-600 hover:bg-ink-50"
                >
                  Anmelden
                </NavLink>
              )}
              {primary && (
                <Button to={primary.to} size="md" className="w-full">
                  {primary.label}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
