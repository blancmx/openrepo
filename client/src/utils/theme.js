const THEME_KEY = 'quill_theme'

export function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'dark' || saved === 'light') {
    return saved
  }
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function applyTheme(theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(THEME_KEY, theme)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: theme }))
  }
  return theme
}

export function toggleTheme() {
  const current = getInitialTheme()
  const next = current === 'dark' ? 'light' : 'dark'
  return applyTheme(next)
}
