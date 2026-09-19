import { seedReviews } from '../data/reviews'

const REVIEWS_STORAGE_KEY = 'vayro_user_reviews'

function getStoredUserReviews() {
  try {
    const raw = window.localStorage.getItem(REVIEWS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Failed to parse stored user reviews:', err)
    return []
  }
}

function saveStoredUserReviews(reviews) {
  try {
    window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews))
  } catch (err) {
    console.error('Failed to save stored user reviews:', err)
  }
}

export function getReviewsByVehicleId(vehicleId) {
  const userReviews = getStoredUserReviews()
  const matchingUserReviews = userReviews.filter((r) => r.vehicleId === vehicleId)
  const matchingSeedReviews = seedReviews.filter((r) => r.vehicleId === vehicleId)

  // If vehicle has no specific seed reviews, create default realistic seed reviews based on model
  const defaultSeeds = matchingSeedReviews.length > 0 ? matchingSeedReviews : [
    {
      id: `seed-default-${vehicleId}-1`,
      vehicleId,
      author: 'Sameer',
      rating: 5,
      title: 'Flawless rental experience',
      comment: 'Vehicle was in showroom condition with clean cabin, full tank, and smooth pickup process.',
      date: '2026-08-15',
      verifiedRental: true,
    },
    {
      id: `seed-default-${vehicleId}-2`,
      vehicleId,
      author: 'Priyanka',
      rating: 5,
      title: 'Highly satisfied with VAYRO',
      comment: 'Great road manners and comfort. Return was fast and hassle-free at the depot.',
      date: '2026-08-24',
      verifiedRental: true,
    },
  ]

  const allReviews = [...matchingUserReviews, ...defaultSeeds]
  const totalReviews = allReviews.length
  const avgRating = totalReviews > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '5.0'

  return {
    reviews: allReviews,
    totalReviews,
    avgRating: Number(avgRating),
  }
}

export function addReview({ vehicleId, author, rating, title, comment, userId }) {
  const userReviews = getStoredUserReviews()
  const newReview = {
    id: `user-rev-${Date.now()}`,
    vehicleId,
    author: author.trim() || 'Verified Customer',
    rating: Math.max(1, Math.min(5, Number(rating) || 5)),
    title: title.trim() || 'Great drive',
    comment: comment.trim(),
    date: new Date().toISOString().slice(0, 10),
    verifiedRental: true,
    isOwnReview: true,
    userId: userId || 'usr_current',
  }

  const updated = [newReview, ...userReviews]
  saveStoredUserReviews(updated)
  return newReview
}

export function updateReview(reviewId, { rating, title, comment }) {
  const userReviews = getStoredUserReviews()
  const idx = userReviews.findIndex((r) => r.id === reviewId)
  if (idx === -1) throw new Error('Review not found.')

  userReviews[idx] = {
    ...userReviews[idx],
    rating: Math.max(1, Math.min(5, Number(rating) || 5)),
    title: title.trim(),
    comment: comment.trim(),
    updatedAt: new Date().toISOString().slice(0, 10),
  }

  saveStoredUserReviews(userReviews)
  return userReviews[idx]
}

export function deleteReview(reviewId) {
  const userReviews = getStoredUserReviews()
  const filtered = userReviews.filter((r) => r.id !== reviewId)
  saveStoredUserReviews(filtered)
  return true
}
