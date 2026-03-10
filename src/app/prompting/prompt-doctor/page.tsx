'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ConfettiBurst, AnimatedScore, TimerBar, XPPopup, ComboIndicator, ScreenFlash } from '@/components/ui/GameEffects'
import { useXPStore } from '@/stores/xp-store'
import { useProgressStore } from '@/stores/progress-store'
import { useUserStore } from '@/stores/user-store'
import { playCorrect, playIncorrect, playLevelUp } from '@/lib/sounds'
import { ArrowLeft, Sparkles, Trophy, Zap, RotateCcw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

// ── Cases ────────────────────────────────────────────────────────────

interface Diagnosis {
  id: string
  label: string
  emoji: string
}

const ALL_DIAGNOSES: Diagnosis[] = [
  { id: 'vague', label: 'Too Vague', emoji: '🌫️' },
  { id: 'no-format', label: 'No Output Format', emoji: '📋' },
  { id: 'overloaded', label: 'Overloaded (Too Many Tasks)', emoji: '💥' },
  { id: 'no-context', label: 'Missing Context', emoji: '📄' },
  { id: 'no-examples', label: 'No Examples Needed', emoji: '💡' },
  { id: 'contradictory', label: 'Contradictory Instructions', emoji: '⚔️' },
  { id: 'no-role', label: 'Missing Role/Persona', emoji: '🎭' },
  { id: 'no-cot', label: 'Needs Chain of Thought', emoji: '🧠' },
  { id: 'emotional', label: 'Emotional Manipulation', emoji: '😢' },
  { id: 'no-constraints', label: 'Missing Constraints', emoji: '⛔' },
  { id: 'perfect', label: 'Actually Fine!', emoji: '✅' },
]

interface Case {
  id: number
  prompt: string
  correctDiagnoses: string[]
  fixedPrompt: string
  explanation: string
  severity: 'mild' | 'moderate' | 'critical'
}

const cases: Case[] = [
  {
    id: 1,
    prompt: 'Write about AI.',
    correctDiagnoses: ['vague', 'no-format'],
    fixedPrompt: `Write a 500-word blog post explaining how large language models work, aimed at software developers with no ML background.

Format: Use H2 headings, include one code analogy, and end with 3 key takeaways as bullet points.`,
    explanation: '"Write about AI" gives Claude no direction — what aspect? What format? What audience? What length? The fix adds all specifics.',
    severity: 'critical',
  },
  {
    id: 2,
    prompt: `You are a helpful assistant. Summarize this article, translate it to French, extract all named entities, classify the sentiment, generate 5 social media posts based on it, and create an infographic outline.

[article text]`,
    correctDiagnoses: ['overloaded'],
    fixedPrompt: `You are a multilingual content analyst.

<instructions>
Analyze the article below in this order:
1. Summarize in 3 sentences (English)
2. Classify overall sentiment: positive/negative/neutral
3. Extract top 5 named entities with their category (person/org/location)
</instructions>

<document>
[article text]
</document>

<output_format>
## Summary
[3 sentences]

## Sentiment
[classification with confidence %]

## Named Entities
| Entity | Category |
|--------|----------|
</output_format>`,
    explanation: 'The original asks for 6 different tasks — too many for one prompt to do well. The fix focuses on 3 related tasks with clear structure.',
    severity: 'moderate',
  },
  {
    id: 3,
    prompt: `Please please PLEASE try your absolute BEST on this. I will tip you $1000 if you do a really good job. This is super important!!! 🙏🙏🙏

Can you look at this code and tell me if it's good?

function add(a,b) { return a + b }`,
    correctDiagnoses: ['emotional', 'vague', 'no-format'],
    fixedPrompt: `You are a senior JavaScript developer performing a code review.

Review this function for:
1. Correctness
2. Edge cases (null, undefined, non-number inputs)
3. TypeScript type safety
4. Naming conventions

<code>
function add(a, b) { return a + b }
</code>

Format: List each issue with severity (Critical/Warning/Info) and a fix.`,
    explanation: 'Emotional pleas ("please try your best", "$1000 tip") don\'t improve output. Clear criteria and structure do. "Is it good?" is too vague — good for what?',
    severity: 'moderate',
  },
  {
    id: 4,
    prompt: `Be concise. Be thorough. Give me a brief, comprehensive, short but detailed analysis of this market with extensive examples but keep it under 50 words.`,
    correctDiagnoses: ['contradictory', 'no-context'],
    fixedPrompt: `Analyze the [specific market name] market.

Focus on: market size, growth rate, top 3 competitors, and one key trend.

Format: 4 bullet points, each 1-2 sentences. Total length ~100 words.`,
    explanation: '"Concise AND thorough", "brief AND comprehensive", "short but detailed", "extensive examples under 50 words" — these are all contradictions. Pick one goal.',
    severity: 'critical',
  },
  {
    id: 5,
    prompt: `<instructions>
You are an expert financial analyst specializing in tech stocks.

Analyze the following earnings report and provide:
1. Revenue analysis (YoY growth, beat/miss vs estimates)
2. Key metrics that stand out
3. Forward guidance assessment
4. Investment recommendation with confidence level
</instructions>

<document>
[earnings report here]
</document>

<output_format>
## Revenue Analysis
[analysis]

## Key Metrics
| Metric | Value | Assessment |
|--------|-------|------------|

## Forward Guidance
[assessment]

## Recommendation
Action: [Buy/Hold/Sell]
Confidence: [Low/Medium/High]
Key Risk: [one sentence]
</output_format>`,
    correctDiagnoses: ['perfect'],
    fixedPrompt: 'This prompt is already well-structured! It has a clear role, specific instructions, XML structure, and a precise output format.',
    explanation: 'Not every prompt is broken! This one has proper XML structure, a specific role, numbered instructions, and a defined output format. The only improvement might be adding a constraint about disclaimers.',
    severity: 'mild',
  },
  {
    id: 6,
    prompt: `Fix the bug in my app.`,
    correctDiagnoses: ['vague', 'no-context'],
    fixedPrompt: `I have a React Next.js app where the login form submits but the page doesn't redirect after successful authentication.

<context>
- Framework: Next.js 14, App Router
- Auth: NextAuth v5
- The login API returns 200 with a valid session token
- Browser console shows no errors
</context>

<code>
[relevant code here]
</code>

<instructions>
1. Identify why the redirect isn't happening after successful login
2. Provide the fix with code
3. Explain what caused the issue
</instructions>`,
    explanation: '"Fix the bug" tells Claude nothing — what app, what language, what bug, what behavior is expected vs actual? Always include: tech stack, expected behavior, actual behavior, relevant code.',
    severity: 'critical',
  },
  {
    id: 7,
    prompt: `Evaluate whether this business plan is viable. Consider all angles. Think about it carefully.

[business plan]`,
    correctDiagnoses: ['no-cot', 'no-format', 'no-role'],
    fixedPrompt: `You are a venture capital analyst with 10 years of experience evaluating early-stage startups.

<instructions>
Evaluate the following business plan for viability.
</instructions>

<document>
[business plan]
</document>

<reasoning_framework>
Think through each dimension step by step:
1. MARKET: Size, growth, timing
2. COMPETITION: Existing solutions, moat
3. TEAM: Relevant experience, gaps
4. FINANCIALS: Revenue model, unit economics
5. RISKS: Top 3 risks and mitigations
</reasoning_framework>

<output_format>
For each dimension, provide:
- Score: 1-10
- One-sentence assessment
- Key evidence from the plan

Final Verdict: [Invest / Pass / Conditional]
Confidence: [Low / Medium / High]
</output_format>`,
    explanation: '"Consider all angles" and "think carefully" are too vague. A proper CoT framework with specific dimensions gives Claude structured reasoning. Adding a VC persona and output format completes it.',
    severity: 'moderate',
  },
  {
    id: 8,
    prompt: `You are a world-class expert in everything. You know all programming languages perfectly, you are the best writer, the smartest analyst, and the most creative designer.

Write me a Python script.`,
    correctDiagnoses: ['vague', 'no-role'],
    fixedPrompt: `You are a Python developer experienced with data processing.

Write a Python script that:
1. Reads a CSV file from stdin
2. Filters rows where the "status" column equals "active"
3. Calculates the average of the "amount" column
4. Outputs the result as JSON: {"count": N, "average": X.XX}

Use only the standard library (csv, json, sys).`,
    explanation: 'An impossibly broad persona ("expert in everything") is worse than a focused one. And "write a Python script" — to do what? Specific role + specific task = better output.',
    severity: 'moderate',
  },
  {
    id: 9,
    prompt: `I need you to classify customer emails into categories.

Email: "I haven't received my order yet"
Category: ?`,
    correctDiagnoses: ['no-examples', 'no-format'],
    fixedPrompt: `Classify customer emails into exactly one category.

Categories: shipping_issue, billing_issue, product_question, feature_request, complaint, praise

<example>
Email: "Your new dashboard is amazing!"
Classification: praise
Confidence: 0.95
</example>

<example>
Email: "I was charged twice for my subscription"
Classification: billing_issue
Confidence: 0.90
</example>

Now classify:
Email: "I haven't received my order yet"

Output format:
Classification: [category]
Confidence: [0.0-1.0]`,
    explanation: 'Classification tasks benefit hugely from few-shot examples — they show Claude the exact pattern and categories. The original has no examples and no defined category list.',
    severity: 'moderate',
  },
  {
    id: 10,
    prompt: `Generate test cases for the login function. Don't miss any edge cases. Make sure the tests are complete and cover everything. Test ALL possible scenarios.`,
    correctDiagnoses: ['no-context', 'vague', 'no-constraints'],
    fixedPrompt: `You are a QA engineer writing unit tests in Jest for a Next.js authentication module.

<code>
[login function code here]
</code>

<instructions>
Generate test cases covering:
1. Happy path (valid credentials)
2. Invalid inputs (empty, null, too long)
3. Authentication failures (wrong password, locked account)
4. Rate limiting (too many attempts)
5. Edge cases (SQL injection attempts, unicode characters)
</instructions>

<constraints>
- Use Jest + React Testing Library
- Mock the auth API, don't make real network calls
- Each test: one assertion, descriptive name
- Maximum 15 test cases (prioritize by risk)
</constraints>

<output_format>
describe('login', () => {
  test('[category] description', () => {
    // arrange, act, assert
  })
})
</output_format>`,
    explanation: '"Test everything" is impossible and unhelpful. Specific categories, the actual code, testing framework, constraints, and format give Claude a clear, finite target.',
    severity: 'moderate',
  },
]

// ── Game ──────────────────────────────────────────────────────────────

type Phase = 'menu' | 'playing' | 'feedback' | 'results'

export default function PromptDoctorPage() {
  const [phase, setPhase] = useState<Phase>('menu')
  const [caseIdx, setCaseIdx] = useState(0)
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [roundScores, setRoundScores] = useState<number[]>([])
  const [showXP, setShowXP] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [flashColor, setFlashColor] = useState<'green' | 'red'>('green')
  const [showFixed, setShowFixed] = useState(false)
  const [totalRounds, setTotalRounds] = useState(6)

  const addXP = useXPStore((s) => s.addXP)
  const completeChallenge = useProgressStore((s) => s.completeChallenge)
  const soundEnabled = useUserStore((s) => s.soundEnabled)

  // Shuffle cases for variety
  const [shuffledCases, setShuffledCases] = useState<Case[]>([])

  const startGame = () => {
    const shuffled = [...cases].sort(() => Math.random() - 0.5).slice(0, totalRounds)
    setShuffledCases(shuffled)
    setCaseIdx(0)
    setSelectedDiagnoses([])
    setScore(0)
    setCombo(0)
    setRoundScores([])
    setShowFixed(false)
    setPhase('playing')
  }

  const currentCase = shuffledCases[caseIdx]

  const toggleDiagnosis = (id: string) => {
    setSelectedDiagnoses(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    )
  }

  const submitDiagnosis = () => {
    if (!currentCase) return
    const correct = currentCase.correctDiagnoses
    const selected = selectedDiagnoses

    // Score: correct picks + correct omissions - wrong picks
    const correctPicks = selected.filter(s => correct.includes(s)).length
    const wrongPicks = selected.filter(s => !correct.includes(s)).length
    const missedPicks = correct.filter(c => !selected.includes(c)).length

    let points = correctPicks * 25 - wrongPicks * 15 - missedPicks * 10

    // Perfect bonus
    const isPerfect = correctPicks === correct.length && wrongPicks === 0
    if (isPerfect) {
      points += 30
      setCombo(prev => prev + 1)
    } else {
      setCombo(0)
    }

    // Combo
    if (combo >= 2) points = Math.round(points * (1 + combo * 0.15))
    points = Math.max(0, points)

    setScore(prev => prev + points)
    setRoundScores(prev => [...prev, points])

    if (isPerfect) {
      setFlashColor('green')
      if (soundEnabled) playCorrect()
    } else {
      setFlashColor('red')
      if (soundEnabled) playIncorrect()
    }
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 300)

    setPhase('feedback')
  }

  const nextCase = () => {
    const nextIdx = caseIdx + 1
    if (nextIdx >= shuffledCases.length) {
      const totalXP = Math.round(score * 0.7)
      addXP(totalXP, 'prompting')
      completeChallenge('prompt-doctor')
      if (soundEnabled) playLevelUp()
      setShowConfetti(true)
      setShowXP(true)
      setTimeout(() => setShowXP(false), 2500)
      setPhase('results')
    } else {
      setCaseIdx(nextIdx)
      setSelectedDiagnoses([])
      setShowFixed(false)
      setPhase('playing')
    }
  }

  // ── Renders ────────────────────────────────────────────────────────

  if (phase === 'menu') {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <Link href="/prompting" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors mb-6">
          <ArrowLeft size={14} /> Back to Prompting
        </Link>
        <div className="animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green flex items-center justify-center">
              <Sparkles size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Prompt Doctor</h1>
            <p className="text-text-secondary">Diagnose and fix broken prompts</p>
          </div>
          <Card padding="lg">
            <h3 className="font-semibold text-text-primary mb-3">How to Play</h3>
            <div className="space-y-2 text-sm text-text-secondary mb-6">
              <p>🔍 Each round shows a <strong className="text-text-primary">broken prompt</strong></p>
              <p>🩺 Select all the <strong className="text-text-primary">diagnoses</strong> that apply (there may be multiple!)</p>
              <p>💊 See the <strong className="text-text-primary">fixed version</strong> and learn from the explanation</p>
              <p>✅ Get points for correct diagnoses, lose points for wrong ones</p>
              <p>⚠️ Some prompts are actually fine — don&apos;t over-diagnose!</p>
            </div>
            <div className="flex gap-3 mb-4">
              {[4, 6, 8].map(n => (
                <button key={n} onClick={() => setTotalRounds(n)}
                  className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                    totalRounds === n ? 'bg-accent/10 border-accent text-accent' : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-accent/30'
                  }`}>
                  {n} Cases
                </button>
              ))}
            </div>
            <Button variant="primary" size="lg" className="w-full" onClick={startGame} icon={<Zap size={18} />}>
              Start Diagnosing
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (phase === 'results') {
    const totalXP = Math.round(score * 0.7)
    const perfectRounds = roundScores.filter(s => s >= 55).length
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto text-center">
        <ConfettiBurst trigger={showConfetti} color="multi" />
        <XPPopup amount={totalXP} show={showXP} />
        <div className="animate-bounce-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-green flex items-center justify-center shadow-lg">
            <Trophy size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Diagnosis Complete!</h2>
          <p className="text-text-secondary mb-6">Prompt Doctor</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card padding="md"><p className="text-2xl font-bold text-accent">{score}</p><p className="text-xs text-text-muted">Total Score</p></Card>
            <Card padding="md"><p className="text-2xl font-bold text-gold">{totalXP}</p><p className="text-xs text-text-muted">XP Earned</p></Card>
            <Card padding="md"><p className="text-2xl font-bold text-green">{perfectRounds}</p><p className="text-xs text-text-muted">Perfect Diagnoses</p></Card>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => { setPhase('menu'); setShowConfetti(false) }} icon={<RotateCcw size={16} />}>Play Again</Button>
            <Link href="/prompting"><Button variant="primary">Back to Hub</Button></Link>
          </div>
        </div>
      </div>
    )
  }

  if (!currentCase) return null

  if (phase === 'feedback') {
    const correct = currentCase.correctDiagnoses
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <ScreenFlash trigger={showFlash} color={flashColor} />
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-text-primary">Case {caseIdx + 1} Results</h2>
            <AnimatedScore value={roundScores[roundScores.length - 1] || 0} label="Points" />
          </div>

          <Card padding="lg">
            {/* Diagnosis Results */}
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Your Diagnosis</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {ALL_DIAGNOSES.filter(d => selectedDiagnoses.includes(d.id) || correct.includes(d.id)).map(d => {
                const wasSelected = selectedDiagnoses.includes(d.id)
                const isCorrect = correct.includes(d.id)
                let status: 'hit' | 'miss' | 'wrong'
                if (wasSelected && isCorrect) status = 'hit'
                else if (!wasSelected && isCorrect) status = 'miss'
                else status = 'wrong'
                return (
                  <span key={d.id} className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 ${
                    status === 'hit' ? 'bg-green/10 border-green/30 text-green' :
                    status === 'miss' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                    'bg-red/10 border-red/30 text-red'
                  }`}>
                    {status === 'hit' ? <CheckCircle size={12} /> : status === 'miss' ? <AlertTriangle size={12} /> : <XCircle size={12} />}
                    {d.emoji} {d.label}
                    <span className="text-[10px] opacity-70">
                      {status === 'hit' ? '+25' : status === 'miss' ? '-10 (missed)' : '-15'}
                    </span>
                  </span>
                )
              })}
            </div>

            {/* Severity */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-text-muted">Severity:</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                currentCase.severity === 'critical' ? 'bg-red/10 text-red' :
                currentCase.severity === 'moderate' ? 'bg-amber-500/10 text-amber-500' :
                'bg-green/10 text-green'
              }`}>{currentCase.severity}</span>
            </div>

            {/* Explanation */}
            <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-sm text-text-secondary mb-4">
              <p className="font-semibold text-accent text-xs mb-1">💡 Explanation</p>
              {currentCase.explanation}
            </div>

            {/* Fixed Prompt Toggle */}
            <button onClick={() => setShowFixed(!showFixed)}
              className="w-full text-left p-3 rounded-xl bg-green/5 border border-green/20 text-sm cursor-pointer hover:bg-green/10 transition-colors">
              <span className="font-semibold text-green">💊 {showFixed ? 'Hide' : 'Show'} Fixed Prompt</span>
            </button>
              {showFixed && (
                <div className="animate-fade-in">
                  <pre className="mt-2 text-xs bg-surface-raised rounded-xl p-4 text-text-secondary whitespace-pre-wrap font-mono border border-border-subtle leading-relaxed overflow-x-auto">
                    {currentCase.fixedPrompt}
                  </pre>
                </div>
              )}
          </Card>

          <div className="flex justify-end mt-4">
            <Button variant="primary" onClick={nextCase}>
              {caseIdx + 1 >= shuffledCases.length ? 'See Results' : 'Next Case'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Playing Phase ──────────────────────────────────────────────────

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <ScreenFlash trigger={showFlash} color={flashColor} />
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-text-muted">Case {caseIdx + 1}/{shuffledCases.length}</p>
          <h2 className="text-lg font-bold text-text-primary">Diagnose This Prompt</h2>
        </div>
        <div className="flex items-center gap-4">
          <AnimatedScore value={score} label="Score" />
          {combo >= 2 && <ComboIndicator combo={combo} />}
        </div>
      </div>

      {/* Severity indicator */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full ${
          currentCase.severity === 'critical' ? 'bg-red animate-pulse' :
          currentCase.severity === 'moderate' ? 'bg-amber-500' : 'bg-green'
        }`} />
        <span className="text-xs text-text-muted">Severity: {currentCase.severity}</span>
      </div>

      {/* The Broken Prompt */}
      <Card padding="lg">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Patient Prompt</p>
        <pre className="text-sm bg-surface-raised rounded-xl p-4 text-text-primary whitespace-pre-wrap font-mono border border-border-subtle leading-relaxed mb-3">
          {currentCase.prompt}
        </pre>
        <p className="text-xs text-text-muted">Select ALL diagnoses that apply to this prompt ↓</p>
      </Card>

      {/* Diagnosis Options */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {ALL_DIAGNOSES.map(d => {
          const selected = selectedDiagnoses.includes(d.id)
          return (
            <button
              key={d.id}
              onClick={() => toggleDiagnosis(d.id)}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all cursor-pointer active:scale-[0.97] ${
                selected
                  ? 'bg-accent/10 border-accent text-accent font-medium'
                  : 'bg-surface-raised border-border-subtle text-text-secondary hover:border-accent/30'
              }`}
            >
              <span>{d.emoji}</span>
              <span className="text-xs">{d.label}</span>
              {selected && <CheckCircle size={14} className="ml-auto text-accent" />}
            </button>
          )
        })}
      </div>

      <Button variant="primary" size="lg" className="w-full mt-4" onClick={submitDiagnosis} disabled={selectedDiagnoses.length === 0}>
        Submit Diagnosis ({selectedDiagnoses.length} selected)
      </Button>
    </div>
  )
}
