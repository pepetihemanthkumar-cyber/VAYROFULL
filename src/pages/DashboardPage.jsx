import {
  ArrowRight,
  BarChart3,
  Bike,
  CalendarDays,
  CarFront,
  CheckCircle2,
  CircleX,
  Heart,
  HelpCircle,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CancelBookingModal } from '../components/bookings/CancelBookingModal'
import { ReturnVehicleModal } from '../components/bookings/ReturnVehicleModal'
import { RecentlyViewedRail } from '../components/dashboard/RecentlyViewedRail'
import { RecommendedVehicles } from '../components/dashboard/RecommendedVehicles'
import { StatisticCard } from '../components/dashboard/StatisticCard'
import { GlassBadge } from '../components/ui/GlassBadge'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassCard } from '../components/ui/GlassCard'
import { VehicleImage } from '../components/vehicles/VehicleImage'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  cancelCustomerBooking,
  getActiveBookings,
  getBookingWithVehicle,
  getBookingsForCustomer,
  getStoredActivities,
  getUpcomingBooking,
  returnCustomerRental,
} from '../services/bookingService'
import {
  getCompareVehicleIds,
  getFavoriteVehicles,
  getRecentVehicleSearches,
  getVehicles,
} from '../services/vehicleService'
import { formatCurrency, formatDate, formatStatus } from '../utils/formatters'

