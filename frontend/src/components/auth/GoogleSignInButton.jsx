import { useEffect, useRef, useState } from 'react'

const GOOGLE_GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

export function GoogleSignInButton({ onSuccess, onError, disabled = false, loading = false }) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const containerRef = useRef(null)

  const callbacksRef = useRef({ onSuccess, onError })
  useEffect(() => {
    callbacksRef.current = { onSuccess, onError }
  }, [onSuccess, onError])

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

  const isInitializedRef = useRef(false)

  // Initialize GIS and render Google button ONCE
  useEffect(() => {
    if (!googleClientId) return

    function initGis() {
      if (isInitializedRef.current || !window.google?.accounts?.id) return
      isInitializedRef.current = true

      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            setIsAuthenticating(false)
            if (response && response.credential) {
              callbacksRef.current.onSuccess(response.credential)
            } else {
              callbacksRef.current.onError('Google authentication failed: missing credential token.')
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 320,
          })
        }
      } catch (err) {
        console.warn('Google Identity Services initialization error:', err)
      }
    }

    if (window.google?.accounts?.id) {
      setIsScriptLoaded(true)
      initGis()
      return
    }

    const existingScript = document.querySelector(`script[src="${GOOGLE_GIS_SCRIPT_URL}"]`)
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setIsScriptLoaded(true)
        initGis()
      })
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_GIS_SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsScriptLoaded(true)
      initGis()
    }
    script.onerror = () => {
      console.warn('Failed to load Google Identity Services SDK')
    }
    document.head.appendChild(script)
  }, [googleClientId])

  function handleCustomClick() {
    if (!googleClientId) {
      onError('Google Cloud Client ID is not configured (VITE_GOOGLE_CLIENT_ID missing).')
      return
    }

    if (!isScriptLoaded || !window.google?.accounts?.id) {
      onError('Google Sign-In SDK is still loading. Please try again in a moment.')
      return
    }

    setIsAuthenticating(true)

    try {
      window.google.accounts.id.prompt((notification) => {
        if (
          notification.isNotDisplayed() ||
          notification.isSkippedMoment() ||
          notification.isDismissedMoment()
        ) {
          setIsAuthenticating(false)
        }
      })
    } catch {
      setIsAuthenticating(false)
    }
  }

  const isLoading = loading || isAuthenticating

  return (
    <div className="vayro-google-btn-wrapper" style={{ width: '100%', marginTop: '0.75rem', display: 'flex', justifyContent: 'center' }}>
      {/* Container where Google's official GIS button is rendered */}
      <div
        ref={containerRef}
        className="vayro-google-gis-container"
        style={{ display: isLoading ? 'none' : 'block', width: '100%', maxWidth: '320px' }}
      />

      {/* Fallback/Loading button UI */}
      {(!isScriptLoaded || isLoading) && (
        <button
          type="button"
          className="vayro-google-btn"
          onClick={handleCustomClick}
          disabled={disabled || isLoading}
          aria-label="Continue with Google"
        >
          {isLoading ? (
            <span className="vayro-google-spinner" aria-hidden="true" />
          ) : (
            <svg
              className="vayro-google-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.13C3.25 21.32 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.6H1.28C.46 8.23 0 10.06 0 12s.46 3.77 1.28 5.4l4-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.68 1.28 6.6l4 3.13c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span className="vayro-google-btn-text">
            {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
          </span>
        </button>
      )}
    </div>
  )
}
