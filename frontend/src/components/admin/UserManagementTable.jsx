import { Eye, ShieldAlert, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassBadge } from '../ui/GlassBadge'
import { GlassButton } from '../ui/GlassButton'
import { GlassCard } from '../ui/GlassCard'
import { formatDate } from '../../utils/formatters'

function getUserInitials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function UserManagementTable({ users = [], bookingCountsByUser = {}, onTriggerAction }) {
  if (users.length === 0) return null

  return (
    <div className="admin-table-container">
      {/* Desktop Table */}
      <div className="admin-table-desktop">
        <table className="admin-fleet-table" aria-label="Customer and user directory table">
          <thead>
            <tr>
              <th scope="col">Customer ID</th>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Phone</th>
              <th scope="col">Registration</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Total</th>
              <th scope="col">Active/Upcoming</th>
              <th scope="col">Completed</th>
              <th scope="col" className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const uStats = bookingCountsByUser[String(user.id)] || { total: 0, activeUpcoming: 0, completed: 0 }
              const totalCount = typeof uStats === 'object' ? uStats.total : (Number(uStats) || 0)
              const activeCount = typeof uStats === 'object' ? uStats.activeUpcoming : 0
              const completedCount = typeof uStats === 'object' ? uStats.completed : 0
              const isAccountDisabled = user.status === 'DISABLED' || user.status === 'SUSPENDED' || user.enabled === false

              return (
                <tr key={user.id} className="fleet-table-row">
                  <td>
                    <span className="compact-id-pill">#{user.id}</span>
                  </td>
                  <td className="user-cell">
                    <div className="user-cell-wrap">
                      <div className="table-user-avatar">{getUserInitials(user.name)}</div>
                      <div>
                        <strong className="table-user-name">{user.name}</strong>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="user-email-text">{user.email}</span>
                  </td>
                  <td>
                    <span>{user.phone || 'Not provided'}</span>
                  </td>
                  <td>
                    <span className="joined-date">{formatDate(user.createdAt || user.joinedAt)}</span>
                  </td>
                  <td>
                    <GlassBadge status={user.role === 'ADMIN' ? 'accent' : 'neutral'}>
                      {user.role}
                    </GlassBadge>
                  </td>
                  <td>
                    <GlassBadge status={isAccountDisabled ? 'attention' : 'success'}>
                      {isAccountDisabled ? 'DISABLED' : 'ACTIVE'}
                    </GlassBadge>
                  </td>
                  <td>
                    <strong>{totalCount}</strong>
                  </td>
                  <td>
                    <span>{activeCount}</span>
                  </td>
                  <td>
                    <span>{completedCount}</span>
                  </td>
                  <td className="actions-cell">
                    <div className="table-actions-row">
                      <GlassButton
                        as={Link}
                        to={`/admin/users/${user.id}`}
                        variant="ghost"
                        size="sm"
                        title="View customer profile and booking history"
                        aria-label={`View ${user.name}`}
                      >
                        <Eye size={15} aria-hidden="true" />
                      </GlassButton>

                      {isAccountDisabled ? (
                        <GlassButton
                          variant="secondary"
                          size="sm"
                          onClick={() => onTriggerAction(user, 'REACTIVATE')}
                          title="Reactivate account"
                        >
                          <UserCheck size={14} aria-hidden="true" /> Reactivate
                        </GlassButton>
                      ) : (
                        <GlassButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onTriggerAction(user, 'SUSPEND')}
                          title="Disable account"
                        >
                          <ShieldAlert size={14} aria-hidden="true" /> Disable
                        </GlassButton>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="admin-cards-mobile">
        {users.map((user) => {
          const uStats = bookingCountsByUser[String(user.id)] || { total: 0, activeUpcoming: 0, completed: 0 }
          const totalCount = typeof uStats === 'object' ? uStats.total : (Number(uStats) || 0)
          const activeCount = typeof uStats === 'object' ? uStats.activeUpcoming : 0
          const completedCount = typeof uStats === 'object' ? uStats.completed : 0
          const isAccountDisabled = user.status === 'DISABLED' || user.status === 'SUSPENDED' || user.enabled === false

          return (
            <GlassCard key={user.id} className="admin-user-mobile-card">
              <div className="mobile-user-top">
                <div className="table-user-avatar">{getUserInitials(user.name)}</div>
                <div className="mobile-user-info">
                  <div className="mobile-user-title-row">
                    <h4>{user.name}</h4>
                    <GlassBadge status={user.role === 'ADMIN' ? 'accent' : 'neutral'}>
                      {user.role}
                    </GlassBadge>
                  </div>
                  <p className="mobile-user-email">{user.email}</p>
                  <small className="mobile-user-id">Customer ID #{user.id}</small>
                </div>
              </div>

              <div className="mobile-card-meta-grid">
                <div>
                  <small>Status</small>
                  <GlassBadge status={isAccountDisabled ? 'attention' : 'success'}>
                    {isAccountDisabled ? 'DISABLED' : 'ACTIVE'}
                  </GlassBadge>
                </div>
                <div>
                  <small>Phone</small>
                  <span>{user.phone || 'Not provided'}</span>
                </div>
                <div>
                  <small>Registered</small>
                  <span>{formatDate(user.createdAt || user.joinedAt)}</span>
                </div>
                <div>
                  <small>Bookings</small>
                  <strong>{totalCount} total ({activeCount} active, {completedCount} completed)</strong>
                </div>
              </div>

              <div className="mobile-card-actions">
                <GlassButton as={Link} to={`/admin/users/${user.id}`} variant="ghost" size="sm">
                  <Eye size={14} aria-hidden="true" /> Details & Bookings
                </GlassButton>

                {isAccountDisabled ? (
                  <GlassButton size="sm" onClick={() => onTriggerAction(user, 'REACTIVATE')}>
                    <UserCheck size={14} aria-hidden="true" /> Reactivate
                  </GlassButton>
                ) : (
                  <GlassButton variant="secondary" size="sm" onClick={() => onTriggerAction(user, 'SUSPEND')}>
                    <ShieldAlert size={14} aria-hidden="true" /> Disable
                  </GlassButton>
                )}
              </div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
