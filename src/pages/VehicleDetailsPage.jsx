import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  CalendarPlus,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gauge,
  HardHat,
  ShieldCheck,
  Snowflake,
  UsersRound,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { GlassBadge } from '../components/ui/GlassBadge'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassCard } from '../components/ui/GlassCard'
import { VehicleCard } from '../components/vehicles/VehicleCard'
import { VehicleImage } from '../components/vehicles/VehicleImage'
import { VehicleReviews } from '../components/vehicles/VehicleReviews'
import { checkBookingAvailability } from '../services/bookingService'
import { recordRecentlyViewed } from '../services/recentlyViewedService'
import { fetchVehicleById, fetchVehicles, getVehicleById, getVehicles } from '../services/vehicleService'
import { formatCurrency, formatStatus } from '../utils/formatters'
import {
  addDays,
  calculateRentalDuration,
  calculateRentalPrice,
  dateToInputValue,
} from '../utils/rental'

const durationGroups = [
  { type: 'HOURS', label: 'Hourly', values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12] },
  { type: 'DAYS', label: 'Daily', values: [1, 2, 3, 4, 5, 6, 7] },
  { type: 'LONG_TERM', label: 'Long term', values: [14, 21, 30] },
]

function getRelatedVehicles(currentVehicle, allVehicles) {
  const currentType = currentVehicle.vehicleType || 'car'
  return allVehicles
    .filter((item) => item.id !== currentVehicle.id && (item.vehicleType || 'car') === currentType)
    .map((item) => ({
      item,
      score:
        (item.class === currentVehicle.class ? 5 : 0) +
        ((item.category || item.type) === (currentVehicle.category || currentVehicle.type) ? 3 : 0) +
        (item.brand === currentVehicle.brand ? 2 : 0) -
        Math.abs(item.dailyRate - currentVehicle.dailyRate) / 10000,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ item }) => item)
}

function formatDuration(type, value) {
  if (type === 'HOURS') return `${value} ${value === 1 ? 'hour' : 'hours'}`
  return `${value} ${value === 1 ? 'day' : 'days'}`
}

function DetailItem({ label, value }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="vehicle-info-item">
      <small>{label}</small>
      <strong>{String(value)}</strong>
    </div>
  )
}

