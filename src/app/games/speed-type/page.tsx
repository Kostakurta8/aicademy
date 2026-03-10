'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ConfettiBurst, ComboIndicator, AnimatedScore, ScreenFlash, XPPopup, StreakFire } from '@/components/ui/GameEffects'
import { Keyboard, RotateCcw, Trophy, Zap, Star, ArrowRight } from 'lucide-react'
import { useXPStore } from '@/stores/xp-store'

const terms = [
  { term: 'transformer', definition: 'Neural network architecture using self-attention, basis for GPT/Claude/Gemini' },
  { term: 'token', definition: 'A chunk of text (~¾ of a word) that LLMs process as a single unit' },
  { term: 'embedding', definition: 'A dense vector representation of words that captures semantic meaning' },
  { term: 'hallucination', definition: 'When an AI confidently generates false or fabricated information' },
  { term: 'fine-tuning', definition: 'Training a pre-trained model on specific data for a particular task' },
  { term: 'attention', definition: 'Mechanism allowing each token to weigh importance of every other token' },
  { term: 'prompt', definition: 'The text instruction given to an AI model to generate a response' },
  { term: 'temperature', definition: 'Parameter controlling randomness: 0 = deterministic, 1 = creative' },
  { term: 'inference', definition: 'Running a trained model to generate predictions or outputs' },
  { term: 'parameter', definition: 'A learned weight in a neural network, adjusted during training' },
  { term: 'gradient', definition: 'The direction and rate of change used to update model weights' },
  { term: 'overfitting', definition: 'When a model memorizes training data instead of learning general patterns' },
  { term: 'latent space', definition: 'A compressed representation where similar concepts cluster together' },
  { term: 'diffusion', definition: 'Generative technique that learns to reverse a noise-adding process' },
  { term: 'quantization', definition: 'Reducing model precision (32-bit to 4-bit) to save memory and speed' },
  { term: 'dropout', definition: 'Randomly disabling neurons during training to prevent overfitting' },
  { term: 'backpropagation', definition: 'Algorithm that computes gradients to update weights through the network' },
  { term: 'epoch', definition: 'One complete pass through the entire training dataset' },
  { term: 'batch size', definition: 'Number of training examples processed before updating model weights' },
  { term: 'softmax', definition: 'Function that converts logits into a probability distribution summing to 1' },
]

const keyboardRows = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
]

