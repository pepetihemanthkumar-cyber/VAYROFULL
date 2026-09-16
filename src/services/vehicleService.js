import { api } from './api'
import { vehicles as seedVehicles } from '../data/vehicles'

const FAVORITES_KEY = 'vayro_favorite_vehicles'
const COMPARE_KEY = 'vayro_compare_vehicles'
const RECENT_SEARCHES_KEY = 'vayro_recent_searches'

// In-memory cache for fast synchronous access
let vehiclesCache = seedVehicles.map(mapVehicle)

export function mapVehicle(v) {
  if (!v) return null
  const vType = (v.vehicleType || 'car').toLowerCase()
  const img1 = (v.images && v.images[0]) || v.image1 || v.image || ''
  const img2 = (v.images && v.images[1]) || v.image2 || img1
  const gallery = [img1, img2].filter(Boolean)

  const pricePerDay = v.pricePerDay ? Number(v.pricePerDay) : (v.dailyRate ? Number(v.dailyRate) : 0)
  const pricePerHour = v.pricePerHour ? Number(v.pricePerHour) : Math.round(pricePerDay * (vType === 'bike' ? 0.13 : 0.14))

  return {
    id: v.id,
    name: v.name || `${v.brand || ''} ${v.model || ''}`.trim(),
    brand: v.brand || 'VAYRO',
    model: v.model || '',
    year: v.year ? Number(v.year) : 2024,
    vehicleType: vType === 'bike' ? 'bike' : 'car',
    type: v.category || (vType === 'bike' ? 'CRUISER' : 'SEDAN'),
    category: v.category || (vType === 'bike' ? 'CRUISER' : 'SEDAN'),
    class: v.vehicleClass || (vType === 'bike' ? 'Cruiser' : 'Sedan'),
    description: v.description || 'A precision-engineered fleet vehicle maintained to the highest standards.',
    dailyRate: pricePerDay,
    pricePerDay,
    pricePerHour,
    fuelType: v.fuelType || 'Petrol',
    transmission: v.transmission || 'Automatic',
    seats: v.seats ? Number(v.seats) : (vType === 'bike' ? 2 : 5),
    mileage: v.mileage || '15 kmpl',
    engine: v.engine || '',
    power: v.power || '',
    enginePower: v.power || v.engine || (vType === 'bike' ? 'High Output' : 'TwinPower Turbo'),
    location: v.location || 'Mumbai Fleet Hub',
    status: v.status || 'AVAILABLE',
    maintenanceStatus: v.maintenanceStatus || 'NONE',
    lastMaintenanceDate: v.lastMaintenanceDate,
    nextMaintenanceDate: v.nextMaintenanceDate,
    maintenanceNotes: v.maintenanceNotes,
    image: img1,
    image1: img1,
    image2: img2,
    images: {
      primary: img1,
      gallery,
    },
    pricing: v.pricing || {
      hourly: { 1: pricePerHour },
      daily: { 1: pricePerDay },
      longTerm: { 30: Math.round(pricePerDay * 30 * 0.75) },
      discounts: {},
    },
    features: v.features || (vType === 'bike' ? ['ABS Braking', 'LED Lighting', 'Digital Console'] : ['Climate Control', 'Touchscreen Infotainment', 'Reverse Camera', 'ABS']),
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }
}

/**
 * Fetch all vehicles from backend Gateway: GET /api/vehicles
 */
export async function fetchVehicles(params = {}) {
  const query = {
    page: params.page ?? 0,
    size: params.size ?? 300,
    ...params,
  }

  const response = await api.get('/api/vehicles', { params: query })
  const data = response.data

  let list = []
  if (Array.isArray(data)) {
    list = data.map(mapVehicle)
  } else if (data && Array.isArray(data.content)) {
    list = data.content.map(mapVehicle)
  }

  if (list.length > 0) {
    vehiclesCache = list
  }

  return {
    content: list,
    page: data?.page ?? 0,
    size: data?.size ?? list.length,
    totalElements: data?.totalElements ?? list.length,
    totalPages: data?.totalPages ?? 1,
    isLast: data?.isLast ?? true,
  }
}

/**
 * Fetch single vehicle by ID from backend Gateway: GET /api/vehicles/{id}
 */
export async function fetchVehicleById(id) {
  if (!id) return null
  const response = await api.get(`/api/vehicles/${id}`)
  const mapped = mapVehicle(response.data)

  // Update in cache
  const idx = vehiclesCache.findIndex((v) => v.id === mapped.id)
  if (idx >= 0) {
    vehiclesCache[idx] = mapped
  } else {
    vehiclesCache.push(mapped)
  }

  return mapped
}

