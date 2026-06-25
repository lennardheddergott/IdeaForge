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
import { OrderDetail } from '@/pages/OrderDetail'
import { ManufacturerOnboarding } from '@/pages/ManufacturerOnboarding'
import { ManufacturerDashboard } from '@/pages/ManufacturerDashboard'
import { ManufacturerOrderDetail } from '@/pages/ManufacturerOrderDetail'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Öffentlich */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/manufacturers" element={<Manufacturers />} />

        {/* Nur für eingeloggte Kunden */}
        <Route element={<ProtectedRoute role="customer" />}>
          <Route path="/create" element={<CreateIdea />} />
          <Route path="/result" element={<Result />} />
          <Route path="/result/:id" element={<Result />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Nur für eingeloggte Hersteller */}
        <Route element={<ProtectedRoute role="manufacturer" />}>
          <Route path="/manufacturer/onboarding" element={<ManufacturerOnboarding />} />
          <Route path="/manufacturer" element={<ManufacturerDashboard />} />
          <Route path="/manufacturer/orders/:id" element={<ManufacturerOrderDetail />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
