import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import { GlassButton } from '../ui/GlassButton'
import { GlassInput } from '../ui/GlassInput'

export const carPriceRanges = [
  { value: 'ALL', label: 'Any daily price' },
  { value: 'UNDER_2500', label: 'Under ₹2,500' },
  { value: '2500_TO_4000', label: '₹2,500 – ₹4,000' },
  { value: 'OVER_4000', label: 'Over ₹4,000' },
]

export const bikePriceRanges = [
  { value: 'ALL', label: 'Any daily price' },
  { value: 'UNDER_800', label: 'Under ₹800' },
  { value: '800_TO_1800', label: '₹800 – ₹1,800' },
  { value: 'OVER_1800', label: 'Over ₹1,800' },
]

export const priceRanges = carPriceRanges

export const sortOptions = [
  { value: 'RECOMMENDED', label: 'Recommended' },
  { value: 'PRICE_ASC', label: 'Price: Low to High' },
  { value: 'PRICE_DESC', label: 'Price: High to Low' },
  { value: 'NEWEST', label: 'Newest Year' },
  { value: 'OLDEST', label: 'Oldest Year' },
  { value: 'NAME_ASC', label: 'Name: A to Z' },
  { value: 'NAME_DESC', label: 'Name: Z to A' },
]

function SelectField({ label, name, value, options, onChange }) {
  return (
    <label className="glass-select-group">
      <span>{label}</span>
      <select name={name} value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || (option === 'ALL' ? 'All' : option.replaceAll('_', ' '))}
          </option>
        ))}
      </select>
    </label>
  )
}

function FilterFields({
  filters,
  vehicleType = 'car',
  classes = [],
  models = [],
  years = [],
  fuelTypes = [],
  transmissions = [],
  onChange,
  includeSort = false,
}) {
  const activePriceRanges = vehicleType === 'bike' ? bikePriceRanges : carPriceRanges

  return (
    <div className="vehicle-filter-fields">
      {models.length > 0 && (
        <SelectField
          label="Model"
          name="model"
          value={filters.model || 'ALL'}
          onChange={onChange}
          options={['ALL', ...models]}
        />
      )}
      {classes.length > 0 && (
        <SelectField
          label={vehicleType === 'bike' ? 'Bike class' : 'Car class'}
          name="class"
          value={filters.class || 'ALL'}
          onChange={onChange}
          options={['ALL', ...classes]}
        />
      )}
      {fuelTypes.length > 0 && (
        <SelectField
          label="Fuel"
          name="fuelType"
          value={filters.fuelType || 'ALL'}
          onChange={onChange}
          options={['ALL', ...fuelTypes]}
        />
      )}
      {transmissions.length > 0 && (
        <SelectField
          label="Transmission"
          name="transmission"
          value={filters.transmission || 'ALL'}
          onChange={onChange}
          options={['ALL', ...transmissions]}
        />
      )}
      <SelectField
        label="Availability"
        name="status"
        value={filters.status}
        onChange={onChange}
        options={['ALL', 'AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'INACTIVE']}
      />
      <SelectField
        label="Daily price"
        name="price"
        value={filters.price}
        onChange={onChange}
        options={activePriceRanges}
      />
      <SelectField
        label="Model year"
        name="year"
        value={filters.year}
        onChange={onChange}
        options={['ALL', ...years.map(String)]}
      />
      {includeSort && (
        <SelectField
          label="Sort by"
          name="sort"
          value={filters.sort}
          onChange={onChange}
          options={sortOptions}
        />
      )}
    </div>
  )
}

export function VehicleFilters({
  filters,
  vehicleType = 'car',
  classes = [],
  models = [],
  years = [],
  fuelTypes = [],
  transmissions = [],
  hasActiveFilters,
  onChange,
  onClear,
  onSearchSubmit,
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const isBike = vehicleType === 'bike'
  const searchPlaceholder = isBike
    ? 'Search Classic 350, R15, Duke, Activa, Ninja, Pulsar, Himalayan...'
    : 'Search Swift, Fortuner, Thar, Creta, Safari, X5, Defender...'

  return (
    <div className="vehicle-filters">
      <div className="vehicle-discovery-bar">
        <GlassInput
          className="vehicle-search"
          label={isBike ? 'Search bikes & scooters' : 'Search cars'}
          name="search"
          placeholder={searchPlaceholder}
          startIcon={Search}
          value={filters.search}
          onChange={onChange}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSearchSubmit?.()
            }
          }}
          onBlur={onSearchSubmit}
        />
        <SelectField
          label="Sort by"
          name="sort"
          value={filters.sort}
          onChange={onChange}
          options={sortOptions}
        />
        <GlassButton
          className="mobile-filter-button"
          variant="secondary"
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open filter options"
        >
          <SlidersHorizontal size={17} aria-hidden="true" />
          <span>Filters</span>
          {hasActiveFilters && <span className="filter-count" />}
        </GlassButton>
      </div>

      <div className="desktop-filter-row">
        <FilterFields
          filters={filters}
          vehicleType={vehicleType}
          classes={classes}
          models={models}
          years={years}
          fuelTypes={fuelTypes}
          transmissions={transmissions}
          onChange={onChange}
        />
        {hasActiveFilters && (
          <GlassButton variant="ghost" size="sm" onClick={onClear}>
            <RotateCcw size={14} aria-hidden="true" /> Reset filters
          </GlassButton>
        )}
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <div className="filter-sheet-layer" role="dialog" aria-modal="true" aria-labelledby="filter-sheet-title">
            <motion.div
              className="filter-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              className="filter-sheet"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="filter-sheet-heading">
                <div>
                  <p className="eyebrow">{isBike ? 'Refine bikes' : 'Refine cars'}</p>
                  <h3 id="filter-sheet-title">Filters & Options</h3>
                </div>
                <button
                  type="button"
                  className="filter-close-button"
                  onClick={() => setIsMobileOpen(false)}
                  aria-label="Close filters"
                >
                  <X size={20} />
                </button>
              </div>

              <FilterFields
                filters={filters}
                vehicleType={vehicleType}
                classes={classes}
                models={models}
                years={years}
                fuelTypes={fuelTypes}
                transmissions={transmissions}
                onChange={onChange}
                includeSort
              />

              <div className="filter-sheet-actions">
                <GlassButton variant="secondary" onClick={onClear}>
                  Reset all
                </GlassButton>
                <GlassButton onClick={() => setIsMobileOpen(false)}>
                  Show {isBike ? 'bikes' : 'cars'}
                </GlassButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
