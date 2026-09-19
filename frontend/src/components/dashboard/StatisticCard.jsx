import { GlassCard } from '../ui/GlassCard'
import { AnimatedNumber } from '../ui/AnimatedNumber'

export function StatisticCard({ icon: Icon, value, label, supportingText }) {
  return (
    <GlassCard className="statistic-card" hover>
      <span className="statistic-icon"><Icon size={19} strokeWidth={1.8} aria-hidden="true" /></span>
      <strong className="statistic-value"><AnimatedNumber value={value} /></strong>
      <span className="statistic-label">{label}</span>
      {supportingText && <small>{supportingText}</small>}
    </GlassCard>
  )
}
