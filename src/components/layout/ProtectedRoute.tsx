import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { homeForRole, type UserRole } from '@/lib/profile'

/**
 * Schützt verschachtelte Routen: nur eingeloggte Nutzer kommen durch.
 * Nicht angemeldete Nutzer werden auf /login umgeleitet (mit Rücksprungziel).
 *
 * Optional kann mit `role` der Bereich auf eine Rolle beschränkt werden.
 * Nutzer mit abweichender Rolle werden auf ihre eigene Startseite geleitet
 * (Kunde ↔ Hersteller bleiben so sauber getrennt).
 */
export function ProtectedRoute({ role }: { role?: UserRole }) {
  const { user, loading, role: userRole, profileLoading } = useAuth()
  const location = useLocation()

  // Warten, bis Session UND (falls eingeloggt) das Profil geladen sind.
  if (loading || (user && profileLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-400">
        Lädt …
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (role && userRole && userRole !== role) {
    return <Navigate to={homeForRole(userRole)} replace />
  }

  return <Outlet />
}
