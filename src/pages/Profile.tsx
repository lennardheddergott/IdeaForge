import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bell,
  CreditCard,
  Heart,
  Mail,
  MapPin,
  Package,
  Settings,
  Shield,
  User,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { RenderingPlaceholder } from '@/components/ui/RenderingPlaceholder'
import { cn, formatEUR } from '@/lib/utils'
import { manufacturers } from '@/data/manufacturers'
import { projects, statusMeta } from '@/data/projects'

type Tab = 'account' | 'favorites' | 'projects' | 'orders' | 'settings'

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'favorites', label: 'Favoriten', icon: Heart },
  { id: 'projects', label: 'Projekte', icon: Package },
  { id: 'orders', label: 'Bestellungen', icon: CreditCard },
  { id: 'settings', label: 'Einstellungen', icon: Settings },
]

export function Profile() {
  const [tab, setTab] = useState<Tab>('account')

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-cream to-white" />

      <Container className="py-14 sm:py-16">
        {/* profile header */}
        <Reveal>
          <Card className="overflow-hidden">
            <div className="h-28 bg-gradient-to-r from-ink-900 via-accent-800 to-violet-accent" />
            <div className="flex flex-col items-start gap-4 px-7 pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <span className="-mt-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-ink-950 text-2xl font-semibold text-white shadow-float">
                  LH
                </span>
                <div className="pb-1">
                  <h1 className="text-2xl font-semibold text-ink-950">
                    Lennard Heddergott
                  </h1>
                  <p className="flex items-center gap-1.5 text-sm text-ink-400">
                    <Mail size={13} /> lennard.heddergott@hs-nordhausen.de
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm">
                Profil bearbeiten
              </Button>
            </div>
          </Card>
        </Reveal>

        <div className="mt-8 grid gap-8 lg:grid-cols-[230px_1fr]">
          {/* tabs */}
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

          {/* content */}
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'account' && <AccountTab />}
            {tab === 'favorites' && <FavoritesTab />}
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

function AccountTab() {
  const fields = [
    { label: 'Vorname', value: 'Lennard' },
    { label: 'Nachname', value: 'Heddergott' },
    { label: 'E-Mail', value: 'lennard.heddergott@hs-nordhausen.de' },
    { label: 'Telefon', value: '+49 151 2345678' },
  ]
  return (
    <div className="flex flex-col gap-6">
      <Card className="p-7">
        <h2 className="text-lg font-semibold text-ink-950">Persönliche Daten</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label}>
              <label className="text-xs font-medium text-ink-400">
                {f.label}
              </label>
              <input
                defaultValue={f.value}
                className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 outline-none transition-all focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
              />
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Button size="md">Änderungen speichern</Button>
        </div>
      </Card>

      <Card className="p-7">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
          <MapPin size={18} className="text-accent-600" /> Lieferadresse
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          Hochschulstraße 1<br />
          99734 Nordhausen<br />
          Deutschland
        </p>
      </Card>
    </div>
  )
}

function FavoritesTab() {
  return (
    <Card className="p-7">
      <h2 className="text-lg font-semibold text-ink-950">
        Favorisierte Hersteller
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {manufacturers.slice(0, 4).map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-2xl border border-ink-100 p-4"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-950 text-sm font-semibold text-white">
              {m.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-950">
                {m.name}
              </p>
              <p className="truncate text-xs text-ink-400">
                {m.specialization}
              </p>
            </div>
            <Heart
              size={18}
              className="ml-auto shrink-0 fill-rose-500 text-rose-500"
            />
          </div>
        ))}
      </div>
    </Card>
  )
}

function ProjectsTab() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {projects.map((p) => {
        const meta = statusMeta[p.status]
        return (
          <Card key={p.id} hover className="overflow-hidden p-3">
            <RenderingPlaceholder
              variant={p.category.includes('Tisch') ? 'table' : 'cabinet'}
            />
            <div className="px-2 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-ink-950">
                  {p.name}
                </p>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    meta.color,
                  )}
                >
                  {meta.label}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-400">
                {p.category} · {formatEUR(p.price)}
              </p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

function OrdersTab() {
  const orders = [
    {
      id: '#IF-2048',
      name: 'Garderobe „Halle 7"',
      maker: 'Studio Norra',
      date: '2. Juni 2026',
      total: 1280,
      status: 'Geliefert',
    },
    {
      id: '#IF-2061',
      name: 'Aurelio — TV-Board',
      maker: 'Hoffmann Manufaktur',
      date: '14. Juni 2026',
      total: 2480,
      status: 'In Produktion',
    },
  ]
  return (
    <Card className="p-7">
      <h2 className="text-lg font-semibold text-ink-950">Bestellungen</h2>
      <div className="mt-5 flex flex-col gap-3">
        {orders.map((o) => (
          <div
            key={o.id}
            className="flex flex-col gap-3 rounded-2xl border border-ink-100 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-ink-950">{o.name}</p>
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
                  {o.id}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-ink-400">
                {o.maker} · bestellt am {o.date}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  o.status === 'Geliefert'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-blue-50 text-blue-600',
                )}
              >
                {o.status}
              </span>
              <span className="font-semibold text-ink-950">
                {formatEUR(o.total)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function SettingsTab() {
  const toggles = [
    {
      icon: Bell,
      title: 'Benachrichtigungen',
      desc: 'E-Mails zu Projektstatus und Angeboten.',
      on: true,
    },
    {
      icon: Mail,
      title: 'Produkt-Updates',
      desc: 'Neuigkeiten und Feature-Ankündigungen.',
      on: false,
    },
    {
      icon: Shield,
      title: 'Zwei-Faktor-Authentifizierung',
      desc: 'Zusätzliche Sicherheit für dein Konto.',
      on: true,
    },
  ]
  return (
    <div className="flex flex-col gap-6">
      <Card className="p-7">
        <h2 className="text-lg font-semibold text-ink-950">Präferenzen</h2>
        <div className="mt-5 flex flex-col divide-y divide-ink-100">
          {toggles.map((t) => (
            <Toggle key={t.title} {...t} />
          ))}
        </div>
      </Card>

      <Card className="border-rose-100 p-7">
        <h2 className="text-lg font-semibold text-ink-950">Gefahrenzone</h2>
        <p className="mt-2 text-sm text-ink-500">
          Das Löschen deines Kontos ist endgültig und kann nicht rückgängig
          gemacht werden.
        </p>
        <button className="mt-4 rounded-full border border-rose-200 px-5 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50">
          Konto löschen
        </button>
      </Card>
    </div>
  )
}

function Toggle({
  icon: Icon,
  title,
  desc,
  on,
}: {
  icon: typeof User
  title: string
  desc: string
  on: boolean
}) {
  const [active, setActive] = useState(on)
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
          <Icon size={16} />
        </span>
        <div>
          <p className="text-sm font-medium text-ink-950">{title}</p>
          <p className="text-xs text-ink-400">{desc}</p>
        </div>
      </div>
      <button
        onClick={() => setActive((v) => !v)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300',
          active ? 'bg-accent-600' : 'bg-ink-200',
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm',
            active ? 'right-0.5' : 'left-0.5',
          )}
        />
      </button>
    </div>
  )
}
