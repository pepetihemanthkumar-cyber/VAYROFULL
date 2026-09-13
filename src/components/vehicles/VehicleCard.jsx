import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  BarChart3,
  Bike,
  CalendarPlus,
  CarFront,
  Eye,
  Fuel,
  Gauge,
  HardHat,
  Heart,
  Users,
  Wind,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GlassBadge } from '../ui/GlassBadge'
import { GlassButton } from '../ui/GlassButton'
import { GlassCard } from '../ui/GlassCard'
import {
  getCompareVehicleIds,
  getFavoriteVehicleIds,
  toggleCompareVehicle,
  toggleFavoriteVehicle,
} from '../../services/vehicleService'
import { formatCurrency, formatStatus } from '../../utils/formatters'
import { VehicleImage } from './VehicleImage'
import { VehicleQuickViewModal } from './VehicleQuickViewModal'

export function VehicleCard({ vehicle, index = 0 }) {
  const isAvailable = vehicle.status === 'AVAILABLE'
  const isBike = vehicle.vehicleType === 'bike'
  const [isFavorite, setIsFavorite] = useState(() => getFavoriteVehicleIds().includes(vehicle.id))
  const [isCompared, setIsCompared] = useState(() => getCompareVehicleIds().includes(vehicle.id))
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)

  useEffect(() => {
    setIsFavorite(getFavoriteVehicleIds().includes(vehicle.id))
    setIsCompared(getCompareVehicleIds().includes(vehicle.id))
  }, [vehicle.id])

  function handleFavoriteToggle(event) {
    event.preventDefault()
    event.stopPropagation()
    const next = toggleFavoriteVehicle(vehicle.id)
    setIsFavorite(next.includes(vehicle.id))
  }

  function handleCompareToggle(event) {
    event.preventDefault()
    event.stopPropagation()
    const next = toggleCompareVehicle(vehicle.id)
    setIsCompared(next.includes(vehicle.id))
  }

  const typeLabel = isBike ? 'Bike' : 'Car'

  return (
    <GlassCard className="vehicle-card" style={{ '--card-index': index }}>
      <div className="vehicle-card-media-wrap">
        <Link to={`/vehicles/${vehicle.id}`} className="vehicle-card-media-link" aria-label={`View details for ${vehicle.name}`}>
          <VehicleImage vehicle={vehicle} className="vehicle-card-image" priority={index < 4} />
        </Link>
        <div className="vehicle-card-top-actions">
          <button
            type="button"
            className={`utility-icon-button ${isFavorite ? 'is-active' : ''}`}
            onClick={handleFavoriteToggle}
            aria-label={isFavorite ? `Remove ${vehicle.name} from wishlist` : `Save ${vehicle.name} to wishlist`}
            title={isFavorite ? 'Saved to wishlist' : 'Add to wishlist'}
          >
            <Heart size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`utility-icon-button ${isCompared ? 'is-active' : ''}`}
            onClick={handleCompareToggle}
            aria-label={isCompared ? `Remove ${vehicle.name} from comparison` : `Compare ${vehicle.name}`}
            title={isCompared ? 'Selected for comparison' : `Compare ${typeLabel.toLowerCase()}`}
          >
            <BarChart3 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="vehicle-card-body">
        <div className="vehicle-card-meta">
          <span className="vehicle-type-tag">
            {isBike ? <Bike size={11} className="inline-icon" /> : <CarFront size={11} className="inline-icon" />}
            {typeLabel}
          </span>
          <span>{vehicle.category || vehicle.type}</span>
          <span>{vehicle.class || 'Standard'}</span>
        </div>

        <div className="vehicle-card-heading">
          <h2>
            <Link to={`/vehicles/${vehicle.id}`} className="vehicle-title-link">
              {vehicle.name}
            </Link>
          </h2>
          <GlassBadge status={vehicle.status}>{formatStatus(vehicle.status)}</GlassBadge>
        </div>
        <p className="vehicle-card-model">{vehicle.model}</p>

        {/* Dynamic specs preview chips (Cars vs Bikes) */}
        <div className="vehicle-card-specs-row" aria-label={`${typeLabel} specifications`}>
          {isBike ? (
            <>
              {vehicle.enginePower ? (
                <span className="vehicle-spec-chip" title={`Power: ${vehicle.enginePower}`}>
                  {vehicle.fuelType === 'Electric' ? <Zap size={12} className="text-accent" aria-hidden="true" /> : <Gauge size={12} aria-hidden="true" />}
                  {vehicle.enginePower}
                </span>
              ) : null}
              {vehicle.transmission && (
                <span className="vehicle-spec-chip" title={`Transmission: ${vehicle.transmission}`}>
                  <Gauge size={12} aria-hidden="true" /> {vehicle.transmission}
                </span>
              )}
              {vehicle.fuelType && (
                <span className="vehicle-spec-chip" title={`Fuel: ${vehicle.fuelType}`}>
                  <Fuel size={12} aria-hidden="true" /> {vehicle.fuelType}
                </span>
              )}
              <span className="vehicle-spec-chip" title="1 Safety Helmet Included">
                <HardHat size={12} aria-hidden="true" /> Helmet inc.
              </span>
            </>
          ) : (
            <>
              {vehicle.seats && (
                <span className="vehicle-spec-chip" title={`${vehicle.seats} Passengers`}>
                  <Users size={12} aria-hidden="true" /> {vehicle.seats} Seats
                </span>
              )}
              {vehicle.transmission && (
                <span className="vehicle-spec-chip" title={`Transmission: ${vehicle.transmission}`}>
                  <Gauge size={12} aria-hidden="true" /> {vehicle.transmission}
                </span>
              )}
              {vehicle.fuelType && (
                <span className="vehicle-spec-chip" title={`Fuel: ${vehicle.fuelType}`}>
                  <Fuel size={12} aria-hidden="true" /> {vehicle.fuelType}
                </span>
              )}
              {vehicle.airConditioning && (
                <span className="vehicle-spec-chip" title="Climate Controlled AC">
                  <Wind size={12} aria-hidden="true" /> AC
                </span>
              )}
            </>
          )}
        </div>

        <div className="vehicle-rate">
          <strong>{formatCurrency(vehicle.pricing?.hourly?.[1] || Math.round(vehicle.dailyRate * (isBike ? 0.13 : 0.14)))}</strong>
          <span>/ hour</span>
          <strong>{formatCurrency(vehicle.pricing?.daily?.[1] || vehicle.dailyRate)}</strong>
          <span>/ day</span>
        </div>

        <div className="vehicle-card-actions">
          <GlassButton as={Link} to={`/vehicles/${vehicle.id}`} variant="secondary" size="sm">
            Details <ArrowUpRight size={14} aria-hidden="true" />
          </GlassButton>
          <GlassButton variant="ghost" size="sm" onClick={() => setIsQuickViewOpen(true)}>
            <Eye size={14} aria-hidden="true" /> Quick view
          </GlassButton>
          {isAvailable && (
            <GlassButton as={Link} to={`/bookings/new?vehicle=${vehicle.id}`} size="sm">
              <CalendarPlus size={14} aria-hidden="true" /> Book now
            </GlassButton>
          )}
        </div>
      </div>

      <VehicleQuickViewModal
        vehicle={vehicle}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </GlassCard>
  )
}
