import { cn } from '@/lib/utils'

type Variant = 'cabinet' | 'table' | 'lamp' | 'sofa'

const palettes: Record<Variant, { bg: string; piece: string; accent: string }> = {
  cabinet: {
    bg: 'from-[#efeae3] to-[#dcd4c8]',
    piece: 'from-[#caa97e] to-[#9c7b54]',
    accent: '#2b2b30',
  },
  table: {
    bg: 'from-[#eceef2] to-[#d6dae1]',
    piece: 'from-[#b98c5e] to-[#7c5836]',
    accent: '#1c1c20',
  },
  lamp: {
    bg: 'from-[#f1ece6] to-[#ded6cb]',
    piece: 'from-[#e7c98f] to-[#c69a55]',
    accent: '#33312e',
  },
  sofa: {
    bg: 'from-[#eef0ee] to-[#dbe0dd]',
    piece: 'from-[#c9c2b6] to-[#a59a89]',
    accent: '#2a2a2e',
  },
}

/**
 * An abstract, studio-style stand-in for an AI-generated product rendering.
 * Built entirely from gradients + geometry so it reads as a premium product shot.
 */
export function RenderingPlaceholder({
  variant = 'cabinet',
  className,
}: {
  variant?: Variant
  className?: string
}) {
  const p = palettes[variant]
  return (
    <div
      className={cn(
        'relative aspect-[4/3] w-full overflow-hidden rounded-2xl',
        className,
      )}
    >
      {/* studio backdrop */}
      <div className={cn('absolute inset-0 bg-gradient-to-b', p.bg)} />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent" />
      {/* soft key light */}
      <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/40 blur-3xl" />

      {/* furniture silhouette */}
      <Piece variant={variant} palette={p} />

      {/* floor shadow */}
      <div className="absolute bottom-[14%] left-1/2 h-3 w-1/2 -translate-x-1/2 rounded-[100%] bg-black/15 blur-md" />

      {/* sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20" />
    </div>
  )
}

function Piece({
  variant,
  palette,
}: {
  variant: Variant
  palette: { piece: string; accent: string }
}) {
  if (variant === 'table') {
    return (
      <div className="absolute inset-0 flex items-end justify-center pb-[18%]">
        <div className="relative h-[42%] w-[64%]">
          <div
            className={cn(
              'absolute inset-x-0 top-0 h-[22%] rounded-md bg-gradient-to-b shadow-lg',
              palette.piece,
            )}
          />
          <div
            className="absolute bottom-0 left-[8%] h-[78%] w-[5%] rounded-sm"
            style={{ background: palette.accent }}
          />
          <div
            className="absolute bottom-0 right-[8%] h-[78%] w-[5%] rounded-sm"
            style={{ background: palette.accent }}
          />
        </div>
      </div>
    )
  }

  if (variant === 'lamp') {
    return (
      <div className="absolute inset-0 flex items-end justify-center pb-[18%]">
        <div className="relative h-[62%] w-[40%]">
          <div
            className={cn(
              'absolute left-1/2 top-0 h-[26%] w-[70%] -translate-x-1/2 rounded-t-[100%] bg-gradient-to-b shadow-lg',
              palette.piece,
            )}
          />
          <div
            className="absolute left-1/2 top-[26%] h-[64%] w-[3%] -translate-x-1/2"
            style={{ background: palette.accent }}
          />
          <div
            className="absolute bottom-0 left-1/2 h-[5%] w-[34%] -translate-x-1/2 rounded-full"
            style={{ background: palette.accent }}
          />
        </div>
      </div>
    )
  }

  if (variant === 'sofa') {
    return (
      <div className="absolute inset-0 flex items-end justify-center pb-[20%]">
        <div className="relative h-[38%] w-[68%]">
          <div
            className={cn(
              'absolute inset-0 rounded-2xl bg-gradient-to-b shadow-lg',
              palette.piece,
            )}
          />
          <div className="absolute left-[6%] right-[6%] top-[14%] flex gap-[4%]">
            <div className="h-10 flex-1 rounded-lg bg-white/25" />
            <div className="h-10 flex-1 rounded-lg bg-white/25" />
          </div>
        </div>
      </div>
    )
  }

  // cabinet (default)
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-[20%]">
      <div className="relative h-[44%] w-[62%]">
        <div
          className={cn(
            'absolute inset-0 rounded-lg bg-gradient-to-b shadow-lg',
            palette.piece,
          )}
        />
        <div className="absolute inset-[8%] grid grid-cols-2 gap-[4%]">
          <div className="rounded-md bg-black/10 ring-1 ring-white/20" />
          <div className="rounded-md bg-black/10 ring-1 ring-white/20" />
        </div>
        {/* indirect LED glow */}
        <div className="absolute -bottom-2 left-1/2 h-2 w-[80%] -translate-x-1/2 rounded-full bg-amber-200/70 blur-md" />
      </div>
    </div>
  )
}
