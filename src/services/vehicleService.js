import { validateVehicleImages, vehicles as seedVehicles } from '../data/vehicles'

const VEHICLES_KEY = 'vayro_mock_vehicles'
const ACTIVITIES_KEY = 'vayro_mock_activities'
const BOOKINGS_KEY = 'vayro_mock_bookings'
const FAVORITES_KEY = 'vayro_favorite_vehicles'
const COMPARE_KEY = 'vayro_compare_vehicles'
const CATALOGUE_VERSION_KEY = 'vayro_catalogue_version'
const CATALOGUE_VERSION = 'vayro-cars-bikes-catalogue-2026'

const currentSeedById = new Map(seedVehicles.map((vehicle) => [vehicle.id, vehicle]))

function createSeedId(brand, model) {
  return (brand + '-' + model).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function isGeneratedSeedVehicle(vehicle) {
  if (!vehicle || typeof vehicle !== 'object') return false
  if (vehicle.createdAt || vehicle.isCustom) return false
  return true
}

function readIdList(key) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

function sanitizeVehicleReferences(key, validVehicleIds) {
  const current = readIdList(key)
  const next = [...new Set(current.filter((id) => validVehicleIds.has(id)))]
  if (next.length !== current.length || next.some((id, index) => id !== current[index])) {
    window.localStorage.setItem(key, JSON.stringify(next))
  }
  return next
}

function preserveBookingSnapshots(removedSeedVehicles) {
  if (removedSeedVehicles.length === 0) return

  try {
    const rawBookings = window.localStorage.getItem(BOOKINGS_KEY)
    if (!rawBookings) return

    const bookings = JSON.parse(rawBookings)
    if (!Array.isArray(bookings)) return

    const removedById = new Map()
    for (const vehicle of removedSeedVehicles) {
      removedById.set(vehicle.id, vehicle)
      removedById.set(vehicle.id.replace(/-\d{4}$/, ''), vehicle)
    }

    let changed = false
    const nextBookings = bookings.map((booking) => {
      if (booking?.vehicleSnapshot || !booking?.vehicleId) return booking

      const normalizedId = booking.vehicleId.replace(/-\d{4}$/, '')
      const removedVehicle = removedById.get(booking.vehicleId) || removedById.get(normalizedId)
      if (!removedVehicle) return booking

      changed = true
      return { ...booking, vehicleSnapshot: removedVehicle }
    })

    if (changed) {
      window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(nextBookings))
    }
  } catch (err) {
    console.error('Failed to preserve removed-vehicle booking snapshots:', err)
  }
}

function migrateVehicleStore(storedVehicles) {
  const storedSeedById = new Map()
  const customVehicles = []
  const removedSeedVehicles = []

  for (const vehicle of storedVehicles) {
    if (!isGeneratedSeedVehicle(vehicle)) {
      customVehicles.push(vehicle)
      continue
    }

    const canonicalId = currentSeedById.has(vehicle.id)
      ? vehicle.id
      : vehicle.id.replace(/-\d{4}$/, '')

    if (currentSeedById.has(canonicalId)) {
      if (!storedSeedById.has(canonicalId)) storedSeedById.set(canonicalId, vehicle)
    } else {
      removedSeedVehicles.push(vehicle)
    }
  }

  preserveBookingSnapshots(removedSeedVehicles)

  const migratedSeeds = seedVehicles.map((seedVehicle) => {
    const existingSeed = storedSeedById.get(seedVehicle.id)
    if (!existingSeed) return seedVehicle

    return {
      ...seedVehicle,
      status: existingSeed.status || seedVehicle.status,
      statusUpdatedAt: existingSeed.statusUpdatedAt,
    }
  })

  const usedIds = new Set(migratedSeeds.map((vehicle) => vehicle.id))
  const preservedCustomVehicles = []
  for (const vehicle of customVehicles) {
    if (!vehicle?.id || usedIds.has(vehicle.id)) continue
    usedIds.add(vehicle.id)
    preservedCustomVehicles.push(vehicle)
  }

  return [...preservedCustomVehicles, ...migratedSeeds]
}

function pause(duration = 200) {
  return new Promise((resolve) => window.setTimeout(resolve, duration))
}

