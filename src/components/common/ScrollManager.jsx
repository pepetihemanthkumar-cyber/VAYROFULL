import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const scrollPositions = new Map()

export function ScrollManager() {
  const location = useLocation()
  const navType = useNavigationType()
  const prevKeyRef = useRef(location.key)

  // Save current scroll position before route change / on scroll
  useEffect(() => {
    function handleScroll() {
      if (location.key) {
        scrollPositions.set(location.key, window.scrollY || document.documentElement.scrollTop || 0)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [location.key])

  // Handle scroll position restoration or top-reset on navigation
  useLayoutEffect(() => {
    const isPop = navType === 'POP'
    const targetKey = location.key

    if (isPop && targetKey && scrollPositions.has(targetKey)) {
      const savedY = scrollPositions.get(targetKey) || 0
      // Request animation frame to ensure the DOM layout is ready before restoring scroll
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedY,
          left: 0,
          behavior: 'instant',
        })
      })
    } else {
      // PUSH or REPLACE navigation: smoothly reset to top
      requestAnimationFrame(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant',
        })
      })
    }

    prevKeyRef.current = location.key
  }, [location.pathname, location.key, navType])

  return null
}
