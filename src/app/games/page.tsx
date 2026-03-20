'use client'

import { useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  Gamepad2, Star, Target, Flame, Medal, ChevronRight, Sparkles, Lock, Crown,
} from 'lucide-react'
import { useXPStore } from '@/stores/xp-store'
import { useProgressStore } from '@/stores/progress-store'
import { useSubscriptionStore, FREE_GAMES } from '@/stores/subscription-store'
import { dailyChallenges, games, difficultyColor } from '@/data/games'

type Tab = 'games' | 'challenges' | 'leaderboard'

export default function GamesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('games')
  const xp = useXPStore((s) => s.totalXP)
  const completedChallenges = useProgressStore((s) => s.completedChallenges)
  const canAccessGame = useSubscriptionStore((s) => s.canAccessGame)
  const isPro = useSubscriptionStore((s) => s.isPro())

  const completedCount = dailyChallenges.filter(c => completedChallenges.includes(c.id)).length

  const tabs = [
    { id: 'games' as const, label: 'Game Arcade', icon: Gamepad2, count: games.length },
    { id: 'challenges' as const, label: 'Daily Quests', icon: Target, count: dailyChallenges.length - completedCount },
    { id: 'leaderboard' as const, label: 'Your Stats', icon: Medal },
  ]

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="animate-fade-in mb-8 text-center relative">
        <div
          className="animate-celebrate-pop w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-purple via-pink to-orange flex items-center justify-center shadow-lg shadow-purple/20 relative"
        >
          <Gamepad2 size={40} className="text-white" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple via-pink to-orange animate-pulse opacity-30" />
        </div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Play & <span className="bg-gradient-to-r from-purple via-pink to-orange bg-clip-text text-transparent">Compete</span>
        </h1>
        <p className="text-text-secondary max-w-lg mx-auto">
          Learn AI through play. Every game teaches real concepts — and earns you XP.
        </p>

        {/* Stats banner */}
        <div
          className="animate-fade-in flex items-center justify-center gap-8 mt-5">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center"><Gamepad2 size={16} className="text-purple" /></div>
            <div className="text-left"><p className="font-bold text-text-primary">{games.length}</p><p className="text-[10px] text-text-muted">Games</p></div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center"><Star size={16} className="text-gold" /></div>
            <div className="text-left"><p className="font-bold text-text-primary">{xp}</p><p className="text-[10px] text-text-muted">Total XP</p></div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center"><Flame size={16} className="text-orange" /></div>
            <div className="text-left"><p className="font-bold text-text-primary">0</p><p className="text-[10px] text-text-muted">Win Streak</p></div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-raised mb-8 max-w-md mx-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.id ? 'bg-accent text-white shadow-md' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-surface'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
        {activeTab === 'games' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game, idx) => {
                const isFree = FREE_GAMES.includes(game.slug as typeof FREE_GAMES[number])
                const locked = !canAccessGame(game.slug)
                return (
                <div
                  key={game.slug}
                  className="animate-fade-in"
                  style={{ animationDelay: `${idx * 0.04}s`, animationFillMode: 'both' }}
                >
                  <Link href={locked ? '/pricing' : `/games/${game.slug}`}>
                    <Card className={`h-full group cursor-pointer relative overflow-hidden ${locked ? 'opacity-80 hover:opacity-100' : ''}`} padding="md">
                      {locked && (
                        <div className="absolute inset-0 bg-surface/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-2xl">
                          <div className="w-10 h-10 rounded-full bg-purple/10 flex items-center justify-center mb-1.5">
                            <Lock size={18} className="text-purple" />
                          </div>
                          <p className="text-xs font-semibold text-text-primary">Pro Game</p>
                          <p className="text-[10px] text-text-muted flex items-center gap-1"><Crown size={10} className="text-purple" /> Unlock with Pro</p>
                        </div>
                      )}
                      <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-[0.03] rounded-2xl transition-opacity duration-200`} />

                      <div className="flex items-start justify-between mb-3 relative">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                          <game.icon size={24} className="text-white" />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-raised text-text-muted">{game.tag}</span>
                          {isFree && !isPro && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green/10 text-green font-medium border border-green/20">FREE</span>}
                          <span className="text-[10px] text-text-muted">~{game.playTime}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-text-primary mb-1 group-hover:text-accent transition-colors relative">
                        {game.title}
                      </h3>
                      <p className="text-xs text-text-secondary mb-3 leading-relaxed relative">{game.description}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-border-subtle relative">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyColor[game.difficulty]}`}>{game.difficulty}</span>
                          <span className="flex items-center gap-1 text-xs text-gold font-medium"><Star size={10} /> {game.xp}</span>
                        </div>
                        <div className="hover:translate-x-1 transition-transform text-text-muted group-hover:text-accent">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="animate-fade-in">
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-text-primary mb-1">Daily Quests</h2>
                <p className="text-sm text-text-secondary">Complete quests to earn bonus XP. Play games and explore tools!</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="w-full max-w-xs h-2 rounded-full bg-border-subtle overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-purple transition-all duration-300"
                      style={{ width: `${(completedCount / dailyChallenges.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-muted">{completedCount}/{dailyChallenges.length}</span>
                </div>
              </div>
              {dailyChallenges.map((quest, idx) => {
                const done = completedChallenges.includes(quest.id)
                return (
                  <div key={quest.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}>
                    <Link href={quest.href}>
                      <Card padding="md" className={`flex items-center gap-4 group cursor-pointer hover:border-accent/30 transition-all ${done ? 'opacity-60' : ''}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110 ${done ? 'bg-green/10' : 'bg-surface-raised'}`}>
                          {done ? '✅' : quest.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm font-bold ${done ? 'text-text-muted line-through' : 'text-text-primary group-hover:text-accent'} transition-colors`}>{quest.title}</h3>
                          <p className="text-xs text-text-secondary truncate">{quest.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center gap-1 text-xs font-bold text-gold"><Star size={12} />{quest.xp}</span>
                          {done ? (
                            <span className="text-green text-xs font-bold">✓ Done</span>
                          ) : (
                            <div className="hover:translate-x-0.5 transition-transform text-text-muted group-hover:text-accent">
                              <ChevronRight size={16} />
                            </div>
                          )}
                        </div>
                      </Card>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="animate-fade-in">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-text-primary mb-1">Your Game Stats</h2>
                <p className="text-sm text-text-secondary">Track your progress across all games</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Games Played', value: '0', icon: Gamepad2, color: 'text-purple' },
                  { label: 'Total XP', value: xp.toString(), icon: Star, color: 'text-gold' },
                  { label: 'Perfect Scores', value: '0', icon: Sparkles, color: 'text-pink' },
                  { label: 'Best Streak', value: '0', icon: Flame, color: 'text-orange' },
                ].map((stat, i) => (
                  <div key={stat.label} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}>
                    <Card padding="md" className="text-center">
                      <stat.icon size={20} className={`${stat.color} mx-auto mb-2`} />
                      <p className="text-xl font-bold text-text-primary">{stat.value}</p>
                      <p className="text-[10px] text-text-muted">{stat.label}</p>
                    </Card>
                  </div>
                ))}
              </div>
              <Card padding="lg" className="text-center">
                <Sparkles size={32} className="text-accent mx-auto mb-3 opacity-50" />
                <p className="text-sm text-text-secondary">Play games to unlock achievements and track your best scores!</p>
                <Button onClick={() => setActiveTab('games')} variant="primary" className="mt-4">Start Playing</Button>
              </Card>
            </div>
          </div>
        )}
    </div>
  )
}
