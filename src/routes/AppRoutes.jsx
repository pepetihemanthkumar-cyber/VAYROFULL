import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'

import AdminAddVehiclePage from '../pages/admin/AdminAddVehiclePage'
import AdminBookingDetailsPage from '../pages/admin/AdminBookingDetailsPage'
import AdminBookingsPage from '../pages/admin/AdminBookingsPage'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import AdminEditVehiclePage from '../pages/admin/AdminEditVehiclePage'
import AdminUserDetailsPage from '../pages/admin/AdminUserDetailsPage'
import AdminUsersPage from '../pages/admin/AdminUsersPage'
import AdminVehicleDetailsPage from '../pages/admin/AdminVehicleDetailsPage'
import AdminVehiclesPage from '../pages/admin/AdminVehiclesPage'
import BookingDetailsPage from '../pages/BookingDetailsPage'
import BookingsPage from '../pages/BookingsPage'
import DashboardPage from '../pages/DashboardPage'
import NewBookingPage from '../pages/NewBookingPage'
import NotFoundPage from '../pages/NotFoundPage'
import HelpPage from '../pages/HelpPage'
import ProfilePage from '../pages/ProfilePage'
import VehicleDetailsPage from '../pages/VehicleDetailsPage'
import VehiclesPage from '../pages/VehiclesPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import HomePage from '../pages/HomePage'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<AppLayout />}>
        {/* Public Vehicle & Help Browsing */}
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetailsPage />} />
        <Route path="/cars" element={<VehiclesPage />} />
        <Route path="/cars/:id" element={<VehicleDetailsPage />} />
        <Route path="/bikes" element={<VehiclesPage />} />
        <Route path="/bikes/:id" element={<VehicleDetailsPage />} />
        <Route path="/help" element={<HelpPage />} />

        {/* Authenticated Customer Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/bookings/new" element={<NewBookingPage />} />
          <Route path="/bookings/:id" element={<BookingDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/vehicles" element={<AdminVehiclesPage />} />
            <Route path="/admin/vehicles/new" element={<AdminAddVehiclePage />} />
            <Route path="/admin/vehicles/:id" element={<AdminVehicleDetailsPage />} />
            <Route path="/admin/vehicles/:id/edit" element={<AdminEditVehiclePage />} />
            <Route path="/admin/fleet" element={<AdminVehiclesPage />} />
            <Route path="/admin/fleet/new" element={<AdminAddVehiclePage />} />
            <Route path="/admin/fleet/:id" element={<AdminVehicleDetailsPage />} />
            <Route path="/admin/fleet/:id/edit" element={<AdminEditVehiclePage />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            <Route path="/admin/bookings/:id" element={<AdminBookingDetailsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
