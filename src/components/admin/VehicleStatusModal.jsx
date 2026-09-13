import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, RefreshCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { modalTransition, backdropTransition } from '../../animations/variants'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { GlassBadge } from '../ui/GlassBadge'
import { GlassButton } from '../ui/GlassButton'
import { GlassCard } from '../ui/GlassCard'
import { formatStatus } from '../../utils/formatters'

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available', description: 'Vehicle is road-ready and open for customer bookings.' },
  { value: 'MAINTENANCE', label: 'Maintenance', description: 'Vehicle is offline for scheduled mechanical service or repairs.' },
  { value: 'INACTIVE', label: 'Inactive', description: 'Vehicle is temporarily de-listed from public discovery.' },
]

export function VehicleStatusModal({
  isOpen,
  vehicle,
  onClose,
  onConfirm,
  isSubmitting = false,
}) {
  useEscapeKey(isOpen, onClose, isSubmitting)

  const [selectedStatus, setSelectedStatus] = useState(vehicle?.status || 'AVAILABLE')
  const [error, setError] = useState('')

  useEffect(() => {
    if (vehicle) {
      setSelectedStatus(vehicle.status)
      setError('')
    }
  }, [vehicle])

  const isCurrentlyRented = vehicle?.status === 'RENTED'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!vehicle) return
    if (selectedStatus === vehicle.status) {
      onClose()
      return
    }

    if (isCurrentlyRented && selectedStatus === 'AVAILABLE') {
      setError('Cannot mark an actively rented vehicle as available. The customer must complete the return handover first.')
      return
    }

    try {
      await onConfirm(vehicle.id, selectedStatus)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update vehicle status.')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && vehicle && (
        <motion.div
          className="glass-modal-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-modal-title"
          variants={backdropTransition}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div
            className="glass-modal-backdrop"
            onClick={!isSubmitting ? onClose : undefined}
          />

          <motion.div
            className="glass-modal-container"
            variants={modalTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <GlassCard className="glass-modal-card status-change-modal-card">
              <div className="modal-header">
                <div className="modal-icon-wrap modal-icon-wrap--info">
                  <RefreshCw size={20} aria-hidden="true" />
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={onClose}
                  disabled={isSubmitting}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-content">
                <h3 id="status-modal-title">Manage operational status</h3>
                <p>
                  Update fleet availability for <strong>{vehicle.name}</strong> ({vehicle.registrationNumber}).
                </p>

                {isCurrentlyRented && (
                  <div className="form-alert form-alert--warning" role="alert">
                    <AlertTriangle size={17} aria-hidden="true" />
                    <div>
                      <strong>Active rental in progress</strong>
                      <p>This vehicle is currently assigned to an on-road rental and cannot be manually set to available.</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="form-alert" role="alert">
                    <AlertCircle size={17} aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="status-options-stack">
                  {STATUS_OPTIONS.map((option) => {
                    const isSelected = selectedStatus === option.value
                    const isCurrent = vehicle.status === option.value
                    const isRestricted = isCurrentlyRented && option.value === 'AVAILABLE'

                    return (
                      <label
                        key={option.value}
                        className={`status-option-item ${isSelected ? 'is-selected' : ''} ${
                          isRestricted ? 'is-disabled' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="vehicleStatus"
                          value={option.value}
                          checked={isSelected}
                          disabled={isRestricted || isSubmitting}
                          onChange={() => {
                            setSelectedStatus(option.value)
                            setError('')
                          }}
                        />
                        <div className="status-option-body">
                          <div className="status-option-title-row">
                            <strong>{option.label}</strong>
                            {isCurrent && <GlassBadge status={vehicle.status}>Current: {formatStatus(vehicle.status)}</GlassBadge>}
                          </div>
                          <p>{option.description}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="modal-actions">
                <GlassButton variant="secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </GlassButton>
                <GlassButton
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={selectedStatus === vehicle.status}
                >
                  Apply status
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
