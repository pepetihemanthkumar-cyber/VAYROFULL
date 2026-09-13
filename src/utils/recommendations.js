import { getVehicles, getVehicleById } from '../services/vehicleService'
import { getRecentlyViewedVehicleIds } from '../services/recentlyViewedService'

/**
 * Generate deterministic vehicle recommendations based on user activity across cars and bikes
 * @param {Array<string>} favoriteIds List of favorite vehicle IDs
 * @param {number} limit Max recommended vehicles to return
 * @returns {{ title: string, subtitle: string, vehicles: Array<object> }}
 */
export function getRecommendedVehicles(favoriteIds = [], limit = 4) {
  const allVehicles = getVehicles()
  const recentIds = getRecentlyViewedVehicleIds()

  const excludeIds = new Set([...recentIds, ...favoriteIds])

  // Preference discovery from recent + favorites
  const interactionPool = [...recentIds.map((id) => getVehicleById(id)), ...favoriteIds.map((id) => getVehicleById(id))].filter(Boolean)

  let reason = 'Curated top-rated cars and motorcycles for your next journey'

  if (interactionPool.length > 0) {
    const categoryCounts = {}
    const typeCounts = {}

    for (const v of interactionPool) {
      const cat = v.category || v.type
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
      typeCounts[v.vehicleType || 'car'] = (typeCounts[v.vehicleType || 'car'] || 0) + 1
    }

    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]
    if (topCategory) {
      reason = `Recommended based on your interest in ${topCategory[0]}`
    }
  }

  // Balanced recommendation (mix of available cars and bikes if pool is diverse)
  const availableVehicles = allVehicles.filter((v) => v.status === 'AVAILABLE' && !excludeIds.has(v.id))
  const cars = availableVehicles.filter((v) => (v.vehicleType || 'car') === 'car')
  const bikes = availableVehicles.filter((v) => v.vehicleType === 'bike')

  const matching = []
  if (cars.length >= 2 && bikes.length >= 2) {
    matching.push(cars[0], bikes[0], cars[1], bikes[1])
  } else {
    matching.push(...availableVehicles.slice(0, limit))
  }

  return {
    title: `Recommended for you`,
    subtitle: reason,
    vehicles: matching.length > 0 ? matching.slice(0, limit) : allVehicles.slice(0, limit),
  }
}
