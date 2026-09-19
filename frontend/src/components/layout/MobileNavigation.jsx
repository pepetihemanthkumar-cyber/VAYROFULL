import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { adminNavigation, customerNavigation } from '../../data/navigation'
import { useAuth } from '../../context/AuthContext'
import { Brand } from './Brand'
import { ProfileAvatar } from '../profile/ProfileAvatar'
import { cn } from '../../utils/cn'
import { backdropTransition, easing } from '../../animations/variants'

function MobileGroup({ group, onNavigate }) {
  return (
    <div className="mobile-nav-group">
      <p>{group.label}</p>
      {group.items.map(({ icon: Icon, label, to, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => cn('mobile-nav-link', isActive && 'is-active')} onClick={onNavigate}>
          <Icon size={19} strokeWidth={1.85} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  )
}

export function MobileNavigation({ isOpen, onToggle, onClose }) {
  const { user, role } = useAuth()

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <>
      <header className="mobile-header">
        <Brand variant="mobile" />
        <button className="mobile-menu-button" type="button" aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={isOpen} onClick={onToggle}>
          {isOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </header>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="mobile-menu-layer"
            variants={backdropTransition}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="mobile-menu-backdrop" onClick={onClose} />
            <motion.nav
              className="mobile-menu"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: easing }}
            >
              <NavLink to="/profile" className="mobile-user-profile-bar" onClick={onClose}>
                <ProfileAvatar user={user} size="sm" />
                <div className="mobile-user-meta">
                  <strong>{user?.name || 'Account'}</strong>
                  <small>{user?.role === 'ADMIN' ? 'Administrator' : 'Customer'}</small>
                </div>
              </NavLink>
              {customerNavigation.map((group) => <MobileGroup key={group.label} group={group} onNavigate={onClose} />)}
              {role === 'ADMIN' && <MobileGroup group={adminNavigation} onNavigate={onClose} />}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
