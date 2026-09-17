import { api } from './api'
import { getVehicleById } from './vehicleService'
import { RENTAL_ADDONS, calculateRentalDuration } from '../utils/rental'

const ACTIVITIES_KEY = 'vayro_mock_activities'

export function mapBooking(b) {
  if (!b) return null
  const pickupDt = b.pickupDateTime ? String(b.pickupDateTime) : ''
  const returnDt = b.returnDateTime ? String(b.returnDateTime) : ''
  const pickupDate = pickupDt.slice(0, 10)
  const pickupTime = pickupDt.includes('T') ? pickupDt.slice(11, 16) : '10:00'
  const returnDate = returnDt.slice(0, 10)
  const returnTime = returnDt.includes('T') ? returnDt.slice(11, 16) : '10:00'

  const duration = calculateRentalDuration(pickupDate, pickupTime, returnDate, returnTime)

  return {
    id: b.bookingReference || (b.id ? `BK-${b.id}` : 'BK-REF'),
    rawId: b.id,
    bookingReference: b.bookingReference,
    vehicleId: b.vehicleId,
    vehicleName: b.vehicleName,
    userId: b.userId,
    customerId: b.userId,
    customerName: b.customerName,
    customerEmail: b.customerEmail,
    pickupDateTime: b.pickupDateTime,
    returnDateTime: b.returnDateTime,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    rentalDays: b.rentalDays || duration.days || 1,
    durationLabel: duration.valid ? duration.label : `${b.rentalDays || 1} days`,
    durationHours: duration.hours,
    dailyRate: b.pricePerDay ? Number(b.pricePerDay) : 0,
    pricePerDay: b.pricePerDay ? Number(b.pricePerDay) : 0,
    baseAmount: b.baseAmount ? Number(b.baseAmount) : 0,
    addOnsAmount: b.addOnsAmount ? Number(b.addOnsAmount) : 0,
    discountAmount: b.discountAmount ? Number(b.discountAmount) : 0,
    taxAmount: b.taxAmount ? Number(b.taxAmount) : 0,
    totalAmount: b.totalAmount ? Number(b.totalAmount) : 0,
    status: b.status,
    paymentStatus: b.paymentStatus || 'COMPLETED',
    paymentReference: b.bookingReference ? `PAY-${b.bookingReference}` : 'PAY-DIRECT',
    pickupLocation: b.pickupLocation,
    returnLocation: b.returnLocation,
    notes: b.notes,
    returnedAt: b.returnedAt,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    priceBreakdown: b.priceBreakdown,
    vehicle: getVehicleById(b.vehicleId) || null,
    vehicleSnapshot: {
      id: b.vehicleId,
      name: b.vehicleName,
    },
    driverDetails: {
      fullName: b.customerName || 'Driver',
      email: b.customerEmail || '',
      phone: '+91 98765 43210',
      licenseNumber: 'MH01-2022-998811',
    },
  }
}

/**
 * Create a new booking via Gateway: POST /api/bookings
 */
