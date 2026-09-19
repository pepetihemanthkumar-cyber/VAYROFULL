import { api } from './api'
import { mapUserResponse } from './authService'

/**
 * Admin: Get all users: GET /api/users
 */
export async function getUsers() {
  const response = await api.get('/api/users')
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
 * Admin: Update user status
 */
export async function updateUserStatus(id, status) {
  return { id, status }
}
