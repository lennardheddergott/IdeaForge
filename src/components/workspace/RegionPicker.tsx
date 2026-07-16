import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { cn } from '@/lib/utils'
import type { BBox } from '@/lib/roomPlanner'

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/**
 * Lässt den Nutzer je Möbel eine ungefähre Zielregion im Raumfoto aufziehen
 * (normalisiert 0..1). Diese Region ist zugleich die spätere unsichtbare
 * Klickfläche (Hotspot). Marker/Nummern erscheinen NUR hier während der Eingabe.
 */
export function RegionPicker({
  imageUrl,
  boxes,
  labels,
  activeIndex,
  onChange,
}: {
  imageUrl: string
  boxes: (BBox | null | undefined)[]
  labels: string[]
  activeIndex: number
  onChange: (index: number, bbox: BBox) => void
}) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const [draft, setDraft] = useState<BBox | null>(null)

  const toNorm = (clientX: number, clientY: number) => {
    const r = surfaceRef.current!.getBoundingClientRect()
    return { x: clamp01((clientX - r.left) / r.width), y: clamp01((clientY - r.top) / r.height) }
  }

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (activeIndex < 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = toNorm(e.clientX, e.clientY)
    start.current = p
    setDraft({ x: p.x, y: p.y, w: 0, h: 0 })
  }
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!start.current) return
    const p = toNorm(e.clientX, e.clientY)
    setDraft({
      x: Math.min(p.x, start.current.x),
      y: Math.min(p.y, start.current.y),
      w: Math.abs(p.x - start.current.x),
      h: Math.abs(p.y - start.current.y),
    })
  }
  const onUp = () => {
    if (draft && draft.w > 0.02 && draft.h > 0.02 && activeIndex >= 0) {
      onChange(activeIndex, draft)
    }
    start.current = null
    setDraft(null)
  }

  const pct = (b: BBox) => ({
    left: `${b.x * 100}%`,
    top: `${b.y * 100}%`,
    width: `${b.w * 100}%`,
    height: `${b.h * 100}%`,
  })

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-100 select-none">
      <img src={imageUrl} alt="Raum" className="block w-full" draggable={false} />
      <div
        ref={surfaceRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        className={cn(
          'absolute inset-0 touch-none',
          activeIndex >= 0 ? 'cursor-crosshair' : 'cursor-default',
        )}
      >
        {boxes.map((b, i) =>
          b ? (
            <div
              key={i}
              className={cn(
                'pointer-events-none absolute rounded-md border-2',
                i === activeIndex
                  ? 'border-accent-500 bg-accent-500/15'
                  : 'border-white/80 bg-black/10',
              )}
              style={pct(b)}
            >
              <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink-950 text-[10px] font-semibold text-white">
                {i + 1}
              </span>
              <span className="absolute left-0 top-6 max-w-full truncate rounded bg-ink-950/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {labels[i]}
              </span>
            </div>
          ) : null,
        )}
        {draft && (
          <div
            className="pointer-events-none absolute rounded-md border-2 border-accent-500 bg-accent-500/15"
            style={pct(draft)}
          />
        )}
      </div>
    </div>
  )
}
