import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Reveal } from '@/components/ui/Reveal'
import { faqs } from '@/data/content'
import { cn } from '@/lib/utils'

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="bg-cream py-24 sm:py-32">
      <Container className="max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title="Häufige Fragen"
          subtitle="Alles, was du über IdeaForge wissen musst."
        />

        <div className="mt-14 flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i
            return (
              <Reveal key={faq.question} delay={i * 0.04}>
                <div
                  className={cn(
                    'rounded-2xl border bg-white transition-colors duration-300',
                    isOpen ? 'border-ink-200 shadow-soft' : 'border-ink-100',
                  )}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-[1.05rem] font-medium text-ink-950">
                      {faq.question}
                    </span>
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-700 transition-transform duration-300',
                        isOpen && 'rotate-45 bg-accent-600 text-white',
                      )}
                    >
                      <Plus size={16} />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-5 pr-12 text-[0.97rem] leading-relaxed text-ink-500">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
