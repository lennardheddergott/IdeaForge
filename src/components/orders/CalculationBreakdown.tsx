import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, ChevronDown, Pencil } from 'lucide-react'
import { cn, formatEUR } from '@/lib/utils'
import type { Calculation } from '@/lib/pricing'

const PRICING = '/manufacturer/pricing'
const MATERIALS = '/manufacturer/materials'

/** Betrag mit 2 Nachkommastellen (für Formeln/Zwischenschritte). */
function eur2(n: number): string {
  return n.toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
/** Zahl mit deutschem Dezimaltrenner (Fläche/Stunden). */
function dec(n: number): string {
  return n.toLocaleString('de-DE', { maximumFractionDigits: 2 })
}

/**
 * Vollständig nachvollziehbare Kalkulation als Accordion. Jeder Kostenblock ist
 * aufklappbar und zeigt alle Zwischenschritte + welche Werte aus dem
 * Herstellerprofil stammen (mit direktem Bearbeiten-Link).
 */
export function CalculationBreakdown({ calc }: { calc: Calculation }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Material */}
      <Block title="Material" total={calc.material.total} defaultOpen>
        {/* Abgleich: Variantenmaterial muss exakt dem Profilmaterial entsprechen */}
        <div className="mb-2 rounded-lg border border-ink-100 bg-ink-50/60 p-3">
          <Field label="Material laut KI-Variante">
            {calc.material.variantMaterial}
          </Field>
          <Field label="Material aus Herstellerprofil">
            {calc.material.profileMaterial}
          </Field>
          {calc.material.identical ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
              <BadgeCheck size={14} /> Materialien stimmen überein
            </p>
          ) : (
            <p className="mt-1 text-xs font-medium text-rose-600">
              Achtung: Materialien stimmen nicht überein – keine gültige Kalkulation.
            </p>
          )}
        </div>
        {calc.material.lines.map((l, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            {calc.material.lines.length > 1 && (
              <p className="font-medium text-ink-900">{l.name}</p>
            )}
            <Field label="Material">{l.name}</Field>
            <ProfileField label="Materialpreis laut Herstellerprofil" editTo={MATERIALS}>
              {dec(l.pricePerM2)} €/m²
            </ProfileField>
            <Field label="Benötigte Fläche">{dec(l.area)} m²</Field>
            <Formula>
              {dec(l.pricePerM2)} €/m² × {dec(l.area)} m² = {eur2(l.total)}
            </Formula>
          </div>
        ))}
        <Total label="Gesamter Materialpreis" value={calc.material.total} />
        <ProfileNote>Materialpreis stammt aus deinem Profil</ProfileNote>
      </Block>

      {/* Arbeitszeit */}
      <Block title="Arbeitszeit" total={calc.labor.total}>
        <span className="mb-1 inline-block rounded-full bg-ink-100 px-2.5 py-0.5 text-[11px] font-medium text-ink-500">
          KI-Schätzung
        </span>
        <div className="divide-y divide-ink-100">
          {calc.labor.steps.map((s) => (
            <div key={s.label} className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-ink-600">{s.label}</span>
              <span className="font-medium text-ink-900">{dec(s.hours)} h</span>
            </div>
          ))}
        </div>
        <Field label="Gesamt">{dec(calc.labor.totalHours)} Stunden</Field>
        <ProfileField label="Stundenlohn laut Herstellerprofil" editTo={PRICING}>
          {dec(calc.labor.hourlyRate)} €/h
        </ProfileField>
        <Formula>
          {dec(calc.labor.totalHours)} × {dec(calc.labor.hourlyRate)} € = {eur2(calc.labor.total)}
        </Formula>
        <Total label="Arbeitskosten" value={calc.labor.total} />
        <ProfileNote>Stundenlohn stammt aus deinem Profil</ProfileNote>
      </Block>

      {/* Oberfläche */}
      <Block title="Oberfläche" total={calc.surface.total}>
        {calc.surface.applies ? (
          <>
            <Field label="Oberfläche">{calc.surface.label}</Field>
            <ProfileField label="Preis laut Herstellerprofil" editTo={PRICING}>
              {dec(calc.surface.pricePerM2)} €/m²
            </ProfileField>
            <Field label="Berechnete Oberfläche">{dec(calc.surface.area)} m²</Field>
            <Formula>
              {dec(calc.surface.pricePerM2)} × {dec(calc.surface.area)} = {eur2(calc.surface.total)}
            </Formula>
            <ProfileNote>Oberfläche stammt aus deinem Profil</ProfileNote>
          </>
        ) : (
          <p className="text-sm text-ink-500">
            Bei dieser Variante ist keine Oberflächenbehandlung vorgesehen.
          </p>
        )}
      </Block>

      {/* Beschläge */}
      <Block title="Beschläge" total={calc.hardware.total}>
        {calc.hardware.lines.map((l, i) => (
          <div key={i} className="flex flex-col gap-1.5 border-b border-ink-100 pb-2 last:border-0 last:pb-0">
            <Field label="Position">{l.label}</Field>
            <ProfileField label="Preis laut Herstellerprofil" editTo={PRICING}>
              {eur2(l.unitPrice)}
            </ProfileField>
            <Field label="Menge">{l.qty === 1 ? '1 Satz' : `${l.qty} Stück`}</Field>
            <Formula>
              {dec(l.qty)} × {eur2(l.unitPrice)} = {eur2(l.total)}
            </Formula>
          </div>
        ))}
        <Total label="Beschläge gesamt" value={calc.hardware.total} />
        <ProfileNote>Beschlagpreise stammen aus deinem Profil</ProfileNote>
      </Block>

      {/* Lieferung */}
      <Block title="Lieferung" total={calc.delivery.total}>
        <ProfileField label="Lieferkosten laut Herstellerprofil" editTo={PRICING}>
          {eur2(calc.delivery.total)}
        </ProfileField>
        <ProfileNote>Lieferkosten stammen aus deinem Profil</ProfileNote>
      </Block>

      {/* Montage */}
      <Block title="Montage" total={calc.assembly.total}>
        {calc.assembly.selected ? (
          <>
            <ProfileField label="Montagekosten laut Herstellerprofil" editTo={PRICING}>
              {eur2(calc.assembly.total)}
            </ProfileField>
            <ProfileNote>Montagekosten stammen aus deinem Profil</ProfileNote>
          </>
        ) : (
          <p className="text-sm text-ink-500">Keine Montage ausgewählt.</p>
        )}
      </Block>

      {/* Marge */}
      <Block title="Marge" total={calc.margin.total}>
        <Field label="Zwischensumme">{eur2(calc.subtotal)}</Field>
        <ProfileField label="Marge laut Herstellerprofil" editTo={PRICING}>
          {dec(calc.margin.percent)} %
        </ProfileField>
        <Formula>
          {eur2(calc.subtotal)} × {dec(calc.margin.percent)} % = {eur2(calc.margin.total)}
        </Formula>
        <ProfileNote>Marge stammt aus deinem Profil</ProfileNote>
      </Block>

      {/* Gesamtkalkulation */}
      <div className="mt-2 rounded-2xl border border-ink-100 bg-ink-50/50 p-5">
        <h3 className="text-sm font-semibold text-ink-950">Gesamtkalkulation</h3>
        <dl className="mt-3 space-y-1.5 text-sm">
          <SumRow label="Material" value={calc.material.total} />
          <SumRow label="Arbeitszeit" value={calc.labor.total} />
          <SumRow label="Oberfläche" value={calc.surface.total} />
          <SumRow label="Beschläge" value={calc.hardware.total} />
          <SumRow label="Lieferung" value={calc.delivery.total} />
          <SumRow label="Montage" value={calc.assembly.total} />
        </dl>
        <div className="mt-3 space-y-1.5 border-t border-ink-200 pt-3 text-sm">
          <SumRow label="Zwischensumme" value={calc.subtotal} strong />
          <SumRow label={`Marge (${dec(calc.margin.percent)} %)`} value={calc.margin.total} />
        </div>
        <div className="mt-3 flex items-center justify-between border-t-2 border-ink-300 pt-3">
          <span className="text-base font-semibold text-ink-950">Endpreis</span>
          <span className="text-2xl font-semibold text-ink-950">{formatEUR(calc.price)}</span>
        </div>
        {calc.minimumApplied && (
          <p className="mt-2 text-xs text-amber-700">
            Hinweis: Der Mindestauftragswert aus deinem Profil wurde angewendet.
          </p>
        )}
      </div>
    </div>
  )
}

