import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  getCurrentUser,
  login as authLogin,
  loginWithGoogle as authLoginWithGoogle,
  logout as authLogout,
  register as authRegister,
  SESSION_KEY,
} from '../services/authService'
import {
  getProfilePhoto,
  removeProfilePhoto as deleteStoredPhoto,
  saveProfilePhoto,
  PROFILE_PHOTO_EVENT,
} from '../services/profilePhotoStorage'
import {
  updateCurrentUserProfile,
  changePassword as apiChangePassword,
} from '../services/userService'
const AuthContext = createContext(null)

function readSession() {
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession())
  const [isInitializing, setIsInitializing] = useState(true)
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false)

  // App Startup Auth Restoration
  useEffect(() => {
    let isCancelled = false

    async function restoreSession() {
      const stored = readSession()
      if (!stored?.token) {
        if (!isCancelled) {
          setIsInitializing(false)
        }
        return
      }

      try {
        const user = await getCurrentUser()
        if (!isCancelled) {
          const updatedSession = { ...stored, user }
          window.localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession))
          setSession(updatedSession)
        }
      } catch (err) {
        if (!isCancelled) {
          if (err.status === 401 || err.response?.status === 401) {
            window.localStorage.removeItem(SESSION_KEY)
            setSession(null)
          }
        }
      } finally {
        if (!isCancelled) {
          setIsInitializing(false)
        }
      }
    }

    restoreSession()

    return () => {
      isCancelled = true
    }
  }, [])

  // Load photo from IndexedDB when user is available
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      setProfilePhoto(null)
      return
    }

    let isCancelled = false
    setIsLoadingPhoto(true)

    getProfilePhoto(userId)
      .then((photo) => {
        if (!isCancelled) {
          setProfilePhoto(photo)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setProfilePhoto(null)
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingPhoto(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [session?.user?.id])

  // Sync photo changes across components / events
  useEffect(() => {
    function handlePhotoUpdated(event) {
      const { userId, dataUrl } = event.detail || {}
      if (userId === session?.user?.id) {
        setProfilePhoto(dataUrl || null)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener(PROFILE_PHOTO_EVENT, handlePhotoUpdated)
      return () => {
        window.removeEventListener(PROFILE_PHOTO_EVENT, handlePhotoUpdated)
      }
    }
  }, [session?.user?.id])

  const persistSession = useCallback((nextSession) => {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
    return nextSession.user
  }, [])

  const login = useCallback(async (credentials) => {
    const nextSession = await authLogin(credentials)
    return persistSession(nextSession)
  }, [persistSession])

  const loginWithGoogle = useCallback(async (payload) => {
    const nextSession = await authLoginWithGoogle(payload)
    return persistSession(nextSession)
  }, [persistSession])

  const register = useCallback(async (details) => {
    const nextSession = await authRegister(details)
    return persistSession(nextSession)
  }, [persistSession])

  const updateProfile = useCallback(async (updates) => {
    if (!session?.token) throw new Error('Not logged in')
    let firstName = updates.firstName
    let lastName = updates.lastName
    if (!firstName && updates.name) {
      const parts = updates.name.trim().split(/\s+/)
      firstName = parts[0] || 'User'
      lastName = parts.slice(1).join(' ') || ''
    }

    const updatedUser = await updateCurrentUserProfile({
      firstName,
      lastName,
      phone: updates.phone,
    })

    const nextSession = {
      ...session,
      user: {
        ...session.user,
        ...updatedUser,
        address: updates.address || session.user?.address,
        licenseNumber: updates.licenseNumber || session.user?.licenseNumber,
      },
    }
    return persistSession(nextSession)
  }, [persistSession, session])

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    if (!session?.token) throw new Error('Not logged in')
    return await apiChangePassword({ currentPassword, newPassword })
  }, [session])

  const uploadProfilePhoto = useCallback(async (file) => {
    const userId = session?.user?.id
    if (!userId) throw new Error('Not logged in')
    const savedDataUrl = await saveProfilePhoto(userId, file)
    setProfilePhoto(savedDataUrl)
    return savedDataUrl
  }, [session?.user?.id])

  const removeProfilePhoto = useCallback(async () => {
    const userId = session?.user?.id
    if (!userId) return false
    await deleteStoredPhoto(userId)
    setProfilePhoto(null)
    return true
  }, [session?.user?.id])

  const logout = useCallback(() => {
    authLogout()
    setSession(null)
    setProfilePhoto(null)
  }, [])

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.token || null,
    role: session?.user?.role || null,
    isAuthenticated: Boolean(session?.token),
    isInitializing,
    profilePhoto,
    isLoadingPhoto,
    uploadProfilePhoto,
    removeProfilePhoto,
    login,
    loginWithGoogle,
    register,
    updateProfile,
    changePassword,
    logout,
  }), [
    changePassword,
    isInitializing,
    isLoadingPhoto,
    login,
    loginWithGoogle,
    logout,
    profilePhoto,
    register,
    removeProfilePhoto,
    session,
    updateProfile,
    uploadProfilePhoto,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
