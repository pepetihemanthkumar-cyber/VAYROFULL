import { Bike, CarFront, Clock3, RotateCcw, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ActiveFilterChips } from '../components/vehicles/ActiveFilterChips'
import { BrandSelector } from '../components/vehicles/BrandSelector'
import { CategorySelector } from '../components/vehicles/CategorySelector'
import { VehicleCard } from '../components/vehicles/VehicleCard'
import { VehicleFilters } from '../components/vehicles/VehicleFilters'
import { VehicleSkeleton } from '../components/vehicles/VehicleSkeleton'
import { VehicleTypeSelector } from '../components/vehicles/VehicleTypeSelector'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassCard } from '../components/ui/GlassCard'
import {
  fetchVehicles,
  getRecentVehicleSearches,
  getVehicles,
  saveRecentVehicleSearches,
} from '../services/vehicleService'

const defaultFilters = {
  search: '',
  category: 'ALL',
  brand: 'ALL',
  class: 'ALL',
  model: 'ALL',
  fuelType: 'ALL',
  transmission: 'ALL',
  status: 'ALL',
  price: 'ALL',
  year: 'ALL',
  sort: 'RECOMMENDED',
}

function parseFiltersFromParams(params) {
  return {
    search: params.get('search') || '',
    category: (params.get('category') || 'ALL').toUpperCase(),
    brand: params.get('brand') || 'ALL',
    class: params.get('class') || 'ALL',
    model: params.get('model') || 'ALL',
    fuelType: params.get('fuelType') || 'ALL',
    transmission: params.get('transmission') || 'ALL',
    status: (params.get('status') || 'ALL').toUpperCase(),
    price: (params.get('price') || 'ALL').toUpperCase(),
    year: params.get('year') || 'ALL',
    sort: (params.get('sort') || 'RECOMMENDED').toUpperCase(),
  }
}

function syncFiltersToParams(vehicleType, filters) {
  const params = new URLSearchParams()
  if (vehicleType === 'bike') {
    params.set('type', 'bikes')
  } else {
    params.set('type', 'cars')
  }
  if (filters.search?.trim()) params.set('search', filters.search.trim())
  if (filters.category && filters.category !== 'ALL') params.set('category', filters.category)
  if (filters.brand && filters.brand !== 'ALL') params.set('brand', filters.brand)
  if (filters.class && filters.class !== 'ALL') params.set('class', filters.class)
  if (filters.model && filters.model !== 'ALL') params.set('model', filters.model)
  if (filters.fuelType && filters.fuelType !== 'ALL') params.set('fuelType', filters.fuelType)
  if (filters.transmission && filters.transmission !== 'ALL') params.set('transmission', filters.transmission)
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status)
  if (filters.price && filters.price !== 'ALL') params.set('price', filters.price)
  if (filters.year && filters.year !== 'ALL') params.set('year', filters.year)
  if (filters.sort && filters.sort !== 'RECOMMENDED') params.set('sort', filters.sort)
  return params
}

function vehicleMatchesPrice(vehicle, range) {
  if (range === 'ALL') return true
  const isBike = vehicle.vehicleType === 'bike'

  if (isBike) {
    if (range === 'UNDER_800') return vehicle.dailyRate < 800
    if (range === '800_TO_1800') return vehicle.dailyRate >= 800 && vehicle.dailyRate <= 1800
    if (range === 'OVER_1800') return vehicle.dailyRate > 1800
  } else {
    if (range === 'UNDER_2500') return vehicle.dailyRate < 2500
    if (range === '2500_TO_4000') return vehicle.dailyRate >= 2500 && vehicle.dailyRate <= 4000
    if (range === 'OVER_4000') return vehicle.dailyRate > 4000
  }
  return true
}

