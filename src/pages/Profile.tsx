import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CreditCard, Mail, Package, Settings, User } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { cn, formatDate, formatEUR } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { getMyProfile, updateMyProfile } from '@/lib/profile'
import { listMyProjects, type Project } from '@/lib/projects'
import { customerOrderBadge, listMyOrders, type Order } from '@/lib/orders'

type Tab = 'account' | 'projects' | 'orders' | 'settings'

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'projects', label: 'Projekte', icon: Package },
  { id: 'orders', label: 'Bestellungen', icon: CreditCard },
  { id: 'settings', label: 'Einstellungen', icon: Settings },
]

export function Profile() {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('account')
  const [fullName, setFullName] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    getMyProfile()
      .then((p) => {
        if (!cancelled) {
          setFullName(p?.full_name ?? '')
          setLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const email = user?.email ?? ''
  const displayName = fullName || email
  const initials = (fullName || email || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-cream to-white" />

      <Container className="py-14 sm:py-16">
        <Reveal>
          <Card className="overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-ink-900 via-accent-800 to-violet-accent" />
            <div className="flex flex-col items-start gap-4 px-7 pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <span className="-mt-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-ink-950 text-2xl font-semibold text-white shadow-float">
                  {initials || '?'}
                </span>
                <div className="pb-1">
                  <h1 className="text-2xl font-semibold text-ink-950">
                    {displayName || '—'}
                  </h1>
                  <p className="flex items-center gap-1.5 text-sm text-ink-400">
                    <Mail size={13} /> {email}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>

        <div className="mt-8 grid gap-8 lg:grid-cols-[230px_1fr]">
          <Reveal>
            <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                    tab === t.id
                      ? 'bg-ink-950 text-white shadow-float'
                      : 'text-ink-600 hover:bg-ink-100',
                  )}
                >
                  <t.icon size={17} />
                  {t.label}
                </button>
              ))}
            </nav>
          </Reveal>

          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'account' && (
              <AccountTab
                email={email}
                fullName={fullName}
                setFullName={setFullName}
                loaded={loaded}
              />
            )}
            {tab === 'projects' && <ProjectsTab />}
            {tab === 'orders' && <OrdersTab />}
            {tab === 'settings' && <SettingsTab />}
          </motion.div>
        </div>
      </Container>
    </div>
  )
}

/* ───────────── tabs ───────────── */

function AccountTab({
  email,
  fullName,
  setFullName,
  loaded,
}: {
  email: string
  fullName: string
  setFullName: (v: string) => void
  loaded: boolean
}) {
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    setNotice(null)
    try {
      await updateMyProfile({ full_name: fullName })
      setNotice('Gespeichert.')
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-7">
      <h2 className="text-lg font-semibold text-ink-950">Persönliche Daten</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-ink-400">Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={!loaded}
            placeholder="Dein Name"
            className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 outline-none transition-all focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-ink-400">E-Mail</label>
          <input
            value={email}
            readOnly
            className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-ink-50 px-4 text-sm text-ink-500 outline-none"
          />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-3">
        {notice && <span className="text-sm text-ink-500">{notice}</span>}
        <Button size="md" onClick={save} disabled={saving || !loaded}>
          {saving ? 'Speichern …' : 'Änderungen speichern'}
        </Button>
      </div>
    </Card>
  )
}

function ProjectsTab() {
  const [projects, setProjects] = useState<Project[] | null>(null)
  useEffect(() => {
    let cancelled = false
    listMyProjects()
      .then((p) => !cancelled && setProjects(p))
      .catch(() => !cancelled && setProjects([]))
    return () => {
      cancelled = true
    }
  }, [])

  if (projects === null) {
    return <Card className="p-7 text-sm text-ink-400">Lädt …</Card>
  }
  if (projects.length === 0) {
    return (
      <Card className="p-7 text-center">
        <p className="text-ink-500">Du hast noch keine Projekte erstellt.</p>
        <Button to="/create" className="mt-4">
          Erste Idee erstellen
        </Button>
      </Card>
    )
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {projects.map((p) => (
        <Link key={p.id} to={`/result/${p.id}`}>
          <Card hover className="overflow-hidden p-3">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-ink-100 bg-ink-50">
              {p.previewUrl ? (
                <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-ink-300">
                  <Package size={24} />
                </span>
              )}
            </div>
            <div className="px-2 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-ink-950">{p.title}</p>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    p.status.color,
                  )}
                >
                  {p.status.label}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-400">
                {p.category}
                {p.price ? ` · ca. ${formatEUR(p.price.min)}–${formatEUR(p.price.max)}` : ''}
              </p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  useEffect(() => {
    let cancelled = false
    listMyOrders()
      .then((o) => !cancelled && setOrders(o))
      .catch(() => !cancelled && setOrders([]))
    return () => {
      cancelled = true
    }
  }, [])

  const rows = useMemo(() => orders ?? [], [orders])

  if (orders === null) {
    return <Card className="p-7 text-sm text-ink-400">Lädt …</Card>
  }
  return (
    <Card className="p-7">
      <h2 className="text-lg font-semibold text-ink-950">Bestellungen</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-ink-400">
          Noch keine Bestellungen. Sobald du auf einer Projekt-Detailseite „Jetzt
          anfertigen lassen“ klickst, erscheint sie hier.
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {rows.map((o) => {
            const badge = customerOrderBadge[o.status]
            return (
              <Link
                key={o.id}
                to={`/orders/${o.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-ink-100 p-4 transition-colors hover:border-ink-200 hover:bg-ink-50/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-950">
                    {o.concept?.titel ?? o.description}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    #{o.id.slice(0, 8)} · {formatDate(o.created_at)}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
                    badge.color,
                  )}
                >
                  {badge.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}

function SettingsTab() {
  const { signOut } = useAuth()
  return (
    <div className="flex flex-col gap-6">
      <Card className="p-7">
        <h2 className="text-lg font-semibold text-ink-950">Konto</h2>
        <p className="mt-2 text-sm text-ink-500">
          Du bist als Kunde angemeldet. Melde dich ab, um das Konto zu wechseln.
        </p>
        <button
          onClick={signOut}
          className="mt-4 rounded-full border border-ink-200 px-5 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50"
        >
          Abmelden
        </button>
      </Card>
    </div>
  )
}
