import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Heart,
  IdCard,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  Tv,
  UserCheck,
  UserRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fadeUp, smoothSpring, tabTransition } from '../animations/variants'
import { GlassBadge } from '../components/ui/GlassBadge'
import { GlassButton } from '../components/ui/GlassButton'
import { GlassCard } from '../components/ui/GlassCard'
import { GlassInput } from '../components/ui/GlassInput'
import { ProfileAvatar } from '../components/profile/ProfileAvatar'
import { VehicleImage } from '../components/vehicles/VehicleImage'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { getBookingsForCustomer } from '../services/bookingService'
import { getFavoriteVehicles } from '../services/vehicleService'
import { formatCurrency, formatDate, formatStatus } from '../utils/formatters'

function initials(name) {
  return (name || 'User')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function calculatePasswordStrength(pass) {
  if (!pass) return { score: 0, label: 'None', color: 'gray' }
  let score = 0
  if (pass.length >= 8) score += 1
  if (pass.length >= 12) score += 1
  if (/[A-Z]/.test(pass)) score += 1
  if (/[0-9]/.test(pass)) score += 1
  if (/[^A-Za-z0-9]/.test(pass)) score += 1

  if (score <= 2) return { score: 33, label: 'Weak', color: '#e57373' }
  if (score <= 4) return { score: 66, label: 'Good', color: '#ffb74d' }
  return { score: 100, label: 'Strong', color: '#81c784' }
}

const PREFERENCES_STORAGE_KEY = 'vayro_user_preferences'

function getSavedPreferences() {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    return raw
      ? JSON.parse(raw)
      : {
          emailConfirmations: true,
          tripReminders: true,
          promotions: false,
          smsAlerts: true,
        }
  } catch {
    return {
      emailConfirmations: true,
      tripReminders: true,
      promotions: false,
      smsAlerts: true,
    }
  }
}

