import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fadeUp } from '../../animations/variants'
import { VehicleForm } from '../../components/admin/VehicleForm'
import { GlassButton } from '../../components/ui/GlassButton'
import { GlassCard } from '../../components/ui/GlassCard'
import { createVehicle } from '../../services/vehicleService'

export default function AdminAddVehiclePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdVehicle, setCreatedVehicle] = useState(null)
  const [error, setError] = useState('')

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate('/admin/vehicles')
    }
  }

  async function handleCreateVehicle(formData) {
    setIsSubmitting(true)
    setError('')
    try {
      const created = await createVehicle(formData)
      setCreatedVehicle(created)
    } catch (err) {
      setError(err.message || 'Failed to add vehicle to fleet.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (createdVehicle) {
    return (
      <section className="admin-add-vehicle-page">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <GlassCard className="booking-confirmation-hero">
            <div className="confirmation-badge-wrap">
              <span className="confirmation-success-badge">
                <CheckCircle2 size={24} strokeWidth={2.4} aria-hidden="true" />
              </span>
            </div>

            <p className="eyebrow">Fleet Registration</p>
            <h2>Vehicle registered successfully.</h2>
            <p className="confirmation-subtitle">
              <strong>{createdVehicle.name}</strong> ({createdVehicle.registrationNumber}) is now active in the VAYRO fleet inventory.
            </p>

            <div className="confirmation-details-pill">
              <div className="detail-item">
                <small>Vehicle ID</small>
                <strong className="reference-code">{createdVehicle.id}</strong>
              </div>
              <div className="detail-divider" />
              <div className="detail-item">
                <small>Category</small>
                <strong>{createdVehicle.type}</strong>
              </div>
              <div className="detail-divider" />
              <div className="detail-item">
                <small>Initial Status</small>
                <strong>{createdVehicle.status}</strong>
              </div>
            </div>

            <div className="confirmation-actions">
              <GlassButton as={Link} to={`/admin/vehicles/${createdVehicle.id}`}>
                <Eye size={16} aria-hidden="true" /> View vehicle details
              </GlassButton>
              <GlassButton as={Link} to="/admin/vehicles" variant="secondary">
                Back to fleet
              </GlassButton>
              <GlassButton variant="ghost" onClick={() => setCreatedVehicle(null)}>
                <Plus size={16} aria-hidden="true" /> Add another
              </GlassButton>
            </div>
          </GlassCard>
        </motion.div>
      </section>
    )
  }

  return (
    <section className="admin-add-vehicle-page">
      <motion.div
        className="admin-form-header"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <div>
          <GlassButton onClick={handleBack} variant="ghost" size="sm" className="back-link">
            <ArrowLeft size={16} aria-hidden="true" /> Back to fleet
          </GlassButton>
          <h2>Add New Vehicle</h2>
          <p>Register a new asset and configure its pricing, technical specifications, and operational status.</p>
        </div>
      </motion.div>

      {error && (
        <div className="form-alert" role="alert">
          <AlertCircle size={17} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0.08}>
        <GlassCard className="admin-form-card">
          <VehicleForm
            onSubmit={handleCreateVehicle}
            isSubmitting={isSubmitting}
            submitLabel="Register vehicle into fleet"
          />
        </GlassCard>
      </motion.div>
    </section>
  )
}
