'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ConfettiBurst, ScreenFlash, XPPopup, TimerBar, AnimatedScore } from '@/components/ui/GameEffects'
import { Clock, RotateCcw, Trophy, Check, Zap, ArrowDown, ArrowUp, Award, Sparkles } from 'lucide-react'
import { useXPStore } from '@/stores/xp-store'

interface Milestone {
  id: string
  name: string
  year: number
  description: string
  era: 'dawn' | 'winter' | 'revival' | 'deep' | 'llm' | 'modern'
}

const eraInfo: Record<string, { label: string; color: string; gradient: string }> = {
  dawn: { label: 'Dawn of AI', color: 'text-amber-500', gradient: 'from-amber-500/20 to-amber-600/5' },
  winter: { label: 'AI Winters', color: 'text-blue', gradient: 'from-blue/20 to-blue/5' },
  revival: { label: 'Revival', color: 'text-green', gradient: 'from-green/20 to-green/5' },
  deep: { label: 'Deep Learning', color: 'text-purple', gradient: 'from-purple/20 to-purple/5' },
  llm: { label: 'LLM Era', color: 'text-pink', gradient: 'from-pink/20 to-pink/5' },
  modern: { label: 'Modern AI', color: 'text-accent', gradient: 'from-accent/20 to-accent/5' },
}

const milestones: Milestone[] = [
  { id: 'turing', name: 'Turing Test Proposed', year: 1950, era: 'dawn', description: 'Alan Turing publishes "Computing Machinery and Intelligence"' },
  { id: 'dartmouth', name: 'Dartmouth Conference', year: 1956, era: 'dawn', description: 'The term "Artificial Intelligence" is coined at this workshop' },
  { id: 'eliza', name: 'ELIZA Chatbot', year: 1966, era: 'dawn', description: 'MIT creates the first chatbot that simulates conversation' },
  { id: 'backprop', name: 'Backpropagation Popularized', year: 1986, era: 'winter', description: 'Rumelhart, Hinton & Williams popularize the training algorithm' },
  { id: 'deepblue', name: 'Deep Blue beats Kasparov', year: 1997, era: 'revival', description: 'IBM\'s chess computer defeats world champion Garry Kasparov' },
  { id: 'imagenet', name: 'AlexNet wins ImageNet', year: 2012, era: 'deep', description: 'Deep learning revolution begins with CNN breakthrough' },
  { id: 'gan', name: 'GANs Invented', year: 2014, era: 'deep', description: 'Ian Goodfellow introduces Generative Adversarial Networks' },
  { id: 'alphago', name: 'AlphaGo beats Lee Sedol', year: 2016, era: 'deep', description: 'DeepMind\'s Go AI defeats world champion 4-1' },
  { id: 'transformer', name: '"Attention Is All You Need"', year: 2017, era: 'llm', description: 'Google publishes the Transformer architecture paper' },
  { id: 'gpt2', name: 'GPT-2 Released', year: 2019, era: 'llm', description: 'OpenAI releases GPT-2, initially "too dangerous to release"' },
  { id: 'dalle', name: 'DALL-E Announced', year: 2021, era: 'llm', description: 'OpenAI reveals text-to-image generation model' },
  { id: 'chatgpt', name: 'ChatGPT Launches', year: 2022, era: 'modern', description: 'Fastest-growing app in history, reaches 100M users in 2 months' },
  { id: 'gpt4', name: 'GPT-4 Released', year: 2023, era: 'modern', description: 'Multimodal model with significantly improved reasoning' },
  { id: 'euai', name: 'EU AI Act Finalized', year: 2024, era: 'modern', description: 'World\'s first comprehensive AI regulation formally adopted' },
]

type Difficulty = 'easy' | 'medium' | 'hard'
const difficultyConfig: Record<Difficulty, { count: number; time: number; label: string }> = {
  easy: { count: 7, time: 90, label: 'Easy (7 events, 90s)' },
  medium: { count: 10, time: 75, label: 'Medium (10 events, 75s)' },
  hard: { count: 14, time: 60, label: 'Hard (14 events, 60s)' },
}

