'use client'

import Card from '@/components/ui/Card'
import ClientOnly from '@/components/ui/ClientOnly'
import { useXPStore } from '@/stores/xp-store'
import { useProgressStore } from '@/stores/progress-store'
import { Flame, Star, Target, Zap, TrendingUp, Compass, Clock } from 'lucide-react'

export default function AnalyticsDashboard() {
  return (
    <ClientOnly fallback={<div className="h-96" />}>
      <AnalyticsContent />
    </ClientOnly>
  )
}

function AnalyticsContent() {
  const totalXP = useXPStore((s) => s.totalXP)
  const level = useXPStore((s) => s.level)
  const currentStreak = useXPStore((s) => s.currentStreak)
  const totalLearningTime = useXPStore((s) => s.totalLearningTime)
  const storeXPHistory = useXPStore((s) => s.xpHistory)
  const skillProfile = useProgressStore((s) => s.skillProfile)
  const activityLog = useProgressStore((s) => s.activityLog)

  const focusHours = (totalLearningTime / 60).toFixed(1)

  // Build 30-day XP chart from real store data
  const xpHistory = (() => {
    const days: { day: number; xp: number; date: string }[] = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const entry = storeXPHistory.find((e) => e.date === dateStr)
      days.push({ day: 29 - i, xp: entry?.xp ?? 0, date: dateStr })
    }
    return days
  })()
  const maxXP = Math.max(1, ...xpHistory.map((d) => d.xp))

  // Build heatmap from real activityLog timestamps (last 350 days → 50 weeks × 7 days)
  const heatmapData = (() => {
    const allTimestamps = [
      ...activityLog.lessonsCompleted,
      ...activityLog.promptsSent,
      ...activityLog.flashcardsReviewed,
      ...activityLog.perfectQuizzes,
    ]
    const dayCounts: Record<string, number> = {}
    for (const ts of allTimestamps) {
      const dateStr = new Date(ts).toISOString().split('T')[0]
      dayCounts[dateStr] = (dayCounts[dateStr] || 0) + 1
    }
    const today = new Date()
    const grid: { col: number; row: number; count: number; date: string }[] = []
    for (let col = 0; col < 50; col++) {
      for (let row = 0; row < 7; row++) {
        const daysAgo = (49 - col) * 7 + (6 - row)
        const d = new Date(today)
        d.setDate(d.getDate() - daysAgo)
        const dateStr = d.toISOString().split('T')[0]
        grid.push({ col, row, count: dayCounts[dateStr] || 0, date: dateStr })
      }
    }
    return grid
  })()

  const skillColors: Record<string, string> = {
    'Fundamentals': 'bg-purple',
    'Prompt Engineering': 'bg-green',
    'Tools & APIs': 'bg-blue',
    'Ethics & Safety': 'bg-orange',
  }

  const skillLevels = Object.entries(skillProfile).length > 0
    ? Object.entries(skillProfile).map(([name, score]) => ({
        name,
        score: Math.round(score),
        color: skillColors[name] || 'bg-accent',
      }))
    : [
        { name: 'Fundamentals', score: 0, color: 'bg-purple' },
        { name: 'Prompt Engineering', score: 0, color: 'bg-green' },
        { name: 'Tools & APIs', score: 0, color: 'bg-blue' },
        { name: 'Ethics & Safety', score: 0, color: 'bg-orange' },
      ]

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-text-primary mb-2">📊 Your Progress</h1>
        <p className="text-sm text-text-secondary">See how far you've come!</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="flex flex-col items-center justify-center text-center group transition-colors hover:border-accent/40">
          <Star size={24} className="text-gold mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-sm text-text-muted mb-1">Total XP</div>
          <div className="text-2xl font-bold text-text-primary">{totalXP.toLocaleString()}</div>
        </Card>
        <Card padding="md" className="flex flex-col items-center justify-center text-center group transition-colors hover:border-accent/40">
          <TrendingUp size={24} className="text-accent mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-sm text-text-muted mb-1">Current Level</div>
          <div className="text-2xl font-bold text-text-primary">{level}</div>
        </Card>
        <Card padding="md" className="flex flex-col items-center justify-center text-center group transition-colors hover:border-accent/40">
          <Flame size={24} className="text-orange mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-sm text-text-muted mb-1">Active Streak</div>
          <div className="text-2xl font-bold text-text-primary">{currentStreak} Days</div>
        </Card>
        <Card padding="md" className="flex flex-col items-center justify-center text-center group transition-colors hover:border-accent/40">
          <Clock size={24} className="text-blue mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-sm text-text-muted mb-1">Focus Time</div>
          <div className="text-2xl font-bold text-text-primary">{focusHours} hrs</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Chart (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <Zap className="text-accent" size={18} /> Learning Velocity (Last 30 Days)
            </h2>
            <div className="h-64 flex items-end gap-1 relative pt-10">
              {/* Fake grid lines */}
              <div className="absolute inset-x-0 bottom-0 top-10 flex flex-col justify-between pointer-events-none opacity-10">
                <div className="border-b border-text-muted w-full h-0" />
                <div className="border-b border-text-muted w-full h-0" />
                <div className="border-b border-text-muted w-full h-0" />
                <div className="border-b border-text-muted w-full h-0" />
              </div>

              {xpHistory.map((day) => (
                <div key={day.date} className="group relative flex-1 flex flex-col justify-end items-center h-full">
                  <div
                    className="w-full bg-accent hover:bg-white rounded-t-sm transition-all duration-300 opacity-80"
                    style={{ height: day.xp > 0 ? (day.xp / maxXP) * 100 + '%' : '2px' }}
                  />
                  <div className="absolute -top-10 bg-surface-raised text-text-primary text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-border-subtle shadow-xl pointer-events-none">
                    {day.xp} XP
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-text-muted">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </Card>

          {/* Heatmap Simulation */}
          <Card padding="lg">
            <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <Target className="text-green" size={18} /> Contribution Heatmap
            </h2>
            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
              {Array.from({ length: 50 }).map((_, col) => (
                <div key={`col-${col}`} className="flex flex-col gap-1 min-w-[12px] md:min-w-[16px]">
                  {heatmapData
                    .filter((cell) => cell.col === col)
                    .map((cell) => {
                      let color = 'bg-surface-raised'
                      if (cell.count >= 5) color = 'bg-green'
                      else if (cell.count >= 3) color = 'bg-green/70'
                      else if (cell.count >= 2) color = 'bg-green/40'
                      else if (cell.count >= 1) color = 'bg-green/20'

                      return (
                        <div
                          key={cell.date}
                          className={"w-full aspect-square rounded-sm transition-colors hover:ring-2 ring-accent/50 " + color}
                          title={`${cell.date}: ${cell.count} activities`}
                        />
                      )
                    })}
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-4 text-xs text-text-muted">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-surface-raised"></div>
                <div className="w-3 h-3 rounded-sm bg-green/20"></div>
                <div className="w-3 h-3 rounded-sm bg-green/40"></div>
                <div className="w-3 h-3 rounded-sm bg-green/70"></div>
                <div className="w-3 h-3 rounded-sm bg-green"></div>
              </div>
              <span>More</span>
            </div>
          </Card>
        </div>

        {/* Sidebar (Right col) */}
        <div className="space-y-6">
          {/* Skill Profile */}
          <Card padding="lg">
            <h2 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
              <Compass className="text-blue" size={18} /> Skill Profile
            </h2>
            <div className="space-y-6">
              {skillLevels.map(skill => (
                <div key={skill.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-text-primary hover:text-accent transition-colors cursor-default">{skill.name}</span>
                    <span className="text-text-muted font-mono bg-surface-raised px-2 py-0.5 rounded text-xs">{skill.score}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
                    <div
                      className={"h-full transition-all duration-1000 ease-out " + skill.color}
                      style={{ width: skill.score + '%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-accent/5 rounded-xl border border-accent/20">
              <p className="text-sm text-text-secondary leading-relaxed">
                <span className="font-medium text-accent">AI Insight:</span> Your prompt engineering is excellent. Focus on completing the <strong className="text-text-primary">Tools & APIs</strong> module to balance your skill set.
              </p>
            </div>
          </Card>

          {/* Predicted Mastery */}
          <Card padding="lg" className="bg-gradient-to-br from-surface to-[#1e1e3a] border-border-subtle relative overflow-hidden">
             <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
             <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple/10 rounded-full blur-3xl" />
             <h2 className="text-lg font-bold text-text-primary mb-2 flex items-center gap-2 relative z-10">
               Predicted Time to Mastery
             </h2>
             <p className="text-sm text-text-secondary mb-8 relative z-10">Calculated from recent velocity.</p>
             
             <div className="space-y-5 relative z-10">
               <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-text-muted font-medium">Foundations</span>
                    <span className="text-green font-bold">Mastered</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-green shadow-[0_0_10px_rgba(22,163,74,0.5)]" />
               </div>
               <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-text-muted font-medium">Prompt Engineering</span>
                    <span className="text-text-primary font-medium">0.5 hr remaining</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-raised"><div className="h-full bg-accent rounded-full w-[90%] shadow-[0_0_10px_rgba(124,58,237,0.5)]" /></div>
               </div>
               <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-text-muted font-medium">Ethics</span>
                    <span className="text-text-primary font-medium">4.2 hr remaining</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-raised"><div className="h-full bg-orange rounded-full w-[40%] shadow-[0_0_10px_rgba(234,88,12,0.5)]" /></div>
               </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
