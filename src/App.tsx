import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { CreateIdea } from '@/pages/CreateIdea'
import { Result } from '@/pages/Result'
import { Manufacturers } from '@/pages/Manufacturers'
import { Dashboard } from '@/pages/Dashboard'
import { Profile } from '@/pages/Profile'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Öffentlich */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/manufacturers" element={<Manufacturers />} />

        {/* Nur für eingeloggte Nutzer */}
        <Route element={<ProtectedRoute />}>
          <Route path="/create" element={<CreateIdea />} />
          <Route path="/result" element={<Result />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
