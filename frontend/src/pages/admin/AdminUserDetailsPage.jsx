import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Eye,
  FileText,
  Mail,
  MapPin,
  Phone,
  Receipt,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Tag,
  UserCheck,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fadeUp } from '../../animations/variants'
import { UserStatusModal } from '../../components/admin/UserStatusModal'
import { GlassBadge } from '../../components/ui/GlassBadge'
import { GlassButton } from '../../components/ui/GlassButton'
import { GlassCard } from '../../components/ui/GlassCard'
import { useToast } from '../../context/ToastContext'
import {
  downloadInvoicePdf,
  getBookingsForCustomer,
} from '../../services/bookingService'
import { getUserById, updateUserStatus } from '../../services/userService'
import { formatCurrency, formatDate, formatStatus } from '../../utils/formatters'

function getUserInitials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function AdminUserDetailsPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const [user, setUser] = useState(null)
  const [userBookings, setUserBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalState, setModalState] = useState({ isOpen: false, actionType: null })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [downloadingRef, setDownloadingRef] = useState(null)

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate('/admin/users')
    }
  }

  async function loadData() {
    setIsLoading(true)
    try {
      const loadedUser = await getUserById(id)
      setUser(loadedUser)
      if (loadedUser) {
        const bookings = await getBookingsForCustomer(id)
        setUserBookings(Array.isArray(bookings) ? bookings : [])
      } else {
        setUserBookings([])
      }
    } catch {
      setUser(null)
      setUserBookings([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const stats = useMemo(() => {
    const safeBookings = Array.isArray(userBookings) ? userBookings : []
    const totalSpend = safeBookings
      .filter((b) => b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0)

    return {
      total: safeBookings.length,
      activeUpcoming: safeBookings.filter((b) => ['ACTIVE', 'CONFIRMED', 'PENDING'].includes(b.status)).length,
      completed: safeBookings.filter((b) => ['COMPLETED', 'RETURNED'].includes(b.status)).length,
      cancelled: safeBookings.filter((b) => b.status === 'CANCELLED').length,
      totalSpend,
    }
  }, [userBookings])

  async function handleConfirmStatusUpdate(userId, newStatus) {
    setIsSubmitting(true)
    try {
      await updateUserStatus(userId, newStatus)
      await loadData()
      toast.success(`Account status updated to ${newStatus}.`)
    } catch (err) {
      toast.error(err.message || 'Failed to update user status.')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDownloadInvoice(bookingReference) {
    if (!bookingReference) return
    setDownloadingRef(bookingReference)
    try {
      await downloadInvoicePdf(bookingReference)
      toast.success(`Invoice downloaded for booking ${bookingReference}.`)
    } catch (err) {
      toast.error(err.message || 'Failed to download invoice PDF.')
    } finally {
      setDownloadingRef(null)
    }
  }

  if (isLoading) {
    return <div className="route-loading" aria-label="Loading customer record from database" />
  }

  if (!user) {
    return (
      <section className="booking-missing">
        <GlassCard className="booking-missing-card">
          <h2>User not found</h2>
          <p>The user account identifier ({id}) was not found in the database.</p>
          <GlassButton as={Link} to="/admin/users">Return to users</GlassButton>
        </GlassCard>
      </section>
    )
  }

  const isAccountDisabled = user.status === 'DISABLED' || user.status === 'SUSPENDED' || user.enabled === false
  const customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Customer'

  return (
    <section className="admin-user-details-page">
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
            <ArrowLeft size={16} aria-hidden="true" /> All users
          </GlassButton>
          <div className="title-row">
            <div>
              <p className="eyebrow">Customer Identity #{user.id}</p>
              <h2>{customerName}</h2>
            </div>
            <div className="badge-cluster">
              <GlassBadge status={user.role === 'ADMIN' ? 'accent' : 'neutral'}>
                {user.role}
              </GlassBadge>
              <GlassBadge status={isAccountDisabled ? 'attention' : 'success'}>
                {isAccountDisabled ? 'DISABLED' : 'ACTIVE'}
              </GlassBadge>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {isAccountDisabled ? (
            <GlassButton
              onClick={() => setModalState({ isOpen: true, actionType: 'REACTIVATE' })}
            >
              <UserCheck size={15} aria-hidden="true" /> Reactivate Account
            </GlassButton>
          ) : (
            <GlassButton
              variant="danger"
              onClick={() => setModalState({ isOpen: true, actionType: 'SUSPEND' })}
            >
              <ShieldAlert size={15} aria-hidden="true" /> Disable Account
            </GlassButton>
          )}
        </div>
      </motion.div>

      {/* Profile Overview Card */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.06}>
        <GlassCard className="profile-hero-card">
          <div className="profile-identity">
            <div className="profile-avatar-large">{getUserInitials(customerName)}</div>
            <div className="profile-identity-info">
              <div className="profile-identity-title">
                <h2>{customerName}</h2>
                <GlassBadge status={user.role === 'ADMIN' ? 'accent' : 'neutral'}>{user.role}</GlassBadge>
              </div>
              <p className="profile-email-meta">{user.email}</p>
              <p className="profile-joined-meta">
                Account registered on {formatDate(user.createdAt || user.joinedAt)}
              </p>
            </div>
          </div>

          <div className="user-contact-meta-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="contact-item">
              <UserRound size={15} aria-hidden="true" />
              <span>Customer ID: #{user.id}</span>
            </div>
            <div className="contact-item">
              <Mail size={15} aria-hidden="true" />
              <span>{user.email}</span>
            </div>
            <div className="contact-item">
              <Phone size={15} aria-hidden="true" />
              <span>{user.phone || 'Not provided'}</span>
            </div>
            <div className="contact-item">
              <CalendarDays size={15} aria-hidden="true" />
              <span>Registered: {formatDate(user.createdAt || user.joinedAt)}</span>
            </div>
          </div>

          {/* Lifetime Statistics */}
          <div className="profile-stats-bar">
            <div className="stat-box">
              <small>Total Bookings</small>
              <strong>{stats.total}</strong>
            </div>
            <div className="stat-box">
              <small>Active / Upcoming</small>
              <strong>{stats.activeUpcoming}</strong>
            </div>
            <div className="stat-box">
              <small>Completed Trips</small>
              <strong>{stats.completed}</strong>
            </div>
            <div className="stat-box">
              <small>Total Spend</small>
              <strong>{formatCurrency(stats.totalSpend)}</strong>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* User's Rental History */}
      <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={0.12}>
        <div className="section-title">
          <div>
            <p className="eyebrow">Database Records</p>
            <h3>Customer Booking History ({userBookings.length})</h3>
          </div>
        </div>

        {userBookings.length > 0 ? (
          <div className="admin-booking-history-list" style={{ display: 'grid', gap: '20px' }}>
            {userBookings.map((b) => {
              const invoiceAvailable = b.status !== 'CANCELLED' && b.status !== 'PENDING'
              const durationText = b.durationLabel || (b.rentalDays ? `${b.rentalDays} days` : 'Not provided')
              const vehicleDisplayName = b.vehicle?.name || b.vehicleName || 'Vehicle'

              return (
                <GlassCard key={b.id} className="admin-booking-detail-card" style={{ padding: '24px' }}>
                  {/* Card Header */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="compact-id-pill" style={{ fontSize: '13px', fontWeight: 600 }}>
                          Ref: {b.bookingReference || b.id}
                        </span>
                        <GlassBadge status={b.status}>{formatStatus(b.status)}</GlassBadge>
                        <GlassBadge status={b.paymentStatus === 'PAID' ? 'success' : 'attention'}>
                          Payment: {b.paymentStatus || 'Not recorded'}
                        </GlassBadge>
                      </div>
                      <h3 style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: 700 }}>
                        {vehicleDisplayName}{' '}
                        <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--color-text-muted)' }}>
                          (ID: {b.vehicleId || 'Not provided'})
                        </span>
                      </h3>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'block' }}>
                        Total Amount
                      </span>
                      <strong style={{ fontSize: '20px', color: 'var(--color-accent, #6366f1)' }}>
                        {formatCurrency(b.totalAmount)}
                      </strong>
                    </div>
                  </div>

                  {/* 16 Fields Itemized Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '20px',
                      padding: '20px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '13px',
                    }}
                  >
                    {/* Column 1: Schedule & Duration */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                        Rental Schedule
                      </h4>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Pickup Date & Time</span>
                        <strong>{formatDate(b.pickupDate)} · {b.pickupTime || '10:00'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Return Date & Time</span>
                        <strong>{formatDate(b.returnDate)} · {b.returnTime || '10:00'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Rental Duration</span>
                        <span>{durationText}</span>
                      </div>
                      {b.returnedAt && (
                        <div>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Actual Return Timestamp</span>
                          <span style={{ color: '#10b981' }}>{String(b.returnedAt).replace('T', ' ').slice(0, 19)}</span>
                        </div>
                      )}
                    </div>

                    {/* Column 2: Locations & Logistics */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                        Locations & Logistics
                      </h4>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Pickup Location</span>
                        <span>{b.pickupLocation || 'Not provided'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Return Location</span>
                        <span>{b.returnLocation || 'Not provided'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Vehicle Name & ID</span>
                        <span>{vehicleDisplayName} (ID: {b.vehicleId || 'Not provided'})</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Booking Reference</span>
                        <span>{b.bookingReference || b.id}</span>
                      </div>
                    </div>

                    {/* Column 3: Pricing Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                        Financial Breakdown
                      </h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Base Rental:</span>
                        <span>{formatCurrency(b.baseAmount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Add-on Amount:</span>
                        <span>{formatCurrency(b.addOnsAmount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Discount:</span>
                        <span style={{ color: b.discountAmount > 0 ? '#10b981' : 'inherit' }}>
                          -{formatCurrency(b.discountAmount)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Tax (GST):</span>
                        <span>{formatCurrency(b.taxAmount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                        <strong>Total Amount:</strong>
                        <strong style={{ color: 'var(--color-accent, #6366f1)' }}>{formatCurrency(b.totalAmount)}</strong>
                      </div>
                    </div>

                    {/* Column 4: Payment, Creation & Invoice */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)' }}>
                        Audit & Billing
                      </h4>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Payment Status</span>
                        <span style={{ fontWeight: 600 }}>{b.paymentStatus || 'Not recorded'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Payment Method</span>
                        <span>{b.paymentMethod || 'Not recorded'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Booking Created</span>
                        <span>{formatDate(b.createdAt) || 'Not available'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '11px' }}>Invoice Availability</span>
                        <span style={{ color: invoiceAvailable ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                          {invoiceAvailable ? 'Available' : 'Not available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '12px',
                      paddingTop: '16px',
                    }}
                  >
                    {invoiceAvailable && (
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        disabled={downloadingRef === (b.bookingReference || b.id)}
                        onClick={() => handleDownloadInvoice(b.bookingReference || b.id)}
                      >
                        <Download size={14} aria-hidden="true" />
                        {downloadingRef === (b.bookingReference || b.id) ? 'Downloading...' : 'Download Invoice'}
                      </GlassButton>
                    )}

                    <GlassButton
                      as={Link}
                      to={`/admin/bookings/${b.id}`}
                      variant="ghost"
                      size="sm"
                    >
                      <Eye size={14} aria-hidden="true" /> View Full Booking
                    </GlassButton>
                  </div>
                </GlassCard>
              )
            })}
          </div>
        ) : (
          <GlassCard className="admin-empty-compact">
            <p>No booking history found in the database for this customer account.</p>
          </GlassCard>
        )}
      </motion.section>

      {/* User Status Modal */}
      <UserStatusModal
        isOpen={modalState.isOpen}
        user={user}
        actionType={modalState.actionType}
        onClose={() => setModalState({ isOpen: false, actionType: null })}
        onConfirm={handleConfirmStatusUpdate}
        isSubmitting={isSubmitting}
      />
    </section>
  )
}
