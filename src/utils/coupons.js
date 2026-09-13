export const DEMO_COUPONS = {
  DRIVE10: {
    code: 'DRIVE10',
    description: '10% off your entire vehicle rental subtotal',
    type: 'PERCENTAGE',
    value: 10,
    minDays: 1,
  },
  WELCOME: {
    code: 'WELCOME',
    description: 'Flat ₹500 discount for verified members',
    type: 'FLAT',
    value: 500,
    minDays: 1,
  },
  WEEKEND: {
    code: 'WEEKEND',
    description: '5% instant discount for short and weekend drives',
    type: 'PERCENTAGE',
    value: 5,
    minDays: 1,
  },
  LONGTRIP: {
    code: 'LONGTRIP',
    description: '15% privilege discount on rentals of 7 days or more',
    type: 'PERCENTAGE',
    value: 15,
    minDays: 7,
  },
}

/**
 * Validate and calculate promo code discount
 * @param {string} code Promo code input
 * @param {number} vehicleSubtotal Base rental subtotal
 * @param {number} rentalDays Total duration days
 * @returns {{ valid: boolean, discount: number, coupon: object|null, error: string|null }}
 */
export function validateAndApplyCoupon(code, vehicleSubtotal = 0, rentalDays = 1) {
  if (!code || typeof code !== 'string') {
    return { valid: false, discount: 0, coupon: null, error: 'Please enter a promo code.' }
  }

  const cleanCode = code.trim().toUpperCase()
  const coupon = DEMO_COUPONS[cleanCode]

  if (!coupon) {
    return { valid: false, discount: 0, coupon: null, error: 'Invalid promo code.' }
  }

  if (rentalDays < coupon.minDays) {
    return {
      valid: false,
      discount: 0,
      coupon: null,
      error: `Coupon "${cleanCode}" requires a minimum rental of ${coupon.minDays} days.`,
    }
  }

  let discount = 0
  if (coupon.type === 'PERCENTAGE') {
    discount = Math.round((vehicleSubtotal * coupon.value) / 100)
  } else if (coupon.type === 'FLAT') {
    discount = coupon.value
  }

  // Ensure discount doesn't exceed vehicleSubtotal
  discount = Math.min(discount, vehicleSubtotal)

  return {
    valid: true,
    discount,
    coupon: {
      code: coupon.code,
      description: coupon.description,
      discountAmount: discount,
    },
    error: null,
  }
}
