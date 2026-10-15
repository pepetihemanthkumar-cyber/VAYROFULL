import { motion } from 'framer-motion'
import { AlertCircle, FileText, Lock, Shield, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fadeUp } from '../animations/variants'
import { GlassBadge } from '../components/ui/GlassBadge'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'

export default function PrivacyPage() {
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
          <h1>Privacy Policy</h1>
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
              This draft policy outlines VAYRO&apos;s standard data handling architecture, cryptographic
              safeguards, and customer data rights. Formal operational disclosures and jurisdiction-specific
              certifications require sign-off by the platform owner prior to full commercial deployment.
            </p>
          </div>
        </div>

        <GlassCard className="legal-content-card">
          <article className="legal-article">
            <section className="legal-section">
              <div className="section-title-row">
                <FileText size={20} className="section-icon" aria-hidden="true" />
                <h2>1. Overview & Scope</h2>
              </div>
              <p>
                VAYRO (&quot;we&quot;, &quot;our&quot;, or &quot;the Platform&quot;) operates a precision vehicle rental
                reservation platform providing access to passenger cars and motorbikes. This Privacy Policy
                explains how we collect, process, store, and protect your personal information when you create an
                account, browse fleet assets, make reservations, or communicate with our support personnel.
              </p>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <UserCheck size={20} className="section-icon" aria-hidden="true" />
                <h2>2. Information We Collect</h2>
              </div>
              <p>We collect only the information required to authenticate users and fulfill vehicle bookings:</p>
              <ul>
                <li>
                  <strong>Identity and Contact Data:</strong> First name, last name, email address, phone number,
                  and government-issued driving license details required for pickup verification.
                </li>
                <li>
                  <strong>Authentication Credentials:</strong> Passwords stored strictly as salted, one-way
                  BCrypt cryptographic hashes. Plaintext credentials are never saved or accessible.
                </li>
                <li>
                  <strong>Reservation Records:</strong> Selected vehicle, pickup/return dates, booking status,
                  estimated billing totals, and invoice generation history.
                </li>
                <li>
                  <strong>Device and Session Information:</strong> Browser type, timestamps, and stateless JWT
                  session tokens used strictly to authorize authenticated API transactions.
                </li>
              </ul>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <Lock size={20} className="section-icon" aria-hidden="true" />
                <h2>3. How We Use and Protect Your Information</h2>
              </div>
              <p>
                Your personal details are processed exclusively to manage your reservations, prevent double-booking
                of fleet assets, provide booking confirmation notifications, and verify driver eligibility upon vehicle handover.
              </p>
              <p>
                <strong>Security Standards:</strong> All external API communications are enforced over TLS/HTTPS.
                Role-based authorization ensures customers can only inspect their own bookings and profile records,
                while administrative interfaces require verified administrator credentials.
              </p>
              <div className="legal-note-box">
                <Shield size={16} aria-hidden="true" />
                <span>
                  <strong>Owner Review Item:</strong> Confirmation of exact database retention periods for
                  closed booking invoices and customer identity audit logs.
                </span>
              </div>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <Shield size={20} className="section-icon" aria-hidden="true" />
                <h2>4. Third-Party Disclosures & Payments</h2>
              </div>
              <p>
                VAYRO currently operates in <strong>demo / pay-at-pickup mode</strong>. Payment collection occurs
                directly at the fleet depot or pickup hub; no customer credit card numbers or banking secrets are
                collected, stored, or processed by VAYRO&apos;s web servers.
              </p>
              <div className="legal-note-box">
                <Shield size={16} aria-hidden="true" />
                <span>
                  <strong>Owner Review Item:</strong> If online payment gateway providers (e.g. Razorpay, Stripe)
                  are integrated in subsequent releases, this section must be updated with the third-party processor&apos;s
                  PCI-DSS compliance disclosures.
                </span>
              </div>
            </section>

            <section className="legal-section">
              <div className="section-title-row">
                <FileText size={20} className="section-icon" aria-hidden="true" />
                <h2>5. Customer Rights & Inquiries</h2>
              </div>
              <p>
                You may review and update your personal details at any time through the{' '}
                <Link to="/profile">Profile Settings</Link> page. To request account deactivation, report
                unauthorized account usage, or submit data inquiries, contact our team at{' '}
                <a href="mailto:support@vayro.com" className="legal-link">support@vayro.com</a>.
              </p>
            </section>
          </article>

          <div className="legal-footer-nav">
            <GlassButton as={Link} to="/terms" variant="secondary" size="sm">
              Terms of Service
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