export default function AITimelinePage() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [activeMilestones, setActiveMilestones] = useState<Milestone[]>([])
  const [userOrder, setUserOrder] = useState<Milestone[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(75)
  const [timerActive, setTimerActive] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [flashColor, setFlashColor] = useState<'green' | 'red' | 'gold'>('green')
  const [revealStep, setRevealStep] = useState(-1)
  const [swapCount, setSwapCount] = useState(0)
  const addXP = useXPStore((s) => s.addXP)

  const startGame = useCallback(() => {
    const config = difficultyConfig[difficulty]
    const selected = [...milestones].sort(() => Math.random() - 0.5).slice(0, config.count)
    const sorted = [...selected].sort((a, b) => a.year - b.year)
    setActiveMilestones(sorted)
    setUserOrder([...selected].sort(() => Math.random() - 0.5))
    setTimeLeft(config.time)
    setSelectedIdx(null)
    setRevealStep(-1)
    setSwapCount(0)
    setPhase('playing')
    setTimerActive(true)
  }, [difficulty])

  // Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { setTimerActive(false); handleSubmit(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timeLeft])

  const handleSelect = (idx: number) => {
    if (phase !== 'playing') return
    if (selectedIdx === null) {
      setSelectedIdx(idx)
    } else if (selectedIdx === idx) {
      setSelectedIdx(null)
    } else {
      // Swap
      setUserOrder(prev => {
        const next = [...prev]
        ;[next[selectedIdx], next[idx]] = [next[idx], next[selectedIdx]]
        return next
      })
      setSwapCount(c => c + 1)
      setSelectedIdx(null)
    }
  }

  const moveUp = (idx: number) => {
    if (idx === 0 || phase !== 'playing') return
    setUserOrder(prev => {
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
    setSwapCount(c => c + 1)
  }

  const moveDown = (idx: number) => {
    if (idx === userOrder.length - 1 || phase !== 'playing') return
    setUserOrder(prev => {
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
    setSwapCount(c => c + 1)
  }

  const handleSubmit = useCallback(() => {
    setTimerActive(false)
    setPhase('result')
    const correctCount = userOrder.filter((m, i) => m.id === activeMilestones[i]?.id).length
    const xp = correctCount * 15 + Math.round(timeLeft * 0.5)
    addXP(xp)

    if (correctCount === activeMilestones.length) {
      setFlashColor('gold')
      setShowConfetti(true)
    } else if (correctCount >= activeMilestones.length * 0.7) {
      setFlashColor('green')
    } else {
      setFlashColor('red')
    }
    setShowFlash(true)
    setShowXP(true)
    setTimeout(() => { setShowFlash(false) }, 500)
    setTimeout(() => { setShowConfetti(false); setShowXP(false) }, 3500)

    // Reveal animation
    let step = 0
    const interval = setInterval(() => {
      setRevealStep(step)
      step++
      if (step >= activeMilestones.length) clearInterval(interval)
    }, 200)
  }, [userOrder, activeMilestones, timeLeft, addXP])

  const handleRestart = () => {
    setPhase('intro')
    setSelectedIdx(null)
    setRevealStep(-1)
  }

  const correctCount = phase === 'result' ? userOrder.filter((m, i) => m.id === activeMilestones[i]?.id).length : 0
  const config = difficultyConfig[difficulty]

  // ============ INTRO ============
  if (phase === 'intro') {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="animate-celebrate-pop">
          <Card padding="lg" glow className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-purple flex items-center justify-center shadow-xl shadow-violet-500/20 relative">
              <Clock size={40} className="text-white" />
              <div className="animate-pulse absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 to-purple" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">AI Timeline</h1>
            <p className="text-text-secondary mb-6">Arrange AI milestones in chronological order — earliest at the top!</p>

            {/* Difficulty Selector */}
            <div className="flex gap-2 justify-center mb-6">
              {(Object.entries(difficultyConfig) as [Difficulty, typeof config][]).map(([key, cfg]) => (
                <button key={key} onClick={() => setDifficulty(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    difficulty === key
                      ? 'bg-accent text-white shadow-lg shadow-accent/20'
                      : 'bg-surface-raised text-text-secondary hover:bg-surface hover:text-text-primary'
                  }`}>
                  {cfg.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6 max-w-sm mx-auto">
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-text-primary">{config.count}</p>
                <p className="text-[10px] text-text-muted">Events</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-red">{config.time}s</p>
                <p className="text-[10px] text-text-muted">Time Limit</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-gold">{config.count * 15}+</p>
                <p className="text-[10px] text-text-muted">Max XP</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-left max-w-sm mx-auto mb-6">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-raised text-xs text-text-secondary">
                <ArrowUp size={14} className="text-accent shrink-0" />
                <span>Use arrows or click two cards to swap their positions</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-raised text-xs text-text-secondary">
                <Clock size={14} className="text-red shrink-0" />
                <span>Beat the clock — leftover time earns bonus XP!</span>
              </div>
            </div>

            <Button onClick={startGame} size="lg" className="w-full max-w-sm">
              <Zap size={18} className="mr-2" /> Start Sorting
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // ============ RESULT ============
  if (phase === 'result') {
    const isPerfect = correctCount === activeMilestones.length
    const accuracy = Math.round((correctCount / activeMilestones.length) * 100)
    const xpEarned = correctCount * 15 + Math.round(timeLeft * 0.5)
    const getRank = (perfect: boolean, acc: number) => { if (perfect) return '🏆 Timeline Master'; if (acc >= 80) return '⭐ Historian'; if (acc >= 50) return '📖 Student'; return '🔰 Novice' }
    const rank = getRank(isPerfect, accuracy)

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ConfettiBurst trigger={showConfetti} color="gold" />
        <XPPopup amount={xpEarned} show={showXP} />
        <ScreenFlash trigger={showFlash} color={flashColor} />

        <div className="animate-fade-in mb-6">
          <Card padding="lg" glow={isPerfect} className="text-center mb-6">
            <div className="animate-celebrate-pop">
              {isPerfect ? <Award size={48} className="text-gold mx-auto mb-3" /> : <Trophy size={48} className="text-accent mx-auto mb-3" />}
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">{isPerfect ? 'Perfect Timeline!' : 'Timeline Submitted!'}</h2>
            <p className="text-text-secondary mb-1">{rank}</p>
            <div className="grid grid-cols-4 gap-3 my-6">
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-green">{correctCount}/{activeMilestones.length}</p>
                <p className="text-[10px] text-text-muted">Correct</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-accent">{accuracy}%</p>
                <p className="text-[10px] text-text-muted">Accuracy</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-purple">{swapCount}</p>
                <p className="text-[10px] text-text-muted">Swaps</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-gold">+{xpEarned}</p>
                <p className="text-[10px] text-text-muted">XP</p>
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-1 mb-6">
          {userOrder.map((milestone, idx) => {
            const isCorrectPos = milestone.id === activeMilestones[idx]?.id
            const revealed = revealStep >= idx
            const era = eraInfo[milestone.era]

            return (
              <div
                key={milestone.id}
                style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}
                className={`animate-fade-in flex items-center gap-3 ${revealed ? 'opacity-100' : 'opacity-30'}`}
              >
                {/* Timeline connector */}
                <div className="flex flex-col items-center w-8 shrink-0">
                  <div className={`w-3 h-3 rounded-full border-2 ${isCorrectPos ? 'bg-green border-green' : 'bg-red border-red'}`} />
                  {idx < userOrder.length - 1 && <div className={`w-0.5 h-6 ${isCorrectPos ? 'bg-green/30' : 'bg-red/30'}`} />}
                </div>

                <div className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                  isCorrectPos ? 'border-green bg-green/5' : 'border-red bg-red/5'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full bg-gradient-to-r ${era.gradient} ${era.color} font-medium`}>
                        {milestone.year}
                      </span>
                      <p className="text-sm font-semibold text-text-primary">{milestone.name}</p>
                    </div>
                    {isCorrectPos ? <Check size={16} className="text-green" /> : <span className="text-xs text-red font-mono">→ #{activeMilestones.findIndex(m => m.id === milestone.id) + 1}</span>}
                  </div>
                  <p className="text-xs text-text-muted mt-1">{milestone.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <Button onClick={handleRestart} icon={<RotateCcw size={16} />} size="lg" className="w-full">Play Again</Button>
      </div>
    )
  }

  // ============ PLAYING ============
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="animate-fade-in mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Clock className="text-violet-500" size={24} /> AI Timeline
            </h1>
            <p className="text-xs text-text-muted">
              Arrange earliest → latest · {swapCount} swap{swapCount === 1 ? '' : 's'}
              {selectedIdx !== null && <span className="ml-2 text-accent">✦ Select another card to swap</span>}
            </p>
          </div>
          <AnimatedScore value={swapCount} label="Swaps" color="text-purple" size="sm" />
        </div>
        <TimerBar timeLeft={timeLeft} maxTime={config.time} warning={15} />
      </div>

      {/* Instructions */}
      <Card padding="sm" className="mb-4 text-center">
        <p className="text-xs text-text-secondary">
          🔄 Click two cards to swap them, or use ↑↓ arrows. Sort from <span className="font-bold text-text-primary">earliest</span> at top to <span className="font-bold text-text-primary">latest</span> at bottom.
        </p>
      </Card>

      {/* Sortable List */}
      <div className="space-y-2 mb-6">
          {userOrder.map((milestone, idx) => {
            const isSelected = selectedIdx === idx
            const era = eraInfo[milestone.era]

            return (
              <div
                key={milestone.id}
                style={{ animationDelay: `${idx * 0.02}s`, animationFillMode: 'both' }}
                className={`animate-fade-in flex items-center gap-2 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10 scale-[1.02]'
                    : 'border-border-subtle bg-surface hover:border-accent/30 hover:shadow-md'
                }`}
                onClick={() => handleSelect(idx)}
              >
                {/* Arrows */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); moveUp(idx) }} disabled={idx === 0} title="Move up"
                    className="p-0.5 rounded hover:bg-surface-raised text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer disabled:cursor-default transition-colors">
                    <ArrowUp size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveDown(idx) }} disabled={idx === userOrder.length - 1} title="Move down"
                    className="p-0.5 rounded hover:bg-surface-raised text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer disabled:cursor-default transition-colors">
                    <ArrowDown size={14} />
                  </button>
                </div>

                {/* Position number */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  isSelected ? 'bg-accent text-white' : 'bg-surface-raised text-text-muted'
                }`}>
                  {idx + 1}
                </div>

                {/* Era badge */}
                <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${era.gradient} shrink-0`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{milestone.name}</p>
                  <p className="text-xs text-text-muted truncate">{milestone.description}</p>
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="animate-celebrate-pop">
                    <Sparkles size={16} className="text-accent" />
                  </div>
                )}
              </div>
            )
          })}
      </div>

      <Button onClick={handleSubmit} size="lg" className="w-full">
        <Check size={18} className="mr-2" /> Lock In Timeline
      </Button>
    </div>
  )
}
