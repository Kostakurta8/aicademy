'use client'

import Button from '@/components/ui/Button'
import { Rocket, Sparkles, Zap, Trophy, Gamepad2 } from 'lucide-react'
import Link from 'next/link'

const features = [
  { icon: <Sparkles size={20} className="text-purple" />, label: '8 Modules', sub: 'Learn step by step' },
  { icon: <Gamepad2 size={20} className="text-blue" />, label: '13 Games', sub: 'Play & learn AI' },
  { icon: <Zap size={20} className="text-gold" />, label: 'Real AI', sub: 'Hands-on practice' },
  { icon: <Trophy size={20} className="text-orange" />, label: 'XP & Levels', sub: 'Earn rewards' },
]

export default function LandingPage() {
  return (
    <div className="animated-gradient-bg min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 md:px-6 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Animated mascot */}
          <div className="text-6xl md:text-7xl mb-3 animate-bounce" style={{ animationDuration: '2s' }}>
            🤖
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-3 leading-[1.1]">
            <span className="text-text-primary">Learn AI.</span>
            <br />
            <span className="bg-gradient-to-r from-purple via-blue to-cyan bg-clip-text text-transparent animate-rainbow-border">
              Level Up. 🚀
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-text-secondary max-w-md mx-auto mb-6 leading-relaxed">
            Games, challenges, and hands-on AI — built for kids &amp; teens who want to understand the future.
          </p>

          {/* Feature grid — more visual */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 max-w-lg mx-auto mb-8">
            {features.map(({ icon, label, sub }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl glass tap-bounce hover:scale-105 transition-transform border border-white/5"
              >
                <div className="w-10 h-10 rounded-xl bg-surface-raised flex items-center justify-center">{icon}</div>
                <span className="text-xs font-bold text-text-primary">{label}</span>
                <span className="text-[9px] text-text-muted">{sub}</span>
              </div>
            ))}
          </div>

          {/* Big CTA — pulsing */}
          <div className="flex flex-col items-center gap-3">
            <Link href="/dashboard" className="w-full max-w-xs">
              <Button size="lg" icon={<Rocket size={20} />} className="w-full text-base py-4 animate-fab-breathe">
                Start Your Adventure — Free!
              </Button>
            </Link>
            <span className="text-xs text-text-muted">No sign-up needed. Jump right in ⚡</span>
          </div>
        </div>
      </div>
    </div>
  )
}
