import { addDays, dateToInputValue } from '../utils/rental'

const today = new Date()

export const mockBookings = [
  {
    id: 'BK-2026-1048', customerId: 'usr_customer_001', vehicleId: 'kia-seltos',
    pickupDate: dateToInputValue(addDays(today, 8)), returnDate: dateToInputValue(addDays(today, 11)),
    status: 'CONFIRMED', totalAmount: 10500,
  },
  {
    id: 'BK-2026-1036', customerId: 'usr_customer_001', vehicleId: 'toyota-camry',
    pickupDate: dateToInputValue(addDays(today, -1)), returnDate: dateToInputValue(addDays(today, 2)),
    status: 'ACTIVE', totalAmount: 12600,
  },
]

export const recentActivities = [
  { id: 'activity-1', type: 'confirmed', title: 'Booking confirmed', detail: 'Kia Seltos · upcoming rental', occurredAt: 'Today' },
  { id: 'activity-2', type: 'returned', title: 'Vehicle returned', detail: 'Toyota Camry · completed smoothly', occurredAt: '12 Aug' },
  { id: 'activity-3', type: 'cancelled', title: 'Booking cancelled', detail: 'No charge was applied', occurredAt: '04 Aug' },
]
