import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  light = false,
  tight = false,
}: {
  className?: string
  light?: boolean
  /** Enge Wortmarke: kompensiert den weißen Rand des Logo-PNGs (nur Navbar). */
  tight?: boolean
}) {
  return (
    <Link
      to="/"
      className={cn('group inline-flex items-center', tight ? 'gap-1' : 'gap-2.5', className)}
    >
      <img
        src="/logo.png"
        alt="Forma Logo"
        className={cn(
          'h-10 w-10 object-contain transition-transform duration-300 ease-[var(--ease-smooth)] group-hover:scale-105',
          tight && '-mr-2',
        )}
      />
      <span
        className={cn(
          'text-[1.05rem] font-semibold tracking-tight',
          light ? 'text-white' : 'text-ink-950',
        )}
      >
        Forma
      </span>
    </Link>
  )
}
