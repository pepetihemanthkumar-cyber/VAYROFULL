import { motion } from 'framer-motion'
import { AlertCircle, Car, Compass, FileCheck, Fuel, ShieldAlert, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeUp } from '../animations/variants'
import { GlassBadge } from '../components/ui/GlassBadge'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'

export default function RentalConditionsPage() {
  return (
    <section className="legal-page">
      <motion.div
        className="legal-hero-wrap"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <div className="legal-hero-header">
          <GlassBadge status="info">Legal & Governance</GlassBadge>
          <h1>Rental Conditions</h1>
          <p className="legal-effective-date">
            Version 1.0 · Last Updated: October 2026
          </p>
        </div>

        {/* Legal Disclaimer Alert */}
        <div className="legal-review-banner" role="alert">
          <AlertCircle size={20} className="review-banner-icon" aria-hidden="true" />
          <div className="review-banner-content">
            <strong>Draft Conditions — Pending Final Business & Legal Review</strong>
            <p>
              These draft operational conditions govern vehicle handover, security deposits, fuel policies,
              and maintenance protocols. Detailed insurance excess amounts and regional geographic boundaries
              must be validated by the fleet operator before formal deployment.
            </p>
          </div>
        </div>

        <GlassCard className="legal-content-card">
          <article className="legal-article">
            <section className="legal-section">
              <div className="section-title-row">
                <FileCheck size={20} className="section-icon" aria-hidden="true" />
                <h2>1. Dual-Party Vehicle Inspection at Handover</h2>
              </div>
              <p>
                Every vehicle collection requires a comprehensive dual-party walkaround inspection conducted by the
                renter and a VAYRO fleet specialist. Existing odometer readings, fuel/charge levels, and exterior
                condition are logged into the booking record prior to key handover.
              </p>
              <p>
                Renters are encouraged to take reference photographs of the asset during this handover procedure.
              </p>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <Fuel size={20} className="section-icon" aria-hidden="true" />
                <h2>2. Fuel and Charging Protocol</h2>
              </div>
              <p>
                <strong>Full-to-Full Policy:</strong> Vehicles are dispatched with a documented fuel level (typically 100%)
                and must be returned with an equivalent fuel level. For electric vehicles, a minimum 80% charge level is required
                upon return.
              </p>
              <div className="legal-note-box">
                <Fuel size={16} aria-hidden="true" />
                <span>
                  <strong>Owner Review Item:</strong> Specify refueling service surcharge rate (e.g. market pump rate plus
                  15% handling fee) when returned under the dispatched level.
                </span>
              </div>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <Compass size={20} className="section-icon" aria-hidden="true" />
                <h2>3. Geographic Boundaries & Tolls</h2>
              </div>
              <p>
                Vehicles may be operated within the state of rental dispatch and adjoining authorized touring regions.
                All toll plaza deductions (via FASTag), parking fees, and traffic violation fines incurred during the rental
                period are the sole responsibility of the renter.
              </p>
              <div className="legal-note-box">
                <Compass size={16} aria-hidden="true" />
                <span>
                  <strong>Owner Review Item:</strong> Define specific interstate permit fee schedules and FASTag recharge
                  deposit policies.
                </span>
              </div>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <Wrench size={20} className="section-icon" aria-hidden="true" />
                <h2>4. Fleet Maintenance & Roadside Assistance</h2>
              </div>
              <p>
                VAYRO vehicles undergo rigorous scheduled maintenance between rentals. If an unexpected warning light,
                tire pressure variance, or mechanical irregularity appears during your journey:
              </p>
              <ul>
                <li>Safely pull over and stop the vehicle immediately.</li>
                <li>Do not attempt unauthorized third-party repairs without express written authorization.</li>
                <li>Contact VAYRO Fleet Support immediately for roadside dispatch or vehicle substitution.</li>
              </ul>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <ShieldAlert size={20} className="section-icon" aria-hidden="true" />
                <h2>5. Security Deposit & Return Protocol</h2>
              </div>
              <p>
                A refundable security hold may be pre-authorized at pickup based on vehicle category (standard sedan,
                executive SUV, or performance motorcycle). The hold is released upon timely return following the
                completion of the post-rental inspection checklist.
              </p>
              <div className="legal-note-box">
                <ShieldAlert size={16} aria-hidden="true" />
                <span>
                  <strong>Owner Review Item:</strong> Define tier-based security deposit amounts (e.g. ₹5,000 for standard,
                  ₹15,000 for luxury, ₹25,000 for supercars).
                </span>
              </div>
            </section>
          </article>

          <div className="legal-footer-nav">
            <GlassButton as={Link} to="/privacy" variant="secondary" size="sm">
              Privacy Policy
            </GlassButton>
            <GlassButton as={Link} to="/terms" variant="secondary" size="sm">
              Terms of Service
            </GlassButton>
            <GlassButton as={Link} to="/cancellation-policy" variant="secondary" size="sm">
              Cancellation Policy
            </GlassButton>
          </div>
        </GlassCard>
      </motion.div>
    </section>
  )
}
