import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal } from '@/components/ui/Reveal'
import { features } from '@/data/content'

export function Features() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="Alles in einer Plattform"
          title="Vom Gedanken zum fertigen Produkt"
          subtitle="Jeder Schritt der Customer Journey – durchdacht, automatisiert und in einem eleganten Erlebnis vereint."
        />

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 0.06}>
              <div className="group h-full rounded-3xl border border-ink-100 bg-white p-7 transition-all duration-300 ease-[var(--ease-smooth)] hover:-translate-y-1 hover:border-ink-200 hover:shadow-float">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-950 text-white transition-colors duration-300 group-hover:bg-accent-600">
                  <feature.icon size={20} strokeWidth={1.75} />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-ink-950">
                  {feature.title}
                </h3>
                <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink-500">
                  {feature.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