/* ───────────── Bausteine ───────────── */

function Block({
  title,
  total,
  defaultOpen = false,
  children,
}: {
  title: string
  total: number
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-ink-50/60"
      >
        <span className="flex items-center gap-2 font-semibold text-ink-950">
          <ChevronDown
            size={18}
            className={cn('text-ink-400 transition-transform', open && 'rotate-180')}
          />
          {title}
        </span>
        <span className="font-semibold text-ink-950">{formatEUR(total)}</span>
      </button>
      {open && <div className="flex flex-col gap-2 border-t border-ink-100 px-5 py-4">{children}</div>}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="text-right font-medium text-ink-900">{children}</span>
    </div>
  )
}

/** Feld, dessen Wert aus dem Herstellerprofil stammt – mit Bearbeiten-Link. */
function ProfileField({
  label,
  editTo,
  children,
}: {
  label: string
  editTo: string
  children: ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="flex items-center gap-1.5 text-right font-medium text-accent-700">
        {children}
        <Link
          to={editTo}
          title="Wert im Profil bearbeiten"
          className="text-ink-300 transition-colors hover:text-accent-600"
        >
          <Pencil size={13} />
        </Link>
      </span>
    </div>
  )
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">
      <span className="font-mono text-[0.85rem]">{children}</span>
    </div>
  )
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <div className="mt-1 flex items-center justify-between border-t border-ink-100 pt-2 text-sm">
      <span className="font-medium text-ink-700">{label}</span>
      <span className="font-semibold text-ink-950">{formatEUR(value)}</span>
    </div>
  )
}

function ProfileNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
      <BadgeCheck size={14} /> {children}
    </p>
  )
}

function SumRow({
  label,
  value,
  strong,
}: {
  label: string
  value: number
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={cn('text-ink-500', strong && 'font-medium text-ink-800')}>{label}</dt>
      <dd className={cn('font-medium text-ink-900', strong && 'font-semibold')}>
        {formatEUR(value)}
      </dd>
    </div>
  )
}
