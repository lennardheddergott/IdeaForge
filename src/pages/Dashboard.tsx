import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  Circle,
  Clock,
  FolderOpen,
  Inbox,
  Package,
  Plus,
  Sparkles,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { RenderingPlaceholder } from '@/components/ui/RenderingPlaceholder'
import { Toast } from '@/components/ui/Toast'
import { cn, formatEUR } from '@/lib/utils'
import {
  projects,
  requests,
  savedIdeas,
  statusMeta,
  timeline,
} from '@/data/projects'
import {
  customerOrderBadge,
  customerOrderStatus,
  listMyOrders,
  type Order,
  type OrderStatus,
} from '@/lib/orders'

const stats = [
  { label: 'Aktive Projekte', value: '4', icon: FolderOpen },
  { label: 'In Produktion', value: '1', icon: Clock },
  { label: 'Gespeicherte Ideen', value: '3', icon: Bookmark },
  { label: 'Offene Anfragen', value: '3', icon: Inbox },
]

const recentVariants = ['cabinet', 'table', 'lamp'] as const

export function Dashboard() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  // Letzter bekannter Status je Auftrag – um Statuswechsel zu erkennen.
  const prevStatuses = useRef<Map<string, OrderStatus>>(new Map())

  // Aufträge laden und alle 8 s automatisch aktualisieren (Live-Status).
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = async () => {
      try {
        const data = await listMyOrders()
        if (cancelled) return
        // Statuswechsel seit dem letzten Laden → Benachrichtigung anzeigen.
        const prev = prevStatuses.current
        if (prev.size > 0) {
          for (const o of data) {
            const before = prev.get(o.id)
            if (before && before !== o.status) {
              setToast(customerOrderStatus(o.status).title)
              break
            }
          }
        }
        prevStatuses.current = new Map(data.map((o) => [o.id, o.status]))
        setOrders(data)
      } catch {
        if (!cancelled) setOrders((cur) => cur ?? [])
      } finally {
        if (!cancelled) timer = setTimeout(load, 8000)
      }
    }
    load()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-cream to-white" />

      <Container className="py-14 sm:py-16">
        {/* header */}
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-ink-400">Willkommen zurück, Lennard</p>
              <h1 className="mt-1 text-3xl font-semibold text-ink-950 sm:text-4xl">
                Deine Projekte
              </h1>
            </div>
            <Button to="/create" className="group">
              <Plus size={18} /> Neue Idee
            </Button>
          </div>
        </Reveal>

        {/* stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.05}>
              <Card className="p-5" hover>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950 text-white">
                    <s.icon size={16} />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold text-ink-950">
                  {s.value}
                </p>
                <p className="mt-0.5 text-sm text-ink-400">{s.label}</p>
              </Card>
            </Reveal>
          ))}
        </div>

        {/* echte Aufträge (Live-Status aus der DB) */}
        <Reveal>
          <Card className="mt-8 p-7">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
                <Package size={18} className="text-accent-600" /> Deine Aufträge
              </h2>
              <Button to="/create" variant="secondary" size="sm">
                <Plus size={16} /> Neue Idee
              </Button>
            </div>

            {orders === null ? (
              <p className="mt-5 text-sm text-ink-400">Lädt …</p>
            ) : orders.length === 0 ? (
              <p className="mt-5 text-sm text-ink-400">
                Noch keine Aufträge. Erstelle eine Idee und klicke auf „Jetzt
                anfertigen lassen“, um einen Auftrag zu veröffentlichen.
              </p>
            ) : (
              <div className="mt-5 flex flex-col gap-3">
                {orders.map((o) => {
                  const badge = customerOrderBadge[o.status]
                  const info = customerOrderStatus(o.status)
                  const thumb = o.preview_image_url ?? o.concept_sheet_url
                  return (
                    <div
                      key={o.id}
                      className="flex gap-4 rounded-2xl border border-ink-100 p-4 transition-colors hover:border-ink-200 hover:bg-ink-50/40"
                    >
                      <div className="hidden h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-ink-50 sm:block">
                        {thumb ? (
                          <img src={thumb} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-ink-300">
                            <Package size={20} />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm text-ink-700">
                            {o.description}
                          </p>
                          <span
                            className={cn(
                              'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
                              badge.color,
                            )}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-ink-400">{info.title}</p>
                        <Link
                          to={`/orders/${o.id}`}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700"
                        >
                          Details ansehen
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </Reveal>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* projects */}
          <Reveal>
            <Card className="p-7">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink-950">
                  Projektübersicht
                </h2>
                <button className="text-sm font-medium text-accent-600 hover:text-accent-700">
                  Alle ansehen
                </button>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                {projects.map((p) => {
                  const meta = statusMeta[p.status]
                  return (
                    <div
                      key={p.id}
                      className="group flex items-center gap-4 rounded-2xl border border-ink-100 p-4 transition-colors hover:border-ink-200 hover:bg-ink-50/40"
                    >
                      <div className="hidden w-24 shrink-0 sm:block">
                        <RenderingPlaceholder
                          variant={
                            p.category.includes('Tisch') ? 'table' : 'cabinet'
                          }
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="truncate font-semibold text-ink-950">
                            {p.name}
                          </h3>
                          <span
                            className={cn(
                              'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
                              meta.color,
                            )}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-400">
                          {p.category} ·{' '}
                          {p.manufacturer ?? 'Noch kein Hersteller'} ·{' '}
                          {formatEUR(p.price)}
                        </p>
                        {/* progress */}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-accent-500 to-violet-accent transition-all"
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-ink-400">
                            {p.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </Reveal>

          {/* timeline */}
          <Reveal delay={0.08}>
            <Card className="p-7">
              <h2 className="text-lg font-semibold text-ink-950">
                Status · Aurelio TV-Board
              </h2>
              <p className="mt-1 text-sm text-ink-400">
                Voraussichtliche Lieferung: 2. Juli
              </p>

              <ol className="mt-6 space-y-1">
                {timeline.map((t, i) => {
                  const last = i === timeline.length - 1
                  return (
                    <li key={t.label} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        {t.done ? (
                          <CheckCircle2
                            size={20}
                            className={cn(
                              t.active ? 'text-accent-600' : 'text-emerald-500',
                            )}
                          />
                        ) : (
                          <Circle size={20} className="text-ink-200" />
                        )}
                        {!last && (
                          <span
                            className={cn(
                              'my-1 w-px flex-1',
                              t.done ? 'bg-emerald-200' : 'bg-ink-100',
                            )}
                          />
                        )}
                      </div>
                      <div className={cn('pb-5', last && 'pb-0')}>
                        <p
                          className={cn(
                            'text-sm font-medium',
                            t.done ? 'text-ink-950' : 'text-ink-400',
                          )}
                        >
                          {t.label}
                          {t.active && (
                            <span className="ml-2 rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold text-accent-600">
                              Aktuell
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-ink-400">{t.date}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </Card>
          </Reveal>
        </div>

        {/* lower grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* saved ideas */}
          <Reveal>
            <Card className="p-7">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
                  <Bookmark size={18} className="text-accent-600" /> Gespeicherte
                  Ideen
                </h2>
              </div>
              <div className="mt-5 flex flex-col gap-2.5">
                {savedIdeas.map((s) => (
                  <div
                    key={s.id}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-ink-100 p-4 transition-colors hover:border-ink-200 hover:bg-ink-50/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
                        <Sparkles size={16} />
                      </span>
                      <p className="text-sm text-ink-700">{s.text}</p>
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="shrink-0 text-ink-300 transition-colors group-hover:text-ink-900"
                    />
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>

          {/* requests */}
          <Reveal delay={0.08}>
            <Card className="p-7">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
                <Inbox size={18} className="text-accent-600" /> Offene Anfragen
              </h2>
              <div className="mt-5 flex flex-col divide-y divide-ink-100">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 py-3.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink-950">
                        {r.manufacturer}
                      </p>
                      <p className="text-xs text-ink-400">{r.project}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-ink-700">
                        {r.status}
                      </p>
                      <p className="text-xs text-ink-400">{r.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Reveal>
        </div>

        {/* recent designs */}
        <Reveal>
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-ink-950">Letzte Designs</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              {recentVariants.map((v, i) => (
                <Card key={v} hover className="overflow-hidden p-3">
                  <RenderingPlaceholder variant={v} />
                  <div className="flex items-center justify-between px-2 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-950">
                        {['Aurelio', 'Linnea', 'Suna'][i]}
                      </p>
                      <p className="text-xs text-ink-400">
                        {['TV-Board', 'Esstisch', 'Couchtisch'][i]}
                      </p>
                    </div>
                    <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600">
                      {['2.480 €', '1.890 €', '740 €'][i]}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>

      <Toast message={toast} tone="info" onClose={() => setToast(null)} />
    </div>
  )
}
