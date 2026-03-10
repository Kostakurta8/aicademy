'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ConfettiBurst, AnimatedScore, ComboIndicator, TimerBar, XPPopup, ScreenFlash, StreakFire } from '@/components/ui/GameEffects'
import { Swords, RotateCcw, Trophy, Star, Zap, Timer, Sparkles, ChevronRight, Target, Brain, Crown, Shield, X, type LucideIcon } from 'lucide-react'
import { useXPStore } from '@/stores/xp-store'

interface Challenge {
  id: number
  title: string
  task: string
  context: string
  keywords: string[]
  bonusKeywords: string[]
  maxScore: number
  aiScore: number
  aiPrompt: string
  tips: string[]
}

const challenges: Challenge[] = [
  {
    id: 1,
    title: 'Explain to a Child',
    task: 'Explain how AI learns from data — for a curious 8-year-old',
    context: 'You\'re writing a prompt that asks an AI to explain machine learning to a young child.',
    keywords: ['simple', 'example', 'child', 'easy', 'learn', 'understand'],
    bonusKeywords: ['analogy', 'story', 'fun', 'age-appropriate', 'no jargon'],
    maxScore: 100,
    aiScore: 72,
    aiPrompt: 'Explain machine learning to a child. Use simple words.',
    tips: ['Specify the age', 'Ask for analogies or stories', 'Mention avoiding jargon'],
  },
  {
    id: 2,
    title: 'Code Review',
    task: 'Write a prompt to review a Python function for bugs, performance, and readability',
    context: 'You want an AI to act as a senior developer reviewing code.',
    keywords: ['review', 'bug', 'performance', 'readability', 'function', 'code'],
    bonusKeywords: ['senior', 'line-by-line', 'suggestions', 'best practice', 'security'],
    maxScore: 100,
    aiScore: 68,
    aiPrompt: 'Review this Python code for any issues. Check for bugs.',
    tips: ['Assign a role (senior dev)', 'Specify what to check', 'Ask for line-by-line feedback'],
  },
  {
    id: 3,
    title: 'Data Extraction',
    task: 'Extract structured data (name, date, amount) from a messy invoice email',
    context: 'You need the AI to parse unstructured text and return clean JSON.',
    keywords: ['extract', 'json', 'structured', 'name', 'date', 'amount'],
    bonusKeywords: ['format', 'parse', 'field', 'output', 'schema'],
    maxScore: 100,
    aiScore: 75,
    aiPrompt: 'Extract information from this invoice email and return JSON with name, date, and amount.',
    tips: ['Define the exact output format', 'Show a JSON example', 'Specify how to handle missing fields'],
  },
  {
    id: 4,
    title: 'Creative Writing',
    task: 'Generate a compelling product description for a smart water bottle',
    context: 'Marketing copy for an e-commerce listing. Target: health-conscious millennials.',
    keywords: ['product', 'description', 'feature', 'benefit', 'write'],
    bonusKeywords: ['tone', 'target audience', 'call to action', 'engaging', 'persuasive', 'millennial'],
    maxScore: 100,
    aiScore: 70,
    aiPrompt: 'Write a product description for a smart water bottle.',
    tips: ['Define target audience', 'Specify the tone', 'Ask for a call to action'],
  },
  {
    id: 5,
    title: 'Prompt Injection Defense',
    task: 'Create a system prompt that prevents an AI assistant from revealing its instructions or going off-topic',
    context: 'You\'re building a customer support bot that should only answer product questions.',
    keywords: ['system', 'instruction', 'refuse', 'topic', 'ignore', 'only'],
    bonusKeywords: ['injection', 'boundary', 'redirect', 'safety', 'role', 'constraint'],
    maxScore: 100,
    aiScore: 65,
    aiPrompt: 'You are a support bot. Only answer questions about our product. Don\'t go off topic.',
    tips: ['Add explicit injection handling', 'Define refusal behavior', 'Set clear boundaries for scope'],
  },
  {
    id: 6,
    title: 'Chain of Thought',
    task: 'Solve a multi-step math word problem using step-by-step reasoning',
    context: 'You want the AI to show its work, not just give a final answer.',
    keywords: ['step', 'think', 'reason', 'show', 'work', 'solve'],
    bonusKeywords: ['chain of thought', 'explain', 'verify', 'each step', 'first', 'then', 'finally'],
    maxScore: 100,
    aiScore: 60,
    aiPrompt: 'Solve this math problem step by step: ...',
    tips: ['Use "think step by step"', 'Ask it to verify the answer', 'Request clear numbering of steps'],
  },
  {
    id: 7,
    title: 'Few-Shot Learning',
    task: 'Classify customer emails as Complaint, Question, Feedback, or Urgent using examples',
    context: 'The AI needs examples to understand your classification format.',
    keywords: ['classify', 'example', 'category', 'email', 'complaint', 'question'],
    bonusKeywords: ['few-shot', 'label', 'format', 'output', 'feedback', 'urgent'],
    maxScore: 100,
    aiScore: 73,
    aiPrompt: 'Classify emails into Complaint, Question, Feedback, or Urgent. Here is an example: ...',
    tips: ['Provide 2-3 examples', 'Show exact output format', 'Cover edge cases in examples'],
  },
  {
    id: 8,
    title: 'Image Prompt Mastery',
    task: 'Write a detailed prompt for an AI image generator to create a cyberpunk cityscape',
    context: 'For a text-to-image model. The more specific and vivid, the better.',
    keywords: ['cyberpunk', 'city', 'neon', 'detail', 'style', 'lighting'],
    bonusKeywords: ['composition', 'atmosphere', 'camera angle', 'color palette', 'resolution', 'mood'],
    maxScore: 100,
    aiScore: 66,
    aiPrompt: 'Generate a cyberpunk city at night with neon lights and skyscrapers.',
    tips: ['Describe composition & camera angle', 'Specify art style', 'Include mood and atmosphere words'],
  },
]

