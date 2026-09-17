import { motion } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, Eye } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { fadeUp } from '../../animations/variants'
import { VehicleForm } from '../../components/admin/VehicleForm'
import { GlassBadge } from '../../components/ui/GlassBadge'
import { GlassButton } from '../../components/ui/GlassButton'
import { GlassCard } from '../../components/ui/GlassCard'
import { useToast } from '../../context/ToastContext'
import { fetchVehicleById, getVehicleById, updateVehicle } from '../../services/vehicleService'
import { formatStatus } from '../../utils/formatters'


export default function AdminEditVehiclePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [vehicle, setVehicle] = useState(() => getVehicleById(id))
  const [isLoading, setIsLoading] = useState(() => !getVehicleById(id))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [error, setError] = useState('')

  const handleBack = () => {
    if (location.key !== 'default') {
      navigate(-1)
    } else {
      navigate('/admin/vehicles')
    }
  }

  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)

    fetchVehicleById(id)
      .then((fetched) => {
        if (!isCancelled && fetched) {
          setVehicle(fetched)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setVehicle(getVehicleById(id))
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [id])

  async function handleUpdateVehicle(formData) {
    setIsSubmitting(true)
    setError('')
    try {
      const updated = await updateVehicle(id, formData)
      setVehicle(updated)
      toast.success('Vehicle specifications updated successfully.')
    } catch (err) {
      setError(err.message || 'Failed to update vehicle.')
      toast.error(err.message || 'Failed to update vehicle.')
    } finally {
      setIsSubmitting(false)
    }
  }


  if (isLoading) {
    return <div className="route-loading" aria-label="Loading vehicle specifications" />
  }

  if (!vehicle) {
    return (
      <section className="booking-missing">
        <GlassCard className="booking-missing-card">
          <h2>Vehicle not found</h2>
          <p>The vehicle requested for editing ({id}) does not exist in the fleet database.</p>
          <GlassButton as={Link} to="/admin/vehicles">Return to fleet</GlassButton>
        </GlassCard>
      </section>
    )
  }

  return (
    <section className="admin-edit-vehicle-page">
      <motion.div
        className="admin-form-header"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <div className="header-meta-wrap">
          <GlassButton onClick={handleBack} variant="ghost" size="sm" className="back-link">
            <ArrowLeft size={16} aria-hidden="true" /> Back to fleet
          </GlassButton>
          <div className="title-with-badge">
            <h2>Edit {vehicle.name}</h2>
            <GlassBadge status={vehicle.status}>{formatStatus(vehicle.status)}</GlassBadge>
          </div>
          <p>Update technical details, pricing, and cabin features for asset #{vehicle.id}.</p>
        </div>

        <div className="header-actions">
          <GlassButton as={Link} to={`/admin/vehicles/${vehicle.id}`} variant="secondary" size="sm">
            <Eye size={15} aria-hidden="true" /> View details
          </GlassButton>
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
            initialValues={vehicle}
            onSubmit={handleUpdateVehicle}
            isSubmitting={isSubmitting}
            submitLabel="Save changes"
          />
        </GlassCard>
      </motion.div>
    </section>
  )
}
