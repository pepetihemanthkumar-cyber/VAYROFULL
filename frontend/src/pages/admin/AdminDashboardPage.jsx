import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CalendarPlus,
  CarFront,
  CheckCircle2,
  CircleX,
  CreditCard,
  Eye,
  Plus,
  RotateCcw,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fadeUp } from '../../animations/variants'
import { AdminAnalyticsCharts } from '../../components/admin/AdminAnalyticsCharts'
import { AdminStatCard } from '../../components/admin/AdminStatCard'
import { FleetStatusOverview } from '../../components/admin/FleetStatusOverview'
import { GlassBadge } from '../../components/ui/GlassBadge'
import { GlassButton } from '../../components/ui/GlassButton'
import { GlassCard } from '../../components/ui/GlassCard'
import { fetchAllBookings, getStoredActivities } from '../../services/bookingService'
import { fetchVehicles, getVehicles } from '../../services/vehicleService'
import { formatCurrency, formatDate, formatStatus } from '../../utils/formatters'

const activityIcons = { confirmed: CheckCircle2, returned: RotateCcw, cancelled: CircleX }

export default function AdminDashboardPage() {
  const [vehicles, setVehicles] = useState(() => getVehicles())
  const [bookings, setBookings] = useState([])
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)

    Promise.all([
      fetchVehicles({ size: 300 }).catch(() => ({ content: getVehicles() })),
      fetchAllBookings({ size: 200 }).catch(() => []),
    ])
      .then(([vehiclesRes, bookingsRes]) => {
        if (!isCancelled) {
          setVehicles(vehiclesRes.content || getVehicles())
          setBookings(bookingsRes || [])
          setActivities(getStoredActivities())
        }
      })
      .catch(() => { })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const availableCount = vehicles.filter((v) => v.status === 'AVAILABLE').length
  const rentedCount = vehicles.filter((v) => v.status === 'RENTED').length
  const maintenanceCount = vehicles.filter((v) => v.status === 'MAINTENANCE').length
  const activeBookingsCount = bookings.filter((b) => b.status === 'ACTIVE').length
  const upcomingBookingsCount = bookings.filter((b) => b.status === 'CONFIRMED').length
  const completedBookingsCount = bookings.filter((b) => b.status === 'COMPLETED').length
  const cancelledBookingsCount = bookings.filter((b) => b.status === 'CANCELLED').length

  const totalRevenue = useMemo(() => {
    return bookings.reduce(
      (sum, b) => (b.status !== 'CANCELLED' ? sum + (b.totalAmount || 0) : sum),
      0,
    )
  }, [bookings])

  const recentBookings = bookings.slice(0, 5)

  return (
    <section className="admin-dashboard-page">
      {/* Header Banner */}
      <motion.div
        className="admin-dashboard-header"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <div>
          <p className="eyebrow">Fleet Operations Command</p>
          <h2>Fleet & Analytics Overview</h2>
          <p>Monitor real-time vehicle status, reservations, revenue performance, and transit hub operations.</p>
        </div>
        <div className="admin-header-actions">
          <GlassButton as={Link} to="/admin/vehicles/new">
            <Plus size={16} aria-hidden="true" /> Add vehicle
          </GlassButton>
          <GlassButton as={Link} to="/admin/vehicles" variant="secondary">
            Manage fleet
          </GlassButton>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div
        className="admin-kpi-grid"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0.06}
      >
        <AdminStatCard
          icon={CarFront}
          label="Total Fleet"
          value={vehicles.length}
          supportingText="36 Brands · 207 Models"
          tone="accent"
        />
        <AdminStatCard
          icon={CheckCircle2}
          label="Available Fleet"
          value={availableCount}
          supportingText="Ready for instant rental"
          tone="success"
        />
        <AdminStatCard
          icon={RotateCcw}
          label="Active on Road"
          value={rentedCount}
          supportingText="Customer possession"
          tone="info"
        />
        <AdminStatCard
          icon={CreditCard}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          supportingText={`${bookings.length} reservations recorded`}
          tone="success"
        />
        <AdminStatCard
          icon={CalendarDays}
          label="Active Bookings"
          value={activeBookingsCount}
          supportingText="Ongoing journeys"
          tone="info"
        />
        <AdminStatCard
          icon={CalendarPlus}
          label="Upcoming Bookings"
          value={upcomingBookingsCount}
          supportingText="Confirmed future dates"
          tone="warning"
        />
      </motion.div>

      {/* Fleet Distribution Overview Bar */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.1}>
        <FleetStatusOverview vehicles={vehicles} />
      </motion.div>

      {/* Analytics Visual Charts (Feature 9) */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.14}>
        <AdminAnalyticsCharts bookings={bookings} vehicles={vehicles} />
      </motion.div>

      {/* Bottom Content Grid: Recent Bookings + Fleet Activity */}
      <div className="admin-content-split">
        {/* Recent Bookings Section */}
        <motion.section
          className="admin-recent-bookings-section"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.18}
        >
          <div className="section-title">
            <div>
              <p className="eyebrow">Reservations</p>
              <h3>Recent Bookings</h3>
            </div>
            <Link to="/admin/bookings" className="section-see-all-link">
              View all ({bookings.length}) <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <GlassCard className="admin-recent-bookings-card">
            {recentBookings.length > 0 ? (
              <div className="admin-recent-bookings-list">
                {recentBookings.map((b) => {
                  const vehicle = b.vehicle
                  return (
                    <div key={b.id} className="admin-recent-booking-item">
                      <div className="booking-item-primary">
                        <span className="booking-ref-code">{b.id}</span>
                        <div>
                          <strong>{vehicle ? vehicle.name : 'Vehicle'}</strong>
                          <p>{formatDate(b.pickupDate)} → {formatDate(b.returnDate)} · {b.durationLabel || `${b.rentalDays} days`}</p>
                          {b.returnedAt && b.status === 'RETURNED' && (
                            <small className="booking-returned-subtext" style={{ color: '#10b981', display: 'block', fontWeight: 600 }}>
                              Returned: {formatDate(b.returnedAt)} at {String(b.returnedAt).includes('T') ? String(b.returnedAt).slice(11, 16) : '10:00'}
                            </small>
                          )}
                          <small className="booking-hub-subtext">
                            Depot: {b.pickupLocation || 'VAYRO Vijayawada Central'}
                          </small>
                        </div>
                      </div>

                      <div className="booking-item-secondary">
                        <GlassBadge status={b.status}>{b.status === 'RETURNED' ? 'RETURNED' : formatStatus(b.status)}</GlassBadge>
                        <strong className="booking-item-amount">{formatCurrency(b.totalAmount)}</strong>
                        <GlassButton
                          as={Link}
                          to={`/admin/bookings/${b.id}`}
                          variant="ghost"
                          size="sm"
                          aria-label={`View booking ${b.id}`}
                        >
                          <Eye size={14} aria-hidden="true" /> Details
                        </GlassButton>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-bookings-notice">
                <CalendarDays size={28} aria-hidden="true" />
                <p>No bookings logged yet in the system.</p>
              </div>
            )}
          </GlassCard>
        </motion.section>

        {/* Fleet Operations Activity Stream */}
        <motion.section
          className="admin-activity-stream-section"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.22}
        >
          <div className="section-title">
            <div>
              <p className="eyebrow">Audit Log</p>
              <h3>Fleet Activity</h3>
            </div>
          </div>

          <GlassCard className="admin-activity-stream-card">
            {activities.length > 0 ? (
              <div className="admin-activity-stream-list">
                {activities.slice(0, 7).map((act, index) => {
                  const Icon = activityIcons[act.type] || CheckCircle2
                  return (
                    <div key={`${act.type}-${index}`} className="activity-stream-item">
                      <span className={`activity-item-icon activity-item-icon--${act.type}`}>
                        <Icon size={14} aria-hidden="true" />
                      </span>
                      <div className="activity-item-content">
                        <strong>{act.title}</strong>
                        <p>{act.detail}</p>
                      </div>
                      <time className="activity-item-time">{act.occurredAt}</time>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-activity-notice">
                <p>No recent activity recorded.</p>
              </div>
            )}
          </GlassCard>
        </motion.section>
      </div>
    </section>
  )
}
