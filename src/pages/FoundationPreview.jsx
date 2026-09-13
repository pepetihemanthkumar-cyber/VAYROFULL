import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarDays, Mail, Plus, Search, Truck } from 'lucide-react'
import { pageTransition, fadeUp } from '../animations/variants'
import { LiquidBackground } from '../components/layout/LiquidBackground'
import { Brand } from '../components/layout/Brand'
import { GlassBadge } from '../components/ui/GlassBadge'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassInput } from '../components/ui/GlassInput'

const statuses = ['Available', 'Reserved', 'Rented', 'Maintenance', 'Confirmed', 'Active', 'Completed', 'Cancelled']

const fleet = [
  { name: 'Tata Prima 5530.S', type: 'Heavy-duty tractor', status: 'Available' },
  { name: 'Mahindra Blazo X 28', type: 'Cargo truck', status: 'Rented' },
  { name: 'Ashok Leyland BOSS', type: 'Medium-duty truck', status: 'Maintenance' },
]

export default function FoundationPreview() {
  return (
    <main className="app-shell">
      <LiquidBackground />
      <motion.div className="app-content" {...pageTransition}>
        <motion.header className="app-header" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <Brand />
          <span className="phase-label">Frontend foundation</span>
        </motion.header>

        <section className="hero-section">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.06}>
            <p className="eyebrow">Fleet lifecycle management</p>
            <h1>A calmer way to manage every vehicle.</h1>
            <p className="hero-copy">A visual foundation for the VAYRO rental and fleet operations experience.</p>
          </motion.div>
          <motion.div className="hero-actions" initial="hidden" animate="visible" variants={fadeUp} custom={0.14}>
            <GlassButton><Plus size={17} aria-hidden="true" /> Add vehicle</GlassButton>
            <GlassButton variant="secondary">View inventory <ArrowUpRight size={17} aria-hidden="true" /></GlassButton>
          </motion.div>
        </section>

        <section className="preview-grid" aria-label="VAYRO component preview">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.2}>
            <GlassCard className="fleet-card" hover>
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Fleet overview</p>
                  <h2>Vehicles in service</h2>
                </div>
                <GlassButton variant="ghost" size="sm" aria-label="Search vehicles"><Search size={18} /></GlassButton>
              </div>
              <div className="fleet-list">
                {fleet.map((vehicle) => (
                  <article className="fleet-row" key={vehicle.name}>
                    <span className="vehicle-icon"><Truck size={19} /></span>
                    <div><h3>{vehicle.name}</h3><p>{vehicle.type}</p></div>
                    <GlassBadge status={vehicle.status}>{vehicle.status}</GlassBadge>
                  </article>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.27}>
            <GlassCard className="booking-card">
              <div className="card-heading">
                <div><p className="eyebrow">Booking sample</p><h2>Reserve a vehicle</h2></div>
                <CalendarDays className="heading-icon" size={20} aria-hidden="true" />
              </div>
              <form className="preview-form" onSubmit={(event) => event.preventDefault()}>
                <GlassInput label="Contact email" type="email" placeholder="name@company.com" startIcon={Mail} />
                <GlassInput label="Reference code" type="password" placeholder="Enter reference" />
                <GlassButton type="submit" className="form-submit">Continue reservation</GlassButton>
              </form>
            </GlassCard>
          </motion.div>

          <motion.div className="status-card-wrap" initial="hidden" animate="visible" variants={fadeUp} custom={0.34}>
            <GlassCard className="status-card">
              <p className="eyebrow">Status language</p>
              <h2>Clear at a glance</h2>
              <div className="badge-grid">
                {statuses.map((status) => <GlassBadge key={status} status={status}>{status}</GlassBadge>)}
              </div>
            </GlassCard>
          </motion.div>
        </section>
      </motion.div>
    </main>
  )
}
