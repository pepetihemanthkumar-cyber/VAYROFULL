import { Calendar, CheckCircle2, Eye, Play, RotateCcw, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassBadge } from '../ui/GlassBadge'
import { GlassButton } from '../ui/GlassButton'
import { GlassCard } from '../ui/GlassCard'
import { formatCurrency, formatDate, formatStatus } from '../../utils/formatters'

export function BookingManagementTable({ bookings = [], onTriggerAction }) {
  if (bookings.length === 0) return null

  return (
    <div className="admin-table-container">
      {/* Desktop Table */}
      <div className="admin-table-desktop">
        <table className="admin-fleet-table" aria-label="Fleet booking operations table">
          <thead>
            <tr>
              <th scope="col">Booking ID</th>
              <th scope="col">Customer</th>
              <th scope="col">Vehicle</th>
              <th scope="col">Rental Period</th>
              <th scope="col">Duration</th>
              <th scope="col">Total</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="fleet-table-row">
                <td>
                  <span className="compact-id-pill">{b.id}</span>
                </td>
                <td>
                  <div className="customer-meta-cell">
                    <strong>{b.driverDetails?.fullName || 'Customer'}</strong>
                    <small>{b.driverDetails?.email || ''}</small>
                  </div>
                </td>
                <td>
                  <div className="vehicle-meta-cell">
                    <strong>{b.vehicle?.name || b.vehicleId}</strong>
                    {b.vehicle?.registrationNumber && (
                      <span className="registration-tag">{b.vehicle.registrationNumber}</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="period-text">
                    {formatDate(b.pickupDate, { day: 'numeric', month: 'short' })} –{' '}
                    {formatDate(b.returnDate, { day: 'numeric', month: 'short' })}
                  </span>
                </td>
                <td>
                  <span>
                    {b.rentalDays} {b.rentalDays === 1 ? 'day' : 'days'}
                  </span>
                </td>
                <td>
                  <strong>{formatCurrency(b.totalAmount)}</strong>
                </td>
                <td>
                  <GlassBadge status={b.status}>{formatStatus(b.status)}</GlassBadge>
                </td>
                <td className="actions-cell">
                  <div className="table-actions-row">
                    <GlassButton
                      as={Link}
                      to={`/admin/bookings/${b.id}`}
                      variant="ghost"
                      size="sm"
                      title="View booking details"
                      aria-label={`View ${b.id}`}
                    >
                      <Eye size={15} aria-hidden="true" />
                    </GlassButton>

                    {b.status === 'CONFIRMED' && (
                      <>
                        <GlassButton
                          size="sm"
                          onClick={() => onTriggerAction(b, 'START_RENTAL')}
                          title="Start rental journey"
                        >
                          <Play size={13} aria-hidden="true" /> Start
                        </GlassButton>
                        <GlassButton
                          variant="ghost"
                          size="sm"
                          onClick={() => onTriggerAction(b, 'CANCEL_BOOKING')}
                          title="Cancel reservation"
                        >
                          <XCircle size={14} aria-hidden="true" />
                        </GlassButton>
                      </>
                    )}

                    {b.status === 'ACTIVE' && (
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() => onTriggerAction(b, 'COMPLETE_RENTAL')}
                        title="Complete and return vehicle"
                      >
                        <RotateCcw size={13} aria-hidden="true" /> Complete
                      </GlassButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="admin-cards-mobile">
        {bookings.map((b) => (
          <GlassCard key={b.id} className="admin-booking-mobile-card">
            <div className="mobile-booking-card-top">
              <div>
                <span className="compact-id-pill">{b.id}</span>
                <h4 className="mobile-booking-vehicle">{b.vehicle?.name || b.vehicleId}</h4>
                <p className="mobile-booking-customer">{b.driverDetails?.fullName} · {b.driverDetails?.email}</p>
              </div>
              <GlassBadge status={b.status}>{formatStatus(b.status)}</GlassBadge>
            </div>

            <div className="mobile-card-meta-grid">
              <div>
                <small>Rental period</small>
                <span>
                  {formatDate(b.pickupDate, { day: 'numeric', month: 'short' })} –{' '}
                  {formatDate(b.returnDate, { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div>
                <small>Duration</small>
                <span>{b.rentalDays} days</span>
              </div>
              <div>
                <small>Total amount</small>
                <strong>{formatCurrency(b.totalAmount)}</strong>
              </div>
            </div>

            <div className="mobile-card-actions">
              <GlassButton as={Link} to={`/admin/bookings/${b.id}`} variant="ghost" size="sm">
                <Eye size={14} aria-hidden="true" /> Details
              </GlassButton>

              {b.status === 'CONFIRMED' && (
                <>
                  <GlassButton size="sm" onClick={() => onTriggerAction(b, 'START_RENTAL')}>
                    <Play size={13} aria-hidden="true" /> Start
                  </GlassButton>
                  <GlassButton variant="secondary" size="sm" onClick={() => onTriggerAction(b, 'CANCEL_BOOKING')}>
                    Cancel
                  </GlassButton>
                </>
              )}

              {b.status === 'ACTIVE' && (
                <GlassButton size="sm" onClick={() => onTriggerAction(b, 'COMPLETE_RENTAL')}>
                  <RotateCcw size={13} aria-hidden="true" /> Complete
                </GlassButton>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
