'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ConfettiBurst, ScreenFlash, XPPopup, AnimatedScore, TimerBar, ComboIndicator } from '@/components/ui/GameEffects'
import { HelpCircle, Star, RotateCcw, X, Zap, Sparkles, CircleDot, Timer, Crown } from 'lucide-react'
import { useXPStore } from '@/stores/xp-store'

interface Question {
  clue: string
  correct: string
  wrong: string[]
}

const categories: Record<string, { color: string; questions: Question[] }> = {
  'LLM Basics': {
    color: 'from-blue to-cyan',
    questions: [
      { clue: 'A chunk of text (~¾ of a word) that LLMs process', correct: 'A token', wrong: ['A byte', 'A pixel', 'A node'] },
      { clue: 'The maximum tokens an LLM can handle in one request', correct: 'The context window', wrong: ['The model size', 'The batch size', 'The learning rate'] },
      { clue: 'Controls randomness: 0 = deterministic, 1 = creative', correct: 'Temperature', wrong: ['Top-p sampling', 'Beam search', 'Greedy decoding'] },
      { clue: 'The neural network architecture behind GPT, Claude, Gemini', correct: 'The Transformer', wrong: ['The Perceptron', 'The CNN', 'The RNN'] },
      { clue: 'A vector representation of words that captures semantic meaning', correct: 'An embedding', wrong: ['A hash', 'A cipher', 'A bitmap'] },
    ],
  },
  'Prompt Tricks': {
    color: 'from-purple to-pink',
    questions: [
      { clue: 'Adding "Think step by step" to improve reasoning', correct: 'Chain-of-thought prompting', wrong: ['Few-shot learning', 'Fine-tuning', 'RAG'] },
      { clue: 'Giving 2-3 examples before the actual request', correct: 'Few-shot prompting', wrong: ['Zero-shot prompting', 'Fine-tuning', 'Transfer learning'] },
      { clue: 'Defining a role like "You are a senior developer"', correct: 'System prompting', wrong: ['User prompting', 'Chain prompting', 'Meta prompting'] },
      { clue: 'Specifying output as JSON, markdown table, etc.', correct: 'Output formatting', wrong: ['Token limiting', 'Context stuffing', 'Model tuning'] },
      { clue: 'Including relevant documents in the prompt for grounding', correct: 'Context injection', wrong: ['Prompt injection', 'SQL injection', 'Code injection'] },
    ],
  },
  'Ethics & Safety': {
    color: 'from-amber-500 to-orange',
    questions: [
      { clue: 'When an AI confidently generates false information', correct: 'A hallucination', wrong: ['A glitch', 'A bug', 'An error'] },
      { clue: 'Systematic unfairness in AI outputs based on training data', correct: 'AI bias', wrong: ['AI drift', 'AI lag', 'AI noise'] },
      { clue: 'AI-generated realistic fake images or videos of people', correct: 'A deepfake', wrong: ['A screenshot', 'A meme', 'A filter'] },
      { clue: 'Tricking an AI into bypassing its safety guardrails', correct: 'Jailbreaking', wrong: ['Debugging', 'Patching', 'Refactoring'] },
      { clue: 'An attack that embeds hidden instructions in user inputs', correct: 'Prompt injection', wrong: ['SQL injection', 'XSS attack', 'Buffer overflow'] },
    ],
  },
  'AI History': {
    color: 'from-emerald-500 to-green',
    questions: [
      { clue: 'Published in 2017 by Google, introduced self-attention', correct: '"Attention Is All You Need"', wrong: ['"ImageNet"', '"AlexNet"', '"BERT"'] },
      { clue: 'DeepMind system that beat the world champion at Go in 2016', correct: 'AlphaGo', wrong: ['DeepBlue', 'Watson', 'Siri'] },
      { clue: 'Launched Nov 2022, fastest-growing app in history', correct: 'ChatGPT', wrong: ['Siri', 'Alexa', 'Cortana'] },
      { clue: 'OpenAI text-to-image model released in 2021', correct: 'DALL-E', wrong: ['Midjourney', 'Stable Diffusion', 'Imagen'] },
      { clue: 'The 1956 workshop where "Artificial Intelligence" was coined', correct: 'The Dartmouth Conference', wrong: ['Turing Test', 'MIT Lab', 'Stanford AI'] },
    ],
  },
  'Tools & Models': {
    color: 'from-rose-500 to-red',
    questions: [
      { clue: 'Retrieval-Augmented Generation: combining search with AI', correct: 'RAG', wrong: ['RPC', 'REST', 'RSS'] },
      { clue: 'Training a pre-trained model on your specific data', correct: 'Fine-tuning', wrong: ['Pre-training', 'Distillation', 'Quantization'] },
      { clue: 'Groq, Together AI, and Fireworks provide this for fast LLM access', correct: 'Inference APIs', wrong: ['Training clusters', 'Web scrapers', 'Database engines'] },
      { clue: 'A database optimized for storing and searching embeddings', correct: 'A vector database', wrong: ['A graph database', 'A key-value store', 'A cache'] },
      { clue: 'Breaking a large model into smaller, faster versions', correct: 'Model distillation', wrong: ['Model pruning', 'Model merging', 'Model splitting'] },
    ],
  },
}

