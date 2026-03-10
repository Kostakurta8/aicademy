'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { getRank } from '@/lib/get-rank'
import { ConfettiBurst, ProgressDots, ScreenFlash, XPPopup, AnimatedScore } from '@/components/ui/GameEffects'
import { Puzzle, Star, RotateCcw, ArrowRight, Trophy, Zap, Check, X, Lightbulb } from 'lucide-react'
import { useXPStore } from '@/stores/xp-store'

interface PromptBlock {
  id: string; label: string; tokens: number; category: 'essential' | 'good' | 'trap'
  description: string; enabled: boolean
}

const levels = [
  {
    id: 1, title: 'Simple Q&A', task: 'Build a prompt to get a clear explanation of photosynthesis', tokenBudget: 120,
    blocks: [
      { id: 'role', label: '🎭 Role: Science Teacher', tokens: 15, category: 'essential' as const, description: 'Gives AI a persona', enabled: false },
      { id: 'task', label: '📝 Task: Explain photosynthesis', tokens: 10, category: 'essential' as const, description: 'The core request', enabled: false },
      { id: 'audience', label: '👤 Audience: High school', tokens: 12, category: 'good' as const, description: 'Adjusts difficulty level', enabled: false },
      { id: 'format', label: '📋 Format: Bullet points', tokens: 8, category: 'good' as const, description: 'Structures the output', enabled: false },
      { id: 'example', label: '💡 Include an analogy', tokens: 18, category: 'good' as const, description: 'Makes it memorable', enabled: false },
      { id: 'length', label: '📏 Under 200 words', tokens: 8, category: 'good' as const, description: 'Controls output length', enabled: false },
      { id: 'tone', label: '🎵 Friendly, encouraging', tokens: 12, category: 'good' as const, description: 'Makes it engaging', enabled: false },
      { id: 'avoid', label: '🚫 Avoid jargon', tokens: 10, category: 'good' as const, description: 'Keeps it accessible', enabled: false },
      { id: 'trap1', label: '🗑️ Repeat yourself 3x', tokens: 35, category: 'trap' as const, description: '⚠️ Wastes tokens!', enabled: false },
      { id: 'trap2', label: '🗑️ Say please/thanks a lot', tokens: 25, category: 'trap' as const, description: '⚠️ Wastes tokens!', enabled: false },
    ],
    essentialIds: ['role', 'task'],
    hint: 'Essential blocks are Role and Task — start there, then add quality enhancers. Avoid the traps!',
  },
  {
    id: 2, title: 'Data Extraction', task: 'Build a prompt to extract structured data from messy text', tokenBudget: 100,
    blocks: [
      { id: 'role', label: '🎭 Role: Data Analyst', tokens: 12, category: 'essential' as const, description: 'Expert persona', enabled: false },
      { id: 'task', label: '📝 Extract name, email, phone', tokens: 15, category: 'essential' as const, description: 'Core extraction task', enabled: false },
      { id: 'format', label: '📋 Output as JSON', tokens: 10, category: 'essential' as const, description: 'Structured output', enabled: false },
      { id: 'schema', label: '🏗️ JSON schema provided', tokens: 20, category: 'good' as const, description: 'Removes ambiguity', enabled: false },
      { id: 'missing', label: '❓ Use null for missing', tokens: 12, category: 'good' as const, description: 'Edge case handling', enabled: false },
      { id: 'noextra', label: '🚫 JSON only, no extra text', tokens: 8, category: 'good' as const, description: 'Clean output', enabled: false },
      { id: 'trap1', label: '🗑️ Long backstory', tokens: 40, category: 'trap' as const, description: '⚠️ Wastes tokens!', enabled: false },
      { id: 'example', label: '💡 Input/output example', tokens: 25, category: 'good' as const, description: 'Few-shot learning', enabled: false },
    ],
    essentialIds: ['role', 'task', 'format'],
    hint: 'Data extraction needs Role, Task, AND Format. JSON is crucial for structured output.',
  },
  {
    id: 3, title: 'Code Review', task: 'Build a prompt for security-focused code review', tokenBudget: 110,
    blocks: [
      { id: 'role', label: '🎭 Security Engineer', tokens: 15, category: 'essential' as const, description: 'Expert security persona', enabled: false },
      { id: 'task', label: '📝 Review for vulnerabilities', tokens: 12, category: 'essential' as const, description: 'Core task', enabled: false },
      { id: 'checklist', label: '✅ OWASP Top 10', tokens: 18, category: 'good' as const, description: 'Industry standard checks', enabled: false },
      { id: 'severity', label: '🔴 Rate severity', tokens: 14, category: 'good' as const, description: 'Prioritize fixes', enabled: false },
      { id: 'fix', label: '🔧 Suggest fixes', tokens: 16, category: 'good' as const, description: 'Actionable output', enabled: false },
      { id: 'context', label: '📦 Node.js Express', tokens: 12, category: 'good' as const, description: 'Tech context', enabled: false },
      { id: 'trap1', label: '🗑️ Be very thorough', tokens: 30, category: 'trap' as const, description: '⚠️ Vague — wastes tokens!', enabled: false },
      { id: 'cot', label: '🧠 Think step by step', tokens: 8, category: 'good' as const, description: 'Chain-of-thought', enabled: false },
    ],
    essentialIds: ['role', 'task'],
    hint: 'Security review needs a specific role. Add OWASP and severity for quality. Avoid vague instructions.',
  },
  {
    id: 4, title: 'Creative Writing', task: 'Build a prompt for a short sci-fi story about AI consciousness', tokenBudget: 95,
    blocks: [
      { id: 'role', label: '🎭 Sci-fi Author', tokens: 12, category: 'essential' as const, description: 'Creative writing persona', enabled: false },
      { id: 'task', label: '📝 Short story: AI awakens', tokens: 15, category: 'essential' as const, description: 'Core creative task', enabled: false },
      { id: 'tone', label: '🎵 Thought-provoking tone', tokens: 10, category: 'good' as const, description: 'Sets the mood', enabled: false },
      { id: 'length', label: '📏 500 words max', tokens: 8, category: 'good' as const, description: 'Controls length', enabled: false },
      { id: 'twist', label: '🌀 Surprise ending', tokens: 10, category: 'good' as const, description: 'Adds narrative hook', enabled: false },
      { id: 'pov', label: '👁️ First person (the AI)', tokens: 12, category: 'good' as const, description: 'Unique perspective', enabled: false },
      { id: 'trap1', label: '🗑️ Make it really good', tokens: 25, category: 'trap' as const, description: '⚠️ Vague — wastes tokens!', enabled: false },
      { id: 'trap2', label: '🗑️ Include citations', tokens: 20, category: 'trap' as const, description: '⚠️ Wrong for fiction!', enabled: false },
    ],
    essentialIds: ['role', 'task'],
    hint: 'Fiction needs persona + task. Add tone and POV for quality. Avoid asking for citations in fiction!',
  },
]

