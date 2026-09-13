import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    ({ type = 'info', message, duration = 4000 }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const newToast = { id, type, message }

      setToasts((prev) => [...prev.slice(-3), newToast]) // Keep at most 4 toasts

      if (duration > 0) {
        window.setTimeout(() => {
          removeToast(id)
        }, duration)
      }

      return id
    },
    [removeToast],
  )

  const toast = useMemo(
    () => ({
      success: (message, duration) => addToast({ type: 'success', message, duration }),
      error: (message, duration) => addToast({ type: 'error', message, duration }),
      warning: (message, duration) => addToast({ type: 'warning', message, duration }),
      info: (message, duration) => addToast({ type: 'info', message, duration }),
      dismiss: removeToast,
    }),
    [addToast, removeToast],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Floating Container */}
      <aside className="glass-toast-portal" aria-label="Notifications" aria-live="polite">
        <AnimatePresence>
          {toasts.map((item) => {
            const Icon = TOAST_ICONS[item.type] || Info
            return (
              <motion.div
                key={item.id}
                className={`glass-toast glass-toast--${item.type}`}
                role="status"
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="glass-toast-icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <p className="glass-toast-message">{item.message}</p>
                <button
                  type="button"
                  className="glass-toast-close"
                  onClick={() => removeToast(item.id)}
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </aside>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Fallback object so components won't throw if rendered outside ToastProvider
    return {
      success: (msg) => console.log('[Toast Success]', msg),
      error: (msg) => console.error('[Toast Error]', msg),
      warning: (msg) => console.warn('[Toast Warning]', msg),
      info: (msg) => console.log('[Toast Info]', msg),
      dismiss: () => {},
    }
  }
  return context
}