function sortVehicles(list, sort) {
  const nextList = [...list]
  if (sort === 'PRICE_ASC') return nextList.sort((a, b) => a.dailyRate - b.dailyRate)
  if (sort === 'PRICE_DESC') return nextList.sort((a, b) => b.dailyRate - a.dailyRate)
  if (sort === 'NEWEST') return nextList.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name))
  if (sort === 'OLDEST') return nextList.sort((a, b) => a.year - b.year || a.name.localeCompare(b.name))
  if (sort === 'NAME_ASC') return nextList.sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'NAME_DESC') return nextList.sort((a, b) => b.name.localeCompare(a.name))
  const statusRank = { AVAILABLE: 0, RESERVED: 1, RENTED: 2, MAINTENANCE: 3, INACTIVE: 4 }
  return nextList.sort(
    (a, b) =>
      (statusRank[a.status] ?? 99) - (statusRank[b.status] ?? 99) ||
      a.dailyRate - b.dailyRate,
  )
}

export default function VehiclesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Determine active vehicleType (cars vs bikes) directly from route & params
  const vehicleType = useMemo(() => {
    if (location.pathname === '/bikes' || searchParams.get('type') === 'bikes') {
      return 'bike'
    }
    return 'car'
  }, [location.pathname, searchParams])

  const [filters, setFilters] = useState(() => parseFiltersFromParams(searchParams))
  const [isLoading, setIsLoading] = useState(true)
  const [recentSearches, setRecentSearches] = useState(() => getRecentVehicleSearches())

  const [allVehicles, setAllVehicles] = useState(() => getVehicles())

  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)

    fetchVehicles()
      .then((res) => {
        if (!isCancelled && res.content?.length) {
          setAllVehicles(res.content)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  // Sync filters from URL searchParams when location/searchParams change externally
  useEffect(() => {
    const parsed = parseFiltersFromParams(searchParams)
    setFilters((prev) => {
      const isSame = Object.keys(parsed).every((k) => prev[k] === parsed[k])
      return isSame ? prev : parsed
    })
  }, [searchParams])

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 150)
    return () => window.clearTimeout(timer)
  }, [vehicleType, filters.category, filters.brand])

  // Sync state to URL params safely without infinite loop
  useEffect(() => {
    const nextParams = syncFiltersToParams(vehicleType, filters)
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [vehicleType, filters, searchParams, setSearchParams])

  // Filter pool by active vehicleType ('car' or 'bike')
  const fleetByType = useMemo(() => {
    return allVehicles.filter((v) => (v.vehicleType || 'car') === vehicleType)
  }, [allVehicles, vehicleType])

  const carTotalCount = useMemo(() => allVehicles.filter((v) => (v.vehicleType || 'car') === 'car').length, [allVehicles])
  const bikeTotalCount = useMemo(() => allVehicles.filter((v) => v.vehicleType === 'bike').length, [allVehicles])

  // Category counts calculated within active vehicleType
  const categoryCounts = useMemo(() => {
    const counts = { ALL: fleetByType.length }
    for (const v of fleetByType) {
      const cat = v.category || v.type
      counts[cat] = (counts[cat] || 0) + 1
    }
    return counts
  }, [fleetByType])

  // Vehicles matching active category (for deriving category-dependent brands)
  const categoryFilteredVehicles = useMemo(() => {
    if (filters.category === 'ALL') return fleetByType
    return fleetByType.filter((v) => (v.category || v.type) === filters.category)
  }, [fleetByType, filters.category])

  // Dynamic available brands for the active category
  const availableBrands = useMemo(() => {
    return [...new Set(categoryFilteredVehicles.map((v) => v.brand))].sort()
  }, [categoryFilteredVehicles])

  // Brand counts within active category
  const brandCounts = useMemo(() => {
    const counts = {}
    for (const v of categoryFilteredVehicles) {
      counts[v.brand] = (counts[v.brand] || 0) + 1
    }
    return counts
  }, [categoryFilteredVehicles])

  // Vehicles matching active category + brand
  const brandFilteredVehicles = useMemo(() => {
    let list = categoryFilteredVehicles
    if (filters.brand !== 'ALL') {
      list = list.filter((v) => v.brand === filters.brand)
    }
    return list
  }, [categoryFilteredVehicles, filters.brand])

  // Dynamic models derived from active category + brand
  const availableModels = useMemo(() => {
    return [...new Set(brandFilteredVehicles.map((v) => v.model))].sort()
  }, [brandFilteredVehicles])

  const availableClasses = useMemo(() => {
    return [...new Set(brandFilteredVehicles.map((v) => v.class || 'Unspecified'))].sort()
  }, [brandFilteredVehicles])

  const availableFuelTypes = useMemo(() => {
    return [...new Set(fleetByType.map((v) => v.fuelType).filter(Boolean))].sort()
  }, [fleetByType])

  const availableTransmissions = useMemo(() => {
    return [...new Set(fleetByType.map((v) => v.transmission).filter(Boolean))].sort()
  }, [fleetByType])

  const availableYears = useMemo(() => {
    return [...new Set(fleetByType.map((v) => v.year).filter((year) => Number.isFinite(Number(year))))].sort((a, b) => b - a)
  }, [fleetByType])

  // Multi-tier filtered vehicles list (respects selected vehicleType)
  const filteredVehicles = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    const matching = fleetByType.filter((v) => {
      const searchable = [
        v.name,
        v.brand,
        v.model,
        v.registrationNumber,
        v.type,
        v.category,
        v.class,
        v.enginePower,
        v.engine,
        ...(v.features || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        (!q || searchable.includes(q)) &&
        (filters.category === 'ALL' || (v.category || v.type) === filters.category) &&
        (filters.brand === 'ALL' || v.brand === filters.brand) &&
        (filters.class === 'ALL' || (v.class || 'Unspecified') === filters.class) &&
        (filters.model === 'ALL' || v.model === filters.model) &&
        (filters.fuelType === 'ALL' || v.fuelType === filters.fuelType) &&
        (filters.transmission === 'ALL' || v.transmission === filters.transmission) &&
        (filters.status === 'ALL' || v.status === filters.status) &&
        (filters.year === 'ALL' || String(v.year) === filters.year) &&
        vehicleMatchesPrice(v, filters.price)
      )
    })
    return sortVehicles(matching, filters.sort)
  }, [fleetByType, filters])

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => key !== 'sort' && value !== defaultFilters[key],
  )

  const handleTypeChange = useCallback((nextType) => {
    if (nextType === 'bike') {
      navigate('/bikes')
    } else {
      navigate('/cars')
    }
    setFilters((prev) => ({
      ...defaultFilters,
      search: prev.search,
    }))
    setIsLoading(true)
  }, [navigate])

  const handleSelectCategory = useCallback((categoryId) => {
    setFilters((prev) => ({
      ...prev,
      category: categoryId,
      brand: 'ALL',
      class: 'ALL',
      model: 'ALL',
    }))
  }, [])

  const handleSelectBrand = useCallback((brandName) => {
    setFilters((prev) => ({
      ...prev,
      brand: brandName,
      class: 'ALL',
      model: 'ALL',
    }))
  }, [])

  const handleChangeFilter = useCallback((e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleRemoveFilter = useCallback((key) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: defaultFilters[key] }
      if (key === 'category') {
        next.brand = 'ALL'
        next.model = 'ALL'
      } else if (key === 'brand') {
        next.model = 'ALL'
      }
      return next
    })
  }, [])

  const handleClearAll = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  const handleSearchSubmit = useCallback(() => {
    const trimmed = filters.search.trim()
    if (!trimmed) return

    const nextList = saveRecentVehicleSearches([trimmed, ...getRecentVehicleSearches()])
    setRecentSearches(nextList)
  }, [filters.search])

  const applyRecentSearch = useCallback((term) => {
    setFilters((prev) => ({ ...prev, search: term }))
    setRecentSearches(saveRecentVehicleSearches([term, ...getRecentVehicleSearches()]))
  }, [])

  const isBike = vehicleType === 'bike'
  const typeNoun = isBike ? 'bike' : 'car'
  const typeNounPlural = isBike ? 'bikes' : 'cars'

  const resultsSummaryText = useMemo(() => {
    if (isLoading) return `Finding ${typeNounPlural}…`
    const count = filteredVehicles.length
    const label = count === 1 ? typeNoun : typeNounPlural

    if (filters.status === 'AVAILABLE') {
      return `${count} available ${label}`
    }
    return `${count} ${label} found`
  }, [filteredVehicles.length, filters.status, isLoading, typeNoun, typeNounPlural])

  return (
    <section className="vehicles-page">
      {/* Header Banner */}
      <div className="vehicles-page-heading">
        <div>
          <p className="eyebrow">Fleet Discovery</p>
          <h2>Find your next {typeNoun}</h2>
          <p>
          {isBike
            ? `Explore ${bikeTotalCount > 0 ? bikeTotalCount : ''} premium motorcycles and smart electric scooters across our global brands.`
            : `Browse our complete catalogue of ${carTotalCount > 0 ? carTotalCount : ''} verified cars across leading automobile brands.`}
        </p>
        </div>
        <span className="inventory-count">
          {isBike ? <Bike size={17} aria-hidden="true" /> : <CarFront size={17} aria-hidden="true" />}{' '}
          {fleetByType.length} {typeNounPlural} in fleet
        </span>
      </div>

      {/* Top-Level Rental Type Selector: [ 🚗 CARS ] [ 🏍 BIKES ] */}
      <div>
        <VehicleTypeSelector
          selectedType={vehicleType}
          onChange={handleTypeChange}
          carCount={carTotalCount}
          bikeCount={bikeTotalCount}
        />
      </div>

      {/* Category Navigation Pills */}
      <div>
        <CategorySelector
          selectedCategory={filters.category}
          vehicleType={vehicleType}
          counts={categoryCounts}
          onSelectCategory={handleSelectCategory}
        />
      </div>

      {/* Dynamic Brand Navigation Pills */}
      <div>
        <BrandSelector
          brands={availableBrands}
          selectedBrand={filters.brand}
          brandCounts={brandCounts}
          onSelectBrand={handleSelectBrand}
        />
      </div>

      {/* Filter Toolbar */}
      <div>
        <VehicleFilters
          filters={filters}
          vehicleType={vehicleType}
          classes={availableClasses}
          models={availableModels}
          years={availableYears}
          fuelTypes={availableFuelTypes}
          transmissions={availableTransmissions}
          hasActiveFilters={hasActiveFilters}
          onChange={handleChangeFilter}
          onClear={handleClearAll}
          onSearchSubmit={handleSearchSubmit}
        />
      </div>

      {recentSearches.length > 0 && (
        <div className="recent-searches-wrap">
          <div className="recent-searches-label">
            <Clock3 size={14} aria-hidden="true" />
            <span>Recent searches</span>
          </div>
          <div className="recent-searches-list">
            {recentSearches.map((term, index) => (
              <button key={`${term}-${index}`} type="button" className="recent-search-pill" onClick={() => applyRecentSearch(term)}>
                <Search size={13} aria-hidden="true" />
                <span>{term}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      <div>
        <ActiveFilterChips
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAll}
        />
      </div>

      {/* Results Header */}
      <div className="vehicle-results-heading">
        <p>{resultsSummaryText}</p>
      </div>

      {/* Vehicle Grid or Empty State */}
      {isLoading ? (
        <div className="vehicle-grid" aria-live="polite">
          {Array.from({ length: 6 }, (_, index) => (
            <VehicleSkeleton key={index} />
          ))}
        </div>
      ) : filteredVehicles.length > 0 ? (
        <div className="vehicle-grid">
          {filteredVehicles.map((vehicle, index) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} index={index} />
          ))}
        </div>
      ) : (
        <GlassCard className="vehicle-empty-state">
          <span className="vehicle-empty-icon">
            {isBike ? <Bike size={24} strokeWidth={1.7} /> : <CarFront size={24} strokeWidth={1.7} />}
          </span>
          <h3>No {typeNounPlural} match your selection</h3>
          <p>
            {filters.category !== 'ALL'
              ? `No ${typeNounPlural} found in category "${filters.category}". Try another category or reset your filters.`
              : `Try adjusting your search criteria or resetting filters to see all available ${typeNounPlural}.`}
          </p>
          <GlassButton variant="secondary" onClick={handleClearAll}>
            <RotateCcw size={16} aria-hidden="true" /> Reset filters
          </GlassButton>
        </GlassCard>
      )}
    </section>
  )
}
