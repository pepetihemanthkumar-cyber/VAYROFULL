export function dateToInputValue(date) {
  const localDate = new Date(date)
  if (isNaN(localDate.getTime())) {
    const fallback = new Date()
    const offset = fallback.getTimezoneOffset()
    return new Date(fallback.getTime() - offset * 60_000).toISOString().slice(0, 10)
  }
  const offset = localDate.getTimezoneOffset()
  return new Date(localDate.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export function addDays(date, days) {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate
}

export function calculateRentalDays(pickupDate, returnDate) {
  if (!pickupDate || !returnDate) return 0
  const start = new Date(`${pickupDate}T12:00:00`)
  const end = new Date(`${returnDate}T12:00:00`)
  const duration = Math.round((end - start) / 86_400_000)
  return duration > 0 ? duration : 0
}

export function dateTimeToTimestamp(date, time = '12:00') {
  if (!date) return NaN
  return new Date(`${date}T${time || '12:00'}:00`).getTime()
}

/**
 * Calculate precise, customer-friendly duration from pickup & return dates and times.
 * @param {string} pickupDate 'YYYY-MM-DD'
 * @param {string} pickupTime 'HH:MM'
 * @param {string} returnDate 'YYYY-MM-DD'
 * @param {string} returnTime 'HH:MM'
 */
export function calculateRentalDuration(pickupDate, pickupTime = '10:00', returnDate, returnTime = '10:00') {
  if (!pickupDate || !returnDate) {
    return {
      valid: false,
      hours: 0,
      days: 0,
      wholeDays: 0,
      remainingHours: 0,
      label: 'Select dates',
      error: 'Please select both pick-up and return dates.',
      durationType: 'DAYS',
      durationValue: 0,
    }
  }

  const start = dateTimeToTimestamp(pickupDate, pickupTime)
  const end = dateTimeToTimestamp(returnDate, returnTime)

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return {
      valid: false,
      hours: 0,
      days: 0,
      wholeDays: 0,
      remainingHours: 0,
      label: 'Invalid date/time',
      error: 'Please enter valid pick-up and return times.',
      durationType: 'DAYS',
      durationValue: 0,
    }
  }

  const durationMs = end - start
  if (durationMs <= 0) {
    return {
      valid: false,
      hours: 0,
      days: 0,
      wholeDays: 0,
      remainingHours: 0,
      label: 'Invalid return time',
      error: 'Return time must be after pick-up time.',
      durationType: 'DAYS',
      durationValue: 0,
    }
  }

  const totalHours = Math.round((durationMs / 3_600_000) * 10) / 10
  const wholeHours = Math.max(1, Math.round(durationMs / 3_600_000))
  const wholeDays = Math.floor(wholeHours / 24)
  const remainingHours = wholeHours % 24
  const days = Math.ceil(wholeHours / 24)

  let label = ''
  let durationType = 'DAYS'
  let durationValue = days

  if (wholeDays === 0) {
    durationType = 'HOURS'
    durationValue = wholeHours
    label = `${wholeHours} ${wholeHours === 1 ? 'hour' : 'hours'}`
  } else if (remainingHours === 0) {
    durationType = wholeDays >= 14 ? 'LONG_TERM' : 'DAYS'
    durationValue = wholeDays
    label = `${wholeDays} ${wholeDays === 1 ? 'day' : 'days'}`
  } else {
    durationType = wholeDays >= 14 ? 'LONG_TERM' : 'DAYS'
    durationValue = wholeDays
    const dayPart = `${wholeDays} ${wholeDays === 1 ? 'day' : 'days'}`
    const hourPart = `${remainingHours} ${remainingHours === 1 ? 'hour' : 'hours'}`
    label = `${dayPart} ${hourPart}`
  }

  return {
    valid: true,
    ms: durationMs,
    hours: wholeHours,
    exactHours: totalHours,
    days: Math.max(1, days),
    wholeDays,
    remainingHours,
    label,
    error: null,
    durationType,
    durationValue,
  }
}

export function isFutureDate(value) {
  return new Date(`${value}T12:00:00`) > new Date(`${dateToInputValue(new Date())}T00:00:00`)
}

export function areDateRangesOverlapping(start1, end1, start2, end2, time1, time2, time3, time4) {
  if (!start1 || !end1 || !start2 || !end2) return false
  const s1 = dateTimeToTimestamp(start1, time1)
  const e1 = dateTimeToTimestamp(end1, time2)
  const s2 = dateTimeToTimestamp(start2, time3)
  const e2 = dateTimeToTimestamp(end2, time4)
  return s1 < e2 && s2 < e1
}

export const CAR_ADDONS = [
  {
    id: 'premium_protection',
    name: 'Premium Protection',
    description: 'Zero excess liability for collision damage, theft, and windscreen cover.',
    pricePerDay: 800,
    icon: 'ShieldCheck',
  },
  {
    id: 'roadside_assistance',
    name: 'Roadside Assistance',
    description: '24/7 round-the-clock priority dispatch, battery boost, and flat-tyre support.',
    pricePerDay: 250,
    icon: 'Wrench',
  },
  {
    id: 'gps_navigation',
    name: 'GPS Navigation',
    description: 'Integrated satellite navigation terminal with offline high-precision routing.',
    pricePerDay: 150,
    icon: 'Navigation',
  },
  {
    id: 'additional_driver',
    name: 'Additional Driver',
    description: 'Authorize an extra co-driver with full insurance privileges.',
    pricePerDay: 300,
    icon: 'Users',
  },
]

export const BIKE_ADDONS = [
  {
    id: 'helmet_pillion',
    name: 'Pillion Helmet (DOT Certified)',
    description: 'Additional ISI/DOT certified safety helmet for your pillion co-rider.',
    pricePerDay: 120,
    icon: 'HardHat',
  },
  {
    id: 'riding_gear',
    name: 'Pro Riding Gear (Jacket & Gloves)',
    description: 'CE-armored all-weather protective riding jacket and reinforced leather gloves.',
    pricePerDay: 250,
    icon: 'ShieldCheck',
  },
  {
    id: 'phone_mount',
    name: 'Waterproof Phone Mount',
    description: 'Vibration-damped handlebar smartphone holder with fast USB charging.',
    pricePerDay: 80,
    icon: 'Smartphone',
  },
  {
    id: 'luggage_box',
    name: 'Luggage Top Box & Panniers',
    description: 'Secure lockable waterproof 45L tail luggage box for touring and long rides.',
    pricePerDay: 180,
    icon: 'Package',
  },
  {
    id: 'roadside_assistance',
    name: 'Roadside Assistance',
    description: '24/7 breakdown recovery, flat tyre support, and emergency fuel/battery dispatch.',
    pricePerDay: 120,
    icon: 'Wrench',
  },
]

export const RENTAL_ADDONS = [...CAR_ADDONS, ...BIKE_ADDONS.filter((b) => !CAR_ADDONS.some((c) => c.id === b.id))]

export function getAddonsForVehicle(vehicle) {
  if (vehicle?.vehicleType === 'bike') {
    return BIKE_ADDONS
  }
  return CAR_ADDONS
}

/**
 * Calculate dynamic booking breakdown and pricing using the vehicle's established rates.
 */
export function calculateBookingBreakdown({
  vehicle,
  pickupDate,
  pickupTime = '10:00',
  returnDate,
  returnTime = '10:00',
  selectedAddonIds = [],
  dailyRate: directDailyRate,
  days: directDays,
}) {
  const dailyRate = vehicle?.dailyRate || directDailyRate || 0
  const pricingConfig = vehicle?.pricing || {}

  // If explicit dates/times are passed, calculate duration dynamically
  let duration
  if (pickupDate && returnDate) {
    duration = calculateRentalDuration(pickupDate, pickupTime, returnDate, returnTime)
  } else {
    const fallbackDays = Math.max(1, directDays || 1)
    duration = {
      valid: true,
      hours: fallbackDays * 24,
      days: fallbackDays,
      wholeDays: fallbackDays,
      remainingHours: 0,
      label: `${fallbackDays} ${fallbackDays === 1 ? 'day' : 'days'}`,
      durationType: fallbackDays >= 14 ? 'LONG_TERM' : 'DAYS',
      durationValue: fallbackDays,
    }
  }

  if (!duration.valid) {
    return {
      valid: false,
      dailyRate,
      hourlyRate: pricingConfig.hourly?.[1] || Math.round(dailyRate * 0.14),
      duration,
      baseRate: 0,
      discount: 0,
      vehicleTotal: 0,
      addonsList: [],
      addonsTotal: 0,
      totalAmount: 0,
    }
  }

  let baseRate = 0
  let discount = 0
  let addonMultiplier = 1

  if (duration.wholeDays === 0) {
    // Hourly Rental (<24 Hours)
    const h = Math.max(1, duration.hours)
    addonMultiplier = Math.max(0.25, Math.round((h / 24) * 100) / 100)

    if (pricingConfig.hourly?.[h]) {
      baseRate = Number(pricingConfig.hourly[h])
    } else {
      baseRate = Math.round(dailyRate * (0.14 + h * 0.025))
    }
    // Cap hourly rental at 1 day rate
    baseRate = Math.min(baseRate, dailyRate)
    discount = 0
  } else if (duration.remainingHours === 0 && duration.wholeDays < 14) {
    // Exact Days Rental (1–13 Days)
    const d = duration.wholeDays
    addonMultiplier = d
    baseRate = dailyRate * d

    if (pricingConfig.discounts?.[d]) {
      discount = Number(pricingConfig.discounts[d])
    } else if (d >= 7) {
      discount = Math.round(dailyRate * d * 0.12)
    } else if (d > 1) {
      discount = Math.round(dailyRate * d * Math.min(0.12, (d - 1) * 0.02))
    }
  } else if (duration.wholeDays >= 14) {
    // Long-Term Rental (14+ Days)
    const d = duration.wholeDays
    addonMultiplier = d
    baseRate = dailyRate * d

    if (pricingConfig.discounts?.[d]) {
      discount = Number(pricingConfig.discounts[d])
    } else if (d >= 30) {
      discount = Math.round(dailyRate * d * 0.32)
    } else if (d >= 21) {
      discount = Math.round(dailyRate * d * 0.24)
    } else {
      discount = Math.round(dailyRate * d * 0.18)
    }
  } else {
    // Multi-Day with Extra Hours (e.g. 1 day 5 hours)
    const d = duration.wholeDays
    const extraHours = duration.remainingHours
    addonMultiplier = d + Math.round((extraHours / 24) * 100) / 100

    const daysBase = dailyRate * d
    const daysDiscount = pricingConfig.discounts?.[d] || (d >= 7 ? Math.round(dailyRate * d * 0.12) : 0)
    const daysCost = daysBase - daysDiscount

    const extraHourlyRate = pricingConfig.hourly?.[extraHours] || Math.round(dailyRate * (0.14 + extraHours * 0.025))
    const rawTotal = daysCost + extraHourlyRate

    // Cap at next full day rate
    const nextDayBase = dailyRate * (d + 1)
    const nextDayDiscount = pricingConfig.discounts?.[d + 1] || ((d + 1) >= 7 ? Math.round(dailyRate * (d + 1) * 0.12) : 0)
    const nextDayCap = nextDayBase - nextDayDiscount

    const vehicleTotal = Math.min(rawTotal, nextDayCap)
    baseRate = dailyRate * d + extraHourlyRate
    discount = Math.max(0, baseRate - vehicleTotal)
  }

  const vehicleTotal = Math.max(0, baseRate - discount)

  // Calculate Add-ons
  const selectedAddonsList = RENTAL_ADDONS.filter((addon) => selectedAddonIds.includes(addon.id))
  const addonsWithTotal = selectedAddonsList.map((addon) => {
    const total = Math.round(addon.pricePerDay * addonMultiplier)
    return {
      ...addon,
      days: duration.days,
      multiplier: addonMultiplier,
      total,
    }
  })

  const addonsTotal = addonsWithTotal.reduce((sum, item) => sum + item.total, 0)
  const totalAmount = vehicleTotal + addonsTotal

  return {
    valid: true,
    dailyRate,
    hourlyRate: pricingConfig.hourly?.[1] || Math.round(dailyRate * 0.14),
    duration,
    baseRate,
    discount,
    vehicleTotal,
    addonsList: addonsWithTotal,
    addonsTotal,
    totalAmount,
  }
}

export function calculateRentalPrice(vehicle, durationType = 'DAYS', durationValue = 1, selectedAddonIds = []) {
  const pricing = vehicle?.pricing || {}
  const value = Number(durationValue) || 1
  const rates = durationType === 'HOURS' ? pricing.hourly : durationType === 'LONG_TERM' ? pricing.longTerm : pricing.daily
  const baseRate = Number(rates?.[value] || (durationType === 'HOURS' ? Math.round((vehicle?.dailyRate || 0) * (0.14 + value * 0.025)) : (vehicle?.dailyRate || 0) * value))
  const discount = Number(pricing.discounts?.[value] || 0)
  const addonMultiplier = durationType === 'HOURS' ? Math.max(0.25, value / 24) : value
  const selectedAddons = RENTAL_ADDONS.filter((addon) => selectedAddonIds.includes(addon.id))
  const addOns = selectedAddons.reduce((sum, addon) => sum + Math.round(addon.pricePerDay * addonMultiplier), 0)

  return {
    durationType,
    durationValue: value,
    baseRate,
    discount,
    subtotal: Math.max(0, baseRate - discount),
    addOns,
    estimatedTotal: Math.max(0, baseRate - discount) + addOns,
  }
}

export function maskLicenseNumber(licenseNumber) {
  if (!licenseNumber) return '—'
  const trimmed = licenseNumber.trim()
  if (trimmed.length <= 6) return trimmed
  const start = trimmed.slice(0, 4)
  const end = trimmed.slice(-4)
  return `${start}-****-${end}`
}
