import { motion } from 'framer-motion'
import { BookOpenCheck, CalendarDays, CarFront, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fadeUp } from '../animations/variants'
import { BookingCard } from '../components/bookings/BookingCard'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassCard } from '../components/ui/GlassCard'
import { useAuth } from '../context/AuthContext'
import { getBookingsForCustomer } from '../services/bookingService'

const TABS = [
  { id: 'ALL', label: 'All bookings' },
  { id: 'UPCOMING', label: 'Upcoming' },
  { id: 'ACTIVE', label: 'Active on road' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
]

export default function BookingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('ALL')
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load customer bookings from service
    if (user?.id) {
      const list = getBookingsForCustomer(user.id)
      setBookings(list)
    }
    const timer = window.setTimeout(() => setIsLoading(false), 240)
    return () => window.clearTimeout(timer)
  }, [user?.id])

  const counts = useMemo(() => {
    return {
      ALL: bookings.length,
      UPCOMING: bookings.filter((b) => b.status === 'CONFIRMED').length,
      ACTIVE: bookings.filter((b) => b.status === 'ACTIVE').length,
      COMPLETED: bookings.filter((b) => b.status === 'COMPLETED').length,
      CANCELLED: bookings.filter((b) => b.status === 'CANCELLED').length,
    }
  }, [bookings])

  const filteredBookings = useMemo(() => {
    if (activeTab === 'ALL') return bookings
    if (activeTab === 'UPCOMING') return bookings.filter((b) => b.status === 'CONFIRMED')
    if (activeTab === 'ACTIVE') return bookings.filter((b) => b.status === 'ACTIVE')
    if (activeTab === 'COMPLETED') return bookings.filter((b) => b.status === 'COMPLETED')
    if (activeTab === 'CANCELLED') return bookings.filter((b) => b.status === 'CANCELLED')
    return bookings
  }, [activeTab, bookings])

  return (
    <section className="customer-bookings-page">
      {/* Page Header */}
      <motion.div
        className="bookings-page-heading"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <div>
          <p className="eyebrow">Rental management</p>
          <h2>My Bookings</h2>
          <p>Review and manage all your active, upcoming, and past vehicle journeys.</p>
        </div>
        <GlassButton as={Link} to="/vehicles">
          <Plus size={16} aria-hidden="true" /> New reservation
        </GlassButton>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="bookings-tabs-bar"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0.06}
      >
        <div className="bookings-tabs-container" role="tablist" aria-label="Filter bookings by status">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const count = counts[tab.id] || 0

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`booking-tab-button ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {isActive && (
                  <motion.span
                    className="booking-tab-active-pill"
                    layoutId="booking-tab-active"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="tab-label">{tab.label}</span>
                {count > 0 && <span className="tab-badge">{count}</span>}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Bookings List */}
      <motion.div
        className="bookings-content"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0.12}
      >
        {isLoading ? (
          <div className="bookings-loading-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="booking-card-skeleton" />
            ))}
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="bookings-grid">
            {filteredBookings.map((booking, index) => (
              <BookingCard key={booking.id} booking={booking} index={index} />
            ))}
          </div>
        ) : (
          <GlassCard className="bookings-empty-state">
            <span className="empty-icon-wrap">
              <CalendarDays size={26} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h3>No {activeTab === 'ALL' ? '' : activeTab.toLowerCase()} bookings found</h3>
            <p>
              {activeTab === 'ALL'
                ? 'You do not have any vehicle reservations yet. Find a vehicle to plan your next journey.'
                : `You do not have any ${activeTab.toLowerCase()} reservations at the moment.`}
            </p>
            <GlassButton as={Link} to="/vehicles" variant="secondary">
              <CarFront size={16} aria-hidden="true" /> Browse fleet
            </GlassButton>
          </GlassCard>
        )}
      </motion.div>
    </section>
  )
}
