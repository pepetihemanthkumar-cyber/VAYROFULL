import { Link } from 'react-router-dom'
import vayroLogo from '../../assets/branding/vayro-logo.jpg'
import { useAuth } from '../../context/AuthContext'
import { cn } from '../../utils/cn'

export function Brand({ className, to, size = 'md', variant, collapsed = false }) {
  const auth = useAuth()
  const isAuthenticated = auth?.isAuthenticated ?? false
  const role = auth?.role

  const computedDestination = isAuthenticated
    ? (role === 'ADMIN' || role === 'admin' ? '/admin/dashboard' : '/dashboard')
    : '/login'

  const destination = to ?? computedDestination

  const ariaLabel = isAuthenticated
    ? (role === 'ADMIN' || role === 'admin' ? 'VAYRO — Admin Dashboard' : 'VAYRO — Go to Dashboard')
    : 'VAYRO — Go to Dashboard'

  const variantClass = variant ? `brand--variant-${variant}` : `brand--${size}`

  return (
    <Link
      to={destination}
      className={cn('brand', variantClass, collapsed && 'brand--collapsed', className)}
      aria-label={ariaLabel}
    >
      <img
        src={vayroLogo}
        alt="VAYRO"
        className="brand-logo-img"
        loading="eager"
      />
    </Link>
  )
}

