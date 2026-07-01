import { Navigate } from 'react-router-dom'
import { Hero } from '@/components/sections/Hero'
import { LogoCloud } from '@/components/sections/LogoCloud'
import { Features } from '@/components/sections/Features'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { Testimonials } from '@/components/sections/Testimonials'
import { FAQ } from '@/components/sections/FAQ'
import { CTA } from '@/components/sections/CTA'
import { useAuth } from '@/context/AuthContext'

export function Landing() {
  const { role } = useAuth()

  // Eingeloggte Hersteller sehen NICHT die Kunden-Startseite ("Bring deine Idee
  // in die Realität"), sondern werden in ihr Dashboard geleitet.
  if (role === 'manufacturer') {
    return <Navigate to="/manufacturer" replace />
  }

  return (
    <>
      <Hero />
      <LogoCloud />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  )
}