export default function SpeedTypePage() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'finished'>('intro')
  const [termIdx, setTermIdx] = useState(0)
  const [input, setInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(60)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [skipped, setSkipped] = useState(0)
  const [shuffled, setShuffled] = useState<typeof terms>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [flashColor, setFlashColor] = useState<'green' | 'red' | 'gold'>('green')
  const [lastKey, setLastKey] = useState('')
  const [completedTerms, setCompletedTerms] = useState<Array<{ term: string; time: number }>>([])
  const [termStartTime, setTermStartTime] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const addXP = useXPStore((s) => s.addXP)

  const startGame = useCallback(() => {
    const shuffledTerms = [...terms].sort(() => Math.random() - 0.5)
    setShuffled(shuffledTerms)
    setPhase('playing')
    setTermIdx(0); setInput(''); setTimeLeft(60); setScore(0); setStreak(0); setBestStreak(0)
    setCorrect(0); setSkipped(0); setCompletedTerms([])
    setTermStartTime(Date.now())
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  useEffect(() => {
    if (phase !== 'playing' || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setPhase('finished')
          addXP(score)
          setShowConfetti(true)
          setShowXP(true)
          setTimeout(() => { setShowConfetti(false); setShowXP(false) }, 3000)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [phase, timeLeft, score, addXP])

  const currentTerm = shuffled[termIdx % shuffled.length]

  const handleInput = (value: string) => {
    setInput(value)
    if (!currentTerm) return
    setLastKey(value.slice(-1).toLowerCase())

    if (value.toLowerCase().trim() === currentTerm.term.toLowerCase()) {
      const timeTaken = Math.round((Date.now() - termStartTime) / 100) / 10
      const streakBonus = Math.min(streak * 3, 30)
      const speedBonus = timeTaken < 3 ? 15 : timeTaken < 5 ? 8 : 0
      const points = 10 + streakBonus + speedBonus
      setScore(s => s + points)
      setStreak(s => { const n = s + 1; setBestStreak(b => Math.max(b, n)); return n })
      setCorrect(c => c + 1)
      setCompletedTerms(prev => [...prev, { term: currentTerm.term, time: timeTaken }])
      setTermIdx(i => i + 1)
      setInput('')
      setTermStartTime(Date.now())
      setFlashColor('green')
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 300)
    }
  }

  const handleSkip = () => {
    setStreak(0)
    setSkipped(w => w + 1)
    setTermIdx(i => i + 1)
    setInput('')
    setTermStartTime(Date.now())
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setLastKey(e.key.toLowerCase())
  }

  // Character matching for visual highlighting
  const getCharStatus = (charIdx: number) => {
    if (!currentTerm || charIdx >= currentTerm.term.length) return 'pending'
    if (charIdx >= input.length) return 'pending'
    return input[charIdx]?.toLowerCase() === currentTerm.term[charIdx]?.toLowerCase() ? 'correct' : 'wrong'
  }

  // ============ INTRO ============
  if (phase === 'intro') {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="animate-celebrate-pop">
          <Card padding="lg" glow className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan flex items-center justify-center shadow-xl shadow-emerald-500/20 relative">
              <Keyboard size={40} className="text-white" />
              <div className="animate-pulse absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan opacity-30" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Speed Type AI</h1>
            <p className="text-text-secondary mb-6">Type AI terms as fast as possible! 60 seconds. Combos. Skill.</p>
            <div className="grid grid-cols-3 gap-3 mb-6 max-w-sm mx-auto">
              <div className="p-3 rounded-xl bg-surface-raised"><p className="text-lg font-bold text-text-primary">60s</p><p className="text-[10px] text-text-muted">Time Limit</p></div>
              <div className="p-3 rounded-xl bg-surface-raised"><p className="text-lg font-bold text-text-primary">{terms.length}</p><p className="text-[10px] text-text-muted">AI Terms</p></div>
              <div className="p-3 rounded-xl bg-surface-raised"><p className="text-lg font-bold text-orange">30</p><p className="text-[10px] text-text-muted">Max Combo Bonus</p></div>
            </div>
            <Button onClick={startGame} size="lg" className="w-full max-w-sm"><Zap size={18} className="mr-2" /> Start!</Button>
          </Card>
        </div>
      </div>
    )
  }

  // ============ FINISHED ============
  if (phase === 'finished') {
    const wpm = correct
    const avgTime = completedTerms.length > 0 ? (completedTerms.reduce((s, t) => s + t.time, 0) / completedTerms.length).toFixed(1) : '—'
    const rank = correct >= 15 ? '⚡ Typing Legend' : correct >= 10 ? '🔥 Speed Demon' : correct >= 6 ? '⌨️ Quick Fingers' : '🐢 Getting Started'
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ConfettiBurst trigger={showConfetti} />
        <XPPopup amount={score} show={showXP} />
        <div className="animate-celebrate-pop">
          <Card padding="lg" glow className="text-center">
            <Trophy size={48} className="text-gold mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-text-primary mb-1">Time&apos;s Up!</h2>
            <p className="text-text-secondary mb-1">{rank}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
              <div className="p-3 rounded-xl bg-surface-raised"><p className="text-xl font-bold text-accent">{score}</p><p className="text-[10px] text-text-muted">Score</p></div>
              <div className="p-3 rounded-xl bg-surface-raised"><p className="text-xl font-bold text-green">{correct}</p><p className="text-[10px] text-text-muted">Terms Typed</p></div>
              <div className="p-3 rounded-xl bg-surface-raised"><p className="text-xl font-bold text-orange">{bestStreak}🔥</p><p className="text-[10px] text-text-muted">Best Streak</p></div>
              <div className="p-3 rounded-xl bg-surface-raised"><p className="text-xl font-bold text-cyan">{avgTime}s</p><p className="text-[10px] text-text-muted">Avg Time</p></div>
            </div>

            {/* Completed terms list */}
            {completedTerms.length > 0 && (
              <div className="mb-6 max-h-40 overflow-y-auto">
                <p className="text-xs text-text-muted mb-2">Terms completed:</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {completedTerms.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-green/10 text-green text-xs">{t.term} ({t.time}s)</span>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={startGame} icon={<RotateCcw size={16} />} size="lg">Play Again</Button>
          </Card>
        </div>
      </div>
    )
  }

  // ============ PLAYING ============
  const timerPercent = (timeLeft / 60) * 100

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <ScreenFlash trigger={showFlash} color={flashColor} />

      {/* Header with timer & stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card padding="sm" className="text-center">
          <p className={`text-2xl font-bold font-mono ${timeLeft <= 10 ? 'text-red animate-pulse' : 'text-text-primary'}`}>{timeLeft}s</p>
          <div className="w-full h-1 rounded-full bg-border-subtle mt-1.5 overflow-hidden">
            <div className="transition-all duration-300" style={{ width: `${timerPercent}%` }}>
              <div className={`h-full rounded-full ${timeLeft <= 10 ? 'bg-red' : 'bg-green'}`} />
            </div>
          </div>
        </Card>
        <Card padding="sm" className="text-center">
          <AnimatedScore value={score} label="Score" icon={<Star size={12} className="text-gold" />} color="text-gold" size="sm" />
        </Card>
        <Card padding="sm" className="text-center">
          <div className="flex items-center justify-center gap-1">
            <StreakFire streak={streak} />
            <span className="text-2xl font-bold text-orange">{streak > 0 ? streak : '—'}</span>
          </div>
          <span className="text-[10px] text-text-muted">Streak</span>
        </Card>
      </div>

      {/* Term Card */}
      {currentTerm && (
        <div key={termIdx} className="animate-fade-in">
          <Card padding="lg" glow className="mb-4">
            <p className="text-xs text-accent font-bold uppercase tracking-widest mb-3 text-center">Definition</p>
            <p className="text-lg text-text-primary leading-relaxed mb-6 text-center">{currentTerm.definition}</p>

            {/* Character-level display */}
            <div className="flex justify-center gap-0.5 mb-4 flex-wrap">
              {currentTerm.term.split('').map((char, i) => {
                const status = getCharStatus(i)
                return (
                  <span key={i}
                    className={`w-8 h-10 flex items-center justify-center rounded-lg font-mono text-lg font-bold border-2 transition-all ${
                      char === ' ' ? 'w-4 border-transparent' :
                      status === 'correct' ? 'border-green bg-green/10 text-green' :
                      status === 'wrong' ? 'border-red bg-red/10 text-red' :
                      i === input.length ? 'border-accent bg-accent/5 text-text-primary animate-pulse' :
                      'border-border-subtle text-text-muted/30'
                    }`}
                  >
                    {status !== 'pending' || i <= input.length ? char.toUpperCase() : '·'}
                  </span>
                )
              })}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 rounded-xl bg-surface-raised border-2 border-border-subtle text-text-primary text-center text-lg font-mono outline-none focus:border-accent transition-colors opacity-0 absolute"
              autoFocus autoComplete="off" spellCheck={false}
            />

            {/* Visual Keyboard */}
            <div className="space-y-1.5">
              {keyboardRows.map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-1" style={{ paddingLeft: rowIdx * 12 }}>
                  {row.map(key => {
                    const isActive = lastKey === key
                    const isNeeded = currentTerm.term[input.length]?.toLowerCase() === key
                    return (
                      <div key={key}
                        onClick={() => {
                          inputRef.current?.focus()
                          handleInput(input + key)
                          setLastKey(key)
                        }}
                        className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-xs font-bold uppercase transition-all cursor-pointer select-none ${
                          isNeeded ? 'bg-accent/20 text-accent border border-accent/40 shadow-sm shadow-accent/10' :
                          'bg-surface-raised text-text-muted border border-border-subtle hover:bg-surface hover:text-text-primary'
                        }`}
                      >
                        {key}
                      </div>
                    )
                  })}
                </div>
              ))}
              <div className="flex justify-center mt-1">
                <div
                  onClick={() => { inputRef.current?.focus(); handleInput(input + ' '); setLastKey(' ') }}
                  className="w-40 h-8 rounded-lg bg-surface-raised text-text-muted border border-border-subtle flex items-center justify-center text-xs cursor-pointer hover:bg-surface select-none"
                >
                  SPACE
                </div>
              </div>
            </div>

            {streak > 2 && (
              <div className="animate-celebrate-pop mt-3 text-center">
                <ComboIndicator combo={streak} />
              </div>
            )}
          </Card>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip} className="flex-1">Skip (breaks streak)</Button>
            <div className="flex items-center gap-1.5 text-xs text-text-muted px-3">
              <span className="text-green font-bold">{correct}</span> correct
              {skipped > 0 && <><span className="text-border-subtle">·</span><span className="text-red font-bold">{skipped}</span> skipped</>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