function initializeStore() {
  try {
    const existing = window.localStorage.getItem(VEHICLES_KEY)
    if (!existing) {
      window.localStorage.setItem(VEHICLES_KEY, JSON.stringify(seedVehicles))
    } else {
      const parsedVehicles = JSON.parse(existing)
      const storedVehicles = Array.isArray(parsedVehicles) ? parsedVehicles : []
      const migratedVehicles = migrateVehicleStore(storedVehicles)
      window.localStorage.setItem(VEHICLES_KEY, JSON.stringify(migratedVehicles))
    }

    const validVehicleIds = new Set(getStoredVehicles().map((vehicle) => vehicle.id))
    sanitizeVehicleReferences(FAVORITES_KEY, validVehicleIds)
    sanitizeVehicleReferences(COMPARE_KEY, validVehicleIds)
    window.localStorage.setItem(CATALOGUE_VERSION_KEY, CATALOGUE_VERSION)
  } catch (err) {
    console.error('Failed to initialize vehicles store:', err)
  }
}

// Auto-run initialization
initializeStore()

export function getStoredVehicles() {
  try {
    const raw = window.localStorage.getItem(VEHICLES_KEY)
    const list = raw ? JSON.parse(raw) : seedVehicles
    return validateVehicleImages(Array.isArray(list) ? list : seedVehicles)
  } catch {
    return validateVehicleImages(seedVehicles)
  }
}

export function saveStoredVehicles(vehicles) {
  try {
    window.localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles))
  } catch (err) {
    console.error('Failed to save vehicles:', err)
  }
}

function logFleetActivity({ type, title, detail }) {
  try {
    const raw = window.localStorage.getItem(ACTIVITIES_KEY)
    const activities = raw ? JSON.parse(raw) : []
    const newActivity = {
      id: `activity-${Date.now()}`,
      type,
      title,
      detail,
      occurredAt: 'Just now',
    }
    const updated = [newActivity, ...activities].slice(0, 10)
    window.localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to log fleet activity:', err)
  }
}

export function getVehicles() {
  return getStoredVehicles()
}

export function validateStoredVehicleImages() {
  return validateVehicleImages(getStoredVehicles())
}

export function getVehicleById(id) {
  if (!id || typeof id !== 'string') return null
  const vehicles = getStoredVehicles()
  return (
    vehicles.find((vehicle) => vehicle.id === id) ||
    vehicles.find((vehicle) => vehicle.id?.replace(/-\d{4}$/, '') === id.replace(/-\d{4}$/, '')) ||
    null
  )
}

