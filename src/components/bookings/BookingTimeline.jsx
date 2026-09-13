import { Check, CircleDot, X, Clock3, KeyRound, Flag } from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatDate } from '../../utils/formatters'

export function BookingTimeline({ booking }) {
  const status = booking?.status || 'CONFIRMED' // 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
  const isPaid = booking?.paymentStatus === 'PAID'
  const isPayAtPickup = booking?.paymentStatus === 'PENDING_AT_PICKUP'

  const stages = [
    {
      id: 'confirmed',
      title: 'Booking Confirmed',
      description: `Reservation ${booking?.id} registered in fleet system.`,
      date: booking?.createdAt ? formatDate(booking.createdAt.slice(0, 10)) : 'Confirmed',
      isCompleted: true,
      isCurrent: false,
    },
    {
      id: 'payment',
      title: isPayAtPickup ? 'Payment Scheduled' : 'Payment Completed',
      description: isPayAtPickup
        ? 'Payment due at pickup counter upon car key handover.'
        : `Transaction ${booking?.paymentReference || 'verified'} settled via ${booking?.paymentMethod || 'Simulated UPI'}.`,
      date: isPaid ? (booking?.paymentTimestamp ? formatDate(booking.paymentTimestamp.slice(0, 10)) : 'Paid') : 'Pay at pickup',
      isCompleted: isPaid || status === 'ACTIVE' || status === 'COMPLETED',
      isCurrent: !isPaid && status === 'CONFIRMED',
    },
    ...(status === 'CANCELLED'
      ? [
          {
            id: 'cancelled',
            title: 'Booking Cancelled',
            description: 'Reservation released and cancelled.',
            date: booking?.cancelledAt ? formatDate(booking.cancelledAt.slice(0, 10)) : 'Cancelled',
            isCompleted: true,
            isCurrent: true,
            isCancelled: true,
          },
        ]
      : [
          {
            id: 'pickup_pending',
            title: 'Pickup Pending',
            description: `Ready for vehicle handover at ${booking?.pickupLocation || 'VAYRO Depot'}.`,
            date: `${formatDate(booking?.pickupDate)} · ${booking?.pickupTime || '10:00 AM'}`,
            isCompleted: status === 'ACTIVE' || status === 'COMPLETED',
            isCurrent: status === 'CONFIRMED' && (isPaid || isPayAtPickup),
          },
          {
            id: 'active',
            title: 'Rental Active',
            description: 'Vehicle is currently on the road in customer possession.',
            date: status === 'ACTIVE' ? 'Active on road' : formatDate(booking?.pickupDate),
            isCompleted: status === 'COMPLETED',
            isCurrent: status === 'ACTIVE',
          },
          {
            id: 'return_pending',
            title: 'Vehicle Return',
            description: `Scheduled drop-off at ${booking?.returnLocation || 'VAYRO Depot'}.`,
            date: `${formatDate(booking?.returnDate)} · ${booking?.returnTime || '10:00 AM'}`,
            isCompleted: status === 'COMPLETED',
            isCurrent: status === 'ACTIVE',
          },
          {
            id: 'completed',
            title: 'Rental Completed',
            description: 'Vehicle returned, inspection finished, and trip settled.',
            date: status === 'COMPLETED' ? (booking?.returnedAt ? formatDate(booking.returnedAt.slice(0, 10)) : 'Returned') : 'Pending return',
            isCompleted: status === 'COMPLETED',
            isCurrent: false,
          },
        ]),
  ]

  return (
    <div className="booking-timeline">
      {stages.map((stage, index) => {
        return (
          <div
            key={stage.id}
            className={cn(
              'timeline-item',
              stage.isCompleted && 'is-completed',
              stage.isCurrent && 'is-current',
              stage.isCancelled && 'is-cancelled',
            )}
          >
            <div className="timeline-marker">
              {stage.isCancelled ? (
                <X size={12} strokeWidth={2.8} />
              ) : stage.isCompleted ? (
                <Check size={12} strokeWidth={2.8} />
              ) : stage.isCurrent ? (
                <CircleDot size={12} strokeWidth={2.8} />
              ) : (
                <span className="timeline-dot" />
              )}
            </div>

            {index < stages.length - 1 && (
              <div
                className={cn(
                  'timeline-connector',
                  (stage.isCompleted || stage.isCancelled) && 'is-filled',
                )}
                aria-hidden="true"
              />
            )}

            <div className="timeline-body">
              <div className="timeline-heading">
                <h4>{stage.title}</h4>
                <time>{stage.date}</time>
              </div>
              <p>{stage.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
