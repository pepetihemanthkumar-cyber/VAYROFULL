import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle,
  Search,
  ChevronDown,
  Mail,
  Phone,
  Clock,
  Send,
  ShieldCheck,
  CreditCard,
  CalendarDays,
  RotateCcw,
  CarFront,
  X,
  FileText,
  LifeBuoy,
} from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassInput } from '../components/ui/GlassInput'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { fadeUp, accordionTransition } from '../animations/variants'

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    category: 'Booking & Reservations',
    icon: CalendarDays,
    question: 'How is rental duration calculated?',
    answer: 'Rental duration is calculated precisely from your selected pick-up date/time to return date/time. VAYRO supports hourly rentals (<24h), daily rentals (1–13 days), and long-term rentals (14+ days) with automatic duration savings discounts.',
  },
  {
    id: 'faq-2',
    category: 'Booking & Reservations',
    icon: RotateCcw,
    question: 'Can I change my return time or pick-up location?',
    answer: 'Yes! Before confirming your booking, you can modify pick-up and return dates, times, and depot locations at any step. The system will dynamically re-evaluate vehicle availability and update your price estimate live.',
  },
  {
    id: 'faq-3',
    category: 'Cancellation & Returns',
    icon: ShieldCheck,
    question: 'Can I cancel a confirmed booking?',
    answer: 'Yes, you can cancel any confirmed booking directly from your dashboard or booking details page. The reservation will be released back to the fleet, and a full simulated refund is credited immediately.',
  },
  {
    id: 'faq-4',
    category: 'Payments & Pricing',
    icon: CreditCard,
    question: 'How does payment and pricing work?',
    answer: 'VAYRO provides a simulated checkout experience with instant UPI, Credit/Debit card demo sandbox, Net Banking, and Pay at Pickup options. Each confirmed booking generates a unique verification reference (e.g. PAY-2026-XXXXXX).',
  },
  {
    id: 'faq-5',
    category: 'Depots & Transit',
    icon: CarFront,
    question: 'Can I choose a different return location?',
    answer: 'Yes! You can choose different pick-up and return hubs across all supported VAYRO transit points (Airports, Central Stations, and City Hubs across Vijayawada, Hyderabad, Bengaluru, and Chennai).',
  },
  {
    id: 'faq-6',
    category: 'Invoices & Receipts',
    icon: FileText,
    question: 'Where can I see and download my invoice?',
    answer: 'Every confirmed booking has a dedicated "Download / Print Invoice" button on the booking confirmation screen and on the individual booking details page, with a clean print-ready receipt layout.',
  },
  {
    id: 'faq-7',
    category: 'Vehicle Fleet',
    icon: CarFront,
    question: 'Are all 207 vehicles genuine models?',
    answer: 'Yes. VAYRO maintains an audited 207-model fleet catalogue featuring exact model photography, detailed specs (seats, transmission, fuel, AC), and configurable rental rates.',
  },
]

