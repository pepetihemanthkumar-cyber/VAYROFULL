import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { adminNavigation, customerNavigation } from '../../data/navigation'
import { useAuth } from '../../context/AuthContext'
import { Brand } from './Brand'
import { cn } from '../../utils/cn'
import { smoothSpring } from '../../animations/variants'

function NavigationGroup({ group }) {
  return (
    <div className="sidebar-group">
      <p className="sidebar-group-label">{group.label}</p>
      <div className="sidebar-links">
        {group.items.map(({ icon: Icon, label, to, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cn('sidebar-link', isActive && 'is-active')}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    className="sidebar-active-pill"
                    layoutId="desktop-navigation-active"
                    transition={smoothSpring}
                  />
                )}
                <Icon size={18} strokeWidth={1.85} aria-hidden="true" />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}

export function Sidebar() {
  const { role } = useAuth()

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand"><Brand variant="sidebar" /></div>
      <nav aria-label="Main navigation" className="sidebar-navigation">
        {customerNavigation.map((group) => <NavigationGroup key={group.label} group={group} />)}
        {role === 'ADMIN' && <NavigationGroup group={adminNavigation} />}
      </nav>
      <p className="sidebar-footer">Fleet lifecycle, thoughtfully managed.</p>
    </aside>
  )
}
