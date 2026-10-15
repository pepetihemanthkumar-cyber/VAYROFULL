import { cn } from '../../utils/cn'

const statusStyles = {
  available: 'success',
  reserved: 'warning',
  rented: 'info',
  maintenance: 'attention',
  inactive: 'neutral',
  confirmed: 'success',
  active: 'info',
  returned: 'success',
  completed: 'neutral',
  cancelled: 'danger',
}

export function GlassBadge({ children, className, status }) {
  const label = status || children
  const tone = statusStyles[String(label ?? '').trim().toLowerCase()] || 'neutral'

  return <span className={cn('glass-badge', `glass-badge--${tone}`, className)}>{children || status}</span>
}
