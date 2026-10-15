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
import { getUsers, updateUserStatus } from '../../services/userService'
import { getAllBookings } from '../../services/bookingService'

const defaultFilters = {
  search: '',
  role: 'ALL',
  status: 'ALL',
  sort: 'NEWEST',
}

function sortUsers(list, sort, bookingCounts) {
  const next = [...list]
  if (sort === 'NEWEST') return next.sort((a, b) => (b.createdAt || b.joinedAt || '').localeCompare(a.createdAt || a.joinedAt || ''))
  if (sort === 'OLDEST') return next.sort((a, b) => (a.createdAt || a.joinedAt || '').localeCompare(b.createdAt || b.joinedAt || ''))
  if (sort === 'NAME_ASC') return next.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  if (sort === 'NAME_DESC') return next.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
  if (sort === 'MOST_BOOKINGS') {
    return next.sort((a, b) => {
      const statA = bookingCounts[String(a.id)]
      const countA = typeof statA === 'object' ? statA.total : (Number(statA) || 0)
      const statB = bookingCounts[String(b.id)]
      const countB = typeof statB === 'object' ? statB.total : (Number(statB) || 0)
      return countB - countA
    })
  }
  return next
}

const PAGE_SIZE = 10

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [bookingCountsByUser, setBookingCountsByUser] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState(defaultFilters)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeModalState, setActiveModalState] = useState({ isOpen: false, user: null, actionType: null })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const toast = useToast()

  async function loadData() {
    setIsLoading(true)
    try {
      const [data, allBookings] = await Promise.all([
        getUsers(),
        getAllBookings().catch(() => [])
      ])
      setUsers(data || [])
      const countsMap = {}
      if (Array.isArray(allBookings)) {
        for (const b of allBookings) {
          const uId = String(b.customerId || b.userId || '')
          if (!uId) continue
          if (!countsMap[uId]) {
            countsMap[uId] = { total: 0, activeUpcoming: 0, completed: 0 }
          }
          countsMap[uId].total += 1
          const st = String(b.status || '').toUpperCase()
          if (['ACTIVE', 'CONFIRMED', 'PENDING'].includes(st)) {
            countsMap[uId].activeUpcoming += 1
          } else if (['COMPLETED', 'RETURNED'].includes(st)) {
            countsMap[uId].completed += 1
          }
        }
      }
      setBookingCountsByUser(countsMap)
    } catch (err) {
      toast.error(err.message || 'Failed to load users from database.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const counts = useMemo(() => {
    return {
      total: users.length,
      customers: users.filter((u) => u.role === 'USER').length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
      active: users.filter((u) => u.status === 'ACTIVE' || (!u.status && u.enabled !== false)).length,
    }
  }, [users])

  const filteredUsers = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    const matching = users.filter((u) => {
      const searchable = [u.name, u.email, u.phone || '', u.id].join(' ').toLowerCase()
      const isAccountDisabled = u.status === 'DISABLED' || u.status === 'SUSPENDED' || u.enabled === false
      const matchesStatus =
        filters.status === 'ALL' ||
        (filters.status === 'ACTIVE' && !isAccountDisabled) ||
        ((filters.status === 'DISABLED' || filters.status === 'SUSPENDED') && isAccountDisabled)

      return (
        (!q || searchable.includes(q)) &&
        (filters.role === 'ALL' || u.role === filters.role) &&
        matchesStatus
      )
    })
    return sortUsers(matching, filters.sort, bookingCountsByUser)
  }, [users, filters, bookingCountsByUser])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [filteredUsers, currentPage])

  const hasActiveFilters = Object.entries(filters).some(
    ([k, val]) => k !== 'sort' && val !== defaultFilters[k],
  )

  function handleFilterChange(e) {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
    setCurrentPage(1)
  }

  function handleClearFilters() {
    setFilters(defaultFilters)
    setCurrentPage(1)
  }

  function handleTriggerAction(user, actionType) {
    setActiveModalState({ isOpen: true, user, actionType })
  }

  async function handleConfirmStatusUpdate(userId, newStatus) {
    setIsSubmitting(true)
    try {
      await updateUserStatus(userId, newStatus)
      toast.success(`Account status updated to ${newStatus}.`)
      await loadData()
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
          <p>Manage real customer directory, operational roles, and platform account access from PostgreSQL database.</p>
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
            placeholder="Search by name, email, phone number, customer ID..."
            name="search"
            startIcon={Search}
            value={filters.search}
            onChange={handleFilterChange}
          />

          <div className="glass-select-group admin-sort-select">
            <span>Sort by</span>
            <select name="sort" value={filters.sort} onChange={handleFilterChange}>
              <option value="NEWEST">Newest Registered</option>
              <option value="OLDEST">Oldest Registered</option>
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
                <option value="USER">Customer</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <div className="glass-select-group">
              <span>Account Status</span>
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DISABLED">Disabled</option>
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
          Showing <strong>{filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)}</strong> of <strong>{filteredUsers.length}</strong> filtered users (Total in DB: {users.length})
        </p>
      </div>

      {/* Table or Empty State or Loading */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.16}>
        {isLoading ? (
          <div className="route-loading" aria-label="Loading real customer records from database" />
        ) : filteredUsers.length > 0 ? (
          <>
            <UserManagementTable
              users={paginatedUsers}
              bookingCountsByUser={bookingCountsByUser}
              onTriggerAction={handleTriggerAction}
            />

            {totalPages > 1 && (
              <div className="admin-pagination-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </GlassButton>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <GlassButton
                    key={pg}
                    variant={pg === currentPage ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setCurrentPage(pg)}
                  >
                    {pg}
                  </GlassButton>
                ))}
                <GlassButton
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </GlassButton>
              </div>
            )}
          </>
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
