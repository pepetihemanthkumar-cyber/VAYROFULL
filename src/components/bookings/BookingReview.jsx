import { useState } from 'react'
import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  Edit3,
  MapPin,
  ShieldCheck,
  Sparkles,
  Tag,
  UserRound,
  X,
} from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { GlassButton } from '../ui/GlassButton'
import { GlassInput } from '../ui/GlassInput'
import { VehicleImage } from '../vehicles/VehicleImage'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { maskLicenseNumber } from '../../utils/rental'

function formatTimeDisplay(timeStr = '10:00') {
  if (!timeStr) return '10:00 AM'
  const [hours, minutes] = timeStr.split(':').map(Number)
  if (Number.isNaN(hours)) return timeStr
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  const displayMins = minutes !== undefined && !Number.isNaN(minutes) ? String(minutes).padStart(2, '0') : '00'
  return `${displayHours}:${displayMins} ${period}`
}

export function BookingReview({
  vehicle,
  dates,
  locations,
  rentalDays,
  pricing,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  driverDetails,
  onEditSchedule,
}) {
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')

  const durationLabel = pricing?.duration?.label || (rentalDays ? `${rentalDays} ${rentalDays === 1 ? 'day' : 'days'}` : '1 day')
  const isHourly = pricing?.duration?.durationType === 'HOURS'
  const couponDiscountAmount = appliedCoupon?.discount ?? appliedCoupon?.discountAmount ?? 0
  const finalPayable = Math.max(0, (pricing.totalAmount || 0) - couponDiscountAmount)

  function handleApplyClick(e) {
    e.preventDefault()
    setCouponError('')
    if (!couponInput.trim()) {
      setCouponError('Please enter a promo code.')
      return
    }

    const res = onApplyCoupon(couponInput.trim())
    if (!res.valid) {
      setCouponError(res.error || 'Invalid promo code.')
    } else {
      setCouponInput('')
      setCouponError('')
    }
  }

  return (
    <div className="booking-review-layout">
      {/* Left Column: Vehicle & Trip Summary */}
      <div className="review-main-column">
        {/* Vehicle & Trip Card */}
        <GlassCard className="review-section-card">
          <div className="review-section-header">
            <div>
              <p className="eyebrow">Vehicle & Schedule</p>
              <h3>Reservation details</h3>
            </div>
            {onEditSchedule && (
              <GlassButton
                variant="ghost"
                size="sm"
                className="review-edit-schedule-btn"
                onClick={onEditSchedule}
                title="Modify pick-up/return schedule"
              >
                <Edit3 size={14} aria-hidden="true" /> Edit schedule
              </GlassButton>
            )}
          </div>

          <div className="review-vehicle-summary">
            <VehicleImage vehicle={vehicle} className="review-vehicle-thumbnail" />
            <div className="review-vehicle-info">
              <h4>{vehicle.name}</h4>
              <p className="review-vehicle-meta">
                {vehicle.vehicleType === 'bike'
                  ? `${vehicle.category || vehicle.type} · ${vehicle.class || 'Standard'} · ${vehicle.enginePower || vehicle.engine || 'Engine'}`
                  : `${vehicle.year} · ${vehicle.category || vehicle.type} · ${vehicle.transmission} · ${vehicle.fuelType}`}
              </p>
              <span className="review-registration">{vehicle.registrationNumber}</span>
            </div>
          </div>

          {/* Schedule & Depot Grid */}
          <div className="review-dates-grid">
            <div className="review-date-box">
              <span className="review-date-label">Pick-up</span>
              <strong>{formatDate(dates.pickupDate)}</strong>
              <small>{formatTimeDisplay(dates.pickupTime)}</small>
              <span className="review-location-text">
                <MapPin size={11} className="inline-icon" aria-hidden="true" /> {locations?.pickupLocation || 'VAYRO Vijayawada Central'}
              </span>
            </div>

            <div className="review-duration-pill">
              <CalendarDays size={14} aria-hidden="true" />
              <span>{durationLabel}</span>
            </div>

            <div className="review-date-box">
              <span className="review-date-label">Return</span>
              <strong>{formatDate(dates.returnDate)}</strong>
              <small>{formatTimeDisplay(dates.returnTime)}</small>
              <span className="review-location-text">
                <MapPin size={11} className="inline-icon" aria-hidden="true" /> {locations?.returnLocation || 'VAYRO Vijayawada Central'}
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Driver / Rider Details Card */}
        <GlassCard className="review-section-card">
          <div className="review-section-header">
            <div>
              <p className="eyebrow">{vehicle.vehicleType === 'bike' ? 'Verified rider' : 'Verified driver'}</p>
              <h3>{vehicle.vehicleType === 'bike' ? 'Rider information' : 'Driver information'}</h3>
            </div>
            <UserRound className="review-header-icon" size={20} aria-hidden="true" />
          </div>

          <div className="review-driver-grid">
            <div className="review-driver-item">
              <small>Full name</small>
              <strong>{driverDetails.fullName}</strong>
            </div>
            <div className="review-driver-item">
              <small>Email address</small>
              <strong>{driverDetails.email}</strong>
            </div>
            <div className="review-driver-item">
              <small>Contact phone</small>
              <strong>{driverDetails.phone}</strong>
            </div>
            <div className="review-driver-item">
              <small>Driving license</small>
              <strong>{maskLicenseNumber(driverDetails.licenseNumber)}</strong>
            </div>
          </div>
        </GlassCard>

        {/* Selected Options Card */}
        <GlassCard className="review-section-card">
          <div className="review-section-header">
            <div>
              <p className="eyebrow">Add-ons</p>
              <h3>Selected protection & extras</h3>
            </div>
            <ShieldCheck className="review-header-icon" size={20} aria-hidden="true" />
          </div>

          {pricing.addonsList && pricing.addonsList.length > 0 ? (
            <div className="review-addons-list">
              {pricing.addonsList.map((addon) => (
                <div key={addon.id} className="review-addon-row">
                  <div className="review-addon-info">
                    <CheckCircle2 size={16} className="addon-check-icon" aria-hidden="true" />
                    <div>
                      <strong>{addon.name}</strong>
                      <p>{formatCurrency(addon.pricePerDay)} / day</p>
                    </div>
                  </div>
                  <strong className="review-addon-price">{formatCurrency(addon.total)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="review-no-addons">No optional add-ons selected. Standard complimentary roadside coverage included.</p>
          )}
        </GlassCard>
      </div>

      {/* Right Column: Price Breakdown & Coupon Card */}
      <div className="review-sidebar-column">
        {/* Promo Code Input Card */}
        <GlassCard className="review-coupon-card">
          <div className="coupon-card-header">
            <Tag size={16} className="text-accent" aria-hidden="true" />
            <p className="eyebrow">Have a promo code?</p>
          </div>

          {!appliedCoupon ? (
            <form onSubmit={handleApplyClick} className="coupon-form-row">
              <input
                type="text"
                placeholder="e.g. DRIVE10, WELCOME"
                className="coupon-text-input"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase())
                  setCouponError('')
                }}
              />
              <GlassButton type="submit" size="sm" variant="secondary">
                Apply
              </GlassButton>
            </form>
          ) : (
            <div className="coupon-applied-badge">
              <div>
                <strong className="coupon-applied-code">✓ {appliedCoupon.code}</strong>
                <small>{appliedCoupon.description} (−{formatCurrency(couponDiscountAmount)})</small>
              </div>
              <button
                type="button"
                className="coupon-remove-btn"
                onClick={onRemoveCoupon}
                title="Remove coupon"
                aria-label="Remove coupon"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          )}

          {couponError && <p className="coupon-error-msg">{couponError}</p>}
        </GlassCard>

        {/* Fare Summary Card */}
        <GlassCard className="review-pricing-card">
          <div className="review-pricing-header">
            <div>
              <p className="eyebrow">Fare breakdown</p>
              <h3>Summary</h3>
            </div>
            {onEditSchedule && (
              <button
                type="button"
                className="review-sidebar-modify-link"
                onClick={onEditSchedule}
              >
                Modify
              </button>
            )}
          </div>

          <div className="review-cost-rows">
            <div className="review-cost-row">
              <div>
                <span>Vehicle rental rate</span>
                <small>
                  {isHourly
                    ? `${formatCurrency(pricing.hourlyRate || Math.round(vehicle.dailyRate * 0.14))} / hr (${durationLabel})`
                    : `${formatCurrency(vehicle.dailyRate)} / day (${durationLabel})`}
                </small>
              </div>
              <strong>{formatCurrency(pricing.baseRate || pricing.vehicleTotal)}</strong>
            </div>

            {pricing.discount > 0 && (
              <div className="review-cost-row review-discount-row">
                <div className="discount-label-wrap">
                  <Sparkles size={13} aria-hidden="true" />
                  <span>Duration savings</span>
                  <small>Applied discount</small>
                </div>
                <strong className="discount-amount">−{formatCurrency(pricing.discount)}</strong>
              </div>
            )}

            {appliedCoupon && couponDiscountAmount > 0 && (
              <div className="review-cost-row review-discount-row">
                <div className="discount-label-wrap">
                  <Tag size={13} aria-hidden="true" />
                  <span>Promo code ({appliedCoupon.code})</span>
                  <small>Discount applied</small>
                </div>
                <strong className="discount-amount">−{formatCurrency(couponDiscountAmount)}</strong>
              </div>
            )}

            {pricing.addonsList && pricing.addonsList.length > 0 && (
              <div className="review-cost-row">
                <div>
                  <span>Optional add-ons</span>
                  <small>{pricing.addonsList.length} {pricing.addonsList.length === 1 ? 'item' : 'items'} selected</small>
                </div>
                <strong>{formatCurrency(pricing.addonsTotal)}</strong>
              </div>
            )}

            <div className="review-cost-row review-subtotal-row">
              <span>Subtotal</span>
              <strong>{formatCurrency(finalPayable)}</strong>
            </div>
          </div>

          <div className="review-total-block">
            <div>
              <span className="review-total-label">Total payable</span>
              <small>All taxes & complimentary cover included</small>
            </div>
            <strong className="review-total-amount">
              <AnimatedNumber value={finalPayable} format={formatCurrency} />
            </strong>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
