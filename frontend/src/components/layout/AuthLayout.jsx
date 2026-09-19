import { motion } from 'framer-motion'
import { Brand } from './Brand'
import { LiquidBackground } from './LiquidBackground'
import { pageTransition } from '../../animations/variants'

export function AuthLayout({ children, title, description, eyebrow }) {
  return (
    <main className="auth-shell">
      <LiquidBackground />
      <motion.div className="auth-content" initial="initial" animate="animate" exit="exit" variants={pageTransition}>
        <div className="auth-left-column">
          <Brand variant="auth" className="auth-brand" size="xl" />
          <section className="auth-introduction">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="description">{description}</p>
            <div className="hero-blue-divider" />
            <p className="hero-tagline">DRIVE &bull; EXPLORE &bull; MOVE FORWARD</p>
          </section>
        </div>
        <div className="auth-right-column">
          {children}
        </div>
      </motion.div>
    </main>
  )
}
