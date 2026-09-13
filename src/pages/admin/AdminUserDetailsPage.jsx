import { motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Eye,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
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
import { getBookingsForCustomer } from '../../services/bookingService'
import { getMockUserById, updateMockUserStatus } from '../../services/mockAuth'
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
  const [toastMessage, setToastMessage] = useState(null)

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate('/admin/users')
    }
  }

  function loadData() {
    const loadedUser = getMockUserById(id)
    setUser(loadedUser)
    if (loadedUser) {
      const bookings = getBookingsForCustomer(id)
      setUserBookings(bookings)
    }
  }

  useEffect(() => {
    loadData()
    setIsLoading(false)
  }, [id])

  const stats = useMemo(() => {
    const totalSpend = userBookings
      .filter((b) => b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0)

    return {
      total: userBookings.length,
      active: userBookings.filter((b) => b.status === 'ACTIVE').length,
      completed: userBookings.filter((b) => b.status === 'COMPLETED').length,
      cancelled: userBookings.filter((b) => b.status === 'CANCELLED').length,
      totalSpend,
    }
  }, [userBookings])

  async function handleConfirmStatusUpdate(userId, newStatus) {
    setIsSubmitting(true)
    try {
      await updateMockUserStatus(userId, newStatus)
      loadData()
      toast.success(`Account status updated to ${newStatus}.`)
    } catch (err) {
      toast.error(err.message || 'Failed to update user status.')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }


  if (isLoading) {
    return <div className="route-loading" aria-label="Loading user record" />
  }

  if (!user) {
    return (
      <section className="booking-missing">
        <GlassCard className="booking-missing-card">
          <h2>User not found</h2>
          <p>The user account identifier ({id}) was not found in identity records.</p>
          <GlassButton as={Link} to="/admin/users">Return to users</GlassButton>
        </GlassCard>
      </section>
    )
  }

  const isSuspended = user.status === 'SUSPENDED'

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
              <p className="eyebrow">User Profile #{user.id}</p>
              <h2>{user.name}</h2>
            </div>
            <div className="badge-cluster">
              <GlassBadge status={user.role === 'ADMIN' ? 'accent' : 'neutral'}>
                {user.role}
              </GlassBadge>
              <GlassBadge status={isSuspended ? 'attention' : 'success'}>
                {user.status || 'ACTIVE'}
              </GlassBadge>
            </div>
          </div>
        </div>

        <div className="header-actions">
          {isSuspended ? (
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
              <ShieldAlert size={15} aria-hidden="true" /> Suspend Account
            </GlassButton>
          )}
        </div>
      </motion.div>

      {/* Toast Alert */}
      {toast && (
        <motion.div
          className={`details-toast details-toast--${toast.type}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={18} aria-hidden="true" />
          ) : (
            <AlertCircle size={18} aria-hidden="true" />
          )}
          <span>{toast.text}</span>
        </motion.div>
      )}

      {/* Profile Overview Card */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.06}>
        <GlassCard className="profile-hero-card">
          <div className="profile-identity">
            <div className="profile-avatar-large">{getUserInitials(user.name)}</div>
            <div className="profile-identity-info">
              <div className="profile-identity-title">
                <h2>{user.name}</h2>
                <GlassBadge status={user.role === 'ADMIN' ? 'accent' : 'neutral'}>{user.role}</GlassBadge>
              </div>
              <p className="profile-email-meta">{user.email}</p>
              <p className="profile-joined-meta">Registered on {formatDate(user.joinedAt)}</p>
            </div>
          </div>

          <div className="user-contact-meta-grid">
            <div className="contact-item">
              <Phone size={15} aria-hidden="true" />
              <span>{user.phone || '+91 98765 43210'}</span>
            </div>
            <div className="contact-item">
              <Mail size={15} aria-hidden="true" />
              <span>{user.email}</span>
            </div>
            <div className="contact-item">
              <MapPin size={15} aria-hidden="true" />
              <span>{user.address || 'India'}</span>
            </div>
          </div>

          {/* Lifetime Statistics */}
          <div className="profile-stats-bar">
            <div className="stat-box">
              <small>Total Bookings</small>
              <strong>{stats.total}</strong>
            </div>
            <div className="stat-box">
              <small>Active on Road</small>
              <strong>{stats.active}</strong>
            </div>
            <div className="stat-box">
              <small>Completed Trips</small>
              <strong>{stats.completed}</strong>
            </div>
            <div className="stat-box">
              <small>Total Value</small>
              <strong>{formatCurrency(stats.totalSpend)}</strong>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* User's Rental History */}
      <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={0.12}>
        <div className="section-title">
          <div>
            <p className="eyebrow">Rental Archive</p>
            <h3>Customer bookings ({userBookings.length})</h3>
          </div>
        </div>

        <GlassCard className="admin-recent-table-card">
          {userBookings.length > 0 ? (
            <div className="admin-compact-table-wrap">
              <table className="admin-compact-table">
                <thead>
                  <tr>
                    <th scope="col">Booking ID</th>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Schedule</th>
                    <th scope="col">Duration</th>
                    <th scope="col">Total</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {userBookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <span className="compact-id-pill">{b.id}</span>
                      </td>
                      <td>
                        <strong>{b.vehicle?.name || b.vehicleId}</strong>
                      </td>
                      <td>
                        <small className="compact-dates">
                          {formatDate(b.pickupDate, { day: 'numeric', month: 'short' })} –{' '}
                          {formatDate(b.returnDate, { day: 'numeric', month: 'short' })}
                        </small>
                      </td>
                      <td>{b.rentalDays} days</td>
                      <td>
                        <strong>{formatCurrency(b.totalAmount)}</strong>
                      </td>
                      <td>
                        <GlassBadge status={b.status}>{formatStatus(b.status)}</GlassBadge>
                      </td>
                      <td className="text-right">
                        <GlassButton as={Link} to={`/admin/bookings/${b.id}`} variant="ghost" size="sm">
                          <Eye size={14} aria-hidden="true" /> View
                        </GlassButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty-compact">
              <p>No booking history found for this account.</p>
            </div>
          )}
        </GlassCard>
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
