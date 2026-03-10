'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { getRank } from '@/lib/get-rank'
import { ConfettiBurst, ScreenFlash, XPPopup, TimerBar, AnimatedScore, ComboIndicator, LivesDisplay, StreakFire } from '@/components/ui/GameEffects'
import { Ghost, RotateCcw, Trophy, Check, X, Eye, AlertTriangle, Zap, ChevronRight, ShieldCheck, Crosshair, Star, Brain } from 'lucide-react'
import { useXPStore } from '@/stores/xp-store'

interface HallucinationRound {
  id: string
  topic: string
  context: string
  statements: { text: string; isHallucination: boolean; explanation: string }[]
}

const rounds: HallucinationRound[] = [
  {
    id: 'transformers',
    topic: 'Transformer Architecture',
    context: 'A student asks an AI to explain how Transformers work in machine learning.',
    statements: [
      { text: 'Transformers use self-attention mechanisms to weigh the importance of different parts of the input.', isHallucination: false, explanation: 'This is correct — self-attention is the core mechanism of Transformers.' },
      { text: 'The "Attention Is All You Need" paper was published by Google researchers in 2017.', isHallucination: false, explanation: 'Correct — Vaswani et al. published this foundational paper in 2017.' },
      { text: 'Transformers process tokens sequentially from left to right, similar to RNNs, which is what makes them so efficient.', isHallucination: true, explanation: 'HALLUCINATION: Transformers process all tokens in parallel, not sequentially. This parallelism is actually what makes them faster than RNNs.' },
    ],
  },
  {
    id: 'gpt',
    topic: 'GPT Models History',
    context: 'An AI provides a summary of GPT model evolution.',
    statements: [
      { text: 'GPT-1 was released by OpenAI in 2018 and had 117 million parameters.', isHallucination: false, explanation: 'Correct — GPT-1 had 117M parameters and was released in June 2018.' },
      { text: 'GPT-4 was the first model to achieve perfect scores on all standardized academic tests including the bar exam and medical licensing.', isHallucination: true, explanation: 'HALLUCINATION: While GPT-4 performed well on many exams, it did not achieve perfect scores on all of them. It passed the bar exam in the ~90th percentile, not perfectly.' },
      { text: 'Each successive GPT model has generally been larger and more capable than its predecessor.', isHallucination: false, explanation: 'This is broadly correct — the GPT series has shown increasing capability with each version.' },
    ],
  },
  {
    id: 'training',
    topic: 'How LLMs are Trained',
    context: 'A user asks about the training process for large language models.',
    statements: [
      { text: 'Pre-training involves learning from large amounts of text data to predict the next token.', isHallucination: false, explanation: 'Correct — autoregressive pre-training uses next-token prediction as the objective.' },
      { text: 'RLHF stands for "Recursive Learning from Human Feedback" and was invented by Anthropic in 2023.', isHallucination: true, explanation: 'HALLUCINATION: RLHF stands for "Reinforcement Learning from Human Feedback" and the concept predates Anthropic. It was used by OpenAI for InstructGPT in 2022 and has earlier research origins.' },
      { text: 'Fine-tuning adapts a pre-trained model for specific tasks using a smaller, curated dataset.', isHallucination: false, explanation: 'Correct — fine-tuning is a standard practice for specializing pre-trained models.' },
    ],
  },
  {
    id: 'ethics',
    topic: 'AI Ethics Milestones',
    context: 'An AI assistant discusses important moments in AI ethics.',
    statements: [
      { text: 'The EU AI Act is the world\'s first comprehensive regulatory framework for artificial intelligence.', isHallucination: false, explanation: 'Correct — the EU AI Act was formally adopted in 2024 as the first comprehensive AI regulation.' },
      { text: 'The "Asilomar AI Principles" were created at a 2017 conference organized by the Future of Life Institute.', isHallucination: false, explanation: 'Correct — the Asilomar conference produced 23 principles for beneficial AI research.' },
      { text: 'UNESCO unanimously passed the "Global AI Ethics Treaty" in 2020, which all 193 member states have fully implemented.', isHallucination: true, explanation: 'HALLUCINATION: While UNESCO adopted its Recommendation on AI Ethics in 2021, it is not a binding treaty, and member states have not all fully implemented it.' },
    ],
  },
  {
    id: 'tokens',
    topic: 'Tokenization in NLP',
    context: 'A developer asks how tokenization works in language models.',
    statements: [
      { text: 'BPE (Byte Pair Encoding) is a common tokenization method that iteratively merges frequent character pairs.', isHallucination: false, explanation: 'Correct — BPE is widely used in models like GPT for subword tokenization.' },
      { text: 'Most LLMs use a standardized universal tokenizer called UniTok that converts all languages into exactly 50,000 tokens.', isHallucination: true, explanation: 'HALLUCINATION: There is no universal tokenizer called UniTok. Different models use different tokenizers with varying vocabulary sizes (GPT-4 uses ~100K, LLaMA uses 32K, etc.).' },
      { text: 'The same word can be tokenized differently depending on its context and the specific tokenizer used.', isHallucination: false, explanation: 'Correct — tokenization varies by model, and context can affect how words at sentence boundaries are split.' },
    ],
  },
  {
    id: 'diffusion',
    topic: 'Image Generation Models',
    context: 'An AI explains how modern image generation works.',
    statements: [
      { text: 'Diffusion models work by gradually adding noise to an image and then learning to reverse the process.', isHallucination: false, explanation: 'Correct — this forward-noise/reverse-denoise process is the core principle of diffusion models.' },
      { text: 'DALL-E 3 generates images by directly placing individual pixels in sequence from top-left to bottom-right, similar to how a typewriter works.', isHallucination: true, explanation: 'HALLUCINATION: DALL-E 3 uses diffusion/transformer-based generation, not sequential pixel placement. No modern image model generates pixel-by-pixel in raster order.' },
      { text: 'Stable Diffusion is an open-source image generation model that operates in a compressed latent space for efficiency.', isHallucination: false, explanation: 'Correct — Stable Diffusion uses a latent diffusion approach, operating in a compressed representation.' },
    ],
  },
  {
    id: 'rag',
    topic: 'RAG (Retrieval-Augmented Generation)',
    context: 'A team lead asks about RAG for their documentation system.',
    statements: [
      { text: 'RAG combines information retrieval with text generation to provide answers grounded in specific documents.', isHallucination: false, explanation: 'Correct — RAG retrieves relevant documents and uses them as context for generation.' },
      { text: 'RAG systems always guarantee 100% factual accuracy because they only use verified source documents to generate responses.', isHallucination: true, explanation: 'HALLUCINATION: RAG reduces hallucinations but does not guarantee 100% accuracy. The LLM can still misinterpret retrieved documents or generate incorrect inferences.' },
      { text: 'Vector embeddings are commonly used to find semantically similar documents in a RAG pipeline.', isHallucination: false, explanation: 'Correct — semantic similarity search via embeddings is a standard component of RAG systems.' },
    ],
  },
  {
    id: 'agents',
    topic: 'AI Agents',
    context: 'An article discusses the rise of AI agents and autonomous systems.',
    statements: [
      { text: 'AI agents can use tools like web browsers, code interpreters, and APIs to accomplish complex tasks.', isHallucination: false, explanation: 'Correct — tool use is a key capability of modern AI agents.' },
      { text: 'The ReAct framework combines reasoning and acting, allowing agents to think step-by-step while interacting with their environment.', isHallucination: false, explanation: 'Correct — ReAct (Reason + Act) is a well-known prompting framework for agents.' },
      { text: 'AutoGPT, released in early 2023, was the first AI system ever to autonomously complete a full software engineering project from design to deployment without any human input.', isHallucination: true, explanation: 'HALLUCINATION: While AutoGPT was a notable early agent experiment, it did not reliably complete full engineering projects autonomously. It often got stuck in loops and required human oversight.' },
    ],
  },
]

