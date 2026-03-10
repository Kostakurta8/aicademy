import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'dark' | 'light' | 'high-contrast' | 'system'

interface ThemeStore {
  theme: ThemeMode
  resolvedTheme: 'dark' | 'light' | 'high-contrast'
  setTheme: (theme: ThemeMode) => void
  cycleTheme: () => void
  resolveSystemTheme: () => void
  initTheme: () => void
}

function getSystemTheme(): 'dark' | 'light' | 'high-contrast' {
  if (typeof window === 'undefined') return 'dark'
  if (window.matchMedia('(prefers-contrast: more)').matches) return 'high-contrast'
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}

function applyThemeClass(resolved: 'dark' | 'light' | 'high-contrast') {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.classList.remove('dark', 'light', 'high-contrast')
  html.classList.add(resolved)
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      resolvedTheme: 'dark',

      setTheme: (theme: ThemeMode) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme
        applyThemeClass(resolved)
        set({ theme, resolvedTheme: resolved })
      },

      cycleTheme: () => {
        const order: ThemeMode[] = ['dark', 'light', 'high-contrast']
        const { theme } = get()
        const cur = theme === 'system' ? get().resolvedTheme : theme
        const idx = order.indexOf(cur as ThemeMode)
        const next = order[(idx + 1) % order.length]
        const resolved = next === 'system' ? getSystemTheme() : (next as 'dark' | 'light' | 'high-contrast')
        applyThemeClass(resolved)
        set({ theme: next, resolvedTheme: resolved })
      },

      resolveSystemTheme: () => {
        const { theme } = get()
        if (theme === 'system') {
          const resolved = getSystemTheme()
          applyThemeClass(resolved)
          set({ resolvedTheme: resolved })
        }
      },

      initTheme: () => {
        const { theme } = get()
        const resolved = theme === 'system' ? getSystemTheme() : theme
        applyThemeClass(resolved)
        set({ resolvedTheme: resolved })
      },
    }),
    {
      name: 'aicademy-theme',
      skipHydration: true,
    }
  )
)
