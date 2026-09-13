import { useEffect } from 'react'

export function useEscapeKey(isOpen, onEscape, disabled = false) {
  useEffect(() => {
    if (!isOpen || disabled) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onEscape?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onEscape, disabled])
}
