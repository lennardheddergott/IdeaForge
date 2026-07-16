import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getMyProfile, profileIsPro, type UserRole } from '@/lib/profile'

interface AuthContextValue {
  session: Session | null
  user: User | null
  /** Rolle des eingeloggten Nutzers (null, solange unbekannt / nicht angemeldet). */
  role: UserRole | null
  /** true, wenn der Nutzer eine aktive Pro-Berechtigung hat. */
  isPro: boolean
  /** true, solange die initiale Session noch geladen wird. */
  loading: boolean
  /** true, solange das Profil (inkl. Rolle) zur aktuellen Session geladen wird. */
  profileLoading: boolean
  /** Lädt Rolle + Pro-Status erneut (z. B. nach dem Anlegen/Ändern des Profils). */
  refreshRole: () => Promise<void>
  signUp: (
    email: string,
    password: string,
    fullName: string | undefined,
    role: UserRole,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<UserRole | null>(null)
  const [isPro, setIsPro] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    // Bestehende Session beim Start laden …
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // … und auf Login/Logout/Token-Refresh reagieren.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  // Profil (Rolle) laden, sobald sich der eingeloggte Nutzer ändert.
  useEffect(() => {
    const userId = session?.user?.id ?? null
    let cancelled = false

    const loadProfile = async () => {
      if (!userId) {
        setRole(null)
        setIsPro(false)
        return
      }
      setProfileLoading(true)
      try {
        const profile = await getMyProfile()
        if (!cancelled) {
          setRole(profile?.role ?? null)
          setIsPro(profileIsPro(profile))
        }
      } catch {
        if (!cancelled) {
          setRole(null)
          setIsPro(false)
        }
      } finally {
        if (!cancelled) setProfileLoading(false)
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  const refreshRole = useCallback(async () => {
    if (!session?.user?.id) return
    const profile = await getMyProfile()
    setRole(profile?.role ?? null)
    setIsPro(profileIsPro(profile))
  }, [session?.user?.id])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      role,
      isPro,
      loading,
      profileLoading,
      refreshRole,
      async signUp(email, password, fullName, role) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName ?? '', role } },
        })
        if (error) return { error: error.message, needsConfirmation: false }
        // Kein Session-Objekt → E-Mail-Bestätigung ist im Projekt aktiviert.
        const needsConfirmation = !data.session
        return { error: null, needsConfirmation }
      },
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        return { error: error?.message ?? null }
      },
      async signOut() {
        await supabase.auth.signOut()
      },
    }),
    [session, role, isPro, loading, profileLoading, refreshRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth muss innerhalb von <AuthProvider> verwendet werden.')
  return ctx
}
