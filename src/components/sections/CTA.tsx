import { ArrowRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'

export function CTA() {
  return (
    <section className="pb-28 pt-4">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-ink-950 px-8 py-20 text-center sm:px-16">
            {/* glow */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-accent-600/30 blur-[120px]" />
              <div className="absolute bottom-0 right-1/4 h-[260px] w-[260px] rounded-full bg-violet-accent/25 blur-[100px]" />
              <div className="absolute inset-0 grain opacity-30" />
            </div>

            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-balance text-4xl font-semibold leading-[1.06] text-white sm:text-5xl">
                Deine nächste Idee ist nur eine Beschreibung entfernt.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-ink-300">
                Starte kostenlos und halte dein erstes KI-Design in unter einer
                Minute in den Händen.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button to="/create" size="lg" className="group">
                  Jetzt kostenlos starten
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  />
                </Button>
                <Button
                  to="/manufacturers"
                  size="lg"
                  variant="secondary"
                  className="border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20 hover:border-white/30"
                >
                  Hersteller entdecken
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
