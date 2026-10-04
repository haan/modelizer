import { useLayoutEffect, useState } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  )

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    try {
      window.localStorage.setItem('modelizer.theme', nextTheme)
    } catch {
      // The current session still works when browser storage is unavailable.
    }
  }

  return { theme, toggleTheme }
}
