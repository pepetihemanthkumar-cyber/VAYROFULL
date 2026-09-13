import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'
import { modalTransition, backdropTransition } from '../../animations/variants'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { GlassBadge } from '../ui/GlassBadge'
import { GlassButton } from '../ui/GlassButton'
import { GlassCard } from '../ui/GlassCard'
import { formatStatus } from '../../utils/formatters'

export function BookingStatusModal({
  isOpen,
  booking,
  targetAction, // 'START_RENTAL' | 'COMPLETE_RENTAL' | 'CANCEL_BOOKING' | null
  onClose,
  onConfirm,
  isSubmitting = false,
}) {
  useEscapeKey(isOpen, onClose, isSubmitting)

  const [error, setError] = useState('')

  const actionDetails = {
    START_RENTAL: {
      title: 'Dispatch vehicle & start rental?',
      newStatus: 'ACTIVE',
      badgeTone: 'info',
      iconTone: 'info',
      confirmLabel: 'Start Rental',
      description: `Confirm hand-off for ${booking?.driverDetails?.fullName || 'Customer'}. The vehicle ${
        booking?.vehicle?.name || ''
      } will be marked RENTED on the road.`,
      disclaimer: 'This transition activates the rental journey in real time.',
    },
    COMPLETE_RENTAL: {
      title: 'Complete rental & inspect vehicle?',
      newStatus: 'COMPLETED',
      badgeTone: 'success',
      iconTone: 'info',
      confirmLabel: 'Complete Rental',
      description: `Mark booking ${booking?.id} as finalized. The vehicle ${
        booking?.vehicle?.name || ''
      } will be released back to AVAILABLE in fleet inventory.`,
      disclaimer: 'This closes the journey and frees the vehicle for future bookings.',
    },
    CANCEL_BOOKING: {
      title: 'Cancel reservation?',
      newStatus: 'CANCELLED',
      badgeTone: 'attention',
      iconTone: 'danger',
      confirmLabel: 'Cancel Booking',
      description: `Cancel reservation ${booking?.id} for ${booking?.driverDetails?.fullName || 'Customer'}.`,
      disclaimer: 'This releases the held dates and marks the booking as cancelled in audit history.',
    },
  }

  const action = actionDetails[targetAction] || {
    title: 'Update booking status?',
    newStatus: 'ACTIVE',
    badgeTone: 'info',
    iconTone: 'info',
    confirmLabel: 'Apply Update',
    description: `Update the operational status of booking ${booking?.id}.`,
    disclaimer: 'Status change will synchronize across customer and fleet dashboards.',
  }

  async function handleConfirm() {
    if (!booking) return
    setError('')
    try {
      await onConfirm(booking.id, action.newStatus)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update booking status.')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && booking && (
        <motion.div
          className="glass-modal-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-status-title"
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
            <GlassCard className="glass-modal-card">
              <div className="modal-header">
                <div className={`modal-icon-wrap modal-icon-wrap--${action.iconTone}`}>
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
                <h3 id="booking-status-title">{action.title}</h3>
                <p>{action.description}</p>

                <div className="modal-status-transition-box">
                  <div className="transition-step">
                    <small>Current Status</small>
                    <GlassBadge status={booking.status}>{formatStatus(booking.status)}</GlassBadge>
                  </div>
                  <span className="transition-arrow">→</span>
                  <div className="transition-step">
                    <small>New Status</small>
                    <GlassBadge status={action.newStatus}>{formatStatus(action.newStatus)}</GlassBadge>
                  </div>
                </div>

                <p className="modal-notice">{action.disclaimer}</p>

                {error && (
                  <div className="form-alert" role="alert">
                    <AlertCircle size={17} aria-hidden="true" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <GlassButton variant="secondary" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </GlassButton>
                <GlassButton
                  variant={targetAction === 'CANCEL_BOOKING' ? 'danger' : 'primary'}
                  onClick={handleConfirm}
                  loading={isSubmitting}
                >
                  {action.confirmLabel}
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
