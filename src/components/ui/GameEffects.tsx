'use client'

import { useState, useEffect } from 'react'

// ============ CONFETTI BURST ============
export function ConfettiBurst({ trigger, color = 'multi' }: { trigger: boolean; color?: 'multi' | 'gold' | 'green' }) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; rotation: number; scale: number; color: string; delay: number }>>([])

  useEffect(() => {
    if (!trigger) return
    const colors = color === 'gold' ? ['#d97706', '#fbbf24', '#f59e0b', '#eab308'] :
                   color === 'green' ? ['#16a34a', '#4ade80', '#22c55e', '#86efac'] :
                   ['#7c3aed', '#2563eb', '#db2777', '#d97706', '#16a34a', '#ef4444', '#0891b2', '#ea580c']
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 500,
      y: -(Math.random() * 400 + 100),
      rotation: Math.random() * 720 - 360,
      scale: Math.random() * 0.5 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.3,
    }))
    queueMicrotask(() => setParticles(newParticles))
    const timer = setTimeout(() => setParticles([]), 2000)
    return () => clearTimeout(timer)
  }, [trigger, color])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: '50vw',
            top: '40vh',
            backgroundColor: p.color,
            animation: `confetti-burst 1.5s ease-out ${p.delay}s forwards`,
            '--confetti-x': `${p.x}px`,
            '--confetti-y': `${p.y}px`,
            '--confetti-r': `${p.rotation}deg`,
            '--confetti-s': `${p.scale}`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

// ============ ANIMATED SCORE COUNTER ============
export function AnimatedScore({ value, label, icon, color = 'text-accent', size = 'md' }: {
  value: number; label: string; icon?: React.ReactNode; color?: string; size?: 'sm' | 'md' | 'lg'
}) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (value === displayed) return
    const diff = value - displayed
    const steps = Math.min(Math.abs(diff), 20)
    const increment = diff / steps
    let step = 0
    const interval = setInterval(() => {
      step++
      setDisplayed(prev => step >= steps ? value : Math.round(prev + increment))
      if (step >= steps) clearInterval(interval)
    }, 30)
    return () => clearInterval(interval)
  }, [value, displayed])

  const sizeClasses = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg'

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <span
          key={value}
          className={`font-bold font-mono ${sizeClasses} ${color}`}
          style={{ animation: 'score-pop 0.3s ease-out' }}
        >
          {displayed.toLocaleString()}
        </span>
      </div>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  )
}

// ============ COMBO INDICATOR ============
export function ComboIndicator({ combo }: { combo: number }) {
  if (combo < 2) return null

  const intensity = Math.min(combo, 10)
  const glowColor = intensity >= 7 ? 'text-red' : intensity >= 4 ? 'text-orange' : 'text-gold'
  const bgColor = intensity >= 7 ? 'bg-red/10 border-red/30' : intensity >= 4 ? 'bg-orange/10 border-orange/30' : 'bg-gold/10 border-gold/30'

  return (
    <div
      key={combo}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${bgColor} ${glowColor} text-sm font-bold animate-celebrate-pop`}
    >
      <span className="animate-wiggle">🔥</span>
      {combo}x Combo!
      {intensity >= 5 && <span className="text-xs ml-1">+{Math.min(combo * 3, 30)} bonus</span>}
    </div>
  )
}

// ============ LIVES/HEARTS DISPLAY ============
export function LivesDisplay({ lives, maxLives = 3 }: { lives: number; maxLives?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxLives }).map((_, i) => (
        <span
          key={i}
          className={`text-lg ${i < lives ? '' : 'opacity-20 grayscale'}`}
          style={i === lives && lives < maxLives ? { animation: 'heart-lose 0.4s ease-out forwards' } : undefined}
        >
          ❤️
        </span>
      ))}
    </div>
  )
}

// ============ TIMER BAR ============
export function TimerBar({ timeLeft, maxTime, warning = 10 }: { timeLeft: number; maxTime: number; warning?: number }) {
  const percent = (timeLeft / maxTime) * 100
  const isWarning = timeLeft <= warning
  const color = isWarning ? 'bg-red' : percent > 50 ? 'bg-green' : 'bg-gold'

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-muted">⏱️ Time</span>
        <span className={`text-sm font-bold font-mono ${isWarning ? 'text-red animate-pulse' : 'text-text-primary'}`}>
          {timeLeft}s
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full bg-border-subtle overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

// ============ XP POPUP ============
export function XPPopup({ amount, show }: { amount: number; show: boolean }) {
  if (!show) return null
  return (
    <div
      className="fixed top-1/3 left-1/2 z-50 pointer-events-none"
      style={{ animation: 'xp-float 1.2s ease-out forwards' }}
    >
      <span className="text-3xl font-black text-gold drop-shadow-lg">+{amount} XP</span>
    </div>
  )
}

// ============ SCREEN FLASH ============
export function ScreenFlash({ trigger, color = 'green' }: { trigger: boolean; color?: 'green' | 'red' | 'gold' }) {
  const colorMap = { green: 'bg-green/20', red: 'bg-red/20', gold: 'bg-gold/20' }
  if (!trigger) return null
  return (
    <div
      className={`fixed inset-0 pointer-events-none z-50 ${colorMap[color]}`}
      style={{ animation: 'screen-flash 0.5s ease-out forwards' }}
    />
  )
}

// ============ PROGRESS DOTS ============
export function ProgressDots({ total, current, results }: { total: number; current: number; results?: boolean[] }) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            results && i < (results?.length ?? 0)
              ? results[i] ? 'bg-green w-6' : 'bg-red w-4'
              : i === current ? 'bg-accent w-8' : 'bg-border-subtle w-4'
          }`}
        />
      ))}
      <span className="text-xs text-text-muted ml-1.5">{current + 1}/{total}</span>
    </div>
  )
}

// ============ STREAK FIRE ============
export function StreakFire({ streak }: { streak: number }) {
  if (streak < 2) return null
  const flames = Math.min(streak, 5)
  return (
    <div className="flex items-center animate-fade-in">
      {Array.from({ length: flames }).map((_, i) => (
        <span
          key={i}
          className="text-sm -ml-1 first:ml-0"
          style={{ animation: `fire-wave 0.5s ease-in-out ${i * 0.1}s 5` }}
        >
          🔥
        </span>
      ))}
    </div>
  )
}
