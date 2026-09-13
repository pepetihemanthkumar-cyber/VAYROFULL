import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Fuel, ShieldCheck } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { GlassButton } from '../ui/GlassButton'
import { modalTransition, backdropTransition } from '../../animations/variants'
import { formatDate } from '../../utils/formatters'
import { useEscapeKey } from '../../hooks/useEscapeKey'

export function ReturnVehicleModal({ isOpen, onClose, onConfirm, booking }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fuelLevel] = useState('100% (Full)')
  useEscapeKey(isOpen, onClose, isSubmitting)

  const vehicle = booking?.vehicle || {}

  async function handleConfirmReturn() {
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
          aria-labelledby="return-modal-title"
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
              <div className="return-icon-wrap">
                <RotateCcw size={32} className="text-info" aria-hidden="true" />
              </div>

              <div className="cancel-modal-header">
                <h3 id="return-modal-title">Return Vehicle to Depot</h3>
                <p>Confirm the completion of your journey. The vehicle will be inspected and checked back into the VAYRO fleet.</p>
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
                  <span>Return Location</span>
                  <strong>{booking.returnLocation || 'VAYRO Vijayawada Central'}</strong>
                </div>
                <div className="summary-row">
                  <span>Return Deadline</span>
                  <strong>{formatDate(booking.returnDate)} · {booking.returnTime || '10:00 AM'}</strong>
                </div>
              </div>

              <div className="return-check-items">
                <div className="return-check-item">
                  <Fuel size={16} aria-hidden="true" />
                  <div>
                    <small>Fuel Level</small>
                    <strong>{fuelLevel}</strong>
                  </div>
                </div>
                <div className="return-check-item">
                  <ShieldCheck size={16} aria-hidden="true" />
                  <div>
                    <small>Inspection</small>
                    <strong>Zero damage recorded</strong>
                  </div>
                </div>
              </div>

              <div className="cancel-modal-actions modal-actions">
                <GlassButton variant="secondary" onClick={onClose} disabled={isSubmitting}>
                  Keep driving
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleConfirmReturn}
                  loading={isSubmitting}
                  className="confirm-return-btn"
                >
                  Confirm vehicle return
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
