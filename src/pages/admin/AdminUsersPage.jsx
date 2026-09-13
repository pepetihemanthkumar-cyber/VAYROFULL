import { motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fadeUp } from '../../animations/variants'
import { AdminStatCard } from '../../components/admin/AdminStatCard'
import { UserManagementTable } from '../../components/admin/UserManagementTable'
import { UserStatusModal } from '../../components/admin/UserStatusModal'
import { GlassButton } from '../../components/ui/GlassButton'
import { GlassCard } from '../../components/ui/GlassCard'
import { GlassInput } from '../../components/ui/GlassInput'
import { useToast } from '../../context/ToastContext'
import { getStoredBookings } from '../../services/bookingService'
import { getMockUsers, updateMockUserStatus } from '../../services/mockAuth'

const defaultFilters = {
  search: '',
  role: 'ALL',
  status: 'ALL',
  sort: 'NEWEST',
}

function sortUsers(list, sort, bookingCounts) {
  const next = [...list]
  if (sort === 'NEWEST') return next.sort((a, b) => (b.joinedAt || '').localeCompare(a.joinedAt || ''))
  if (sort === 'OLDEST') return next.sort((a, b) => (a.joinedAt || '').localeCompare(b.joinedAt || ''))
  if (sort === 'NAME_ASC') return next.sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'NAME_DESC') return next.sort((a, b) => b.name.localeCompare(a.name))
  if (sort === 'MOST_BOOKINGS') return next.sort((a, b) => (bookingCounts[b.id] || 0) - (bookingCounts[a.id] || 0))
  return next
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [bookings, setBookings] = useState([])
  const [filters, setFilters] = useState(defaultFilters)
  const [activeModalState, setActiveModalState] = useState({ isOpen: false, user: null, actionType: null })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()


  function loadData() {
    setUsers(getMockUsers())
    setBookings(getStoredBookings())
  }

  useEffect(() => {
    loadData()
  }, [])

  const bookingCountsByUser = useMemo(() => {
    const counts = {}
    for (const b of bookings) {
      counts[b.customerId] = (counts[b.customerId] || 0) + 1
    }
    return counts
  }, [bookings])

  const counts = useMemo(() => {
    return {
      total: users.length,
      customers: users.filter((u) => u.role === 'CUSTOMER').length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
      active: users.filter((u) => u.status === 'ACTIVE').length,
    }
  }, [users])

  const filteredUsers = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    const matching = users.filter((u) => {
      const searchable = [u.name, u.email, u.phone || '', u.id].join(' ').toLowerCase()
      return (
        (!q || searchable.includes(q)) &&
        (filters.role === 'ALL' || u.role === filters.role) &&
        (filters.status === 'ALL' || u.status === filters.status)
      )
    })
    return sortUsers(matching, filters.sort, bookingCountsByUser)
  }, [users, filters, bookingCountsByUser])

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

  function handleTriggerAction(user, actionType) {
    setActiveModalState({ isOpen: true, user, actionType })
  }

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
          <p className="eyebrow">Identity & Access Operations</p>
          <h2>User Management</h2>
          <p>Manage customer directory, operational roles, and platform account access.</p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        className="admin-kpi-grid"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0.06}
      >
        <AdminStatCard icon={UsersRound} label="Total Accounts" value={counts.total} supportingText="Registered" tone="accent" />
        <AdminStatCard icon={UserRound} label="Customers" value={counts.customers} supportingText="Rental clients" tone="info" />
        <AdminStatCard icon={ShieldCheck} label="Administrators" value={counts.admins} supportingText="Fleet operators" tone="warning" />
        <AdminStatCard icon={CheckCircle2} label="Active Users" value={counts.active} supportingText="Good standing" tone="success" />
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
            label="Search Directory"
            placeholder="Search by name, email, phone number..."
            name="search"
            startIcon={Search}
            value={filters.search}
            onChange={handleFilterChange}
          />

          <div className="glass-select-group admin-sort-select">
            <span>Sort by</span>
            <select name="sort" value={filters.sort} onChange={handleFilterChange}>
              <option value="NEWEST">Newest Joined</option>
              <option value="OLDEST">Oldest Joined</option>
              <option value="NAME_ASC">Name: A to Z</option>
              <option value="NAME_DESC">Name: Z to A</option>
              <option value="MOST_BOOKINGS">Most Bookings</option>
            </select>
          </div>
        </div>

        <div className="admin-filter-row-bottom">
          <div className="admin-dropdown-fields admin-dropdown-fields--2">
            <div className="glass-select-group">
              <span>Account Role</span>
              <select name="role" value={filters.role} onChange={handleFilterChange}>
                <option value="ALL">All roles</option>
                <option value="CUSTOMER">Customer</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <div className="glass-select-group">
              <span>Account Status</span>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
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

      {/* Results Count */}
      <div className="admin-results-summary">
        <p>
          Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> registered users
        </p>
      </div>

      {/* Table or Empty State */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.16}>
        {filteredUsers.length > 0 ? (
          <UserManagementTable
            users={filteredUsers}
            bookingCountsByUser={bookingCountsByUser}
            onTriggerAction={handleTriggerAction}
          />
        ) : (
          <GlassCard className="vehicle-empty-state">
            <span className="vehicle-empty-icon">
              <UsersRound size={24} strokeWidth={1.7} />
            </span>
            <h3>No users match your criteria</h3>
            <p>Try clearing filters or search query to see all accounts.</p>
            <div className="empty-state-buttons">
              <GlassButton variant="secondary" onClick={handleClearFilters}>
                <RotateCcw size={15} aria-hidden="true" /> Reset search & filters
              </GlassButton>
            </div>
          </GlassCard>
        )}
      </motion.div>

      {/* Status Modal */}
      <UserStatusModal
        isOpen={activeModalState.isOpen}
        user={activeModalState.user}
        actionType={activeModalState.actionType}
        onClose={() => setActiveModalState({ isOpen: false, user: null, actionType: null })}
        onConfirm={handleConfirmStatusUpdate}
        isSubmitting={isSubmitting}
      />
    </section>
  )
}
