import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  CreditCard,
  Fuel,
  Gauge,
  MapPin,
  Play,
  RotateCcw,
  ShieldCheck,
  Tag,
  User,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fadeUp } from '../../animations/variants'
import { BookingStatusModal } from '../../components/admin/BookingStatusModal'
import { BookingTimeline } from '../../components/bookings/BookingTimeline'
import { GlassBadge } from '../../components/ui/GlassBadge'
import { GlassButton } from '../../components/ui/GlassButton'
import { GlassCard } from '../../components/ui/GlassCard'
import { VehicleImage } from '../../components/vehicles/VehicleImage'
import { useToast } from '../../context/ToastContext'
import {
  getBookingById,
  updateBookingStatus,
} from '../../services/bookingService'
import { formatCurrency, formatDate, formatStatus } from '../../utils/formatters'
import { RENTAL_ADDONS, maskLicenseNumber } from '../../utils/rental'

export default function AdminBookingDetailsPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const [booking, setBooking] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [modalState, setModalState] = useState({ isOpen: false, action: null })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate('/admin/bookings')
    }
  }

  async function loadBooking() {
    setIsLoading(true)
    try {
      const loaded = await getBookingById(id)
      setBooking(loaded)
    } catch {
      setBooking(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBooking()
  }, [id])

  async function handleConfirmStatusUpdate(bookingId, newStatus) {
    setIsSubmitting(true)
    try {
      await updateBookingStatus(bookingId, newStatus)
      await loadBooking()
      toast.success(`Booking ${bookingId} successfully updated to ${newStatus}.`)
    } catch (err) {
      toast.error(err.message || 'Failed to update status.')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="route-loading" aria-label="Loading booking details" />
  }

  if (!booking) {
    return (
      <section className="booking-missing">
        <GlassCard className="booking-missing-card">
          <h2>Booking not found</h2>
          <p>The booking identifier ({id}) was not found in fleet records.</p>
          <GlassButton as={Link} to="/admin/bookings">Return to bookings</GlassButton>
        </GlassCard>
      </section>
    )
  }

  const vehicle = booking.vehicle
  const durationLabel = booking.durationLabel || `${booking.rentalDays || 1} days`
  const selectedAddonDetails = (booking.selectedAddons || [])
    .map((addonId) => RENTAL_ADDONS.find((a) => a.id === addonId))
    .filter(Boolean)

  return (
    <section className="admin-booking-details-page">
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
              <p className="eyebrow">Fleet Reservation</p>
              <h2>{booking.id}</h2>
            </div>
            <GlassBadge status={booking.status}>{formatStatus(booking.status)}</GlassBadge>
          </div>
        </div>

        {/* Operational Actions */}
        <div className="header-actions">
          {booking.status === 'CONFIRMED' && (
            <>
              <GlassButton
                onClick={() => setModalState({ isOpen: true, action: 'START_RENTAL' })}
              >
                <Play size={15} aria-hidden="true" /> Start rental
              </GlassButton>
              <GlassButton
                variant="danger"
                onClick={() => setModalState({ isOpen: true, action: 'CANCEL_BOOKING' })}
              >
                <XCircle size={15} aria-hidden="true" /> Cancel
              </GlassButton>
            </>
          )}

          {booking.status === 'ACTIVE' && (
            <GlassButton
              onClick={() => setModalState({ isOpen: true, action: 'COMPLETE_RENTAL' })}
            >
              <RotateCcw size={15} aria-hidden="true" /> Complete rental
            </GlassButton>
          )}
        </div>
      </motion.div>

      {/* Two-Column Grid */}
      <div className="booking-details-grid">
        {/* Left Column: Vehicle, Schedule, Driver */}
        <div className="details-main-column">
          {/* Vehicle Information */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.06}>
            <GlassCard className="detail-section-card">
              <div className="detail-card-heading">
                <div>
                  <p className="eyebrow">Assigned Fleet Asset</p>
                  <h3>{vehicle ? vehicle.name : 'Fleet vehicle'}</h3>
                </div>
                <CarFront size={20} className="detail-heading-icon" aria-hidden="true" />
              </div>

              {vehicle && (
                <div className="detail-vehicle-block">
                  <VehicleImage vehicle={vehicle} className="detail-vehicle-image" />
                  <div className="detail-vehicle-meta-grid">
                    <div>
                      <small>Category</small>
                      <strong>{vehicle.type}</strong>
                    </div>
                    <div>
                      <small>Transmission</small>
                      <strong>{vehicle.transmission}</strong>
                    </div>
                    <div>
                      <small>Registration</small>
                      <strong className="registration-pill">{vehicle.registrationNumber}</strong>
                    </div>
                    <div>
                      <small>Fuel Type</small>
                      <strong>{vehicle.fuelType}</strong>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Schedule & Depot Itinerary */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
            <GlassCard className="detail-section-card">
              <div className="detail-card-heading">
                <div>
                  <p className="eyebrow">Depot Itinerary</p>
                  <h3>Schedule & Transit Points</h3>
                </div>
                <CalendarDays size={18} className="detail-heading-icon" aria-hidden="true" />
              </div>

              <div className="detail-schedule-grid">
                <div className="schedule-box">
                  <span className="schedule-tag">Pick-up Hub</span>
                  <strong>{formatDate(booking.pickupDate)} · {booking.pickupTime || '10:00 AM'}</strong>
                  <p className="schedule-hub-name">
                    <MapPin size={12} className="inline-icon text-accent" aria-hidden="true" /> {booking.pickupLocation || 'VAYRO Vijayawada Central'}
                  </p>
                </div>
                <div className="schedule-box">
                  <span className="schedule-tag">Return Hub</span>
                  <strong>{formatDate(booking.returnDate)} · {booking.returnTime || '10:00 AM'}</strong>
                  <p className="schedule-hub-name">
                    <MapPin size={12} className="inline-icon text-accent" aria-hidden="true" /> {booking.returnLocation || 'VAYRO Vijayawada Central'}
                  </p>
                </div>
              </div>

              <div className="schedule-duration-bar">
                <span>Calculated Duration:</span>
                <strong>{durationLabel}</strong>
              </div>
            </GlassCard>
          </motion.div>

          {/* Driver & Customer Identification */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.14}>
            <GlassCard className="detail-section-card">
              <div className="detail-card-heading">
                <div>
                  <p className="eyebrow">Customer Credentials</p>
                  <h3>Authorized driver</h3>
                </div>
                <User size={18} className="detail-heading-icon" aria-hidden="true" />
              </div>

              <div className="detail-driver-info-grid">
                <div className="driver-field">
                  <small>Primary Driver</small>
                  <strong>{booking.driverDetails?.fullName || '—'}</strong>
                </div>
                <div className="driver-field">
                  <small>Email</small>
                  <strong>{booking.driverDetails?.email || '—'}</strong>
                </div>
                <div className="driver-field">
                  <small>Phone</small>
                  <strong>{booking.driverDetails?.phone || '—'}</strong>
                </div>
                <div className="driver-field">
                  <small>Driving License</small>
                  <strong>{maskLicenseNumber(booking.driverDetails?.licenseNumber)}</strong>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Selected Add-ons */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.18}>
            <GlassCard className="detail-section-card">
              <div className="detail-card-heading">
                <div>
                  <p className="eyebrow">Add-on Coverage</p>
                  <h3>Selected options</h3>
                </div>
                <ShieldCheck size={18} className="detail-heading-icon" aria-hidden="true" />
              </div>

              {selectedAddonDetails.length > 0 ? (
                <div className="review-addons-list">
                  {selectedAddonDetails.map((addon) => (
                    <div key={addon.id} className="review-addon-row">
                      <div className="review-addon-info">
                        <Check size={15} className="addon-check-icon" aria-hidden="true" />
                        <div>
                          <strong>{addon.name}</strong>
                          <p>{addon.description}</p>
                        </div>
                      </div>
                      <span className="review-addon-price">
                        {formatCurrency(addon.pricePerDay * (booking.rentalDays || 1))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="review-no-addons">No optional add-ons selected for this booking.</p>
              )}
            </GlassCard>
          </motion.div>
        </div>

        {/* Right Column: Pricing & Timeline */}
        <div className="details-side-column">
          {/* Price Breakdown */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.08}>
            <GlassCard className="detail-section-card">
              <div className="detail-card-heading">
                <div>
                  <p className="eyebrow">Financial Statement</p>
                  <h3>Payment & settlement</h3>
                </div>
                <CreditCard size={18} className="detail-heading-icon" aria-hidden="true" />
              </div>

              <div className="fare-rows">
                <div className="fare-row">
                  <span>Vehicle Rate ({durationLabel})</span>
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
                    <span>Promo ({booking.couponCode || 'COUPON'})</span>
                    <strong className="discount-amount">−{formatCurrency(booking.couponDiscount)}</strong>
                  </div>
                )}

                <div className="fare-row">
                  <span>Add-ons Total</span>
                  <strong>{formatCurrency(booking.addonsTotal || 0)}</strong>
                </div>

                <div className="fare-row fare-total-row">
                  <span>Total Amount</span>
                  <strong className="fare-total-price">{formatCurrency(booking.totalAmount)}</strong>
                </div>
              </div>

              <div className="fare-payment-meta">
                <ShieldCheck size={14} className="text-success inline-icon" aria-hidden="true" />
                <small>
                  Status: <strong>{booking.paymentStatus === 'PENDING_AT_PICKUP' ? 'Pay at pickup' : 'PAID'}</strong>
                  {booking.paymentReference && ` · Ref: ${booking.paymentReference}`}
                </small>
              </div>
            </GlassCard>
          </motion.div>

          {/* Lifecycle Timeline */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.12}>
            <GlassCard className="detail-section-card">
              <div className="detail-card-heading">
                <div>
                  <p className="eyebrow">Lifecycle Progression</p>
                  <h3>Reservation timeline</h3>
                </div>
              </div>

              <BookingTimeline booking={booking} />
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Status Modal */}
      <BookingStatusModal
        isOpen={modalState.isOpen}
        booking={booking}
        targetAction={modalState.action}
        onClose={() => setModalState({ isOpen: false, action: null })}
        onConfirm={handleConfirmStatusUpdate}
        isSubmitting={isSubmitting}
      />
    </section>
  )
}
