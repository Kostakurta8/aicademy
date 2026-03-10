'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useUIStore } from '@/stores/ui-store'
import { useRouter } from 'next/navigation'
import { useThemeStore } from '@/stores/theme-store'
import {
  Search,
  LayoutDashboard,
  BookOpen,
  Wrench,
  FlaskConical,
  Shield,
  Cpu,
  Swords,
  Trophy,
  Layers,
  Settings,
  TrendingUp,
  Sun,
  Moon,
  Eye,
} from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  category: string
}

export default function CommandPalette() {
  const isOpen = useUIStore((s) => s.commandPaletteOpen)
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen)
  const setTheme = useThemeStore((s) => s.setTheme)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const nav = useCallback((path: string) => { router.push(path); setOpen(false) }, [router, setOpen])

  const allItems: CommandItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, action: () => nav('/dashboard'), category: 'Navigate' },
    { id: 'modules', label: 'Modules', icon: <BookOpen size={16} />, action: () => nav('/modules'), category: 'Navigate' },
    { id: 'sandbox', label: 'Sandbox', icon: <Wrench size={16} />, action: () => nav('/sandbox'), category: 'Navigate' },
    { id: 'labs', label: 'Labs', icon: <FlaskConical size={16} />, action: () => nav('/labs'), category: 'Navigate' },
    { id: 'ethics', label: 'Ethics', icon: <Shield size={16} />, action: () => nav('/ethics'), category: 'Navigate' },
    { id: 'internals', label: 'Internals', icon: <Cpu size={16} />, action: () => nav('/internals'), category: 'Navigate' },
    { id: 'missions', label: 'Missions', icon: <Swords size={16} />, action: () => nav('/missions'), category: 'Navigate' },
    { id: 'challenges', label: 'Challenges', icon: <Trophy size={16} />, action: () => nav('/challenges'), category: 'Navigate' },
    { id: 'flashcards', label: 'Flashcards', icon: <Layers size={16} />, action: () => nav('/flashcards'), category: 'Navigate' },
    { id: 'progress', label: 'Progress', icon: <TrendingUp size={16} />, action: () => nav('/progress'), category: 'Navigate' },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} />, action: () => nav('/settings'), category: 'Navigate' },
    { id: 'theme-dark', label: 'Switch to Dark Theme', icon: <Moon size={16} />, action: () => { setTheme('dark'); setOpen(false) }, category: 'Actions' },
    { id: 'theme-light', label: 'Switch to Light Theme', icon: <Sun size={16} />, action: () => { setTheme('light'); setOpen(false) }, category: 'Actions' },
    { id: 'theme-hc', label: 'Switch to High Contrast', icon: <Eye size={16} />, action: () => { setTheme('high-contrast'); setOpen(false) }, category: 'Actions' },
  ]

  const filtered = query
    ? allItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(!isOpen)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, setOpen])

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      queueMicrotask(() => {
        setQuery('')
        setSelectedIndex(0)
      })
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action()
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const categories = [...new Set(filtered.map((i) => i.category))]

  if (!isOpen) return null

  return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop dismiss is supplementary; Escape key already closes */}
          <div
            className="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            role="presentation"
          />
          <div
            className="animate-fade-in relative w-full max-w-lg bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden z-10"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
              <Search size={18} className="text-text-muted shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-text-primary placeholder:text-text-muted outline-none text-sm"
              />
              <kbd className="px-2 py-0.5 text-xs text-text-muted bg-surface-raised rounded border border-border-subtle">
                Esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-8">No results found</p>
              ) : (
                categories.map((cat) => (
                  <div key={cat}>
                    <p className="px-4 py-1.5 text-xs font-medium text-text-muted uppercase tracking-wider">{cat}</p>
                    {filtered
                      .filter((i) => i.category === cat)
                      .map((item) => {
                        const idx = filtered.indexOf(item)
                        return (
                          <button
                            key={item.id}
                            onClick={item.action}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`
                              w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm cursor-pointer
                              transition-colors
                              ${idx === selectedIndex ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-surface-raised'}
                            `}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </button>
                        )
                      })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border-subtle flex items-center gap-4 text-xs text-text-muted">
              <span><kbd className="px-1 py-0.5 bg-surface-raised rounded border border-border-subtle">↑↓</kbd> Navigate</span>
              <span><kbd className="px-1 py-0.5 bg-surface-raised rounded border border-border-subtle">↵</kbd> Select</span>
              <span><kbd className="px-1 py-0.5 bg-surface-raised rounded border border-border-subtle">Esc</kbd> Close</span>
            </div>
          </div>
        </div>
  )
}
