import { Star } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal } from '@/components/ui/Reveal'
import { testimonials } from '@/data/content'

export function Testimonials() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow="Geschätzt von Tausenden"
          title="Was unsere Nutzer sagen"
          subtitle="Designer, Hersteller und Menschen mit großen Ideen – sie alle bauen mit IdeaForge."
        />

        <div className="mt-16 columns-1 gap-5 sm:columns-2 lg:columns-2 [&>*]:mb-5">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={(i % 2) * 0.08}>
              <figure className="break-inside-avoid rounded-3xl border border-ink-100 bg-white p-7 shadow-soft">
                <div className="flex gap-0.5 text-accent-500">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={15} className="fill-accent-500" />
                  ))}
                </div>
                <blockquote className="mt-4 text-pretty text-[1.05rem] leading-relaxed text-ink-800">
                  „{t.quote}"
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-950 text-sm font-semibold text-white">
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-950">{t.name}</p>
                    <p className="text-xs text-ink-400">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
