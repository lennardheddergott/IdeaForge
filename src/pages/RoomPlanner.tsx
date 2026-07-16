import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ImageUp, Plus, Sofa, Sparkles, Trash2, X } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AmbientScene } from '@/components/ui/AmbientScene'
import { ProGate } from '@/components/layout/ProGate'
import { cn } from '@/lib/utils'
import {
  ROOM_STYLES,
  ROOM_TYPES,
  createRoomProject,
  validateRoomPhoto,
  type FurnitureWish,
} from '@/lib/roomPlanner'

export function RoomPlanner() {
  return (
    <ProGate>
      <RoomPlannerInner />
    </ProGate>
  )
}

function RoomPlannerInner() {
  const navigate = useNavigate()
  const [photo, setPhoto] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [style, setStyle] = useState<string | null>(null)
  const [styleText, setStyleText] = useState('')
  const [roomType, setRoomType] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [wishes, setWishes] = useState<FurnitureWish[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Vorschau-URL abgeleitet erzeugen und beim Wechsel wieder freigeben.
  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo])
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const pickFile = (file: File | undefined) => {
    if (!file) return
    try {
      validateRoomPhoto(file)
      setError(null)
      setPhoto(file)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ungültige Datei.')
    }
  }

  const submit = async () => {
    if (!photo) {
      setError('Bitte lade zuerst ein Foto deines Raums hoch.')
      return
    }
    if (wishes.length === 0) {
      setError('Bitte füge mindestens ein gewünschtes Möbelstück hinzu.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const project = await createRoomProject({
        name: '',
        roomType,
        style: styleText.trim() || style,
        description: description.trim() || null,
        photo,
        wishes,
      })
      navigate(`/room-planner/${project.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Raumprojekt konnte nicht gestartet werden.')
      setSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <AmbientScene className="h-[55vh]" />
      <Container className="max-w-3xl py-14 sm:py-16">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-700">
          <Sparkles size={13} /> Pro
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
          Gestalte deinen Raum
        </h1>
        <p className="mt-3 max-w-xl text-pretty leading-relaxed text-ink-500">
          Lade ein Foto deines Raums hoch und beschreibe, wie du ihn gestalten möchtest.
          IdeaForge entwickelt daraus einen vollständig eingerichteten Raum mit individuell
          gefertigten Möbeln.
        </p>

        {/* 1) Upload */}
        <Card className="mt-8 p-6">
          <h2 className="text-sm font-semibold text-ink-950">Raumfoto</h2>
          {!preview ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                pickFile(e.dataTransfer.files?.[0])
              }}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'mt-4 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center transition-colors',
                dragging
                  ? 'border-accent-400 bg-accent-50/50'
                  : 'border-ink-200 bg-ink-50/40 hover:border-ink-300',
              )}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-accent-600 shadow-soft">
                <ImageUp size={22} />
              </span>
              <div>
                <p className="text-sm font-medium text-ink-900">
                  Foto hierher ziehen oder auswählen
                </p>
                <p className="mt-1 text-xs text-ink-400">JPG, PNG oder WebP · max. 10 MB</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="mt-4">
              <div className="relative overflow-hidden rounded-2xl border border-ink-100">
                <img src={preview} alt="Dein Raum" className="max-h-80 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  aria-label="Foto entfernen"
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-soft backdrop-blur transition-colors hover:text-ink-950"
                >
                  <X size={17} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-3 text-sm font-medium text-accent-600 hover:text-accent-700"
              >
                Anderes Foto wählen
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </div>
          )}
        </Card>

        {/* 2) Stil */}
        <Card className="mt-6 p-6">
          <h2 className="text-sm font-semibold text-ink-950">Stil</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {ROOM_STYLES.map((s) => (
              <Chip
                key={s.id}
                active={style === s.id && !styleText.trim()}
                onClick={() => {
                  setStyle(s.id)
                  setStyleText('')
                }}
              >
                {s.label}
              </Chip>
            ))}
          </div>
          <input
            value={styleText}
            onChange={(e) => setStyleText(e.target.value)}
            placeholder="… oder eigenen Stil beschreiben"
            className="mt-3 h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 outline-none transition-all placeholder:text-ink-300 focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
          />
        </Card>

        {/* 3) Raumtyp */}
        <Card className="mt-6 p-6">
          <h2 className="text-sm font-semibold text-ink-950">Raum &amp; Nutzung</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {ROOM_TYPES.map((r) => (
              <Chip key={r.id} active={roomType === r.id} onClick={() => setRoomType(r.id)}>
                {r.label}
              </Chip>
            ))}
          </div>
        </Card>

        {/* 4) Möbelwünsche */}
        <Card className="mt-6 p-6">
          <h2 className="text-sm font-semibold text-ink-950">Gewünschte Möbel</h2>
          <p className="mt-1 text-xs text-ink-400">
            Füge jedes Möbelstück einzeln hinzu – die KI platziert sie anschließend automatisch
            passend im Raum. Eine Position kannst du optional angeben, musst du aber nicht.
          </p>

          {wishes.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {wishes.map((w, i) => (
                <li
                  key={i}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-ink-100 bg-ink-50/40 p-4"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-medium text-ink-900">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-950 text-[11px] font-semibold text-white">
                        {i + 1}
                      </span>
                      {w.art}
                    </p>
                    <p className="mt-1 pl-7 text-xs text-ink-500">
                      {[w.position, w.material, w.farbe, w.masse, w.zusatz]
                        .filter(Boolean)
                        .join(' · ') || 'Keine weiteren Angaben'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWishes((cur) => cur.filter((_, idx) => idx !== i))}
                    aria-label="Möbel entfernen"
                    className="shrink-0 text-ink-300 transition-colors hover:text-rose-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <WishForm onAdd={(w) => setWishes((cur) => [...cur, w])} />
        </Card>

        {/* 5) Optionale Gesamtbeschreibung */}
        <Card className="mt-6 p-6">
          <h2 className="text-sm font-semibold text-ink-950">
            Zusätzliche Beschreibung <span className="font-normal text-ink-400">(optional)</span>
          </h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="z. B. helle, ruhige Atmosphäre, viel Stauraum, natürliche Materialien …"
            className="mt-4 w-full resize-none rounded-2xl border border-ink-200 bg-white p-4 text-sm leading-relaxed text-ink-900 outline-none transition-all placeholder:text-ink-300 focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
          />
        </Card>

        {error && (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <Button
          size="lg"
          onClick={submit}
          disabled={submitting}
          className="group mt-6 w-full"
        >
          <Sofa size={18} />
          {submitting ? 'Raum wird vorbereitet …' : 'Raum gestalten lassen'}
          <ArrowRight
            size={18}
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </Button>
      </Container>
    </div>
  )
}

/* ───────────── Teilkomponenten ───────────── */

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
        'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-accent-600 bg-accent-600 text-white'
          : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
      )}
    >
      {children}
    </button>
  )
}

const EMPTY_WISH: FurnitureWish = {
  art: '',
  position: '',
  material: '',
  farbe: '',
  masse: '',
  zusatz: '',
}

function WishForm({ onAdd }: { onAdd: (w: FurnitureWish) => void }) {
  const [w, setW] = useState<FurnitureWish>(EMPTY_WISH)
  const set = (k: keyof FurnitureWish, v: string) => setW((cur) => ({ ...cur, [k]: v }))

  const add = () => {
    if (!w.art.trim()) return
    onAdd({
      art: w.art.trim(),
      position: w.position?.trim() || undefined,
      material: w.material?.trim() || undefined,
      farbe: w.farbe?.trim() || undefined,
      masse: w.masse?.trim() || undefined,
      zusatz: w.zusatz?.trim() || undefined,
    })
    setW(EMPTY_WISH)
  }

  return (
    <div className="mt-4 rounded-2xl border border-ink-100 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Möbelart *" value={w.art} onChange={(v) => set('art', v)} placeholder="z. B. Schwebendes TV-Board" />
        <Input label="Position im Raum" value={w.position ?? ''} onChange={(v) => set('position', v)} placeholder="z. B. rechte Wand" />
        <Input label="Material" value={w.material ?? ''} onChange={(v) => set('material', v)} placeholder="z. B. helle Eiche" />
        <Input label="Farbe" value={w.farbe ?? ''} onChange={(v) => set('farbe', v)} placeholder="z. B. natur" />
        <Input label="Maße" value={w.masse ?? ''} onChange={(v) => set('masse', v)} placeholder="z. B. 300 × 40 × 35 cm" />
        <Input label="Funktion / Wünsche" value={w.zusatz ?? ''} onChange={(v) => set('zusatz', v)} placeholder="z. B. Kabelmanagement" />
      </div>
      <button
        type="button"
        onClick={add}
        disabled={!w.art.trim()}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-800 transition-colors hover:border-ink-300 disabled:opacity-40"
      >
        <Plus size={16} /> Möbel hinzufügen
      </button>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-400">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 outline-none transition-all placeholder:text-ink-300 focus:border-accent-400 focus:ring-4 focus:ring-accent-100"
      />
    </label>
  )
}
