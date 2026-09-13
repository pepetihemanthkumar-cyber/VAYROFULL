import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { pageTransition } from '../../animations/variants'
import { LiquidBackground } from './LiquidBackground'
import { MobileNavigation } from './MobileNavigation'
import { Sidebar } from './Sidebar'
import { TopNavigation } from './TopNavigation'

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
          <AnimatePresence mode="wait" initial={true}>
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageTransition}
              className="page-transition-wrapper"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
