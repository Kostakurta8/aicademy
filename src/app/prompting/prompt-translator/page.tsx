'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { getRank } from '@/lib/get-rank'
import { AnimatedScore, ConfettiBurst, XPPopup, TimerBar, ScreenFlash, ProgressDots, ComboIndicator, StreakFire } from '@/components/ui/GameEffects'
import { useXPStore } from '@/stores/xp-store'
import { useProgressStore } from '@/stores/progress-store'
import { useUserStore } from '@/stores/user-store'
import { playCorrect, playIncorrect, playLevelUp, playXPDing } from '@/lib/sounds'
import { ArrowLeft, Languages, Trophy, Star, RotateCcw, Zap, CheckCircle, XCircle } from 'lucide-react'

// ── Rounds ───────────────────────────────────────────────────────────

interface TranslatorOption {
  text: string; isCorrect: boolean; flaw: string | null
}

interface TranslatorRound {
  id: number; bossMessage: string; context: string
  options: TranslatorOption[]; explanation: string
}

const rounds: TranslatorRound[] = [
  {
    id: 1,
    bossMessage: "Hey, can someone check if our website is fast enough? Getting complaints about load times.",
    context: 'VP of Engineering → AI team',
    options: [
      { text: 'Check website speed.', isCorrect: false, flaw: 'Too vague — no metrics, criteria, or output format' },
      { text: "You are a performance engineer. Analyze:\n- Page load time\n- Time to first byte\n- Core Web Vitals (LCP, FID, CLS)\n\nFor each: score → rating (Good/Fair/Poor) → specific fix.\nOutput as markdown table.", isCorrect: true, flaw: null },
      { text: "PLEASE check our website speed, clients are ANGRY!!! 😡😡😡", isCorrect: false, flaw: 'Emotional manipulation — still lacks specifics and format' },
      { text: "Check speed, fix CSS, optimize images, setup CDN, rewrite JS, add caching, redesign homepage.", isCorrect: false, flaw: 'Overloaded — 7 different tasks crammed into one prompt' },
    ],
    explanation: 'The best prompt sets a role, lists specific metrics, defines a rating system, and requests structured table output.',
  },
  {
    id: 2,
    bossMessage: "John pushed some code yesterday, take a look at it will ya?",
    context: 'Tech lead → AI assistant',
    options: [
      { text: "Look at John's code.", isCorrect: false, flaw: "Too vague — what should you look for? What's the code?" },
      { text: "You're the best code reviewer ever, please review this amazing code and make sure it's perfect. Thanks!!!", isCorrect: false, flaw: "Flattery and emotional language don't improve output quality" },
      { text: "Review this PR for:\n1. Logic errors and edge cases\n2. Security vulnerabilities (injection, XSS)\n3. Performance issues\n\nFor each issue: Severity [Critical/Warning/Info] + fix suggestion.\n\n<code>\n[code here]\n</code>", isCorrect: true, flaw: null },
      { text: "Review the code, write unit tests, update docs, refactor for performance, add error handling, and set up CI/CD.", isCorrect: false, flaw: 'Overloaded — 6 separate tasks, should be individual prompts' },
    ],
    explanation: 'An effective code review prompt lists specific review dimensions, defines severity levels, and wraps code in XML tags.',
  },
  {
    id: 3,
    bossMessage: "We need content for the blog, something about why our product is great.",
    context: 'Marketing VP → Content team',
    options: [
      { text: 'Write about why our product is great.', isCorrect: false, flaw: 'Too vague — no audience, tone, length, or structure defined' },
      { text: "Write a blog post, social media posts, email campaign, press release, and infographic about our product.", isCorrect: false, flaw: 'Overloaded — 5 different content pieces in one prompt' },
      { text: "You are a tech content writer for [Company].\n\nWrite a 600-word blog post:\nTopic: How [Product] solves [specific problem]\nTone: Professional but conversational\nStructure: Hook → Problem → Solution → Social proof → CTA\nKeywords: [keyword1], [keyword2]\nAudience: CTOs at mid-size SaaS companies", isCorrect: true, flaw: null },
      { text: "Please write the BEST blog post EVER about our product! This is super important for the company!!!", isCorrect: false, flaw: 'Emotional pressure with no structure, audience, or content guidelines' },
    ],
    explanation: 'Great content prompts specify persona, audience, word count, tone, structure, keywords, and target reader.',
  },
  {
    id: 4,
    bossMessage: "Need to go through 200 resumes for that senior dev role, help?",
    context: 'HR Manager → Recruiting team',
    options: [
      { text: 'Sort resumes.', isCorrect: false, flaw: 'No criteria, scoring system, or output format specified' },
      { text: "Find me the best candidates, I trust your judgment!", isCorrect: false, flaw: 'No evaluation criteria — "best" is subjective without defined standards' },
      { text: "Screen this resume for Senior Backend Engineer (Python, AWS).\n\nEvaluate:\n- Years relevant experience (min 5)\n- Required: Python, AWS, PostgreSQL, Docker\n- Nice-to-have: Kubernetes, Terraform, CI/CD\n\nOutput:\n{\"score\": 1-10, \"qualified\": true/false, \"strengths\": [], \"gaps\": [], \"flag\": \"strong|possible|pass\"}", isCorrect: true, flaw: null },
      { text: "Sort resumes, schedule interviews, write job descriptions, evaluate salary ranges, create onboarding plans, and design interview questions.", isCorrect: false, flaw: 'Overloaded — 6 tasks that should each be separate prompts' },
    ],
    explanation: 'Resume screening prompts need specific criteria (required vs nice-to-have), scoring rubric, and structured JSON output.',
  },
  {
    id: 5,
    bossMessage: "What are our competitors doing? I need to know what we're up against.",
    context: 'CEO → Strategy team',
    options: [
      { text: 'Tell me about our competitors.', isCorrect: false, flaw: 'No specific competitors, dimensions, or output format mentioned' },
      { text: "Analyze [Competitor X] vs our product [Product Y].\n\nCompare on:\n1. Core features (comparison table)\n2. Pricing tiers\n3. Target market\n4. Key differentiators\n\nThink step by step through each.\nEnd with: 3 threats, 3 opportunities, recommended actions.", isCorrect: true, flaw: null },
      { text: "I'm really worried about competitors, can you help me feel better about our market position? 😟", isCorrect: false, flaw: 'Emotional framing — asking for reassurance instead of objective analysis' },
      { text: "Analyze all competitors, predict market trends for 5 years, design our strategy, create pitch deck, and write investor updates.", isCorrect: false, flaw: 'Overloaded and unrealistic scope — prediction + strategy + multiple documents' },
    ],
    explanation: 'Competitor analysis prompts should name specific competitors, define comparison dimensions, and use chain-of-thought reasoning.',
  },
  {
    id: 6,
    bossMessage: "Some error keeps happening in production, figure it out.",
    context: 'On-call engineer → Debugging AI',
    options: [
      { text: 'Fix the production error.', isCorrect: false, flaw: 'No error details, stack trace, reproduction steps, or context' },
      { text: "URGENT FIX THIS NOW!!! The error is killing us and the CEO is asking questions!!!", isCorrect: false, flaw: 'All urgency, zero information — Claude needs data not pressure' },
      { text: "Debug this production error:\n\nError: TypeError: Cannot read property 'email' of undefined\nStack trace: [trace]\nFrequency: 50+/hour since deploy v2.3.1\n\nAnalyze:\n1. Root cause\n2. Which code path triggers it\n3. Fix with code example\n4. Prevention strategy", isCorrect: true, flaw: null },
      { text: "Fix the error, rewrite the module, add monitoring, set up alerts, create tests, and do a full security audit.", isCorrect: false, flaw: 'Overloaded — debugging, rewriting, monitoring, and auditing are separate tasks' },
    ],
    explanation: 'Debug prompts need the exact error, stack trace, frequency, recent changes, and specific analysis steps.',
  },
  {
    id: 7,
    bossMessage: "Can you make a quick summary of the quarterly report? It's like 50 pages.",
    context: 'CFO → Executive assistant',
    options: [
      { text: 'Summarize this report.', isCorrect: false, flaw: 'No length, audience, focus areas, or output structure specified' },
      { text: "Summarize this quarterly report for the executive team.\n\n<document>[report]</document>\n\nOutput:\n1. Executive Summary (3 sentences)\n2. Key Metrics vs targets (table)\n3. Top 3 wins\n4. Top 3 concerns\n5. Recommended actions\n\nConstraints: Under 500 words. No jargon.", isCorrect: true, flaw: null },
      { text: "Read this whole report and tell me everything important — don't miss ANYTHING! Every detail matters!", isCorrect: false, flaw: 'Contradicts "quick summary" — asking for everything defeats summarization' },
      { text: "Summarize report, create presentation, write board email, generate charts, and prepare all-hands talking points.", isCorrect: false, flaw: 'Overloaded — summary + presentation + email + charts in one prompt' },
    ],
    explanation: 'Summary prompts define audience (executives), output sections, word limits, and constraints (no jargon).',
  },
  {
    id: 8,
    bossMessage: "Users are confused about our product, write something to help them understand it.",
    context: 'Product Manager → Documentation team',
    options: [
      { text: 'Help users understand our product.', isCorrect: false, flaw: 'No document type, audience level, structure, or length specified' },
      { text: "Make the docs AMAZING so users LOVE us and never leave! 🚀✨", isCorrect: false, flaw: 'Emotional goals without structure — "amazing" is not actionable' },
      { text: "Write a Getting Started guide for [Product] for new users.\n\nStructure:\n1. What [Product] does (2 sentences)\n2. Prerequisites (bullet list)\n3. Step-by-step setup (numbered steps)\n4. First task walkthrough\n5. FAQ (top 5 questions)\n\nTone: Friendly, non-technical. Max 1000 words.", isCorrect: true, flaw: null },
      { text: "Write docs, create video scripts, build tutorials, design FAQ bot, set up knowledge base, and add in-app tooltips.", isCorrect: false, flaw: 'Overloaded — 6 different documentation deliverables' },
    ],
    explanation: 'Documentation prompts need specific doc type (Getting Started), clear sections, tone guidance, and word limits.',
  },
  {
    id: 9,
    bossMessage: "This spreadsheet is a mess, can someone make sense of it?",
    context: 'Data analyst → Data engineering AI',
    options: [
      { text: 'Clean up this data.', isCorrect: false, flaw: 'No data format, cleaning rules, or expected output defined' },
      { text: "This data is giving me a headache, just make it RIGHT!!! Please!! 🤯", isCorrect: false, flaw: 'Emotional venting with zero specification of what "right" means' },
      { text: "Clean and standardize this CSV data:\n\n<data>[csv]</data>\n\nTasks:\n1. Remove duplicate rows\n2. Standardize dates → YYYY-MM-DD\n3. Fill missing 'category' from 'product_name'\n4. Flag rows with invalid emails\n\nOutput: cleaned CSV + summary of changes made.", isCorrect: true, flaw: null },
      { text: "Clean data, build database, create dashboards, set up automated reports, train prediction model, and integrate with Salesforce.", isCorrect: false, flaw: 'Overloaded — data cleaning to ML model to CRM integration' },
    ],
    explanation: 'Data cleaning prompts list specific tasks (dedup, standardize, fill, validate) with input/output format.',
  },
  {
    id: 10,
    bossMessage: "We're losing users left and right. Figure out why and fix it.",
    context: 'CEO → Growth team',
    options: [
      { text: 'Why are we losing users?', isCorrect: false, flaw: 'No data provided, no analysis framework, no output format' },
      { text: "PLEASE find out why users HATE us! We need to fix this or we're DOOMED!!! 😱", isCorrect: false, flaw: 'Catastrophizing with no data context — fear is not a prompt strategy' },
      { text: "Analyze churn, redesign onboarding, fix all bugs, improve performance, rebuild pricing page, and create loyalty program.", isCorrect: false, flaw: 'Overloaded — analysis + redesign + development + marketing in one prompt' },
      { text: "Analyze user churn data for Q4 2025.\n\n<data>[churn metrics, exit surveys, usage logs]</data>\n\nThink step by step:\n1. Identify top 3 churn patterns\n2. Correlate with product changes\n3. Compare churned vs retained user behavior\n\nOutput:\n- Root causes (ranked by impact)\n- Evidence for each\n- Recommended interventions with expected impact", isCorrect: true, flaw: null },
    ],
    explanation: 'Churn analysis prompts provide data context, use chain-of-thought reasoning, and request ranked findings with evidence.',
  },
]

