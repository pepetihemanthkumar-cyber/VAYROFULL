import { useState, useEffect } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { VehicleCard } from '../vehicles/VehicleCard'
import { getFavoriteVehicleIds } from '../../services/vehicleService'
import { getRecommendedVehicles } from '../../utils/recommendations'

export function RecommendedVehicles() {
  const [recommendations, setRecommendations] = useState(null)

  useEffect(() => {
    const favoriteIds = getFavoriteVehicleIds ? getFavoriteVehicleIds() : []
    const recs = getRecommendedVehicles(favoriteIds, 4)
    setRecommendations(recs)
  }, [])

  if (!recommendations || recommendations.vehicles.length === 0) return null

  return (
    <section className="dashboard-recommendations-section">
      <div className="section-title">
        <div>
          <p className="eyebrow">
            <Sparkles size={13} className="inline-icon text-accent" aria-hidden="true" /> Personalized fleet
          </p>
          <h3>{recommendations.title}</h3>
          <p className="section-subtitle">{recommendations.subtitle}</p>
        </div>
        <Link to="/vehicles" className="section-see-all-link">
          Explore all <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <div className="vehicle-grid">
        {recommendations.vehicles.map((v, index) => (
          <VehicleCard key={v.id} vehicle={v} index={index} />
        ))}
      </div>
    </section>
  )
}
