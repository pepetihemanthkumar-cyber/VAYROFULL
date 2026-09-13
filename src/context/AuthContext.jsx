import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  authenticateMockUser,
  changeMockUserPassword,
  registerMockUser,
  updateMockUserProfile,
} from '../services/mockAuth'
import {
  getProfilePhoto,
  removeProfilePhoto as deleteStoredPhoto,
  saveProfilePhoto,
  PROFILE_PHOTO_EVENT,
} from '../services/profilePhotoStorage'

const SESSION_KEY = 'vayro_session'
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
  const [isInitializing, setIsInitializing] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(false)

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
    const nextSession = await authenticateMockUser(credentials)
    return persistSession(nextSession)
  }, [persistSession])

  const register = useCallback(async (details) => {
    const nextSession = await registerMockUser(details)
    return persistSession(nextSession)
  }, [persistSession])

  const updateProfile = useCallback(async (updates) => {
    if (!session?.user?.id) throw new Error('Not logged in')
    const updatedUser = await updateMockUserProfile(session.user.id, updates)
    const nextSession = { ...session, user: updatedUser }
    return persistSession(nextSession)
  }, [persistSession, session])

  const changePassword = useCallback(async ({ currentPassword, newPassword }) => {
    if (!session?.user?.id) throw new Error('Not logged in')
    return changeMockUserPassword(session.user.id, { currentPassword, newPassword })
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
    window.localStorage.removeItem(SESSION_KEY)
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
    register,
    updateProfile,
    changePassword,
    logout,
  }), [
    changePassword,
    isInitializing,
    isLoadingPhoto,
    login,
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

