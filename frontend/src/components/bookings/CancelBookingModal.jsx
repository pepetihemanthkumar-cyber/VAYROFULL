import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { GlassButton } from '../ui/GlassButton'
import { modalTransition, backdropTransition } from '../../animations/variants'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { useEscapeKey } from '../../hooks/useEscapeKey'

export function CancelBookingModal({ isOpen, onClose, onConfirm, booking }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  useEscapeKey(isOpen, onClose, isSubmitting)

  const vehicle = booking?.vehicle || {}

  async function handleConfirmCancel() {
    if (!booking) return
    setIsSubmitting(true)
    try {
      await onConfirm(booking.id)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && booking && (
        <motion.div
          className="modal-backdrop glass-modal-layer"
          onClick={!isSubmitting ? onClose : undefined}
          variants={backdropTransition}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
        >
          <motion.div
            className="cancel-modal-container glass-modal-container"
            onClick={(e) => e.stopPropagation()}
            variants={modalTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <GlassCard className="cancel-modal-card glass-modal-card">
              <div className="cancel-icon-wrap">
                <AlertTriangle size={32} className="text-warning" aria-hidden="true" />
              </div>

              <div className="cancel-modal-header">
                <h3 id="cancel-modal-title">Cancel Reservation?</h3>
                <p>Are you sure you want to cancel this booking? This will release the vehicle reservation back to the fleet.</p>
              </div>

              <div className="cancel-booking-summary">
                <div className="summary-row">
                  <span>Booking ID</span>
                  <strong>{booking.id}</strong>
                </div>
                <div className="summary-row">
                  <span>Vehicle</span>
                  <strong>{vehicle.name || 'Vehicle'}</strong>
                </div>
                <div className="summary-row">
                  <span>Schedule</span>
                  <strong>{formatDate(booking.pickupDate)} · {booking.pickupTime || '10:00 AM'}</strong>
                </div>
                <div className="summary-row">
                  <span>Refund / Total</span>
                  <strong className="text-accent">{formatCurrency(booking.totalAmount)}</strong>
                </div>
              </div>

              <div className="cancel-modal-actions modal-actions">
                <GlassButton variant="secondary" onClick={onClose} disabled={isSubmitting}>
                  Keep reservation
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleConfirmCancel}
                  loading={isSubmitting}
                  className="btn-danger-confirm"
                >
                  Confirm cancellation
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
