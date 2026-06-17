import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  light = false,
}: {
  className?: string
  light?: boolean
}) {
  return (
    <Link to="/" className={cn('group inline-flex items-center gap-2.5', className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-ink-900 shadow-float transition-transform duration-300 ease-[var(--ease-smooth)] group-hover:scale-105">
        <span className="absolute inset-0 rounded-[10px] bg-gradient-to-br from-accent-500 to-violet-accent opacity-90" />
        <span className="relative text-[15px] font-bold text-white">I</span>
      </span>
      <span
        className={cn(
          'text-[1.05rem] font-semibold tracking-tight',
          light ? 'text-white' : 'text-ink-950',
        )}
      >
        IdeaForge
      </span>
    </Link>
  )
}
