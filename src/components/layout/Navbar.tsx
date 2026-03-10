'use client'

import { useUIStore } from '@/stores/ui-store'
import { useThemeStore } from '@/stores/theme-store'
import { useXPStore, DAILY_XP_GOAL } from '@/stores/xp-store'
import ClientOnly from '@/components/ui/ClientOnly'
import XPBar from '@/components/layout/XPBar'
import { Menu, Sun, Moon, Monitor, Eye, Flame } from 'lucide-react'
import type { ThemeMode } from '@/stores/theme-store'

const themeIcons: Record<ThemeMode, React.ReactNode> = {
  dark: <Moon size={18} />,
  light: <Sun size={18} />,
  'high-contrast': <Eye size={18} />,
  system: <Monitor size={18} />,
}

const themeOrder: ThemeMode[] = ['dark', 'light', 'high-contrast', 'system']

export default function Navbar() {
  const setSidebarMobileOpen = useUIStore((s) => s.setSidebarMobileOpen)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)

  return (
    <header
      className={`
        fixed top-0 right-0 z-30 h-14 md:h-16
        bg-surface/80 backdrop-blur-md border-b border-border-subtle
        flex items-center justify-between px-3 md:px-6
        transition-all duration-300
        left-0 md:left-[260px]
        ${sidebarCollapsed ? 'md:left-[72px]' : 'md:left-[260px]'}
      `}
    >
      {/* Left side */}
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="md:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Mobile: streak + mini level */}
        <ClientOnly>
          <MobileStatusBadges />
        </ClientOnly>
      </div>

      {/* Center: XP Bar (desktop only) */}
      <div className="hidden md:flex flex-1 justify-center px-4">
        <ClientOnly>
          <XPBar />
        </ClientOnly>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5">
        {/* AI Status indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-raised text-xs text-text-muted">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
          <span>AI Ready</span>
        </div>

        {/* Theme cycler */}
        <ClientOnly>
          <ThemeCycler />
        </ClientOnly>
      </div>
    </header>
  )
}

function MobileStatusBadges() {
  const streak = useXPStore((s) => s.currentStreak)
  const level = useXPStore((s) => s.level)
  const dailyXPEarned = useXPStore((s) => s.dailyXPEarned)
  const dailyXPDate = useXPStore((s) => s.dailyXPDate)

  const today = new Date().toISOString().slice(0, 10)
  const earned = dailyXPDate === today ? dailyXPEarned : 0
  const pct = Math.min((earned / DAILY_XP_GOAL) * 100, 100)
  const circ = 2 * Math.PI * 11

  return (
    <div className="flex md:hidden items-center gap-1.5">
      {streak > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange/10 text-[10px] font-bold text-orange">
          <Flame size={12} />
          {streak}
        </div>
      )}
      <div className="px-2 py-1 rounded-full bg-accent/10 text-[10px] font-bold text-accent">
        Lv.{level}
      </div>
      {/* Compact daily XP ring */}
      <div className="relative w-7 h-7 flex items-center justify-center" title={`${earned}/${DAILY_XP_GOAL} daily XP`}>
        <svg width="28" height="28" viewBox="0 0 28 28" className="absolute">
          <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth="2" className="text-border-subtle" />
          <circle cx="14" cy="14" r="11" fill="none" strokeWidth="2"
            className="text-gold"
            strokeDasharray={`${circ}`}
            strokeDashoffset={`${circ * (1 - pct / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 14 14)"
          />
        </svg>
        <span className="text-[7px] font-black text-gold">⚡</span>
      </div>
    </div>
  )
}

function ThemeCycler() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  const cycleTheme = () => {
    const currentIdx = themeOrder.indexOf(theme)
    const nextIdx = (currentIdx + 1) % themeOrder.length
    setTheme(themeOrder[nextIdx])
  }

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
      aria-label={`Theme: ${theme}. Click to change.`}
      title={`Theme: ${theme}`}
    >
      {themeIcons[theme]}
    </button>
  )
}
