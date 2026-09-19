import { motion } from 'framer-motion'
import {
  AlertCircle,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fadeUp } from '../../animations/variants'
import { AdminStatCard } from '../../components/admin/AdminStatCard'
import { BookingManagementTable } from '../../components/admin/BookingManagementTable'
import { BookingStatusModal } from '../../components/admin/BookingStatusModal'
import { GlassButton } from '../../components/ui/GlassButton'
import { GlassCard } from '../../components/ui/GlassCard'
import { GlassInput } from '../../components/ui/GlassInput'
import { useToast } from '../../context/ToastContext'
import {
  getAllBookings,
  updateBookingStatus,
} from '../../services/bookingService'


const defaultFilters = {
  search: '',
  status: 'ALL',
  vehicleType: 'ALL',
  dateRange: 'ALL',
  sort: 'RECOMMENDED',
}

function matchDateRange(booking, filter) {
  if (filter === 'ALL') return true
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const pickup = booking.pickupDate
  const returnDate = booking.returnDate

  if (filter === 'TODAY') {
    return pickup <= todayStr && returnDate >= todayStr
  }
  if (filter === 'UPCOMING') {
    return pickup > todayStr
  }
  if (filter === 'PAST') {
    return returnDate < todayStr
  }
  if (filter === 'THIS_WEEK') {
    const endOfWeek = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)
    return pickup <= endOfWeek && returnDate >= todayStr
  }
  return true
}