function calculateScore(blocks: PromptBlock[], level: typeof levels[0]) {
  const enabled = blocks.filter(b => b.enabled)
  const totalTokens = enabled.reduce((sum, b) => sum + b.tokens, 0)
  const feedback: string[] = []
  let score = 0

  if (totalTokens > level.tokenBudget) { feedback.push('❌ Over token budget!'); return { score: 0, feedback, grade: 'F' } }

  score += 20; feedback.push('✅ Under token budget!')

  const essentialIncluded = level.essentialIds.every(id => enabled.find(b => b.id === id))
  if (essentialIncluded) { score += 30; feedback.push('✅ All essential blocks included') }
  else feedback.push('⚠️ Missing essential blocks')

  const goodCount = enabled.filter(b => b.category === 'good').length
  const totalGood = blocks.filter(b => b.category === 'good').length
  const goodScore = Math.round((goodCount / totalGood) * 30)
  score += goodScore
  if (goodCount > 0) feedback.push(`✅ ${goodCount}/${totalGood} quality enhancers added`)

  const trapCount = enabled.filter(b => b.category === 'trap').length
  if (trapCount === 0) { score += 20; feedback.push('✅ Avoided all token traps!') }
  else feedback.push(`❌ ${trapCount} trap(s) — wasted tokens!`)

  const grade = getRank(score, [{ min: 90, label: 'S' }, { min: 75, label: 'A' }, { min: 60, label: 'B' }, { min: 40, label: 'C' }], 'D')
  return { score, feedback, grade }
}