export async function createBooking(data) {
  // Format dates into ISO LocalDateTime string: YYYY-MM-DDTHH:mm:ss
  let pickupDateTime = data.pickupDateTime
  if (!pickupDateTime && data.pickupDate) {
    const time = data.pickupTime ? (data.pickupTime.length === 5 ? `${data.pickupTime}:00` : data.pickupTime) : '10:00:00'
    pickupDateTime = `${data.pickupDate}T${time}`
  }

  let returnDateTime = data.returnDateTime
  if (!returnDateTime && data.returnDate) {
    const time = data.returnTime ? (data.returnTime.length === 5 ? `${data.returnTime}:00` : data.returnTime) : '10:00:00'
    returnDateTime = `${data.returnDate}T${time}`
  }

  // Ensure clean ISO string without duplicate seconds or T
  if (pickupDateTime && !pickupDateTime.includes('T')) {
    pickupDateTime = `${pickupDateTime}T10:00:00`
  }
  if (returnDateTime && !returnDateTime.includes('T')) {
    returnDateTime = `${returnDateTime}T10:00:00`
  }

  // Map add-ons
  const addOns = (data.selectedAddons || data.addOns || []).map((addon) => {
    if (typeof addon === 'string') {
      const found = RENTAL_ADDONS.find((a) => a.id === addon)
      return {
        id: addon,
        name: found?.name || addon,
        price: found?.pricePerDay || 200,
      }
    }
    return {
      id: addon.id,
      name: addon.name || addon.id,
      price: addon.price || addon.pricePerDay || 200,
    }
  })

  const payload = {
    vehicleId: data.vehicleId,
    pickupDateTime,
    returnDateTime,
    pickupLocation: data.pickupLocation || 'Mumbai Central Hub',
    returnLocation: data.returnLocation || data.pickupLocation || 'Mumbai Central Hub',
    notes: data.notes || '',
    addOns,
    couponCode: data.couponCode || null,
    discountAmount: data.discountAmount || data.couponDiscount || null,
  }

  const response = await api.post('/api/bookings', payload)
  return mapBooking(response.data)
}

/**
 * Fetch current user's bookings: GET /api/bookings/my
 */
export async function fetchMyBookings(params = {}) {
  const query = {
    page: params.page ?? 0,
    size: params.size ?? 100,
    ...params,
  }

  const response = await api.get('/api/bookings/my', { params: query })
  const data = response.data
  const list = Array.isArray(data) ? data : (data.content || [])
  return list.map(mapBooking)
}

/**
 * Alias for customer bookings fetch
 */
export async function getBookingsForCustomer(userId) {
  try {
    return await fetchMyBookings()
  } catch {
    return []
  }
}

/**
 * Fetch booking details by ID: GET /api/bookings/{id}
 */
export async function fetchBookingById(id) {
  if (!id) return null
  const response = await api.get(`/api/bookings/${id}`)
  return mapBooking(response.data)
}

export async function getBookingById(id) {
  return fetchBookingById(id)
}

/**
 * Fetch booking details by Reference: GET /api/bookings/reference/{reference}
 */
export async function fetchBookingByReference(reference) {
  if (!reference) return null
  const response = await api.get(`/api/bookings/reference/${reference}`)
  return mapBooking(response.data)
}

/**
 * Check real booking availability via Booking Service: GET /api/bookings/availability/{vehicleId}
 */
export async function checkBookingAvailability(vehicleId, pickupDateTime, returnDateTime) {
  if (!vehicleId) return { available: false, reason: 'Vehicle ID required' }

  let pDt = pickupDateTime
  if (pDt && !pDt.includes('T')) pDt = `${pDt}T10:00:00`
  let rDt = returnDateTime
  if (rDt && !rDt.includes('T')) rDt = `${rDt}T10:00:00`

  try {
    const response = await api.get(`/api/bookings/availability/${vehicleId}`, {
      params: {
        pickupDateTime: pDt,
        returnDateTime: rDt,
      },
    })
    return response.data
  } catch (err) {
    return {
      vehicleId,
      available: false,
      reason: err.message || 'Availability check failed',
    }
  }
}

/**
 * Alias for vehicle details availability check
 */
export async function checkVehicleAvailability(vehicleId, pickupDate, returnDate, excludeId, pickupTime, returnTime) {
  if (!vehicleId || !pickupDate || !returnDate) {
    return { available: true }
  }

  const pTime = pickupTime ? (pickupTime.length === 5 ? `${pickupTime}:00` : pickupTime) : '10:00:00'
  const rTime = returnTime ? (returnTime.length === 5 ? `${returnTime}:00` : returnTime) : '10:00:00'
  const pickupDateTime = `${pickupDate}T${pTime}`
  const returnDateTime = `${returnDate}T${rTime}`

  return await checkBookingAvailability(vehicleId, pickupDateTime, returnDateTime)
}

/**
 * Cancel booking: PATCH /api/bookings/{id}/cancel
 */
