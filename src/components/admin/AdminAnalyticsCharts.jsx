import { useMemo } from 'react'
import {
  TrendingUp,
  BarChart3,
  PieChart,
  CarFront,
  Bike,
  Sparkles,
  CheckCircle2,
  CircleDot,
  RotateCcw,
  CircleX,
} from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { formatCurrency } from '../../utils/formatters'

export function AdminAnalyticsCharts({ bookings = [], vehicles = [] }) {
  const analytics = useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return null
    }

    const totalRevenue = bookings.reduce((sum, b) => (b.status !== 'CANCELLED' ? sum + (b.totalAmount || 0) : sum), 0)
    const avgBookingValue = bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0

    // Car vs Bike breakdown
    let carRevenue = 0
    let carBookingsCount = 0
    let bikeRevenue = 0
    let bikeBookingsCount = 0

    // Status counts
    const statusCounts = {
      CONFIRMED: 0,
      ACTIVE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    }

    const modelCounts = {}
    const brandCounts = {}
    const categoryCounts = {}

    for (const b of bookings) {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1
      const v = b.vehicle || vehicles.find((veh) => veh.id === b.vehicleId)
      const isBike = v?.vehicleType === 'bike' || b.vehicleType === 'bike'

      if (isBike) {
        bikeBookingsCount++
        if (b.status !== 'CANCELLED') bikeRevenue += (b.totalAmount || 0)
      } else {
        carBookingsCount++
        if (b.status !== 'CANCELLED') carRevenue += (b.totalAmount || 0)
      }

      if (v) {
        modelCounts[v.name] = (modelCounts[v.name] || 0) + 1
        brandCounts[v.brand] = (brandCounts[v.brand] || 0) + 1
        categoryCounts[v.category || v.type] = (categoryCounts[v.category || v.type] || 0) + 1
      }
    }

    const topModels = Object.entries(modelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const topBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const topCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)

    const mostRentedVehicle = topModels[0] ? topModels[0][0] : 'Classic 350'
    const mostPopularBrand = topBrands[0] ? topBrands[0][0] : 'Royal Enfield'

    return {
      totalRevenue,
      avgBookingValue,
      carRevenue,
      carBookingsCount,
      bikeRevenue,
      bikeBookingsCount,
      statusCounts,
      topModels,
      topBrands,
      topCategories,
      mostRentedVehicle,
      mostPopularBrand,
    }
  }, [bookings, vehicles])

  if (!analytics) {
    return (
      <GlassCard className="admin-analytics-empty">
        <p className="eyebrow">Fleet Analytics Engine</p>
        <h4>No booking data yet</h4>
        <p>Analytics, popular models, and revenue distribution will populate automatically as bookings occur.</p>
      </GlassCard>
    )
  }

  const {
    totalRevenue,
    avgBookingValue,
    carRevenue,
    carBookingsCount,
    bikeRevenue,
    bikeBookingsCount,
    statusCounts,
    topModels,
    topBrands,
    topCategories,
    mostRentedVehicle,
    mostPopularBrand,
  } = analytics

  const totalBookings = bookings.length

  return (
    <div className="admin-analytics-section">
      <div className="section-title">
        <div>
          <p className="eyebrow">Operational Intelligence</p>
          <h3>Fleet Performance & Dual Demand Analytics</h3>
        </div>
      </div>

      {/* Summary Highlights */}
      <div className="admin-analytics-highlights">
        <GlassCard className="analytics-highlight-card">
          <span className="analytics-tag">Total Fleet Revenue</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
          <small>Avg {formatCurrency(avgBookingValue)} per booking</small>
        </GlassCard>

        <GlassCard className="analytics-highlight-card">
          <span className="analytics-tag">Cars Revenue</span>
          <strong className="text-accent">{formatCurrency(carRevenue)}</strong>
          <small>{carBookingsCount} bookings across 135 cars</small>
        </GlassCard>

        <GlassCard className="analytics-highlight-card">
          <span className="analytics-tag">Bikes Revenue</span>
          <strong className="text-accent">{formatCurrency(bikeRevenue)}</strong>
          <small>{bikeBookingsCount} bookings across 72 bikes</small>
        </GlassCard>

        <GlassCard className="analytics-highlight-card">
          <span className="analytics-tag">Top Model</span>
          <strong>{mostRentedVehicle}</strong>
          <small>Highest booking demand</small>
        </GlassCard>
      </div>

      {/* 2-Column Analytics Visual Grids */}
      <div className="admin-charts-grid">
        {/* Status Distribution */}
        <GlassCard className="admin-chart-card">
          <div className="chart-card-heading">
            <div>
              <p className="eyebrow">Lifecycle Distribution</p>
              <h4>Booking Status Breakdown</h4>
            </div>
            <PieChart size={18} className="text-accent" aria-hidden="true" />
          </div>

          <div className="chart-bar-list">
            <div className="chart-bar-row">
              <div className="chart-bar-label">
                <CheckCircle2 size={14} className="text-success" />
                <span>Confirmed ({statusCounts.CONFIRMED})</span>
              </div>
              <div className="chart-progress-track">
                <div
                  className="chart-progress-fill bg-success"
                  style={{ width: `${totalBookings ? Math.round((statusCounts.CONFIRMED / totalBookings) * 100) : 0}%` }}
                />
              </div>
              <span className="chart-bar-pct">
                {totalBookings ? Math.round((statusCounts.CONFIRMED / totalBookings) * 100) : 0}%
              </span>
            </div>

            <div className="chart-bar-row">
              <div className="chart-bar-label">
                <CircleDot size={14} className="text-info" />
                <span>Active on Road ({statusCounts.ACTIVE})</span>
              </div>
              <div className="chart-progress-track">
                <div
                  className="chart-progress-fill bg-info"
                  style={{ width: `${totalBookings ? Math.round((statusCounts.ACTIVE / totalBookings) * 100) : 0}%` }}
                />
              </div>
              <span className="chart-bar-pct">
                {totalBookings ? Math.round((statusCounts.ACTIVE / totalBookings) * 100) : 0}%
              </span>
            </div>

            <div className="chart-bar-row">
              <div className="chart-bar-label">
                <RotateCcw size={14} className="text-accent" />
                <span>Completed / Returned ({statusCounts.COMPLETED})</span>
              </div>
              <div className="chart-progress-track">
                <div
                  className="chart-progress-fill bg-accent"
                  style={{ width: `${totalBookings ? Math.round((statusCounts.COMPLETED / totalBookings) * 100) : 0}%` }}
                />
              </div>
              <span className="chart-bar-pct">
                {totalBookings ? Math.round((statusCounts.COMPLETED / totalBookings) * 100) : 0}%
              </span>
            </div>

            <div className="chart-bar-row">
              <div className="chart-bar-label">
                <CircleX size={14} className="text-danger" />
                <span>Cancelled ({statusCounts.CANCELLED})</span>
              </div>
              <div className="chart-progress-track">
                <div
                  className="chart-progress-fill bg-danger"
                  style={{ width: `${totalBookings ? Math.round((statusCounts.CANCELLED / totalBookings) * 100) : 0}%` }}
                />
              </div>
              <span className="chart-bar-pct">
                {totalBookings ? Math.round((statusCounts.CANCELLED / totalBookings) * 100) : 0}%
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Popular Brands & Models */}
        <GlassCard className="admin-chart-card">
          <div className="chart-card-heading">
            <div>
              <p className="eyebrow">Fleet Demand</p>
              <h4>Popular Brands & Categories</h4>
            </div>
            <BarChart3 size={18} className="text-accent" aria-hidden="true" />
          </div>

          <div className="chart-bar-list">
            {topBrands.map(([brand, count]) => {
              const pct = Math.round((count / totalBookings) * 100)
              return (
                <div key={brand} className="chart-bar-row">
                  <div className="chart-bar-label">
                    <CarFront size={14} className="text-accent" />
                    <span>{brand} ({count})</span>
                  </div>
                  <div className="chart-progress-track">
                    <div className="chart-progress-fill bg-brand" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="chart-bar-pct">{pct}%</span>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
