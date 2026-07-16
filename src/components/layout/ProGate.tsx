import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check, Sparkles } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AmbientScene } from '@/components/ui/AmbientScene'
import { useAuth } from '@/context/AuthContext'
import { activateProPreview } from '@/lib/profile'

const PRO_BENEFITS = [
  'Ganze Räume aus einem Foto gestalten',
  'Mehrere Möbelstücke in einem Projekt',
  'Einzelne Konzeptblätter je Möbelstück',
  'Auswahl gezielt zur Fertigung anfragen',
]

/**
 * Zentraler Feature-Guard für Pro-Funktionen. Ist der Nutzer nicht Pro, wird
 * KEIN toter Zustand gezeigt, sondern ein hochwertiges Upsell. Die Aktivierung
 * setzt für den MVP das Abo-Flag echt in der DB (Platzhalter für echte Zahlung –
 * die eigentliche Berechtigungsprüfung bleibt danach unverändert).
 */
export function ProGate({ children }: { children: ReactNode }) {
  const { isPro, user, loading, profileLoading, refreshRole } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading || (user && profileLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-400">Lädt …</div>
    )
  }

  if (isPro) return <>{children}</>

  const activate = async () => {
    setBusy(true)
    setError(null)
    try {
      await activateProPreview()
      await refreshRole()
      // Nach dem Refresh ist isPro true → children werden gerendert.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aktivierung fehlgeschlagen.')
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <AmbientScene className="h-[60vh]" />
      <Container className="max-w-xl py-20 sm:py-24">
        <Card className="p-8 text-center sm:p-10">
          <span className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-700">
            <Sparkles size={13} /> Pro
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink-950">
            Raum gestalten mit IdeaForge Pro
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-ink-500">
            Lade ein Foto deines Raums hoch und lass daraus einen vollständig eingerichteten
            Raum mit individuell gefertigten Möbeln entwickeln.
          </p>

          <ul className="mx-auto mt-7 flex max-w-sm flex-col gap-3 text-left">
            {PRO_BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-ink-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-600 text-white">
                  <Check size={12} />
                </span>
                {b}
              </li>
            ))}
          </ul>

          {error && (
            <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <div className="mt-8 flex flex-col items-center gap-3">
            <Button size="lg" onClick={activate} disabled={busy} className="w-full sm:w-auto">
              {busy ? 'Wird aktiviert …' : 'Pro aktivieren (Vorschau)'}
            </Button>
            <p className="text-xs text-ink-400">
              Vorschau für den MVP – noch keine Zahlung. Die echte Abo-Abwicklung folgt später.
            </p>
            <Link to="/dashboard" className="text-sm font-medium text-ink-500 hover:text-ink-900">
              Zurück zum Dashboard
            </Link>
          </div>
        </Card>
      </Container>
    </div>
  )
}
