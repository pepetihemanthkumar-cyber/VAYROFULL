import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  LoaderCircle,
  ArrowLeft,
  ChevronRight,
  Info,
} from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { GlassButton } from '../ui/GlassButton'
import { GlassInput } from '../ui/GlassInput'
import { VehicleImage } from '../vehicles/VehicleImage'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { fadeUp } from '../../animations/variants'

const PAYMENT_METHODS = [
  {
    id: 'upi',
    label: 'Instant UPI',
    icon: QrCode,
    badge: 'Popular',
    description: 'Google Pay, PhonePe, Paytm, BHIM UPI',
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    icon: CreditCard,
    badge: 'Secure',
    description: 'Visa, Mastercard, RuPay, Amex',
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    icon: Building2,
    badge: null,
    description: 'All major Indian retail banks',
  },
  {
    id: 'pay_at_pickup',
    label: 'Pay at Pickup',
    icon: Banknote,
    badge: 'Flexible',
    description: 'Pay by cash or card upon collecting the vehicle',
  },
]

const POPULAR_BANKS = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra']

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
  const [selectedMethod, setSelectedMethod] = useState('upi')
  const [upiId, setUpiId] = useState('driver@okhdfcbank')
  const [cardForm, setCardForm] = useState({
    number: '4532 •••• •••• 8842',
    name: driverDetails?.fullName || 'Aarav Mehta',
    expiry: '09/29',
    cvv: '•••',
  })
  const [selectedBank, setSelectedBank] = useState('HDFC Bank')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingState, setProcessingState] = useState('') // 'verifying' | 'charging' | 'complete'

  const durationLabel = pricing?.duration?.label || 'Trip duration'
  const couponDiscountAmount = appliedCoupon?.discount ?? appliedCoupon?.discountAmount ?? 0
  const finalPayable = Math.max(0, (pricing.totalAmount || 0) - couponDiscountAmount)

  async function handleExecutePayment(e) {
    if (e) e.preventDefault()
    setIsProcessing(true)
    setProcessingState('Verifying payment details...')

    await new Promise((r) => setTimeout(r, 650))
    setProcessingState(selectedMethod === 'pay_at_pickup' ? 'Securing reservation...' : 'Authorizing transaction...')

    await new Promise((r) => setTimeout(r, 700))
    setProcessingState('Payment authorized successfully!')

    await new Promise((r) => setTimeout(r, 450))

    const randomSuffix = Math.floor(100000 + Math.random() * 900000)
    const paymentReference = `PAY-2026-${randomSuffix}`

    onCompletePayment({
      paymentMethod: selectedMethod === 'pay_at_pickup' ? 'PAY_AT_PICKUP' : selectedMethod.toUpperCase(),
      paymentStatus: selectedMethod === 'pay_at_pickup' ? 'PENDING_AT_PICKUP' : 'PAID',
      paymentReference,
      paymentTimestamp: new Date().toISOString(),
      paidAmount: finalPayable,
    })
  }

  return (
    <div className="payment-step-layout">
      {/* Left Column: Payment Method Selection */}
      <div className="payment-main-column">
        <GlassCard className="payment-methods-card">
          <div className="payment-section-header">
            <div>
              <p className="eyebrow">Simulated Checkout</p>
              <h3>Select payment method</h3>
            </div>
            <span className="payment-demo-badge">
              <Lock size={12} aria-hidden="true" /> Demo Sandbox
            </span>
          </div>

          <div className="payment-methods-list" role="radiogroup" aria-label="Select payment method">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon
              const isSelected = selectedMethod === method.id
              return (
                <div
                  key={method.id}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  className={`payment-method-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedMethod(method.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      setSelectedMethod(method.id)
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
                      <strong>{method.label}</strong>
                      {method.badge && <span className="method-badge">{method.badge}</span>}
                    </div>
                    <small>{method.description}</small>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Method-Specific Inputs */}
          <div className="payment-method-details-pane">
            {selectedMethod === 'upi' && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="payment-pane-form">
                <GlassInput
                  label="Virtual Payment Address (VPA / UPI ID)"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@bank"
                  hint="Demo UPI: enter any mock VPA or keep default"
                />
                <div className="upi-fast-tags">
                  <span>Popular apps:</span>
                  <button type="button" className="upi-app-pill" onClick={() => setUpiId('aarav@okhdfcbank')}>GPay</button>
                  <button type="button" className="upi-app-pill" onClick={() => setUpiId('aarav@ybl')}>PhonePe</button>
                  <button type="button" className="upi-app-pill" onClick={() => setUpiId('aarav@paytm')}>Paytm</button>
                </div>
              </motion.div>
            )}

            {selectedMethod === 'card' && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="payment-pane-form">
                <GlassInput
                  label="Card Number"
                  value={cardForm.number}
                  onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                  placeholder="4532 0000 0000 8842"
                />
                <div className="card-two-col">
                  <GlassInput
                    label="Expiry Date"
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                    placeholder="MM/YY"
                  />
                  <GlassInput
                    label="CVV / Security Code"
                    value={cardForm.cvv}
                    onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                    placeholder="123"
                  />
                </div>
                <GlassInput
                  label="Cardholder Name"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  placeholder="Full Name"
                />
              </motion.div>
            )}

            {selectedMethod === 'netbanking' && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="payment-pane-form">
                <label className="glass-select-group">
                  <span>Select Retail Bank</span>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="glass-select"
                  >
                    {POPULAR_BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </label>
              </motion.div>
            )}

            {selectedMethod === 'pay_at_pickup' && (
              <motion.div initial="hidden" animate="visible" variants={fadeUp} className="payment-pane-form">
                <div className="pay-at-pickup-callout">
                  <Banknote size={24} className="pickup-cash-icon" aria-hidden="true" />
                  <div>
                    <strong>No immediate charge today</strong>
                    <p>Pay <strong>{formatCurrency(finalPayable)}</strong> at the VAYRO counter when inspecting and picking up your vehicle.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="payment-security-footer">
            <ShieldCheck size={16} className="security-icon" aria-hidden="true" />
            <span>256-bit encrypted simulated environment. No actual payment card will be charged.</span>
          </div>
        </GlassCard>

        <div className="step-actions step-actions--between">
          <GlassButton variant="secondary" onClick={onBack} disabled={isProcessing}>
            <ArrowLeft size={16} aria-hidden="true" /> Back to review
          </GlassButton>
          <GlassButton
            onClick={handleExecutePayment}
            loading={isProcessing}
            className="confirm-booking-btn"
          >
            {selectedMethod === 'pay_at_pickup'
              ? `Confirm reservation · Pay at pickup`
              : `Pay ${formatCurrency(finalPayable)} · Complete`}
          </GlassButton>
        </div>

        {/* Processing Modal Overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              className="payment-processing-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GlassCard className="payment-processing-modal">
                <LoaderCircle size={44} className="animate-spin text-accent" aria-hidden="true" />
                <h4>Processing transaction</h4>
                <p>{processingState}</p>
                <span className="processing-note">Do not refresh or close this browser tab</span>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Column: Reservation & Cost Breakdown */}
      <div className="payment-sidebar-column">
        <GlassCard className="payment-summary-card">
          <p className="eyebrow">Order Summary</p>
          <h3>Reservation details</h3>

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
                <small>{locations?.returnLocation || 'VAYRO Depot'}</small>
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
                <small>{selectedMethod === 'pay_at_pickup' ? 'Payable at depot' : 'Simulated immediate checkout'}</small>
              </div>
              <strong className="payment-final-amount">{formatCurrency(finalPayable)}</strong>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
