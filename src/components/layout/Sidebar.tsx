import { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Factory,
  Layers,
  LayoutGrid,
  LogIn,
  LogOut,
  Package,
  Plus,
  Settings,
  Sofa,
  Sparkles,
  Tag,
  User,
  X,
} from 'lucide-react'
import { Logo } from './Logo'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: typeof User
  /** Ziel-Tab o. Ä. als Router-State (z. B. für „Einstellungen"). */
  state?: Record<string, unknown>
  /** Nur exakter Pfad zählt als aktiv (statt Präfix-Match). */
  end?: boolean
  /** Hebt die primäre Aktion dezent hervor (Accent). */
  accent?: boolean
  /** Kleiner Badge rechts (z. B. „Pro"). */
  badge?: string
}

/** Rollenabhängige Navigationsstruktur – nutzt ausschließlich bestehende Routen. */
function useNavSections(): NavItem[][] {
  const { user, role } = useAuth()

  if (!user) {
    return [
      [
        { to: '/create', label: 'Idee starten', icon: Sparkles, accent: true },
        { to: '/login', label: 'Anmelden', icon: LogIn },
      ],
    ]
  }

  if (role === 'manufacturer') {
    return [
      [
        { to: '/manufacturer', label: 'Aufträge', icon: LayoutGrid, end: true },
        { to: '/manufacturer/onboarding', label: 'Mein Unternehmen', icon: Factory },
        { to: '/manufacturer/pricing', label: 'Preise', icon: Tag },
        { to: '/manufacturer/materials', label: 'Materialien', icon: Layers },
      ],
    ]
  }

  return [
    [
      { to: '/dashboard', label: 'Meine Projekte', icon: Package },
      { to: '/create', label: 'Neue Idee', icon: Plus, accent: true },
      { to: '/room-planner', label: 'Raum gestalten', icon: Sofa, badge: 'Pro' },
    ],
    [
      { to: '/profile', label: 'Profil', icon: User, end: true },
      { to: '/profile', label: 'Einstellungen', icon: Settings, state: { tab: 'settings' } },
    ],
  ]
}

/**
 * Hochwertige, minimalistische Navigations-Sidebar (Linear/Arc-Ästhetik):
 * gleitet weich von links herein, dezenter Backdrop, reduzierte Einträge mit
 * kleinen Icons, Hover- und Aktiv-Zuständen. Öffnet sich nur bei Bedarf, damit
 * die eigentliche Seite (v. a. der Hero) ruhig bleibt.
 */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const sections = useNavSections()

  // Schließen bei Routenwechsel.
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Escape schließt; Body-Scroll sperren, solange offen.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const handleSignOut = async () => {
    onClose()
    await signOut()
    navigate('/')
  }

  const email = user?.email ?? ''
  const roleLabel = role === 'manufacturer' ? 'Hersteller' : 'Kunde'

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[75] bg-ink-950/25 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            initial={{ x: -288, opacity: 0.4 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -288, opacity: 0.2 }}
            transition={{ type: 'spring', stiffness: 420, damping: 40, mass: 0.9 }}
            className="fixed inset-y-0 left-0 z-[80] flex w-[272px] flex-col border-r border-ink-100 bg-white shadow-lift"
          >
            {/* Kopf */}
            <div className="flex items-center justify-between px-5 pb-4 pt-5">
              <Logo />
              <button
                onClick={onClose}
                aria-label="Menü schließen"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-2">
              {sections.map((items, i) => (
                <div key={i}>
                  {i > 0 && <div className="my-2 border-t border-ink-100" />}
                  <div className="flex flex-col gap-0.5">
                    {items.map((item) => (
                      <SidebarLink key={item.label} item={item} onNavigate={onClose} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>

            {/* Fuß: Konto + Abmelden (nur eingeloggt) */}
            {user && (
              <div className="border-t border-ink-100 px-3 py-3">
                <div className="flex items-center gap-3 rounded-xl px-3 py-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-950 text-xs font-semibold text-white">
                    {(email[0] ?? '?').toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{email}</p>
                    <p className="text-xs text-ink-400">{roleLabel}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
                >
                  <LogOut size={17} className="text-ink-400" />
                  Abmelden
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      state={item.state}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
          item.accent
            ? isActive
              ? 'bg-accent-50 font-medium text-accent-700'
              : 'font-medium text-accent-700 hover:bg-accent-50'
            : isActive
              ? 'bg-ink-100 font-medium text-ink-950'
              : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={17}
            className={cn(
              'shrink-0 transition-colors',
              item.accent
                ? 'text-accent-600'
                : isActive
                  ? 'text-accent-600'
                  : 'text-ink-400 group-hover:text-ink-600',
            )}
          />
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="rounded-full bg-accent-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-700">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
