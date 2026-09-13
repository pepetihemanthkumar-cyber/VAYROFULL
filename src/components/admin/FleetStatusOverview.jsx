import { GlassCard } from '../ui/GlassCard'
import { GlassBadge } from '../ui/GlassBadge'

const STATUS_CONFIGS = [
  { key: 'AVAILABLE', label: 'Available', color: '#49946c', badge: 'success' },
  { key: 'RESERVED', label: 'Reserved', color: '#b58939', badge: 'warning' },
  { key: 'RENTED', label: 'Rented', color: '#5170b8', badge: 'info' },
  { key: 'MAINTENANCE', label: 'Maintenance', color: '#c05b45', badge: 'attention' },
  { key: 'INACTIVE', label: 'Inactive', color: '#606e85', badge: 'neutral' },
]

export function FleetStatusOverview({ vehicles = [] }) {
  const total = Math.max(1, vehicles.length)

  const counts = {
    AVAILABLE: vehicles.filter((v) => v.status === 'AVAILABLE').length,
    RESERVED: vehicles.filter((v) => v.status === 'RESERVED').length,
    RENTED: vehicles.filter((v) => v.status === 'RENTED').length,
    MAINTENANCE: vehicles.filter((v) => v.status === 'MAINTENANCE').length,
    INACTIVE: vehicles.filter((v) => v.status === 'INACTIVE').length,
  }

  return (
    <GlassCard className="fleet-status-overview-card">
      <div className="status-overview-header">
        <div>
          <p className="eyebrow">Fleet Distribution</p>
          <h3>Operational status</h3>
        </div>
        <span className="total-fleet-counter">
          <strong>{vehicles.length}</strong> total units
        </span>
      </div>

      {/* Segmented Distribution Bar */}
      <div className="status-distribution-bar" role="progressbar" aria-label="Fleet operational breakdown">
        {STATUS_CONFIGS.map((status) => {
          const count = counts[status.key] || 0
          const percentage = ((count / total) * 100).toFixed(1)
          if (count === 0) return null

          return (
            <div
              key={status.key}
              className="status-bar-segment"
              style={{
                width: `${percentage}%`,
                backgroundColor: status.color,
              }}
              title={`${status.label}: ${count} (${percentage}%)`}
            />
          )
        })}
      </div>

      {/* Legend Metrics Grid */}
      <div className="status-legend-grid">
        {STATUS_CONFIGS.map((status) => {
          const count = counts[status.key] || 0
          const percentage = Math.round((count / total) * 100)

          return (
            <div key={status.key} className="status-legend-item">
              <div className="legend-marker-row">
                <span className="status-dot" style={{ backgroundColor: status.color }} />
                <span className="legend-label">{status.label}</span>
              </div>
              <div className="legend-numbers">
                <strong>{count}</strong>
                <small>{percentage}%</small>
              </div>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
