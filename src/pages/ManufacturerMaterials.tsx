import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Layers, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Reveal } from '@/components/ui/Reveal'
import { Toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import {
  addMaterial,
  categoryLabel,
  deleteMaterial,
  listMyMaterials,
  MATERIAL_CATEGORIES,
  seedDefaultMaterials,
  updateMaterial,
  type Material,
  type MaterialCategory,
} from '@/lib/materials'

export function ManufacturerMaterials() {
  const [materials, setMaterials] = useState<Material[] | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Filter/Suche
  const [filter, setFilter] = useState<'all' | MaterialCategory>('all')
  const [search, setSearch] = useState('')

  // Formular "Material hinzufügen"
  const [name, setName] = useState('')
  const [category, setCategory] = useState<MaterialCategory>('holzwerkstoff')
  const [price, setPrice] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  const load = async () => {
    setMaterials(await listMyMaterials())
  }
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const data = await listMyMaterials()
        if (!cancelled) setMaterials(data)
      } catch {
        if (!cancelled) setMaterials([])
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const visible = useMemo(() => {
    const list = materials ?? []
    return list.filter(
      (m) =>
        (filter === 'all' || m.category === filter) &&
        (search.trim() === '' || m.name.toLowerCase().includes(search.trim().toLowerCase())),
    )
  }, [materials, filter, search])

  const add = async () => {
    if (!name.trim()) {
      setAddError('Bitte einen Materialnamen angeben.')
      return
    }
    setAddError(null)
    setBusy(true)
    try {
      await addMaterial({
        name,
        category,
        price_per_m2: price === '' ? 0 : Number(price),
      })
      setName('')
      setPrice('')
      await load()
      setToast('Material hinzugefügt.')
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Hinzufügen fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  const seed = async () => {
    setBusy(true)
    try {
      const count = await seedDefaultMaterials()
      await load()
      setToast(
        count > 0
          ? `${count} Standardmaterialien hinzugefügt.`
          : 'Alle Standardmaterialien sind bereits vorhanden.',
      )
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'Fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  // Lokale Aktualisierung + Persistierung eines Feldes.
  const patch = (id: string, fields: Partial<Material>) =>
    setMaterials((prev) =>
      (prev ?? []).map((m) => (m.id === id ? { ...m, ...fields } : m)),
    )

  const persistPrice = async (m: Material, value: string) => {
    const price_per_m2 = value === '' ? 0 : Number(value)
    if (price_per_m2 === m.price_per_m2) return
    try {
      await updateMaterial(m.id, { price_per_m2 })
      patch(m.id, { price_per_m2 })
    } catch {
      setToast('Preis konnte nicht gespeichert werden.')
    }
  }

  const toggleActive = async (m: Material) => {
    try {
      await updateMaterial(m.id, { is_active: !m.is_active })
      patch(m.id, { is_active: !m.is_active })
    } catch {
      setToast('Status konnte nicht geändert werden.')
    }
  }

  const remove = async (m: Material) => {
    if (!confirm(`Material „${m.name}“ wirklich löschen?`)) return
    try {
      await deleteMaterial(m.id)
      setMaterials((prev) => (prev ?? []).filter((x) => x.id !== m.id))
      setToast('Material gelöscht.')
    } catch {
      setToast('Löschen fehlgeschlagen.')
    }
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-cream to-white" />

      <Container className="max-w-4xl py-14 sm:py-16">
        <Reveal>
          <Link
            to="/manufacturer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft size={16} /> Zurück zum Dashboard
          </Link>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-ink-950 sm:text-4xl">Materialien</h1>
              <p className="mt-2 text-ink-500">
                Pflege beliebig viele Materialien mit Kategorie und €/m². Nur aktive
                Materialien fließen in die Preisberechnung ein.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={seed} disabled={busy}>
              <Sparkles size={16} /> Standardmaterialien hinzufügen
            </Button>
          </div>
        </Reveal>

        {/* Material hinzufügen */}
        <Reveal>
          <Card className="mt-8 p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink-950">
              <Plus size={17} className="text-accent-600" /> Material hinzufügen
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_170px_130px_auto]">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Materialname"
                className="h-11 rounded-xl border border-ink-200 bg-white px-4 text-sm outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="h-11 rounded-xl border border-ink-200 bg-white px-3 text-sm outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
              >
                {MATERIAL_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="€/m²"
                className="h-11 rounded-xl border border-ink-200 bg-white px-4 text-sm outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
              />
              <Button onClick={add} disabled={busy}>
                Hinzufügen
              </Button>
            </div>
            {addError && <p className="mt-2 text-sm text-red-600">{addError}</p>}
          </Card>
        </Reveal>

        {/* Filter/Suche */}
        <Reveal>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Name …"
              className="h-10 flex-1 rounded-xl border border-ink-200 bg-white px-4 text-sm outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | MaterialCategory)}
              className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
            >
              <option value="all">Alle Kategorien</option>
              {MATERIAL_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </Reveal>

        {/* Liste */}
        <Reveal>
          <Card className="mt-4 p-3 sm:p-4">
            {materials === null ? (
              <p className="p-4 text-sm text-ink-400">Lädt …</p>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
                  <Layers size={22} />
                </span>
                <p className="text-sm text-ink-500">
                  {(materials?.length ?? 0) === 0
                    ? 'Noch keine Materialien. Füge eins hinzu oder klicke „Standardmaterialien hinzufügen“.'
                    : 'Keine Materialien für diesen Filter.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-ink-100">
                {visible.map((m) => (
                  <MaterialRow
                    key={m.id}
                    material={m}
                    onPrice={(v) => persistPrice(m, v)}
                    onToggle={() => toggleActive(m)}
                    onDelete={() => remove(m)}
                  />
                ))}
              </div>
            )}
          </Card>
        </Reveal>
      </Container>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  )
}

function MaterialRow({
  material: m,
  onPrice,
  onToggle,
  onDelete,
}: {
  material: Material
  onPrice: (v: string) => void
  onToggle: () => void
  onDelete: () => void
}) {
  const [price, setPrice] = useState(m.price_per_m2 === 0 ? '' : String(m.price_per_m2))

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 px-2 py-3 sm:px-3',
        !m.is_active && 'opacity-55',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-950">{m.name}</p>
        <span className="text-xs text-ink-400">{categoryLabel(m.category)}</span>
      </div>

      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={() => onPrice(price)}
          placeholder="0"
          className="h-9 w-24 rounded-lg border border-ink-200 bg-white px-3 text-sm outline-none focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
        />
        <span className="text-xs text-ink-400">€/m²</span>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={m.is_active}
        onClick={onToggle}
        title={m.is_active ? 'Aktiv' : 'Inaktiv'}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          m.is_active ? 'bg-accent-600' : 'bg-ink-200',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all',
            m.is_active ? 'right-0.5' : 'left-0.5',
          )}
        />
      </button>

      <button
        type="button"
        onClick={onDelete}
        title="Löschen"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}
