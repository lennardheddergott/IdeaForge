import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Landing } from '@/pages/Landing'
import { CreateIdea } from '@/pages/CreateIdea'
import { Result } from '@/pages/Result'
import { Manufacturers } from '@/pages/Manufacturers'
import { Dashboard } from '@/pages/Dashboard'
import { Profile } from '@/pages/Profile'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/create" element={<CreateIdea />} />
        <Route path="/result" element={<Result />} />
        <Route path="/manufacturers" element={<Manufacturers />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App
