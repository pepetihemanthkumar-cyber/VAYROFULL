import axios from 'axios'
import { SESSION_KEY } from './authService'

// Configured base URL for Spring Boot API Gateway (Port 8080)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach JWT Bearer token if present
api.interceptors.request.use(
  (config) => {
    try {
      const sessionRaw = window.localStorage.getItem(SESSION_KEY)
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw)
        if (session?.token) {
          config.headers.Authorization = `Bearer ${session.token}`
        }
      }
    } catch {
      // Fallback silently if session isn't available
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response Interceptor: Extract clean API error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        window.localStorage.removeItem(SESSION_KEY)
      } catch {}
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred.'

    const err = new Error(message)
    err.status = error.response?.status
    err.response = error.response
    return Promise.reject(err)
  },
)

export function getApiErrorMessage(err, fallback = 'Operation failed. Please try again.') {
  if (!err) return fallback
  return err.response?.data?.message || err.message || fallback
}
