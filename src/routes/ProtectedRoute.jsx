import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { RouteLoading } from '../components/common/RouteLoading'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, isInitializing, role } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return <RouteLoading />
  }

  if (!isAuthenticated) {
    const returnUrl = location.pathname + location.search + location.hash
    return <Navigate to="/login" replace state={{ from: returnUrl }} />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} replace />
  }

  return <Outlet />
}

