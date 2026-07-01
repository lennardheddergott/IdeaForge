import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { Toast } from '@/components/ui/Toast'
import { OrderArtifacts } from '@/components/orders/OrderArtifacts'
import { CalculationBreakdown } from '@/components/orders/CalculationBreakdown'
import { cn, formatDate } from '@/lib/utils'
import {
  getMyManufacturerProfile,
  getMyPricing,
  type ManufacturerPricingRow,
} from '@/lib/manufacturer'
import { computeCalculation } from '@/lib/pricing'
import { buildVariants } from '@/lib/variants'
import { listMyMaterials, type Material } from '@/lib/materials'
import {
  claimOrder,
  getOrder,
  orderStatusMeta,
  updateOrderStatus,
  type Order,
} from '@/lib/orders'

export function ManufacturerOrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [pricing, setPricing] = useState<ManufacturerPricingRow | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Auftrag + eigenes Unternehmensprofil laden; offene/laufende live aktualisieren.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    getMyManufacturerProfile()
      .then((p) => {
        if (!cancelled) setProfileId(p?.id ?? null)
      })
      .catch(() => {})

    getMyPricing()
      .then((p) => {
        if (!cancelled) setPricing(p)
      })
      .catch(() => {})

    listMyMaterials()
      .then((m) => {
        if (!cancelled) setMaterials(m)
      })
      .catch(() => {})

    const load = async () => {
      try {
        const next = await getOrder(id)
        if (cancelled) return
        if (!next) setNotFound(true)
        else {
          setOrder(next)
          if (next.status !== 'completed' && next.status !== 'rejected') {
            timer = setTimeout(load, 6000)
          }
        }
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [id])

  const runAction = async (
    fn: () => Promise<Order>,
    successMessage: string,
  ) => {
    setBusy(true)
    setError(null)
    try {
      const updated = await fn()
      setOrder(updated)
      setToast(successMessage)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aktion fehlgeschlagen.')
      // Aktuellen Stand nachladen (z. B. wenn der Auftrag bereits vergeben ist).
      try {
        if (id) setOrder(await getOrder(id))
      } catch {
        /* ignorieren */
      }
    } finally {
      setBusy(false)
    }
  }

  const accept = () => {
    if (!order || !profileId) return
    runAction(
      () =>
        order.manufacturer_id
          ? updateOrderStatus(order.id, 'accepted')
          : claimOrder(order.id, profileId),
      'Auftrag erfolgreich angenommen.',
    )
  }
  const reject = () =>
    order &&
    runAction(() => updateOrderStatus(order.id, 'rejected'), 'Auftrag wurde abgelehnt.')
  const toProduction = () =>
    order &&
    runAction(
      () => updateOrderStatus(order.id, 'in_production'),
      'Auftrag wurde in Produktion gesetzt.',
    )
  const complete = () =>
    order &&
    runAction(() => updateOrderStatus(order.id, 'completed'), 'Auftrag wurde abgeschlossen.')

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-400">
        Lädt …
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <Container className="max-w-xl py-20 text-center">
        <h1 className="text-2xl font-semibold text-ink-950">Auftrag nicht verfügbar</h1>
        <p className="mt-2 text-ink-500">
          Dieser Auftrag existiert nicht mehr oder wurde bereits einem anderen
          Hersteller zugewiesen.
        </p>
        <Link to="/manufacturer" className="mt-6 inline-block font-medium text-accent-600">
          ← Zurück zum Dashboard
        </Link>
      </Container>
    )
  }

  const meta = orderStatusMeta[order.status]

  // Eigene Kalkulation für die gewählte Variante (Pricing-Engine).
  const spec = order.concept
  const variant = spec
    ? (() => {
        const vs = buildVariants(spec)
        const tier = spec.selected_variant?.tier
        return vs.find((v) => v.tier === tier) ?? vs.find((v) => v.recommended) ?? vs[1]
      })()
    : null
  const calc =
    spec && variant && pricing
      ? computeCalculation(spec, variant, pricing, materials)
      : null

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-cream to-white" />

      <Container className="py-14 sm:py-16">
        <Reveal>
          <Link
            to="/manufacturer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft size={16} /> Zurück zum Dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-ink-950 sm:text-4xl">
                {order.concept?.titel ?? 'Auftrag'}
              </h1>
              <p className="mt-1.5 text-sm text-ink-400">
                Auftrag #{order.id.slice(0, 8)} · erstellt am {formatDate(order.created_at)}
                {order.manufacturer_id ? '' : ' · offener Pool'}
              </p>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-sm font-medium',
                meta.color,
              )}
            >
              {meta.label}
            </span>
          </div>

          {/* Aktionen */}
          <Card className="mt-6 flex flex-wrap items-center gap-3 p-5">
            {order.status === 'submitted' && (
              <Button onClick={accept} disabled={busy || !profileId}>
                Auftrag annehmen
              </Button>
            )}
            {order.status === 'accepted' && (
              <>
                <Button onClick={toProduction} disabled={busy}>
                  In Produktion setzen
                </Button>
                <Button variant="secondary" onClick={reject} disabled={busy}>
                  Ablehnen
                </Button>
              </>
            )}
            {order.status === 'in_production' && (
              <Button onClick={complete} disabled={busy}>
                Auftrag abschließen
              </Button>
            )}
            {(order.status === 'completed' || order.status === 'rejected') && (
              <p className="text-sm text-ink-500">
                Dieser Auftrag ist abgeschlossen – keine weiteren Aktionen.
              </p>
            )}
            {error && (
              <p className="w-full rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
                {error}
              </p>
            )}
          </Card>
        </Reveal>

        {/* Deine Kalkulation – vollständig nachvollziehbar (nur für dich sichtbar) */}
        <Reveal>
          <Card className="mt-8 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-ink-950">Deine Kalkulation</h2>
                {variant && (
                  <p className="mt-1 text-sm text-ink-400">
                    Variante · {variant.title} ({variant.material})
                  </p>
                )}
              </div>
              {calc && (
                <span className="rounded-full bg-ink-950 px-3 py-1.5 text-sm font-semibold text-white">
                  {calc.price.toLocaleString('de-DE')} €
                </span>
              )}
            </div>

            {calc ? (
              <>
                <p className="mt-4 text-xs text-ink-400">
                  Jeder Kostenblock ist aufklappbar und zeigt alle Zwischenschritte.
                  Werte aus deinem Profil sind markiert und direkt bearbeitbar.
                </p>
                <div className="mt-4">
                  <CalculationBreakdown calc={calc} />
                </div>
                <p className="mt-4 text-xs text-ink-400">
                  Regelbasiert aus deinen Preisparametern berechnet. Für Kunden noch
                  nicht sichtbar (kommt mit dem Matching).
                </p>
              </>
            ) : (
              <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {!pricing || !pricing.pricing_completed ? (
                  <>
                    Noch keine (vollständigen) Preisparameter hinterlegt.{' '}
                    <Link to="/manufacturer/pricing" className="font-medium underline">
                      Preise & Kalkulation öffnen
                    </Link>
                    .
                  </>
                ) : (
                  <>
                    Für die gewählte Variante fehlt im Herstellerprofil ein Preis
                    für „{variant?.material ?? 'dieses Material'}“. Bitte hinterlege
                    dieses Material oder aktiviere es.{' '}
                    <Link to="/manufacturer/materials" className="font-medium underline">
                      Materialien verwalten
                    </Link>
                    .
                  </>
                )}
              </div>
            )}
          </Card>
        </Reveal>

        <div className="mt-8">
          <OrderArtifacts order={order} />
        </div>
      </Container>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  )
}
