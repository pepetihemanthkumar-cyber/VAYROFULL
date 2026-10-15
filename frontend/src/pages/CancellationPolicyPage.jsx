import { motion } from 'framer-motion'
import { AlertCircle, CalendarX2, Clock, DollarSign, HelpCircle, RefreshCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeUp } from '../animations/variants'
import { GlassBadge } from '../components/ui/GlassBadge'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'

export default function CancellationPolicyPage() {
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
          <h1>Cancellation Policy</h1>
          <p className="legal-effective-date">
            Version 1.0 · Last Updated: October 2026
          </p>
        </div>

        {/* Legal Disclaimer Alert */}
        <div className="legal-review-banner" role="alert">
          <AlertCircle size={20} className="review-banner-icon" aria-hidden="true" />
          <div className="review-banner-content">
            <strong>Draft Policy — Pending Final Business & Legal Review</strong>
            <p>
              This draft cancellation and refund schedule reflects VAYRO&apos;s current operational pay-at-pickup
              model. Specific refund turnaround windows and advance fee structures must be reviewed by the owner
              prior to enabling prepaid online payments.
            </p>
          </div>
        </div>

        <GlassCard className="legal-content-card">
          <article className="legal-article">
            <section className="legal-section">
              <div className="section-title-row">
                <CalendarX2 size={20} className="section-icon" aria-hidden="true" />
                <h2>1. Self-Service Online Cancellation</h2>
              </div>
              <p>
                Customers can cancel any pending or confirmed booking directly from the{' '}
                <Link to="/bookings">Bookings</Link> dashboard up to the scheduled pickup time.
              </p>
              <p>
                When a cancellation is submitted, the vehicle asset is immediately unlocked and returned to the
                public fleet pool, allowing other customers to discover and reserve it without delay.
              </p>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <Clock size={20} className="section-icon" aria-hidden="true" />
                <h2>2. Cancellation Windows & Fees</h2>
              </div>
              <p>
                Because VAYRO operates in <strong>demo / pay-at-pickup mode</strong>:
              </p>
              <ul>
                <li>
                  <strong>Prior to Scheduled Pickup:</strong> 100% Free Cancellation. No penalties, cancellation fees,
                  or administrative charges apply.
                </li>
                <li>
                  <strong>Post-Pickup Window:</strong> Once a vehicle has been physically inspected and handed over
                  (status becomes <em>ACTIVE</em>), standard cancellation is no longer available. The rental continues
                  until the vehicle is returned to the depot.
                </li>
              </ul>
              <div className="legal-note-box">
                <AlertCircle size={16} aria-hidden="true" />
                <span>
                  <strong>Owner Review Item:</strong> Define cancellation fee tiers (e.g. within 2 hours of scheduled pickup)
                  if advance security deposits or prepayments are introduced in future releases.
                </span>
              </div>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <RefreshCcw size={20} className="section-icon" aria-hidden="true" />
                <h2>3. Modification of Dates & Assets</h2>
              </div>
              <p>
                To adjust your journey dates or switch to an alternate vehicle, you may cancel your existing booking
                and create a new reservation for your preferred dates. Our real-time calendar availability engine
                prevents double-booking and ensures transparent scheduling.
              </p>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <DollarSign size={20} className="section-icon" aria-hidden="true" />
                <h2>4. Pay-at-Pickup Refund Clarity</h2>
              </div>
              <p>
                Since payments are completed at the time of vehicle collection at the hub, cancelled reservations
                incur zero financial deduction. Invoices generated on the platform will reflect a <em>CANCELLED</em> status
                with zero net liability.
              </p>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <HelpCircle size={20} className="section-icon" aria-hidden="true" />
                <h2>5. Emergency Assistance</h2>
              </div>
              <p>
                For immediate schedule alterations or emergency travel delays, please reach out directly to our
                operations desk at <a href="mailto:support@vayro.com" className="legal-link">support@vayro.com</a> or visit
                the <Link to="/help">Help Center</Link>.
              </p>
            </section>
          </article>

          <div className="legal-footer-nav">
            <GlassButton as={Link} to="/privacy" variant="secondary" size="sm">
              Privacy Policy
            </GlassButton>
            <GlassButton as={Link} to="/terms" variant="secondary" size="sm">
              Terms of Service
            </GlassButton>
            <GlassButton as={Link} to="/rental-conditions" variant="secondary" size="sm">
              Rental Conditions
            </GlassButton>
          </div>
        </GlassCard>
      </motion.div>
    </section>
  )
}
