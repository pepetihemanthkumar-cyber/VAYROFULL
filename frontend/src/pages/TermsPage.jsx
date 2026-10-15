import { motion } from 'framer-motion'
import { AlertCircle, CheckSquare, FileText, Key, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeUp } from '../animations/variants'
import { GlassBadge } from '../components/ui/GlassBadge'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'

export default function TermsPage() {
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
          <h1>Terms of Service</h1>
          <p className="legal-effective-date">
            Version 1.0 · Last Updated: October 2026
          </p>
        </div>

        {/* Legal Disclaimer Alert */}
        <div className="legal-review-banner" role="alert">
          <AlertCircle size={20} className="review-banner-icon" aria-hidden="true" />
          <div className="review-banner-content">
            <strong>Draft Terms — Pending Final Business & Legal Review</strong>
            <p>
              These draft terms define customer rights, operational reservations, and platform liabilities.
              Statutory jurisdiction clauses, enterprise arbitration agreements, and insurance underwriting details
              must be reviewed and confirmed by legal counsel prior to formal execution.
            </p>
          </div>
        </div>

        <GlassCard className="legal-content-card">
          <article className="legal-article">
            <section className="legal-section">
              <div className="section-title-row">
                <FileText size={20} className="section-icon" aria-hidden="true" />
                <h2>1. Acceptance of Agreement</h2>
              </div>
              <p>
                By registering an account, accessing the VAYRO fleet directory, or placing a vehicle reservation,
                you agree to be bound by these Terms of Service and all related operational policies, including our{' '}
                <Link to="/cancellation-policy">Cancellation Policy</Link> and{' '}
                <Link to="/rental-conditions">Rental Conditions</Link>. If you do not agree, do not use the service.
              </p>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <Key size={20} className="section-icon" aria-hidden="true" />
                <h2>2. Eligibility & Driver Requirements</h2>
              </div>
              <p>To reserve and operate any vehicle on the VAYRO platform, renters must satisfy the following criteria:</p>
              <ul>
                <li>Must hold an active, non-suspended motor vehicle driving license valid in India.</li>
                <li>Must present the original physical driving license and government photo ID during vehicle handover.</li>
                <li>Must maintain an authentic profile with accurate contact credentials.</li>
              </ul>
              <div className="legal-note-box">
                <ShieldAlert size={16} aria-hidden="true" />
                <span>
                  <strong>Owner Review Item:</strong> Confirmation of minimum age thresholds (e.g. 21 years for standard
                  sedans, 25 years for high-power luxury supercars and touring bikes).
                </span>
              </div>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <CheckSquare size={20} className="section-icon" aria-hidden="true" />
                <h2>3. Reservation Mechanics & Pay-at-Pickup Mode</h2>
              </div>
              <p>
                VAYRO operates in a transparent <strong>reservation hold</strong> workflow. Placing a booking reserves
                the designated vehicle for your selected schedule, preventing overlapping customer bookings.
              </p>
              <p>
                <strong>Payment Mode:</strong> Payment is collected at the designated pickup hub or fleet desk prior to
                key handover. Bookings are not marked as settled or paid until payment has been physically verified.
              </p>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <ShieldAlert size={20} className="section-icon" aria-hidden="true" />
                <h2>4. Prohibited Uses</h2>
              </div>
              <p>Renters shall not use any vehicle for:</p>
              <ul>
                <li>Commercial ride-hailing, sub-leasing, or unauthorized driver delegation.</li>
                <li>Competitive racing, track days, stunts, or off-road operation beyond vehicle design specifications.</li>
                <li>Operating under the influence of alcohol, drugs, or impairing substances.</li>
                <li>Transporting hazardous, illicit, or flammable contraband.</li>
              </ul>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <FileText size={20} className="section-icon" aria-hidden="true" />
                <h2>5. Limitation of Liability & Termination</h2>
              </div>
              <p>
                VAYRO maintains its fleet to rigorous mechanical standards. In the unlikely event of unexpected mechanical
                maintenance requiring vehicle substitution, VAYRO reserves the right to provide an equivalent or upgraded
                category asset or offer an immediate cancellation with zero penalty.
              </p>
              <p>
                Accounts found violating safety policies, falsifying identities, or tampering with platform security
                will be suspended in accordance with our administrative account governance controls.
              </p>
            </section>
          </article>

          <div className="legal-footer-nav">
            <GlassButton as={Link} to="/privacy" variant="secondary" size="sm">
              Privacy Policy
            </GlassButton>
            <GlassButton as={Link} to="/cancellation-policy" variant="secondary" size="sm">
              Cancellation Policy
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