function Gallery({ vehicle }) {
  const rawGallery = vehicle.images?.gallery || []
  const gallery = rawGallery.length >= 2
    ? rawGallery.slice(0, 2)
    : [vehicle.images?.primary || vehicle.image, ...rawGallery].filter(Boolean).slice(0, 2)
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = gallery[activeIndex] || vehicle.image

  return (
    <div className="vehicle-gallery">
      <div className="vehicle-gallery-main">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeImage}
            initial={{ opacity: 0.45, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.45 }}
            transition={{ duration: 0.2 }}
          >
            <VehicleImage vehicle={{ ...vehicle, image: activeImage }} className="vehicle-detail-image" priority />
          </motion.div>
        </AnimatePresence>
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              className="gallery-control gallery-control--prev"
              onClick={() => setActiveIndex((activeIndex - 1 + gallery.length) % gallery.length)}
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="gallery-control gallery-control--next"
              onClick={() => setActiveIndex((activeIndex + 1) % gallery.length)}
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
            <span className="gallery-counter">
              {activeIndex + 1} / {gallery.length}
            </span>
          </>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="vehicle-gallery-thumbnails">
          {gallery.map((img, index) => (
            <button
              key={index}
              type="button"
              className={`gallery-thumb ${index === activeIndex ? 'is-active' : ''}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`View photo ${index + 1}`}
            >
              <img src={img} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function VehicleDetailsPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(() => getVehicleById(id))
  const [allVehicles, setAllVehicles] = useState(() => getVehicles())
  const [isLoading, setIsLoading] = useState(() => !getVehicleById(id))

  useEffect(() => {
    let isCancelled = false
    async function load() {
      try {
        const fetched = await fetchVehicleById(id)
        if (!isCancelled && fetched) {
          setVehicle(fetched)
        }
      } catch {
        // preserve cached or fallback
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    load()
    if (allVehicles.length === 0) {
      fetchVehicles().then((res) => {
        if (!isCancelled && res.content) setAllVehicles(res.content)
      }).catch(() => {})
    }

    return () => {
      isCancelled = true
    }
  }, [id])

  useEffect(() => {
    if (vehicle) {
      recordRecentlyViewed(vehicle.id)
    }
  }, [vehicle])

  const [duration, setDuration] = useState({ type: 'DAYS', value: 1 })
  const [schedule, setSchedule] = useState(() => {
    const today = new Date()
    const tomorrow = addDays(today, 1)
    return {
      pickupDate: dateToInputValue(today),
      pickupTime: '10:00',
      returnDate: dateToInputValue(tomorrow),
      returnTime: '10:00',
    }
  })

  const [availability, setAvailability] = useState({ available: true })

  useEffect(() => {
    if (!vehicle) return
    let isCancelled = false
    const pTime = schedule.pickupTime?.length === 5 ? `${schedule.pickupTime}:00` : (schedule.pickupTime || '10:00:00')
    const rTime = schedule.returnTime?.length === 5 ? `${schedule.returnTime}:00` : (schedule.returnTime || '10:00:00')
    const pickupDateTime = `${schedule.pickupDate}T${pTime}`
    const returnDateTime = `${schedule.returnDate}T${rTime}`

    checkBookingAvailability(vehicle.id, pickupDateTime, returnDateTime)
      .then((res) => {
        if (!isCancelled) setAvailability(res)
      })
      .catch(() => {
        if (!isCancelled) setAvailability({ available: false, reason: 'Availability check failed' })
      })

    return () => {
      isCancelled = true
    }
  }, [vehicle?.id, schedule])

  if (isLoading) {
    return <div className="route-loading" aria-label="Loading vehicle details" />
  }

  if (!vehicle) {
    return <Navigate to="/vehicles" replace />
  }

  const isBike = vehicle.vehicleType === 'bike'
  const isEv = vehicle.fuelType === 'Electric'
  const typeLabel = isBike ? 'Bike' : 'Car'
  const cataloguePath = isBike ? '/bikes' : '/cars'

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate(cataloguePath)
    }
  }

  const pricing = calculateRentalPrice(vehicle, duration.type, duration.value)
  const scheduleDuration = calculateRentalDuration(
    schedule.pickupDate,
    schedule.pickupTime,
    schedule.returnDate,
    schedule.returnTime,
  )
  const rates = vehicle.pricing || {}
  const relatedVehicles = getRelatedVehicles(vehicle, allVehicles)
  const category = vehicle.category || vehicle.type
  const vehicleClass = vehicle.class || 'Unspecified'

  const info = isBike
    ? [
        ['Brand', vehicle.brand],
        ['Model', vehicle.model],
        ['Year', vehicle.year],
        ['Category', category],
        ['Class', vehicleClass],
        ['Engine & Power', vehicle.enginePower],
        ['Fuel Type', vehicle.fuelType],
        ['Transmission', vehicle.transmission],
        ['Seating Capacity', '2 Riders'],
        ['Safety Equipment', vehicle.helmetsIncluded || '1 DOT Helmet Included'],
      ]
    : [
        ['Brand', vehicle.brand],
        ['Model', vehicle.model],
        ['Year', vehicle.year],
        ['Category', category],
        ['Class', vehicleClass],
        ['Fuel', vehicle.fuelType],
        ['Transmission', vehicle.transmission],
        ['Seats', `${vehicle.seats} Passengers`],
        ['Air Conditioning', vehicle.airConditioning ? 'Climate Controlled' : 'No'],
      ]

  function handleDurationChange(type, value) {
    setDuration({ type, value })
    const start = new Date(`${schedule.pickupDate}T${schedule.pickupTime}:00`)
    const end = new Date(start.getTime() + (type === 'HOURS' ? value : value * 24) * 3600000)
    setSchedule((current) => ({
      ...current,
      returnDate: dateToInputValue(end),
      returnTime: end.toTimeString().slice(0, 5),
    }))
  }

  return (
    <section className="vehicle-detail-page">
      <div className="rental-availability" role="status">
        <span className={availability?.available ? 'is-available' : 'is-unavailable'}>
          {availability?.available ? `Available for these times` : availability?.reason || 'Checking availability'}
        </span>
      </div>

      <div>
        <div className="vehicle-breadcrumbs">
          <Link to={cataloguePath}>{isBike ? 'Bikes' : 'Cars'}</Link>
          <span>/</span>
          <Link to={`${cataloguePath}?category=${category}`}>{category}</Link>
          <span>/</span>
          <Link to={`${cataloguePath}?brand=${encodeURIComponent(vehicle.brand)}`}>{vehicle.brand}</Link>
          <span>/</span>
          <span>{vehicleClass}</span>
          <span>/</span>
          <strong>{vehicle.model}</strong>
        </div>
        <GlassButton onClick={handleBack} variant="ghost" size="sm" className="back-link">
          <ArrowLeft size={16} aria-hidden="true" /> All {isBike ? 'bikes' : 'cars'}
        </GlassButton>
      </div>

      <div className="vehicle-detail-grid">
        <Gallery vehicle={vehicle} />
        <div className="vehicle-detail-copy">
          <div className="vehicle-detail-meta">
            <span className="vehicle-type-tag">
              {isBike ? <Bike size={12} className="inline-icon" /> : <CarFront size={12} className="inline-icon" />}
              {typeLabel}
            </span>
            <span>{vehicle.year}</span>
            <span>{category}</span>
            <span>{vehicleClass}</span>
            <GlassBadge status={vehicle.status}>{formatStatus(vehicle.status)}</GlassBadge>
          </div>
          <h2>{vehicle.name}</h2>
          <p className="vehicle-detail-model">{vehicle.brand} · {vehicle.model}</p>

          <div className="vehicle-detail-price-box">
            <span className="price-label">Flexible Rental Rates</span>
            <div className="vehicle-detail-price">
              <strong>{formatCurrency(rates.hourly?.[1] || Math.round(vehicle.dailyRate * (isBike ? 0.13 : 0.14)))}</strong>
              <span>/ hour</span>
            </div>
            <div className="vehicle-detail-price">
              <strong>{formatCurrency(rates.daily?.[1] || vehicle.dailyRate)}</strong>
              <span>/ day</span>
            </div>
          </div>

          {vehicle.status === 'AVAILABLE' ? (
            <GlassButton as={Link} to={`/bookings/new?vehicle=${vehicle.id}`}>
              <CalendarPlus size={17} aria-hidden="true" /> Book now
            </GlassButton>
          ) : (
            <GlassButton variant="secondary" disabled>
              {formatStatus(vehicle.status)}
            </GlassButton>
          )}
        </div>
      </div>

      {/* Specifications */}
      <div>
        <GlassCard className="vehicle-specifications">
          <div className="specifications-heading">
            <p className="eyebrow">At a glance</p>
            <h3>Key specifications</h3>
          </div>
          <div className="specifications-grid">
            {isBike ? (
              <>
                <div className="vehicle-spec">
                  <span>{isEv ? <Zap size={18} className="text-accent" aria-hidden="true" /> : <Gauge size={18} aria-hidden="true" />}</span>
                  <div>
                    <small>{isEv ? 'Motor Power' : 'Engine Power'}</small>
                    <strong>{vehicle.enginePower || 'High Output'}</strong>
                  </div>
                </div>
                <div className="vehicle-spec">
                  <span><Gauge size={18} aria-hidden="true" /></span>
                  <div>
                    <small>Transmission</small>
                    <strong>{vehicle.transmission}</strong>
                  </div>
                </div>
                <div className="vehicle-spec">
                  <span><Fuel size={18} aria-hidden="true" /></span>
                  <div>
                    <small>Fuel Type</small>
                    <strong>{vehicle.fuelType}</strong>
                  </div>
                </div>
                <div className="vehicle-spec">
                  <span><UsersRound size={18} aria-hidden="true" /></span>
                  <div>
                    <small>Capacity</small>
                    <strong>2 Riders</strong>
                  </div>
                </div>
                <div className="vehicle-spec">
                  <span><HardHat size={18} className="text-accent" aria-hidden="true" /></span>
                  <div>
                    <small>Safety Gear</small>
                    <strong>1 Helmet Inc.</strong>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="vehicle-spec">
                  <span><UsersRound size={18} aria-hidden="true" /></span>
                  <div>
                    <small>Seats</small>
                    <strong>{vehicle.seats} Seats</strong>
                  </div>
                </div>
                <div className="vehicle-spec">
                  <span><CarFront size={18} aria-hidden="true" /></span>
                  <div>
                    <small>Doors</small>
                    <strong>{vehicle.doors || '4/5 Doors'}</strong>
                  </div>
                </div>
                <div className="vehicle-spec">
                  <span><Gauge size={18} aria-hidden="true" /></span>
                  <div>
                    <small>Transmission</small>
                    <strong>{vehicle.transmission}</strong>
                  </div>
                </div>
                <div className="vehicle-spec">
                  <span><Fuel size={18} aria-hidden="true" /></span>
                  <div>
                    <small>Fuel</small>
                    <strong>{vehicle.fuelType}</strong>
                  </div>
                </div>
                <div className="vehicle-spec">
                  <span><Snowflake size={18} aria-hidden="true" /></span>
                  <div>
                    <small>Air conditioning</small>
                    <strong>{vehicle.airConditioning ? 'Yes' : 'No'}</strong>
                  </div>
                </div>
              </>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Technical Record & Features */}
      <GlassCard className="vehicle-information-card">
        <div className="section-title">
          <div>
            <p className="eyebrow">Complete Fleet Record</p>
            <h3>{typeLabel} information</h3>
          </div>
        </div>
        <div className="vehicle-information-grid">
          {info.map(([label, value]) => (
            <DetailItem key={label} label={label} value={value} />
          ))}
        </div>
      </GlassCard>

      {(vehicle.features || []).length > 0 && (
        <GlassCard className="vehicle-information-card">
          <div className="section-title">
            <div>
              <p className="eyebrow">Standard Equipment</p>
              <h3>Features & Equipment</h3>
            </div>
          </div>
          <div className="vehicle-features-list">
            {vehicle.features.map((feature) => (
              <span key={feature}>{feature}</span>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Duration Selector & Dynamic Pricing Calculator */}
      <div>
        <GlassCard className="vehicle-pricing-calculator">
          <div className="pricing-calculator-header">
            <div>
              <p className="eyebrow">Tailored pricing</p>
              <h3>Select duration</h3>
            </div>
          </div>

          <div className="duration-group-grid">
            {durationGroups.map((group) => (
              <div key={group.type} className="duration-group">
                <span className="duration-group-label">{group.label}</span>
                <div className="duration-chips">
                  {group.values.map((val) => {
                    const isSelected = duration.type === group.type && duration.value === val
                    const calculated = calculateRentalPrice(vehicle, group.type, val)
                    return (
                      <button
                        key={val}
                        type="button"
                        className={`duration-chip ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => handleDurationChange(group.type, val)}
                        aria-pressed={isSelected}
                      >
                        <span className="duration-chip-title">{formatDuration(group.type, val)}</span>
                        <strong className="duration-chip-price">{formatCurrency(calculated.estimatedTotal)}</strong>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pricing-summary-card">
            <div className="pricing-summary-item">
              <span>Selected duration</span>
              <strong>{formatDuration(duration.type, duration.value)}</strong>
            </div>
            <div className="pricing-summary-item">
              <span>Base rate</span>
              <strong>{formatCurrency(pricing.baseRate)}</strong>
            </div>
            {pricing.discount > 0 && (
              <div className="pricing-summary-item is-discount">
                <span>Long duration discount</span>
                <strong>- {formatCurrency(pricing.discount)}</strong>
              </div>
            )}
            <div className="pricing-summary-item is-total">
              <span>Estimated total</span>
              <strong>{formatCurrency(pricing.estimatedTotal)}</strong>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Reviews & Ratings */}
      <div>
        <VehicleReviews vehicle={vehicle} vehicleId={vehicle.id} vehicleName={vehicle.name} />
      </div>

      {/* Related Fleet Section */}
      {relatedVehicles.length > 0 && (
        <div className="related-vehicles-section">
          <div className="related-vehicles-header">
            <div>
              <p className="eyebrow">Compare & Explore</p>
              <h3>Similar {isBike ? 'bikes & scooters' : 'cars'}</h3>
            </div>
            <GlassButton as={Link} to={cataloguePath} variant="ghost" size="sm">
              View all {isBike ? 'bikes' : 'cars'} <ArrowRight size={14} aria-hidden="true" />
            </GlassButton>
          </div>
          <div className="vehicle-grid">
            {relatedVehicles.map((relVehicle, index) => (
              <VehicleCard key={relVehicle.id} vehicle={relVehicle} index={index} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}