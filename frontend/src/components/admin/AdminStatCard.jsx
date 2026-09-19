import { AnimatedNumber } from '../ui/AnimatedNumber'
import { GlassCard } from '../ui/GlassCard'
import { cn } from '../../utils/cn'

export function AdminStatCard({
  icon: Icon,
  label,
  value,
  supportingText,
  tone = 'accent',
  className,
}) {
  return (
    <GlassCard className={cn('admin-stat-card', `admin-stat-card--${tone}`, className)} hover>
      <div className="admin-stat-top">
        <span className="admin-stat-icon">
          <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        </span>
        {supportingText && <span className="admin-stat-subtext">{supportingText}</span>}
      </div>
      <div className="admin-stat-body">
        <strong className="admin-stat-value">
          <AnimatedNumber value={value} />
        </strong>
        <span className="admin-stat-label">{label}</span>
      </div>
    </GlassCard>
  )
}
