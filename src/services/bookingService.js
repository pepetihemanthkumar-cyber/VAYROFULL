import { mockBookings as seedBookings, recentActivities as seedActivities } from '../data/bookings'
import { getVehicleById, getVehicles } from './vehicleService'
import {
  areDateRangesOverlapping,
  calculateBookingBreakdown,
  calculateRentalDays,
  calculateRentalDuration,
  calculateRentalPrice,
  isFutureDate,
} from '../utils/rental'

const BOOKINGS_KEY = 'vayro_mock_bookings'
const ACTIVITIES_KEY = 'vayro_mock_activities'

function pause(duration = 200) {
  return new Promise((resolve) => window.setTimeout(resolve, duration))
}

function initializeStore() {
  try {
    const existing = window.localStorage.getItem(BOOKINGS_KEY)
    if (!existing) {
      const enrichedSeed = seedBookings.map((b) => {
        const vehicle = getVehicleById(b.vehicleId)
        const days = calculateRentalDays(b.pickupDate, b.returnDate)
        const breakdown = calculateBookingBreakdown({
          dailyRate: vehicle?.dailyRate || 3000,
          days,
          selectedAddonIds: ['premium_protection'],
        })
        return {
          ...b,
          rentalDays: days,
          dailyRate: vehicle?.dailyRate || 3000,
          selectedAddons: ['premium_protection'],
          driverDetails: {
            fullName: 'Aarav Mehta',
            email: 'customer@vayro.com',
            phone: '+91 98765 43210',
            licenseNumber: 'MH01-2021-008492',
          },
          vehicleTotal: breakdown.vehicleTotal,
          addonsTotal: breakdown.addonsTotal,
          totalAmount: b.totalAmount || breakdown.totalAmount,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        }
      })
      window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(enrichedSeed))
    }

    const existingActivities = window.localStorage.getItem(ACTIVITIES_KEY)
    if (!existingActivities) {
      window.localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(seedActivities))
    }
  } catch (err) {
    console.error('Failed to initialize booking store:', err)
  }
}

// Auto-run initialization
initializeStore()

export function getStoredBookings() {
  try {
    const raw = window.localStorage.getItem(BOOKINGS_KEY)
    return raw ? JSON.parse(raw) : seedBookings
  } catch {
    return seedBookings
  }
}

export function saveStoredBookings(bookings) {
  try {
    window.localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings))
  } catch (err) {
    console.error('Failed to save bookings:', err)
  }
}

export function getStoredActivities() {
  try {
    const raw = window.localStorage.getItem(ACTIVITIES_KEY)
    return raw ? JSON.parse(raw) : seedActivities
  } catch {
    return seedActivities
  }
}

export function logActivity({ type, title, detail, occurredAt = 'Today' }) {
  try {
    const activities = getStoredActivities()
    const newActivity = {
      id: `activity-${Date.now()}`,
      type,
      title,
      detail,
      occurredAt,
    }
    const updated = [newActivity, ...activities].slice(0, 10)
    window.localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to log activity:', err)
  }
}

export function getBookingWithVehicle(booking) {
  if (!booking) return null
  const duration = calculateRentalDuration(
    booking.pickupDate,
    booking.pickupTime || '10:00',
    booking.returnDate,
    booking.returnTime || '10:00',
  )
  return {
    ...booking,
    durationLabel: booking.durationLabel || (duration.valid ? duration.label : `${booking.rentalDays || 1} ${booking.rentalDays === 1 ? 'day' : 'days'}`),
    durationHours: booking.durationHours || duration.hours,
    vehicle: getVehicleById(booking.vehicleId) || booking.vehicleSnapshot || null,
  }
}

export function getBookingsForCustomer(customerId) {
  const bookings = getStoredBookings()
  return bookings
    .filter((booking) => booking.customerId === customerId)
    .map(getBookingWithVehicle)
    .sort((a, b) => new Date(b.createdAt || b.pickupDate) - new Date(a.createdAt || a.pickupDate))
}

