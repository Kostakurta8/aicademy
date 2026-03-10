'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ConfettiBurst, AnimatedScore, TimerBar, XPPopup, ProgressDots, ComboIndicator, ScreenFlash } from '@/components/ui/GameEffects'
import { useXPStore } from '@/stores/xp-store'
import { useProgressStore } from '@/stores/progress-store'
import { useUserStore } from '@/stores/user-store'
import { playCorrect, playIncorrect, playLevelUp, playXPDing } from '@/lib/sounds'
import { ArrowLeft, Wand2, Star, Trophy, Zap, CheckCircle, RotateCcw, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

// ── Block Types ──────────────────────────────────────────────────────

interface PromptBlock {
  id: string
  type: 'system' | 'instruction' | 'context' | 'example' | 'format' | 'constraint' | 'persona' | 'cot'
  label: string
  color: string
  icon: string
}

const BLOCK_PALETTE: PromptBlock[] = [
  { id: 'system', type: 'system', label: 'System Prompt', color: 'bg-purple/10 border-purple/30 text-purple', icon: '🛡️' },
  { id: 'instruction', type: 'instruction', label: 'Instructions', color: 'bg-blue/10 border-blue/30 text-blue', icon: '📝' },
  { id: 'context', type: 'context', label: 'Context / Data', color: 'bg-green/10 border-green/30 text-green', icon: '📄' },
  { id: 'example', type: 'example', label: 'Few-Shot Example', color: 'bg-amber-500/10 border-amber-500/30 text-amber-500', icon: '💡' },
  { id: 'format', type: 'format', label: 'Output Format', color: 'bg-cyan/10 border-cyan/30 text-cyan', icon: '🎯' },
  { id: 'constraint', type: 'constraint', label: 'Constraints', color: 'bg-red/10 border-red/30 text-red', icon: '⛔' },
  { id: 'persona', type: 'persona', label: 'Role / Persona', color: 'bg-pink/10 border-pink/30 text-pink', icon: '🎭' },
  { id: 'cot', type: 'cot', label: 'Chain of Thought', color: 'bg-orange/10 border-orange/30 text-orange', icon: '🧠' },
]

// ── Challenges ───────────────────────────────────────────────────────

interface Challenge {
  id: number
  title: string
  description: string
  scenario: string
  requiredBlocks: string[]  // block types that MUST be included
  bonusBlocks: string[]     // block types that earn bonus points
  badBlocks: string[]       // block types that don't belong
  maxBlocks: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

const challenges: Challenge[] = [
  {
    id: 1,
    title: 'Email Classifier',
    description: 'Build a prompt to classify customer emails by intent and urgency.',
    scenario: 'You need Claude to process incoming customer emails and categorize them for the support team.',
    requiredBlocks: ['instruction', 'example', 'format'],
    bonusBlocks: ['system', 'constraint'],
    badBlocks: ['cot'],
    maxBlocks: 6,
    explanation: 'Classification tasks need clear instructions, few-shot examples to show the pattern, and a defined output format. A system prompt and constraints are bonus. CoT is unnecessary for simple classification.',
    difficulty: 'easy',
  },
  {
    id: 2,
    title: 'Code Reviewer',
    description: 'Design a prompt for thorough, constructive code reviews.',
    scenario: 'Your team needs Claude to review pull requests and provide actionable feedback organized by severity.',
    requiredBlocks: ['system', 'persona', 'instruction', 'context', 'format'],
    bonusBlocks: ['constraint', 'example'],
    badBlocks: [],
    maxBlocks: 7,
    explanation: 'Code review needs: a system prompt for behavioral rules, a persona (senior reviewer), instructions on what to check, the code as context, and an output format (severity levels). Examples and constraints improve quality.',
    difficulty: 'medium',
  },
  {
    id: 3,
    title: 'Research Synthesizer',
    description: 'Create a prompt that synthesizes multiple research papers into key findings.',
    scenario: 'A PhD student needs to compare 5 research papers on transformer architectures and extract common themes, disagreements, and research gaps.',
    requiredBlocks: ['system', 'instruction', 'context', 'cot', 'format'],
    bonusBlocks: ['constraint', 'example'],
    badBlocks: [],
    maxBlocks: 8,
    explanation: 'Research synthesis requires: system prompt (academic rigor), clear instructions, the papers as context, chain-of-thought for reasoning through comparisons, and a structured output format.',
    difficulty: 'medium',
  },
  {
    id: 4,
    title: 'API Documentation',
    description: 'Build a prompt to generate comprehensive API docs from source code.',
    scenario: 'Generate OpenAPI-style documentation from raw Python source code, including descriptions, parameter types, and example requests.',
    requiredBlocks: ['persona', 'instruction', 'context', 'format', 'example'],
    bonusBlocks: ['system', 'constraint'],
    badBlocks: [],
    maxBlocks: 7,
    explanation: 'API docs need: a technical writer persona, extraction instructions, the code as context, a strict output format (OpenAPI), and at least one example of the desired documentation style.',
    difficulty: 'medium',
  },
  {
    id: 5,
    title: 'Startup Pitch Evaluator',
    description: 'Design a prompt that critically evaluates startup pitches from multiple perspectives.',
    scenario: 'A VC firm wants Claude to analyze pitch decks, considering market viability, technical feasibility, team strength, and financial projections.',
    requiredBlocks: ['system', 'persona', 'instruction', 'context', 'cot', 'format', 'constraint'],
    bonusBlocks: ['example'],
    badBlocks: [],
    maxBlocks: 8,
    explanation: 'This complex analysis task needs every major block: behavioral rules, an expert persona, detailed instructions, the pitch as context, structured reasoning (CoT), output format, and constraints to prevent bias.',
    difficulty: 'hard',
  },
  {
    id: 6,
    title: 'Bug Triager',
    description: 'Create a prompt that triages bug reports and suggests causes.',
    scenario: 'Incoming bug reports need to be categorized by severity, component, and likely root cause based on the description and logs.',
    requiredBlocks: ['instruction', 'context', 'format', 'example'],
    bonusBlocks: ['system', 'cot', 'constraint'],
    badBlocks: ['persona'],
    maxBlocks: 7,
    explanation: 'Bug triage needs instructions on categorization, the report as context, output format for severity/component/cause, and examples of past triage. CoT helps for root cause analysis. A persona is unnecessary here.',
    difficulty: 'easy',
  },
  {
    id: 7,
    title: 'Legal Contract Analyzer',
    description: 'Build a prompt to identify risks and unusual clauses in contracts.',
    scenario: 'A small business needs Claude to review a vendor contract, flag risky clauses, compare against standard terms, and summarize obligations.',
    requiredBlocks: ['system', 'persona', 'instruction', 'context', 'cot', 'format', 'constraint'],
    bonusBlocks: ['example'],
    badBlocks: [],
    maxBlocks: 8,
    explanation: 'Legal analysis is high-stakes and requires ALL components: careful behavioral rules, a legal expert persona, detailed instructions, the contract as context, step-by-step reasoning, structured output, and constraints (disclaimer, limitations).',
    difficulty: 'hard',
  },
  {
    id: 8,
    title: 'Quick Summarizer',
    description: 'Design a minimal but effective summarization prompt.',
    scenario: 'Summarize a news article into 3 bullet points with a one-sentence takeaway.',
    requiredBlocks: ['instruction', 'context', 'format'],
    bonusBlocks: ['constraint'],
    badBlocks: ['persona', 'cot', 'system'],
    maxBlocks: 4,
    explanation: 'Simple summarization should be lean — just instructions, the text, and output format. Adding persona, CoT, or a system prompt overcomplicates a straightforward task. Constraints (length limit) can help.',
    difficulty: 'easy',
  },
]

// ── Game State ────────────────────────────────────────────────────────

type GamePhase = 'menu' | 'playing' | 'feedback' | 'results'

export default function PromptArchitectPage() {
  const [phase, setPhase] = useState<GamePhase>('menu')
  const [challengeIdx, setChallengeIdx] = useState(0)
  const [placedBlocks, setPlacedBlocks] = useState<PromptBlock[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [roundScores, setRoundScores] = useState<number[]>([])
  const [showXP, setShowXP] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [flashColor, setFlashColor] = useState<'green' | 'red'>('green')
  const [timeLeft, setTimeLeft] = useState(60)
  const [totalRounds, setTotalRounds] = useState(5)

  const addXP = useXPStore((s) => s.addXP)
  const completeChallenge = useProgressStore((s) => s.completeChallenge)
  const soundEnabled = useUserStore((s) => s.soundEnabled)

  const currentChallenge = challenges[challengeIdx]

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || timeLeft <= 0) return
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && phase === 'playing') submitAnswer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  const startGame = () => {
    setPhase('playing')
    setChallengeIdx(0)
    setPlacedBlocks([])
    setScore(0)
    setCombo(0)
    setRoundScores([])
    setTimeLeft(60)
  }

  const addBlock = (block: PromptBlock) => {
    if (placedBlocks.length >= (currentChallenge?.maxBlocks ?? 8)) return
    if (placedBlocks.some(b => b.type === block.type)) return
    setPlacedBlocks(prev => [...prev, { ...block, id: `${block.type}-${Date.now()}` }])
  }

  const removeBlock = (idx: number) => {
    setPlacedBlocks(prev => prev.filter((_, i) => i !== idx))
  }

  const moveBlock = (idx: number, dir: 'up' | 'down') => {
    setPlacedBlocks(prev => {
      const arr = [...prev]
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= arr.length) return arr
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return arr
    })
  }

  const submitAnswer = useCallback(() => {
    if (!currentChallenge) return
    const placed: string[] = placedBlocks.map(b => b.type as string)
    let points = 0

    // Points for required blocks
    const requiredHits = currentChallenge.requiredBlocks.filter(r => placed.includes(r))
    points += requiredHits.length * 20

    // Bonus blocks
    const bonusHits = currentChallenge.bonusBlocks.filter(r => placed.includes(r))
    points += bonusHits.length * 10

    // Penalty for bad blocks
    const badHits = currentChallenge.badBlocks.filter(r => placed.includes(r))
    points -= badHits.length * 15

    // Perfect score bonus
    const allRequired = requiredHits.length === currentChallenge.requiredBlocks.length
    const noBad = badHits.length === 0
    if (allRequired && noBad) {
      points += 25
      setCombo(prev => prev + 1)
    } else {
      setCombo(0)
    }

    // Combo multiplier
    if (combo >= 2) points = Math.round(points * (1 + combo * 0.15))

    points = Math.max(0, points)
    setScore(prev => prev + points)
    setRoundScores(prev => [...prev, points])

    if (allRequired && noBad) {
      setFlashColor('green')
      if (soundEnabled) playCorrect()
    } else {
      setFlashColor('red')
      if (soundEnabled) playIncorrect()
    }
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 300)

    setPhase('feedback')
  }, [currentChallenge, placedBlocks, combo, soundEnabled])

  const nextChallenge = () => {
    const nextIdx = challengeIdx + 1
    if (nextIdx >= totalRounds && nextIdx <= challenges.length) {
      // Game over
      const totalXP = Math.round(score * 0.8)
      addXP(totalXP, 'prompting')
      completeChallenge('prompt-architect')
      if (soundEnabled) playLevelUp()
      setShowConfetti(true)
      setShowXP(true)
      setTimeout(() => setShowXP(false), 2500)
      setPhase('results')
    } else {
      setChallengeIdx(nextIdx)
      setPlacedBlocks([])
      setTimeLeft(60)
      setPhase('playing')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────

  if (phase === 'menu') {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <Link href="/prompting" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors mb-6">
          <ArrowLeft size={14} /> Back to Prompting
        </Link>
        <div className="animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple flex items-center justify-center">
              <Wand2 size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Prompt Architect</h1>
            <p className="text-text-secondary">Build optimal Claude prompts block by block</p>
          </div>
          <Card padding="lg">
            <h3 className="font-semibold text-text-primary mb-3">How to Play</h3>
            <div className="space-y-2 text-sm text-text-secondary mb-6">
              <p>🧱 Each round presents a prompting <strong className="text-text-primary">scenario</strong></p>
              <p>📐 Drag prompt blocks from the palette to build your prompt</p>
              <p>✅ Include <strong className="text-text-primary">required blocks</strong> for points, avoid <strong className="text-text-primary">bad blocks</strong> to dodge penalties</p>
              <p>⏱️ You have <strong className="text-text-primary">60 seconds</strong> per round</p>
              <p>🔥 Build combos by getting perfect scores — combo multiplier stacks!</p>
            </div>
            <div className="flex gap-3 mb-4">
              {[5, 8].map(n => (
                <button key={n} onClick={() => setTotalRounds(n)}
                  className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    totalRounds === n ? 'bg-accent/10 border-accent text-accent' : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-accent/30'
                  }`}>
                  {n} Rounds
                </button>
              ))}
            </div>
            <Button variant="primary" size="lg" className="w-full" onClick={startGame} icon={<Zap size={18} />}>
              Start Building
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (phase === 'results') {
    const totalXP = Math.round(score * 0.8)
    const perfectRounds = roundScores.filter((s, i) => {
      const c = challenges[i]
      return c && s >= c.requiredBlocks.length * 20 + 25
    }).length
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto text-center">
        <ConfettiBurst trigger={showConfetti} color="multi" />
        <XPPopup amount={totalXP} show={showXP} />
        <div className="animate-bounce-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-lg">
            <Trophy size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Game Complete!</h2>
          <p className="text-text-secondary mb-6">Prompt Architect</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card padding="md"><p className="text-2xl font-bold text-accent">{score}</p><p className="text-xs text-text-muted">Total Score</p></Card>
            <Card padding="md"><p className="text-2xl font-bold text-gold">{totalXP}</p><p className="text-xs text-text-muted">XP Earned</p></Card>
            <Card padding="md"><p className="text-2xl font-bold text-green">{perfectRounds}</p><p className="text-xs text-text-muted">Perfect Rounds</p></Card>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => { setPhase('menu'); setShowConfetti(false) }} icon={<RotateCcw size={16} />}>Play Again</Button>
            <Link href="/prompting"><Button variant="primary">Back to Hub</Button></Link>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'feedback') {
    const placed: string[] = placedBlocks.map(b => b.type as string)
    const lastScore = roundScores[roundScores.length - 1] || 0
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <ScreenFlash trigger={showFlash} color={flashColor} />
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">Round {challengeIdx + 1} Results</h2>
            <AnimatedScore value={lastScore} label="Points" />
          </div>
          <Card padding="lg">
            <h3 className="font-semibold text-text-primary mb-4">{currentChallenge.title}</h3>
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Required Blocks</p>
                <div className="flex flex-wrap gap-2">
                  {currentChallenge.requiredBlocks.map(type => {
                    const block = BLOCK_PALETTE.find(b => b.type === type)!
                    const hit = placed.includes(type)
                    return (
                      <span key={type} className={`px-3 py-1 rounded-lg text-xs font-medium border ${hit ? 'bg-green/10 border-green/30 text-green' : 'bg-red/10 border-red/30 text-red'}`}>
                        {hit ? '✓' : '✗'} {block.label}
                      </span>
                    )
                  })}
                </div>
              </div>
              {currentChallenge.bonusBlocks.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Bonus Blocks</p>
                  <div className="flex flex-wrap gap-2">
                    {currentChallenge.bonusBlocks.map(type => {
                      const block = BLOCK_PALETTE.find(b => b.type === type)!
                      const hit = placed.includes(type)
                      return (
                        <span key={type} className={`px-3 py-1 rounded-lg text-xs font-medium border ${hit ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-surface-raised border-border-subtle text-text-muted'}`}>
                          {hit ? '★' : '○'} {block.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
              {currentChallenge.badBlocks.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-muted mb-2 uppercase tracking-wider">Anti-Patterns</p>
                  <div className="flex flex-wrap gap-2">
                    {currentChallenge.badBlocks.map(type => {
                      const block = BLOCK_PALETTE.find(b => b.type === type)!
                      const hit = placed.includes(type)
                      return (
                        <span key={type} className={`px-3 py-1 rounded-lg text-xs font-medium border ${hit ? 'bg-red/10 border-red/30 text-red' : 'bg-green/10 border-green/30 text-green'}`}>
                          {hit ? '✗ Used' : '✓ Avoided'} {block.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-sm text-text-secondary">
              <p className="font-semibold text-accent text-xs mb-1">💡 Explanation</p>
              {currentChallenge.explanation}
            </div>
          </Card>
          <div className="flex justify-end mt-4">
            <Button variant="primary" onClick={nextChallenge}>
              {challengeIdx + 1 >= totalRounds ? 'See Results' : 'Next Challenge'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Playing Phase ──────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <ScreenFlash trigger={showFlash} color={flashColor} />
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-text-muted">Round {challengeIdx + 1}/{totalRounds}</p>
          <h2 className="text-lg font-bold text-text-primary">{currentChallenge.title}</h2>
        </div>
        <div className="flex items-center gap-4">
          <AnimatedScore value={score} label="Score" />
          {combo >= 2 && <ComboIndicator combo={combo} />}
        </div>
      </div>

      <TimerBar timeLeft={timeLeft} maxTime={60} warning={15} />

      {/* Scenario */}
      <Card padding="md">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Scenario</p>
        <p className="text-sm text-text-secondary">{currentChallenge.scenario}</p>
        <p className="text-xs text-text-muted mt-2">Max blocks: {currentChallenge.maxBlocks} • Your blocks: {placedBlocks.length}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* Block Palette */}
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Block Palette</p>
          <div className="space-y-2">
            {BLOCK_PALETTE.map(block => {
              const alreadyPlaced = placedBlocks.some(b => b.type === block.type)
              const atMax = placedBlocks.length >= currentChallenge.maxBlocks
              return (
                <button
                  key={block.type}
                  onClick={() => addBlock(block)}
                  disabled={alreadyPlaced || atMax}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    alreadyPlaced ? 'opacity-30 cursor-not-allowed' :
                    atMax ? 'opacity-50 cursor-not-allowed' :
                    block.color
                  } ${!alreadyPlaced && !atMax ? 'hover:shadow-md' : ''}`}
                >
                  <span className="text-lg">{block.icon}</span>
                  <span className="text-sm font-medium">{block.label}</span>
                  {!alreadyPlaced && !atMax && <Plus size={14} className="ml-auto opacity-50" />}
                  {alreadyPlaced && <CheckCircle size={14} className="ml-auto text-green" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Build Area */}
        <div>
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Your Prompt Structure</p>
          <div className="min-h-[300px] border-2 border-dashed border-border-subtle rounded-xl p-3 space-y-2">
              {placedBlocks.length === 0 && (
                <p
                  className="text-sm text-text-muted text-center py-12 animate-fade-in">
                  Click blocks from the palette to build your prompt ←
                </p>
              )
              }
              {placedBlocks.map((block, idx) => (
                <div
                  key={block.id}
                  className={`flex items-center gap-2 p-3 rounded-xl border animate-fade-in ${block.color}`}
                >
                  <span className="text-sm">{block.icon}</span>
                  <span className="text-sm font-medium flex-1">{block.label}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveBlock(idx, 'up')} disabled={idx === 0} className="p-1 rounded hover:bg-black/10 disabled:opacity-20 cursor-pointer"><ArrowUp size={12} /></button>
                    <button onClick={() => moveBlock(idx, 'down')} disabled={idx === placedBlocks.length - 1} className="p-1 rounded hover:bg-black/10 disabled:opacity-20 cursor-pointer"><ArrowDown size={12} /></button>
                    <button onClick={() => removeBlock(idx)} className="p-1 rounded hover:bg-red/20 text-red cursor-pointer"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
          </div>

          <Button variant="primary" size="lg" className="w-full mt-3" onClick={submitAnswer} disabled={placedBlocks.length === 0}>
            Submit Architecture
          </Button>
        </div>
      </div>
    </div>
  )
}
