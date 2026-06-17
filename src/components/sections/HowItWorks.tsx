import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal } from '@/components/ui/Reveal'
import { steps } from '@/data/content'

export function HowItWorks() {
  return (
    <section className="bg-ink-950 py-24 text-white sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="So funktioniert es"
          title="In vier Schritten zum Unikat"
          subtitle="Kein technisches Wissen nötig. Du beschreibst – wir kümmern uns um den Rest."
          className="[&_h2]:text-white [&_p]:text-ink-400"
        />

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Reveal key={step.step} delay={i * 0.08}>
              <div className="group h-full bg-ink-950 p-8 transition-colors duration-300 hover:bg-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white ring-1 ring-white/10 transition-colors duration-300 group-hover:bg-accent-600 group-hover:ring-accent-500">
                    <step.icon size={20} strokeWidth={1.75} />
                  </span>
                  <span className="font-serif text-4xl italic text-white/15">
                    {step.step}
                  </span>
                </div>
                <h3 className="mt-7 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink-400">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