export function getBookingById(id) {
  const bookings = getStoredBookings()
  const booking = bookings.find((item) => item.id === id) || null
  return getBookingWithVehicle(booking)
}

export function getActiveBookings(customerId) {
  return getBookingsForCustomer(customerId).filter((booking) => booking.status === 'ACTIVE')
}

export function getUpcomingBooking(customerId) {
  return (
    getBookingsForCustomer(customerId)
      .filter((booking) => booking.status === 'CONFIRMED' && isFutureDate(booking.pickupDate))
      .sort((a, b) => a.pickupDate.localeCompare(b.pickupDate))[0] || null
  )
}

export function getUpcomingBookings(customerId) {
  return getBookingsForCustomer(customerId).filter(
    (booking) => booking.status === 'CONFIRMED' && isFutureDate(booking.pickupDate),
  )
}

export function checkVehicleAvailability(vehicleId, pickupDate, returnDate, excludeBookingId = null, pickupTime, returnTime) {
  const vehicle = getVehicleById(vehicleId)
  if (!vehicle) {
    return { available: false, reason: 'Vehicle does not exist.' }
  }

  if (vehicle.status === 'MAINTENANCE') {
    return { available: false, reason: 'This vehicle is currently undergoing scheduled maintenance.' }
  }

  if (vehicle.status === 'INACTIVE') {
    return { available: false, reason: 'This vehicle is currently not in active service.' }
  }

  const allBookings = getStoredBookings()
  const conflictingBooking = allBookings.find((booking) => {
    if (booking.vehicleId !== vehicleId) return false
    if (excludeBookingId && booking.id === excludeBookingId) return false
    if (booking.status !== 'CONFIRMED' && booking.status !== 'ACTIVE') return false
    return areDateRangesOverlapping(pickupDate, returnDate, booking.pickupDate, booking.returnDate, pickupTime, returnTime, booking.pickupTime, booking.returnTime)
  })

  if (conflictingBooking) {
    return {
      available: false,
      reason: 'This vehicle is already reserved for the selected dates.',
      conflictingBooking,
    }
  }

  return { available: true }
}

export async function createBooking({
  customerId,
  vehicleId,
  pickupDate,
  pickupTime = '10:00',
  returnDate,
  returnTime = '10:00',
  pickupLocation = 'VAYRO Vijayawada Central',
  returnLocation = 'VAYRO Vijayawada Central',
  driverDetails,
  selectedAddons = [],
  durationType,
  durationValue,
  durationLabel,
  couponCode = null,
  couponDiscount = 0,
  paymentMethod = 'SIMULATED_UPI',
  paymentStatus = 'PAID',
  paymentReference,
  paymentTimestamp,
}) {
  await pause(350)
  const availability = checkVehicleAvailability(vehicleId, pickupDate, returnDate, null, pickupTime, returnTime)
  if (!availability.available) {
    throw new Error(availability.reason || 'Vehicle is not available for these dates.')
  }

  const vehicle = getVehicleById(vehicleId)
  if (!vehicle) {
    throw new Error('Vehicle not found.')
  }

  const duration = calculateRentalDuration(pickupDate, pickupTime, returnDate, returnTime)
  if (!duration.valid) {
    throw new Error(duration.error || 'Return time must be after pick-up time.')
  }

  const breakdown = calculateBookingBreakdown({
    vehicle,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    selectedAddonIds: selectedAddons,
  })

  const finalTotal = Math.max(0, breakdown.totalAmount - (couponDiscount || 0))

  const allBookings = getStoredBookings()
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)
  const bookingId = `BK-2026-${randomSuffix}`
  const payRef = paymentReference || `PAY-2026-${Math.floor(100000 + Math.random() * 900000)}`

  const newBooking = {
    id: bookingId,
    customerId,
    vehicleId,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    pickupLocation,
    returnLocation,
    rentalDays: duration.days,
    durationHours: duration.hours,
    durationLabel: durationLabel || duration.label,
    durationType: durationType || duration.durationType,
    durationValue: durationValue || duration.durationValue,
    dailyRate: vehicle.dailyRate,
    selectedAddons,
    baseRate: breakdown.baseRate,
    discount: breakdown.discount,
    couponCode,
    couponDiscount,
    addonsTotal: breakdown.addonsTotal,
    vehicleTotal: breakdown.vehicleTotal,
    totalAmount: finalTotal,
    paymentMethod,
    paymentStatus,
    paymentReference: payRef,
    paymentTimestamp: paymentTimestamp || new Date().toISOString(),
    driverDetails: {
      fullName: driverDetails.fullName.trim(),
      email: driverDetails.email.trim().toLowerCase(),
      phone: driverDetails.phone.trim(),
      licenseNumber: driverDetails.licenseNumber.trim(),
    },
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  }

  saveStoredBookings([newBooking, ...allBookings])

  logActivity({
    type: 'confirmed',
    title: 'Booking confirmed',
    detail: `${vehicle.name} · ${duration.label} · ${pickupLocation}`,
    occurredAt: 'Just now',
  })

  return getBookingWithVehicle(newBooking)
}

