import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-full transition-all duration-300 ease-[var(--ease-smooth)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary:
    'bg-accent-600 text-white shadow-float hover:bg-accent-700 hover:shadow-lift hover:-translate-y-0.5',
  dark: 'bg-ink-900 text-white shadow-float hover:bg-ink-800 hover:shadow-lift hover:-translate-y-0.5',
  secondary:
    'bg-white text-ink-900 border border-ink-200 hover:border-ink-300 hover:bg-ink-50 shadow-soft',
  ghost: 'text-ink-700 hover:text-ink-950 hover:bg-ink-100',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-[0.95rem]',
  lg: 'h-13 px-8 text-base',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined }
type LinkProps = CommonProps & { to: string; href?: undefined }

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps | LinkProps
>(function Button(props, ref) {
  const { variant = 'primary', size = 'md', className, children } = props

  const classes = cn(base, variants[variant], sizes[size], className)

  if ('to' in props && props.to) {
    return (
      <Link to={props.to} className={classes}>
        {children}
      </Link>
    )
  }

  const { variant: _v, size: _s, className: _c, children: _ch, ...rest } =
    props as ButtonProps
  void _v
  void _s
  void _c
  void _ch
  return (
    <button ref={ref} className={classes} {...rest}>
      {children}
    </button>
  )
})