export async function createVehicle(vehicleData) {
  await pause(300)
  const allVehicles = getStoredVehicles()

  // Generate clean slug ID
  const baseSlug = `${vehicleData.brand || 'fleet'}-${vehicleData.model || 'car'}-${vehicleData.year || 2024}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  
  let uniqueId = baseSlug
  let counter = 1
  while (allVehicles.some((v) => v.id === uniqueId)) {
    uniqueId = `${baseSlug}-${counter++}`
  }

  const defaultImage = seedVehicles[0]?.image || ''
  const newVehicle = {
    id: uniqueId,
    name: vehicleData.name.trim(),
    brand: vehicleData.brand.trim(),
    model: vehicleData.model.trim(),
    year: Number(vehicleData.year),
    registrationNumber: vehicleData.registrationNumber.trim().toUpperCase(),
    type: vehicleData.type || 'SEDAN',
    category: vehicleData.category || vehicleData.type || 'SEDAN',
    class: vehicleData.class || 'Sedan',
    dailyRate: Number(vehicleData.dailyRate),
    pricing: vehicleData.pricing || { hourly: {}, daily: { 1: Number(vehicleData.dailyRate) || 0 }, longTerm: {}, discounts: {} },
    status: vehicleData.status || 'AVAILABLE',
    image: vehicleData.image ? vehicleData.image.trim() : defaultImage,
    images: vehicleData.images || { primary: vehicleData.image || defaultImage, gallery: [] },
    imagePosition: 'center',
    seats: Number(vehicleData.seats) || 5,
    transmission: vehicleData.transmission || 'Automatic',
    fuelType: vehicleData.fuelType || 'Petrol',
    airConditioning: vehicleData.airConditioning !== false,
    description: vehicleData.description ? vehicleData.description.trim() : 'A premium fleet vehicle maintained to the highest mechanical standards.',
    features: Array.isArray(vehicleData.features) ? vehicleData.features : [],
    createdAt: new Date().toISOString(),
  }

  saveStoredVehicles([newVehicle, ...allVehicles])

  logFleetActivity({
    type: 'confirmed',
    title: 'Vehicle added to fleet',
    detail: `${newVehicle.name} (${newVehicle.registrationNumber})`,
  })

  return newVehicle
}

export async function updateVehicle(id, updates) {
  await pause(250)
  const allVehicles = getStoredVehicles()
  const index = allVehicles.findIndex((v) => v.id === id)

  if (index === -1) {
    throw new Error('Vehicle not found.')
  }

  const current = allVehicles[index]
  const updatedVehicle = {
    ...current,
    ...updates,
    id, // Preserve original ID
    year: updates.year ? Number(updates.year) : current.year,
    category: updates.category || updates.type || current.category || current.type,
    class: updates.class || current.class || 'Sedan',
    dailyRate: updates.dailyRate ? Number(updates.dailyRate) : current.dailyRate,
    seats: updates.seats ? Number(updates.seats) : current.seats,
    registrationNumber: updates.registrationNumber ? updates.registrationNumber.trim().toUpperCase() : current.registrationNumber,
    name: updates.name ? updates.name.trim() : current.name,
    brand: updates.brand ? updates.brand.trim() : current.brand,
    model: updates.model ? updates.model.trim() : current.model,
    description: updates.description ? updates.description.trim() : current.description,
    status: current.status, // Preserve operational status (use updateVehicleStatus for status transitions)
  }

  allVehicles[index] = updatedVehicle
  saveStoredVehicles([...allVehicles])

  logFleetActivity({
    type: 'returned',
    title: 'Vehicle details updated',
    detail: `${updatedVehicle.name} (${updatedVehicle.registrationNumber})`,
  })

  return updatedVehicle
}

export async function updateVehicleStatus(id, newStatus) {
  await pause(250)
  const allVehicles = getStoredVehicles()
  const index = allVehicles.findIndex((v) => v.id === id)

  if (index === -1) {
    throw new Error('Vehicle not found.')
  }

  const vehicle = allVehicles[index]

  // Check if vehicle has an active on-road rental
  try {
    const rawBookings = window.localStorage.getItem(BOOKINGS_KEY)
    const bookings = rawBookings ? JSON.parse(rawBookings) : []
    const activeRental = bookings.find((b) => b.vehicleId === id && b.status === 'ACTIVE')

    if (activeRental && (newStatus === 'AVAILABLE' || newStatus === 'INACTIVE')) {
      throw new Error(
        `This vehicle is currently assigned to an active on-road rental (${activeRental.id}). Status cannot be set to ${newStatus} until the vehicle is returned.`,
      )
    }
  } catch (err) {
    if (err.message.includes('currently assigned to an active on-road rental')) {
      throw err
    }
  }

  const updatedVehicle = {
    ...vehicle,
    status: newStatus,
    statusUpdatedAt: new Date().toISOString(),
  }

  allVehicles[index] = updatedVehicle
  saveStoredVehicles([...allVehicles])

  logFleetActivity({
    type: newStatus === 'AVAILABLE' ? 'confirmed' : newStatus === 'MAINTENANCE' ? 'cancelled' : 'returned',
    title: 'Vehicle status updated',
    detail: `${vehicle.name} marked ${newStatus}`,
  })

  return updatedVehicle
}

export function getFavoriteVehicleIds() {
  return sanitizeVehicleReferences(FAVORITES_KEY, new Set(getStoredVehicles().map((vehicle) => vehicle.id)))
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
  return getVehicles().filter((vehicle) => favoriteIds.includes(vehicle.id))
}

export function getRecentVehicleSearches() {
  try {
    const raw = window.localStorage.getItem('vayro_recent_searches')
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRecentVehicleSearches(searches) {
  const unique = [...new Set(searches.map((item) => String(item).trim()).filter(Boolean))].slice(
    0,
    5,
  )
  try {
    window.localStorage.setItem('vayro_recent_searches', JSON.stringify(unique))
  } catch {
    // ignore
  }
  return unique
}

export function getCompareVehicleIds() {
  return sanitizeVehicleReferences(COMPARE_KEY, new Set(getStoredVehicles().map((vehicle) => vehicle.id)))
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
