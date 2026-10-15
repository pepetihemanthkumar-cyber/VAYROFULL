import { api } from './api'
import { mapUserResponse } from './authService'

/**
 * Admin: Get all users: GET /api/users
 */
export async function getUsers(params = {}) {
  const response = await api.get('/api/users', { params })
  const data = response.data
  const list = Array.isArray(data) ? data : (data.content || [])
  return list.map(mapUserResponse)
}

/**
 * Get user by ID: GET /api/users/{id}
 */
export async function getUserById(id) {
  const response = await api.get(`/api/users/${id}`)
  return mapUserResponse(response.data)
}

/**
 * Admin: Update user account status: PATCH /api/users/{id}/status
 */
export async function updateUserStatus(id, status) {
  const response = await api.patch(`/api/users/${id}/status`, { status })
  return mapUserResponse(response.data)
}

/**
 * Authenticated Customer: Update personal profile fields: PUT /api/users/me
 */
export async function updateCurrentUserProfile({ firstName, lastName, phone }) {
  const response = await api.put('/api/users/me', { firstName, lastName, phone })
  return mapUserResponse(response.data)
}

/**
 * Authenticated Customer: Change account password: PUT /api/users/password
 */
export async function changePassword({ currentPassword, newPassword }) {
  const response = await api.put('/api/users/password', { currentPassword, newPassword })
  return response.data
}