export default function HelpPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [openIds, setOpenIds] = useState(['faq-1'])

  const [supportForm, setSupportForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bookingId: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return FAQ_ITEMS
    return FAQ_ITEMS.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q),
    )
  }, [searchQuery])

  function toggleFaq(id) {
    setOpenIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  async function handleContactSubmit(e) {
    e.preventDefault()
    const trimmedName = supportForm.name.trim()
    const trimmedEmail = supportForm.email.trim()
    const trimmedMessage = supportForm.message.trim()

    if (!trimmedName) {
      toast.error('Please enter your full name.')
      return
    }

    if (!trimmedEmail) {
      toast.error('Please enter your email address.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Please enter a valid email address.')
      return
    }

    if (!trimmedMessage) {
      toast.error('Please enter your support message.')
      return
    }

    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 500))

    try {
      const tickets = JSON.parse(window.localStorage.getItem('vayro_support_tickets') || '[]')
      tickets.push({
        id: `TICKET-${Date.now()}`,
        name: trimmedName,
        email: trimmedEmail,
        bookingId: supportForm.bookingId.trim(),
        message: trimmedMessage,
        submittedAt: new Date().toISOString(),
      })
      window.localStorage.setItem('vayro_support_tickets', JSON.stringify(tickets))
    } catch {
      // safe fallback
    }

    toast.success('Your support request has been submitted. Our team will contact you shortly.')
    setSupportForm({
      name: user?.name || '',
      email: user?.email || '',
      bookingId: '',
      message: '',
    })
    setIsSubmitting(false)
  }

  return (
    <section className="help-page-container" aria-label="Help and Support Center">
      {/* Hero Banner */}
      <motion.div
        className="help-hero-banner"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <div className="help-hero-badge">
          <LifeBuoy size={14} aria-hidden="true" />
          <span>Help & Support Center</span>
        </div>
        <h1 className="help-hero-title">How can we help you?</h1>
        <p className="help-hero-description">
          Find answers to common questions about bookings, rental duration, payments, vehicles, cancellations, and returns.
        </p>

        <div className="help-search-wrapper">
          <div className="help-search-box">
            <Search size={18} className="help-search-icon" aria-hidden="true" />
            <input
              type="text"
              id="help-faq-search-input"
              className="help-search-input"
              placeholder="Search FAQs (e.g. cancellation, duration, invoice, return)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search frequently asked questions"
            />
            {searchQuery && (
              <button
                type="button"
                className="help-search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search input"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content Responsive Grid */}
      <div className="help-content-grid">
        {/* Left Column: FAQs / Knowledge Base */}
        <motion.div
          className="help-faq-column"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.06}
        >
          <div className="help-column-header">
            <div>
              <p className="eyebrow">Frequently Asked Questions</p>
              <h2 className="help-section-title">
                Top Answers <span className="help-count-badge">{filteredFaqs.length}</span>
              </h2>
            </div>
          </div>

          <div className="faq-accordions-list" role="region" aria-label="FAQ Accordion list">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const isOpen = openIds.includes(faq.id)
                const Icon = faq.icon || HelpCircle
                return (
                  <GlassCard
                    key={faq.id}
                    className={`faq-item-card ${isOpen ? 'is-open' : ''}`}
                  >
                    <button
                      type="button"
                      id={`faq-btn-${faq.id}`}
                      className="faq-question-btn"
                      onClick={() => toggleFaq(faq.id)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${faq.id}`}
                    >
                      <div className="faq-question-title">
                        <div className="faq-icon-pill" aria-hidden="true">
                          <Icon size={16} />
                        </div>
                        <span className="faq-question-text">{faq.question}</span>
                      </div>
                      <div className="faq-btn-right">
                        <span className="faq-category-pill">{faq.category}</span>
                        <ChevronDown
                          size={18}
                          className={`faq-chevron ${isOpen ? 'chevron-rotated' : ''}`}
                          aria-hidden="true"
                        />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`faq-answer-${faq.id}`}
                          className="faq-answer-pane"
                          role="region"
                          aria-labelledby={`faq-btn-${faq.id}`}
                          variants={accordionTransition}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <div className="faq-answer-inner">
                            <p>{faq.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                )
              })
            ) : (
              <GlassCard className="faq-empty-card">
                <div className="faq-empty-icon-wrap" aria-hidden="true">
                  <Search size={24} />
                </div>
                <h3>No matching questions</h3>
                <p>
                  We couldn't find any FAQs matching "{searchQuery}". Try another search term or submit a support request.
                </p>
                <GlassButton
                  size="sm"
                  variant="secondary"
                  onClick={() => setSearchQuery('')}
                  className="faq-empty-clear-btn"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  <span>Reset search</span>
                </GlassButton>
              </GlassCard>
            )}
          </div>
        </motion.div>

        {/* Right Column: Contact Support Card */}
        <motion.div
          className="help-contact-column"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.12}
        >
          <GlassCard className="help-contact-card">
            <div className="help-column-header">
              <div>
                <p className="eyebrow">Get in touch</p>
                <h2 className="help-section-title">Contact Support</h2>
                <p className="help-contact-subtitle">Need help with your reservation?</p>
              </div>
            </div>

            <div className="support-channels-list" aria-label="Support Channels">
              <div className="support-channel-item">
                <div className="support-channel-icon" aria-hidden="true">
                  <Mail size={16} />
                </div>
                <div className="support-channel-text">
                  <small>Email assistance</small>
                  <strong>support@vayro.com</strong>
                </div>
              </div>

              <div className="support-channel-item">
                <div className="support-channel-icon" aria-hidden="true">
                  <Phone size={16} />
                </div>
                <div className="support-channel-text">
                  <small>Phone support</small>
                  <strong>+91 90000 00000</strong>
                </div>
              </div>

              <div className="support-channel-item">
                <div className="support-channel-icon" aria-hidden="true">
                  <Clock size={16} />
                </div>
                <div className="support-channel-text">
                  <small>Support hours</small>
                  <strong>9:00 AM – 9:00 PM (Daily)</strong>
                </div>
              </div>
            </div>

            <div className="support-form-divider" aria-hidden="true" />

            <form onSubmit={handleContactSubmit} className="support-ticket-form" noValidate>
              <div className="support-form-heading">
                <p className="eyebrow">Contact Form</p>
              </div>

              <GlassInput
                label="Full name"
                id="support-full-name"
                required
                value={supportForm.name}
                onChange={(e) => setSupportForm({ ...supportForm, name: e.target.value })}
                placeholder="Aarav Mehta"
              />

              <GlassInput
                label="Email address"
                id="support-email-address"
                type="email"
                required
                value={supportForm.email}
                onChange={(e) => setSupportForm({ ...supportForm, email: e.target.value })}
                placeholder="customer@vayro.com"
              />

              <GlassInput
                label="Booking ID (optional)"
                id="support-booking-id"
                value={supportForm.bookingId}
                onChange={(e) => setSupportForm({ ...supportForm, bookingId: e.target.value })}
                placeholder="BK-2026-XXXX"
              />

              <div className="glass-input-group">
                <label htmlFor="support-message">Message</label>
                <textarea
                  id="support-message"
                  className="glass-textarea"
                  rows={4}
                  required
                  placeholder="How can our operations team help with your reservation?"
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                />
              </div>

              <GlassButton
                type="submit"
                variant="primary"
                loading={isSubmitting}
                className="w-full support-submit-btn"
              >
                <Send size={15} aria-hidden="true" />
                <span>Submit Support Request</span>
              </GlassButton>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  )
}
