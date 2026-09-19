import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { formatStatus } from '../../utils/formatters'
import { chipTransition } from '../../animations/variants'

const PRICE_LABELS = {
  UNDER_2500: 'Under ₹2,500',
  '2500_TO_4000': '₹2,500 – ₹4,000',
  OVER_4000: 'Over ₹4,000',
  UNDER_800: 'Under ₹800',
  '800_TO_1800': '₹800 – ₹1,800',
  OVER_1800: 'Over ₹1,800',
}

export function ActiveFilterChips({ filters, onRemoveFilter, onClearAll }) {
  const chips = []

  if (filters.category && filters.category !== 'ALL') {
    chips.push({ key: 'category', label: `Category: ${filters.category}` })
  }
  if (filters.brand && filters.brand !== 'ALL') {
    chips.push({ key: 'brand', label: `Brand: ${filters.brand}` })
  }
  if (filters.class && filters.class !== 'ALL') {
    chips.push({ key: 'class', label: `Class: ${filters.class}` })
  }
  if (filters.model && filters.model !== 'ALL') {
    chips.push({ key: 'model', label: `Model: ${filters.model}` })
  }
  if (filters.fuelType && filters.fuelType !== 'ALL') {
    chips.push({ key: 'fuelType', label: `Fuel: ${filters.fuelType}` })
  }
  if (filters.transmission && filters.transmission !== 'ALL') {
    chips.push({ key: 'transmission', label: `Transmission: ${filters.transmission}` })
  }
  if (filters.status && filters.status !== 'ALL') {
    chips.push({ key: 'status', label: `Status: ${formatStatus(filters.status)}` })
  }
  if (filters.price && filters.price !== 'ALL') {
    chips.push({ key: 'price', label: `Price: ${PRICE_LABELS[filters.price] || filters.price}` })
  }
  if (filters.year && filters.year !== 'ALL') {
    chips.push({ key: 'year', label: `Year: ${filters.year}` })
  }
  if (filters.search && filters.search.trim()) {
    chips.push({ key: 'search', label: `Search: "${filters.search.trim()}"` })
  }

  if (chips.length === 0) return null

  return (
    <div className="active-filter-chips-row" aria-label="Active filters">
      <span className="active-chips-title">Active filters:</span>
      <div className="active-chips-list">
        <AnimatePresence>
          {chips.map((chip) => (
            <motion.button
              key={chip.key}
              type="button"
              className="filter-chip"
              onClick={() => onRemoveFilter(chip.key)}
              title={`Remove filter: ${chip.label}`}
              aria-label={`Remove filter: ${chip.label}`}
              variants={chipTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
            >
              <span>{chip.label}</span>
              <X size={13} aria-hidden="true" />
            </motion.button>
          ))}
        </AnimatePresence>

        <button
          type="button"
          className="clear-all-chips-btn"
          onClick={onClearAll}
          title="Clear all active filters"
        >
          Clear all
        </button>
      </div>
    </div>
  )
}
