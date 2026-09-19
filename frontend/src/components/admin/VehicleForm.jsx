import { CarFront, Image as ImageIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { GlassButton } from '../ui/GlassButton'
import { GlassInput } from '../ui/GlassInput'
import { VehicleImage } from '../vehicles/VehicleImage'

const VEHICLE_TYPES = ['SEDAN', 'SUV', 'HATCHBACK', 'MUV', 'LUXURY', 'VAN']
const TRANSMISSIONS = ['Automatic', 'Manual']
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric']
const CLASS_OPTIONS = ['Hatchback', 'Premium Hatchback', 'Sedan', 'Executive Sedan', 'Luxury Sedan', 'Compact SUV', 'SUV', 'Premium SUV', 'Luxury SUV', 'MUV', 'MPV', 'Van', 'Premium Van', 'Luxury Van', 'Electric', 'Premium Electric', 'Luxury Electric', 'Convertible', 'Sports Car', 'Supercar', 'Off-Road', 'Pickup', 'Commercial Passenger Vehicle']
const HOURLY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]
const DAILY_OPTIONS = [1, 2, 3, 4, 5, 6, 7]
const LONG_TERM_OPTIONS = [14, 21, 30]

function defaultPricing(dailyRate) {
  const rate = Number(dailyRate) || 0
  return {
    hourly: Object.fromEntries(HOURLY_OPTIONS.map((hours) => [hours, Math.round(rate * (0.14 + hours * 0.025))])),
    daily: Object.fromEntries(DAILY_OPTIONS.map((days) => [days, Math.round(rate * days * (1 - Math.min(0.12, (days - 1) * 0.02)))])),
    longTerm: Object.fromEntries(LONG_TERM_OPTIONS.map((days) => [days, Math.round(rate * days * 0.75)])),
    discounts: {},
  }
}

