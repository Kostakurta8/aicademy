'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUIStore } from '@/stores/ui-store'
import { useThemeStore } from '@/stores/theme-store'
import { useAIStore } from '@/stores/ai-store'
import { X, Keyboard } from 'lucide-react'

const shortcuts = [
  { keys: ['Ctrl', '/'], description: 'Toggle sidebar' },
  { keys: ['Ctrl', 'K'], description: 'Command palette' },
  { keys: ['Alt', 'T'], description: 'Cycle theme' },
  { keys: ['Alt', 'A'], description: 'Toggle AI Tutor' },
  { keys: ['?'], description: 'Show shortcuts' },
]

export default function KeyboardShortcuts() {
  const [showOverlay, setShowOverlay] = useState(false)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const cycleTheme = useThemeStore((s) => s.cycleTheme)
  const tutorOpen = useAIStore((s) => s.tutorOpen)
  const setTutorOpen = useAIStore((s) => s.setTutorOpen)
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
    
    // ? key (only when not in input)
    if (e.key === '?' && !isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault()
      setShowOverlay(prev => !prev)
      return
    }

    // Ctrl+/ toggle sidebar
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault()
      toggleSidebar()
      return
    }

    // Ctrl+K command palette
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      toggleCommandPalette()
      return
    }

    // Alt+T cycle theme
    if (e.altKey && e.key === 't') {
      e.preventDefault()
      cycleTheme()
      return
    }

    // Alt+A toggle AI Tutor
    if (e.altKey && e.key === 'a') {
      e.preventDefault()
      setTutorOpen(!tutorOpen)
      return
    }

    // Escape closes the overlay
    if (e.key === 'Escape' && showOverlay) {
      setShowOverlay(false)
    }
  }, [toggleSidebar, cycleTheme, tutorOpen, setTutorOpen, toggleCommandPalette, showOverlay])

  useEffect(() => {
    globalThis.addEventListener('keydown', handleKeyDown)
    return () => globalThis.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!showOverlay) return null

  return (
        <div
          className="animate-fade-in fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setShowOverlay(false)}
        >
          <div
            className="animate-fade-in bg-surface border border-border-subtle rounded-2xl p-6 w-[380px] max-w-[90vw] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Keyboard size={18} className="text-accent" />
                <h2 className="text-lg font-semibold text-text-primary">Keyboard Shortcuts</h2>
              </div>
              <button onClick={() => setShowOverlay(false)} title="Close shortcuts" className="p-1 rounded-lg text-text-muted hover:text-text-primary cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {shortcuts.map(({ keys, description }) => (
                <div key={description} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-text-secondary">{description}</span>
                  <div className="flex gap-1">
                    {keys.map(k => (
                      <kbd key={k} className="px-2 py-0.5 rounded bg-surface-raised border border-border-subtle text-xs font-mono text-text-muted">{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-4 text-center">Press <kbd className="px-1 py-0.5 rounded bg-surface-raised border border-border-subtle text-[10px] font-mono">?</kbd> or <kbd className="px-1 py-0.5 rounded bg-surface-raised border border-border-subtle text-[10px] font-mono">Esc</kbd> to close</p>
          </div>
        </div>
  )
}