type Confidence = 'low' | 'medium' | 'high'
const confidenceMultiplier: Record<Confidence, { mult: number; label: string; color: string }> = {
  low: { mult: 1, label: 'Low (1×)', color: 'text-text-muted' },
  medium: { mult: 1.5, label: 'Medium (1.5×)', color: 'text-yellow' },
  high: { mult: 2, label: 'High (2×)', color: 'text-red' },
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function HallucinationHunterPage() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'confidence' | 'feedback' | 'gameOver'>('intro')
  const [gameRounds, setGameRounds] = useState<HallucinationRound[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [confidence, setConfidence] = useState<Confidence>('medium')
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [timerActive, setTimerActive] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [flashColor, setFlashColor] = useState<'green' | 'red' | 'gold'>('green')
  const [showXP, setShowXP] = useState(false)
  const [hoveredStmt, setHoveredStmt] = useState<number | null>(null)
  const [results, setResults] = useState<{ roundId: string; correct: boolean; confidence: Confidence }[]>([])
  const addXP = useXPStore((s) => s.addXP)

  const startGame = useCallback(() => {
    setGameRounds(shuffleArray(rounds))
    setCurrentIdx(0)
    setSelected(null)
    setLives(3)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setResults([])
    setPhase('playing')
    setTimeLeft(30)
    setTimerActive(true)
  }, [])

  // Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setTimerActive(false)
          // Auto-select wrong — lose a life
          setLives(l => l - 1)
          setStreak(0)
          setFlashColor('red')
          setShowFlash(true)
          setTimeout(() => setShowFlash(false), 400)
          setResults(prev => [...prev, { roundId: gameRounds[currentIdx]?.id ?? '', correct: false, confidence: 'low' }])
          setPhase('feedback')
          setSelected(-1) // Indicates timeout
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timeLeft])

  const handleSelect = (idx: number) => {
    if (phase !== 'playing') return
    setTimerActive(false)
    setSelected(idx)
    setPhase('confidence')
  }

  const confirmWithConfidence = useCallback((conf: Confidence) => {
    if (selected === null) return
    setConfidence(conf)

    const round = gameRounds[currentIdx]
    const isCorrect = round.statements[selected]?.isHallucination ?? false
    const mult = confidenceMultiplier[conf].mult

    if (isCorrect) {
      const basePoints = 100
      const timeBonus = Math.round(timeLeft * 2)
      const streakBonus = streak * 15
      const points = Math.round((basePoints + timeBonus + streakBonus) * mult)
      setScore(s => s + points)
      setStreak(s => s + 1)
      setBestStreak(prev => Math.max(prev, streak + 1))
      setFlashColor('green')
    } else {
      setLives(l => l - 1)
      setStreak(0)
      // High confidence wrong = lose extra life
      if (conf === 'high') setLives(l => l - 1)
      setFlashColor('red')
    }

    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 400)
    setResults(prev => [...prev, { roundId: round.id, correct: isCorrect, confidence: conf }])
    setPhase('feedback')
  }, [selected, currentIdx, gameRounds, timeLeft, streak])

  const nextRound = useCallback(() => {
    if (lives <= 0 || currentIdx + 1 >= gameRounds.length) {
      const totalXP = score + 75
      addXP(totalXP)
      setShowConfetti(true)
      setShowXP(true)
      setPhase('gameOver')
      setTimeout(() => { setShowConfetti(false); setShowXP(false) }, 4000)
    } else {
      setCurrentIdx(i => i + 1)
      setSelected(null)
      setTimeLeft(30)
      setTimerActive(true)
      setHoveredStmt(null)
      setPhase('playing')
    }
  }, [lives, currentIdx, gameRounds.length, score, addXP])

  // Auto-end if no lives
  useEffect(() => {
    if (lives <= 0 && phase === 'feedback') {
      // Will trigger gameOver on nextRound
    }
  }, [lives, phase])

  const currentRound = gameRounds[currentIdx]
  const correctCount = results.filter(r => r.correct).length

  // ============ INTRO ============
  if (phase === 'intro') {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="animate-celebrate-pop">
          <Card padding="lg" glow className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 relative">
              <Ghost size={40} className="text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red border-2 border-bg-primary animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Hallucination Hunter</h1>
            <p className="text-text-secondary mb-6">AI models sometimes generate convincing but false information. Find the hallucination in each passage!</p>

            <div className="grid grid-cols-4 gap-3 mb-6 max-w-lg mx-auto">
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-text-primary">{rounds.length}</p>
                <p className="text-[10px] text-text-muted">Rounds</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-red">❤️ 3</p>
                <p className="text-[10px] text-text-muted">Lives</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-orange">30s</p>
                <p className="text-[10px] text-text-muted">Per Round</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-gold">2×</p>
                <p className="text-[10px] text-text-muted">Max Multiplier</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-left max-w-md mx-auto mb-6">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-raised text-xs text-text-secondary">
                <Crosshair size={14} className="text-emerald-500 shrink-0" />
                <span>Read 3 statements, click the one that&apos;s a hallucination</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-raised text-xs text-text-secondary">
                <Star size={14} className="text-gold shrink-0" />
                <span>Set your confidence — high confidence = 2× points but bigger penalty if wrong!</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-raised text-xs text-text-secondary">
                <AlertTriangle size={14} className="text-red shrink-0" />
                <span>Wrong at high confidence costs 2 lives instead of 1</span>
              </div>
            </div>

            <Button onClick={startGame} size="lg" className="w-full max-w-sm">
              <Ghost size={18} className="mr-2" /> Start Hunting
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // ============ GAME OVER ============
  if (phase === 'gameOver') {
    const survived = lives > 0
    const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0
    const totalXP = score + 75
    const rank = getRank(accuracy, [{ min: 90, label: '🏆 Fact-Check Master' }, { min: 70, label: '🔍 Senior Hunter' }, { min: 50, label: '👁️ Sharp Eye' }], '🔰 Rookie')

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ConfettiBurst trigger={showConfetti && survived} color="gold" />
        <XPPopup amount={totalXP} show={showXP} />

        <div className="animate-fade-in">
          <Card padding="lg" glow={survived} className="text-center mb-6">
            <div className="animate-celebrate-pop">
              {survived ? <Trophy size={48} className="text-gold mx-auto mb-3" /> : <Ghost size={48} className="text-red mx-auto mb-3" />}
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">{survived ? 'Investigation Complete!' : 'Out of Lives!'}</h2>
            <p className="text-text-secondary mb-1">{rank}</p>

            <div className="grid grid-cols-4 gap-3 my-6">
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-green">{correctCount}/{results.length}</p>
                <p className="text-[10px] text-text-muted">Caught</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-accent">{accuracy}%</p>
                <p className="text-[10px] text-text-muted">Accuracy</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-orange">🔥 {bestStreak}</p>
                <p className="text-[10px] text-text-muted">Best Streak</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-gold">+{totalXP}</p>
                <p className="text-[10px] text-text-muted">XP</p>
              </div>
            </div>

            {/* Accuracy bar */}
            <div className="w-full bg-surface-raised rounded-full h-3 mb-4 max-w-xs mx-auto overflow-hidden">
              <div style={{ width: `${accuracy}%`, transition: 'width 1s ease-out 0.3s' }}
                className={`h-full rounded-full ${accuracy >= 70 ? 'bg-green' : accuracy >= 40 ? 'bg-yellow' : 'bg-red'}`} />
            </div>
          </Card>

          {/* Round Summary */}
          <div className="space-y-2 mb-6">
            {results.map((result, i) => {
              const round = gameRounds[i]
              if (!round) return null
              return (
                <div key={round.id} className={`flex items-center gap-3 p-3 rounded-xl border ${result.correct ? 'border-green bg-green/5' : 'border-red bg-red/5'}`}>
                  {result.correct ? <Check size={16} className="text-green shrink-0" /> : <X size={16} className="text-red shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{round.topic}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-surface-raised ${confidenceMultiplier[result.confidence].color} font-bold`}>
                    {result.confidence}
                  </span>
                </div>
              )
            })}
          </div>

          <Button onClick={() => setPhase('intro')} icon={<RotateCcw size={16} />} size="lg" className="w-full">
            Hunt Again
          </Button>
        </div>
      </div>
    )
  }

  if (!currentRound) return null

  // ============ CONFIDENCE SELECTION ============
  if (phase === 'confidence') {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="animate-bounce-in">
          <Card padding="lg" className="text-center">
            <Brain size={32} className="text-accent mx-auto mb-3" />
            <h3 className="text-xl font-bold text-text-primary mb-2">How confident are you?</h3>
            <p className="text-xs text-text-secondary mb-6">Higher confidence = more points, but wrong at high confidence costs 2 lives!</p>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-4">
              {(Object.entries(confidenceMultiplier) as [Confidence, typeof confidenceMultiplier.low][]).map(([key, cfg]) => (
                <button key={key}
                  onClick={() => confirmWithConfidence(key)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.97] ${
                    key === 'low' ? 'border-border-subtle hover:border-text-muted bg-surface' :
                    key === 'medium' ? 'border-yellow/30 hover:border-yellow bg-yellow/5' :
                    'border-red/30 hover:border-red bg-red/5'
                  }`}>
                  <p className={`text-2xl font-bold ${cfg.color}`}>{cfg.mult}×</p>
                  <p className="text-xs text-text-muted capitalize mt-1">{key}</p>
                  {key === 'high' && <p className="text-[10px] text-red mt-1">⚠️ -2 lives if wrong</p>}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ============ FEEDBACK ============
  if (phase === 'feedback') {
    const isCorrect = selected !== null && selected >= 0 && currentRound.statements[selected]?.isHallucination
    const hallucinationIdx = currentRound.statements.findIndex(s => s.isHallucination)

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ScreenFlash trigger={showFlash} color={flashColor} />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isCorrect ? <ShieldCheck size={20} className="text-green" /> : <AlertTriangle size={20} className="text-red" />}
            <span className="text-lg font-bold text-text-primary">{isCorrect ? 'Hallucination Caught!' : selected === -1 ? 'Time\'s Up!' : 'Wrong Statement!'}</span>
          </div>
          <LivesDisplay lives={lives} maxLives={3} />
        </div>

        {/* Statements with revealed truth */}
        <div className="space-y-3 mb-6">
          {currentRound.statements.map((stmt, idx) => (
            <div key={idx} style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: 'both' }}
              className={`animate-fade-in p-4 rounded-xl border-2 ${
                stmt.isHallucination
                  ? 'border-red bg-red/5'
                  : 'border-green bg-green/5'
              }`}>
              <div className="flex items-start gap-2 mb-2">
                {stmt.isHallucination ? <Ghost size={16} className="text-red mt-0.5 shrink-0" /> : <Check size={16} className="text-green mt-0.5 shrink-0" />}
                <p className="text-sm text-text-primary">{stmt.text}</p>
              </div>
              <p className="text-xs text-text-secondary ml-6">{stmt.explanation}</p>
              {idx === selected && (
                <span className="text-xs font-bold text-accent ml-6">← Your pick</span>
              )}
            </div>
          ))}
        </div>

        <Button onClick={nextRound} size="lg" className="w-full">
          {lives <= 0 || currentIdx + 1 >= gameRounds.length ? 'See Results' : 'Next Round'} <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
    )
  }

  // ============ PLAYING ============
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <ScreenFlash trigger={showFlash} color={flashColor} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <LivesDisplay lives={lives} maxLives={3} />
          {streak > 1 && <ComboIndicator combo={streak} />}
          <StreakFire streak={streak} />
        </div>
        <AnimatedScore value={score} label="Score" color="text-gold" size="sm" />
      </div>

      <TimerBar timeLeft={timeLeft} maxTime={30} warning={8} />

      {/* Progress */}
      <div className="flex items-center gap-1 mb-4 mt-2">
        {gameRounds.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
            i < currentIdx ? (results[i]?.correct ? 'bg-green' : 'bg-red') : i === currentIdx ? 'bg-accent' : 'bg-surface-raised'
          }`} />
        ))}
      </div>

      {/* Round context */}
      <div className="animate-fade-in" key={currentRound.id}>
        <Card padding="md" className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-accent" />
            <span className="text-xs font-bold text-text-muted uppercase tracking-wide">Round {currentIdx + 1}: {currentRound.topic}</span>
          </div>
          <p className="text-sm text-text-secondary">{currentRound.context}</p>
        </Card>

        {/* Statements */}
        <p className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wide">
          <Ghost size={12} className="inline mr-1" /> Which statement is a hallucination?
        </p>

        <div className="space-y-2">
          {currentRound.statements.map((stmt, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              onMouseEnter={() => setHoveredStmt(idx)}
              onMouseLeave={() => setHoveredStmt(null)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98] ${
                hoveredStmt === idx
                  ? 'border-red/40 bg-red/5 shadow-lg shadow-red/5'
                  : 'border-border-subtle bg-surface hover:border-border-default'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  hoveredStmt === idx ? 'bg-red/10 text-red' : 'bg-surface-raised text-text-muted'
                }`}>
                  {idx + 1}
                </div>
                <p className="text-sm text-text-primary leading-relaxed">{stmt.text}</p>
              </div>
              {hoveredStmt === idx && (
                <div className="animate-fade-in mt-2 ml-10">
                  <span className="text-[10px] text-red font-medium">🎯 Click to mark as hallucination</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
