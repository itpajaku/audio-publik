import { ref, computed } from 'vue'

export type ThemeMode = 'dark' | 'light'

const currentTheme = ref<ThemeMode>('dark')
const isInitialized = ref(false)

export function useTheme() {
  const isDark = computed(() => currentTheme.value === 'dark')

  function applyTheme(theme: ThemeMode) {
    currentTheme.value = theme
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      root.setAttribute('data-theme', theme)
      if (theme === 'dark') {
        root.classList.remove('light')
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
        root.classList.add('light')
      }

      // Update meta theme-color
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#090d16' : '#f8fafc')
      }

      try {
        localStorage.setItem('aerovox_theme', theme)
      } catch (e) {
        // ignore localStorage errors (e.g. incognito restrictions)
      }
    }
  }

  function toggleTheme() {
    applyTheme(currentTheme.value === 'dark' ? 'light' : 'dark')
  }

  function initTheme() {
    if (isInitialized.value) return
    isInitialized.value = true

    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('aerovox_theme') as ThemeMode | null
        if (saved === 'dark' || saved === 'light') {
          applyTheme(saved)
          return
        }
      } catch (e) {
        // ignore
      }

      // System preference check
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        applyTheme('light')
      } else {
        applyTheme('dark')
      }
    }
  }

  return {
    theme: currentTheme,
    isDark,
    toggleTheme,
    setTheme: applyTheme,
    initTheme
  }
}
