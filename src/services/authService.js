import { api } from './api'

export const SESSION_KEY = 'vayro_session'

export function mapUserResponse(user) {
  if (!user) return null
  const firstName = user.firstName || ''
  const lastName = user.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim() || user.name || user.email

  return {
    id: user.id,
    firstName,
    lastName,
    name: fullName,
    email: user.email,
    phone: user.phone || '',
    role: user.role || 'USER',
    status: user.status || 'ACTIVE',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    joinedAt: user.createdAt ? String(user.createdAt).slice(0, 10) : '2026-01-01',
  }
}

/**
 * Real backend login via API Gateway: POST /api/auth/login
 */
export async function login({ email, password }) {
  const normalizedEmail = (email || '').trim().toLowerCase()
  const response = await api.post('/api/auth/login', {
    email: normalizedEmail,
    password,
  })

  const { token, user } = response.data
  return {
    token,
    user: mapUserResponse(user),
  }
}

/**
 * Real backend registration via API Gateway: POST /api/auth/register
 */
export async function register({ name, firstName, lastName, email, password, phone }) {
  const normalizedEmail = (email || '').trim().toLowerCase()
  let fName = firstName
  let lName = lastName

  if (!fName && name) {
    const parts = name.trim().split(/\s+/)
    fName = parts[0] || 'User'
    lName = parts.slice(1).join(' ') || parts[0] || 'Member'
  }

  const response = await api.post('/api/auth/register', {
    firstName: fName || 'User',
    lastName: lName || 'Member',
    email: normalizedEmail,
    password,
    phone: phone || '+91 98765 43210',
  })

  const { token, user } = response.data
  return {
    token,
    user: mapUserResponse(user),
  }
}

/**
 * Real backend authenticated user check via API Gateway: GET /api/users/me
 */
export async function getCurrentUser() {
  const response = await api.get('/api/users/me')
  return mapUserResponse(response.data)
}

/**
 * Session clearing for logout
 */
export function logout() {
  try {
    window.localStorage.removeItem(SESSION_KEY)
  } catch {}
}
