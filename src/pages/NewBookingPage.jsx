import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  Edit3,
  MapPin,
  Printer,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { fadeUp, pageTransition } from '../animations/variants'
import { BookingAddons } from '../components/bookings/BookingAddons'
import { BookingReview } from '../components/bookings/BookingReview'
import { BookingStepper } from '../components/bookings/BookingStepper'
import { DriverDetailsForm } from '../components/bookings/DriverDetailsForm'
import { InvoiceModal } from '../components/bookings/InvoiceModal'
import { PaymentStep } from '../components/bookings/PaymentStep'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassInput } from '../components/ui/GlassInput'
import { VehicleImage } from '../components/vehicles/VehicleImage'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  DEFAULT_PICKUP_LOCATION,
  DEFAULT_RETURN_LOCATION,
  DRIVE_EASE_LOCATIONS,
} from '../data/locations'
import { checkVehicleAvailability, createBooking } from '../services/bookingService'
import { fetchVehicleById, getVehicleById } from '../services/vehicleService'
import { validateAndApplyCoupon } from '../utils/coupons'
import { formatCurrency, formatDate } from '../utils/formatters'
import {
  calculateBookingBreakdown,
  calculateRentalDuration,
  dateToInputValue,
} from '../utils/rental'

const STEPS = [
  { id: 'dates', title: 'Schedule' },
  { id: 'options', title: 'Options' },
  { id: 'driver', title: 'Driver' },
  { id: 'review', title: 'Review' },
  { id: 'payment', title: 'Payment' },
]

