import axios from 'axios'

const SESSION_KEY = 'vayro_session'

// Configured base URL for future Spring Boot API Gateway
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
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

    return Promise.reject(new Error(message))
  },
)

export function getApiErrorMessage(err, fallback = 'Operation failed. Please try again.') {
  if (!err) return fallback
  return err.response?.data?.message || err.message || fallback
}