export async function cancelCustomerBooking(id, reason = 'Customer requested cancellation') {
  const response = await api.patch(`/api/bookings/${id}/cancel`, { reason })
  return mapBooking(response.data)
}

export async function cancelBooking(id, reason) {
  return cancelCustomerBooking(id, reason)
}

/**
 * Return rental (triggers return on backend)
 */
export async function returnCustomerRental(id) {
  const response = await api.patch(`/api/bookings/${id}/return`)
  return mapBooking(response.data)
}

// -------------------------------------------------------------
// Admin Booking Management APIs
// -------------------------------------------------------------

/**
 * Admin: Fetch all bookings: GET /api/bookings
 */
export async function fetchAllBookings(params = {}) {
  const query = {
    page: params.page ?? 0,
    size: params.size ?? 200,
    ...params,
  }

  const response = await api.get('/api/bookings', { params: query })
  const data = response.data
  const list = Array.isArray(data) ? data : (data.content || [])
  return list.map(mapBooking)
}

export async function getAllBookings() {
  return fetchAllBookings()
}

/**
 * Admin: Confirm booking: PATCH /api/bookings/{id}/confirm
 */
export async function confirmBooking(id) {
  const response = await api.patch(`/api/bookings/${id}/confirm`)
  return mapBooking(response.data)
}

/**
 * Admin: Activate booking: PATCH /api/bookings/{id}/activate
 */
export async function activateBooking(id) {
  const response = await api.patch(`/api/bookings/${id}/activate`)
  return mapBooking(response.data)
}

/**
 * Admin: Return booking: PATCH /api/bookings/{id}/return
 */
export async function returnBooking(id) {
  const response = await api.patch(`/api/bookings/${id}/return`)
  return mapBooking(response.data)
}

/**
 * Admin: Complete booking: PATCH /api/bookings/{id}/complete
 */
export async function completeBooking(id) {
  const response = await api.patch(`/api/bookings/${id}/complete`)
  return mapBooking(response.data)
}

/**
 * Generic status updater for admin modals
 */
export async function updateBookingStatus(id, action) {
  const cleanAction = String(action).toLowerCase()
  if (cleanAction === 'confirm' || cleanAction === 'confirmed') {
    return confirmBooking(id)
  }
  if (cleanAction === 'activate' || cleanAction === 'active') {
    return activateBooking(id)
  }
  if (cleanAction === 'return' || cleanAction === 'returned') {
    return returnBooking(id)
  }
  if (cleanAction === 'complete' || cleanAction === 'completed') {
    return completeBooking(id)
  }
  if (cleanAction === 'cancel' || cleanAction === 'cancelled') {
    return cancelBooking(id, 'Admin cancelled booking')
  }
  throw new Error(`Unsupported lifecycle action: ${action}`)
}

// -------------------------------------------------------------
// UI helpers & Activities
// -------------------------------------------------------------

export function getBookingWithVehicle(booking) {
  if (!booking) return null
  return {
    ...booking,
    vehicle: getVehicleById(booking.vehicleId) || booking.vehicleSnapshot || null,
  }
}

export function getActiveBookings(bookingsListOrUserId) {
  if (Array.isArray(bookingsListOrUserId)) {
    return bookingsListOrUserId.filter((b) => b.status === 'ACTIVE')
  }
  return []
}

export function getUpcomingBooking(bookingsListOrUserId) {
  if (Array.isArray(bookingsListOrUserId)) {
    return bookingsListOrUserId.find((b) => b.status === 'CONFIRMED') || null
  }
  return null
}

export function getStoredActivities() {
  try {
    const raw = window.localStorage.getItem(ACTIVITIES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function logActivity({ type, title, detail, occurredAt = 'Just now' }) {
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
  } catch {}
}

export function getStoredBookings() {
  return []
}

/**
 * Synchronous upcoming bookings accessor for UI components.
 * Returns an empty array — real upcoming bookings are loaded asynchronously
 * via fetchMyBookings(). This export resolves legacy import compatibility.
 */
export function getUpcomingBookings() {
  return []
}
