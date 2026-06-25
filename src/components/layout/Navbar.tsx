import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { Logo } from './Logo'

const customerLinks = [
  { to: '/create', label: 'Idee erstellen' },
  { to: '/manufacturers', label: 'Hersteller' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profile', label: 'Profil' },
]

const manufacturerLinks = [
  { to: '/manufacturer', label: 'Dashboard' },
  { to: '/manufacturer/onboarding', label: 'Unternehmensdaten' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, role, signOut } = useAuth()

  const isManufacturer = role === 'manufacturer'
  const links = isManufacturer ? manufacturerLinks : customerLinks
  // Primärer CTA: Hersteller → eigenes Dashboard, sonst → Idee erstellen.
  const cta = isManufacturer
    ? { to: '/manufacturer', label: 'Dashboard' }
    : { to: '/create', label: 'Jetzt starten' }

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
          'transition-all duration-300 ease-[var(--ease-smooth)]',
          scrolled
            ? 'glass border-b border-ink-100/80'
            : 'bg-transparent border-b border-transparent',
        )}
      >
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <Logo />

          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'text-ink-950'
                      : 'text-ink-500 hover:text-ink-900',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <button
                onClick={handleSignOut}
                className="px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:text-ink-950"
              >
                Abmelden
              </button>
            ) : (
              <Link
                to="/login"
                className="px-3 py-2 text-sm font-medium text-ink-600 transition-colors hover:text-ink-950"
              >
                Anmelden
              </Link>
            )}
            <Button to={cta.to} size="sm">
              {cta.label}
            </Button>
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
            transition={{ duration: 0.2 }}
            className="glass mx-4 mt-2 rounded-2xl border border-ink-100 p-3 shadow-float md:hidden"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'block rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-ink-100 text-ink-950'
                      : 'text-ink-600 hover:bg-ink-50',
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 border-t border-ink-100 pt-3">
              {user ? (
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
              <Button to={cta.to} size="md" className="w-full">
                {cta.label}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