export default function NewBookingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const toast = useToast()
  const vehicleId = searchParams.get('vehicle')

  const handleBackToVehicle = () => {
    if (location.key !== 'default') {
      navigate(-1)
    } else if (vehicleId) {
      navigate(`/vehicles/${vehicleId}`)
    } else {
      navigate('/vehicles')
    }
  }
  const requestedDurationType = searchParams.get('durationType') || 'DAYS'
  const requestedDurationValue = Number(searchParams.get('durationValue')) || 4

  const [vehicle, setVehicle] = useState(() => getVehicleById(vehicleId))
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(() => !getVehicleById(vehicleId))

  useEffect(() => {
    if (!vehicleId) return
    let isCancelled = false

    fetchVehicleById(vehicleId)
      .then((fetched) => {
        if (!isCancelled && fetched) {
          setVehicle(fetched)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingVehicle(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [vehicleId])

  const today = dateToInputValue(new Date())
  const rawPickup = searchParams.get('pickupDate')
  const initialPickup = rawPickup && !isNaN(new Date(rawPickup).getTime()) ? rawPickup : dateToInputValue(new Date(Date.now() + 86400000))
  const initialPickupTime = searchParams.get('pickupTime') || '10:00'
  const requestedHours = requestedDurationType === 'HOURS'
    ? requestedDurationValue
    : requestedDurationValue * 24

  const startMs = new Date(`${initialPickup}T${initialPickupTime}:00`).getTime()
  const validStartMs = isNaN(startMs) ? Date.now() + 86400000 : startMs
  const initialReturnDate = searchParams.get('returnDate') || dateToInputValue(new Date(validStartMs + requestedHours * 3600000))
  const initialReturnTime = searchParams.get('returnTime') || (requestedDurationType === 'DAYS' ? initialPickupTime : new Date(validStartMs + requestedHours * 3600000).toTimeString().slice(0, 5))

  const [currentStep, setCurrentStep] = useState(1)
  const [dates, setDates] = useState({
    pickupDate: initialPickup,
    pickupTime: initialPickupTime,
    returnDate: initialReturnDate,
    returnTime: initialReturnTime,
  })
  const [locations, setLocations] = useState({
    pickupLocation: DEFAULT_PICKUP_LOCATION,
    returnLocation: DEFAULT_RETURN_LOCATION,
    differentReturn: false,
  })
  const [dateErrors, setDateErrors] = useState({})
  const [selectedAddons, setSelectedAddons] = useState(() =>
    vehicle?.vehicleType === 'bike' ? ['riding_gear'] : ['premium_protection'],
  )
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [driverDetails, setDriverDetails] = useState({
    fullName: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '',
    email: user?.email || '',
    phone: user?.phone || '',
    licenseNumber: user?.licenseNumber || '',
  })

  useEffect(() => {
    if (user) {
      setDriverDetails((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        licenseNumber: prev.licenseNumber || user.licenseNumber || '',
      }))
    }
  }, [user])
  const [driverErrors, setDriverErrors] = useState({})
  const [availabilityError, setAvailabilityError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

  // Real-time calculated duration purely derived from active pickup & return timestamps
  const duration = useMemo(
    () => calculateRentalDuration(dates.pickupDate, dates.pickupTime, dates.returnDate, dates.returnTime),
    [dates.pickupDate, dates.pickupTime, dates.returnDate, dates.returnTime],
  )

  // Real-time calculated pricing derived dynamically from active schedule and selected options
  const pricing = useMemo(
    () =>
      calculateBookingBreakdown({
        vehicle,
        pickupDate: dates.pickupDate,
        pickupTime: dates.pickupTime,
        returnDate: dates.returnDate,
        returnTime: dates.returnTime,
        selectedAddonIds: selectedAddons,
      }),
    [vehicle, dates.pickupDate, dates.pickupTime, dates.returnDate, dates.returnTime, selectedAddons],
  )

  // Re-check vehicle availability live whenever any schedule parameter changes
  useEffect(() => {
    if (!vehicle || !dates.pickupDate || !dates.returnDate || !duration.valid) {
      setAvailabilityError('')
      return
    }

    const check = checkVehicleAvailability(
      vehicle.id,
      dates.pickupDate,
      dates.returnDate,
      null,
      dates.pickupTime,
      dates.returnTime,
    )

    if (!check.available) {
      setAvailabilityError(check.reason || 'Vehicle is not available for the selected period.')
    } else {
      setAvailabilityError('')
    }
  }, [vehicle, dates.pickupDate, dates.pickupTime, dates.returnDate, dates.returnTime, duration.valid])

  function handleDateChange(event) {
    const { name, value } = event.target
    setDates((prev) => ({ ...prev, [name]: value }))
    setDateErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }))
    setSubmitError('')
  }

  function handleLocationChange(event) {
    const { name, value } = event.target
    setLocations((prev) => {
      const next = { ...prev, [name]: value }
      if (!next.differentReturn && name === 'pickupLocation') {
        next.returnLocation = value
      }
      return next
    })
  }

  function handleToggleDifferentReturn(e) {
    const checked = e.target.checked
    setLocations((prev) => ({
      ...prev,
      differentReturn: checked,
      returnLocation: checked ? prev.returnLocation : prev.pickupLocation,
    }))
  }

  function applyPresetDuration(hoursToAdd) {
    if (!dates.pickupDate) return
    const startTime = dates.pickupTime || '10:00'
    const startMs = new Date(`${dates.pickupDate}T${startTime}:00`).getTime()
    const targetEnd = new Date(startMs + hoursToAdd * 3600000)

    const nextReturnDate = dateToInputValue(targetEnd)
    const nextReturnTime = targetEnd.toTimeString().slice(0, 5)

    setDates((prev) => ({
      ...prev,
      returnDate: nextReturnDate,
      returnTime: nextReturnTime,
    }))
    setDateErrors({})
  }

  function handleApplyCoupon(code) {
    const result = validateAndApplyCoupon(code, pricing.vehicleTotal, duration.days)
    if (result.valid) {
      setAppliedCoupon(result.coupon)
      toast.success(`Coupon ${result.coupon.code} applied: Saved ${formatCurrency(result.coupon.discountAmount)}!`)
    }
    return result
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    toast.success('Coupon removed.')
  }

  function validateStep1() {
    const errors = {}
    if (!dates.pickupDate) errors.pickupDate = 'Select a pick-up date.'
    if (!dates.returnDate) errors.returnDate = 'Select a return date.'
    if (dates.pickupDate && dates.pickupDate < today) errors.pickupDate = 'Pick-up must be today or later.'

    if (!duration.valid) {
      errors.returnTime = duration.error || 'Return time must be after pick-up time.'
    }

    if (Object.keys(errors).length > 0) {
      setDateErrors(errors)
      return false
    }

    if (availabilityError) {
      return false
    }

    return true
  }

  function validateStep3() {
    const errors = {}
    if (!driverDetails.fullName.trim() || driverDetails.fullName.trim().length < 2) {
      errors.fullName = 'Please enter driver full name.'
    }
    if (!driverDetails.email.trim() || !/^\S+@\S+\.\S+$/.test(driverDetails.email)) {
      errors.email = 'Please enter a valid email address.'
    }
    if (!driverDetails.phone.trim() || driverDetails.phone.trim().length < 8) {
      errors.phone = 'Please enter a valid contact phone number.'
    }
    if (!driverDetails.licenseNumber.trim() || driverDetails.licenseNumber.trim().length < 5) {
      errors.licenseNumber = 'Please enter a valid driving license number.'
    }

    if (Object.keys(errors).length > 0) {
      setDriverErrors(errors)
      return false
    }
    return true
  }

  function handleNextStep() {
    if (currentStep === 1) {
      if (!validateStep1()) return
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setCurrentStep(3)
    } else if (currentStep === 3) {
      if (!validateStep3()) return
      setCurrentStep(4)
    } else if (currentStep === 4) {
      setCurrentStep(5)
    }
  }

  function handlePrevStep() {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1)
      setSubmitError('')
    }
  }

  async function handleFinalizePayment(paymentMeta) {
    setIsSubmitting(true)
    setSubmitError('')

    try {
      const created = await createBooking({
        customerId: user?.id || 'usr_customer_001',
        vehicleId: vehicle.id,
        pickupDate: dates.pickupDate,
        pickupTime: dates.pickupTime,
        returnDate: dates.returnDate,
        returnTime: dates.returnTime,
        pickupLocation: locations.pickupLocation,
        returnLocation: locations.returnLocation,
        selectedAddons,
        durationType: duration.durationType,
        durationValue: duration.durationValue,
        durationLabel: duration.label,
        couponCode: appliedCoupon?.code || null,
        couponDiscount: appliedCoupon?.discount ?? appliedCoupon?.discountAmount ?? 0,
        paymentMethod: paymentMeta.paymentMethod,
        paymentStatus: paymentMeta.paymentStatus,
        paymentReference: paymentMeta.paymentReference,
        paymentTimestamp: paymentMeta.paymentTimestamp,
        driverDetails,
      })

      setConfirmedBooking(created)
      setCurrentStep(6)
      toast.success(`Booking ${created.id} confirmed successfully!`)
    } catch (err) {
      setSubmitError(err.message || 'We could not complete your booking. Please try again.')
      toast.error(err.message || 'We could not complete your booking.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!vehicle) {
    return (
      <section className="new-booking-page">
        <GlassCard className="booking-missing-card">
          <span className="vehicle-empty-icon">
            <CarFront size={28} />
          </span>
          <h2>{vehicleId ? 'Vehicle not found' : 'No vehicle selected'}</h2>
          <p>
            {vehicleId
              ? `We couldn't find a vehicle matching "${vehicleId}". Please select a valid vehicle from our fleet catalogue.`
              : 'Please select an available vehicle from our fleet catalogue to begin your booking.'}
          </p>
          <GlassButton as={Link} to="/vehicles">
            Browse fleet catalogue
          </GlassButton>
        </GlassCard>
      </section>
    )
  }

  // STEP 6: SUCCESS CONFIRMATION
  if (currentStep === 6 && confirmedBooking) {
    const finalAmount = confirmedBooking.totalAmount
    return (
      <section className="new-booking-page">
        <motion.div
          className="booking-confirmed-container"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
        >
          <GlassCard className="booking-confirmed-card">
            <div className="confirmed-icon-wrap">
              <CheckCircle2 size={44} className="confirmed-check-icon" aria-hidden="true" />
            </div>

            <p className="eyebrow">Reservation Confirmed</p>
            <h2>You're ready to drive!</h2>
            <p className="confirmed-subtitle">
              Thank you for choosing VAYRO. Your booking reference is <strong>{confirmedBooking.id}</strong>.
            </p>

            <div className="confirmed-details-card">
              <div className="confirmed-vehicle-row">
                <VehicleImage vehicle={vehicle} className="confirmed-thumb" />
                <div>
                  <h4>{vehicle.name}</h4>
                  <p>{vehicle.year} · {vehicle.type} · {vehicle.transmission} · {vehicle.fuelType}</p>
                  <span className="confirmed-reg">{vehicle.registrationNumber}</span>
                </div>
              </div>

              <div className="confirmed-schedule-grid">
                <div>
                  <small>Pick-up Hub</small>
                  <strong>{confirmedBooking.pickupLocation || locations.pickupLocation}</strong>
                  <span>{formatDate(dates.pickupDate)} · {dates.pickupTime}</span>
                </div>
                <div>
                  <small>Duration</small>
                  <strong>{duration.label}</strong>
                  <span>Confirmed Timeline</span>
                </div>
                <div>
                  <small>Return Hub</small>
                  <strong>{confirmedBooking.returnLocation || locations.returnLocation}</strong>
                  <span>{formatDate(dates.returnDate)} · {dates.returnTime}</span>
                </div>
                <div>
                  <small>Payment Status</small>
                  <strong className="text-success">
                    {confirmedBooking.paymentStatus === 'PENDING_AT_PICKUP' ? 'Pay at Pickup' : 'Paid & Secured'}
                  </strong>
                  <span>Ref: {confirmedBooking.paymentReference}</span>
                </div>
              </div>

              <div className="confirmed-total-highlight">
                <span>Total Settled Amount</span>
                <strong className="confirmed-price">{formatCurrency(finalAmount)}</strong>
              </div>
            </div>

            <div className="confirmed-actions">
              <GlassButton as={Link} to={`/bookings/${confirmedBooking.id}`}>
                View reservation details
              </GlassButton>
              <GlassButton variant="secondary" onClick={() => setShowInvoiceModal(true)}>
                <Printer size={15} aria-hidden="true" /> Download / Print Invoice
              </GlassButton>
              <GlassButton as={Link} to="/dashboard" variant="ghost">
                Back to dashboard
              </GlassButton>
            </div>
          </GlassCard>
        </motion.div>

        {/* Client-Side Invoice Modal */}
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          booking={confirmedBooking}
        />
      </section>
    )
  }

  return (
    <section className="new-booking-page">
      {/* Page Header Banner */}
      <div className="new-booking-header">
        <div>
          <p className="eyebrow">Rental reservation</p>
          <h2>Reserve {vehicle.name}</h2>
          <p>Customize your pick-up, return locations, duration, and protection before checkout.</p>
        </div>
        <GlassButton onClick={handleBackToVehicle} variant="ghost" size="sm">
          <ArrowLeft size={16} aria-hidden="true" /> Back to vehicle
        </GlassButton>
      </div>

      {/* Stepper */}
      <BookingStepper
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step === 1) setCurrentStep(1)
          else if (step === 2 && validateStep1()) setCurrentStep(2)
          else if (step === 3 && validateStep1()) setCurrentStep(3)
          else if (step === 4 && validateStep1() && validateStep3()) setCurrentStep(4)
          else if (step === 5 && validateStep1() && validateStep3()) setCurrentStep(5)
        }}
      />

      {/* Step Contents */}
      <AnimatePresence mode="wait">
        {/* STEP 1: LOCATIONS & DATES */}
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            className="booking-step-container"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageTransition}
          >
            <div className="booking-layout">
              {/* Vehicle Sidebar Card */}
              <GlassCard className="booking-vehicle-card">
                <VehicleImage vehicle={vehicle} className="booking-vehicle-image" />
                <div className="booking-vehicle-card-body">
                  <p className="eyebrow">Selected vehicle</p>
                  <h3>{vehicle.name}</h3>
                  <p>
                    {vehicle.vehicleType === 'bike'
                      ? `${vehicle.category || vehicle.type} · ${vehicle.class || 'Standard'} · ${vehicle.fuelType || 'Petrol'}`
                      : `${vehicle.year} · ${vehicle.type} · ${vehicle.transmission || 'Automatic'}`}
                  </p>
                  <strong>
                    {formatCurrency(vehicle.dailyRate)} <span>per day</span>
                  </strong>
                </div>
              </GlassCard>

              {/* Date & Location Selection Card */}
              <div className="booking-main-form-column">
                <GlassCard className="booking-dates-card">
                  <div className="booking-card-heading">
                    <div>
                      <p className="eyebrow">Depot & Schedule</p>
                      <h3>Where and when will you need it?</h3>
                    </div>
                    <CalendarDays size={20} className="booking-step-icon" aria-hidden="true" />
                  </div>

                  {/* Pick-up & Return Locations */}
                  <div className="booking-location-fields">
                    <label className="glass-select-group">
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-accent inline-icon" aria-hidden="true" /> Pick-up Location
                      </span>
                      <select
                        name="pickupLocation"
                        value={locations.pickupLocation}
                        onChange={handleLocationChange}
                        className="glass-select"
                      >
                        {DRIVE_EASE_LOCATIONS.map((loc) => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name} ({loc.city})
                          </option>
                        ))}
                      </select>
                    </label>

                    {locations.differentReturn ? (
                      <label className="glass-select-group">
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-accent inline-icon" aria-hidden="true" /> Return Location
                        </span>
                        <select
                          name="returnLocation"
                          value={locations.returnLocation}
                          onChange={handleLocationChange}
                          className="glass-select"
                        >
                          {DRIVE_EASE_LOCATIONS.map((loc) => (
                            <option key={loc.id} value={loc.name}>
                              {loc.name} ({loc.city})
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <div className="same-return-placeholder">
                        <small>Return Location</small>
                        <p>Same as pick-up ({locations.pickupLocation})</p>
                      </div>
                    )}
                  </div>

                  <label className="different-location-checkbox-label">
                    <input
                      type="checkbox"
                      checked={locations.differentReturn}
                      onChange={handleToggleDifferentReturn}
                    />
                    <span>Return vehicle to a different VAYRO hub</span>
                  </label>

                  <div className="booking-dates-divider" />

                  {/* Date & Time Inputs Grid */}
                  <div className="booking-date-fields">
                    <GlassInput
                      label="Pick-up date"
                      name="pickupDate"
                      type="date"
                      min={today}
                      value={dates.pickupDate}
                      onChange={handleDateChange}
                      error={dateErrors.pickupDate}
                    />
                    <GlassInput
                      label="Pick-up time"
                      name="pickupTime"
                      type="time"
                      value={dates.pickupTime}
                      onChange={handleDateChange}
                      error={dateErrors.pickupTime}
                    />
                    <GlassInput
                      label="Return date"
                      name="returnDate"
                      type="date"
                      min={dates.pickupDate || today}
                      value={dates.returnDate}
                      onChange={handleDateChange}
                      error={dateErrors.returnDate}
                    />
                    <GlassInput
                      label="Return time"
                      name="returnTime"
                      type="time"
                      value={dates.returnTime}
                      onChange={handleDateChange}
                      error={dateErrors.returnTime}
                    />
                  </div>

                  {/* Quick Duration Shortcuts */}
                  <div className="duration-quick-presets" aria-label="Quick duration shortcuts">
                    <span className="duration-presets-label">
                      <Clock3 size={13} aria-hidden="true" /> Quick duration:
                    </span>
                    <div className="duration-presets-list">
                      <button type="button" className="duration-preset-btn" onClick={() => applyPresetDuration(5)}>
                        5 Hours
                      </button>
                      <button type="button" className="duration-preset-btn" onClick={() => applyPresetDuration(24)}>
                        1 Day
                      </button>
                      <button type="button" className="duration-preset-btn" onClick={() => applyPresetDuration(96)}>
                        4 Days
                      </button>
                      <button type="button" className="duration-preset-btn" onClick={() => applyPresetDuration(168)}>
                        7 Days (12% off)
                      </button>
                      <button type="button" className="duration-preset-btn" onClick={() => applyPresetDuration(720)}>
                        30 Days (32% off)
                      </button>
                    </div>
                  </div>

                  {dateErrors.general && (
                    <p className="form-alert" role="alert">{dateErrors.general}</p>
                  )}

                  {!duration.valid && (
                    <div className="form-alert" role="alert">
                      <AlertCircle size={16} aria-hidden="true" />
                      <span>{duration.error || 'Return time must be after pick-up time.'}</span>
                    </div>
                  )}

                  {availabilityError && (
                    <div className="form-alert availability-conflict-alert" role="alert">
                      <AlertCircle size={17} aria-hidden="true" />
                      <div>
                        <strong>Dates unavailable</strong>
                        <p>{availabilityError}</p>
                      </div>
                    </div>
                  )}
                </GlassCard>

                {/* Live Dynamic Estimate Snapshot */}
                <GlassCard className="booking-total-card">
                  <div>
                    <p className="eyebrow">Live rental estimate</p>
                    <h3>{duration.valid ? duration.label : 'Select valid dates'}</h3>
                    <p>
                      {duration.valid
                        ? duration.wholeDays === 0
                          ? `Hourly rate: ${formatCurrency(pricing.hourlyRate || Math.round(vehicle.dailyRate * 0.14))} / hr`
                          : pricing.discount > 0
                          ? `${formatCurrency(vehicle.dailyRate)} / day · Includes ${formatCurrency(pricing.discount)} duration savings`
                          : `${formatCurrency(vehicle.dailyRate)} / day`
                        : 'Duration and rate calculate automatically as you adjust dates.'}
                    </p>
                  </div>
                  <div className="booking-total-amount-box">
                    <small>Vehicle subtotal</small>
                    <strong className="booking-total">
                      {duration.valid ? <AnimatedNumber value={pricing.vehicleTotal} format={formatCurrency} /> : '—'}
                    </strong>
                  </div>
                </GlassCard>

                <div className="step-actions">
                  <div />
                  <GlassButton
                    onClick={handleNextStep}
                    disabled={Boolean(availabilityError) || !duration.valid}
                  >
                    Continue to options <ChevronRight size={17} aria-hidden="true" />
                  </GlassButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: OPTIONS / ADD-ONS */}
        {currentStep === 2 && (
          <motion.div
            key="step-2"
            className="booking-step-container"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageTransition}
          >
            <div className="step-header">
              <div>
                <p className="eyebrow">Protection & Services</p>
                <h3>Customize your drive</h3>
                <p>Select optional coverage and equipment tailored to your journey.</p>
              </div>
              <div className="step-subtotal-badge-wrap">
                <span className="step-subtotal-badge">
                  Trip duration: <strong>{duration.label}</strong>
                </span>
                <button
                  type="button"
                  className="step-modify-schedule-link"
                  onClick={() => setCurrentStep(1)}
                  title="Change pick-up or return dates"
                >
                  <Edit3 size={13} aria-hidden="true" /> Edit schedule
                </button>
              </div>
            </div>

            <BookingAddons
              vehicle={vehicle}
              selectedAddons={selectedAddons}
              onChange={setSelectedAddons}
              duration={duration}
              rentalDays={duration.days}
            />

            <div className="step-actions step-actions--between">
              <GlassButton variant="secondary" onClick={handlePrevStep}>
                <ArrowLeft size={16} aria-hidden="true" /> Back to schedule
              </GlassButton>
              <GlassButton onClick={handleNextStep}>
                Continue to {vehicle?.vehicleType === 'bike' ? 'rider' : 'driver'} details <ChevronRight size={17} aria-hidden="true" />
              </GlassButton>
            </div>
          </motion.div>
        )}

        {/* STEP 3: DRIVER DETAILS */}
        {currentStep === 3 && (
          <motion.div
            key="step-3"
            className="booking-step-container"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageTransition}
          >
            <GlassCard className="driver-step-card">
              <div className="step-header">
                <div>
                  <p className="eyebrow">Driver identification</p>
                  <h3>Who is driving?</h3>
                  <p>Provide details for the designated driver who will take delivery of the vehicle.</p>
                </div>
                <UserRound className="booking-step-icon" size={22} aria-hidden="true" />
              </div>

              <DriverDetailsForm
                values={driverDetails}
                errors={driverErrors}
                onChange={(values) => {
                  setDriverDetails(values)
                  setDriverErrors({})
                }}
              />
            </GlassCard>

            <div className="step-actions step-actions--between">
              <GlassButton variant="secondary" onClick={handlePrevStep}>
                <ArrowLeft size={16} aria-hidden="true" /> Back to options
              </GlassButton>
              <GlassButton onClick={handleNextStep}>
                Review reservation <ChevronRight size={17} aria-hidden="true" />
              </GlassButton>
            </div>
          </motion.div>
        )}

        {/* STEP 4: REVIEW & PROMO CODE */}
        {currentStep === 4 && (
          <motion.div
            key="step-4"
            className="booking-step-container"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageTransition}
          >
            <BookingReview
              vehicle={vehicle}
              dates={dates}
              locations={locations}
              rentalDays={duration.days}
              pricing={pricing}
              appliedCoupon={appliedCoupon}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              driverDetails={driverDetails}
              onEditSchedule={() => setCurrentStep(1)}
            />

            {submitError && (
              <div className="form-alert" role="alert">
                <AlertCircle size={17} aria-hidden="true" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="step-actions step-actions--between">
              <GlassButton variant="secondary" onClick={handlePrevStep} disabled={isSubmitting}>
                <ArrowLeft size={16} aria-hidden="true" /> Edit driver
              </GlassButton>
              <GlassButton
                onClick={handleNextStep}
                className="confirm-booking-btn"
              >
                Proceed to payment <ChevronRight size={17} aria-hidden="true" />
              </GlassButton>
            </div>
          </motion.div>
        )}

        {/* STEP 5: PAYMENT SIMULATION */}
        {currentStep === 5 && (
          <motion.div
            key="step-5"
            className="booking-step-container"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageTransition}
          >
            <PaymentStep
              vehicle={vehicle}
              dates={dates}
              locations={locations}
              pricing={pricing}
              appliedCoupon={appliedCoupon}
              driverDetails={driverDetails}
              onCompletePayment={handleFinalizePayment}
              onBack={handlePrevStep}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
