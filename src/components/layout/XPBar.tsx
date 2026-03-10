'use client'

import { useXPStore, XP_PER_LEVEL } from '@/stores/xp-store'
import { Flame, Star, Zap } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

// Single shared subscription for XP changes — avoids double re-renders
const xpGainListeners = new Set<(amount: number) => void>()
let xpSubActive = false

function ensureXPSubscription() {
  if (xpSubActive) return
  xpSubActive = true
  let prevXP = useXPStore.getState().totalXP
  useXPStore.subscribe((state) => {
    if (state.totalXP > prevXP) {
      const gained = state.totalXP - prevXP
      xpGainListeners.forEach((fn) => fn(gained))
    }
    prevXP = state.totalXP
  })
}

function useXPGain() {
  const [gain, setGain] = useState<{ amount: number; id: number } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    ensureXPSubscription()
    const listener = (amount: number) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setGain({ amount, id: Date.now() })
      timerRef.current = setTimeout(() => setGain(null), 1500)
    }
    xpGainListeners.add(listener)
    return () => { xpGainListeners.delete(listener); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return gain
}

export default function XPBar() {
  const totalXP = useXPStore((s) => s.totalXP)
  const level = useXPStore((s) => s.level)
  const streak = useXPStore((s) => s.currentStreak)

  const currentLevelXP = XP_PER_LEVEL[level - 1] ?? 0
  const nextLevelXP = XP_PER_LEVEL[level] ?? currentLevelXP + 500
  const xpInLevel = totalXP - currentLevelXP
  const xpNeeded = nextLevelXP - currentLevelXP
  const progressPercent = Math.min((xpInLevel / xpNeeded) * 100, 100)

  // Pulse animation when XP changes — shared subscription
  const xpGain = useXPGain()
  const justGained = xpGain !== null

  return (
    <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-surface-raised/60 border border-border-subtle">
      {/* Level badge */}
      <div className="flex items-center gap-1">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple to-blue flex items-center justify-center">
          <span className="text-white text-[10px] font-black">{level}</span>
        </div>
      </div>

      {/* XP progress */}
      <div className="flex-1 min-w-[100px] max-w-[160px]">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-medium text-text-muted">
            {xpInLevel}/{xpNeeded} XP
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-border-subtle overflow-hidden relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple via-accent to-blue transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Shimmer effect */}
          {justGained && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-fade-in"
            />
          )}
        </div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div
          className="animate-celebrate-pop flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange/10 border border-orange/20"
        >
          <Flame size={12} className="text-orange" />
          <span className="text-[10px] font-bold text-orange">{streak}</span>
        </div>
      )}

      {/* Total XP */}
      <div
        className={`flex items-center gap-1 transition-transform duration-300 ${justGained ? 'animate-bounce-in' : ''}`}
      >
        <Star size={12} className="text-gold" />
        <span className="text-[10px] font-bold text-gold">{totalXP.toLocaleString()}</span>
      </div>
    </div>
  )
}

/** Floating "+XP" popup that appears globally when XP is earned */
export function GlobalXPToast() {
  const popup = useXPGain()

  if (!popup) return null

  return (
        <div
          key={popup.id}
          className="animate-fade-in fixed top-20 right-8 z-[200] pointer-events-none md:right-12"
        >
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gold/20 border border-gold/30 backdrop-blur-sm">
            <Zap size={14} className="text-gold" />
            <span className="text-sm font-black text-gold">+{popup.amount} XP</span>
          </div>
        </div>
  )
}
