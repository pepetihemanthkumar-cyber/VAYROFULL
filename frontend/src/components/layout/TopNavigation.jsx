import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Bell,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { dropdownTransition } from '../../animations/variants'
import { useAuth } from '../../context/AuthContext'
import { getPageContext } from '../../data/navigation'
import { getStoredActivities, getUpcomingBookings } from '../../services/bookingService'
import { ProfileAvatar } from '../profile/ProfileAvatar'

const NOTIFICATIONS_STORAGE_KEY = 'vayro_read_notifications'

function getReadNotificationIds() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveReadNotificationIds(ids) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // ignore
  }
}

const notificationIcons = {
  confirmed: CheckCircle2,
  returned: RotateCcw,
  cancelled: AlertCircle,
  upcoming: CalendarClock,
  security: ShieldCheck,
  system: Sparkles,
}

export function TopNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [readIds, setReadIds] = useState(getReadNotificationIds)
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { title, section } = getPageContext(pathname)

  const notifRef = useRef(null)
  const userMenuRef = useRef(null)

  const notifications = useMemo(() => {
    const upcoming = getUpcomingBookings(user?.id || '').slice(0, 2).map((booking) => ({
      id: `upcoming-${booking.id}`,
      type: 'upcoming',
      title: booking.vehicle?.name ? `Upcoming: ${booking.vehicle.name}` : 'Upcoming rental',
      detail: `${booking.rentalDays} days rental · Confirmed reservation`,
      time: 'In 2 days',
    }))

    const activity = getStoredActivities().slice(0, 4).map((activityItem) => ({
      id: activityItem.id,
      type: activityItem.type || 'system',
      title: activityItem.title,
      detail: activityItem.detail,
      time: activityItem.occurredAt,
    }))

    const securityNotif = {
      id: 'sec-verified',
      type: 'security',
      title: 'Profile verified',
      detail: 'Standard identity tier is fully active',
      time: '1d ago',
    }

    return [...upcoming, ...activity, securityNotif]
  }, [user?.id])

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !readIds.includes(n.id)).length
  }, [notifications, readIds])

  // Click outside and ESC handlers
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsNotificationsOpen(false)
        setIsMenuOpen(false)
      }
    }

    function handlePointerDown(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotificationsOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  function toggleNotificationRead(id) {
    const next = readIds.includes(id) ? readIds.filter((item) => item !== id) : [...readIds, id]
    setReadIds(next)
    saveReadNotificationIds(next)
  }

  function handleMarkAllRead() {
    const allIds = notifications.map((n) => n.id)
    setReadIds(allIds)
    saveReadNotificationIds(allIds)
  }

  function handleLogout() {
    setIsMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="top-navigation">
      <div className="page-context">
        <p>{section}</p>
        <h1>{title}</h1>
      </div>
      <div className="top-navigation-actions">
        {/* Notifications Dropdown */}
        <div className="notification-menu-wrap" ref={notifRef}>
          <button
            className={`notification-button ${unreadCount > 0 ? 'has-unread' : ''}`}
            type="button"
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
            aria-haspopup="true"
            aria-expanded={isNotificationsOpen}
            title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
            onClick={() => setIsNotificationsOpen((open) => !open)}
          >
            <Bell size={18} strokeWidth={1.8} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="notification-badge" aria-hidden="true">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <motion.div
                className="notification-dropdown"
                role="dialog"
                aria-label="Notification Center"
                variants={dropdownTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="notification-header">
                  <div>
                    <strong>Notifications</strong>
                    <span className="notification-counter">{unreadCount} unread</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notification-mark-all-btn"
                      onClick={handleMarkAllRead}
                    >
                      <CheckCheck size={14} aria-hidden="true" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications.map((item) => {
                      const isRead = readIds.includes(item.id)
                      const Icon = notificationIcons[item.type] || Bell
                      return (
                        <div
                          key={item.id}
                          className={`notification-item notification-item--${item.type} ${isRead ? 'is-read' : 'is-unread'}`}
                          onClick={() => toggleNotificationRead(item.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              toggleNotificationRead(item.id)
                            }
                          }}
                          aria-label={`${item.title} · ${item.detail} (${isRead ? 'Read' : 'Unread'})`}
                        >
                          <span className={`notification-item-icon notification-item-icon--${item.type}`}>
                            <Icon size={14} aria-hidden="true" />
                          </span>
                          <div className="notification-copy">
                            <strong>{item.title}</strong>
                            <span>{item.detail}</span>
                          </div>
                          <time>{item.time}</time>
                        </div>
                      )
                    })
                  ) : (
                    <div className="notification-empty">All caught up! No notifications yet.</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="user-menu" ref={userMenuRef}>
          <button
            className="user-menu-trigger"
            type="button"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <ProfileAvatar user={user} size="sm" />
            <span className="user-menu-copy">
              <strong>{user?.name || 'Account'}</strong>
              <small>{user?.role === 'ADMIN' ? 'Administrator' : 'Customer'}</small>
            </span>
            <ChevronDown className={isMenuOpen ? 'chevron-open' : undefined} size={15} aria-hidden="true" />
          </button>
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                className="user-dropdown"
                role="menu"
                variants={dropdownTransition}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Link
                  to="/profile"
                  role="menuitem"
                  className="user-dropdown-item"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserRound size={15} aria-hidden="true" /> Account profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="user-dropdown-item user-dropdown-item--logout"
                  onClick={handleLogout}
                >
                  <LogOut size={15} aria-hidden="true" /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

