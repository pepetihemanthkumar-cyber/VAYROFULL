import { FileText, Mail, Phone, UserRound } from 'lucide-react'
import { GlassInput } from '../ui/GlassInput'

export function DriverDetailsForm({ values, errors = {}, onChange, disabled = false }) {
  function handleChange(event) {
    const { name, value } = event.target
    onChange({ ...values, [name]: value })
  }

  return (
    <div className="driver-form-grid">
      <GlassInput
        label="Full Name (as on Driving License)"
        name="fullName"
        type="text"
        placeholder="e.g. Aarav Mehta"
        startIcon={UserRound}
        value={values.fullName || ''}
        onChange={handleChange}
        error={errors.fullName}
        disabled={disabled}
        required
      />

      <GlassInput
        label="Email Address"
        name="email"
        type="email"
        placeholder="e.g. aarav.mehta@example.com"
        startIcon={Mail}
        value={values.email || ''}
        onChange={handleChange}
        error={errors.email}
        disabled={disabled}
        required
      />

      <GlassInput
        label="Phone Number"
        name="phone"
        type="tel"
        placeholder="e.g. +91 98765 43210"
        startIcon={Phone}
        value={values.phone || ''}
        onChange={handleChange}
        error={errors.phone}
        disabled={disabled}
        required
      />

      <GlassInput
        label="Driving License Number"
        name="licenseNumber"
        type="text"
        placeholder="e.g. MH01-2021-008492"
        startIcon={FileText}
        value={values.licenseNumber || ''}
        onChange={handleChange}
        error={errors.licenseNumber}
        disabled={disabled}
        required
      />
    </div>
  )
}
