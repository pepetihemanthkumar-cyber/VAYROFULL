import { ArrowUpRight, Edit, Eye, MoreHorizontal, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassBadge } from '../ui/GlassBadge'
import { GlassButton } from '../ui/GlassButton'
import { GlassCard } from '../ui/GlassCard'
import { VehicleImage } from '../vehicles/VehicleImage'
import { formatCurrency, formatStatus } from '../../utils/formatters'

export function VehicleManagementTable({ vehicles = [], onStatusChange }) {
  if (vehicles.length === 0) {
    return null
  }

  return (
    <div className="admin-table-container">
      {/* Desktop Table View */}
      <div className="admin-table-desktop">
        <table className="admin-fleet-table" aria-label="Fleet vehicle management">
          <thead>
            <tr>
              <th scope="col">Vehicle</th>
              <th scope="col">Registration</th>
              <th scope="col">Category</th>
              <th scope="col">Year</th>
              <th scope="col">Daily rate</th>
              <th scope="col">Status</th>
              <th scope="col" className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="fleet-table-row">
                <td className="vehicle-cell">
                  <div className="vehicle-cell-wrap">
                    <VehicleImage vehicle={vehicle} className="table-vehicle-thumb" />
                    <div>
                      <strong className="table-vehicle-name">{vehicle.name}</strong>
                      <span className="table-vehicle-sub">
                        {vehicle.vehicleType === 'bike' ? '🏍 Bike' : '🚗 Car'} · {vehicle.brand} · {vehicle.model}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="registration-tag">{vehicle.registrationNumber}</span>
                </td>
                <td>
                  <span className="category-tag">{vehicle.category || vehicle.type}</span>
                </td>
                <td>{vehicle.year}</td>
                <td>
                  <strong>{formatCurrency(vehicle.dailyRate)}</strong>
                  <span className="rate-unit">/d</span>
                </td>
                <td>
                  <GlassBadge status={vehicle.status}>{formatStatus(vehicle.status)}</GlassBadge>
                </td>
                <td className="actions-cell">
                  <div className="table-actions-row">
                    <GlassButton
                      as={Link}
                      to={`/admin/vehicles/${vehicle.id}`}
                      variant="ghost"
                      size="sm"
                      title="View vehicle details"
                      aria-label={`View ${vehicle.name}`}
                    >
                      <Eye size={15} aria-hidden="true" />
                    </GlassButton>
                    <GlassButton
                      as={Link}
                      to={`/admin/vehicles/${vehicle.id}/edit`}
                      variant="ghost"
                      size="sm"
                      title="Edit vehicle"
                      aria-label={`Edit ${vehicle.name}`}
                    >
                      <Edit size={15} aria-hidden="true" />
                    </GlassButton>
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      onClick={() => onStatusChange(vehicle)}
                      title="Change operational status"
                    >
                      <RefreshCw size={14} aria-hidden="true" /> Status
                    </GlassButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards */}
      <div className="admin-cards-mobile">
        {vehicles.map((vehicle) => (
          <GlassCard key={vehicle.id} className="admin-vehicle-mobile-card">
            <div className="mobile-card-top">
              <VehicleImage vehicle={vehicle} className="mobile-card-thumb" />
              <div className="mobile-card-heading">
                <div className="mobile-card-title-row">
                  <h4>{vehicle.name}</h4>
                  <GlassBadge status={vehicle.status}>{formatStatus(vehicle.status)}</GlassBadge>
                </div>
                <p className="mobile-card-sub">{vehicle.brand} · {vehicle.model}</p>
                <span className="registration-tag">{vehicle.registrationNumber}</span>
              </div>
            </div>

            <div className="mobile-card-meta-grid">
              <div>
                <small>Category</small>
                <span>{vehicle.type}</span>
              </div>
              <div>
                <small>Model year</small>
                <span>{vehicle.year}</span>
              </div>
              <div>
                <small>Daily rate</small>
                <strong>{formatCurrency(vehicle.dailyRate)} / day</strong>
              </div>
            </div>

            <div className="mobile-card-actions">
              <GlassButton as={Link} to={`/admin/vehicles/${vehicle.id}`} variant="ghost" size="sm">
                <Eye size={14} aria-hidden="true" /> View
              </GlassButton>
              <GlassButton as={Link} to={`/admin/vehicles/${vehicle.id}/edit`} variant="secondary" size="sm">
                <Edit size={14} aria-hidden="true" /> Edit
              </GlassButton>
              <GlassButton size="sm" onClick={() => onStatusChange(vehicle)}>
                <RefreshCw size={14} aria-hidden="true" /> Change status
              </GlassButton>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
