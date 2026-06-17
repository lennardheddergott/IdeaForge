import { Container } from '@/components/ui/Container'
import { trustedBy } from '@/data/content'

export function LogoCloud() {
  return (
    <section className="border-y border-ink-100 bg-cream/60 py-10">
      <Container>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
          Vertraut von führenden Manufakturen & Studios
        </p>
        <div className="relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex w-max animate-marquee gap-14">
            {[...trustedBy, ...trustedBy].map((name, i) => (
              <span
                key={i}
                className="whitespace-nowrap text-lg font-semibold tracking-tight text-ink-400"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
