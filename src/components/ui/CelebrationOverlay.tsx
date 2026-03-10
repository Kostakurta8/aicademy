'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, Star, Flame, Zap, Rocket } from 'lucide-react'
import { playLevelUp, hapticCelebrate } from '@/lib/sounds'
import { registerCelebrationTrigger, unregisterCelebrationTrigger } from '@/lib/celebrate'
import type { CelebrationType, CelebrationData } from '@/lib/celebrate'

const celebrationConfig: Record<CelebrationType, { icon: typeof Trophy; gradient: string; emoji: string }> = {
  'level-up': { icon: Star, gradient: 'from-purple via-blue to-cyan', emoji: '⭐' },
  'streak': { icon: Flame, gradient: 'from-orange via-red to-pink', emoji: '🔥' },
  'lesson-complete': { icon: Zap, gradient: 'from-green via-cyan to-blue', emoji: '⚡' },
  'module-complete': { icon: Trophy, gradient: 'from-gold via-orange to-red', emoji: '🏆' },
  'achievement': { icon: Rocket, gradient: 'from-pink via-purple to-blue', emoji: '🚀' },
}

// Seeded random for confetti — deterministic per index
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

// Pre-generate confetti particle data
function generateParticles(count: number) {
  const colors = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
  return Array.from({ length: count }, (_, i) => {
    const r1 = seededRandom(i)
    const r2 = seededRandom(i + 100)
    const r3 = seededRandom(i + 200)
    const r4 = seededRandom(i + 300)
    const r5 = seededRandom(i + 400)
    const r6 = seededRandom(i + 500)
    const r7 = seededRandom(i + 600)
    const size = 6 + r1 * 6
    return {
      id: `confetti-${i}`,
      color: colors[i % colors.length],
      size,
      startX: r2 * 100,
      drift: (r3 - 0.5) * 200,
      delay: r4 * 0.5,
      rotation: r5 * 720 - 360,
      duration: 2 + r6,
      heightMultiplier: r7 > 0.5 ? 1 : 2.5,
      borderRadius: r7 > 0.5 ? '50%' : '2px',
    }
  })
}

const particles = generateParticles(15)

// Confetti particle component
function ConfettiParticle({ data }: Readonly<{ data: (typeof particles)[number] }>) {
  return (
    <div
      className="fixed top-0 pointer-events-none z-[200]"
      style={{
        left: `${data.startX}vw`,
        width: data.size,
        height: data.size * data.heightMultiplier,
        backgroundColor: data.color,
        borderRadius: data.borderRadius,
        animation: `confetti-fall ${data.duration}s ease-in ${data.delay}s forwards`,
        '--confetti-drift': `${data.drift}px`,
        '--confetti-r': `${data.rotation}deg`,
      } as React.CSSProperties}
    />
  )
}

export default function CelebrationOverlay() {
  const [celebration, setCelebration] = useState<CelebrationData | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const trigger = useCallback((data: CelebrationData) => {
    setCelebration(data)
    setShowConfetti(true)
    try { playLevelUp() } catch {}
    try { hapticCelebrate() } catch {}
    // Auto-dismiss after 3 seconds
    setTimeout(() => setCelebration(null), 3000)
    setTimeout(() => setShowConfetti(false), 3500)
  }, [])

  useEffect(() => {
    registerCelebrationTrigger(trigger)
    return () => { unregisterCelebrationTrigger() }
  }, [trigger])

  const config = celebration ? celebrationConfig[celebration.type] : null
  const Icon = config?.icon ?? Star

  return (
    <>
      {/* Confetti */}
      {showConfetti && particles.map((p) => (
        <ConfettiParticle key={p.id} data={p} />
      ))}

      {/* Celebration card */}
      {celebration && config && (
        <div
          className="fixed inset-0 z-[190] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setCelebration(null)}
        >
          <div
            className="relative max-w-xs w-full p-6 rounded-3xl bg-surface border border-border-subtle shadow-2xl text-center animate-celebrate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow background */}
            <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${config.gradient} opacity-10 blur-xl`} />

            {/* Content */}
            <div className="relative z-10">
              <div className="text-5xl mb-3 animate-bounce-in">{config.emoji}</div>

              <h2
                className="text-xl font-black text-text-primary mb-1 animate-fade-in"
                style={{ animationDelay: '0.15s', animationFillMode: 'both' }}
              >
                {celebration.title}
              </h2>

              {celebration.value && (
                <div
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r ${config.gradient} text-white text-lg font-black mb-2 animate-celebrate-pop`}
                  style={{ animationDelay: '0.25s', animationFillMode: 'both' }}
                >
                  <Icon size={18} />
                  {celebration.value}
                </div>
              )}

              <p
                className="text-sm text-text-secondary animate-fade-in"
                style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
              >
                {celebration.subtitle}
              </p>

              <button
                onClick={() => setCelebration(null)}
                className="mt-4 px-6 py-2 rounded-full bg-accent text-white text-sm font-bold tap-bounce animate-fade-in"
                style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
              >
                Nice! 🎉
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
