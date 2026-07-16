import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, FileText, Package, ShieldCheck } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'
import { getIdea, type Idea } from '@/lib/ideas'
import { createOrder, getOrderByIdea } from '@/lib/orders'
import { buildVariants, type Variant, type VariantTier } from '@/lib/variants'
import {
  estimateVariant,
  formatRange,
  loadManufacturerOffers,
  type ManufacturerOffer,
} from '@/lib/estimate'

export function Checkout() {
  const { ideaId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const tierParam = params.get('variant') as VariantTier | null

  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Herstellerangebote = einzige Preisquelle; null = wird geladen.
  const [offers, setOffers] = useState<ManufacturerOffer[] | null>(null)
  // Verbindliche Bestätigung des Konzeptblatts (Pflicht vor dem Absenden).
  const [confirmed, setConfirmed] = useState(false)

  // Idee laden. Existiert bereits ein Auftrag → direkt zur Auftragsseite.
  useEffect(() => {
    if (!ideaId) return
    let cancelled = false
    ;(async () => {
      try {
        const existing = await getOrderByIdea(ideaId)
        if (cancelled) return
        if (existing) {
          navigate(`/orders/${existing.id}`, { replace: true })
          return
        }
        const next = await getIdea(ideaId)
        if (!cancelled) setIdea(next)
      } catch {
        if (!cancelled) setError('Projekt konnte nicht geladen werden.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ideaId, navigate])

  // Herstellerangebote einmalig laden.
  useEffect(() => {
    let cancelled = false
    loadManufacturerOffers()
      .then((o) => !cancelled && setOffers(o))
      .catch(() => !cancelled && setOffers([]))
    return () => {
      cancelled = true
    }
  }, [])

  const spec = idea?.concept ?? null
  const variants = spec ? buildVariants(spec) : null
  const variant: Variant | null =
    variants?.find((v) => v.tier === tierParam) ??
    variants?.find((v) => v.recommended) ??
    variants?.[1] ??
    null

  // Preisspanne der gewählten Variante – ausschließlich aus der Herstellerkalkulation.
  const priceRange = spec && variant && offers ? estimateVariant(spec, variant, offers) : null
  const priceText =
    offers === null ? 'wird berechnet …' : priceRange ? formatRange(priceRange) : 'auf Anfrage'

  const confirm = async () => {
    if (!idea || !confirmed) return
    setSubmitting(true)
    setError(null)
    try {
      const order = await createOrder({
        ideaId: idea.id,
        description: idea.prompt,
        conceptSheetUrl: idea.concept_sheet_url ?? idea.image_url,
        previewImageUrl: idea.preview_image_url,
        concept: idea.concept
          ? {
              ...idea.concept,
              selected_variant: variant
                ? {
                    tier: variant.tier,
                    title: variant.title,
                    material: variant.material,
                    price_from: priceRange?.min ?? 0,
                    price_to: priceRange?.max ?? 0,
                  }
                : null,
            }
          : null,
      })
      navigate(`/orders/${order.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bestellung fehlgeschlagen.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-400">
        Lädt …
      </div>
    )
  }

  // Ohne fertige Idee / Spec keine Bestellung möglich.
  if (!idea || idea.status !== 'generated' || !spec || !variant) {
    return (
      <Container className="max-w-xl py-20 text-center">
        <h1 className="text-2xl font-semibold text-ink-950">
          Bestellung nicht möglich
        </h1>
        <p className="mt-2 text-ink-500">
          Für dieses Projekt liegt noch kein fertiges Design vor.
        </p>
        <Link
          to={ideaId ? `/result/${ideaId}` : '/dashboard'}
          className="mt-6 inline-block font-medium text-accent-600"
        >
          ← Zurück zum Projekt
        </Link>
      </Container>
    )
  }

  const preview = idea.preview_image_url ?? idea.image_url
  const conceptUrl = idea.concept_sheet_url ?? idea.image_url
  const masse: string[] = []
  if (spec.masse.breite_cm) masse.push(`B ${spec.masse.breite_cm} cm`)
  if (spec.masse.hoehe_cm) masse.push(`H ${spec.masse.hoehe_cm} cm`)
  if (spec.masse.tiefe_cm) masse.push(`T ${spec.masse.tiefe_cm} cm`)

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-cream to-white" />

      <Container className="max-w-2xl py-14 sm:py-16">
        <Reveal>
          <Link
            to={`/result/${idea.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft size={16} /> Zurück zum Projekt
          </Link>
          <h1 className="mt-5 text-3xl font-semibold text-ink-950 sm:text-4xl">
            Bestellübersicht
          </h1>
          <p className="mt-2 text-ink-500">
            Prüfe deine Auswahl. Die Bestellung wird als Anfrage an einen
            passenden Hersteller übermittelt.
          </p>
        </Reveal>

        <Reveal>
          <Card className="mt-8 overflow-hidden">
            <div className="flex flex-col gap-5 p-6 sm:flex-row">
              <div className="h-40 w-full shrink-0 overflow-hidden rounded-2xl border border-ink-100 bg-ink-50 sm:h-40 sm:w-48">
                {preview ? (
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-ink-300">
                    <Package size={28} />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold text-ink-950">{spec.titel}</h2>
                <p className="mt-0.5 text-sm text-ink-400">{spec.kategorie}</p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-sm font-medium text-accent-700">
                  Variante · {variant.title}
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label="Material" value={variant.material} />
                  <Row label="Oberfläche" value={variant.surface} />
                  <Row label="Beschläge" value={variant.hardware} />
                  {masse.length > 0 && <Row label="Maße" value={masse.join(' · ')} />}
                  <Row
                    label="Lieferzeit"
                    value={`${variant.leadTimeWeeks[0]}–${variant.leadTimeWeeks[1]} Wochen`}
                  />
                </dl>
              </div>
            </div>

            {/* Preis */}
            <div className="flex items-end justify-between gap-3 border-t border-ink-100 bg-ink-50/50 px-6 py-5">
              <div>
                <p className="text-sm text-ink-500">Geschätzter Endpreis</p>
                <p className="text-xs text-ink-400">
                  auf Basis der tatsächlichen Herstellerkalkulation
                </p>
              </div>
              <span className="text-2xl font-semibold text-ink-950">{priceText}</span>
            </div>
          </Card>
        </Reveal>

        {/* Hinweise */}
        <Reveal>
          <div className="mt-6 flex flex-col gap-2 text-sm text-ink-500">
            <span className="flex items-center gap-2">
              <Check size={15} className="text-emerald-500" /> Individuelle
              Fertigung nach deinen Angaben
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-accent-600" /> Unverbindliche
              Anfrage – noch keine Zahlung fällig (Checkout folgt später)
            </span>
          </div>
        </Reveal>

        {/* Verbindliche Fertigungsgrundlage + Pflichtbestätigung */}
        <Reveal>
          <div className="mt-6 rounded-2xl border border-ink-100 bg-ink-50/60 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-accent-600 shadow-soft">
                <FileText size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-950">
                  Verbindliche Fertigungsgrundlage
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">
                  Die Herstellung erfolgt ausschließlich anhand des technischen Konzeptblatts.
                  Die Visualisierung dient zur besseren Vorstellung des Produkts. Bitte prüfe
                  das Konzeptblatt sorgfältig, bevor du deinen Auftrag freigibst.
                </p>
                {conceptUrl && (
                  <a
                    href={conceptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-accent-700 transition-colors hover:text-accent-800"
                  >
                    <FileText size={15} /> Konzeptblatt ansehen
                  </a>
                )}
              </div>
            </div>

            <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-ink-100 pt-4">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent-600)]"
              />
              <span className="text-sm leading-relaxed text-ink-700">
                Ich habe das verbindliche Konzeptblatt geprüft und bestätige, dass dieses die
                Grundlage für die Fertigung meines Produkts ist.
              </span>
            </label>
          </div>
        </Reveal>

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <Reveal>
          <Button
            size="lg"
            onClick={confirm}
            disabled={submitting || !confirmed}
            className="group mt-6 w-full"
          >
            {submitting ? 'Wird gesendet …' : 'Bestellung anfragen'}
            <ArrowRight
              size={18}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </Button>
        </Reveal>
      </Container>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-ink-400">{label}</dt>
      <dd className={cn('text-right font-medium text-ink-900')}>{value}</dd>
    </div>
  )
}
