import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastTone = 'success' | 'info'

/**
 * Schlichte, selbst-schließende Statusmeldung (unten zentriert).
 * `message = null` blendet aus. Schließt nach `duration` ms automatisch.
 */
export function Toast({
  message,
  tone = 'success',
  duration = 4500,
  onClose,
}: {
  message: string | null
  tone?: ToastTone
  duration?: number
  onClose: () => void
}) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [message, duration, onClose])

  const Icon = tone === 'success' ? CheckCircle2 : Info

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4"
        >
          <div
            className={cn(
              'flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-lift',
              tone === 'success'
                ? 'border-emerald-100 bg-white text-emerald-700'
                : 'border-ink-100 bg-white text-ink-800',
            )}
          >
            <Icon
              size={18}
              className={tone === 'success' ? 'text-emerald-600' : 'text-accent-600'}
            />
            <span className="text-sm font-medium">{message}</span>
            <button
              onClick={onClose}
              aria-label="Schließen"
              className="ml-1 text-ink-300 transition-colors hover:text-ink-600"
            >
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
