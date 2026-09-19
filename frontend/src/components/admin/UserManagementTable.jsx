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
        <table className="admin-fleet-table" aria-label="User directory table">
          <thead>
            <tr>
              <th scope="col">User</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Status</th>
              <th scope="col">Joined</th>
              <th scope="col">Bookings</th>
              <th scope="col" className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const bookingCount = bookingCountsByUser[user.id] || 0
              const isSuspended = user.status === 'SUSPENDED'

              return (
                <tr key={user.id} className="fleet-table-row">
                  <td className="user-cell">
                    <div className="user-cell-wrap">
                      <div className="table-user-avatar">{getUserInitials(user.name)}</div>
                      <div>
                        <strong className="table-user-name">{user.name}</strong>
                        <small className="table-user-id">{user.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="user-email-text">{user.email}</span>
                  </td>
                  <td>
                    <GlassBadge status={user.role === 'ADMIN' ? 'accent' : 'neutral'}>
                      {user.role}
                    </GlassBadge>
                  </td>
                  <td>
                    <GlassBadge status={isSuspended ? 'attention' : 'success'}>
                      {user.status || 'ACTIVE'}
                    </GlassBadge>
                  </td>
                  <td>
                    <span className="joined-date">{formatDate(user.joinedAt)}</span>
                  </td>
                  <td>
                    <strong>{bookingCount}</strong>
                  </td>
                  <td className="actions-cell">
                    <div className="table-actions-row">
                      <GlassButton
                        as={Link}
                        to={`/admin/users/${user.id}`}
                        variant="ghost"
                        size="sm"
                        title="View user details"
                        aria-label={`View ${user.name}`}
                      >
                        <Eye size={15} aria-hidden="true" />
                      </GlassButton>

                      {isSuspended ? (
                        <GlassButton
                          variant="secondary"
                          size="sm"
                          onClick={() => onTriggerAction(user, 'REACTIVATE')}
                          title="Reactivate user"
                        >
                          <UserCheck size={14} aria-hidden="true" /> Reactivate
                        </GlassButton>
                      ) : (
                        <GlassButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onTriggerAction(user, 'SUSPEND')}
                          title="Suspend user"
                        >
                          <ShieldAlert size={14} aria-hidden="true" /> Suspend
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
          const bookingCount = bookingCountsByUser[user.id] || 0
          const isSuspended = user.status === 'SUSPENDED'

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
                </div>
              </div>

              <div className="mobile-card-meta-grid">
                <div>
                  <small>Status</small>
                  <GlassBadge status={isSuspended ? 'attention' : 'success'}>
                    {user.status || 'ACTIVE'}
                  </GlassBadge>
                </div>
                <div>
                  <small>Joined</small>
                  <span>{formatDate(user.joinedAt)}</span>
                </div>
                <div>
                  <small>Bookings</small>
                  <strong>{bookingCount}</strong>
                </div>
              </div>

              <div className="mobile-card-actions">
                <GlassButton as={Link} to={`/admin/users/${user.id}`} variant="ghost" size="sm">
                  <Eye size={14} aria-hidden="true" /> Details
                </GlassButton>

                {isSuspended ? (
                  <GlassButton size="sm" onClick={() => onTriggerAction(user, 'REACTIVATE')}>
                    <UserCheck size={14} aria-hidden="true" /> Reactivate
                  </GlassButton>
                ) : (
                  <GlassButton variant="secondary" size="sm" onClick={() => onTriggerAction(user, 'SUSPEND')}>
                    <ShieldAlert size={14} aria-hidden="true" /> Suspend
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
