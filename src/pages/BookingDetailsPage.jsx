import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  Bike,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Download,
  FileText,
  MapPin,
  Printer,
  RotateCcw,
  ShieldCheck,
  Tag,
  UserRound,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fadeUp } from '../animations/variants'
import { BookingTimeline } from '../components/bookings/BookingTimeline'
import { CancelBookingModal } from '../components/bookings/CancelBookingModal'
import { InvoiceModal } from '../components/bookings/InvoiceModal'
import { ReturnVehicleModal } from '../components/bookings/ReturnVehicleModal'
import { GlassBadge } from '../components/ui/GlassBadge'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassCard } from '../components/ui/GlassCard'
import { VehicleImage } from '../components/vehicles/VehicleImage'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  cancelCustomerBooking,
  fetchBookingByReference,
  fetchBookingById,
  getBookingById,
  returnCustomerRental,
  downloadInvoicePdf,
} from '../services/bookingService'
import { formatCurrency, formatDate, formatStatus } from '../utils/formatters'
import { maskLicenseNumber } from '../utils/rental'

export default function BookingDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const toast = useToast()
  const [booking, setBooking] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState(null)

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate('/bookings')
    }
  }

  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)

    async function loadBooking() {
      try {
        let loaded = null
        if (/^\d+$/.test(id)) {
          loaded = await fetchBookingById(id)
        } else {
          try {
            loaded = await fetchBookingByReference(id)
          } catch {
            loaded = await fetchBookingById(id)
          }
        }
        if (!isCancelled) {
          setBooking(loaded)
        }
      } catch (err) {
        if (!isCancelled) {
          setBooking(null)
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

  async function handleConfirmCancel(bookingId) {
    setIsProcessing(true)
    try {
      const targetId = booking?.rawId || bookingId || id
      const updated = await cancelCustomerBooking(targetId)
      setBooking(updated)
      setIsCancelModalOpen(false)
      toast.success('Your reservation has been cancelled.')
      setFeedbackMessage({
        type: 'success',
        text: 'Your reservation has been cancelled. Vehicle held dates have been released back to the fleet.',
      })
    } catch (err) {
      toast.error(err.message || 'Failed to cancel reservation.')
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to cancel reservation.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleConfirmReturn(bookingId) {
    setIsProcessing(true)
    try {
      const targetId = booking?.rawId || bookingId || id
      const updated = await returnCustomerRental(targetId)
      setBooking(updated)
      setIsReturnModalOpen(false)
      toast.success('Vehicle returned successfully.')
      setFeedbackMessage({
        type: 'success',
        text: 'Vehicle returned successfully. Your rental journey is now marked completed.',
      })
    } catch (err) {
      toast.error(err.message || 'Failed to return vehicle.')
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to return vehicle.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return <div className="route-loading" aria-label="Loading booking details" />
  }

  if (!booking) {
    return (
      <section className="booking-missing">
        <GlassCard className="booking-missing-card">
          <span className="vehicle-empty-icon">
            <CalendarDays size={24} />
          </span>
          <h2>Reservation not found</h2>
          <p>The booking reference you requested ({id}) does not exist or may have been removed.</p>
          <GlassButton as={Link} to="/bookings">
            Return to my bookings
          </GlassButton>
        </GlassCard>
      </section>
    )
  }

  const vehicle = booking.vehicle
  const canCancel = booking.status === 'CONFIRMED' || booking.status === 'PENDING'
  const canReturn = booking.status === 'ACTIVE'

  return (
    <section className="booking-details-page">
      {/* Top Header */}
      <motion.div
        className="booking-details-header"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <div className="header-meta">
          <GlassButton onClick={handleBack} variant="ghost" size="sm" className="back-link">
            <ArrowLeft size={16} aria-hidden="true" /> All bookings
          </GlassButton>
          <div className="title-row">
            <div>
              <p className="eyebrow">Reservation Record</p>
              <h2>{booking.id}</h2>
            </div>
            <GlassBadge status={booking.status}>{formatStatus(booking.status)}</GlassBadge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="header-actions">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={async () => {
              try {
                await downloadInvoicePdf(booking.bookingReference || booking.id)
                toast.success('Invoice downloaded successfully.')
              } catch {
                toast.error('Failed to download invoice PDF.')
              }
            }}
          >
            <Download size={15} aria-hidden="true" /> Download Invoice (PDF)
          </GlassButton>

          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => setIsInvoiceModalOpen(true)}
          >
            <Printer size={15} aria-hidden="true" /> Print / View
          </GlassButton>

          {canCancel && (
            <GlassButton
              variant="danger"
              size="sm"
              onClick={() => setIsCancelModalOpen(true)}
            >
              <XCircle size={15} aria-hidden="true" /> Cancel reservation
            </GlassButton>
          )}

          {canReturn && (
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => setIsReturnModalOpen(true)}
            >
              <RotateCcw size={15} aria-hidden="true" /> Return vehicle
            </GlassButton>
          )}
        </div>
      </motion.div>

      {/* Feedback Toast Banner */}
      {feedbackMessage && (
        <motion.div
          className={`details-toast details-toast--${feedbackMessage.type}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 size={18} aria-hidden="true" />
          ) : (
            <AlertCircle size={18} aria-hidden="true" />
          )}
          <span>{feedbackMessage.text}</span>
        </motion.div>
      )}

      {/* Two-Column Grid */}
      <div className="booking-details-grid">
        {/* Left Column: Vehicle, Schedule, Driver */}
        <div className="details-main-column">
          {/* Vehicle Information */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.06}>
            <GlassCard className="detail-section-card">
              <div className="detail-card-heading">
                <div>
                  <p className="eyebrow">{vehicle?.vehicleType === 'bike' ? 'Motorcycle / Scooter' : 'Car'}</p>
                  <h3>{vehicle ? vehicle.name : 'Fleet vehicle'}</h3>
                </div>
                {vehicle?.vehicleType === 'bike' ? (
                  <Bike size={20} className="detail-heading-icon" aria-hidden="true" />
                ) : (
                  <CarFront size={20} className="detail-heading-icon" aria-hidden="true" />
                )}
              </div>

              {vehicle && (
                <div className="detail-vehicle-block">
                  <VehicleImage vehicle={vehicle} className="detail-vehicle-image" />
                  <div className="detail-vehicle-meta-grid">
                    <div>
                      <small>Category</small>
                      <strong>{vehicle.category || vehicle.type}</strong>
                    </div>
                    <div>
                      <small>{vehicle.vehicleType === 'bike' ? 'Engine / Power' : 'Transmission'}</small>
                      <strong>{vehicle.vehicleType === 'bike' ? (vehicle.enginePower || vehicle.transmission) : vehicle.transmission}</strong>
                    </div>
                    <div>
                      <small>Registration</small>
                      <strong className="registration-pill">{vehicle.registrationNumber}</strong>
                    </div>
                    <div>
                      <small>Fuel type</small>
                      <strong>{vehicle.fuelType}</strong>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Schedule & Depot Itinerary */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.12}>
            <GlassCard className="detail-section-card">
              <div className="detail-card-heading">
                <div>
                  <p className="eyebrow">Schedule & Depot</p>
                  <h3>Rental itinerary</h3>
                </div>
                <CalendarDays size={20} className="detail-heading-icon" aria-hidden="true" />
              </div>

              <div className="detail-schedule-grid">
                <div className="schedule-box">
                  <span className="schedule-tag">Pick-up</span>
                  <strong>{formatDate(booking.pickupDate)}</strong>
                  <small>{booking.pickupTime || '10:00 AM'}</small>
                  <p className="schedule-hub-name">
                    <MapPin size={12} className="inline-icon text-accent" aria-hidden="true" /> {booking.pickupLocation || 'VAYRO Vijayawada Central'}
                  </p>
                </div>
                <div className="schedule-box">
                  <span className="schedule-tag">Return</span>
                  <strong>{formatDate(booking.returnDate)}</strong>
                  <small>{booking.returnTime || '10:00 AM'}</small>
                  <p className="schedule-hub-name">
                    <MapPin size={12} className="inline-icon text-accent" aria-hidden="true" /> {booking.returnLocation || 'VAYRO Vijayawada Central'}
                  </p>
                </div>
              </div>

              <div className="schedule-duration-bar">
                <span>Duration</span>
                <strong>{booking.durationLabel || `${booking.rentalDays || 1} days`}</strong>
              </div>
            </GlassCard>
          </motion.div>

          {/* Driver Information */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.18}>
            <GlassCard className="detail-section-card">
              <div className="detail-card-heading">
                <div>
                  <p className="eyebrow">Designated driver</p>
                  <h3>Driver credentials</h3>
                </div>
                <UserRound size={20} className="detail-heading-icon" aria-hidden="true" />
              </div>

              <div className="detail-driver-info-grid">
                <div>
                  <small>Full name</small>
                  <strong>{booking.customerName || booking.driverDetails?.fullName || '—'}</strong>
                </div>
                <div>
                  <small>Email address</small>
                  <strong className="text-accent">{booking.customerEmail || booking.driverDetails?.email || '—'}</strong>
                </div>
                <div>
                  <small>Contact phone</small>
                  <strong>{booking.customerPhone || booking.driverDetails?.phone || '—'}</strong>
                </div>
                <div>
                  <small>Driving license</small>
                  <strong>{maskLicenseNumber(booking.driverDetails?.licenseNumber)}</strong>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Right Column: Timeline & Price Breakdown */}
        <div className="details-side-column">
          {/* Status Timeline */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.08}>
            <GlassCard className="detail-section-card">
              <div className="detail-card-heading">
                <div>
                  <p className="eyebrow">Lifecycle</p>
                  <h3>Booking timeline</h3>
                </div>
              </div>
              <BookingTimeline booking={booking} />
            </GlassCard>
          </motion.div>

          {/* Fare Summary */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.14}>
            <GlassCard className="detail-section-card fare-summary-card">
              <div className="detail-card-heading">
                <div>
                  <p className="eyebrow">Statement</p>
                  <h3>Fare breakdown</h3>
                </div>
                <FileText size={20} className="detail-heading-icon" aria-hidden="true" />
              </div>

              <div className="fare-rows">
                <div className="fare-row">
                  <span>Vehicle base rate</span>
                  <strong>{formatCurrency(booking.dailyRate || vehicle?.dailyRate || 0)} / day</strong>
                </div>
                <div className="fare-row">
                  <span>Duration ({booking.durationLabel || `${booking.rentalDays} days`})</span>
                  <strong>{formatCurrency(booking.baseRate || booking.vehicleTotal || 0)}</strong>
                </div>

                {booking.discount > 0 && (
                  <div className="fare-row fare-discount-row">
                    <span>Duration savings</span>
                    <strong className="discount-amount">−{formatCurrency(booking.discount)}</strong>
                  </div>
                )}

                {booking.couponDiscount > 0 && (
                  <div className="fare-row fare-discount-row">
                    <span>Promo discount ({booking.couponCode || 'COUPON'})</span>
                    <strong className="discount-amount">−{formatCurrency(booking.couponDiscount)}</strong>
                  </div>
                )}

                {booking.addonsTotal > 0 && (
                  <div className="fare-row">
                    <span>Optional add-ons</span>
                    <strong>{formatCurrency(booking.addonsTotal)}</strong>
                  </div>
                )}

                <div className="fare-row fare-total-row">
                  <span>Total paid / scheduled</span>
                  <strong className="fare-total-price">{formatCurrency(booking.totalAmount)}</strong>
                </div>
              </div>

              <div className="fare-payment-meta">
                <ShieldCheck size={14} className="text-success inline-icon" aria-hidden="true" />
                <small>
                  {booking.paymentStatus === 'PENDING_AT_PICKUP'
                    ? 'Pay at counter on pickup'
                    : `Settled via ${booking.paymentMethod || 'Simulated UPI'} (${booking.paymentReference || 'VERIFIED'})`}
                </small>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Cancellation Modal Dialog */}
      <CancelBookingModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        booking={booking}
      />

      {/* Return Vehicle Modal Dialog */}
      <ReturnVehicleModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onConfirm={handleConfirmReturn}
        booking={booking}
      />

      {/* Printable Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        booking={booking}
      />
    </section>
  )
}