const TIME_PER_ROUND = 30

// ── Component ────────────────────────────────────────────────────────

type Phase = 'menu' | 'playing' | 'feedback' | 'results'

export default function PromptTranslatorPage() {
  const [phase, setPhase] = useState<Phase>('menu')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [shuffledOptions, setShuffledOptions] = useState<TranslatorOption[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND)
  const [results, setResults] = useState<boolean[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [flash, setFlash] = useState(false)
  const [flashColor, setFlashColor] = useState<'green' | 'red'>('green')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const soundEnabled = useUserStore((s) => s.soundEnabled)
  const addXP = useXPStore((s) => s.addXP)
  const completeChallenge = useProgressStore((s) => s.completeChallenge)

  const currentRound = rounds[currentIdx]

  const shuffleOptions = useCallback((opts: TranslatorOption[]) => {
    const shuffled = [...opts]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const startGame = useCallback(() => {
    setPhase('playing')
    setCurrentIdx(0)
    setSelectedIdx(null)
    setScore(0)
    setCombo(0)
    setStreak(0)
    setTimeLeft(TIME_PER_ROUND)
    setResults([])
    setShuffledOptions(shuffleOptions(rounds[0].options))
  }, [shuffleOptions])

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx])

  const handleTimeout = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setResults(prev => [...prev, false])
    setCombo(0)
    setStreak(0)
    if (soundEnabled) playIncorrect()
    setFlashColor('red')
    setFlash(true)
    setTimeout(() => setFlash(false), 500)
    setPhase('feedback')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled])

  const selectOption = (idx: number) => {
    if (selectedIdx !== null) return
    if (timerRef.current) clearInterval(timerRef.current)
    setSelectedIdx(idx)
    const option = shuffledOptions[idx]
    const isCorrect = option.isCorrect
    const speedBonus = Math.round((timeLeft / TIME_PER_ROUND) * 50)

    if (isCorrect) {
      const points = 100 + speedBonus + (combo * 25)
      setScore(prev => prev + points)
      setCombo(prev => prev + 1)
      setStreak(prev => prev + 1)
      setResults(prev => [...prev, true])
      setFlashColor('green')
      if (soundEnabled) playCorrect()
    } else {
      setCombo(0)
      setStreak(0)
      setResults(prev => [...prev, false])
      setFlashColor('red')
      if (soundEnabled) playIncorrect()
    }
    setFlash(true)
    setTimeout(() => setFlash(false), 500)
    setPhase('feedback')
  }

  const nextRound = () => {
    if (currentIdx + 1 >= rounds.length) {
      finishGame()
    } else {
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      setSelectedIdx(null)
      setTimeLeft(TIME_PER_ROUND)
      setShuffledOptions(shuffleOptions(rounds[nextIdx].options))
      setPhase('playing')
    }
  }

  const finishGame = () => {
    const correct = results.filter(Boolean).length
    const xpEarned = Math.round((correct / rounds.length) * 180) + Math.round(score / 50)
    addXP(Math.min(xpEarned, 250), 'prompting')
    completeChallenge('prompt-translator')
    setShowConfetti(true)
    setShowXP(true)
    if (soundEnabled) playLevelUp()
    setTimeout(() => { setShowConfetti(false); setShowXP(false) }, 3000)
    setPhase('results')
  }

  const correctCount = results.filter(Boolean).length

  // ── Menu Phase ─────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <Link href="/prompting" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Prompting
        </Link>
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Languages size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Prompt Translator</h1>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Your boss sends vague instructions. Your job: pick the best structured Claude prompt from 4 options. Speed earns bonus points!
          </p>
          <Card padding="lg" className="text-left mb-6">
            <h3 className="font-bold text-text-primary mb-3">📖 How It Works</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2"><span className="text-accent font-bold">1.</span> Read a messy instruction from your &quot;boss&quot;</li>
              <li className="flex gap-2"><span className="text-accent font-bold">2.</span> Pick the best structured prompt from 4 options</li>
              <li className="flex gap-2"><span className="text-accent font-bold">3.</span> Answer fast for speed bonus points</li>
              <li className="flex gap-2"><span className="text-accent font-bold">4.</span> Build combos for consecutive correct answers</li>
            </ul>
            <div className="mt-4 p-3 rounded-xl bg-surface-raised">
              <p className="text-xs text-text-muted"><strong>Scoring:</strong> 100 base + speed bonus (up to 50) + combo bonus (25 per combo level)</p>
            </div>
          </Card>
          <div className="flex items-center justify-center gap-4 mb-6 text-sm text-text-muted">
            <span className="flex items-center gap-1"><Languages size={14} /> {rounds.length} rounds</span>
            <span className="flex items-center gap-1"><Star size={14} className="text-gold" /> Up to 250 XP</span>
            <span>⏱️ ~6 min</span>
          </div>
          <Button onClick={startGame} variant="primary" size="lg" icon={<Zap size={18} />}>Start Translating</Button>
        </div>
      </div>
    )
  }

  // ── Playing Phase ──────────────────────────────────────────────
  if (phase === 'playing') {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ScreenFlash trigger={flash} color={flashColor} />
        <StreakFire streak={streak} />
        <ComboIndicator combo={combo} />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Languages size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Round {currentIdx + 1}/{rounds.length}</p>
              <p className="text-xs text-text-muted">{currentRound.context}</p>
            </div>
          </div>
          <AnimatedScore value={score} label="Score" />
        </div>
        <TimerBar timeLeft={timeLeft} maxTime={TIME_PER_ROUND} warning={8} />
        <ProgressDots total={rounds.length} current={currentIdx} results={results} />

        <div className="mt-4 animate-fade-in">
          {/* Boss Message */}
          <Card padding="md" className="mb-4 border-l-4 border-l-gold">
            <div className="flex items-start gap-2">
              <span className="text-xl">💬</span>
              <div>
                <p className="text-[10px] font-medium text-gold uppercase tracking-wider mb-1">Boss says:</p>
                <p className="text-sm text-text-primary italic leading-relaxed">&quot;{currentRound.bossMessage}&quot;</p>
              </div>
            </div>
          </Card>

          <p className="text-xs font-medium text-text-muted mb-3">Pick the best structured prompt:</p>

          {/* Options */}
          <div className="space-y-3">
            {shuffledOptions.map((option, idx) => (
              <button key={idx}
                style={{ animationDelay: `${idx * 0.08}s`, animationFillMode: 'both' }}
                onClick={() => selectOption(idx)}
                className="w-full text-left cursor-pointer group animate-fade-in">
                <Card padding="md" className="hover:border-accent/50 transition-all group-hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center text-sm font-bold text-text-muted shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono flex-1 leading-relaxed">{option.text}</pre>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Feedback Phase ─────────────────────────────────────────────
  if (phase === 'feedback') {
    const isCorrect = selectedIdx !== null && shuffledOptions[selectedIdx]?.isCorrect
    const correctOption = shuffledOptions.find(o => o.isCorrect)

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ScreenFlash trigger={flash} color={flashColor} />

        <div className="animate-fade-in">
          <div className="text-center mb-6">
            <div
              className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 animate-bounce-in ${isCorrect ? 'bg-green/15' : 'bg-red/15'}`}>
              {isCorrect ? <CheckCircle size={32} className="text-green" /> : <XCircle size={32} className="text-red" />}
            </div>
            <h2 className="text-xl font-bold text-text-primary">{isCorrect ? 'Correct!' : selectedIdx === null ? 'Time\'s Up!' : 'Not Quite!'}</h2>
          </div>

          {/* Boss quote reminder */}
          <Card padding="sm" className="mb-4">
            <p className="text-xs text-text-muted"><strong>Boss:</strong> &quot;{currentRound.bossMessage}&quot;</p>
          </Card>

          {/* Correct answer */}
          <Card padding="md" className="mb-4 border-l-4 border-l-green">
            <p className="text-[10px] font-medium text-green uppercase tracking-wider mb-2">✅ Best Prompt</p>
            <pre className="text-sm text-text-primary whitespace-pre-wrap font-mono bg-surface-raised rounded-xl p-3 leading-relaxed">{correctOption?.text}</pre>
          </Card>

          {/* Why */}
          <Card padding="md" className="mb-4">
            <p className="text-[10px] font-medium text-accent uppercase tracking-wider mb-1">Why this works</p>
            <p className="text-sm text-text-secondary leading-relaxed">{currentRound.explanation}</p>
          </Card>

          {/* Wrong answers explained */}
          {!isCorrect && selectedIdx !== null && (
            <Card padding="md" className="mb-4 border-l-4 border-l-red">
              <p className="text-[10px] font-medium text-red uppercase tracking-wider mb-1">Your choice had a flaw</p>
              <p className="text-sm text-text-secondary">{shuffledOptions[selectedIdx].flaw}</p>
            </Card>
          )}

          <div className="text-center">
            <Button onClick={nextRound} variant="primary" size="lg">
              {currentIdx + 1 >= rounds.length ? '🏆 See Results' : `Next Round (${currentIdx + 2}/${rounds.length})`}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Results Phase ──────────────────────────────────────────────
  if (phase === 'results') {
    const accuracy = Math.round((correctCount / rounds.length) * 100)
    const xpEarned = Math.min(Math.round((correctCount / rounds.length) * 180) + Math.round(score / 50), 250)

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ConfettiBurst trigger={showConfetti} color={accuracy >= 80 ? 'gold' : 'green'} />
        <XPPopup amount={xpEarned} show={showXP} />

        <div className="text-center mb-6 animate-fade-in">
          <div
            className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg animate-bounce-in">
            <Trophy size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-1">Translation Complete!</h1>
          <p className="text-text-secondary">{getRank(accuracy, [{ min: 90, label: 'Flawless translation skills!' }, { min: 70, label: 'Great work!' }, { min: 50, label: 'Not bad, keep practicing!' }], 'Review the lessons and try again!')}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 max-w-md mx-auto">
          {[
            { label: 'Accuracy', value: `${accuracy}%`, icon: Languages, color: 'text-accent' },
            { label: 'Score', value: String(score), icon: Star, color: 'text-gold' },
            { label: 'XP Earned', value: `+${xpEarned}`, icon: Zap, color: 'text-green' },
          ].map(stat => (
            <Card key={stat.label} padding="md" className="text-center">
              <stat.icon size={20} className={`${stat.color} mx-auto mb-1`} />
              <p className="text-lg font-black text-text-primary">{stat.value}</p>
              <p className="text-[10px] text-text-muted">{stat.label}</p>
            </Card>
          ))}
        </div>

        <Card padding="lg" className="mb-6">
          <h3 className="font-bold text-text-primary mb-3">Round Results</h3>
          <div className="space-y-2">
            {rounds.map((round, i) => (
              <div key={round.id} className="flex items-center justify-between p-2 rounded-xl bg-surface-raised">
                <div className="flex items-center gap-2">
                  {results[i] ? <CheckCircle size={16} className="text-green" /> : <XCircle size={16} className="text-red" />}
                  <span className="text-sm text-text-primary truncate">{round.context}</span>
                </div>
                <span className="text-xs text-text-muted">{results[i] ? '✓' : '✗'}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center justify-center gap-3">
          <Button onClick={startGame} variant="secondary" icon={<RotateCcw size={16} />}>Play Again</Button>
          <Link href="/prompting"><Button variant="primary">Back to Prompting</Button></Link>
        </div>
      </div>
    )
  }

  return null
}