const activityIcons = { confirmed: CheckCircle2, returned: RotateCcw, cancelled: CircleX }

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [dashboardData, setDashboardData] = useState({
    availableVehicles: 0,
    activeRentals: 0,
    upcomingCount: 0,
    primaryRental: null,
    activeBooking: null,
    upcomingBooking: null,
    activities: [],
    customerBookings: [],
  })
  const [favoriteVehicles, setFavoriteVehicles] = useState([])
  const [compareCount, setCompareCount] = useState(0)

  // Modals for dashboard actions
  const [cancelTarget, setCancelTarget] = useState(null)
  const [returnTarget, setReturnTarget] = useState(null)

  function loadDashboard() {
    if (!user?.id) return

    const totalFleet = getVehicles().filter((v) => v.status === 'AVAILABLE').length
    const activeList = getActiveBookings(user.id)
    const upcoming = getBookingWithVehicle(getUpcomingBooking(user.id))
    const customerBookings = getBookingsForCustomer(user.id)
    const upcomingCount = customerBookings.filter((b) => b.status === 'CONFIRMED').length
    const activities = getStoredActivities()

    const activeBooking = activeList.length > 0 ? getBookingWithVehicle(activeList[0]) : null
    const primaryRental = activeBooking || upcoming

    setDashboardData({
      availableVehicles: Math.max(0, totalFleet - activeList.length),
      activeRentals: activeList.length,
      upcomingCount,
      primaryRental,
      activeBooking,
      upcomingBooking: upcoming,
      activities,
      customerBookings,
    })
    setFavoriteVehicles(getFavoriteVehicles())
    setCompareCount(getCompareVehicleIds().length)
  }

  useEffect(() => {
    loadDashboard()
  }, [user?.id])

  async function handleConfirmCancel(bookingId) {
    try {
      await cancelCustomerBooking(bookingId)
      toast.success('Reservation cancelled.')
      setCancelTarget(null)
      loadDashboard()
    } catch (err) {
      toast.error(err.message || 'Failed to cancel reservation.')
    }
  }

  async function handleConfirmReturn(bookingId) {
    try {
      await returnCustomerRental(bookingId)
      toast.success('Vehicle returned successfully.')
      setReturnTarget(null)
      loadDashboard()
    } catch (err) {
      toast.error(err.message || 'Failed to return vehicle.')
    }
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'there'
  const {
    availableVehicles,
    activeRentals,
    upcomingCount,
    primaryRental,
    activeBooking,
    upcomingBooking,
    activities,
    customerBookings,
  } = dashboardData

  const favoritePreview = useMemo(() => favoriteVehicles.slice(0, 3), [favoriteVehicles])

  return (
    <section className="customer-dashboard">
      {/* Intro Header */}
      <div className="dashboard-intro">
        <p className="eyebrow">Your VAYRO workspace</p>
        <h2>{getGreeting()}, {firstName}.</h2>
        <p>Manage your active rentals, explore personalized fleet recommendations, and reserve next journeys.</p>
      </div>

      {/* Quick Actions Rail */}
      <div className="dashboard-quick-actions">
        <Link to="/cars" className="quick-action-pill">
          <CarFront size={16} aria-hidden="true" /> Cars (135)
        </Link>
        <Link to="/bikes" className="quick-action-pill">
          <Bike size={16} aria-hidden="true" /> Bikes (72)
        </Link>
        <Link to="/bookings" className="quick-action-pill">
          <CalendarDays size={16} aria-hidden="true" /> My bookings ({customerBookings.length})
        </Link>
        <Link to="/vehicles?filter=favorites" className="quick-action-pill">
          <Heart size={16} aria-hidden="true" /> Wishlist ({favoriteVehicles.length})
        </Link>
        <Link to="/vehicles?filter=compare" className="quick-action-pill">
          <BarChart3 size={16} aria-hidden="true" /> Compare ({compareCount})
        </Link>
      </div>

      {/* WHAT ARE YOU LOOKING FOR? Fleet Explorer Cards */}
      <div className="dashboard-fleet-explorer">
        <div className="fleet-explorer-header">
          <p className="eyebrow">Explore Rental Types</p>
          <h3>What are you looking for?</h3>
        </div>
        <div className="fleet-explorer-grid">
          <Link to="/cars" className="fleet-explorer-card fleet-explorer-card--cars">
            <div className="explorer-card-content">
              <span className="explorer-card-badge">135 Models</span>
              <div className="explorer-card-title-row">
                <CarFront size={24} className="text-accent" />
                <h4>Cars & SUVs</h4>
              </div>
              <p>Premium sedans, versatile SUVs, family MUVs, and luxury executive cars across 20 brands.</p>
              <span className="explorer-card-link">Browse Cars <ArrowRight size={14} /></span>
            </div>
          </Link>
          <Link to="/bikes" className="fleet-explorer-card fleet-explorer-card--bikes">
            <div className="explorer-card-content">
              <span className="explorer-card-badge">72 Models</span>
              <div className="explorer-card-title-row">
                <Bike size={24} className="text-accent" />
                <h4>Bikes & Scooters</h4>
              </div>
              <p>Cruisers, supersports, adventure tourers, daily commuters, and smart EVs across 16 brands.</p>
              <span className="explorer-card-link">Browse Bikes <ArrowRight size={14} /></span>
            </div>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="dashboard-stats">
        <StatisticCard
          icon={CarFront}
          value={availableVehicles}
          label="Available vehicles"
          supportingText="Ready for booking"
        />
        <StatisticCard
          icon={RotateCcw}
          value={activeRentals}
          label="Active rental"
          supportingText={activeRentals ? 'Currently on the road' : 'Nothing in progress'}
        />
        <StatisticCard
          icon={CalendarDays}
          value={upcomingCount}
          label="Upcoming bookings"
          supportingText={upcomingCount ? 'Your next trip is arranged' : 'Plan your next drive'}
        />
      </div>

      {/* Active Rental or Upcoming Highlight Card */}
      {primaryRental ? (
        <div>
          <GlassCard className="dashboard-primary-card">
            <div className="primary-card-header">
              <div>
                <p className="eyebrow">
                  {primaryRental.status === 'ACTIVE' ? 'Active on the Road' : 'Next Journey Arranged'}
                </p>
                <h3>{primaryRental.vehicle ? primaryRental.vehicle.name : 'Reserved vehicle'}</h3>
              </div>
              <GlassBadge status={primaryRental.status}>{formatStatus(primaryRental.status)}</GlassBadge>
            </div>

            <div className="primary-card-body">
              {primaryRental.vehicle && (
                <VehicleImage vehicle={primaryRental.vehicle} className="primary-vehicle-image" />
              )}
              <div className="primary-trip-info">
                <div className="primary-schedule-grid">
                  <div>
                    <small>Pick-up</small>
                    <strong>{formatDate(primaryRental.pickupDate)} · {primaryRental.pickupTime || '10:00 AM'}</strong>
                    <span className="hub-text">
                      <MapPin size={11} className="inline-icon" /> {primaryRental.pickupLocation || 'VAYRO Central Hub'}
                    </span>
                  </div>
                  <div>
                    <small>Return</small>
                    <strong>{formatDate(primaryRental.returnDate)} · {primaryRental.returnTime || '10:00 AM'}</strong>
                    <span className="hub-text">
                      <MapPin size={11} className="inline-icon" /> {primaryRental.returnLocation || 'VAYRO Central Hub'}
                    </span>
                  </div>
                  <div>
                    <small>Duration</small>
                    <strong>{primaryRental.durationLabel || `${primaryRental.rentalDays || 1} days`}</strong>
                    <span className="hub-text">{formatCurrency(primaryRental.totalAmount)}</span>
                  </div>
                </div>

                <div className="primary-actions-row">
                  <GlassButton as={Link} to={`/bookings/${primaryRental.id}`} size="sm">
                    View reservation <ArrowRight size={14} aria-hidden="true" />
                  </GlassButton>

                  {primaryRental.status === 'ACTIVE' && (
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setReturnTarget(primaryRental)}
                    >
                      <RotateCcw size={14} aria-hidden="true" /> Return vehicle
                    </GlassButton>
                  )}

                  {primaryRental.status === 'CONFIRMED' && (
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setCancelTarget(primaryRental)}
                    >
                      <CircleX size={14} aria-hidden="true" /> Cancel booking
                    </GlassButton>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : (
        <div>
          <GlassCard className="dashboard-first-booking-card">
            <div className="first-booking-content">
              <Sparkles size={28} className="text-accent" aria-hidden="true" />
              <div>
                <h4>Book your first drive</h4>
                <p>Choose from 207 models across 36 global brands with flexible hourly, daily, and long-term rental rates.</p>
              </div>
            </div>
            <GlassButton as={Link} to="/vehicles">
              Browse 207 models <ArrowRight size={15} aria-hidden="true" />
            </GlassButton>
          </GlassCard>
        </div>
      )}

      {/* Tailored Fleet Recommendations */}
      <RecommendedVehicles />

      {/* Recently Viewed Vehicles */}
      <RecentlyViewedRail />

      {/* Cancellation Dialog */}
      <CancelBookingModal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        booking={cancelTarget}
      />

      {/* Return Dialog */}
      <ReturnVehicleModal
        isOpen={Boolean(returnTarget)}
        onClose={() => setReturnTarget(null)}
        onConfirm={handleConfirmReturn}
        booking={returnTarget}
      />
    </section>
  )
}
