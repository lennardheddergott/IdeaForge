import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({
  children,
  className,
  hover = false,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-ink-100 bg-white shadow-soft',
        hover &&
          'transition-all duration-300 ease-[var(--ease-smooth)] hover:-translate-y-1 hover:shadow-lift hover:border-ink-200',
        className,
      )}
    >
      {children}
    </div>
  )
}
