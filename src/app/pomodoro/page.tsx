'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useXPStore } from '@/stores/xp-store'
import { Timer, Play, Pause, RotateCcw, Coffee, BookOpen } from 'lucide-react'

type Mode = 'work' | 'break'

export default function PomodoroPage() {
  const [workMinutes, setWorkMinutes] = useState(25)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [mode, setMode] = useState<Mode>('work')
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSeconds = mode === 'work' ? workMinutes * 60 : breakMinutes * 60
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  const switchMode = useCallback(() => {
    if (mode === 'work') {
      setSessions((s) => s + 1)
      useXPStore.getState().addLearningTime(workMinutes)
      setMode('break')
      setSecondsLeft(breakMinutes * 60)
    } else {
      setMode('work')
      setSecondsLeft(workMinutes * 60)
    }
    setIsRunning(false)
  }, [mode, workMinutes, breakMinutes])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            switchMode()
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, switchMode])

  const handleReset = () => {
    setIsRunning(false)
    setSecondsLeft(mode === 'work' ? workMinutes * 60 : breakMinutes * 60)
  }

  const handleFullReset = () => {
    setIsRunning(false)
    setMode('work')
    setSecondsLeft(workMinutes * 60)
    setSessions(0)
  }

  const circumference = 2 * Math.PI * 120

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8 text-center animate-fade-in">
        <h1 className="text-3xl font-bold text-text-primary mb-2">⏰ Focus Timer</h1>
        <p className="text-text-secondary text-sm">Stay focused while you learn!</p>
      </div>

      {/* Timer circle */}
      <Card padding="lg" className="mb-6">
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-64 mb-6">
            <svg viewBox="0 0 260 260" className="w-full h-full transform -rotate-90">
              <circle cx="130" cy="130" r="120" fill="none" stroke="currentColor" strokeWidth="6" className="text-border-subtle" />
              <circle
                cx="130" cy="130" r="120" fill="none" strokeWidth="6" strokeLinecap="round"
                className={`${mode === 'work' ? 'text-accent' : 'text-green'} transition-all duration-500`}
                stroke="currentColor"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (progress / 100) * circumference}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-medium text-text-muted uppercase mb-1 flex items-center gap-1">
                {mode === 'work' ? <><BookOpen size={12} /> Focus</> : <><Coffee size={12} /> Break</>}
              </span>
              <span className="text-5xl font-bold text-text-primary font-mono">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mb-6">
            <Button onClick={() => setIsRunning(!isRunning)} size="lg"
              icon={isRunning ? <Pause size={20} /> : <Play size={20} />}>
              {isRunning ? 'Pause' : 'Start'}
            </Button>
            <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={16} />}>Reset</Button>
          </div>

          {/* Session counter */}
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <span>Sessions today: <strong className="text-text-primary">{sessions}</strong></span>
            <span>Total focus: <strong className="text-text-primary">{sessions * workMinutes} min</strong></span>
          </div>
        </div>
      </Card>

      {/* Settings */}
      <Card padding="md">
        <h3 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Timer size={16} className="text-accent" /> Timer Settings
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-secondary block mb-1">Focus (minutes)</label>
            <input type="number" min={1} max={90} value={workMinutes}
              onChange={(e) => { const v = parseInt(e.target.value) || 25; setWorkMinutes(v); if (mode === 'work' && !isRunning) setSecondsLeft(v * 60) }}
              className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" />
          </div>
          <div>
            <label className="text-sm text-text-secondary block mb-1">Break (minutes)</label>
            <input type="number" min={1} max={30} value={breakMinutes}
              onChange={(e) => { const v = parseInt(e.target.value) || 5; setBreakMinutes(v); if (mode === 'break' && !isRunning) setSecondsLeft(v * 60) }}
              className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {[[25, 5], [50, 10], [90, 15]].map(([w, b]) => (
            <button key={w} onClick={() => { setWorkMinutes(w); setBreakMinutes(b); if (!isRunning) { setSecondsLeft(w * 60); setMode('work') } }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                workMinutes === w ? 'bg-accent text-white' : 'bg-surface-raised text-text-secondary hover:bg-border-subtle/30'
              }`}>
              {w}/{b}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
