'use client'

import { memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useUIStore } from '@/stores/ui-store'
import { useXPStore, XP_PER_LEVEL } from '@/stores/xp-store'
import { useProgressStore } from '@/stores/progress-store'
import { hapticTap } from '@/lib/sounds'
import {
  LayoutDashboard,
  BookOpen,
  Gamepad2,
  Settings,
  ChevronLeft,
  X,
  TrendingUp,
  Wand2,
  Flame,
  Star,
  Compass,
  Play,
  Trophy,
  Crown,
} from 'lucide-react'

// Simplified: 5 primary + 3 secondary = 8 total (down from 11)
const primaryNav = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/modules', label: 'Learn', icon: BookOpen },
  { href: '/games', label: 'Play', icon: Gamepad2 },
  { href: '/prompting', label: 'Prompt', icon: Wand2 },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
]

const exploreNav = [
  { href: '/sandbox', label: 'Sandbox', icon: Compass },
  { href: '/challenges', label: 'Challenges', icon: Trophy },
  { href: '/flashcards', label: 'Cards', icon: Play },
  { href: '/pricing', label: 'Pro', icon: Crown },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const MODULE_SLUGS_S = ['foundations', 'prompt-engineering', 'tools-ecosystem', 'building-with-apis', 'ethics', 'real-world-projects', 'image-video-audio', 'agents-automation']
const MODULE_LESSONS_S = [3, 4, 3, 4, 3, 3, 3, 3]

function selectNextModule(s: { moduleProgress: Record<string, { completedLessons?: string[] }> }) {
  for (let i = 0; i < MODULE_SLUGS_S.length; i++) {
    const done = s.moduleProgress[MODULE_SLUGS_S[i]]?.completedLessons?.length || 0
    if (done < MODULE_LESSONS_S[i]) return MODULE_SLUGS_S[i]
  }
  return ''
}

export default memo(function Sidebar() {
  const pathname = usePathname()
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const sidebarMobileOpen = useUIStore((s) => s.sidebarMobileOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const setSidebarMobileOpen = useUIStore((s) => s.setSidebarMobileOpen)
  const level = useXPStore((s) => s.level)
  const totalXP = useXPStore((s) => s.totalXP)
  const streak = useXPStore((s) => s.currentStreak)
  const nextModuleSlug = useProgressStore(selectNextModule)

  const currentLevelXP = XP_PER_LEVEL[level - 1] ?? 0
  const nextLevelXP = XP_PER_LEVEL[level] ?? currentLevelXP + 500
  const levelPercent = Math.min(((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100, 100)

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300 ${sidebarMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full
          bg-surface border-r border-border-subtle
          transition-all duration-300 ease-in-out
          flex flex-col
          ${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'}
          ${sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 md:h-16 px-4 border-b border-border-subtle">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple to-blue flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-lg font-bold text-text-primary tracking-tight">AIcademy</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-purple to-blue flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
          )}
          <button
            onClick={() => setSidebarMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Continue Learning CTA — most important action */}
        {!sidebarCollapsed && nextModuleSlug && (
          <div className="px-3 pt-3">
            <Link
              href={`/modules/${nextModuleSlug}`}
              onClick={() => { hapticTap(); setSidebarMobileOpen(false) }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-accent/15 to-blue/10 border border-accent/20 hover:border-accent/40 transition-all tap-bounce group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple to-blue flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Play size={14} className="text-white fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-accent block">Continue Learning</span>
                <span className="text-[10px] text-text-muted">Pick up where you left off</span>
              </div>
            </Link>
          </div>
        )}

        {/* Level + Stats Card */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3">
            <div className="px-3 py-2.5 rounded-xl bg-surface-raised/50 border border-border-subtle">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple to-blue flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-black">{level}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="w-full h-2 rounded-full bg-border-subtle overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple to-blue transition-all" style={{ width: `${levelPercent}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {streak > 0 && (
                  <span className="text-[10px] font-bold text-orange flex items-center gap-0.5">
                    <Flame size={10} /> {streak}
                  </span>
                )}
                <span className="text-[10px] font-bold text-gold flex items-center gap-0.5">
                  <Star size={10} /> {totalXP.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3" aria-label="Main navigation">
          <ul className="flex flex-col gap-0.5">
            {primaryNav.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname?.startsWith(href + '/')
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => { hapticTap(); setSidebarMobileOpen(false) }}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl
                      text-sm font-medium transition-all duration-200 tap-bounce
                      ${isActive ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'}
                      ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                    title={sidebarCollapsed ? label : undefined}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!sidebarCollapsed && <span>{label}</span>}
                    {isActive && !sidebarCollapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Explore section */}
          {!sidebarCollapsed && (
            <div className="mt-4 mb-2 px-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Explore</span>
            </div>
          )}
          {sidebarCollapsed && <div className="my-2 mx-3 border-t border-border-subtle" />}
          <ul className="flex flex-col gap-0.5">
            {exploreNav.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname?.startsWith(href + '/')
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => { hapticTap(); setSidebarMobileOpen(false) }}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-xl
                      text-sm font-medium transition-all duration-200 tap-bounce
                      ${isActive ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised'}
                      ${sidebarCollapsed ? 'justify-center' : ''}
                    `}
                    title={sidebarCollapsed ? label : undefined}
                  >
                    <Icon size={16} className="shrink-0" />
                    {!sidebarCollapsed && <span>{label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Collapse toggle (desktop) */}
        <div className="hidden md:flex items-center justify-center p-3 border-t border-border-subtle">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft size={18} className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>
    </>
  )
})
