import { getVehicleById } from './vehicleService'

const RECENTLY_VIEWED_KEY = 'vayro_recently_viewed'
const MAX_RECENTLY_VIEWED = 8

export function getRecentlyViewedVehicleIds() {
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Failed to parse recently viewed vehicles:', err)
    return []
  }
}

export function recordRecentlyViewed(vehicleId) {
  if (!vehicleId) return
  const current = getRecentlyViewedVehicleIds().filter((id) => id !== vehicleId)
  const updated = [vehicleId, ...current].slice(0, MAX_RECENTLY_VIEWED)
  try {
    window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save recently viewed vehicles:', err)
  }
}

export function getRecentlyViewedVehicles() {
  const ids = getRecentlyViewedVehicleIds()
  return ids.map((id) => getVehicleById(id)).filter(Boolean)
}

export function clearRecentlyViewed() {
  try {
    window.localStorage.removeItem(RECENTLY_VIEWED_KEY)
  } catch (err) {
    console.error('Failed to clear recently viewed vehicles:', err)
  }
}
