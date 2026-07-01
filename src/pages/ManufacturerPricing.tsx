import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Calculator, Coins, Layers } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { getMyPricing, saveMyPricing } from '@/lib/manufacturer'
import type { ManufacturerPricing } from '@/lib/pricing'

const EMPTY: ManufacturerPricing = {
  hourly_rate: 0,
  margin_percent: 0,
  minimum_order_value: 0,
  delivery_fee: 0,
  assembly_fee: 0,
  surface_treatment_price_per_m2: 0,
  door_price: 0,
  drawer_price: 0,
  standard_hardware_price: 0,
  premium_hardware_price: 0,
}

export function ManufacturerPricing() {
  const navigate = useNavigate()
  const [form, setForm] = useState<ManufacturerPricing>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getMyPricing()
      .then((p) => {
        if (cancelled || !p) return
        setForm({
          hourly_rate: Number(p.hourly_rate),
          margin_percent: Number(p.margin_percent),
          minimum_order_value: Number(p.minimum_order_value),
          delivery_fee: Number(p.delivery_fee),
          assembly_fee: Number(p.assembly_fee),
          surface_treatment_price_per_m2: Number(p.surface_treatment_price_per_m2),
          door_price: Number(p.door_price),
          drawer_price: Number(p.drawer_price),
          standard_hardware_price: Number(p.standard_hardware_price),
          premium_hardware_price: Number(p.premium_hardware_price),
        })
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setNum = (key: keyof ManufacturerPricing, v: string) =>
    setForm((prev) => ({ ...prev, [key]: v === '' ? 0 : Number(v) }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setNotice(null)
    try {
      await saveMyPricing(form)
      navigate('/manufacturer')
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-400">
        Lädt …
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-cream to-white" />

      <Container className="max-w-3xl py-14 sm:py-16">
        <Reveal>
          <Link
            to="/manufacturer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft size={16} /> Zurück zum Dashboard
          </Link>
          <h1 className="mt-5 text-3xl font-semibold text-ink-950 sm:text-4xl">
            Preise & Kalkulation
          </h1>
          <p className="mt-2 text-ink-500">
            Diese Werte speisen die Preisberechnung. Kunden sehen deine Kalkulation
            nicht direkt – nur berechnete Ergebnisse (später über das Matching).
          </p>
        </Reveal>

        <form onSubmit={submit} className="mt-10 flex flex-col gap-8">
          {/* Grundwerte */}
          <Section icon={Coins} title="Grundwerte">
            <div className="grid gap-4 sm:grid-cols-3">
              <NumberField label="Stundenlohn (€)" value={form.hourly_rate} onChange={(v) => setNum('hourly_rate', v)} />
              <NumberField label="Marge (%)" value={form.margin_percent} onChange={(v) => setNum('margin_percent', v)} />
              <NumberField label="Mindestauftragswert (€)" value={form.minimum_order_value} onChange={(v) => setNum('minimum_order_value', v)} />
              <NumberField label="Lieferkosten (€)" value={form.delivery_fee} onChange={(v) => setNum('delivery_fee', v)} />
              <NumberField label="Montagekosten (€)" value={form.assembly_fee} onChange={(v) => setNum('assembly_fee', v)} />
              <NumberField label="Oberfläche (€/m²)" value={form.surface_treatment_price_per_m2} onChange={(v) => setNum('surface_treatment_price_per_m2', v)} />
            </div>
          </Section>

          {/* Beschläge & Elemente */}
          <Section icon={Calculator} title="Beschläge & Elemente">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Preis je Tür (€)" value={form.door_price} onChange={(v) => setNum('door_price', v)} />
              <NumberField label="Preis je Schublade (€)" value={form.drawer_price} onChange={(v) => setNum('drawer_price', v)} />
              <NumberField label="Beschläge Standard (€)" value={form.standard_hardware_price} onChange={(v) => setNum('standard_hardware_price', v)} />
              <NumberField label="Beschläge Premium (€)" value={form.premium_hardware_price} onChange={(v) => setNum('premium_hardware_price', v)} />
            </div>
          </Section>

          {/* Materialpreise → eigene, dynamische Materialliste */}
          <Section icon={Layers} title="Materialpreise (€/m²)">
            <p className="-mt-2 text-sm text-ink-500">
              Materialien werden jetzt dynamisch in einer eigenen Liste gepflegt –
              beliebig viele, mit Kategorie und Aktiv-Status. Für eine Variante ist
              mindestens ein aktives Material der passenden Kategorie nötig.
            </p>
            <Link
              to="/manufacturer/materials"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink-950 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink-800"
            >
              <Layers size={16} /> Materialien verwalten
              <ArrowRight size={16} />
            </Link>
          </Section>

          {notice && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{notice}</p>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={busy} className="group">
              {busy ? 'Speichern …' : 'Preise speichern'}
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Button>
          </div>
        </form>
      </Container>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <Reveal>
      <Card className="p-7">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950 text-white">
            <Icon size={15} />
          </span>
          <h2 className="text-base font-semibold text-ink-950">{title}</h2>
        </div>
        {children}
      </Card>
    </Reveal>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-400">{label}</label>
      <input
        type="number"
        min={0}
        step="0.01"
        value={value === 0 ? '' : String(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 outline-none transition-all focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
      />
    </div>
  )
}
