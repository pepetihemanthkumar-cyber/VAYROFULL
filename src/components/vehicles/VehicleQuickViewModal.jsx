import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Bike,
  CalendarPlus,
  CarFront,
  CheckCircle2,
  Fuel,
  Gauge,
  HardHat,
  ShieldCheck,
  Sparkles,
  Users,
  Wind,
  X,
  Zap,
} from 'lucide-react'
import { GlassBadge } from '../ui/GlassBadge'
import { GlassButton } from '../ui/GlassButton'
import { VehicleImage } from './VehicleImage'
import { formatCurrency, formatStatus } from '../../utils/formatters'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import {
  quickViewBackdropVariants,
  quickViewModalVariants,
  quickViewImageVariants,
} from '../../animations/variants'

export function VehicleQuickViewModal({ vehicle, isOpen, onClose }) {
  useEscapeKey(isOpen, onClose)

  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  if (typeof document === 'undefined') return null

  const isAvailable = vehicle?.status === 'AVAILABLE'
  const isBike =
    vehicle?.vehicleType === 'bike' ||
    vehicle?.type === 'bike' ||
    vehicle?.category?.toLowerCase().includes('bike') ||
    vehicle?.category?.toLowerCase().includes('scooter') ||
    vehicle?.category?.toLowerCase().includes('motorcycle')
  const typeLabel = isBike ? 'Bike' : 'Car'

  const hourlyRate =
    vehicle?.pricing?.hourly?.[1] ||
    Math.round((vehicle?.dailyRate || 0) * (isBike ? 0.13 : 0.14))
  const dailyRate = vehicle?.pricing?.daily?.[1] || vehicle?.dailyRate || 0
  const monthlyRate =
    vehicle?.pricing?.longTerm?.[30] ||
    (dailyRate ? Math.round(dailyRate * 30 * 0.75) : null)

  return createPortal(
    <AnimatePresence>
      {isOpen && vehicle && (
        <div
          className="vayro-qv-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`qv-title-${vehicle.id}`}
        >
          <motion.div
            className="vayro-qv-backdrop"
            variants={quickViewBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          <div className="vayro-qv-scroll-wrapper" onClick={onClose}>
            <motion.div
              className="vayro-qv-container"
              variants={quickViewModalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                className="vayro-qv-close-btn"
                onClick={onClose}
                aria-label="Close vehicle quick view"
              >
                <X size={20} />
              </button>

              <div className="vayro-qv-content-grid">
                {/* Left Column: Visual Showcase */}
                <div className="vayro-qv-media-col">
                  <div className="vayro-qv-image-frame">
                    <motion.div
                      className="vayro-qv-image-inner"
                      variants={quickViewImageVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <VehicleImage vehicle={vehicle} className="vayro-qv-image" priority />
                    </motion.div>

                    <div className="vayro-qv-media-badges">
                      <span className="vayro-qv-type-pill">
                        {isBike ? <Bike size={13} /> : <CarFront size={13} />}
                        {typeLabel}
                      </span>
                      <GlassBadge status={vehicle.status}>
                        {formatStatus(vehicle.status)}
                      </GlassBadge>
                    </div>
                  </div>
                </div>

                {/* Right Column: Information & Actions */}
                <div className="vayro-qv-info-col">
                  <div className="vayro-qv-header">
                    <div className="vayro-qv-eyebrow">
                      <span className="vayro-qv-brand-name">{vehicle.brand}</span>
                      <span className="vayro-qv-dot">•</span>
                      <span className="vayro-qv-class-name">
                        {vehicle.class || vehicle.category || 'Standard'}
                      </span>
                      {vehicle.year && (
                        <>
                          <span className="vayro-qv-dot">•</span>
                          <span className="vayro-qv-year">{vehicle.year}</span>
                        </>
                      )}
                    </div>
                    <h2 id={`qv-title-${vehicle.id}`} className="vayro-qv-title">
                      {vehicle.name}
                    </h2>
                    {vehicle.model && vehicle.model !== vehicle.name && (
                      <p className="vayro-qv-model-subtitle">{vehicle.model}</p>
                    )}
                  </div>

                  {/* Specifications Grid */}
                  <div className="vayro-qv-specs-section">
                    <h4 className="vayro-qv-section-title">SPECIFICATIONS</h4>
                    <div className="vayro-qv-specs-grid">
                      {isBike ? (
                        <>
                          <div className="vayro-qv-spec-item">
                            {vehicle.fuelType === 'Electric' ? (
                              <Zap size={15} className="spec-icon text-accent" />
                            ) : (
                              <Gauge size={15} className="spec-icon" />
                            )}
                            <div>
                              <span className="spec-label">Engine / Power</span>
                              <span className="spec-value">
                                {vehicle.enginePower || vehicle.engine || 'Standard Output'}
                              </span>
                            </div>
                          </div>
                          <div className="vayro-qv-spec-item">
                            <Gauge size={15} className="spec-icon" />
                            <div>
                              <span className="spec-label">Transmission</span>
                              <span className="spec-value">
                                {vehicle.transmission || 'Manual'}
                              </span>
                            </div>
                          </div>
                          <div className="vayro-qv-spec-item">
                            <Fuel size={15} className="spec-icon" />
                            <div>
                              <span className="spec-label">Fuel Type</span>
                              <span className="spec-value">
                                {vehicle.fuelType || 'Petrol'}
                              </span>
                            </div>
                          </div>
                          <div className="vayro-qv-spec-item">
                            <HardHat size={15} className="spec-icon" />
                            <div>
                              <span className="spec-label">Safety</span>
                              <span className="spec-value">Helmet Included</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {vehicle.seats && (
                            <div className="vayro-qv-spec-item">
                              <Users size={15} className="spec-icon" />
                              <div>
                                <span className="spec-label">Seating</span>
                                <span className="spec-value">{vehicle.seats} Seats</span>
                              </div>
                            </div>
                          )}
                          <div className="vayro-qv-spec-item">
                            <Gauge size={15} className="spec-icon" />
                            <div>
                              <span className="spec-label">Transmission</span>
                              <span className="spec-value">
                                {vehicle.transmission || 'Automatic'}
                              </span>
                            </div>
                          </div>
                          <div className="vayro-qv-spec-item">
                            <Fuel size={15} className="spec-icon" />
                            <div>
                              <span className="spec-label">Fuel Type</span>
                              <span className="spec-value">
                                {vehicle.fuelType || 'Petrol'}
                              </span>
                            </div>
                          </div>
                          <div className="vayro-qv-spec-item">
                            <Wind size={15} className="spec-icon" />
                            <div>
                              <span className="spec-label">Climate Control</span>
                              <span className="spec-value">
                                {vehicle.airConditioning !== false ? 'Air Conditioning' : 'Standard Air'}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pricing Breakdown Box */}
                  <div className="vayro-qv-pricing-card">
                    <div className="vayro-qv-price-block">
                      <span className="vayro-qv-price-label">Hourly Rate</span>
                      <span className="vayro-qv-price-value">
                        {formatCurrency(hourlyRate)}<small>/hr</small>
                      </span>
                    </div>
                    <div className="vayro-qv-price-divider" />
                    <div className="vayro-qv-price-block highlight">
                      <span className="vayro-qv-price-label">Daily Rate</span>
                      <span className="vayro-qv-price-value">
                        {formatCurrency(dailyRate)}<small>/day</small>
                      </span>
                    </div>
                    {monthlyRate ? (
                      <>
                        <div className="vayro-qv-price-divider" />
                        <div className="vayro-qv-price-block">
                          <span className="vayro-qv-price-label">30-Day Rate</span>
                          <span className="vayro-qv-price-value">
                            {formatCurrency(monthlyRate)}
                          </span>
                        </div>
                      </>
                    ) : null}
                  </div>

                  {/* Highlights/Trust Banner */}
                  <div className="vayro-qv-perks-row">
                    <span className="vayro-qv-perk">
                      <ShieldCheck size={13} /> Fully Insured
                    </span>
                    <span className="vayro-qv-perk">
                      <CheckCircle2 size={13} /> Instant Booking
                    </span>
                    <span className="vayro-qv-perk">
                      <Sparkles size={13} /> Verified Clean
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="vayro-qv-actions">
                    <GlassButton
                      as={Link}
                      to={`/vehicles/${vehicle.id}`}
                      variant="secondary"
                      onClick={onClose}
                      className="vayro-qv-btn-secondary"
                    >
                      Details <ArrowUpRight size={15} aria-hidden="true" />
                    </GlassButton>
                    {isAvailable && (
                      <GlassButton
                        as={Link}
                        to={`/bookings/new?vehicle=${vehicle.id}`}
                        onClick={onClose}
                        className="vayro-qv-btn-primary"
                      >
                        <CalendarPlus size={16} aria-hidden="true" /> Book Now
                      </GlassButton>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
