import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, CheckCircle2, MessageSquarePlus, Edit3, Trash2, ShieldCheck, ThumbsUp } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { GlassButton } from '../ui/GlassButton'
import { GlassInput } from '../ui/GlassInput'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/formatters'
import { accordionTransition } from '../../animations/variants'
import {
  getReviewsByVehicleId,
  addReview,
  updateReview,
  deleteReview,
} from '../../services/reviewService'

function StarRating({ rating, size = 16, interactive = false, onSelect }) {
  const [hoverRating, setHoverRating] = useState(0)

  return (
    <div className={`star-rating-row ${interactive ? 'is-interactive' : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hoverRating || rating) >= star
        return (
          <button
            type="button"
            key={star}
            disabled={!interactive}
            className={`star-btn ${isFilled ? 'is-filled' : 'is-empty'}`}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            onClick={() => interactive && onSelect && onSelect(star)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              className={isFilled ? 'star-icon-filled' : 'star-icon-empty'}
              fill={isFilled ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </button>
        )
      })}
    </div>
  )
}

export function VehicleReviews({ vehicle, vehicleId, vehicleName }) {
  const { user } = useAuth()
  const toast = useToast()
  const activeVehicleId = vehicleId || vehicle?.id
  const activeVehicleName = vehicleName || vehicle?.name || 'Vehicle'

  const [data, setData] = useState(() => getReviewsByVehicleId(activeVehicleId))
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    if (activeVehicleId) {
      setData(getReviewsByVehicleId(activeVehicleId))
    }
  }, [activeVehicleId])

  const [form, setForm] = useState({
    rating: 5,
    title: '',
    comment: '',
  })

  function refresh() {
    setData(getReviewsByVehicleId(activeVehicleId))
  }

  const { reviews, avgRating, totalReviews } = data

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    for (const r of reviews) {
      counts[r.rating] = (counts[r.rating] || 0) + 1
    }
    return counts
  }, [reviews])

  function handleStartAdd() {
    setForm({ rating: 5, title: '', comment: '' })
    setEditingId(null)
    setIsAdding(true)
  }

  function handleStartEdit(review) {
    setForm({
      rating: review.rating,
      title: review.title,
      comment: review.comment,
    })
    setEditingId(review.id)
    setIsAdding(true)
  }

  function handleSubmitReview(e) {
    e.preventDefault()
    if (!form.comment.trim()) {
      toast.error('Please write a few words about your rental experience.')
      return
    }

    if (editingId) {
      updateReview(editingId, form)
      toast.success('Your review has been updated.')
    } else {
      addReview({
        vehicleId: activeVehicleId,
        author: user?.name ? user.name.split(' ')[0] : 'Verified Customer',
        rating: form.rating,
        title: form.title || 'Exceptional experience',
        comment: form.comment,
        userId: user?.id,
      })
      toast.success('Thank you! Your verified review has been posted.')
    }

    setIsAdding(false)
    setEditingId(null)
    refresh()
  }

  function handleDeleteReview(reviewId) {
    deleteReview(reviewId)
    toast.success('Your review has been removed.')
    refresh()
  }

  return (
    <GlassCard className="vehicle-reviews-card">
      <div className="section-title">
        <div>
          <p className="eyebrow">Customer Experiences</p>
          <h3>Verified ratings & reviews</h3>
        </div>
        {!isAdding && (
          <GlassButton size="sm" onClick={handleStartAdd}>
            <MessageSquarePlus size={15} aria-hidden="true" /> Write a review
          </GlassButton>
        )}
      </div>

      {/* Ratings Summary Bar */}
      <div className="reviews-summary-grid">
        <div className="rating-overall-box">
          <strong className="rating-number">{avgRating.toFixed(1)}</strong>
          <StarRating rating={Math.round(avgRating)} size={18} />
          <span className="rating-count-label">Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</span>
        </div>

        {/* Breakdown Bars */}
        <div className="rating-bars-column">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingCounts[stars] || 0
            const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0
            return (
              <div key={stars} className="rating-bar-row">
                <span className="star-label">{stars} ★</span>
                <div className="rating-bar-track">
                  <div className="rating-bar-fill" style={{ width: `${percentage}%` }} />
                </div>
                <span className="rating-bar-count">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add / Edit Review Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            onSubmit={handleSubmitReview}
            className="review-submit-form"
            variants={accordionTransition}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <h4>{editingId ? 'Edit your review' : `Review ${activeVehicleName}`}</h4>
            <div className="form-rating-selector">
              <span>Your rating:</span>
              <StarRating
                rating={form.rating}
                size={22}
                interactive
                onSelect={(val) => setForm({ ...form, rating: val })}
              />
            </div>

            <GlassInput
              label="Review headline"
              placeholder="e.g. Smooth highway cruiser, pristine condition"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <label className="glass-select-group">
              <span>Your feedback</span>
              <textarea
                className="glass-textarea"
                rows={3}
                placeholder="Share details of your trip, fuel economy, comfort, or pickup experience..."
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
              />
            </label>

            <div className="review-form-actions">
              <GlassButton
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  setIsAdding(false)
                  setEditingId(null)
                }}
              >
                Cancel
              </GlassButton>
              <GlassButton size="sm" type="submit">
                {editingId ? 'Save changes' : 'Post verified review'}
              </GlassButton>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Review Cards List */}
      <div className="reviews-list">
        {reviews.map((review) => {
          const isOwn = review.isOwnReview || (user?.id && review.userId === user.id)
          return (
            <div key={review.id} className="review-item-card">
              <div className="review-item-header">
                <div>
                  <div className="review-author-row">
                    <strong>{review.author}</strong>
                    {review.verifiedRental && (
                      <span className="verified-rental-tag">
                        <ShieldCheck size={12} aria-hidden="true" /> Verified Rental
                      </span>
                    )}
                  </div>
                  <small>{formatDate(review.date)}</small>
                </div>
                <div className="review-item-actions">
                  <StarRating rating={review.rating} size={14} />
                  {isOwn && (
                    <div className="own-review-buttons">
                      <button
                        type="button"
                        className="review-icon-action"
                        onClick={() => handleStartEdit(review)}
                        title="Edit review"
                        aria-label="Edit review"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        className="review-icon-action text-danger"
                        onClick={() => handleDeleteReview(review.id)}
                        title="Delete review"
                        aria-label="Delete review"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {review.title && <h5 className="review-item-title">{review.title}</h5>}
              <p className="review-item-comment">{review.comment}</p>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
