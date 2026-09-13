import { motion } from 'framer-motion'
import { Bike, CarFront } from 'lucide-react'
import { cn } from '../../utils/cn'
import { smoothSpring } from '../../animations/variants'

export function VehicleTypeSelector({
  selectedType = 'car',
  onChange,
  carCount = 135,
  bikeCount = 72,
  className,
}) {
  const options = [
    {
      id: 'car',
      label: 'Cars',
      icon: CarFront,
      count: carCount,
      ariaLabel: `Browse Cars (${carCount} models)`,
    },
    {
      id: 'bike',
      label: 'Bikes',
      icon: Bike,
      count: bikeCount,
      ariaLabel: `Browse Bikes (${bikeCount} models)`,
    },
  ]

  return (
    <div
      className={cn('vehicle-type-selector-wrap', className)}
      role="group"
      aria-label="Select rental vehicle category"
    >
      <div className="vehicle-type-pill-container">
        {options.map((option) => {
          const isSelected = selectedType === option.id
          const Icon = option.icon

          return (
            <button
              key={option.id}
              type="button"
              className={cn(
                'vehicle-type-btn',
                isSelected && 'vehicle-type-btn--active',
              )}
              onClick={() => onChange(option.id)}
              aria-pressed={isSelected}
              aria-label={option.ariaLabel}
            >
              {isSelected && (
                <motion.div
                  className="vehicle-type-active-bg"
                  layoutId="vehicleTypeSelectorActive"
                  transition={smoothSpring}
                />
              )}
              <span className="vehicle-type-btn-content">
                <Icon
                  size={19}
                  strokeWidth={2}
                  className={cn(
                    'vehicle-type-icon',
                    isSelected ? 'text-accent' : 'text-text-muted',
                  )}
                  aria-hidden="true"
                />
                <span className="vehicle-type-label">{option.label}</span>
                {option.count > 0 && (
                  <span
                    className={cn(
                      'vehicle-type-count',
                      isSelected ? 'is-active' : '',
                    )}
                  >
                    {option.count}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
