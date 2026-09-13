import { useEffect, useRef, useState } from 'react'
import { Loader2, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GlassButton } from '../../components/ui/GlassButton'
import { GlassCard } from '../../components/ui/GlassCard'
import { GlassInput } from '../../components/ui/GlassInput'
import { AuthLayout } from '../../components/layout/AuthLayout'
import { useAuth } from '../../context/AuthContext'

const REMEMBER_ME_STORAGE_KEY = 'vayro_remembered_credentials'

/**
 * Local authentication helper for frontend mock architecture.
 * Persists remembered credentials in LocalStorage for automatic login.
 */
export function getRememberedCredentials() {
  try {
    const raw = localStorage.getItem(REMEMBER_ME_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.email && parsed.password) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function saveRememberedCredentials(credentials) {
  try {
    localStorage.setItem(
      REMEMBER_ME_STORAGE_KEY,
      JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        mode: credentials.mode || 'user',
        savedAt: new Date().toISOString(),
      })
    )
  } catch {
    // ignore storage errors
  }
}

export function clearRememberedCredentials() {
  try {
    localStorage.removeItem(REMEMBER_ME_STORAGE_KEY)
  } catch {
    // ignore storage errors
  }
}

function getValidReturnUrl(stateFrom, role) {
  let candidate = ''
  if (typeof stateFrom === 'string') {
    candidate = stateFrom
  } else if (stateFrom && typeof stateFrom === 'object') {
    candidate = (stateFrom.pathname || '') + (stateFrom.search || '') + (stateFrom.hash || '')
  }

  if (
    candidate &&
    candidate.startsWith('/') &&
    !candidate.startsWith('//') &&
    !candidate.startsWith('/login') &&
    !candidate.startsWith('/register') &&
    !candidate.startsWith('/404') &&
    candidate !== '/'
  ) {
    if (role !== 'ADMIN' && candidate.startsWith('/admin')) {
      return '/dashboard'
    }
    return candidate
  }

  return role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'
}

