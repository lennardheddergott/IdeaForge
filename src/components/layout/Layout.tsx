import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { ScrollToTop } from './ScrollToTop'

export function Layout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <ScrollToTop />
      <Navbar />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 pt-16"
      >
        <Outlet />
      </motion.main>
      <Footer />
    </div>
  )
}
