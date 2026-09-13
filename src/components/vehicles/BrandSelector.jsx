import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { smoothSpring } from '../../animations/variants'

export function BrandSelector({ brands = [], selectedBrand = 'ALL', brandCounts = {}, onSelectBrand }) {
  if (brands.length <= 1 && selectedBrand === 'ALL') {
    return null
  }

  return (
    <div className="brand-selector-wrap" aria-label="Filter by vehicle brand">
      <span className="brand-selector-title">Brand</span>
      <div className="brand-pill-rail">
        <button
          type="button"
          className={cn('brand-pill-btn', selectedBrand === 'ALL' && 'brand-pill-btn--active')}
          onClick={() => onSelectBrand('ALL')}
          aria-pressed={selectedBrand === 'ALL'}
        >
          {selectedBrand === 'ALL' && (
            <motion.div
              className="brand-pill-active-bg"
              layoutId="brandPillActive"
              transition={smoothSpring}
            />
          )}
          <span className="brand-pill-label">All Brands</span>
        </button>

        {brands.map((brand) => {
          const isSelected = selectedBrand === brand
          const count = brandCounts[brand]

          return (
            <button
              key={brand}
              type="button"
              className={cn('brand-pill-btn', isSelected && 'brand-pill-btn--active')}
              onClick={() => onSelectBrand(brand)}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <motion.div
                  className="brand-pill-active-bg"
                  layoutId="brandPillActive"
                  transition={smoothSpring}
                />
              )}
              <span className="brand-pill-label">{brand}</span>
              {count !== undefined && <span className="brand-pill-count">{count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
