import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { History, Trash2, ArrowRight } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { VehicleCard } from '../vehicles/VehicleCard'
import { getRecentlyViewedVehicles, clearRecentlyViewed } from '../../services/recentlyViewedService'

export function RecentlyViewedRail() {
  const [vehicles, setVehicles] = useState([])

  function load() {
    setVehicles(getRecentlyViewedVehicles())
  }

  useEffect(() => {
    load()
  }, [])

  if (vehicles.length === 0) return null

  function handleClear() {
    clearRecentlyViewed()
    setVehicles([])
  }

  return (
    <section className="recently-viewed-section">
      <div className="section-title">
        <div>
          <p className="eyebrow">Your browsing trail</p>
          <h3>Recently viewed vehicles</h3>
        </div>
        <button
          type="button"
          className="clear-history-btn"
          onClick={handleClear}
          title="Clear browsing history"
        >
          <Trash2 size={13} aria-hidden="true" /> Clear history
        </button>
      </div>

      <div className="vehicle-grid recently-viewed-grid">
        {vehicles.map((v, index) => (
          <VehicleCard key={v.id} vehicle={v} index={index} />
        ))}
      </div>
    </section>
  )
}
