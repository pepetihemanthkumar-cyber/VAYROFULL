import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { pageTransition } from '../../animations/variants'
import { LiquidBackground } from './LiquidBackground'
import { MobileNavigation } from './MobileNavigation'
import { Sidebar } from './Sidebar'
import { TopNavigation } from './TopNavigation'
import { Footer } from './Footer'

export function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="application-shell">
      <LiquidBackground />
      <Sidebar />
      <div className="application-content">
        <MobileNavigation
          isOpen={isMobileMenuOpen}
          onToggle={() => setIsMobileMenuOpen((open) => !open)}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <TopNavigation />
        <main className="application-main">
          <motion.div
            key={location.pathname + location.search}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="page-transition-wrapper"
          >
            <Outlet />
          </motion.div>
        </main>
        <Footer />
      </div>
    </div>
  )
}
