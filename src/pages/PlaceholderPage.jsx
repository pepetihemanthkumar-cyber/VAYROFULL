import { Construction } from 'lucide-react'
import { GlassCard } from '../components/ui/GlassCard'

export default function PlaceholderPage({ eyebrow, title, description }) {
  return (
    <section className="placeholder-page">
      <GlassCard className="placeholder-card">
        <span className="placeholder-icon"><Construction size={22} strokeWidth={1.75} /></span>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </GlassCard>
    </section>
  )
}
