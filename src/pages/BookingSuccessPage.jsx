import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Calendar,
  MapPin,
  CarFront,
  ArrowRight,
  Receipt,
  RotateCcw,
  LayoutDashboard,
  ShieldCheck,
  Mail,
  Download,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassButton } from '../components/ui/GlassButton'
import { VehicleImage } from '../components/vehicles/VehicleImage'
import { fetchBookingById, fetchBookingByReference, fetchNotificationStatus, downloadInvoicePdf } from '../services/bookingService'
import { formatCurrency, formatDate } from '../utils/formatters'
import { fadeUp } from '../animations/variants'

export default function BookingSuccessPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [booking, setBooking] = useState(location.state?.booking || null)
  const [isLoading, setIsLoading] = useState(!booking)
  const [error, setError] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [emailStatus, setEmailStatus] = useState({
    status: 'SENDING',
    message: 'Generating tax invoice and sending confirmation email...',
  })

  useEffect(() => {
    let isCancelled = false

    async function loadBooking() {
      if (booking) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError('')
        let data = null
        if (id?.startsWith('BK-') || id?.startsWith('VYR-')) {
          data = await fetchBookingByReference(id)
        } else if (!isNaN(Number(id))) {
          data = await fetchBookingById(id)
        } else {
          data = await fetchBookingByReference(id)
        }

        if (!isCancelled) {
          if (data) {
            setBooking(data)
          } else {
            setError('We could not locate this booking reservation.')
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load booking details.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadBooking()

    return () => {
      isCancelled = true
    }
  }, [id])

  // Poll / check Email delivery status asynchronously
  useEffect(() => {
    if (!booking) return
    const bookingRef = booking.bookingReference || booking.id
    if (!bookingRef) return

    let isCancelled = false
    let attempts = 0

    async function checkEmail() {
      try {
        const notifData = await fetchNotificationStatus(bookingRef)
        if (!isCancelled && notifData) {
          if (notifData.status === 'SENT') {
            setEmailStatus({
              status: 'SENT',
              message: `Confirmation email with PDF invoice sent to ${notifData.recipientEmail || booking.customerEmail || 'your registered email'}`,
            })
            return true
          } else if (notifData.status === 'FAILED') {
            setEmailStatus({
              status: 'FAILED',
              message: 'Email delivery pending retry. You can still download your invoice below.',
            })
            return true
          }
        }
      } catch {
        // notification status pending or in progress
      }
      return false
    }

    // Initial check
    checkEmail()

    const interval = setInterval(async () => {
      attempts += 1
      const done = await checkEmail()
      if (done || attempts >= 6) {
        clearInterval(interval)
      }
    }, 2000)

    return () => {
      isCancelled = true
      clearInterval(interval)
    }
  }, [booking])

  const handleDownloadInvoice = async () => {
    if (!booking) return
    const bookingRef = booking.bookingReference || booking.id
    try {
      setIsDownloading(true)
      await downloadInvoicePdf(bookingRef)
    } catch (err) {
      console.error('Invoice download failed:', err)
      alert('Unable to download invoice right now. Please try again or contact support.')
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="route-loading" aria-label="Loading reservation confirmation...">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <section className="booking-success-page">
        <GlassCard className="booking-missing-card">
          <AlertTriangle size={36} className="text-warning" />
          <h2>Reservation Not Found</h2>
          <p>{error || 'The requested booking reservation could not be found or has expired.'}</p>
          <div className="step-actions">
            <GlassButton as={Link} to="/bookings">
              View My Bookings
            </GlassButton>
            <GlassButton as={Link} to="/vehicles" variant="secondary">
              Browse Fleet
            </GlassButton>
          </div>
        </GlassCard>
      </section>
    )
  }

  const pickupDateFormatted = formatDate(booking.pickupDate || booking.pickupDateTime)
  const returnDateFormatted = formatDate(booking.returnDate || booking.returnDateTime)
  const pickupTime = booking.pickupTime || (booking.pickupDateTime?.includes('T') ? booking.pickupDateTime.slice(11, 16) : '10:00 AM')
  const returnTime = booking.returnTime || (booking.returnDateTime?.includes('T') ? booking.returnDateTime.slice(11, 16) : '10:00 AM')

  return (
    <section className="booking-success-page">
      <motion.div
        className="booking-success-container"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
      >
        <GlassCard className="booking-success-card">
          {/* Success Badge & Header */}
          <div className="success-badge-wrap">
            <div className="success-icon-circle">
              <CheckCircle2 size={36} className="success-check-icon" aria-hidden="true" />
            </div>
            <span className="success-pill">BOOKING SUCCESSFUL</span>
          </div>

          <div className="success-headings">
            <h2>Your reservation has been confirmed.</h2>
            <p className="success-lead">
              Thank you for choosing VAYRO. Your vehicle is reserved and your booking invoice is ready.
            </p>
          </div>

          {/* Core Summary Card */}
          <div className="success-summary-panel">
            {/* Vehicle Header Row */}
            <div className="success-vehicle-row">
              {booking.vehicle && (
                <VehicleImage vehicle={booking.vehicle} className="success-vehicle-thumb" />
              )}
              <div className="success-vehicle-info">
                <p className="eyebrow">Reserved Vehicle</p>
                <h3 className="success-vehicle-name">{booking.vehicleName || booking.vehicle?.name || 'Vehicle'}</h3>
                <div className="success-vehicle-meta">
                  {booking.vehicle?.year && <span>{booking.vehicle.year}</span>}
                  {booking.vehicle?.type && <span>· {booking.vehicle.type}</span>}
                  {booking.vehicle?.transmission && <span>· {booking.vehicle.transmission}</span>}
                  {booking.vehicle?.fuelType && <span>· {booking.vehicle.fuelType}</span>}
                </div>
              </div>
              <div className="success-ref-box">
                <span className="ref-label">Booking Reference</span>
                <strong className="ref-code">{booking.bookingReference || booking.id}</strong>
              </div>
            </div>

            {/* Spec / Info Grid */}
            <div className="success-grid">
              <div className="success-grid-cell">
                <span className="cell-label">
                  <Calendar size={13} aria-hidden="true" /> Pickup
                </span>
                <strong className="cell-value">{pickupDateFormatted} · {pickupTime}</strong>
                <small className="cell-sub">{booking.pickupLocation || 'VAYRO Hub'}</small>
              </div>

              <div className="success-grid-cell">
                <span className="cell-label">
                  <Clock size={13} aria-hidden="true" /> Return
                </span>
                <strong className="cell-value">{returnDateFormatted} · {returnTime}</strong>
                <small className="cell-sub">{booking.returnLocation || booking.pickupLocation || 'VAYRO Hub'}</small>
              </div>

              <div className="success-grid-cell">
                <span className="cell-label">Amount Paid</span>
                <strong className="cell-value text-accent">
                  {formatCurrency(booking.totalAmount || 0)}
                </strong>
                <small className="cell-sub">
                  Payment: <span className="status-badge is-paid">{booking.paymentStatus === 'PENDING' ? 'PAY AT PICKUP' : 'PAID (SIMULATED)'}</span>
                </small>
              </div>

              <div className="success-grid-cell">
                <span className="cell-label">Reservation Status</span>
                <strong className="cell-value">
                  <span className="status-badge is-confirmed">
                    {booking.status || 'CONFIRMED'}
                  </span>
                </strong>
                <small className="cell-sub">
                  Ref: {booking.paymentReference || `PAY-${booking.bookingReference}`}
                </small>
              </div>
            </div>

            {/* Confirmation Email Status Banner */}
            <div className="success-email-banner">
              <div className="email-banner-left">
                <Mail size={20} className="email-icon" aria-hidden="true" />
                <div>
                  <strong>Email Confirmation &amp; Invoice</strong>
                  <p>
                    {emailStatus.status === 'SENT' && (
                      <span className="text-success">✓ {emailStatus.message}</span>
                    )}
                    {emailStatus.status === 'SENDING' && (
                      <span className="text-muted">○ {emailStatus.message}</span>
                    )}
                    {emailStatus.status === 'FAILED' && (
                      <span className="text-warning">! {emailStatus.message}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="email-banner-right">
                <GlassButton
                  variant="secondary"
                  size="small"
                  onClick={handleDownloadInvoice}
                  disabled={isDownloading}
                >
                  <Download size={14} aria-hidden="true" />
                  {isDownloading ? 'Downloading...' : 'Download Invoice (PDF)'}
                </GlassButton>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="success-actions-row">
            <GlassButton
              variant="primary"
              className="success-btn-primary"
              onClick={() => navigate(`/bookings/${booking.rawId || booking.id}`)}
            >
              <Receipt size={16} aria-hidden="true" />
              View Booking
            </GlassButton>

            <GlassButton
              variant="secondary"
              className="success-btn-secondary"
              onClick={() => navigate('/bookings')}
            >
              <RotateCcw size={16} aria-hidden="true" />
              My Bookings
            </GlassButton>

            <GlassButton
              variant="ghost"
              className="success-btn-ghost"
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard size={16} aria-hidden="true" />
              Back to Dashboard
            </GlassButton>
          </div>
        </GlassCard>
      </motion.div>
    </section>
  )
}