/**
 * Check vehicle availability from backend Gateway: GET /api/vehicles/{id}/availability
 */
export async function fetchVehicleAvailability(id, pickupDateTime, returnDateTime) {
  const params = {}
  if (pickupDateTime) params.pickupDateTime = pickupDateTime
  if (returnDateTime) params.returnDateTime = returnDateTime
  const response = await api.get(`/api/vehicles/${id}/availability`, { params })
  return response.data
}

/**
 * Synchronous getVehicles helper
 */
export function getVehicles() {
  return vehiclesCache
}

/**
 * Synchronous getVehicleById helper
 */
export function getVehicleById(id) {
  if (!id) return null
  const cleanId = String(id).trim().toLowerCase()
  return (
    vehiclesCache.find((v) => v.id === id) ||
    vehiclesCache.find((v) => v.id?.toLowerCase() === cleanId) ||
    vehiclesCache.find((v) => `${v.brand}-${v.model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === cleanId) ||
    null
  )
}

/**
 * Admin: Create vehicle: POST /api/vehicles
 */
export async function createVehicle(vehicleData) {
  const response = await api.post('/api/vehicles', vehicleData)
  const mapped = mapVehicle(response.data)
  vehiclesCache.unshift(mapped)
  return mapped
}

/**
 * Admin: Update vehicle: PUT /api/vehicles/{id}
 */
export async function updateVehicle(id, vehicleData) {
  const response = await api.put(`/api/vehicles/${id}`, vehicleData)
  const mapped = mapVehicle(response.data)
  const idx = vehiclesCache.findIndex((v) => v.id === id)
  if (idx >= 0) vehiclesCache[idx] = mapped
  return mapped
}

/**
 * Admin: Update vehicle status: PATCH /api/vehicles/{id}/status
 */
export async function updateVehicleStatus(id, status) {
  const response = await api.patch(`/api/vehicles/${id}/status`, { status })
  const mapped = mapVehicle(response.data)
  const idx = vehiclesCache.findIndex((v) => v.id === id)
  if (idx >= 0) vehiclesCache[idx] = mapped
  return mapped
}

/**
 * Admin: Update vehicle maintenance: PATCH /api/vehicles/{id}/maintenance
 */
export async function updateVehicleMaintenance(id, maintenanceData) {
  const response = await api.patch(`/api/vehicles/${id}/maintenance`, maintenanceData)
  const mapped = mapVehicle(response.data)
  const idx = vehiclesCache.findIndex((v) => v.id === id)
  if (idx >= 0) vehiclesCache[idx] = mapped
  return mapped
}

/**
 * Admin: Delete vehicle: DELETE /api/vehicles/{id}
 */
export async function deleteVehicle(id) {
  await api.delete(`/api/vehicles/${id}`)
  vehiclesCache = vehiclesCache.filter((v) => v.id !== id)
  return true
}

// -------------------------------------------------------------
// Client preferences: Favorites, Compare, Searches
// -------------------------------------------------------------

function readIdList(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function getFavoriteVehicleIds() {
  return readIdList(FAVORITES_KEY)
}

export function toggleFavoriteVehicle(vehicleId) {
  const favorites = new Set(getFavoriteVehicleIds())
  if (favorites.has(vehicleId)) {
    favorites.delete(vehicleId)
  } else {
    favorites.add(vehicleId)
  }
  const nextValue = [...favorites]
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextValue))
  return nextValue
}

export function getFavoriteVehicles() {
  const favoriteIds = getFavoriteVehicleIds()
  return getVehicles().filter((v) => favoriteIds.includes(v.id))
}

export function getRecentVehicleSearches() {
  return readIdList(RECENT_SEARCHES_KEY)
}

export function saveRecentVehicleSearches(searches) {
  const unique = [...new Set(searches.map((item) => String(item).trim()).filter(Boolean))].slice(0, 5)
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(unique))
  } catch {}
  return unique
}

export function getCompareVehicleIds() {
  return readIdList(COMPARE_KEY)
}

export function toggleCompareVehicle(vehicleId) {
  const current = getCompareVehicleIds()
  const exists = current.includes(vehicleId)
  const next = exists ? current.filter((id) => id !== vehicleId) : [...current, vehicleId].slice(-3)
  window.localStorage.setItem(COMPARE_KEY, JSON.stringify(next))
  return next
}

export function clearCompareVehicles() {
  window.localStorage.setItem(COMPARE_KEY, JSON.stringify([]))
  return []
}
