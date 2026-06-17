import { cn } from '@/lib/utils'
import { Reveal } from './Reveal'

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <Reveal
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {eyebrow && (
        <span className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-600">
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          'text-balance text-3xl font-semibold leading-[1.08] text-ink-950 sm:text-4xl md:text-5xl',
          align === 'center' && 'max-w-3xl',
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'text-balance text-lg leading-relaxed text-ink-500',
            align === 'center' && 'max-w-2xl',
          )}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  )
}
