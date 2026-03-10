'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useXPStore, XP_PER_LEVEL } from '@/stores/xp-store'
import { useProgressStore } from '@/stores/progress-store'
import { hapticTap } from '@/lib/sounds'
import React from 'react'
import {
  LayoutDashboard,
  BookOpen,
  Gamepad2,
  User,
  Play,
} from 'lucide-react'

// 4 tabs (not 5) — the center slot is reserved for the FAB
const leftTabs = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/modules', label: 'Learn', icon: BookOpen },
]
const rightTabs = [
  { href: '/games', label: 'Play', icon: Gamepad2 },
  { href: '/progress', label: 'Me', icon: User },
]

const MODULE_SLUGS = ['foundations', 'prompt-engineering', 'tools-ecosystem', 'building-with-apis', 'ethics', 'real-world-projects', 'image-video-audio', 'agents-automation']
const MODULE_LESSONS = [3, 4, 3, 4, 3, 3, 3, 3]

// Stable selector: returns a primitive string to avoid re-renders from object identity changes
function selectNextModuleSlug(s: { moduleProgress: Record<string, { completedLessons?: string[] }> }) {
  for (let i = 0; i < MODULE_SLUGS.length; i++) {
    const done = s.moduleProgress[MODULE_SLUGS[i]]?.completedLessons?.length || 0
    if (done < MODULE_LESSONS[i]) return MODULE_SLUGS[i]
  }
  return ''
}

const BottomNav = React.memo(function BottomNav() {
  const pathname = usePathname()
  const totalXP = useXPStore((s) => s.totalXP)
  const level = useXPStore((s) => s.level)
  const streak = useXPStore((s) => s.currentStreak)
  const nextModuleSlug = useProgressStore(selectNextModuleSlug)

  const currentLevelXP = XP_PER_LEVEL[level - 1] ?? 0
  const nextLevelXP = XP_PER_LEVEL[level] ?? currentLevelXP + 500
  const progressPercent = Math.min(
    ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100,
    100
  )

  const renderTab = ({ href, label, icon: Icon }: { href: string; label: string; icon: typeof LayoutDashboard }) => {
    const isActive = pathname === href || pathname?.startsWith(href + '/')
    return (
      <li key={href} className="flex-1">
        <Link
          href={href}
          onClick={() => hapticTap()}
          className="flex flex-col items-center justify-center gap-0.5 py-2 relative"
          aria-current={isActive ? 'page' : undefined}
        >
          {isActive && (
            <div className="absolute -top-0.5 w-8 h-1 rounded-full bg-accent" />
          )}
          <Icon size={20} className={isActive ? 'text-accent' : 'text-text-muted'} />
          <span className={`text-[10px] font-medium ${isActive ? 'text-accent' : 'text-text-muted'}`}>
            {label}
          </span>
        </Link>
      </li>
    )
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* XP progress bar */}
      <div className="h-1 bg-surface-raised/50">
        <div
          className="h-full bg-gradient-to-r from-purple via-blue to-cyan transition-[width] duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Floating Continue FAB */}
      {nextModuleSlug && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-10">
          <Link
            href={`/modules/${nextModuleSlug}`}
            onClick={() => hapticTap()}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple to-blue shadow-lg shadow-purple/30 animate-fab-breathe tap-bounce"
            aria-label="Continue Learning"
          >
            <Play size={22} className="text-white fill-white ml-0.5" />
          </Link>
        </div>
      )}

      {/* Tab bar */}
      <nav
        className="bg-surface/95 backdrop-blur-xl border-t border-border-subtle"
        aria-label="Mobile navigation"
      >
        <ul className="flex items-stretch">
          {leftTabs.map(renderTab)}
          {/* Center spacer for FAB */}
          <li className="w-16" aria-hidden />
          {rightTabs.map(renderTab)}
        </ul>

        {/* Micro-badge row */}
        <div className="flex items-center justify-center gap-3 pb-1.5 -mt-0.5">
          {streak > 0 && (
            <span className="text-[9px] font-bold text-orange flex items-center gap-0.5">
              🔥 {streak}
            </span>
          )}
          <span className="text-[9px] font-bold text-accent">Lv.{level}</span>
          <span className="text-[9px] font-bold text-gold flex items-center gap-0.5">
            ⭐ {totalXP.toLocaleString()}
          </span>
        </div>
      </nav>
    </div>
  )
})

BottomNav.displayName = 'BottomNav'
export default BottomNav
