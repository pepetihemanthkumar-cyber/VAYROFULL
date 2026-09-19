import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, ShieldAlert, UserCheck, X } from 'lucide-react'
import { useState } from 'react'
import { modalTransition, backdropTransition } from '../../animations/variants'
import { useEscapeKey } from '../../hooks/useEscapeKey'
import { GlassButton } from '../ui/GlassButton'
import { GlassCard } from '../ui/GlassCard'

export function UserStatusModal({
  isOpen,
  user,
  actionType, // 'SUSPEND' | 'REACTIVATE'
  onClose,
  onConfirm,
  isSubmitting = false,
}) {
  useEscapeKey(isOpen, onClose, isSubmitting)

  const [error, setError] = useState('')

  const isSuspend = actionType === 'SUSPEND'
  const newStatus = isSuspend ? 'SUSPENDED' : 'ACTIVE'

  async function handleConfirm() {
    if (!user) return
    setError('')
    try {
      await onConfirm(user.id, newStatus)
      onClose()
    } catch (err) {
      setError(err.message || `Failed to ${isSuspend ? 'suspend' : 'reactivate'} user.`)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && user && (
        <motion.div
          className="glass-modal-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-modal-title"
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
                <div className={`modal-icon-wrap ${isSuspend ? 'modal-icon-wrap--danger' : 'modal-icon-wrap--info'}`}>
                  {isSuspend ? <ShieldAlert size={20} aria-hidden="true" /> : <UserCheck size={20} aria-hidden="true" />}
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
                <h3 id="user-modal-title">
                  {isSuspend ? 'Suspend user account?' : 'Reactivate user account?'}
                </h3>
                <p>
                  {isSuspend
                    ? `You are suspending ${user.name} (${user.email}). The user will immediately be barred from signing in and making new bookings.`
                    : `You are restoring full platform access for ${user.name} (${user.email}).`}
                </p>

                {user.role === 'ADMIN' && isSuspend && (
                  <div className="form-alert form-alert--warning" role="alert">
                    <AlertTriangle size={16} aria-hidden="true" />
                    <span>Administrator account: ensuring at least one active administrator remains.</span>
                  </div>
                )}

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
                  variant={isSuspend ? 'danger' : 'primary'}
                  onClick={handleConfirm}
                  loading={isSubmitting}
                >
                  {isSuspend ? 'Suspend Account' : 'Reactivate Account'}
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
