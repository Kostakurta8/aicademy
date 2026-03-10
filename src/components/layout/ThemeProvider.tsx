'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/stores/theme-store'
import { useUserStore } from '@/stores/user-store'

export default function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const initTheme = useThemeStore((s) => s.initTheme)
  const resolveSystemTheme = useThemeStore((s) => s.resolveSystemTheme)

  // Rehydrate persisted stores — critical stores first, rest dynamically imported
  useEffect(() => {
    // Critical: theme + user needed immediately for rendering
    useThemeStore.persist.rehydrate()
    useUserStore.persist.rehydrate()

    // Defer non-critical stores — dynamic import so they're not in the layout chunk
    const idleCallback = typeof requestIdleCallback === 'function' ? requestIdleCallback : (fn: () => void) => setTimeout(fn, 50)
    idleCallback(() => {
      import('@/stores/xp-store').then(m => m.useXPStore.persist.rehydrate())
      import('@/stores/progress-store').then(m => m.useProgressStore.persist.rehydrate())
      import('@/stores/bookmark-store').then(m => m.useBookmarkStore.persist.rehydrate())
    })
    // Heavily deferred — flashcards, AI, journal only when actually needed
    idleCallback(() => {
      import('@/stores/ai-store').then(m => m.useAIStore.persist.rehydrate())
      import('@/stores/flashcard-store').then(m => m.useFlashcardStore.persist.rehydrate())
      import('@/stores/journal-store').then(m => m.useJournalStore.persist.rehydrate())
    })

    // Check AI health lazily — dynamic import keeps groq-client out of layout
    idleCallback(() => {
      import('@/lib/ai/groq-client').then(({ checkAIHealth }) => {
        checkAIHealth().then(({ healthy, models }) => {
          import('@/stores/ai-store').then(m => {
            m.useAIStore.getState().setAIHealth(healthy, models)
          })
        })
      })
    })

    // Service worker: register in prod, unregister stale ones in dev
    if ('serviceWorker' in navigator) {
      if (window.location.hostname === 'localhost') {
        // Dev: unregister any stale SW so it doesn't intercept HMR/chunks
        navigator.serviceWorker.getRegistrations().then((regs) =>
          regs.forEach((r) => r.unregister())
        )
      } else {
        navigator.serviceWorker.register('/sw.js').catch(() => {})
      }
    }
  }, [])

  // Apply theme on mount
  useEffect(() => {
    initTheme()
  }, [initTheme])

  // Listen for system theme changes
  useEffect(() => {
    const darkMQ = globalThis.matchMedia('(prefers-color-scheme: dark)')
    const contrastMQ = globalThis.matchMedia('(prefers-contrast: more)')

    const handler = () => resolveSystemTheme()

    darkMQ.addEventListener('change', handler)
    contrastMQ.addEventListener('change', handler)

    return () => {
      darkMQ.removeEventListener('change', handler)
      contrastMQ.removeEventListener('change', handler)
    }
  }, [resolveSystemTheme])

  return <>{children}</>
}
