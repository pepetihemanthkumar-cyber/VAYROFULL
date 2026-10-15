import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Banknote,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  LoaderCircle,
  ArrowLeft,
  Info,
  AlertTriangle,
  Building2,
  Clock3,
} from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { GlassButton } from '../ui/GlassButton'
import { VehicleImage } from '../vehicles/VehicleImage'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { fadeUp } from '../../animations/variants'

const PAYMENT_OPTIONS = [
  {
    id: 'pay_at_pickup',
    label: 'Pay at Pickup',
    icon: Banknote,
    badge: 'Recommended',
    description: 'Settle by card, UPI, or cash at the VAYRO hub upon vehicle inspection and handover',
  },
  {
    id: 'simulated_checkout',
    label: 'Simulated Demo Confirmation',
    icon: Sparkles,
    badge: 'Instant Sandbox',
    description: 'Immediate confirmation for demonstration and evaluation. No real payment gateway or funds transferred',
  },
]

export function PaymentStep({
  vehicle,
  dates,
  locations,
  pricing,
  appliedCoupon,
  driverDetails,
  onCompletePayment,
  onBack,
}) {
  const [selectedMethod, setSelectedMethod] = useState('pay_at_pickup')
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState(null)

  const durationLabel = pricing?.duration?.label || 'Trip duration'
  const couponDiscountAmount = appliedCoupon?.discount ?? appliedCoupon?.discountAmount ?? 0
  const finalPayable = Math.max(0, (pricing.totalAmount || 0) - couponDiscountAmount)

  async function handleExecutePayment(e) {
    if (e) e.preventDefault()
    if (isProcessing) return
    setIsProcessing(true)
    setPaymentError(null)

    try {
      const uniqueSuffix = `${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`
      const paymentOrderId = `ORD-${uniqueSuffix}`
      const paymentReference = `PAY-${uniqueSuffix}`

      await onCompletePayment({
        paymentMethod: selectedMethod === 'pay_at_pickup' ? 'PAY_AT_PICKUP' : 'SIMULATED',
        paymentStatus: 'PENDING',
        paymentOrderId,
        paymentReference,
        paymentTimestamp: new Date().toISOString(),
        paidAmount: finalPayable,
      })
    } catch (err) {
      setIsProcessing(false)
      const field = err.field || err.response?.data?.field
      const isAuthError = err.status === 401 || err.isAuthError || (err.message && err.message.toLowerCase().includes('authentication'))
      let title = 'BOOKING COULD NOT BE COMPLETED'
      if (isAuthError) {
        title = 'AUTHENTICATION REQUIRED'
      } else if (err.status === 409 || err.message?.toLowerCase().includes('already booked')) {
        title = 'VEHICLE UNAVAILABLE FOR SELECTED DATES'
      } else if (err.status === 400) {
        title = 'INVALID RESERVATION PARAMETERS'
      }
      setPaymentError({
        type: 'FAILED',
        title,
        field,
        isAuthError,
        message: isAuthError
          ? 'Your login session is missing or expired. Please sign in to finalize your booking.'
          : (err.message || 'We could not complete your booking reservation. Please try again.'),
      })
    }
  }

  return (
    <div className="payment-step-layout">
      {/* Left Column: Settlement Mode Selection */}
      <div className="payment-main-column">
        <GlassCard className="payment-methods-card">
          <div className="payment-section-header">
            <div>
              <p className="eyebrow">Settlement & Confirmation</p>
              <h3>Choose confirmation mode</h3>
            </div>
            <span className="payment-demo-badge">
              <ShieldCheck size={13} aria-hidden="true" /> No Payment Gateway Required
            </span>
          </div>

          <div className="payment-methods-list" role="radiogroup" aria-label="Select settlement option">
            {PAYMENT_OPTIONS.map((option) => {
              const Icon = option.icon
              const isSelected = selectedMethod === option.id
              return (
                <div
                  key={option.id}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  className={`payment-method-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedMethod(option.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      setSelectedMethod(option.id)
                    }
                  }}
                >
                  <div className="payment-method-radio">
                    <span className={`method-radio-circle ${isSelected ? 'is-checked' : ''}`} />
                  </div>
                  <div className="payment-method-icon-wrap">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <div className="payment-method-copy">
                    <div className="method-title-row">
                      <strong>{option.label}</strong>
                      {option.badge && <span className="method-badge">{option.badge}</span>}
                    </div>
                    <small>{option.description}</small>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mode-Specific Explanations — Zero Card/UPI Credential Inputs */}
          <div className="payment-method-details-pane">
            {selectedMethod === 'pay_at_pickup' && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="payment-pane-form">
                <div className="pay-at-pickup-callout">
                  <Banknote size={26} className="pickup-cash-icon" aria-hidden="true" />
                  <div>
                    <strong>No upfront online payment required</strong>
                    <p>
                      Your vehicle will be reserved immediately. Pay <strong>{formatCurrency(finalPayable)}</strong> in person via card, UPI, or cash when you arrive at <strong>{locations?.pickupLocation || 'VAYRO Hub'}</strong> for vehicle inspection.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {selectedMethod === 'simulated_checkout' && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="payment-pane-form">
                <div className="pay-at-pickup-callout">
                  <Sparkles size={26} className="pickup-cash-icon text-accent" aria-hidden="true" />
                  <div>
                    <strong>Demonstration & Sandbox Confirmation</strong>
                    <p>
                      Instantly registers your reservation for <strong>{formatCurrency(finalPayable)}</strong> directly in the VAYRO database. Generates an authentic tax invoice and email notification without connecting to an external payment processor.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="payment-security-footer">
            <Info size={15} className="security-icon text-muted" aria-hidden="true" />
            <span>VAYRO operates in demonstration mode. No real credit cards, bank accounts, or digital wallets are charged.</span>
          </div>
        </GlassCard>

        {/* Action Buttons */}
        <div className="step-actions step-actions--between">
          <GlassButton variant="secondary" onClick={onBack} disabled={isProcessing}>
            <ArrowLeft size={16} aria-hidden="true" /> Back to review
          </GlassButton>
          <GlassButton
            onClick={handleExecutePayment}
            loading={isProcessing}
            disabled={isProcessing}
            className="confirm-booking-btn"
          >
            {isProcessing ? (
              'Securing reservation...'
            ) : selectedMethod === 'pay_at_pickup' ? (
              `Confirm Booking — Pay at Pickup`
            ) : (
              `Confirm Booking — ${formatCurrency(finalPayable)}`
            )}
          </GlassButton>
        </div>

        {/* Payment / Booking Error Overlay */}
        <AnimatePresence>
          {paymentError && (
            <motion.div
              className="payment-processing-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GlassCard className="payment-processing-modal payment-error-modal">
                <AlertTriangle size={44} className="text-warning mb-2" aria-hidden="true" />
                <h4>{paymentError.title || 'BOOKING FAILED'}</h4>
                <p>{paymentError.message}</p>
                <div className="step-actions mt-4">
                  {paymentError.isAuthError ? (
                    <>
                      <GlassButton
                        variant="primary"
                        onClick={() => {
                          window.location.href = `/login?from=${encodeURIComponent(window.location.pathname + window.location.search)}`
                        }}
                      >
                        Sign In to Complete Booking
                      </GlassButton>
                      <GlassButton variant="secondary" onClick={() => setPaymentError(null)}>
                        Dismiss
                      </GlassButton>
                    </>
                  ) : (
                    <>
                      <GlassButton variant="primary" onClick={() => setPaymentError(null)}>
                        Try Again
                      </GlassButton>
                      <GlassButton variant="secondary" onClick={onBack}>
                        Back to Booking
                      </GlassButton>
                    </>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Column: Reservation & Cost Breakdown */}
      <div className="payment-sidebar-column">
        <GlassCard className="payment-summary-card">
          <p className="eyebrow">Reservation Summary</p>
          <h3>Order details</h3>

          <div className="payment-vehicle-row">
            <VehicleImage vehicle={vehicle} className="payment-vehicle-thumb" />
            <div>
              <h4>{vehicle.name}</h4>
              <p>{vehicle.year} · {vehicle.type} · {vehicle.transmission}</p>
              <span className="review-registration">{vehicle.registrationNumber}</span>
            </div>
          </div>

          <div className="payment-itinerary-box">
            <div className="itinerary-row">
              <span className="itinerary-label">Pick-up:</span>
              <div>
                <strong>{formatDate(dates.pickupDate)} · {dates.pickupTime}</strong>
                <small>{locations?.pickupLocation || 'VAYRO Depot'}</small>
              </div>
            </div>
            <div className="itinerary-row">
              <span className="itinerary-label">Return:</span>
              <div>
                <strong>{formatDate(dates.returnDate)} · {dates.returnTime}</strong>
                <small>{locations?.returnLocation || locations?.pickupLocation || 'VAYRO Depot'}</small>
              </div>
            </div>
            <div className="itinerary-row">
              <span className="itinerary-label">Duration:</span>
              <strong>{durationLabel}</strong>
            </div>
          </div>

          <div className="payment-cost-breakdown">
            <div className="review-cost-row">
              <span>Vehicle base rate</span>
              <strong>{formatCurrency(pricing.baseRate || pricing.vehicleTotal)}</strong>
            </div>

            {pricing.discount > 0 && (
              <div className="review-cost-row review-discount-row">
                <span>Duration savings</span>
                <strong>−{formatCurrency(pricing.discount)}</strong>
              </div>
            )}

            {pricing.addonsTotal > 0 && (
              <div className="review-cost-row">
                <span>Add-ons ({pricing.addonsList?.length || 0})</span>
                <strong>{formatCurrency(pricing.addonsTotal)}</strong>
              </div>
            )}

            {appliedCoupon && couponDiscountAmount > 0 && (
              <div className="review-cost-row review-discount-row">
                <span>Coupon ({appliedCoupon.code})</span>
                <strong>−{formatCurrency(couponDiscountAmount)}</strong>
              </div>
            )}

            <div className="payment-total-row">
              <div>
                <span>Final amount to pay</span>
                <small>{selectedMethod === 'pay_at_pickup' ? 'Settled at vehicle pickup' : 'Simulated demonstration'}</small>
              </div>
              <strong className="payment-final-amount">{formatCurrency(finalPayable)}</strong>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