export async function cancelCustomerBooking(bookingId) {
  return updateBookingStatus(bookingId, 'CANCELLED')
}

export async function returnCustomerRental(bookingId) {
  return updateBookingStatus(bookingId, 'COMPLETED')
}

export function getAllBookings() {
  const bookings = getStoredBookings()
  return bookings
    .map(getBookingWithVehicle)
    .sort((a, b) => new Date(b.createdAt || b.pickupDate) - new Date(a.createdAt || a.pickupDate))
}

function syncVehicleStatus(vehicleId, newStatus) {
  try {
    const raw = window.localStorage.getItem('vayro_mock_vehicles')
    if (raw) {
      const vehicles = JSON.parse(raw)
      const idx = vehicles.findIndex((v) => v.id === vehicleId)
      if (idx !== -1) {
        vehicles[idx] = {
          ...vehicles[idx],
          status: newStatus,
          statusUpdatedAt: new Date().toISOString(),
        }
        window.localStorage.setItem('vayro_mock_vehicles', JSON.stringify(vehicles))
      }
    }
  } catch (err) {
    console.error('Failed to sync vehicle status:', err)
  }
}

export async function updateBookingStatus(bookingId, newStatus) {
  await pause(260)
  const allBookings = getStoredBookings()
  const index = allBookings.findIndex((b) => b.id === bookingId)

  if (index === -1) {
    throw new Error('Booking not found.')
  }

  const booking = allBookings[index]
  const currentStatus = booking.status

  if (currentStatus === newStatus) {
    return getBookingWithVehicle(booking)
  }

  if (currentStatus === 'CANCELLED') {
    throw new Error('Cannot modify a cancelled booking.')
  }

  if (currentStatus === 'COMPLETED') {
    throw new Error('Cannot modify a finalized, completed rental.')
  }

  const vehicle = getVehicleById(booking.vehicleId)
  let updatedFields = { status: newStatus }

  if (newStatus === 'ACTIVE') {
    if (currentStatus !== 'CONFIRMED') {
      throw new Error(`Cannot start rental from status "${currentStatus}". Must be CONFIRMED.`)
    }
    updatedFields.startedAt = new Date().toISOString()
    syncVehicleStatus(booking.vehicleId, 'RENTED')

    logActivity({
      type: 'confirmed',
      title: 'Rental started',
      detail: `${vehicle ? vehicle.name : 'Vehicle'} · Dispatched to ${booking.driverDetails?.fullName || 'Customer'}`,
      occurredAt: 'Just now',
    })
  } else if (newStatus === 'COMPLETED') {
    if (currentStatus !== 'ACTIVE') {
      throw new Error(`Cannot complete rental from status "${currentStatus}". Must be ACTIVE on road.`)
    }
    updatedFields.returnedAt = new Date().toISOString()
    syncVehicleStatus(booking.vehicleId, 'AVAILABLE')

    logActivity({
      type: 'returned',
      title: 'Rental completed',
      detail: `${vehicle ? vehicle.name : 'Vehicle'} · Returned and released to fleet`,
      occurredAt: 'Just now',
    })
  } else if (newStatus === 'CANCELLED') {
    if (currentStatus !== 'CONFIRMED') {
      throw new Error(`Cannot cancel rental from status "${currentStatus}". Only CONFIRMED bookings can be cancelled.`)
    }
    updatedFields.cancelledAt = new Date().toISOString()
    syncVehicleStatus(booking.vehicleId, 'AVAILABLE')

    logActivity({
      type: 'cancelled',
      title: 'Booking cancelled by admin',
      detail: `${booking.id} · ${vehicle ? vehicle.name : 'Vehicle'} reservation released`,
      occurredAt: 'Just now',
    })
  } else {
    throw new Error(`Unsupported status transition to "${newStatus}".`)
  }

  const updatedBooking = {
    ...booking,
    ...updatedFields,
  }

  allBookings[index] = updatedBooking
  saveStoredBookings([...allBookings])

  return getBookingWithVehicle(updatedBooking)
}

