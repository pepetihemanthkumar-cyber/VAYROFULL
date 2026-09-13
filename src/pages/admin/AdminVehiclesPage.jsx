import { motion } from 'framer-motion'
import {
  AlertCircle,
  Bike,
  CarFront,
  CheckCircle2,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fadeUp } from '../../animations/variants'
import { VehicleManagementTable } from '../../components/admin/VehicleManagementTable'
import { VehicleStatusModal } from '../../components/admin/VehicleStatusModal'
import { GlassButton } from '../../components/ui/GlassButton'
import { GlassCard } from '../../components/ui/GlassCard'
import { GlassInput } from '../../components/ui/GlassInput'
import { getVehicles, updateVehicleStatus } from '../../services/vehicleService'

const defaultFilters = {
  vehicleType: 'ALL',
  search: '',
  status: 'ALL',
  type: 'ALL',
  brand: 'ALL',
  year: 'ALL',
  sort: 'RECOMMENDED',
}

function sortVehicles(list, sort) {
  const nextList = [...list]
  if (sort === 'PRICE_ASC') return nextList.sort((a, b) => a.dailyRate - b.dailyRate)
  if (sort === 'PRICE_DESC') return nextList.sort((a, b) => b.dailyRate - a.dailyRate)
  if (sort === 'NAME_ASC') return nextList.sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'NAME_DESC') return nextList.sort((a, b) => b.name.localeCompare(a.name))
  if (sort === 'NEWEST') return nextList.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name))
  if (sort === 'OLDEST') return nextList.sort((a, b) => a.year - b.year || a.name.localeCompare(b.name))
  const statusRank = { AVAILABLE: 0, RESERVED: 1, RENTED: 2, MAINTENANCE: 3, INACTIVE: 4 }
  return nextList.sort((a, b) => (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99) || a.dailyRate - b.dailyRate)
}

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState([])
  const [filters, setFilters] = useState(defaultFilters)
  const [selectedVehicleForStatus, setSelectedVehicleForStatus] = useState(null)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  function loadVehicles() {
    setVehicles(getVehicles())
  }

  useEffect(() => {
    loadVehicles()
  }, [])

  const carsCount = useMemo(() => vehicles.filter((v) => (v.vehicleType || 'car') === 'car').length, [vehicles])
  const bikesCount = useMemo(() => vehicles.filter((v) => v.vehicleType === 'bike').length, [vehicles])

  const brands = useMemo(() => {
    let pool = vehicles
    if (filters.vehicleType !== 'ALL') {
      pool = pool.filter((v) => (v.vehicleType || 'car') === filters.vehicleType)
    }
    return [...new Set(pool.map((v) => v.brand))].sort()
  }, [vehicles, filters.vehicleType])

  const years = useMemo(() => [...new Set(vehicles.map((v) => v.year))].sort((a, b) => b - a), [vehicles])

  const filteredVehicles = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    const matching = vehicles.filter((v) => {
      const vType = v.vehicleType || 'car'
      const searchable = [v.name, v.brand, v.model, v.registrationNumber, v.category, v.type, v.class].filter(Boolean).join(' ').toLowerCase()
      return (
        (filters.vehicleType === 'ALL' || vType === filters.vehicleType) &&
        (!q || searchable.includes(q)) &&
        (filters.status === 'ALL' || v.status === filters.status) &&
        (filters.type === 'ALL' || (v.category || v.type) === filters.type) &&
        (filters.brand === 'ALL' || v.brand === filters.brand) &&
        (filters.year === 'ALL' || String(v.year) === filters.year)
      )
    })
    return sortVehicles(matching, filters.sort)
  }, [vehicles, filters])

  const hasActiveFilters = Object.entries(filters).some(
    ([k, val]) => k !== 'sort' && val !== defaultFilters[k],
  )

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleTypeTabChange(type) {
    setFilters((prev) => ({
      ...prev,
      vehicleType: type,
      brand: 'ALL',
      type: 'ALL',
    }))
  }

  function handleClearFilters() {
    setFilters(defaultFilters)
  }

  function handleOpenStatusModal(vehicle) {
    setSelectedVehicleForStatus(vehicle)
    setIsStatusModalOpen(true)
  }

  async function handleApplyStatus(vehicleId, newStatus) {
    setIsUpdatingStatus(true)
    try {
      await updateVehicleStatus(vehicleId, newStatus)
      loadVehicles()
      setToastMessage({
        type: 'success',
        text: `Vehicle operational status updated to ${newStatus}.`,
      })
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Failed to update vehicle status.',
      })
      throw err
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <section className="admin-fleet-page">
      {/* Header */}
      <motion.div
        className="admin-fleet-header"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <div>
          <p className="eyebrow">Fleet Asset Directory</p>
          <h2>Fleet Vehicles ({vehicles.length})</h2>
          <p>Manage 135 cars and 72 bikes: pricing, availability, and depot servicing.</p>
        </div>
        <GlassButton as={Link} to="/admin/vehicles/new">
          <Plus size={16} aria-hidden="true" /> Add vehicle
        </GlassButton>
      </motion.div>

      {/* Fleet Type Pills: All / Cars / Bikes */}
      <motion.div className="admin-type-tabs-rail" initial="hidden" animate="visible" variants={fadeUp} custom={0.03}>
        <button
          type="button"
          className={`admin-type-pill ${filters.vehicleType === 'ALL' ? 'is-active' : ''}`}
          onClick={() => handleTypeTabChange('ALL')}
        >
          <span>All Fleet</span>
          <span className="admin-type-count">{vehicles.length}</span>
        </button>
        <button
          type="button"
          className={`admin-type-pill ${filters.vehicleType === 'car' ? 'is-active' : ''}`}
          onClick={() => handleTypeTabChange('car')}
        >
          <CarFront size={15} aria-hidden="true" />
          <span>Cars</span>
          <span className="admin-type-count">{carsCount}</span>
        </button>
        <button
          type="button"
          className={`admin-type-pill ${filters.vehicleType === 'bike' ? 'is-active' : ''}`}
          onClick={() => handleTypeTabChange('bike')}
        >
          <Bike size={15} aria-hidden="true" />
          <span>Bikes</span>
          <span className="admin-type-count">{bikesCount}</span>
        </button>
      </motion.div>

      {/* Toast Alert */}
      {toastMessage && (
        <motion.div
          className={`details-toast details-toast--${toastMessage.type}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          role="status"
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={18} aria-hidden="true" />
          ) : (
            <AlertCircle size={18} aria-hidden="true" />
          )}
          <span>{toastMessage.text}</span>
        </motion.div>
      )}

      {/* Filters Toolbar */}
      <motion.div
        className="admin-filters-card"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0.06}
      >
        <div className="admin-filter-bar-top">
          <GlassInput
            className="admin-search-input"
            label="Search Fleet"
            placeholder="Search by name, brand, model or registration..."
            name="search"
            startIcon={Search}
            value={filters.search}
            onChange={handleFilterChange}
          />
          <div className="glass-select-group admin-sort-select">
            <span>Sort by</span>
            <select name="sort" value={filters.sort} onChange={handleFilterChange}>
              <option value="RECOMMENDED">Recommended</option>
              <option value="NAME_ASC">Name: A to Z</option>
              <option value="NAME_DESC">Name: Z to A</option>
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="PRICE_DESC">Price: High to Low</option>
              <option value="NEWEST">Newest Model Year</option>
              <option value="OLDEST">Oldest Model Year</option>
            </select>
          </div>
        </div>

        <div className="admin-filter-bar-bottom">
          <div className="glass-select-group">
            <span>Status</span>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="ALL">All statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="RENTED">Rented</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="glass-select-group">
            <span>Brand</span>
            <select name="brand" value={filters.brand} onChange={handleFilterChange}>
              <option value="ALL">All brands ({brands.length})</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          <div className="glass-select-group">
            <span>Model year</span>
            <select name="year" value={filters.year} onChange={handleFilterChange}>
              <option value="ALL">All years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <GlassButton
              variant="ghost"
              size="sm"
              className="admin-reset-filters-btn"
              onClick={handleClearFilters}
            >
              <RotateCcw size={14} aria-hidden="true" /> Reset filters
            </GlassButton>
          )}
        </div>
      </motion.div>

      {/* Fleet Table or Empty State */}
      <motion.div
        className="admin-table-wrap"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0.1}
      >
        <div className="admin-table-status-bar">
          <span>
            Showing <strong>{filteredVehicles.length}</strong> of {vehicles.length} fleet units
          </span>
        </div>

        {filteredVehicles.length > 0 ? (
          <VehicleManagementTable
            vehicles={filteredVehicles}
            onStatusChange={handleOpenStatusModal}
          />
        ) : (
          <GlassCard className="admin-empty-table-card">
            <span className="vehicle-empty-icon">
              <CarFront size={24} />
            </span>
            <h3>No fleet units match your filters</h3>
            <p>Try clearing or modifying your filter criteria to inspect active inventory.</p>
            <GlassButton variant="secondary" onClick={handleClearFilters}>
              <RotateCcw size={15} aria-hidden="true" /> Reset all filters
            </GlassButton>
          </GlassCard>
        )}
      </motion.div>

      {/* Status Modal */}
      <VehicleStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        vehicle={selectedVehicleForStatus}
        onApplyStatus={handleApplyStatus}
        isSubmitting={isUpdatingStatus}
      />
    </section>
  )
}
