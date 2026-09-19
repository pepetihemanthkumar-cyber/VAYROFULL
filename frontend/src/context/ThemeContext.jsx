import { createContext, useContext, useEffect, useState } from 'react'

const THEME_KEY = 'vayro_theme_preference'
const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return window.localStorage.getItem(THEME_KEY) || 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_KEY, theme)
    } catch (err) {
      console.error('Failed to persist theme:', err)
    }

    const root = document.documentElement
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme])

  const setTheme = (newTheme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