export default function LoginPage() {
  const initialSaved = getRememberedCredentials()
  const [loginMode, setLoginMode] = useState(() => initialSaved?.mode || 'user') // 'user' | 'admin'
  const [form, setForm] = useState(() => ({
    email: initialSaved?.email || '',
    password: initialSaved?.password || '',
  }))
  const [rememberMe, setRememberMe] = useState(Boolean(initialSaved))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAutoAuthenticating, setIsAutoAuthenticating] = useState(Boolean(initialSaved))
  
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const hasAttemptedAutoLogin = useRef(false)

  // Automatic login on page mount if Remember Me was previously enabled
  useEffect(() => {
    if (hasAttemptedAutoLogin.current) return
    const saved = getRememberedCredentials()

    if (saved) {
      hasAttemptedAutoLogin.current = true
      setIsAutoAuthenticating(true)
      
      login({ email: saved.email, password: saved.password })
        .then((user) => {
          const expectedRoleMode = saved.mode || 'user'
          const isRoleValid = expectedRoleMode === 'admin' ? user.role === 'ADMIN' : user.role !== 'ADMIN'

          if (!isRoleValid) {
            logout()
            clearRememberedCredentials()
            setRememberMe(false)
            setIsAutoAuthenticating(false)
            setFormError('Invalid credentials or account type.')
            return
          }

          const targetPath = getValidReturnUrl(location.state?.from, user.role)
          navigate(targetPath, { replace: true })
        })
        .catch(() => {
          clearRememberedCredentials()
          setRememberMe(false)
          setIsAutoAuthenticating(false)
          setFormError('Invalid credentials or account type.')
        })
    } else {
      setIsAutoAuthenticating(false)
    }
  }, [location.state?.from, login, logout, navigate])

  function handleModeChange(mode) {
    if (mode === loginMode) return
    setLoginMode(mode)
    setErrors({})
    setFormError('')
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email address.'
    if (!form.password) nextErrors.password = 'Enter your password.'
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)

    setIsSubmitting(true)
    try {
      const user = await login(form)

      // STRICT ROLE VALIDATION:
      // USER mode requires CUSTOMER role (user.role !== 'ADMIN')
      // ADMIN mode requires ADMIN role (user.role === 'ADMIN')
      const isRoleValid =
        loginMode === 'admin' ? user.role === 'ADMIN' : user.role !== 'ADMIN'

      if (!isRoleValid) {
        logout()
        setFormError('Invalid credentials or account type.')
        return
      }

      if (rememberMe && loginMode === 'user') {
        saveRememberedCredentials({ email: form.email, password: form.password, mode: loginMode })
      } else {
        clearRememberedCredentials()
      }

      const targetPath = getValidReturnUrl(location.state?.from, user.role)
      navigate(targetPath, { replace: true })
    } catch (error) {
      setFormError('Invalid credentials or account type.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAutoAuthenticating) {
    return (
      <AuthLayout
        eyebrow="Welcome back to VAYRO"
        title="Authenticating automatically..."
        description="Restoring your saved session credentials. Please wait a moment."
      >
        <GlassCard className="auth-card" as="section" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader2 className="animate-spin" size={36} style={{ color: '#e22718' }} />
            <p style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: '500' }}>
              Signing you in with remembered credentials...
            </p>
          </div>
        </GlassCard>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      eyebrow="WELCOME TO VAYRO"
      title={
        <>
          A CLEARER<br />
          VIEW OF<br />
          EVERY<br />
          <span className="text-accent-blue">JOURNEY.</span>
        </>
      }
      description="Sign in to manage the vehicles, bookings, and people that keep your fleet moving."
    >
      <GlassCard className="auth-card" as="section">
        <div className="auth-card-heading">
          <h2>{loginMode === 'admin' ? 'ADMIN SIGN IN' : 'SIGN IN'}</h2>
          
          <div className="auth-mode-selector" role="tablist" aria-label="Login Mode">
            <button
              type="button"
              role="tab"
              aria-selected={loginMode === 'user'}
              className={`auth-mode-btn ${loginMode === 'user' ? 'is-active' : ''}`}
              onClick={() => handleModeChange('user')}
            >
              <UserRound className="mode-icon" />
              <span>USER</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={loginMode === 'admin'}
              className={`auth-mode-btn ${loginMode === 'admin' ? 'is-active is-admin' : ''}`}
              onClick={() => handleModeChange('admin')}
            >
              <ShieldCheck className="mode-icon" />
              <span>ADMIN</span>
            </button>
          </div>

          <p>
            {loginMode === 'admin'
              ? 'Sign in to manage the VAYRO platform.'
              : 'Use your VAYRO account to continue.'}
          </p>
        </div>

        <motion.div
          key={loginMode}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <GlassInput
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={loginMode === 'admin' ? 'admin@company.com' : 'you@company.com'}
              startIcon={Mail}
              value={form.email}
              onChange={updateField}
              error={errors.email}
              disabled={isSubmitting}
            />
            <GlassInput
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              startIcon={LockKeyhole}
              value={form.password}
              onChange={updateField}
              error={errors.password}
              disabled={isSubmitting}
            />
            
            {loginMode === 'user' && (
              <div className="form-checkbox-row">
                <label className="glass-checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isSubmitting}
                    className="auth-checkbox-input"
                  />
                  <span>Remember me</span>
                </label>
              </div>
            )}

            {formError && <p className="form-alert" role="alert">{formError}</p>}
            <GlassButton type="submit" loading={isSubmitting} className="auth-submit">
              SIGN IN &nbsp;&rarr;
            </GlassButton>
          </form>
          <div className="auth-divider" />
          {loginMode === 'user' ? (
            <p className="auth-switch">
              New to VAYRO? <Link to="/register">Create an account.</Link>
            </p>
          ) : (
            <p className="auth-admin-note">
              Administrator access only
            </p>
          )}
        </motion.div>
      </GlassCard>
    </AuthLayout>
  )
}


