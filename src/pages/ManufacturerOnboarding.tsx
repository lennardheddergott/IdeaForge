import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, Factory, MapPin, Sparkles } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'
import {
  companyTypes,
  manufacturerMaterials,
  specializations as specializationOptions,
} from '@/data/options'
import {
  getMyManufacturerProfile,
  saveManufacturerProfile,
  type ManufacturerProfileInput,
} from '@/lib/manufacturer'

const EMPTY: ManufacturerProfileInput = {
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  postal_code: '',
  city: '',
  country: 'Deutschland',
  company_type: null,
  specializations: [],
  materials: [],
  service_area: '',
  description: '',
  monthly_capacity: null,
  avg_lead_time: '',
}

export function ManufacturerOnboarding() {
  const navigate = useNavigate()
  const [form, setForm] = useState<ManufacturerProfileInput>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [isEdit, setIsEdit] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bestehendes Profil laden (Onboarding dient auch zum Bearbeiten).
  useEffect(() => {
    let cancelled = false
    getMyManufacturerProfile()
      .then((p) => {
        if (cancelled) return
        if (p) {
          setIsEdit(true)
          setForm({
            company_name: p.company_name,
            contact_person: p.contact_person ?? '',
            email: p.email ?? '',
            phone: p.phone ?? '',
            website: p.website ?? '',
            address: p.address ?? '',
            postal_code: p.postal_code ?? '',
            city: p.city ?? '',
            country: p.country ?? 'Deutschland',
            company_type: p.company_type,
            specializations: p.specializations,
            materials: p.materials,
            service_area: p.service_area ?? '',
            description: p.description ?? '',
            monthly_capacity: p.monthly_capacity,
            avg_lead_time: p.avg_lead_time ?? '',
          })
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const set = <K extends keyof ManufacturerProfileInput>(
    key: K,
    value: ManufacturerProfileInput[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }))

  const toggleArray = (key: 'specializations' | 'materials', id: string) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(id)
        ? prev[key].filter((x) => x !== id)
        : [...prev[key], id],
    }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company_name.trim()) {
      setError('Bitte gib den Namen deines Unternehmens an.')
      return
    }
    setError(null)
    setBusy(true)
    try {
      await saveManufacturerProfile({
        ...form,
        // Leere optionale Felder als null speichern.
        company_type: form.company_type || null,
        monthly_capacity:
          form.monthly_capacity != null && !Number.isNaN(form.monthly_capacity)
            ? form.monthly_capacity
            : null,
      })
      navigate('/manufacturer', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    } finally {
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
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-cream to-white" />

      <Container className="max-w-3xl py-16 sm:py-20">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-700 shadow-soft">
            <Factory size={14} className="text-accent-600" />
            {isEdit ? 'Unternehmensprofil bearbeiten' : 'Hersteller-Onboarding'}
          </span>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.06] text-ink-950 sm:text-5xl">
            {isEdit ? 'Unternehmensdaten aktualisieren' : 'Melde dein Unternehmen an'}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-500">
            Diese Angaben helfen uns, passende Aufträge zuzuordnen. Du kannst sie
            jederzeit im Dashboard ändern.
          </p>
        </Reveal>

        <form onSubmit={submit} className="mt-12 flex flex-col gap-8">
          {/* Unternehmen */}
          <Section icon={Building2} title="Unternehmen">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Unternehmensname *"
                value={form.company_name}
                onChange={(v) => set('company_name', v)}
                required
              />
              <TextField
                label="Ansprechpartner"
                value={form.contact_person ?? ''}
                onChange={(v) => set('contact_person', v)}
              />
              <TextField
                label="E-Mail"
                type="email"
                value={form.email ?? ''}
                onChange={(v) => set('email', v)}
              />
              <TextField
                label="Telefonnummer"
                type="tel"
                value={form.phone ?? ''}
                onChange={(v) => set('phone', v)}
              />
              <TextField
                label="Website (optional)"
                placeholder="https://…"
                value={form.website ?? ''}
                onChange={(v) => set('website', v)}
                className="sm:col-span-2"
              />
            </div>
          </Section>

          {/* Adresse */}
          <Section icon={MapPin} title="Adresse">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Adresse"
                value={form.address ?? ''}
                onChange={(v) => set('address', v)}
                className="sm:col-span-2"
              />
              <TextField
                label="PLZ"
                value={form.postal_code ?? ''}
                onChange={(v) => set('postal_code', v)}
              />
              <TextField
                label="Stadt"
                value={form.city ?? ''}
                onChange={(v) => set('city', v)}
              />
              <TextField
                label="Land"
                value={form.country ?? ''}
                onChange={(v) => set('country', v)}
              />
              <TextField
                label="Liefergebiet / Region"
                placeholder="z. B. Thüringen & angrenzend"
                value={form.service_area ?? ''}
                onChange={(v) => set('service_area', v)}
              />
            </div>
          </Section>

          {/* Profil */}
          <Section icon={Sparkles} title="Leistungsprofil">
            <div className="flex flex-col gap-6">
              <div>
                <Label>Art des Unternehmens</Label>
                <div className="mt-2.5 flex flex-wrap gap-2.5">
                  {companyTypes.map((t) => (
                    <Chip
                      key={t.id}
                      active={form.company_type === t.id}
                      onClick={() =>
                        set('company_type', form.company_type === t.id ? null : t.id)
                      }
                    >
                      {t.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>Spezialisierungen</Label>
                <div className="mt-2.5 flex flex-wrap gap-2.5">
                  {specializationOptions.map((s) => (
                    <Chip
                      key={s.id}
                      active={form.specializations.includes(s.id)}
                      onClick={() => toggleArray('specializations', s.id)}
                    >
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>Materialien</Label>
                <div className="mt-2.5 flex flex-wrap gap-2.5">
                  {manufacturerMaterials.map((m) => (
                    <Chip
                      key={m.id}
                      active={form.materials.includes(m.id)}
                      onClick={() => toggleArray('materials', m.id)}
                    >
                      {m.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label>Beschreibung des Unternehmens</Label>
                <textarea
                  value={form.description ?? ''}
                  onChange={(e) => set('description', e.target.value)}
                  rows={4}
                  placeholder="Worauf seid ihr spezialisiert? Was macht euch aus?"
                  className="mt-2 w-full resize-none rounded-2xl border border-ink-200 bg-white p-4 text-[0.95rem] leading-relaxed text-ink-900 shadow-soft outline-none transition-all placeholder:text-ink-300 focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Kapazität pro Monat (optional)"
                  type="number"
                  placeholder="z. B. 12 Stück"
                  value={
                    form.monthly_capacity != null ? String(form.monthly_capacity) : ''
                  }
                  onChange={(v) =>
                    set('monthly_capacity', v === '' ? null : Number(v))
                  }
                />
                <TextField
                  label="Ø Bearbeitungszeit (optional)"
                  placeholder="z. B. 3–4 Wochen"
                  value={form.avg_lead_time ?? ''}
                  onChange={(v) => set('avg_lead_time', v)}
                />
              </div>
            </div>
          </Section>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={busy} className="group">
              {busy
                ? 'Speichern …'
                : isEdit
                  ? 'Änderungen speichern'
                  : 'Unternehmen anmelden'}
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </Button>
          </div>
        </form>
      </Container>
    </div>
  )
}

/* ───────────── helpers ───────────── */

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

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-ink-400">{children}</label>
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  className,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 outline-none transition-all focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
      />
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
        active
          ? 'border-accent-600 bg-accent-600 text-white shadow-soft'
          : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300 hover:text-ink-900',
      )}
    >
      {children}
    </button>
  )
}
