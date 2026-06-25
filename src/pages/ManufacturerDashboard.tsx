import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Factory,
  Globe,
  Inbox,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
} from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { Toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import {
  companyTypes,
  manufacturerMaterials,
  specializations as specializationOptions,
} from '@/data/options'
import {
  getMyManufacturerProfile,
  type ManufacturerProfile,
} from '@/lib/manufacturer'
import {
  claimOrder,
  listManufacturerOrders,
  orderStatusMeta,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from '@/lib/orders'

const labelOf = (
  options: { id: string; label: string }[],
  id: string | null,
): string => options.find((o) => o.id === id)?.label ?? id ?? '–'

const labelsOf = (options: { id: string; label: string }[], ids: string[]): string[] =>
  ids.map((id) => labelOf(options, id))

export function ManufacturerDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ManufacturerProfile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    setOrders(await listManufacturerOrders())
  }, [])

  // Profil laden – ohne Profil zuerst ins Onboarding leiten.
  useEffect(() => {
    let cancelled = false
    getMyManufacturerProfile()
      .then(async (p) => {
        if (cancelled) return
        if (!p) {
          navigate('/manufacturer/onboarding', { replace: true })
          return
        }
        setProfile(p)
        await loadOrders()
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [navigate, loadOrders])

  // Auftragsliste alle 8 s automatisch aktualisieren (Live-Status / Pool).
  useEffect(() => {
    if (!profile) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = async () => {
      try {
        if (!cancelled) await loadOrders()
      } finally {
        if (!cancelled) timer = setTimeout(tick, 8000)
      }
    }
    timer = setTimeout(tick, 8000)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [profile, loadOrders])

  // Aufträge in die drei Bereiche aufteilen.
  const groups = useMemo(() => {
    const isNew = (s: OrderStatus) => s === 'submitted' || s === 'assigned'
    const isRunning = (s: OrderStatus) => s === 'accepted' || s === 'in_production'
    const isDone = (s: OrderStatus) => s === 'completed' || s === 'rejected'
    return {
      new: orders.filter((o) => isNew(o.status)),
      running: orders.filter((o) => isRunning(o.status)),
      done: orders.filter((o) => isDone(o.status)),
    }
  }, [orders])

  // Auftrags-Aktion ausführen, Liste neu laden und Erfolg/Fehler melden.
  const runAction = async (
    fn: () => Promise<unknown>,
    id: string,
    successMessage: string,
  ) => {
    setBusyId(id)
    setActionError(null)
    try {
      await fn()
      await loadOrders()
      setToast(successMessage)
    } catch (e) {
      // z. B. "bereits vergeben" (anderer Hersteller war schneller) → anzeigen
      // und Liste aktualisieren, damit der Auftrag aus dem Pool verschwindet.
      setActionError(e instanceof Error ? e.message : 'Aktion fehlgeschlagen.')
      await loadOrders()
    } finally {
      setBusyId(null)
    }
  }

  const accept = (o: Order) =>
    runAction(
      () =>
        o.manufacturer_id
          ? updateOrderStatus(o.id, 'accepted')
          : claimOrder(o.id, profile!.id),
      o.id,
      'Auftrag erfolgreich angenommen.',
    )
  const reject = (o: Order) =>
    runAction(() => updateOrderStatus(o.id, 'rejected'), o.id, 'Auftrag wurde abgelehnt.')
  const toProduction = (o: Order) =>
    runAction(
      () => updateOrderStatus(o.id, 'in_production'),
      o.id,
      'Auftrag wurde in Produktion gesetzt.',
    )
  const complete = (o: Order) =>
    runAction(
      () => updateOrderStatus(o.id, 'completed'),
      o.id,
      'Auftrag wurde abgeschlossen.',
    )

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-400">
        Lädt …
      </div>
    )
  }
  if (!profile) return null

  const stats = [
    { label: 'Neue Aufträge', value: groups.new.length, icon: Inbox },
    { label: 'Laufende Aufträge', value: groups.running.length, icon: Clock },
    { label: 'Abgeschlossen', value: groups.done.length, icon: CheckCircle2 },
  ]

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-cream to-white" />

      <Container className="py-14 sm:py-16">
        {/* header */}
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm text-ink-400">
                <Factory size={14} /> Hersteller-Dashboard
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-ink-950 sm:text-4xl">
                {profile.company_name}
              </h1>
            </div>
            <Button to="/manufacturer/onboarding" variant="secondary" size="sm">
              <Pencil size={16} /> Unternehmensdaten bearbeiten
            </Button>
          </div>
        </Reveal>

        {/* stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.05}>
              <Card className="p-5" hover>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950 text-white">
                  <s.icon size={16} />
                </span>
                <p className="mt-4 text-3xl font-semibold text-ink-950">{s.value}</p>
                <p className="mt-0.5 text-sm text-ink-400">{s.label}</p>
              </Card>
            </Reveal>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.6fr]">
          {/* Unternehmensprofil */}
          <Reveal>
            <Card className="p-7">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
                <Building2 size={18} className="text-accent-600" /> Unternehmensprofil
              </h2>

              <dl className="mt-5 space-y-3 text-sm">
                <Row label="Art" value={labelOf(companyTypes, profile.company_type)} />
                {profile.contact_person && (
                  <Row label="Ansprechpartner" value={profile.contact_person} />
                )}
                {profile.email && (
                  <Row icon={Mail} label="E-Mail" value={profile.email} />
                )}
                {profile.phone && (
                  <Row icon={Phone} label="Telefon" value={profile.phone} />
                )}
                {profile.website && (
                  <Row icon={Globe} label="Website" value={profile.website} />
                )}
                <Row
                  icon={MapPin}
                  label="Standort"
                  value={[profile.postal_code, profile.city, profile.country]
                    .filter(Boolean)
                    .join(' ')}
                />
                {profile.service_area && (
                  <Row label="Liefergebiet" value={profile.service_area} />
                )}
                {profile.monthly_capacity != null && (
                  <Row label="Kapazität / Monat" value={String(profile.monthly_capacity)} />
                )}
                {profile.avg_lead_time && (
                  <Row label="Ø Bearbeitungszeit" value={profile.avg_lead_time} />
                )}
              </dl>

              {profile.specializations.length > 0 && (
                <TagBlock
                  title="Spezialisierungen"
                  tags={labelsOf(specializationOptions, profile.specializations)}
                />
              )}
              {profile.materials.length > 0 && (
                <TagBlock
                  title="Materialien"
                  tags={labelsOf(manufacturerMaterials, profile.materials)}
                />
              )}
              {profile.description && (
                <p className="mt-5 border-t border-ink-100 pt-5 text-sm leading-relaxed text-ink-600">
                  {profile.description}
                </p>
              )}
            </Card>
          </Reveal>

          {/* Aufträge */}
          <div className="flex flex-col gap-8">
            <OrderSection
              icon={Inbox}
              title="Neue Aufträge"
              empty="Aktuell keine neuen Aufträge."
              orders={groups.new}
              busyId={busyId}
              notice={
                actionError && (
                  <p className="mb-4 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
                    {actionError}
                  </p>
                )
              }
              render={(o) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => accept(o)} disabled={busyId === o.id}>
                    Auftrag annehmen
                  </Button>
                  {o.manufacturer_id && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => reject(o)}
                      disabled={busyId === o.id}
                    >
                      Ablehnen
                    </Button>
                  )}
                </div>
              )}
            />

            <OrderSection
              icon={Clock}
              title="Laufende Aufträge"
              empty="Keine laufenden Aufträge."
              orders={groups.running}
              busyId={busyId}
              render={(o) => (
                <div className="flex flex-wrap gap-2">
                  {o.status === 'accepted' && (
                    <Button
                      size="sm"
                      onClick={() => toProduction(o)}
                      disabled={busyId === o.id}
                    >
                      In Produktion
                    </Button>
                  )}
                  {o.status === 'in_production' && (
                    <Button
                      size="sm"
                      onClick={() => complete(o)}
                      disabled={busyId === o.id}
                    >
                      Abschließen
                    </Button>
                  )}
                </div>
              )}
            />

            <OrderSection
              icon={CheckCircle2}
              title="Abgeschlossene Aufträge"
              empty="Noch keine abgeschlossenen Aufträge."
              orders={groups.done}
              busyId={busyId}
            />
          </div>
        </div>
      </Container>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  )
}

