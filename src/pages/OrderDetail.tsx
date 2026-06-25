import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { OrderArtifacts } from '@/components/orders/OrderArtifacts'
import { cn, formatDate } from '@/lib/utils'
import {
  customerOrderBadge,
  customerOrderStatus,
  getOrder,
  type Order,
} from '@/lib/orders'

export function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Laden + Live-Aktualisierung, solange der Auftrag noch nicht final ist.
  useEffect(() => {
    if (!id) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = async () => {
      try {
        const next = await getOrder(id)
        if (cancelled) return
        if (!next) {
          setNotFound(true)
        } else {
          setOrder(next)
          // Solange offen/laufend: alle 6 s nachladen (Live-Status).
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
        <h1 className="text-2xl font-semibold text-ink-950">Auftrag nicht gefunden</h1>
        <p className="mt-2 text-ink-500">
          Dieser Auftrag existiert nicht oder gehört nicht zu deinem Konto.
        </p>
        <Link to="/dashboard" className="mt-6 inline-block font-medium text-accent-600">
          ← Zurück zum Dashboard
        </Link>
      </Container>
    )
  }

  const badge = customerOrderBadge[order.status]
  const info = customerOrderStatus(order.status)
  const open = order.status !== 'completed' && order.status !== 'rejected'

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-cream to-white" />

      <Container className="py-14 sm:py-16">
        <Reveal>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft size={16} /> Zurück zum Dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-ink-950 sm:text-4xl">
                {order.concept?.titel ?? 'Dein Auftrag'}
              </h1>
              <p className="mt-1.5 text-sm text-ink-400">
                Auftrag #{order.id.slice(0, 8)} · erstellt am {formatDate(order.created_at)}
              </p>
            </div>
            <span
              className={cn(
                'inline-flex items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-sm font-medium',
                badge.color,
              )}
            >
              {open ? <Clock size={14} /> : <CheckCircle2 size={14} />}
              {badge.label}
            </span>
          </div>

          {/* Status-Meldung */}
          <Card className="mt-6 flex items-start gap-3 p-5">
            <span
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
                open ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600',
              )}
            >
              {open ? <Clock size={16} /> : <CheckCircle2 size={16} />}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-950">{info.title}</p>
              <p className="mt-0.5 text-sm text-ink-500">{info.hint}</p>
            </div>
          </Card>
        </Reveal>

        <div className="mt-8">
          <OrderArtifacts order={order} />
        </div>
      </Container>
    </div>
  )
}
