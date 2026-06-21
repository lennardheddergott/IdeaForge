import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail, Sparkles, User } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { useAuth } from '@/context/AuthContext'

type Mode = 'signin' | 'signup'

export function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [mode, setMode] = useState<Mode>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { error, needsConfirmation } = await signUp(
          email,
          password,
          fullName,
        )
        if (error) return setError(translate(error))
        if (needsConfirmation) {
          setNotice(
            'Fast geschafft! Bitte bestätige deine Registrierung über den Link in deiner E-Mail.',
          )
          return
        }
        navigate(from, { replace: true })
      } else {
        const { error } = await signIn(email, password)
        if (error) return setError(translate(error))
        navigate(from, { replace: true })
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-cream to-white" />
      <Container className="max-w-md py-20">
        <Reveal>
          <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-lift">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-700 shadow-soft">
              <Sparkles size={14} className="text-accent-600" />
              {mode === 'signin' ? 'Willkommen zurück' : 'Konto erstellen'}
            </span>
            <h1 className="mt-5 text-3xl font-semibold text-ink-950">
              {mode === 'signin' ? 'Anmelden' : 'Registrieren'}
            </h1>
            <p className="mt-2 text-ink-500">
              {mode === 'signin'
                ? 'Melde dich an, um deine Ideen zu speichern und zu verwalten.'
                : 'Erstelle ein Konto, um deine Ideen dauerhaft zu sichern.'}
            </p>

            <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
              {mode === 'signup' && (
                <InputField
                  icon={User}
                  type="text"
                  placeholder="Name"
                  value={fullName}
                  onChange={setFullName}
                  autoComplete="name"
                />
              )}
              <InputField
                icon={Mail}
                type="email"
                placeholder="E-Mail-Adresse"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                required
              />
              <InputField
                icon={Lock}
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={setPassword}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
              />

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              {notice && (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {notice}
                </p>
              )}

              <Button type="submit" size="lg" className="mt-2 w-full" disabled={busy}>
                {busy
                  ? 'Bitte warten …'
                  : mode === 'signin'
                    ? 'Anmelden'
                    : 'Konto erstellen'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-500">
              {mode === 'signin' ? 'Noch kein Konto?' : 'Bereits registriert?'}{' '}
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin')
                  setError(null)
                  setNotice(null)
                }}
                className="font-medium text-accent-600 hover:text-accent-700"
              >
                {mode === 'signin' ? 'Jetzt registrieren' : 'Anmelden'}
              </button>
            </p>
          </div>
          <p className="mt-6 text-center text-sm text-ink-400">
            <Link to="/" className="hover:text-ink-700">
              ← Zurück zur Startseite
            </Link>
          </p>
        </Reveal>
      </Container>
    </div>
  )
}

/** Übersetzt häufige Supabase-Fehlermeldungen ins Deutsche. */
function translate(message: string): string {
  if (/invalid login credentials/i.test(message))
    return 'E-Mail oder Passwort ist falsch.'
  if (/user already registered/i.test(message))
    return 'Für diese E-Mail existiert bereits ein Konto.'
  if (/password should be at least/i.test(message))
    return 'Das Passwort muss mindestens 6 Zeichen lang sein.'
  return message
}

function InputField({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  required?: boolean
  minLength?: number
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white px-4 shadow-soft transition-all focus-within:border-accent-400 focus-within:ring-4 focus-within:ring-accent-100">
      <Icon size={16} className="text-ink-400" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="h-12 flex-1 bg-transparent text-ink-900 outline-none placeholder:text-ink-300"
      />
    </label>
  )
}