/* ───────────── helpers ───────────── */

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="flex items-center gap-1.5 text-ink-400">
        {Icon && <Icon size={13} />} {label}
      </dt>
      <dd className="text-right font-medium text-ink-900">{value || '–'}</dd>
    </div>
  )
}

function TagBlock({ title, tags }: { title: string; tags: string[] }) {
  return (
    <div className="mt-5 border-t border-ink-100 pt-5">
      <p className="text-xs font-medium text-ink-400">{title}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

function OrderSection({
  icon: Icon,
  title,
  empty,
  orders,
  busyId,
  notice,
  render,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  empty: string
  orders: Order[]
  busyId: string | null
  notice?: React.ReactNode
  render?: (o: Order) => React.ReactNode
}) {
  return (
    <Reveal>
      <Card className="p-7">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-950">
            <Icon size={18} className="text-accent-600" /> {title}
          </h2>
          <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600">
            {orders.length}
          </span>
        </div>

        {notice && <div className="mt-4">{notice}</div>}

        {orders.length === 0 ? (
          <p className="mt-5 text-sm text-ink-400">{empty}</p>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} busy={busyId === o.id} actions={render?.(o)} />
            ))}
          </div>
        )}
      </Card>
    </Reveal>
  )
}

function OrderCard({
  order,
  busy,
  actions,
}: {
  order: Order
  busy: boolean
  actions?: React.ReactNode
}) {
  const meta = orderStatusMeta[order.status]
  const thumb = order.preview_image_url ?? order.concept_sheet_url
  return (
    <div
      className={cn(
        'flex gap-4 rounded-2xl border border-ink-100 p-4 transition-colors',
        busy && 'opacity-60',
      )}
    >
      <div className="hidden h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-ink-50 sm:block">
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-ink-300">
            <Package size={22} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm text-ink-700">{order.description}</p>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium',
              meta.color,
            )}
          >
            {meta.label}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-400">
          Auftrag #{order.id.slice(0, 8)}
          {order.manufacturer_id ? '' : ' · offener Pool'}
        </p>
        <Link
          to={`/manufacturer/orders/${order.id}`}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700"
        >
          Details ansehen
          <ArrowRight size={13} />
        </Link>
        {actions && <div className="mt-3">{actions}</div>}
      </div>
    </div>
  )
}
