import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Factory, Lock, Mail, ShoppingBag, User } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { AmbientScene } from '@/components/ui/AmbientScene'
import { Logo } from '@/components/layout/Logo'
import { useAuth } from '@/context/AuthContext'
import { getMyProfile, homeForRole, type UserRole } from '@/lib/profile'
import { cn } from '@/lib/utils'

type Mode = 'signin' | 'signup'

export function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? null

  const [mode, setMode] = useState<Mode>('signin')
  const [role, setRole] = useState<UserRole>('customer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Zielroute nach erfolgreicher Anmeldung – abhängig von der Rolle.
  const goAfterAuth = (userRole: UserRole) => {
    if (userRole === 'manufacturer') {
      // Hersteller landen im Dashboard (das ggf. ins Onboarding weiterleitet).
      navigate('/manufacturer', { replace: true })
    } else {
      navigate(from ?? homeForRole('customer'), { replace: true })
    }
  }

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
          role,
        )
        if (error) return setError(translate(error))
        if (needsConfirmation) {
          setNotice(
            'Fast geschafft! Bitte bestätige deine Registrierung über den Link in deiner E-Mail.',
          )
          return
        }
        goAfterAuth(role)
      } else {
        const { error } = await signIn(email, password)
        if (error) return setError(translate(error))
        // Rolle frisch aus dem Profil lesen, um korrekt zu routen.
        const profile = await getMyProfile()
        goAfterAuth(profile?.role ?? 'customer')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-[85vh]">
      <AmbientScene className="h-[60vh]" />
      <Container className="max-w-md py-24">
        <Reveal>
          <div className="rounded-3xl border border-ink-100 bg-white/90 p-8 shadow-soft backdrop-blur">
            <div className="flex flex-col items-center text-center">
              <Logo />
              <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink-950">
                {mode === 'signin' ? 'Anmelden' : 'Konto erstellen'}
              </h1>
            </div>

            <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
              {mode === 'signup' && (
                <>
                  {/* Rollenauswahl */}
                  <div className="grid grid-cols-2 gap-3">
                    <RoleCard
                      active={role === 'customer'}
                      onClick={() => setRole('customer')}
                      icon={ShoppingBag}
                      title="Ich bin Kunde"
                      hint="Ideen erstellen & anfertigen lassen"
                    />
                    <RoleCard
                      active={role === 'manufacturer'}
                      onClick={() => setRole('manufacturer')}
                      icon={Factory}
                      title="Ich bin Hersteller"
                      hint="Aufträge erhalten & umsetzen"
                    />
                  </div>
                  <InputField
                    icon={User}
                    type="text"
                    placeholder={role === 'manufacturer' ? 'Dein Name' : 'Name'}
                    value={fullName}
                    onChange={setFullName}
                    autoComplete="name"
                  />
                </>
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

function RoleCard({
  active,
  onClick,
  icon: Icon,
  title,
  hint,
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col gap-1.5 rounded-2xl border p-4 text-left transition-all duration-200',
        active
          ? 'border-accent-600 bg-accent-50 ring-1 ring-accent-600'
          : 'border-ink-200 bg-white hover:border-ink-300 hover:shadow-soft',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg',
          active ? 'bg-accent-600 text-white' : 'bg-ink-100 text-ink-600',
        )}
      >
        <Icon size={16} />
      </span>
      <span
        className={cn(
          'text-sm font-semibold',
          active ? 'text-accent-700' : 'text-ink-900',
        )}
      >
        {title}
      </span>
      <span className="text-xs text-ink-400">{hint}</span>
    </button>
  )
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
