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

export function formatToLocalDateTime(dateStr, timeStr = '10:00:00') {
  if (!dateStr) return null
  const str = String(dateStr).trim()
  if (str.includes('T')) {
    const [dPart, tPartRaw] = str.split('T')
    const tPart = tPartRaw.replace('Z', '').split('.')[0]
    const parts = tPart.split(':')
    const hh = parts[0] ? parts[0].padStart(2, '0') : '10'
    const mm = parts[1] ? parts[1].padStart(2, '0') : '00'
    const ss = parts[2] ? parts[2].padStart(2, '0') : '00'
    return `${dPart}T${hh}:${mm}:${ss}`
  }
  const time = timeStr ? (timeStr.length === 5 ? `${timeStr}:00` : timeStr) : '10:00:00'
  return `${str}T${time}`
}

/**
 * Create a new booking via Gateway: POST /api/bookings
 */
export async function createBooking(data) {
  const pickupDateTime = formatToLocalDateTime(data.pickupDateTime || data.pickupDate, data.pickupTime)
  const returnDateTime = formatToLocalDateTime(data.returnDateTime || data.returnDate, data.returnTime)

  // Map add-ons safely with valid name, quantity, and unitPrice
  const rawAddons = data.selectedAddons || data.addOns || []
  const addOns = (Array.isArray(rawAddons) ? rawAddons : [])
    .filter(Boolean)
    .map((addon) => {
      let name = ''
      let unitPrice = 0
      let quantity = 1

      if (typeof addon === 'string') {
        const found = RENTAL_ADDONS.find((a) => a.id === addon)
        name = found?.name || addon
        unitPrice = found?.pricePerDay || 200
        quantity = 1
      } else if (typeof addon === 'object') {
        const found = RENTAL_ADDONS.find((a) => a.id === addon.id)
        name = addon.name || found?.name || addon.id || ''
        unitPrice = Number(addon.unitPrice ?? addon.price ?? addon.pricePerDay ?? found?.pricePerDay ?? 200)
        quantity = Number(addon.quantity) >= 1 ? Math.floor(Number(addon.quantity)) : 1
      }

      if (!name) return null

      return {
        name,
        quantity: Math.max(1, quantity),
        unitPrice: Math.max(0, unitPrice),
      }
    })
    .filter(Boolean)

  const customerPhone =
    (data.driverDetails?.phone && data.driverDetails.phone.trim()) ||
    (data.customerPhone && data.customerPhone.trim()) ||
    (data.phone && data.phone.trim()) ||
    '+91 98765 43210'

  const customerEmail =
    (data.driverDetails?.email && data.driverDetails.email.trim().toLowerCase()) ||
    (data.customerEmail && data.customerEmail.trim().toLowerCase()) ||
    (data.email && data.email.trim().toLowerCase()) ||
    undefined

  const customerName =
    (data.driverDetails?.fullName && data.driverDetails.fullName.trim()) ||
    (data.customerName && data.customerName.trim()) ||
    undefined

  const payload = {
    vehicleId: data.vehicleId,
    pickupDateTime,
    returnDateTime,
    pickupLocation: data.pickupLocation || 'Mumbai Central Hub',
    returnLocation: data.returnLocation || data.pickupLocation || 'Mumbai Central Hub',
    notes: data.notes || '',
    customerName,
    customerEmail,
    customerPhone,
    addOns,
    couponCode: data.couponCode || null,
    discountAmount: data.discountAmount || data.couponDiscount || null,
    paymentOrderId: data.paymentOrderId || null,
    paymentMethod: data.paymentMethod || 'UPI',
    paymentStatus: data.paymentStatus || 'PAID',
    paymentReference: data.paymentReference || null,
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

  const pDt = formatToLocalDateTime(pickupDateTime)
  const rDt = formatToLocalDateTime(returnDateTime)

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

/**
 * Fetch latest email notification status for a booking: GET /api/notifications/latest/{bookingReference}
 */
export async function fetchNotificationStatus(bookingReference) {
  if (!bookingReference) return null
  try {
    const res = await api.get(`/api/notifications/latest/${bookingReference}`)
    return res.data
  } catch {
    // Fallback to idempotency key check
    try {
      const res = await api.get(`/api/notifications/status/BOOKING_CONFIRMED:${bookingReference}`)
      return res.data
    } catch {
      return null
    }
  }
}

/**
 * Download booking PDF tax invoice: GET /api/notifications/invoice/{bookingReference}
 */
export async function downloadInvoicePdf(bookingReference) {
  if (!bookingReference) return
  const response = await api.get(`/api/notifications/invoice/${bookingReference}`, {
    responseType: 'blob',
  })

  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `VAYRO-Invoice-${bookingReference}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