function savePreferences(prefs) {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

export default function ProfilePage() {
  const { user, profilePhoto, updateProfile, changePassword, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('personal')
  const [personalForm, setPersonalForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '+91 98765 43210',
    address: user?.address || 'Mumbai, Maharashtra',
    licenseNumber: user?.licenseNumber || 'DL-2024-MH-84920',
  })
  const [personalErrors, setPersonalErrors] = useState({})
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const [preferences, setPreferences] = useState(getSavedPreferences)
  const [favorites, setFavorites] = useState(() => getFavoriteVehicles())

  // Lifetime metrics from user bookings
  const { stats, userBookings } = useMemo(() => {
    if (!user?.id) return { stats: { total: 0, active: 0, completed: 0, cancelled: 0, spend: 0, totalDays: 0 }, userBookings: [] }
    const bookings = getBookingsForCustomer(user.id)
    const active = bookings.filter((b) => b.status === 'ACTIVE').length
    const completed = bookings.filter((b) => b.status === 'COMPLETED').length
    const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length
    const spend = bookings.reduce((sum, b) => (b.status !== 'CANCELLED' ? sum + b.totalAmount : sum), 0)
    const totalDays = bookings.reduce((sum, b) => (b.status !== 'CANCELLED' ? sum + (b.rentalDays || 1) : sum), 0)
    return {
      stats: {
        total: bookings.length,
        active,
        completed,
        cancelled,
        spend,
        totalDays,
      },
      userBookings: bookings,
    }
  }, [user?.id])

  // Profile completion calculation
  const completionScore = useMemo(() => {
    let count = 0
    if (personalForm.name) count += 20
    if (personalForm.email) count += 20
    if (personalForm.phone) count += 20
    if (personalForm.address) count += 15
    if (personalForm.licenseNumber) count += 15
    if (profilePhoto) count += 10
    return Math.min(100, count)
  }, [personalForm, profilePhoto])

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(passwordForm.newPassword),
    [passwordForm.newPassword],
  )

  async function handleSavePersonal(e) {
    e.preventDefault()
    const nextErrors = {}
    if (!personalForm.name.trim() || personalForm.name.trim().length < 2) {
      nextErrors.name = 'Full name must be at least 2 characters.'
    }
    if (!personalForm.phone.trim() || personalForm.phone.trim().length < 8) {
      nextErrors.phone = 'Please enter a valid phone number.'
    }
    if (Object.keys(nextErrors).length > 0) {
      setPersonalErrors(nextErrors)
      return
    }

    setIsSavingProfile(true)
    setProfileSuccess('')
    try {
      await updateProfile({
        name: personalForm.name,
        phone: personalForm.phone,
        address: personalForm.address,
        licenseNumber: personalForm.licenseNumber,
      })
      setProfileSuccess('Profile details saved successfully.')
      toast.success('Profile details saved successfully.')
    } catch (err) {
      setPersonalErrors({ general: err.message || 'Failed to update profile.' })
      toast.error(err.message || 'Failed to update profile.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  function handleCancelPersonal() {
    setPersonalForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '+91 98765 43210',
      address: user?.address || 'Mumbai, Maharashtra',
      licenseNumber: user?.licenseNumber || 'DL-2024-MH-84920',
    })
    setPersonalErrors({})
    setProfileSuccess('')
  }

  async function handleSavePassword(e) {
    e.preventDefault()
    const nextErrors = {}
    if (!passwordForm.currentPassword) {
      nextErrors.currentPassword = 'Enter your current password.'
    }
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 8) {
      nextErrors.newPassword = 'New password must be at least 8 characters.'
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }
    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors)
      return
    }

    setIsSavingPassword(true)
    setPasswordMessage(null)
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' })
      toast.success('Password updated successfully.')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordErrors({})
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message || 'Failed to change password.' })
      toast.error(err.message || 'Failed to change password.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  function handleTogglePreference(key) {
    const next = { ...preferences, [key]: !preferences[key] }
    setPreferences(next)
    savePreferences(next)
    toast.success('Preferences updated.')
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <section className="profile-page">
      {/* Profile Overview Hero Banner */}
      <motion.div
        className="profile-hero-card-wrap"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <GlassCard className="profile-hero-card">
          <div className="profile-hero-layout">
            <div className="profile-identity">
              <ProfileAvatar user={user} size="xl" editable ariaLabel="Your personal profile photo (click to change or remove)" />
              <div className="profile-identity-info">
                <div className="profile-identity-title">
                  <h2>{user?.name || 'Customer Account'}</h2>
                  <GlassBadge status="info">
                    {user?.role === 'ADMIN' ? 'Administrator' : 'Verified Customer'}
                  </GlassBadge>
                </div>
                <p className="profile-email-meta">{user?.email}</p>
                <div className="profile-meta-badges">
                  <span>Member since Aug 2026</span>
                  <span>•</span>
                  <span>Verified Identity Tier</span>
                </div>
              </div>
            </div>

            {/* Profile Completion Indicator */}
            <div className="profile-completion-card">
              <div className="completion-header">
                <small>Profile completion</small>
                <strong>{completionScore}%</strong>
              </div>
              <div className="completion-bar-track" role="progressbar" aria-valuenow={completionScore} aria-valuemin={0} aria-valuemax={100}>
                <motion.div
                  className="completion-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionScore}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <p className="completion-hint">
                {completionScore === 100
                  ? 'Your account is fully verified for priority checkouts.'
                  : 'Complete contact and driving license to speed up pickup.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="profile-stats-bar">
            <div className="stat-box">
              <small>Total bookings</small>
              <strong>{stats.total}</strong>
            </div>
            <div className="stat-box">
              <small>Active rentals</small>
              <strong>{stats.active}</strong>
            </div>
            <div className="stat-box">
              <small>Completed trips</small>
              <strong>{stats.completed}</strong>
            </div>
            <div className="stat-box">
              <small>Rental days</small>
              <strong>{stats.totalDays}</strong>
            </div>
            <div className="stat-box">
              <small>Lifetime spend</small>
              <strong>{formatCurrency(stats.spend)}</strong>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        className="profile-tabs-wrap"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0.06}
      >
        <div className="profile-tabs-container" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'personal'}
            className={`profile-tab-button ${activeTab === 'personal' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            {activeTab === 'personal' && (
              <motion.span
                className="profile-tab-active-pill"
                layoutId="profile-tab-active"
                transition={smoothSpring}
              />
            )}
            <UserRound size={15} aria-hidden="true" />
            <span>Personal details</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'security'}
            className={`profile-tab-button ${activeTab === 'security' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            {activeTab === 'security' && (
              <motion.span
                className="profile-tab-active-pill"
                layoutId="profile-tab-active"
                transition={smoothSpring}
              />
            )}
            <ShieldCheck size={15} aria-hidden="true" />
            <span>Security & password</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'activity'}
            className={`profile-tab-button ${activeTab === 'activity' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            {activeTab === 'activity' && (
              <motion.span
                className="profile-tab-active-pill"
                layoutId="profile-tab-active"
                transition={smoothSpring}
              />
            )}
            <CalendarDays size={15} aria-hidden="true" />
            <span>Rental history</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'favorites'}
            className={`profile-tab-button ${activeTab === 'favorites' ? 'is-active' : ''}`}
            onClick={() => {
              setFavorites(getFavoriteVehicles())
              setActiveTab('favorites')
            }}
          >
            {activeTab === 'favorites' && (
              <motion.span
                className="profile-tab-active-pill"
                layoutId="profile-tab-active"
                transition={smoothSpring}
              />
            )}
            <Heart size={15} aria-hidden="true" />
            <span>Saved fleet ({favorites.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'preferences'}
            className={`profile-tab-button ${activeTab === 'preferences' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            {activeTab === 'preferences' && (
              <motion.span
                className="profile-tab-active-pill"
                layoutId="profile-tab-active"
                transition={smoothSpring}
              />
            )}
            <Bell size={15} aria-hidden="true" />
            <span>Preferences</span>
          </button>
        </div>
      </motion.div>

      {/* Tab Content Panels */}
      <motion.div
        className="profile-tab-content"
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0.1}
      >
        <AnimatePresence mode="wait">
          {/* TAB 1: Personal Details */}
          {activeTab === 'personal' && (
            <motion.div
              key="tab-personal"
              variants={tabTransition}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <GlassCard className="profile-form-card">
                <div className="form-card-header">
                  <div>
                    <p className="eyebrow">Contact & Identification</p>
                    <h3>Personal information</h3>
                  </div>
                  <UserCheck size={20} className="form-header-icon" aria-hidden="true" />
                </div>

                {profileSuccess && (
                  <div className="details-toast details-toast--success" role="status">
                    <CheckCircle2 size={18} aria-hidden="true" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {personalErrors.general && (
                  <div className="form-alert" role="alert">
                    <AlertCircle size={17} aria-hidden="true" />
                    <span>{personalErrors.general}</span>
                  </div>
                )}

                <form className="profile-edit-form" onSubmit={handleSavePersonal} noValidate>
                  <div className="profile-form-grid">
                    <GlassInput
                      label="Full Name"
                      name="name"
                      startIcon={UserRound}
                      value={personalForm.name}
                      onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                      error={personalErrors.name}
                      disabled={isSavingProfile}
                    />

                    <GlassInput
                      label="Email Address"
                      name="email"
                      type="email"
                      startIcon={Mail}
                      value={personalForm.email}
                      disabled
                      title="Email address is tied to your login identity"
                    />

                    <GlassInput
                      label="Phone Number"
                      name="phone"
                      type="tel"
                      startIcon={Phone}
                      value={personalForm.phone}
                      onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                      error={personalErrors.phone}
                      disabled={isSavingProfile}
                    />

                    <GlassInput
                      label="City / Location"
                      name="address"
                      startIcon={MapPin}
                      value={personalForm.address}
                      onChange={(e) =>
                        setPersonalForm({ ...personalForm, address: e.target.value })
                      }
                      disabled={isSavingProfile}
                    />

                    <GlassInput
                      label="Driving License / ID"
                      name="licenseNumber"
                      startIcon={IdCard}
                      value={personalForm.licenseNumber}
                      onChange={(e) =>
                        setPersonalForm({ ...personalForm, licenseNumber: e.target.value })
                      }
                      disabled={isSavingProfile}
                      placeholder="e.g. DL-2024-MH-84920"
                    />
                  </div>

                  <div className="profile-actions-bar">
                    <GlassButton type="submit" loading={isSavingProfile}>
                      Save changes
                    </GlassButton>
                    <GlassButton
                      type="button"
                      variant="ghost"
                      onClick={handleCancelPersonal}
                      disabled={isSavingProfile}
                    >
                      Reset
                    </GlassButton>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          )}

          {/* TAB 2: Security & Password */}
          {activeTab === 'security' && (
            <motion.div
              key="tab-security"
              variants={tabTransition}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <GlassCard className="profile-form-card">
                <div className="form-card-header">
                  <div>
                    <p className="eyebrow">Authentication & Credentials</p>
                    <h3>Change password</h3>
                  </div>
                  <KeyRound size={20} className="form-header-icon" aria-hidden="true" />
                </div>

                {passwordMessage && (
                  <div
                    className={`details-toast details-toast--${passwordMessage.type}`}
                    role="status"
                  >
                    {passwordMessage.type === 'success' ? (
                      <CheckCircle2 size={18} aria-hidden="true" />
                    ) : (
                      <AlertCircle size={18} aria-hidden="true" />
                    )}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <form className="profile-edit-form" onSubmit={handleSavePassword} noValidate>
                  <div className="password-form-stack">
                    <div className="password-input-wrap">
                      <GlassInput
                        label="Current Password"
                        name="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        startIcon={LockKeyhole}
                        placeholder="Enter current password"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                        }
                        error={passwordErrors.currentPassword}
                        disabled={isSavingPassword}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div className="password-input-wrap">
                      <GlassInput
                        label="New Password"
                        name="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        startIcon={LockKeyhole}
                        placeholder="At least 8 characters"
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                        }
                        error={passwordErrors.newPassword}
                        disabled={isSavingPassword}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {passwordForm.newPassword && (
                      <div className="password-strength-container">
                        <div className="password-strength-header">
                          <small>Password strength:</small>
                          <strong style={{ color: passwordStrength.color }}>
                            {passwordStrength.label}
                          </strong>
                        </div>
                        <div className="password-strength-track">
                          <div
                            className="password-strength-bar"
                            style={{
                              width: `${passwordStrength.score}%`,
                              backgroundColor: passwordStrength.color,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <GlassInput
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      startIcon={LockKeyhole}
                      placeholder="Repeat new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      error={passwordErrors.confirmPassword}
                      disabled={isSavingPassword}
                    />
                  </div>

                  <div className="profile-actions-bar">
                    <GlassButton type="submit" loading={isSavingPassword}>
                      Update password
                    </GlassButton>
                  </div>
                </form>
              </GlassCard>

              {/* Active Session Card */}
              <GlassCard className="profile-session-card">
                <div>
                  <h4>Current session</h4>
                  <p>Authenticated on this browser · Secure HTTPS environment</p>
                </div>
                <GlassBadge status="success">Active now</GlassBadge>
              </GlassCard>
            </motion.div>
          )}

          {/* TAB 3: Rental History / Activity */}
          {activeTab === 'activity' && (
            <motion.div
              key="tab-activity"
              variants={tabTransition}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <GlassCard className="profile-form-card">
                <div className="form-card-header">
                  <div>
                    <p className="eyebrow">Journey records</p>
                    <h3>Rental history & activity</h3>
                  </div>
                  <CalendarDays size={20} className="form-header-icon" aria-hidden="true" />
                </div>

                {userBookings.length > 0 ? (
                  <div className="profile-booking-list">
                    {userBookings.map((b) => (
                      <div key={b.id} className="profile-booking-row">
                        <div className="booking-row-icon">
                          <CarFront size={18} aria-hidden="true" />
                        </div>
                        <div className="booking-row-info">
                          <strong>{b.vehicle?.name || b.vehicleId}</strong>
                          <p>
                            {formatDate(b.pickupDate, { day: 'numeric', month: 'short' })} →{' '}
                            {formatDate(b.returnDate, { day: 'numeric', month: 'short', year: 'numeric' })} ·{' '}
                            {b.rentalDays || 1} {b.rentalDays === 1 ? 'day' : 'days'}
                          </p>
                        </div>
                        <div className="booking-row-status">
                          <GlassBadge status={b.status}>{formatStatus(b.status)}</GlassBadge>
                          <strong>{formatCurrency(b.totalAmount)}</strong>
                        </div>
                        <GlassButton
                          as={Link}
                          to={`/bookings/${b.id}`}
                          variant="ghost"
                          size="sm"
                          className="booking-row-action"
                        >
                          Details <ArrowRight size={14} aria-hidden="true" />
                        </GlassButton>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-empty-tab">
                    <CalendarDays size={28} strokeWidth={1.5} />
                    <h4>No rental bookings yet</h4>
                    <p>When you book a vehicle, your full history and receipts will be recorded here.</p>
                    <GlassButton as={Link} to="/vehicles" size="sm">
                      Browse vehicles
                    </GlassButton>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* TAB 4: Saved Fleet / Favorites */}
          {activeTab === 'favorites' && (
            <motion.div
              key="tab-favorites"
              variants={tabTransition}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <GlassCard className="profile-form-card">
                <div className="form-card-header">
                  <div>
                    <p className="eyebrow">Your Shortlist</p>
                    <h3>Saved fleet vehicles</h3>
                  </div>
                  <Heart size={20} className="form-header-icon" aria-hidden="true" />
                </div>

                {favorites.length > 0 ? (
                  <div className="profile-favorites-grid">
                    {favorites.map((v) => (
                      <div key={v.id} className="profile-fav-card">
                        <VehicleImage vehicle={v} className="profile-fav-image" />
                        <div className="profile-fav-info">
                          <h4>{v.name}</h4>
                          <p>{v.brand} · {v.category || v.type}</p>
                          <div className="profile-fav-footer">
                            <span>
                              From <strong>{formatCurrency(v.dailyRate)}</strong>/day
                            </span>
                            <GlassButton as={Link} to={`/vehicles/${v.id}`} size="sm" variant="secondary">
                              View <ArrowRight size={14} aria-hidden="true" />
                            </GlassButton>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="profile-empty-tab">
                    <Heart size={28} strokeWidth={1.5} />
                    <h4>No saved vehicles yet</h4>
                    <p>Click the heart icon on any vehicle card to save it to your personal shortlist.</p>
                    <GlassButton as={Link} to="/vehicles" size="sm">
                      Explore fleet
                    </GlassButton>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* TAB 5: Preferences */}
          {activeTab === 'preferences' && (
            <motion.div
              key="tab-preferences"
              variants={tabTransition}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <GlassCard className="profile-form-card">
                <div className="form-card-header">
                  <div>
                    <p className="eyebrow">Notifications & Communication</p>
                    <h3>Account preferences</h3>
                  </div>
                  <Bell size={20} className="form-header-icon" aria-hidden="true" />
                </div>

                <div className="profile-preferences-list">
                  <div className="preference-row">
                    <div>
                      <strong>Email booking confirmations</strong>
                      <p>Receive immediate reservation vouchers and receipts in your inbox.</p>
                    </div>
                    <button
                      type="button"
                      className={`preference-toggle ${preferences.emailConfirmations ? 'is-enabled' : ''}`}
                      onClick={() => handleTogglePreference('emailConfirmations')}
                      aria-pressed={preferences.emailConfirmations}
                      aria-label="Toggle email booking confirmations"
                    >
                      <span className="preference-toggle-thumb" />
                    </button>
                  </div>

                  <div className="preference-row">
                    <div>
                      <strong>Trip & return reminders</strong>
                      <p>Receive timely pickup reminders and vehicle return instructions.</p>
                    </div>
                    <button
                      type="button"
                      className={`preference-toggle ${preferences.tripReminders ? 'is-enabled' : ''}`}
                      onClick={() => handleTogglePreference('tripReminders')}
                      aria-pressed={preferences.tripReminders}
                      aria-label="Toggle trip reminders"
                    >
                      <span className="preference-toggle-thumb" />
                    </button>
                  </div>

                  <div className="preference-row">
                    <div>
                      <strong>SMS alerts & updates</strong>
                      <p>Receive quick SMS notifications about vehicle availability and security updates.</p>
                    </div>
                    <button
                      type="button"
                      className={`preference-toggle ${preferences.smsAlerts ? 'is-enabled' : ''}`}
                      onClick={() => handleTogglePreference('smsAlerts')}
                      aria-pressed={preferences.smsAlerts}
                      aria-label="Toggle SMS alerts"
                    >
                      <span className="preference-toggle-thumb" />
                    </button>
                  </div>

                  <div className="preference-row">
                    <div>
                      <strong>Fleet updates & promotional offers</strong>
                      <p>Get notified when new luxury or electric models join the VAYRO fleet.</p>
                    </div>
                    <button
                      type="button"
                      className={`preference-toggle ${preferences.promotions ? 'is-enabled' : ''}`}
                      onClick={() => handleTogglePreference('promotions')}
                      aria-pressed={preferences.promotions}
                      aria-label="Toggle promotional offers"
                    >
                      <span className="preference-toggle-thumb" />
                    </button>
                  </div>
                </div>
              </GlassCard>

              {/* Theme & Display Mode */}
              <GlassCard className="profile-form-card" style={{ marginTop: 'var(--space-6)' }}>
                <div className="form-card-header">
                  <div>
                    <p className="eyebrow">Interface & Styling</p>
                    <h3>Appearance Mode</h3>
                  </div>
                  <Moon size={20} className="form-header-icon" aria-hidden="true" />
                </div>

                <div className="theme-options-grid" role="radiogroup" aria-label="Appearance Mode">
                  <div
                    role="radio"
                    aria-checked={theme === 'dark'}
                    tabIndex={0}
                    className={`theme-option-card ${theme === 'dark' ? 'is-active' : ''}`}
                    onClick={() => setTheme('dark')}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') setTheme('dark')
                    }}
                  >
                    <Moon size={22} className="theme-option-icon" aria-hidden="true" />
                    <strong>Liquid Dark</strong>
                    <small>Default high-contrast dark aesthetic</small>
                  </div>

                  <div
                    role="radio"
                    aria-checked={theme === 'light'}
                    tabIndex={0}
                    className={`theme-option-card ${theme === 'light' ? 'is-active' : ''}`}
                    onClick={() => setTheme('light')}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') setTheme('light')
                    }}
                  >
                    <Sun size={22} className="theme-option-icon" aria-hidden="true" />
                    <strong>Frosted Light</strong>
                    <small>Clean daytime glass aesthetic</small>
                  </div>

                  <div
                    role="radio"
                    aria-checked={theme === 'system'}
                    tabIndex={0}
                    className={`theme-option-card ${theme === 'system' ? 'is-active' : ''}`}
                    onClick={() => setTheme('system')}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') setTheme('system')
                    }}
                  >
                    <Tv size={22} className="theme-option-icon" aria-hidden="true" />
                    <strong>System Sync</strong>
                    <small>Matches device OS display setting</small>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Account Actions Card */}
        <GlassCard className="profile-session-card">
          <div>
            <h4>Account session</h4>
            <p>Signed in as <strong>{user?.email}</strong>. End your session on this device anytime.</p>
          </div>
          <GlassButton variant="ghost" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" /> Sign out
          </GlassButton>
        </GlassCard>
      </motion.div>
    </section>
  )
}

