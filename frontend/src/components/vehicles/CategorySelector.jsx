import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { smoothSpring } from '../../animations/variants'

export const CAR_CATEGORIES = [
  { id: 'ALL', label: 'All Cars' },
  { id: 'SEDAN', label: 'Sedan' },
  { id: 'SUV', label: 'SUV' },
  { id: 'HATCHBACK', label: 'Hatchback' },
  { id: 'MUV', label: 'MUV' },
  { id: 'LUXURY', label: 'Luxury' },
  { id: 'VAN', label: 'Van' },
]

export const BIKE_CATEGORIES = [
  { id: 'ALL', label: 'All Bikes' },
  { id: 'COMMUTER', label: 'Commuter' },
  { id: 'STREET', label: 'Street' },
  { id: 'SPORT', label: 'Sport' },
  { id: 'CRUISER', label: 'Cruiser' },
  { id: 'ADVENTURE', label: 'Adventure' },
  { id: 'TOURING', label: 'Touring' },
  { id: 'SCOOTER', label: 'Scooter' },
  { id: 'PREMIUM', label: 'Premium' },
  { id: 'ELECTRIC', label: 'Electric' },
]

export const CATEGORIES = CAR_CATEGORIES

export function CategorySelector({
  selectedCategory = 'ALL',
  vehicleType = 'car',
  counts = {},
  onSelectCategory,
  customCategories,
}) {
  const list = customCategories || (vehicleType === 'bike' ? BIKE_CATEGORIES : CAR_CATEGORIES)

  return (
    <nav className="category-nav-wrap" aria-label={vehicleType === 'bike' ? 'Bike categories' : 'Car categories'}>
      <div className="category-pill-rail">
        {list.map((cat) => {
          const isSelected = selectedCategory === cat.id
          const count = counts[cat.id] || 0

          return (
            <button
              key={cat.id}
              type="button"
              className={cn('category-pill-btn', isSelected && 'category-pill-btn--active')}
              onClick={() => onSelectCategory(cat.id)}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <motion.div
                  className="category-pill-active-bg"
                  layoutId="categoryPillActive"
                  transition={smoothSpring}
                />
              )}
              <span className="category-pill-label">{cat.label}</span>
              {count > 0 && <span className="category-pill-count">{count}</span>}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