export default function TokenTetrisPage() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result' | 'gameOver'>('intro')
  const [levelIdx, setLevelIdx] = useState(0)
  const [blocks, setBlocks] = useState<PromptBlock[]>(levels[0].blocks)
  const [result, setResult] = useState<ReturnType<typeof calculateScore> | null>(null)
  const [totalScore, setTotalScore] = useState(0)
  const [levelScores, setLevelScores] = useState<number[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [flashColor, setFlashColor] = useState<'green' | 'red' | 'gold'>('green')
  const [showHint, setShowHint] = useState(false)
  const addXP = useXPStore((s) => s.addXP)

  const level = levels[levelIdx]
  const usedTokens = blocks.filter(b => b.enabled).reduce((sum, b) => sum + b.tokens, 0)
  const budgetPercent = Math.min(100, (usedTokens / level.tokenBudget) * 100)
  const isOverBudget = usedTokens > level.tokenBudget

  const toggleBlock = (id: string) => {
    if (phase !== 'playing') return
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b))
  }

  const handleSubmit = () => {
    const r = calculateScore(blocks, level)
    setResult(r); setPhase('result')
    setTotalScore(prev => prev + r.score)
    setLevelScores(prev => [...prev, r.score])
    if (r.score >= 80) { setShowConfetti(true); setFlashColor('green') }
    else if (r.score >= 50) setFlashColor('gold')
    else setFlashColor('red')
    setShowFlash(true)
    setTimeout(() => { setShowFlash(false); setShowConfetti(false) }, 1000)
  }

  const handleNext = () => {
    if (levelIdx < levels.length - 1) {
      const next = levelIdx + 1
      setLevelIdx(next); setBlocks(levels[next].blocks); setResult(null)
      setPhase('playing'); setShowHint(false)
    } else {
      setPhase('gameOver')
      addXP(Math.round(totalScore * 1.2))
      setShowConfetti(true); setShowXP(true)
      setTimeout(() => { setShowConfetti(false); setShowXP(false) }, 3000)
    }
  }

  const handleRestart = () => {
    setLevelIdx(0); setBlocks(levels[0].blocks); setResult(null)
    setTotalScore(0); setLevelScores([]); setPhase('intro'); setShowHint(false)
  }

  // ============ INTRO ============
  if (phase === 'intro') {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="animate-celebrate-pop">
          <Card padding="lg" glow className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan to-blue flex items-center justify-center shadow-xl shadow-cyan/20 relative">
              <Puzzle size={40} className="text-white" />
              <div className="animate-pulse absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan to-blue opacity-30" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Token Tetris</h1>
            <p className="text-text-secondary mb-6">Build the best prompt within a token budget. Essential pieces, quality enhancers, and traps!</p>
            <div className="grid grid-cols-3 gap-3 mb-6 max-w-sm mx-auto">
              <div className="p-3 rounded-xl bg-surface-raised"><p className="text-lg font-bold text-text-primary">{levels.length}</p><p className="text-[10px] text-text-muted">Levels</p></div>
              <div className="p-3 rounded-xl bg-surface-raised"><p className="text-lg font-bold text-gold">120+</p><p className="text-[10px] text-text-muted">XP</p></div>
              <div className="p-3 rounded-xl bg-surface-raised"><p className="text-lg font-bold text-red">⚠️</p><p className="text-[10px] text-text-muted">Watch Traps</p></div>
            </div>
            <Button onClick={() => setPhase('playing')} size="lg" className="w-full max-w-sm">
              <Puzzle size={18} className="mr-2" /> Start Building
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // ============ GAME OVER ============
  if (phase === 'gameOver') {
    const avgScore = Math.round(totalScore / levels.length)
    const xpEarned = Math.round(totalScore * 1.2)
    const rank = getRank(avgScore, [{ min: 85, label: '🏆 Token Master' }, { min: 70, label: '🧩 Puzzle Pro' }, { min: 50, label: '🔧 Builder' }], '📝 Rookie')
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ConfettiBurst trigger={showConfetti} />
        <XPPopup amount={xpEarned} show={showXP} />
        <div className="animate-celebrate-pop">
          <Card padding="lg" glow className="text-center">
            <Trophy size={48} className="text-gold mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-text-primary mb-1">All Levels Complete!</h2>
            <p className="text-text-secondary mb-1">{rank}</p>
            <div className="grid grid-cols-3 gap-3 my-6">
              <div className="p-3 rounded-xl bg-surface-raised"><p className="text-xl font-bold text-accent">{totalScore}</p><p className="text-[10px] text-text-muted">Total</p></div>
              <div className="p-3 rounded-xl bg-surface-raised"><p className="text-xl font-bold text-gold">{avgScore}%</p><p className="text-[10px] text-text-muted">Average</p></div>
              <div className="p-3 rounded-xl bg-surface-raised"><p className="text-xl font-bold text-green">+{xpEarned}</p><p className="text-[10px] text-text-muted">XP</p></div>
            </div>
            <div className="space-y-1 mb-6">{levelScores.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted w-24 truncate">{levels[i].title}</span>
                <div className="flex-1 h-2 rounded-full bg-border-subtle overflow-hidden">
                  <div style={{ width: `${s}%`, animationDelay: `${i * 0.1}s` }}
                    className={`h-full rounded-full transition-all duration-300 ${s >= 70 ? 'bg-green' : s >= 40 ? 'bg-gold' : 'bg-red'}`} />
                </div>
                <span className="text-[10px] font-mono text-text-muted w-6">{s}</span>
              </div>
            ))}</div>
            <Button onClick={handleRestart} icon={<RotateCcw size={16} />} size="lg">Play Again</Button>
          </Card>
        </div>
      </div>
    )
  }

  // ============ PLAYING / RESULT ============
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <ConfettiBurst trigger={showConfetti} />
      <ScreenFlash trigger={showFlash} color={flashColor} />

      <div className="animate-fade-in mb-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Puzzle className="text-cyan" size={24} /> Token Tetris
          </h1>
          <AnimatedScore value={totalScore} label="Total" color="text-gold" size="sm" icon={<Star size={12} className="text-gold" />} />
        </div>
        <ProgressDots total={levels.length} current={levelIdx} results={levelScores.map(s => s >= 60)} />
      </div>

        <div className="animate-fade-in">
          <Card padding="md" className="mb-4">
            <h2 className="text-base font-bold text-text-primary">Level {level.id}: {level.title}</h2>
            <p className="text-xs text-text-secondary">{level.task}</p>
          </Card>

          {/* Token Budget Meter */}
          <Card padding="sm" className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-text-secondary">Token Budget</span>
              <span className={`text-sm font-bold font-mono ${isOverBudget ? 'text-red animate-pulse' : 'text-text-primary'}`}>
                {usedTokens} / {level.tokenBudget}
              </span>
            </div>
            <div className="w-full h-4 rounded-full bg-border-subtle overflow-hidden relative">
              <div style={{ width: `${Math.min(100, budgetPercent)}%` }}
                className={`h-full rounded-full transition-all duration-300 ${isOverBudget ? 'bg-red' : budgetPercent > 80 ? 'bg-gold' : 'bg-green'}`} />
              {isOverBudget && <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">OVER BUDGET!</div>}
            </div>
          </Card>

          {/* Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {blocks.map((block, idx) => (
              <button key={block.id} style={{ animationDelay: `${idx * 0.03}s`, animationFillMode: 'both' }}
                onClick={() => toggleBlock(block.id)} disabled={phase !== 'playing'}
                className={`animate-fade-in w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                  block.enabled
                    ? block.category === 'trap' ? 'border-red/50 bg-red/5 shadow-sm shadow-red/10'
                      : block.category === 'essential' ? 'border-green/50 bg-green/5 shadow-sm shadow-green/10'
                      : 'border-accent/50 bg-accent/5 shadow-sm shadow-accent/10'
                    : 'border-border-subtle bg-surface hover:border-accent/30'
                } ${phase !== 'playing' ? 'opacity-80' : ''}`}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium text-text-primary">{block.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-raised text-text-muted">{block.tokens}t</span>
                    {block.enabled ? <Check size={14} className="text-green" /> : <div className="w-3.5 h-3.5 rounded border border-border-subtle" />}
                  </div>
                </div>
                <p className="text-[10px] text-text-muted">{block.description}</p>
              </button>
            ))}
          </div>

          {phase === 'playing' ? (
            <div className="flex gap-2">
              <Button onClick={handleSubmit} size="lg" disabled={blocks.filter(b => b.enabled).length === 0} className="flex-1">
                Lock In Selection
              </Button>
              <Button variant="ghost" onClick={() => setShowHint(!showHint)}>
                <Lightbulb size={16} />
              </Button>
            </div>
          ) : (
            <div className="animate-fade-in">
              <Card padding="lg" className="mb-4 text-center">
                <div
                  className={`animate-celebrate-pop text-5xl font-black mb-1 ${result!.score >= 70 ? 'text-green' : result!.score >= 40 ? 'text-gold' : 'text-red'}`}>
                  {result!.grade}
                </div>
                <p className="text-lg text-text-primary font-bold">{result!.score}/100</p>
                <div className="space-y-1 mt-3 text-left max-w-xs mx-auto">
                  {result!.feedback.map((f, i) => <p key={i} className="text-xs text-text-secondary">{f}</p>)}
                </div>
              </Card>
              <Button onClick={handleNext} icon={<ArrowRight size={16} />} className="w-full" size="lg">
                {levelIdx < levels.length - 1 ? 'Next Level' : '🏆 See Results'}
              </Button>
            </div>
          )}

          {showHint && phase === 'playing' && (
            <div className="animate-fade-in mt-3">
              <Card padding="sm" className="border-l-4 border-l-accent">
                <p className="text-xs text-text-secondary">💡 {level.hint}</p>
              </Card>
            </div>
          )}
        </div>
    </div>
  )
}
