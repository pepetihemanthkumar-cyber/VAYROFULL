import { useState } from 'react'
import { Mail, LockKeyhole, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlassButton } from '../../components/ui/GlassButton'
import { GlassCard } from '../../components/ui/GlassCard'
import { GlassInput } from '../../components/ui/GlassInput'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { useAuth } from '../../context/AuthContext'

const initialForm = { name: '', email: '', password: '', confirmPassword: '' }

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const { register } = useAuth()

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (form.name.trim().length < 2) nextErrors.name = 'Enter your full name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (form.password.length < 8) nextErrors.password = 'Use at least 8 characters.'
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)

    setIsSubmitting(true)
    try {
      await register(form)
      setIsComplete(true)
    } catch (error) {
      setFormError(error.message || 'We could not create your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout eyebrow="Welcome to VAYRO" title="A clearer view of every journey." description="Create your account to unlock fleet rentals and management.">
      <GlassCard className="auth-card" as="section">
        {isComplete ? (
          <div className="auth-success" role="status"><span className="success-mark">✓</span><h2>Your account is ready.</h2><p>Welcome to VAYRO. You can now enter your workspace.</p><GlassButton as={Link} to="/dashboard">Go to dashboard</GlassButton></div>
        ) : (
          <>
            <div className="auth-card-heading"><h2>Create account</h2><p>Begin with the details we need to set up your workspace.</p></div>
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <GlassInput label="Full name" name="name" autoComplete="name" placeholder="Your full name" startIcon={UserRound} value={form.name} onChange={updateField} error={errors.name} disabled={isSubmitting} />
              <GlassInput label="Email" name="email" type="email" autoComplete="email" placeholder="you@company.com" startIcon={Mail} value={form.email} onChange={updateField} error={errors.email} disabled={isSubmitting} />
              <GlassInput label="Password" name="password" type="password" autoComplete="new-password" placeholder="Create a password" startIcon={LockKeyhole} value={form.password} onChange={updateField} error={errors.password} disabled={isSubmitting} />
              <p className="password-requirement">Use at least 8 characters.</p>
              <GlassInput label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat your password" startIcon={LockKeyhole} value={form.confirmPassword} onChange={updateField} error={errors.confirmPassword} disabled={isSubmitting} />
              {formError && <p className="form-alert" role="alert">{formError}</p>}
              <GlassButton type="submit" loading={isSubmitting} className="auth-submit">Create account</GlassButton>
            </form>
            <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
          </>
        )}
      </GlassCard>
    </AuthLayout>
  )
}