function sortBookings(list, sort) {
  const next = [...list]
  if (sort === 'NEWEST') return next.sort((a, b) => new Date(b.createdAt || b.pickupDate) - new Date(a.createdAt || a.pickupDate))
  if (sort === 'OLDEST') return next.sort((a, b) => new Date(a.createdAt || a.pickupDate) - new Date(b.createdAt || b.pickupDate))
  if (sort === 'HIGHEST_VALUE') return next.sort((a, b) => b.totalAmount - a.totalAmount)
  if (sort === 'LOWEST_VALUE') return next.sort((a, b) => a.totalAmount - b.totalAmount)
  if (sort === 'START_DATE') return next.sort((a, b) => a.pickupDate.localeCompare(b.pickupDate))
  if (sort === 'RETURN_DATE') return next.sort((a, b) => a.returnDate.localeCompare(b.returnDate))
  // Recommended: Active first, then Confirmed, then newest
  const rank = { ACTIVE: 0, CONFIRMED: 1, COMPLETED: 2, CANCELLED: 3 }
  return next.sort((a, b) => (rank[a.status] || 0) - (rank[b.status] || 0) || new Date(b.createdAt || b.pickupDate) - new Date(a.createdAt || a.pickupDate))
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState(defaultFilters)
  const [activeModalState, setActiveModalState] = useState({ isOpen: false, booking: null, action: null })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  async function loadBookings() {
    setIsLoading(true)
    try {
      const data = await getAllBookings()
      setBookings(data || [])
    } catch (err) {
      toast.error(err.message || 'Failed to load bookings.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const counts = useMemo(() => {
    return {
      total: bookings.length,
      confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
      active: bookings.filter((b) => b.status === 'ACTIVE').length,
      completed: bookings.filter((b) => b.status === 'COMPLETED').length,
      cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
    }
  }, [bookings])

  const filteredBookings = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    const matching = bookings.filter((b) => {
      const searchable = [
        b.id,
        b.driverDetails?.fullName || '',
        b.driverDetails?.email || '',
        b.vehicle?.name || '',
        b.vehicle?.registrationNumber || '',
      ].join(' ').toLowerCase()

      return (
        (!q || searchable.includes(q)) &&
        (filters.status === 'ALL' || b.status === filters.status) &&
        (filters.vehicleType === 'ALL' || b.vehicle?.type === filters.vehicleType) &&
        matchDateRange(b, filters.dateRange)
      )
    })
    return sortBookings(matching, filters.sort)
  }, [bookings, filters])

  const hasActiveFilters = Object.entries(filters).some(
    ([k, val]) => k !== 'sort' && val !== defaultFilters[k],
  )

  function handleFilterChange(e) {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleClearFilters() {
    setFilters(defaultFilters)
  }

  function handleTriggerAction(booking, action) {
    setActiveModalState({ isOpen: true, booking, action })
  }

  async function handleConfirmStatusUpdate(bookingId, newStatus) {
    setIsSubmitting(true)
    try {
      await updateBookingStatus(bookingId, newStatus)
      loadBookings()
      toast.success(`Booking ${bookingId} transitioned to ${newStatus}.`)
    } catch (err) {
      toast.error(err.message || 'Failed to update booking status.')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <section className="admin-fleet-page">
      {/* Header */}
      <motion.div
        className="admin-fleet-header"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <div>
          <p className="eyebrow">Rental Operations Center</p>
          <h2>Booking Operations</h2>
          <p>Monitor and manage fleet reservations, vehicle hand-offs, and journey completions.</p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        className="admin-booking-kpi-grid"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0.06}
      >
        <AdminStatCard icon={CalendarDays} label="Total Bookings" value={counts.total} supportingText="All-time" tone="accent" />
        <AdminStatCard icon={CalendarPlus} label="Confirmed" value={counts.confirmed} supportingText="Reserved" tone="warning" />
        <AdminStatCard icon={RotateCcw} label="Active on Road" value={counts.active} supportingText="In-progress" tone="info" />
        <AdminStatCard icon={CheckCircle2} label="Completed" value={counts.completed} supportingText="Returned" tone="success" />
        <AdminStatCard icon={XCircle} label="Cancelled" value={counts.cancelled} supportingText="Released" tone="attention" />
      </motion.div>

      {/* Filters Toolbar */}
      <motion.div
        className="admin-filters-card"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0.12}
      >
        <div className="admin-filter-bar-top">
          <GlassInput
            className="admin-search-input"
            label="Search Reservations"
            placeholder="Search by ID, customer name, email, vehicle..."
            name="search"
            startIcon={Search}
            value={filters.search}
            onChange={handleFilterChange}
          />

          <div className="glass-select-group admin-sort-select">
            <span>Sort by</span>
            <select name="sort" value={filters.sort} onChange={handleFilterChange}>
              <option value="RECOMMENDED">Recommended (Active first)</option>
              <option value="NEWEST">Newest Created</option>
              <option value="OLDEST">Oldest Created</option>
              <option value="HIGHEST_VALUE">Highest Value</option>
              <option value="LOWEST_VALUE">Lowest Value</option>
              <option value="START_DATE">Pick-up Date</option>
              <option value="RETURN_DATE">Return Date</option>
            </select>
          </div>
        </div>

        <div className="admin-filter-row-bottom">
          <div className="admin-dropdown-fields admin-dropdown-fields--3">
            <div className="glass-select-group">
              <span>Status</span>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="ALL">All statuses</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ACTIVE">Active on Road</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="glass-select-group">
              <span>Vehicle Category</span>
              <select name="vehicleType" value={filters.vehicleType} onChange={handleFilterChange}>
                <option value="ALL">All categories</option>
                <option value="SEDAN">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="HATCHBACK">Hatchback</option>
                <option value="MUV">MUV</option>
                <option value="LUXURY">Luxury</option>
                <option value="VAN">Van</option>
              </select>
            </div>

            <div className="glass-select-group">
              <span>Date Period</span>
              <select name="dateRange" value={filters.dateRange} onChange={handleFilterChange}>
                <option value="ALL">All dates</option>
                <option value="UPCOMING">Upcoming journeys</option>
                <option value="TODAY">Active today</option>
                <option value="THIS_WEEK">This week</option>
                <option value="PAST">Past completed</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <GlassButton variant="ghost" size="sm" onClick={handleClearFilters}>
              <RotateCcw size={14} aria-hidden="true" /> Reset filters
            </GlassButton>
          )}
        </div>
      </motion.div>

      {/* Summary count */}
      <div className="admin-results-summary">
        <p>
          Showing <strong>{filteredBookings.length}</strong> of <strong>{bookings.length}</strong> reservations
        </p>
      </div>

      {/* Table or Empty State */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.16}>
        {filteredBookings.length > 0 ? (
          <BookingManagementTable
            bookings={filteredBookings}
            onTriggerAction={handleTriggerAction}
          />
        ) : (
          <GlassCard className="vehicle-empty-state">
            <span className="vehicle-empty-icon">
              <CalendarDays size={24} strokeWidth={1.7} />
            </span>
            <h3>No bookings match your criteria</h3>
            <p>Try resetting filters or searching with a different keyword.</p>
            <div className="empty-state-buttons">
              <GlassButton variant="secondary" onClick={handleClearFilters}>
                <RotateCcw size={15} aria-hidden="true" /> Reset search & filters
              </GlassButton>
            </div>
          </GlassCard>
        )}
      </motion.div>

      {/* Status Modal */}
      <BookingStatusModal
        isOpen={activeModalState.isOpen}
        booking={activeModalState.booking}
        targetAction={activeModalState.action}
        onClose={() => setActiveModalState({ isOpen: false, booking: null, action: null })}
        onConfirm={handleConfirmStatusUpdate}
        isSubmitting={isSubmitting}
      />
    </section>
  )
}
