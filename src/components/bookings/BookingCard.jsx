import { ArrowRight, CalendarDays, CarFront } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassBadge } from '../ui/GlassBadge'
import { GlassButton } from '../ui/GlassButton'
import { GlassCard } from '../ui/GlassCard'
import { VehicleImage } from '../vehicles/VehicleImage'
import { formatCurrency, formatDate, formatStatus } from '../../utils/formatters'

export function BookingCard({ booking, index = 0 }) {
  const vehicle = booking.vehicle

  return (
    <GlassCard className="customer-booking-card" hover style={{ '--card-index': index }}>
      <div className="booking-card-media">
        {vehicle ? (
          <VehicleImage vehicle={vehicle} className="booking-card-image" />
        ) : (
          <div className="booking-card-fallback-image">
            <CarFront size={28} />
          </div>
        )}
      </div>

      <div className="booking-card-content">
        <div className="booking-card-top">
          <div>
            <div className="booking-reference-row">
              <span className="booking-id-tag">{booking.id}</span>
              <GlassBadge status={booking.status}>{formatStatus(booking.status)}</GlassBadge>
            </div>
            <h3 className="booking-vehicle-title">{vehicle ? vehicle.name : 'Reserved vehicle'}</h3>
            <p className="booking-vehicle-subtitle">
              {vehicle ? `${vehicle.year} · ${vehicle.type} · ${vehicle.registrationNumber}` : 'VAYRO Fleet'}
            </p>
          </div>
        </div>

        <div className="booking-card-schedule">
          <div className="schedule-item">
            <small>Pick-up</small>
            <strong>{formatDate(booking.pickupDate)}</strong>
          </div>
          <span className="schedule-arrow">→</span>
          <div className="schedule-item">
            <small>Return</small>
            <strong>{formatDate(booking.returnDate)}</strong>
          </div>
          <div className="schedule-duration">
            <CalendarDays size={13} aria-hidden="true" />
            <span>{booking.rentalDays} {booking.rentalDays === 1 ? 'day' : 'days'}</span>
          </div>
        </div>

        <div className="booking-card-footer">
          <div className="booking-card-price">
            <span>Total amount</span>
            <strong>{formatCurrency(booking.totalAmount)}</strong>
          </div>
          <GlassButton as={Link} to={`/bookings/${booking.id}`} variant="secondary" size="sm">
            View details <ArrowRight size={15} aria-hidden="true" />
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  )
}
