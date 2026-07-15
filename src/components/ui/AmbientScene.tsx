import { cn } from '@/lib/utils'

/**
 * Dezente Hightech-Kulisse: sehr langsam driftendes Akzentlicht + feines,
 * radial ausgeblendetes Gitter. Bewusst zurückhaltend – erzeugt Tiefe und den
 * Eindruck eines intelligenten Systems, ohne die Oberfläche zu überladen.
 */
export function AmbientScene({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}
    >
      {/* Gitter, weich zur Mitte hin ausgeblendet */}
      <div className="bg-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_35%,black,transparent_78%)]" />
      {/* Driftendes Akzentlicht */}
      <div className="animate-aurora absolute left-1/2 top-[-22%] h-[540px] w-[820px] -translate-x-1/2 rounded-full bg-accent-400/20 blur-[130px]" />
      <div className="animate-aurora absolute right-[4%] top-[8%] h-[300px] w-[300px] rounded-full bg-violet-accent/15 blur-[120px] [animation-delay:-7s]" />
    </div>
  )
}
