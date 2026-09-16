import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Edit,
  Fuel,
  Gauge,
  RefreshCw,
  Snowflake,
  UsersRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fadeUp } from '../../animations/variants'
import { VehicleStatusModal } from '../../components/admin/VehicleStatusModal'
import { GlassBadge } from '../../components/ui/GlassBadge'
import { GlassButton } from '../../components/ui/GlassButton'
import { GlassCard } from '../../components/ui/GlassCard'
import { VehicleImage } from '../../components/vehicles/VehicleImage'
import { useToast } from '../../context/ToastContext'
import { getStoredBookings } from '../../services/bookingService'
import { getVehicleById, updateVehicleStatus } from '../../services/vehicleService'
import { formatCurrency, formatDate, formatStatus } from '../../utils/formatters'

function SpecItem({ icon: Icon, label, value }) {
  return (
    <div className="admin-spec-item">
      <span className="spec-icon-box">
        <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

export default function AdminVehicleDetailsPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const [vehicle, setVehicle] = useState(null)
  const [activeBooking, setActiveBooking] = useState(null)
  const [upcomingBookings, setUpcomingBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate('/admin/vehicles')
    }
  }

  function loadData() {
    const loadedVehicle = getVehicleById(id)
    setVehicle(loadedVehicle)

    if (loadedVehicle) {
      const allBookings = getStoredBookings()
      const active = allBookings.find((b) => b.vehicleId === id && b.status === 'ACTIVE')
      const upcoming = allBookings.filter((b) => b.vehicleId === id && b.status === 'CONFIRMED')
      setActiveBooking(active || null)
      setUpcomingBookings(upcoming)
    }
  }

  useEffect(() => {
    loadData()
    setIsLoading(false)
  }, [id])

  async function handleApplyStatus(vehicleId, newStatus) {
    setIsUpdatingStatus(true)
    try {
      await updateVehicleStatus(vehicleId, newStatus)
      loadData()
      toast.success(`Vehicle operational status updated to ${newStatus}.`)
    } catch (err) {
      toast.error(err.message || 'Failed to update vehicle status.')
      throw err
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  if (isLoading) {
    return <div className="route-loading" aria-label="Loading vehicle record" />
  }

  if (!vehicle) {
    return (
      <section className="booking-missing">
        <GlassCard className="booking-missing-card">
          <h2>Vehicle not found</h2>
          <p>The asset identifier ({id}) was not found in the fleet database.</p>
          <GlassButton as={Link} to="/admin/vehicles">Return to fleet</GlassButton>
        </GlassCard>
      </section>
    )
  }

  return (
    <section className="admin-vehicle-details-page">
      {/* Top Header */}
      <motion.div
        className="admin-details-header"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <div className="header-meta">
          <GlassButton onClick={handleBack} variant="ghost" size="sm" className="back-link">
            <ArrowLeft size={16} aria-hidden="true" /> All fleet vehicles
          </GlassButton>
          <div className="title-row">
            <div>
              <p className="eyebrow">Fleet Asset #{vehicle.id}</p>
              <h2>{vehicle.name}</h2>
            </div>
            <GlassBadge status={vehicle.status}>{formatStatus(vehicle.status)}</GlassBadge>
          </div>
        </div>

        <div className="header-actions">
          <GlassButton as={Link} to={`/admin/vehicles/${vehicle.id}/edit`} variant="secondary" size="sm">
            <Edit size={15} aria-hidden="true" /> Edit specifications
          </GlassButton>
          <GlassButton size="sm" onClick={() => setIsStatusModalOpen(true)}>
            <RefreshCw size={14} aria-hidden="true" /> Change status
          </GlassButton>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="admin-details-grid">
        {/* Left Column: Visual & Specs */}
        <div className="admin-details-main">
          {/* Visual Showcase */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.06}>
            <GlassCard className="admin-vehicle-showcase-card">
              <VehicleImage vehicle={vehicle} className="admin-detail-hero-image" priority />
              <div className="showcase-content">
                <div className="showcase-title-block">
                  <div>
                    <h3>{vehicle.brand} · {vehicle.model}</h3>
                    <p className="registration-pill">{vehicle.registrationNumber}</p>
                  </div>
                  <div className="rate-box">
                    <strong>{formatCurrency(vehicle.dailyRate)}</strong>
                    <span>/ day base rate</span>
                  </div>
                </div>
                <p className="showcase-desc">{vehicle.description}</p>
              </div>
            </GlassCard>
          </motion.div>

          {/* Specifications Grid */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.12}>
            <GlassCard className="admin-specs-card">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Technical Registry</p>
                  <h3>Specifications</h3>
                </div>
                <CarFront size={20} className="heading-icon" aria-hidden="true" />
              </div>

              <div className="admin-specs-grid">
                <SpecItem icon={CarFront} label="Category" value={vehicle.type} />
                <SpecItem icon={CalendarDays} label="Model Year" value={vehicle.year} />
                <SpecItem icon={UsersRound} label="Seating Capacity" value={`${vehicle.seats} seats`} />
                <SpecItem icon={Gauge} label="Transmission" value={vehicle.transmission} />
                <SpecItem icon={Fuel} label="Fuel Type" value={vehicle.fuelType} />
                <SpecItem
                  icon={Snowflake}
                  label="Air Conditioning"
                  value={vehicle.airConditioning ? 'Included' : 'Not installed'}
                />
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Right Column: Active Rental & Upcoming Schedule */}
        <div className="admin-details-side">
          {/* Active Rental Card */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.08}>
            <GlassCard className="admin-rental-status-card">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Current Assignment</p>
                  <h3>Active rental status</h3>
                </div>
              </div>

              {activeBooking ? (
                <div className="active-rental-box">
                  <div className="active-rental-badge-row">
                    <GlassBadge status="info">On the road</GlassBadge>
                    <span className="booking-ref">{activeBooking.id}</span>
                  </div>
                  <div className="active-driver-info">
                    <small>Driver in possession</small>
                    <strong>{activeBooking.driverDetails?.fullName}</strong>
                    <span>{activeBooking.driverDetails?.phone}</span>
                  </div>
                  <div className="active-dates-info">
                    <small>Scheduled return</small>
                    <strong>{formatDate(activeBooking.returnDate)}</strong>
                  </div>
                  <div className="active-price-info">
                    <span>Total journey value:</span>
                    <strong>{formatCurrency(activeBooking.totalAmount)}</strong>
                  </div>
                </div>
              ) : (
                <div className="no-active-rental-box">
                  <p>No active on-road journey is currently assigned to this vehicle.</p>
                </div>
              )}
            </GlassCard>
          </motion.div>

          {/* Upcoming Bookings for this vehicle */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.14}>
            <GlassCard className="admin-upcoming-card">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Upcoming Schedule</p>
                  <h3>Reserved dates ({upcomingBookings.length})</h3>
                </div>
              </div>

              {upcomingBookings.length > 0 ? (
                <div className="upcoming-list">
                  {upcomingBookings.map((b) => (
                    <div key={b.id} className="upcoming-item-row">
                      <div>
                        <strong>{b.id}</strong>
                        <small>{b.driverDetails?.fullName}</small>
                      </div>
                      <time>
                        {formatDate(b.pickupDate, { day: 'numeric', month: 'short' })} –{' '}
                        {formatDate(b.returnDate, { day: 'numeric', month: 'short' })}
                      </time>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-upcoming-text">No future reservations currently held for this unit.</p>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Status Modal */}
      <VehicleStatusModal
        isOpen={isStatusModalOpen}
        vehicle={vehicle}
        onClose={() => setIsStatusModalOpen(false)}
        onConfirm={handleApplyStatus}
        isSubmitting={isUpdatingStatus}
      />
    </section>
  )
}