const categoryNames = Object.keys(categories)
const pointValues = [100, 200, 300, 400, 500]
const QUESTION_TIME = 15

function shuffleOptions(q: Question): { options: string[]; correctIdx: number } {
  const all = [q.correct, ...q.wrong]
  const shuffled = [...all].sort(() => Math.random() - 0.5)
  return { options: shuffled, correctIdx: shuffled.indexOf(q.correct) }
}

export default function AIJeopardyPage() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'gameOver'>('intro')
  const [board, setBoard] = useState<Record<string, boolean[]>>(
    Object.fromEntries(categoryNames.map(c => [c, new Array(5).fill(false)]))
  )
  const [activeQ, setActiveQ] = useState<{ cat: string; idx: number } | null>(null)
  const [shuffled, setShuffled] = useState<{ options: string[]; correctIdx: number } | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [flashColor, setFlashColor] = useState<'green' | 'red' | 'gold'>('green')
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [timerActive, setTimerActive] = useState(false)
  const [dailyDoubles, setDailyDoubles] = useState<Set<string>>(new Set())
  const [isDailyDouble, setIsDailyDouble] = useState(false)
  const [wager, setWager] = useState(0)
  const [wagerPhase, setWagerPhase] = useState(false)
  const [fiftyFiftyLeft, setFiftyFiftyLeft] = useState(2)
  const [eliminated, setEliminated] = useState<Set<number>>(new Set())
  const addXP = useXPStore((s) => s.addXP)

  const totalQuestions = categoryNames.length * pointValues.length

  // Generate Daily Double positions
  const initDailyDoubles = useCallback(() => {
    const positions = new Set<string>()
    while (positions.size < 3) {
      const cat = categoryNames[Math.floor(Math.random() * categoryNames.length)]
      const idx = Math.floor(Math.random() * 5)
      if (idx >= 2) positions.add(`${cat}-${idx}`) // Only on $300+ cells
    }
    setDailyDoubles(positions)
  }, [])

  // Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setTimerActive(false)
          handleTimeUp()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timeLeft])

  const handleTimeUp = () => {
    if (selectedAnswer !== null || !activeQ) return
    setSelectedAnswer(-1) // -1 = timed out
    setStreak(0)
    setFlashColor('red')
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 400)
    setAnswered(a => a + 1)
    markCellDone()
    setTimeout(() => closeQuestion(), 2000)
  }

  const markCellDone = () => {
    if (!activeQ) return
    setBoard(prev => {
      const newBoard = { ...prev }
      newBoard[activeQ.cat] = [...newBoard[activeQ.cat]]
      newBoard[activeQ.cat][activeQ.idx] = true
      return newBoard
    })
  }

  const selectCell = (cat: string, idx: number) => {
    if (board[cat][idx] || activeQ) return
    const q = categories[cat].questions[idx]
    const s = shuffleOptions(q)
    setShuffled(s)
    setEliminated(new Set())
    setTimeLeft(QUESTION_TIME)

    const key = `${cat}-${idx}`
    if (dailyDoubles.has(key)) {
      setIsDailyDouble(true)
      setWagerPhase(true)
      setWager(Math.min(500, Math.max(100, score)))
      setActiveQ({ cat, idx })
    } else {
      setIsDailyDouble(false)
      setWagerPhase(false)
      setActiveQ({ cat, idx })
      setTimerActive(true)
    }
    setSelectedAnswer(null)
  }

  const confirmWager = () => {
    setWagerPhase(false)
    setTimerActive(true)
    setTimeLeft(QUESTION_TIME + 5) // Extra time for Daily Doubles
  }

  const useFiftyFifty = () => {
    if (fiftyFiftyLeft <= 0 || !shuffled || selectedAnswer !== null) return
    setFiftyFiftyLeft(f => f - 1)
    const wrongIndices = shuffled.options
      .map((_, i) => i)
      .filter(i => i !== shuffled.correctIdx && !eliminated.has(i))
    const toRemove = [...wrongIndices].sort(() => Math.random() - 0.5).slice(0, 2)
    setEliminated(new Set(toRemove))
  }

  const handleAnswer = (answerIdx: number) => {
    if (selectedAnswer !== null || !shuffled || !activeQ) return
    setSelectedAnswer(answerIdx)
    setTimerActive(false)

    const isCorrect = answerIdx === shuffled.correctIdx
    const basePoints = isDailyDouble ? wager : pointValues[activeQ.idx]

    if (isCorrect) {
      const streakBonus = Math.min(streak * 25, 150)
      const timeBonus = Math.round(timeLeft * 3)
      const totalPoints = basePoints + streakBonus + timeBonus
      setScore(s => s + totalPoints)
      setCorrect(c => c + 1)
      setStreak(s => {
        const newStreak = s + 1
        setBestStreak(b => Math.max(b, newStreak))
        return newStreak
      })
      setFlashColor(isDailyDouble ? 'gold' : 'green')
      if (isDailyDouble || streak >= 4) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 1500)
      }
    } else {
      if (isDailyDouble) setScore(s => Math.max(0, s - wager))
      setStreak(0)
      setFlashColor('red')
    }

    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 400)
    setAnswered(a => a + 1)
    markCellDone()
    setTimeout(() => closeQuestion(), 2000)
  }

  const closeQuestion = () => {
    setActiveQ(null)
    setShuffled(null)
    setIsDailyDouble(false)
    setWagerPhase(false)
    if (answered + 1 >= totalQuestions) {
      finishGame()
    }
  }

  const finishGame = () => {
    setPhase('gameOver')
    const xpEarned = Math.round(score * 0.35)
    addXP(xpEarned)
    setShowConfetti(true)
    setShowXP(true)
    setTimeout(() => { setShowConfetti(false); setShowXP(false) }, 3500)
  }

  const handleRestart = () => {
    setBoard(Object.fromEntries(categoryNames.map(c => [c, new Array(5).fill(false)])))
    setActiveQ(null)
    setShuffled(null)
    setSelectedAnswer(null)
    setScore(0)
    setAnswered(0)
    setCorrect(0)
    setStreak(0)
    setBestStreak(0)
    setFiftyFiftyLeft(2)
    setEliminated(new Set())
    setIsDailyDouble(false)
    setWagerPhase(false)
    setTimerActive(false)
    initDailyDoubles()
    setPhase('intro')
  }

  // ============ INTRO ============
  if (phase === 'intro') {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="animate-celebrate-pop">
          <Card padding="lg" glow className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue to-purple flex items-center justify-center shadow-xl shadow-blue/20 relative">
              <HelpCircle size={40} className="text-white" />
              <div className="animate-pulse absolute inset-0 rounded-2xl bg-gradient-to-br from-blue to-purple" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">AI Jeopardy</h1>
            <p className="text-text-secondary mb-6">Test your AI knowledge across 5 categories and 25 questions! Beat the clock and build streaks.</p>

            <div className="grid grid-cols-4 gap-3 mb-6 max-w-md mx-auto">
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-text-primary">25</p>
                <p className="text-[10px] text-text-muted">Questions</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-gold">$7,500+</p>
                <p className="text-[10px] text-text-muted">Max Score</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-orange">🔥</p>
                <p className="text-[10px] text-text-muted">Streak Bonus</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-purple">⏱️</p>
                <p className="text-[10px] text-text-muted">15s Timer</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-left max-w-sm mx-auto mb-6">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-raised text-xs text-text-secondary">
                <Timer size={14} className="text-red shrink-0" />
                <span>15 seconds per question — answer fast for time bonus!</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-raised text-xs text-text-secondary">
                <Sparkles size={14} className="text-gold shrink-0" />
                <span>3 Daily Doubles hidden on the board — wager your points!</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-raised text-xs text-text-secondary">
                <CircleDot size={14} className="text-accent shrink-0" />
                <span>2 uses of 50/50 — eliminates 2 wrong answers</span>
              </div>
            </div>

            <Button onClick={() => { initDailyDoubles(); setPhase('playing') }} size="lg" className="w-full max-w-sm">
              <Zap size={18} className="mr-2" /> Start Game
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // ============ GAME OVER ============
  if (phase === 'gameOver') {
    const xpEarned = Math.round(score * 0.35)
    const accuracy = totalQuestions > 0 ? Math.round((correct / answered) * 100) : 0
    const getRank = (c: number) => { if (c >= 23) return '👑 Jeopardy Champion'; if (c >= 18) return '🏆 Trivia Master'; if (c >= 13) return '⚡ Quick Thinker'; if (c >= 8) return '📚 Knowledge Seeker'; return '🔰 Beginner' }
    const rank = getRank(correct)

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ConfettiBurst trigger={showConfetti} color="gold" />
        <XPPopup amount={xpEarned} show={showXP} />
        <div className="animate-celebrate-pop">
          <Card padding="lg" glow className="text-center">
            <div className="animate-celebrate-pop">
              <Crown size={56} className="text-gold mx-auto mb-4" />
            </div>
            <h2 className="text-3xl font-bold text-text-primary mb-2">Game Over!</h2>
            <p className="text-lg text-text-secondary mb-1">{rank}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-2xl font-bold text-gold">${score.toLocaleString()}</p>
                <p className="text-xs text-text-muted">Score</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-2xl font-bold text-green">{correct}/{answered}</p>
                <p className="text-xs text-text-muted">Correct</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-2xl font-bold text-orange">🔥 {bestStreak}</p>
                <p className="text-xs text-text-muted">Best Streak</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-2xl font-bold text-accent">+{xpEarned}</p>
                <p className="text-xs text-text-muted">XP Earned</p>
              </div>
            </div>

            <div className="w-full max-w-sm mx-auto mb-6">
              <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                <span>Accuracy</span>
                <span>{accuracy}%</span>
              </div>
              <div className="h-3 rounded-full bg-border-subtle overflow-hidden">
                <div style={{ width: `${accuracy}%` }}
                  className={`h-full rounded-full transition-all duration-300 ${accuracy >= 80 ? 'bg-green' : (accuracy >= 50 ? 'bg-gold' : 'bg-red')}`} />
              </div>
            </div>

            <Button onClick={handleRestart} icon={<RotateCcw size={16} />} size="lg" className="w-full max-w-sm">Play Again</Button>
          </Card>
        </div>
      </div>
    )
  }

  // ============ PLAYING ============
  const catColors: Record<string, string> = Object.fromEntries(
    categoryNames.map(c => [c, categories[c].color])
  )

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <ScreenFlash trigger={showFlash} color={flashColor} />
      <ConfettiBurst trigger={showConfetti} color="gold" />

      {/* Header */}
      <div className="animate-fade-in mb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <HelpCircle className="text-blue" size={24} /> AI Jeopardy
            </h1>
            <p className="text-xs text-text-muted">
              {answered}/{totalQuestions} answered
              {streak > 1 && <span className="ml-2">🔥 {streak}x streak!</span>}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={useFiftyFifty} disabled={fiftyFiftyLeft <= 0 || !activeQ || selectedAnswer !== null || wagerPhase}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer disabled:cursor-default ${
                fiftyFiftyLeft > 0 ? 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20' : 'bg-border-subtle text-text-muted opacity-50'
              }`}>
              <CircleDot size={12} /> 50/50 ({fiftyFiftyLeft})
            </button>
            <ComboIndicator combo={streak} />
            <AnimatedScore value={score} label="Score" icon={<Star size={14} className="text-gold" />} color="text-gold" />
          </div>
        </div>
      </div>

      {/* Jeopardy Board */}
      {!activeQ && (
        <div className="animate-fade-in overflow-x-auto">
          <div className="grid grid-cols-5 gap-2 min-w-[700px]">
            {/* Category Headers */}
            {categoryNames.map(cat => (
              <div key={cat} className={`p-3 rounded-xl bg-gradient-to-br ${catColors[cat]} text-center`}>
                <span className="text-xs font-bold uppercase tracking-wider text-white drop-shadow-sm">{cat}</span>
              </div>
            ))}
            {/* Question Cells */}
            {pointValues.map((points, rowIdx) => (
              categoryNames.map(cat => {
                const used = board[cat][rowIdx]
                const isDD = dailyDoubles.has(`${cat}-${rowIdx}`)
                return (
                  <button
                    key={`${cat}-${rowIdx}`}
                    onClick={() => selectCell(cat, rowIdx)}
                    disabled={used}
                    className={`p-4 rounded-xl text-center transition-all cursor-pointer relative hover:scale-105 hover:-translate-y-0.5 active:scale-95 ${
                      used
                        ? 'bg-border-subtle/20 text-text-muted'
                        : `bg-gradient-to-br ${catColors[cat]} bg-opacity-20 border border-white/10 hover:border-white/30 text-white font-bold shadow-lg hover:shadow-xl`
                    }`}
                  >
                    {used ? (
                      <X size={16} className="mx-auto opacity-20" />
                    ) : (
                      <span className="text-lg font-black drop-shadow-sm">${points}</span>
                    )}
                    {!used && isDD && (
                      <div className="animate-pulse absolute top-1 right-1 w-2 h-2 rounded-full bg-gold shadow-lg shadow-gold/50" />
                    )}
                  </button>
                )
              })
            ))}
          </div>
        </div>
      )}

      {/* Question Modal */}
        {activeQ && shuffled && (
          <div className="animate-fade-in">
            {/* Daily Double Wager */}
            {wagerPhase && isDailyDouble ? (
              <Card padding="lg" glow className="text-center">
                <div className="animate-celebrate-pop">
                  <Sparkles size={48} className="text-gold mx-auto mb-4" />
                  <h2 className="text-3xl font-black text-gold mb-2">DAILY DOUBLE!</h2>
                  <p className="text-text-secondary mb-6">How much do you want to wager?</p>
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <Button variant="ghost" onClick={() => setWager(w => Math.max(100, w - 100))}>-100</Button>
                    <span className="text-4xl font-black text-gold min-w-[120px]">${wager}</span>
                    <Button variant="ghost" onClick={() => setWager(w => Math.min(Math.max(score, 500), w + 100))}>+100</Button>
                  </div>
                  <div className="flex gap-3 justify-center mb-4">
                    <Button variant="ghost" onClick={() => setWager(100)} className="text-xs">Min $100</Button>
                    <Button variant="ghost" onClick={() => setWager(Math.max(score, 500))} className="text-xs">All In ${Math.max(score, 500)}</Button>
                  </div>
                  <Button onClick={confirmWager} size="lg" className="w-full max-w-sm">
                    <Zap size={18} className="mr-2" /> Lock In Wager
                  </Button>
                </div>
              </Card>
            ) : (
              <Card padding="lg" glow={isDailyDouble}>
                {/* Timer */}
                <div className="mb-4">
                  <TimerBar timeLeft={timeLeft} maxTime={isDailyDouble ? QUESTION_TIME + 5 : QUESTION_TIME} warning={5} />
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${catColors[activeQ.cat]} bg-clip-text text-transparent`}>
                    {activeQ.cat}
                  </span>
                  <div className="flex items-center gap-2">
                    {isDailyDouble && <span className="text-xs font-bold text-gold px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30">⭐ Daily Double — ${wager}</span>}
                    {!isDailyDouble && <span className="text-sm font-bold text-gold">${pointValues[activeQ.idx]}</span>}
                  </div>
                </div>

                {/* Clue */}
                <div className="p-5 rounded-xl bg-surface-raised border border-border-subtle mb-6 text-center">
                  <p className="text-lg text-text-primary font-medium leading-relaxed">
                    {categories[activeQ.cat].questions[activeQ.idx].clue}
                  </p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-3">
                  {shuffled.options.map((opt, i) => {
                    const isSelected = selectedAnswer === i
                    const isCorrect = i === shuffled.correctIdx
                    const showResult = selectedAnswer !== null
                    const isEliminated = eliminated.has(i)

                    if (isEliminated) {
                      return (
                        <div key={i} className="p-4 rounded-xl border-2 border-border-subtle/30 opacity-20 text-center">
                          <span className="text-sm text-text-muted line-through">{opt}</span>
                        </div>
                      )
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswer(i)}
                        disabled={showResult}
                        className={`p-4 rounded-xl text-left text-sm font-medium transition-all cursor-pointer border-2 hover:scale-[1.02] active:scale-[0.98] ${
                          showResult
                            ? (isCorrect
                              ? 'border-green bg-green/10 text-green shadow-lg shadow-green/10'
                              : (isSelected
                                ? 'border-red bg-red/10 text-red'
                                : 'border-border-subtle text-text-muted'))
                            : 'border-border-subtle hover:border-accent/50 text-text-primary bg-surface hover:shadow-md'
                        }`}
                      >
                        <span className="font-mono text-xs text-text-muted mr-2">{String.fromCodePoint(65 + i)}</span>
                        {opt}
                      </button>
                    )
                  })}
                </div>

                {/* Timeout message */}
                {selectedAnswer === -1 && (
                  <div className="animate-fade-in mt-4 text-center">
                    <p className="text-red font-bold">⏱️ Time&apos;s up! The answer was: <span className="text-green">{categories[activeQ.cat].questions[activeQ.idx].correct}</span></p>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

      {/* Bottom: End Game button */}
      {!activeQ && answered > 0 && answered < totalQuestions && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={finishGame} className="text-xs text-text-muted">
            End Game Early ({totalQuestions - answered} remaining)
          </Button>
        </div>
      )}
    </div>
  )
}
