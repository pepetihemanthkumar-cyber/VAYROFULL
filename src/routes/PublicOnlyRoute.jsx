import { Navigate, Outlet } from 'react-router-dom'
import { RouteLoading } from '../components/common/RouteLoading'
import { useAuth } from '../context/AuthContext'

export function PublicOnlyRoute() {
  const { isAuthenticated, isInitializing, role } = useAuth()

  if (isInitializing) {
    return <RouteLoading />
  }

  if (isAuthenticated) {
    return <Navigate to={role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'} replace />
  }

  return <Outlet />
}

