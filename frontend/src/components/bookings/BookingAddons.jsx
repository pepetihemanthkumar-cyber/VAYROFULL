import { Check, HardHat, Navigation, Package, ShieldCheck, Smartphone, Users, Wrench } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { formatCurrency } from '../../utils/formatters'
import { getAddonsForVehicle, RENTAL_ADDONS } from '../../utils/rental'
import { cn } from '../../utils/cn'

const addonIcons = {
  ShieldCheck,
  Wrench,
  Navigation,
  Users,
  HardHat,
  Smartphone,
  Package,
}

export function BookingAddons({ vehicle, selectedAddons = [], onChange, duration, rentalDays = 1 }) {
  const availableAddons = vehicle ? getAddonsForVehicle(vehicle) : RENTAL_ADDONS

  function handleToggle(id) {
    if (selectedAddons.includes(id)) {
      onChange(selectedAddons.filter((item) => item !== id))
    } else {
      onChange([...selectedAddons, id])
    }
  }

  const multiplier = duration?.wholeDays === 0
    ? Math.max(0.25, Math.round(((duration.hours || 1) / 24) * 100) / 100)
    : duration?.wholeDays
    ? duration.wholeDays + (duration.remainingHours ? Math.round((duration.remainingHours / 24) * 100) / 100 : 0)
    : Math.max(1, rentalDays)

  return (
    <div className="booking-addons-grid">
      {availableAddons.map((addon) => {
        const Icon = addonIcons[addon.icon] || ShieldCheck
        const isSelected = selectedAddons.includes(addon.id)
        const total = Math.round(addon.pricePerDay * multiplier)

        return (
          <GlassCard
            key={addon.id}
            as="div"
            hover
            className={cn('addon-card', isSelected && 'is-selected')}
            onClick={() => handleToggle(addon.id)}
            role="checkbox"
            aria-checked={isSelected}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                handleToggle(addon.id)
              }
            }}
          >
            <div className="addon-header">
              <span className={cn('addon-icon', isSelected && 'is-active')}>
                <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className={cn('addon-checkbox', isSelected && 'is-checked')}>
                {isSelected && <Check size={13} strokeWidth={2.8} aria-hidden="true" />}
              </span>
            </div>

            <div className="addon-content">
              <h4>{addon.name}</h4>
              <p>{addon.description}</p>
            </div>

            <div className="addon-pricing">
              <strong>{formatCurrency(addon.pricePerDay)}</strong>
              <span>/ day · {formatCurrency(total)} estimated</span>
            </div>
          </GlassCard>
        )
      })}
    </div>
  )
}