const TIME_PER_CHALLENGE = 45

export default function PromptDuelPage() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'feedback' | 'gameOver'>('intro')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userPrompt, setUserPrompt] = useState('')
  const [timeLeft, setTimeLeft] = useState(TIME_PER_CHALLENGE)
  const [scores, setScores] = useState<{ user: number; ai: number; challenge: Challenge }[]>([])
  const [streak, setStreak] = useState(0)
  const [combo, setCombo] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [flashColor, setFlashColor] = useState<'green' | 'red' | 'gold'>('green')
  const [showXP, setShowXP] = useState(false)
  const [totalXP, setTotalXP] = useState(0)
  const [lastScore, setLastScore] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const addXP = useXPStore((s) => s.addXP)

  const challenge = challenges[currentIdx]

  const startGame = useCallback(() => {
    setCurrentIdx(0)
    setUserPrompt('')
    setScores([])
    setStreak(0)
    setCombo(0)
    setTotalXP(0)
    setTimeLeft(TIME_PER_CHALLENGE)
    setPhase('playing')
  }, [])

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          submitPrompt()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx])

  // Focus textarea
  useEffect(() => {
    if (phase === 'playing' && textareaRef.current) textareaRef.current.focus()
  }, [phase, currentIdx])

  const scorePrompt = useCallback((text: string, ch: Challenge): number => {
    const lower = text.toLowerCase()
    let score = 0

    // Length score (10-300 chars sweet spot)
    const len = text.trim().length
    if (len > 10) score += Math.min(20, Math.floor(len / 15))

    // Keyword matches
    ch.keywords.forEach(kw => { if (lower.includes(kw)) score += 10 })
    ch.bonusKeywords.forEach(kw => { if (lower.includes(kw)) score += 8 })

    // Structure bonuses
    if (text.includes('\n') || text.includes('1.') || text.includes('-')) score += 5
    if (text.includes('"') || text.includes("'")) score += 3  // Uses examples/quotes
    if (lower.includes('format') || lower.includes('output')) score += 5
    if (lower.includes('role') || lower.includes('act as') || lower.includes('you are')) score += 8

    // Time bonus
    score += Math.floor(timeLeft * 0.3)

    return Math.min(ch.maxScore, score)
  }, [timeLeft])

  const submitPrompt = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    const userScore = scorePrompt(userPrompt, challenge)
    const won = userScore > challenge.aiScore
    setLastScore(userScore)

    if (won) {
      const newStreak = streak + 1
      const newCombo = combo + 1
      setStreak(newStreak)
      setCombo(newCombo)
      setFlashColor('green')
      if (newStreak >= 3) setShowConfetti(true)
    } else {
      setStreak(0)
      setCombo(0)
      setFlashColor('red')
    }

    setShowFlash(true)
    setTimeout(() => { setShowFlash(false); setShowConfetti(false) }, 1500)

    setScores(prev => [...prev, { user: userScore, ai: challenge.aiScore, challenge }])
    setPhase('feedback')
  }, [userPrompt, challenge, streak, combo, scorePrompt])

  const nextChallenge = useCallback(() => {
    if (currentIdx >= challenges.length - 1) {
      // Game over — calculate total XP
      const finalScores = scores
      const totalUserScore = finalScores.reduce((acc, s) => acc + s.user, 0) + lastScore
      const wins = finalScores.filter(s => s.user > s.ai).length + (lastScore > challenge.aiScore ? 1 : 0)
      const xp = Math.round(totalUserScore * 0.5 + wins * 30)
      setTotalXP(xp)
      addXP(xp)
      setShowXP(true)
      setTimeout(() => setShowXP(false), 4000)
      if (wins >= challenges.length - 1) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000) }
      setPhase('gameOver')
    } else {
      setCurrentIdx(prev => prev + 1)
      setUserPrompt('')
      setTimeLeft(TIME_PER_CHALLENGE)
      setPhase('playing')
    }
  }, [currentIdx, scores, lastScore, challenge, addXP])

  // Highlighted keywords helper
  const getHighlightedKeywords = (): { keyword: string; matched: boolean }[] => {
    const lower = userPrompt.toLowerCase()
    return [
      ...challenge.keywords.map(kw => ({ keyword: kw, matched: lower.includes(kw) })),
      ...challenge.bonusKeywords.map(kw => ({ keyword: `★ ${kw}`, matched: lower.includes(kw) })),
    ]
  }

  // ============ INTRO ============
  if (phase === 'intro') {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="animate-celebrate-pop">
          <Card padding="lg" className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-red flex items-center justify-center shadow-xl shadow-orange-500/20 relative">
              <Swords size={40} className="text-white" />
              <div className="absolute -inset-2 rounded-full border-2 border-dashed border-orange-400/20 animate-[spin_10s_linear_infinite]" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Prompt Duel</h1>
            <p className="text-text-secondary mb-6">Write better prompts than the AI opponent! You have {TIME_PER_CHALLENGE}s per challenge.</p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-surface-raised border border-border-subtle">
                <Swords size={18} className="text-orange-500 mx-auto mb-1" />
                <p className="text-xs text-text-muted">{challenges.length} Duels</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised border border-border-subtle">
                <Timer size={18} className="text-cyan-500 mx-auto mb-1" />
                <p className="text-xs text-text-muted">{TIME_PER_CHALLENGE}s each</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised border border-border-subtle">
                <Target size={18} className="text-green mx-auto mb-1" />
                <p className="text-xs text-text-muted">Beat the AI</p>
              </div>
            </div>

            <div className="text-left space-y-2 mb-6 p-3 rounded-xl bg-surface-raised border border-border-subtle">
              <p className="text-xs font-bold text-text-muted uppercase">How to score points</p>
              <ul className="space-y-1 text-xs text-text-secondary">
                <li className="flex items-center gap-2"><Star size={10} className="text-gold shrink-0" /> Hit key keywords & bonus keywords</li>
                <li className="flex items-center gap-2"><Star size={10} className="text-gold shrink-0" /> Use structure (numbering, formatting)</li>
                <li className="flex items-center gap-2"><Star size={10} className="text-gold shrink-0" /> Assign roles (&quot;Act as...&quot;)</li>
                <li className="flex items-center gap-2"><Star size={10} className="text-gold shrink-0" /> Submit quickly for time bonuses</li>
              </ul>
            </div>

            <Button onClick={startGame} size="lg" className="w-full">
              <Swords size={18} className="mr-2" /> Begin Duel
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (phase === 'feedback') {
    const won = lastScore > challenge.aiScore
    const tied = lastScore === challenge.aiScore

    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <ConfettiBurst trigger={showConfetti} color="gold" />
        <ScreenFlash trigger={showFlash} color={flashColor} />

        <div className="animate-fade-in">
          <Card padding="lg" className="mb-4">
            <div className="text-center mb-4">
              <div className="animate-celebrate-pop">
                {won ? <Crown size={40} className="text-gold mx-auto mb-2" /> : <Shield size={40} className="text-text-muted mx-auto mb-2" />}
              </div>
              <h2 className="text-xl font-bold text-text-primary">{won ? 'You Win This Round!' : tied ? 'It\'s a Tie!' : 'AI Wins This Round'}</h2>
            </div>

            {/* Score comparison */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-4 rounded-xl text-center ${won ? 'bg-green/10 border-2 border-green' : 'bg-surface-raised border-2 border-border-subtle'}`}>
                <p className="text-2xl font-bold text-text-primary">{lastScore}</p>
                <p className="text-xs text-text-muted">Your Score</p>
              </div>
              <div className={`p-4 rounded-xl text-center ${!won && !tied ? 'bg-red/10 border-2 border-red' : 'bg-surface-raised border-2 border-border-subtle'}`}>
                <p className="text-2xl font-bold text-text-primary">{challenge.aiScore}</p>
                <p className="text-xs text-text-muted">AI Score</p>
              </div>
            </div>

            {/* AI's prompt */}
            <div className="mb-4">
              <p className="text-xs font-bold text-text-muted mb-1 uppercase">AI Opponent&apos;s Prompt</p>
              <div className="p-3 rounded-lg bg-surface-raised border border-border-subtle text-sm text-text-secondary italic">
                &quot;{challenge.aiPrompt}&quot;
              </div>
            </div>

            {/* Tips */}
            <div>
              <p className="text-xs font-bold text-text-muted mb-1 uppercase">Pro Tips</p>
              <ul className="space-y-1">
                {challenge.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                    <Sparkles size={10} className="text-gold shrink-0 mt-0.5" /> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Button onClick={nextChallenge} size="lg" className="w-full">
            <ChevronRight size={18} className="mr-2" /> {currentIdx >= challenges.length - 1 ? 'See Results' : 'Next Challenge'}
          </Button>
        </div>
      </div>
    )
  }

  // ============ GAME OVER ============
  if (phase === 'gameOver') {
    const wins = scores.filter(s => s.user > s.ai).length
    const totalUser = scores.reduce((a, s) => a + s.user, 0)
    const totalAI = scores.reduce((a, s) => a + s.ai, 0)
    const overallWin = totalUser > totalAI

    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <ConfettiBurst trigger={showConfetti} color="gold" />
        <XPPopup amount={totalXP} show={showXP} />

        <div className="animate-fade-in">
          <Card padding="lg" glow={overallWin} className="text-center mb-6">
            <div className="animate-celebrate-pop">
              {overallWin ? <Trophy size={48} className="text-gold mx-auto mb-3" /> : <Brain size={48} className="text-accent mx-auto mb-3" />}
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">{overallWin ? 'You Defeated the AI!' : 'AI Wins This Time'}</h2>
            <p className="text-sm text-text-secondary">Keep practicing your prompt engineering skills!</p>

            <div className="grid grid-cols-3 gap-3 my-6">
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-green">{wins}/{challenges.length}</p>
                <p className="text-[10px] text-text-muted">Duels Won</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-accent">{totalUser}</p>
                <p className="text-[10px] text-text-muted">Your Total</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-gold">+{totalXP}</p>
                <p className="text-[10px] text-text-muted">XP Earned</p>
              </div>
            </div>
          </Card>

          {/* Per-challenge results */}
          <p className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wide">Duel Breakdown</p>
          <div className="space-y-2 mb-6">
            {scores.map((s, i) => {
              const won = s.user > s.ai
              return (
                <div key={i} style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }} className="animate-fade-in">
                  <div className={`p-3 rounded-xl border-2 ${won ? 'border-green bg-green/5' : 'border-border-subtle bg-surface'} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      {won ? <Star size={14} className="text-gold" /> : <X size={14} className="text-text-muted" />}
                      <span className="text-sm font-medium text-text-primary">{s.challenge.title}</span>
                    </div>
                    <div className="text-xs text-text-secondary">
                      <span className={won ? 'text-green font-bold' : ''}>{s.user}</span>
                      <span className="text-text-muted mx-1">vs</span>
                      <span className={!won ? 'text-red font-bold' : ''}>{s.ai}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <Button onClick={startGame} variant="secondary" className="flex-1">
              <RotateCcw size={14} className="mr-1" /> Play Again
            </Button>
            <Button onClick={() => setPhase('intro')} className="flex-1">
              <Trophy size={14} className="mr-1" /> Main Menu
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ============ PLAYING ============
  const highlighted = getHighlightedKeywords()
  const matchedCount = highlighted.filter(h => h.matched).length

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <ScreenFlash trigger={showFlash} color={flashColor} />
      {streak >= 3 && <StreakFire streak={streak} />}
      {combo > 1 && <ComboIndicator combo={combo} />}

      {/* Header */}
      <div className="animate-fade-in mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Swords size={18} className="text-orange-500" />
            <span className="text-xs font-bold text-text-muted">Duel {currentIdx + 1}/{challenges.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && <span className="text-xs font-bold text-gold">🔥 {streak} streak</span>}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${timeLeft <= 10 ? 'bg-red/10 text-red' : 'bg-surface-raised text-text-muted'}`}>
              <Timer size={12} />
              <span className="text-xs font-bold">{timeLeft}s</span>
            </div>
          </div>
        </div>
        <TimerBar timeLeft={timeLeft} maxTime={TIME_PER_CHALLENGE} />
      </div>

      {/* Challenge Card */}
      <Card padding="md" className="mb-4">
        <h2 className="text-lg font-bold text-text-primary mb-1">{challenge.title}</h2>
        <p className="text-sm text-text-secondary mb-2">{challenge.task}</p>
        <p className="text-xs text-text-muted">{challenge.context}</p>
      </Card>

      {/* Writing Area */}
      <div className="mb-3">
        <textarea
          ref={textareaRef}
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          placeholder="Write your prompt here..."
          rows={5}
          className="w-full p-4 rounded-xl bg-surface border-2 border-border-subtle focus:border-accent focus:outline-none text-sm text-text-primary placeholder-text-muted resize-none transition-colors"
          maxLength={500}
        />
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-text-muted">{userPrompt.length}/500 chars</span>
          <span className="text-[10px] text-text-muted">{matchedCount}/{highlighted.length} keywords</span>
        </div>
      </div>

      {/* Live Keyword Tracker */}
      <div className="mb-4 p-3 rounded-xl bg-surface-raised border border-border-subtle">
        <p className="text-[10px] font-bold text-text-muted uppercase mb-2">Keyword Tracker</p>
        <div className="flex flex-wrap gap-1.5">
          {highlighted.map((h, i) => (
            <span
              key={i}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
                h.matched ? 'bg-green/15 text-green border border-green/30' : 'bg-surface text-text-muted border border-border-subtle'
              }`}
            >
              {h.matched && '✓ '}{h.keyword}
            </span>
          ))}
        </div>
      </div>

      <Button onClick={submitPrompt} size="lg" className="w-full" disabled={userPrompt.trim().length < 5}>
        <Zap size={18} className="mr-2" /> Submit Prompt
      </Button>
    </div>
  )
}