export async function startRental(bookingId) {
  return updateBookingStatus(bookingId, 'ACTIVE')
}

export async function completeRental(bookingId) {
  return updateBookingStatus(bookingId, 'COMPLETED')
}

export async function adminCancelBooking(bookingId) {
  return updateBookingStatus(bookingId, 'CANCELLED')
}

export async function cancelBooking(bookingId, customerId) {
  await pause(250)
  const allBookings = getStoredBookings()
  const index = allBookings.findIndex((b) => b.id === bookingId)

  if (index === -1) {
    throw new Error('Booking not found.')
  }

  const booking = allBookings[index]
  if (customerId && booking.customerId !== customerId) {
    throw new Error('You do not have permission to cancel this booking.')
  }

  if (booking.status !== 'CONFIRMED') {
    throw new Error(`Cannot cancel a booking with status "${booking.status}".`)
  }

  const updatedBooking = {
    ...booking,
    status: 'CANCELLED',
    cancelledAt: new Date().toISOString(),
  }

  allBookings[index] = updatedBooking
  saveStoredBookings([...allBookings])
  syncVehicleStatus(booking.vehicleId, 'AVAILABLE')

  const vehicle = getVehicleById(booking.vehicleId)
  logActivity({
    type: 'cancelled',
    title: 'Booking cancelled',
    detail: `${vehicle ? vehicle.name : 'Vehicle'} · Reservation released`,
    occurredAt: 'Just now',
  })

  return getBookingWithVehicle(updatedBooking)
}

export async function returnVehicle(bookingId, customerId) {
  await pause(300)
  const allBookings = getStoredBookings()
  const index = allBookings.findIndex((b) => b.id === bookingId)

  if (index === -1) {
    throw new Error('Booking not found.')
  }

  const booking = allBookings[index]
  if (customerId && booking.customerId !== customerId) {
    throw new Error('You do not have permission to modify this booking.')
  }

  if (booking.status !== 'ACTIVE') {
    throw new Error(`Only active rentals can be returned. Current status: "${booking.status}".`)
  }

  const updatedBooking = {
    ...booking,
    status: 'COMPLETED',
    returnedAt: new Date().toISOString(),
  }

  allBookings[index] = updatedBooking
  saveStoredBookings([...allBookings])
  syncVehicleStatus(booking.vehicleId, 'AVAILABLE')

  const vehicle = getVehicleById(booking.vehicleId)
  logActivity({
    type: 'returned',
    title: 'Vehicle returned',
    detail: `${vehicle ? vehicle.name : 'Vehicle'} · Completed smoothly`,
    occurredAt: 'Just now',
  })

  return getBookingWithVehicle(updatedBooking)
}