export function VehicleForm({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Save vehicle',
}) {
  const [formData, setFormData] = useState({
    name: initialValues.name || '',
    brand: initialValues.brand || '',
    model: initialValues.model || '',
    year: initialValues.year || new Date().getFullYear(),
    registrationNumber: initialValues.registrationNumber || '',
    type: initialValues.type || 'SEDAN',
    category: initialValues.category || initialValues.type || 'SEDAN',
    class: initialValues.class || 'Sedan',
    dailyRate: initialValues.dailyRate || '',
    pricing: initialValues.pricing || defaultPricing(initialValues.dailyRate),
    seats: initialValues.seats || 5,
    transmission: initialValues.transmission || 'Automatic',
    fuelType: initialValues.fuelType || 'Petrol',
    airConditioning: initialValues.airConditioning !== undefined ? initialValues.airConditioning : true,
    description: initialValues.description || '',
    image: initialValues.image || '',
    galleryUrls: initialValues.images?.gallery?.join('\n') || '',
  })

  const [errors, setErrors] = useState({})
  const [pricingTouched, setPricingTouched] = useState(Boolean(initialValues.pricing))

  useEffect(() => {
    if (!pricingTouched) setFormData((prev) => ({ ...prev, pricing: defaultPricing(prev.dailyRate) }))
  }, [formData.dailyRate, pricingTouched])

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function updatePricing(type, duration, value) {
    setPricingTouched(true)
    setFormData((prev) => ({ ...prev, pricing: { ...prev.pricing, [type]: { ...prev.pricing[type], [duration]: value } } }))
  }

  function validate() {
    const errs = {}
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Vehicle name is required.'
    }
    if (!formData.brand.trim()) {
      errs.brand = 'Brand is required.'
    }
    if (!formData.model.trim()) {
      errs.model = 'Model variant is required.'
    }
    const currentYear = new Date().getFullYear() + 1
    if (!formData.year || formData.year < 2000 || formData.year > currentYear) {
      errs.year = `Enter a valid year (2000 – ${currentYear}).`
    }
    if (!formData.registrationNumber.trim() || formData.registrationNumber.trim().length < 5) {
      errs.registrationNumber = 'Enter a valid registration (e.g. MH 01 ET 4821).'
    }
    if (!formData.dailyRate || Number(formData.dailyRate) <= 0) {
      errs.dailyRate = 'Enter a valid daily rate in ₹.'
    }
    if (!formData.seats || Number(formData.seats) < 2 || Number(formData.seats) > 15) {
      errs.seats = 'Seats must be between 2 and 15.'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return false
    }
    return true
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      ...formData,
      category: formData.type,
      images: { primary: formData.image, gallery: formData.galleryUrls.split('\n').map((url) => url.trim()).filter(Boolean) },
    })
  }

  return (
    <form className="admin-vehicle-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid-two-col">
        {/* Basic Identifiers */}
        <GlassInput
          label="Display Name"
          placeholder="e.g. Toyota Camry Hybrid"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          error={errors.name}
          disabled={isSubmitting}
          required
        />

        <GlassInput
          label="Registration Number"
          placeholder="e.g. MH 01 ET 4821"
          value={formData.registrationNumber}
          onChange={(e) => updateField('registrationNumber', e.target.value)}
          error={errors.registrationNumber}
          disabled={isSubmitting}
          required
        />

        <GlassInput
          label="Brand / Manufacturer"
          placeholder="e.g. Toyota"
          value={formData.brand}
          onChange={(e) => updateField('brand', e.target.value)}
          error={errors.brand}
          disabled={isSubmitting}
          required
        />

        <GlassInput
          label="Model / Variant"
          placeholder="e.g. Camry Hybrid"
          value={formData.model}
          onChange={(e) => updateField('model', e.target.value)}
          error={errors.model}
          disabled={isSubmitting}
          required
        />

        {/* Technical Specs */}
        <div className="glass-select-group">
          <span>Vehicle Category</span>
          <select
            value={formData.type}
            onChange={(e) => updateField('type', e.target.value)}
            disabled={isSubmitting}
          >
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="glass-select-group">
          <span>Vehicle Class</span>
          <select value={formData.class} onChange={(e) => updateField('class', e.target.value)} disabled={isSubmitting}>
            {CLASS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <GlassInput
          label="Model Year"
          type="number"
          placeholder="2024"
          value={formData.year}
          onChange={(e) => updateField('year', e.target.value)}
          error={errors.year}
          disabled={isSubmitting}
          required
        />

        <GlassInput
          label="Daily Rental Rate (₹)"
          type="number"
          placeholder="3500"
          value={formData.dailyRate}
          onChange={(e) => updateField('dailyRate', e.target.value)}
          error={errors.dailyRate}
          disabled={isSubmitting}
          required
        />

        <GlassInput
          label="Seating Capacity"
          type="number"
          placeholder="5"
          value={formData.seats}
          onChange={(e) => updateField('seats', e.target.value)}
          error={errors.seats}
          disabled={isSubmitting}
          required
        />

        <div className="glass-select-group">
          <span>Transmission</span>
          <select
            value={formData.transmission}
            onChange={(e) => updateField('transmission', e.target.value)}
            disabled={isSubmitting}
          >
            {TRANSMISSIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="glass-select-group">
          <span>Fuel Type</span>
          <select
            value={formData.fuelType}
            onChange={(e) => updateField('fuelType', e.target.value)}
            disabled={isSubmitting}
          >
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Air Conditioning Checkbox */}
      <div className="form-checkbox-row">
        <label className="glass-checkbox-label">
          <input
            type="checkbox"
            checked={formData.airConditioning}
            onChange={(e) => updateField('airConditioning', e.target.checked)}
            disabled={isSubmitting}
          />
          <span>Air conditioning included in vehicle</span>
        </label>
      </div>

      {/* Description */}
      <div className="glass-input-group">
        <label htmlFor="vehicle-description">Vehicle Description & Features</label>
        <div className="glass-input-wrap">
          <textarea
            id="vehicle-description"
            rows={3}
            className="glass-textarea"
            placeholder="A brief overview of the vehicle's features, cabin comfort, and suitability."
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Image URL & Live Preview */}
      <div className="form-image-section">
        <GlassInput
          label="Vehicle Image URL (Optional)"
          placeholder="https://images.unsplash.com/... or leave blank for default visual"
          startIcon={ImageIcon}
          value={formData.image}
          onChange={(e) => updateField('image', e.target.value)}
          disabled={isSubmitting}
        />

        <div className="glass-input-group">
          <label htmlFor="vehicle-gallery">Gallery Image URLs (one per line)</label>
          <div className="glass-input-wrap"><textarea id="vehicle-gallery" rows={3} className="glass-textarea" placeholder="Optional licensed image URLs" value={formData.galleryUrls} onChange={(e) => updateField('galleryUrls', e.target.value)} disabled={isSubmitting} /></div>
        </div>

        <div className="image-preview-box">
          <p className="preview-heading">Image preview:</p>
          <div className="preview-card-wrap">
            {formData.image ? (
              <VehicleImage
                vehicle={{ name: formData.name || 'Vehicle', image: formData.image }}
                className="form-live-preview-image"
              />
            ) : (
              <div className="fallback-preview">
                <CarFront size={28} />
                <span>Default VAYRO fleet visual will be assigned</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="admin-pricing-section">
        <div><p className="eyebrow">Configurable demo rates</p><h3>Rental pricing</h3></div>
        <div className="admin-pricing-groups">
          {[['hourly', 'Hourly', HOURLY_OPTIONS], ['daily', 'Daily', DAILY_OPTIONS], ['longTerm', 'Long term', LONG_TERM_OPTIONS]].map(([type, label, options]) => (
            <div className="admin-pricing-group" key={type}>
              <strong>{label}</strong>
              <div className="admin-pricing-fields">{options.map((duration) => <label key={duration}><span>{type === 'hourly' ? `${duration}h` : `${duration}d`}</span><input type="number" min="0" value={formData.pricing[type]?.[duration] || ''} onChange={(e) => updatePricing(type, duration, e.target.value)} disabled={isSubmitting} /></label>)}</div>
            </div>
          ))}
          <div className="admin-pricing-group"><strong>Discount savings</strong><div className="admin-pricing-fields">{[7, 14, 21, 30].map((duration) => <label key={duration}><span>{duration}d save</span><input type="number" min="0" value={formData.pricing.discounts?.[duration] || ''} onChange={(e) => updatePricing('discounts', duration, e.target.value)} disabled={isSubmitting} /></label>)}</div></div>
        </div>
      </div>

      <div className="admin-live-preview"><div><p className="eyebrow">Live preview</p><h3>{formData.name || 'Vehicle name'}</h3><p>{formData.year} · {formData.type} · {formData.class}</p><strong>{formData.dailyRate ? `From ₹${Number(formData.dailyRate).toLocaleString('en-IN')}/day` : 'Add a daily rate'}</strong></div><VehicleImage vehicle={{ id: 'admin-preview', name: formData.name || 'Vehicle', image: formData.image }} className="admin-live-preview-image" /></div>

      <div className="form-submit-row">
        <GlassButton type="submit" loading={isSubmitting} className="form-save-btn">
          {submitLabel}
        </GlassButton>
      </div>
    </form>
  )
}
