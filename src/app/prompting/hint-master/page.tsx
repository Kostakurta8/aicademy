'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { getRank } from '@/lib/get-rank'
import { AnimatedScore, ConfettiBurst, XPPopup, TimerBar, ScreenFlash, ProgressDots, ComboIndicator, StreakFire, LivesDisplay } from '@/components/ui/GameEffects'
import { useXPStore } from '@/stores/xp-store'
import { useProgressStore } from '@/stores/progress-store'
import { useUserStore } from '@/stores/user-store'
import { playCorrect, playIncorrect, playLevelUp, playXPDing } from '@/lib/sounds'
import { ArrowLeft, Crosshair, Trophy, Star, RotateCcw, Zap, CheckCircle, XCircle, Eye } from 'lucide-react'

// ── Cases ────────────────────────────────────────────────────────────

interface HintOption {
  text: string; isCorrect: boolean; explanation: string
}

interface HintCase {
  id: number
  prompt: string
  problem: string
  hint: string
  options: HintOption[]
  improvedPrompt: string
}

const cases: HintCase[] = [
  {
    id: 1,
    prompt: 'Write about AI.',
    problem: "Claude's response was 2000 words of unfocused rambling covering 10 different topics with no clear direction.",
    hint: 'The prompt lacks specificity — no topic focus, length, audience, or format.',
    options: [
      { text: 'Add: "Keep it under 300 words, focused on transformer attention mechanisms for ML beginners."', isCorrect: true, explanation: 'Adds topic focus, word limit, and target audience — addresses all three root causes.' },
      { text: 'Add: "Please try your very best!"', isCorrect: false, explanation: 'Emotional encouragement doesn\'t add specificity or constraints.' },
      { text: 'Add: "Make it interesting."', isCorrect: false, explanation: '"Interesting" is subjective — Claude still has no direction on topic, length, or audience.' },
      { text: 'Add: "Write about AI and also blockchain and quantum computing."', isCorrect: false, explanation: 'Adding MORE topics makes the problem worse, not better.' },
    ],
    improvedPrompt: 'Write a 300-word blog post about transformer attention mechanisms, aimed at ML beginners. Use simple analogies.',
  },
  {
    id: 2,
    prompt: 'Summarize this article: [article text]',
    problem: "Claude wrote a 500-word essay-style response instead of the brief key-points summary you needed.",
    hint: 'No length constraint or output format was specified.',
    options: [
      { text: 'Add: "Use exactly 3 bullet points, max 20 words each."', isCorrect: true, explanation: 'Defines exact format (bullets), count (3), and length limit (20 words) — impossible to ramble.' },
      { text: 'Add: "Summarize it better."', isCorrect: false, explanation: '"Better" is vague — Claude has no idea what format or length you want.' },
      { text: 'Add: "Make it shorter somehow."', isCorrect: false, explanation: '"Somehow" and "shorter" are imprecise — how short? What format?' },
      { text: 'Add: "Also translate to French and annotate."', isCorrect: false, explanation: 'Adding tasks doesn\'t fix the core problem — and now you have 3 tasks in 1 prompt.' },
    ],
    improvedPrompt: 'Summarize this article in exactly 3 bullet points, max 20 words each:\n\n[article text]',
  },
  {
    id: 3,
    prompt: 'You are a helpful assistant. Review this code:\n\n[code block]',
    problem: 'Claude gave vague feedback like "looks good overall" with no actionable suggestions or specific issues.',
    hint: 'The prompt doesn\'t specify WHAT to look for or how to structure feedback.',
    options: [
      { text: 'Add: "Focus on: security vulnerabilities (injection, XSS), edge cases, and performance. Severity: Critical/Warning/Info."', isCorrect: true, explanation: 'Defines specific review dimensions, categories, and severity levels — forces actionable output.' },
      { text: 'Add: "Review it more carefully."', isCorrect: false, explanation: '"More carefully" doesn\'t tell Claude what to look for — still no criteria.' },
      { text: 'Add: "I\'ll tip you $100 for a good review."', isCorrect: false, explanation: 'Financial incentives don\'t work on AI — provide criteria instead.' },
      { text: 'Add: "You are the best code reviewer ever!"', isCorrect: false, explanation: 'Flattery doesn\'t substitute for specific review criteria and output format.' },
    ],
    improvedPrompt: 'You are a senior security engineer. Review this code for:\n1. Security vulnerabilities (injection, XSS)\n2. Edge cases\n3. Performance issues\n\nFormat: | Issue | Severity | Fix |\n\n[code block]',
  },
  {
    id: 4,
    prompt: 'Analyze this data and give me insights:\n\n[data table]',
    problem: "Claude's analysis was generic and surface-level — missed key trends and gave insights that could apply to any dataset.",
    hint: 'No analysis framework or specific dimensions to investigate.',
    options: [
      { text: 'Add: "Think step by step. First identify trends, then anomalies, then correlations. Support each insight with specific data points."', isCorrect: true, explanation: 'Chain-of-thought reasoning forces deeper analysis with evidence instead of surface observations.' },
      { text: 'Add: "Analyze deeper."', isCorrect: false, explanation: '"Deeper" is vague — doesn\'t define what dimensions to analyze or what "deep" means.' },
      { text: 'Add: "Give me MORE insights."', isCorrect: false, explanation: 'More quantity doesn\'t mean more quality — specificity of analysis matters.' },
      { text: 'Add: "This is really important, please focus."', isCorrect: false, explanation: 'Emotional urgency doesn\'t improve analytical depth — structured reasoning does.' },
    ],
    improvedPrompt: 'Analyze this data step by step:\n1. Identify top 3 trends (with % changes)\n2. Flag anomalies (values 2+ std dev from mean)\n3. Find correlations between columns\n\nSupport each insight with specific data points.\n\n[data table]',
  },
  {
    id: 5,
    prompt: 'Convert this meeting transcript to action items:\n\n[transcript]',
    problem: "Claude listed action items but without owners, deadlines, or priority — just a vague to-do list.",
    hint: 'Output structure and required fields were not defined.',
    options: [
      { text: 'Add: "Output format: | Owner | Action | Deadline | Priority (P0-P3) |. Infer deadlines from context if mentioned."', isCorrect: true, explanation: 'Defines exact table columns, priority scale, and how to handle missing info — produces usable output.' },
      { text: 'Add: "Include all the details."', isCorrect: false, explanation: '"All the details" doesn\'t define what details — owner? deadline? priority?' },
      { text: 'Add: "Make it more structured."', isCorrect: false, explanation: '"Structured" is vague — what structure? Table? JSON? Bullet list?' },
      { text: 'Add: "Convert it better this time."', isCorrect: false, explanation: '"Better" gives no information about what was wrong or what to change.' },
    ],
    improvedPrompt: 'Convert this meeting transcript to action items.\n\nOutput: | Owner | Action Item | Deadline | Priority (P0-P3) |\nIf deadline not mentioned, write "TBD". If owner unclear, write "Unassigned".\n\n[transcript]',
  },
  {
    id: 6,
    prompt: 'Be concise and thorough. Give a brief but comprehensive analysis of market trends.',
    problem: "Claude seemed confused, alternating between short and long paragraphs — the output felt contradictory and inconsistent.",
    hint: 'The prompt contains contradictory instructions: "concise" vs "thorough", "brief" vs "comprehensive".',
    options: [
      { text: 'Replace with: "Give a thorough analysis using bullet points (max 1 sentence each) to stay concise."', isCorrect: true, explanation: 'Resolves the contradiction — thorough in coverage, concise in format. Bullet points enforce brevity.' },
      { text: 'Add: "Try harder to do both."', isCorrect: false, explanation: 'The instructions are contradictory — trying harder doesn\'t resolve logical conflicts.' },
      { text: 'Add: "Be VERY concise AND VERY thorough."', isCorrect: false, explanation: 'Emphasizing contradictions makes them worse, not better.' },
      { text: 'Add: "This is urgent!!!"', isCorrect: false, explanation: 'Urgency doesn\'t fix contradictory instructions — the logic conflict remains.' },
    ],
    improvedPrompt: 'Analyze market trends for [industry] in Q4 2025.\n\nFormat: bullet points, max 1 sentence each.\nCover: pricing, demand, competition, emerging tech, risks.\nPrioritize by business impact.',
  },
  {
    id: 7,
    prompt: 'Classify this customer email: "I love your product but shipping was slow."',
    problem: 'Claude wrote a full paragraph analyzing the email instead of returning a clean classification label.',
    hint: 'Output format was never specified — Claude defaulted to natural language.',
    options: [
      { text: 'Add: "Respond ONLY in JSON: {\\"sentiment\\": \\"mixed|positive|negative\\", \\"topic\\": \\"shipping|product|billing|other\\", \\"urgency\\": \\"low|medium|high\\"}"', isCorrect: true, explanation: 'JSON format with predefined values forces clean, parseable output — no room for prose.' },
      { text: 'Add: "Just classify it."', isCorrect: false, explanation: '"Classify" without a format could still return a paragraph: "This is a mixed sentiment email about..."' },
      { text: 'Add: "Give a shorter response."', isCorrect: false, explanation: 'Shorter prose is still not structured data — you need to specify the exact format.' },
      { text: 'Add: "You are a classifier."', isCorrect: false, explanation: 'A role without output format still produces natural language — classifiers need schemas.' },
    ],
    improvedPrompt: 'Classify this customer email.\n\nRespond ONLY in JSON:\n{"sentiment": "mixed|positive|negative", "topic": "shipping|product|billing|other", "urgency": "low|medium|high"}\n\nEmail: "I love your product but shipping was slow."',
  },
  {
    id: 8,
    prompt: 'Debug this function:\ndef calc(x): return x * 2 + 1',
    problem: 'Claude said "the function looks correct" because, syntactically, it is — but it doesn\'t compute what you need.',
    hint: 'Claude doesn\'t know what the function SHOULD do — expected behavior was never stated.',
    options: [
      { text: 'Add: "This should return x² + 1 (x squared plus one), but returns x*2+1 instead. Find and explain the bug."', isCorrect: true, explanation: 'Providing expected behavior lets Claude compare actual vs expected output and identify the discrepancy.' },
      { text: 'Add: "There\'s definitely a bug, find it."', isCorrect: false, explanation: 'Without knowing expected behavior, Claude can\'t determine what\'s wrong — the syntax is valid.' },
      { text: 'Add: "Debug it more carefully."', isCorrect: false, explanation: '"More carefully" doesn\'t help — the code IS syntactically correct. Claude needs to know intent.' },
      { text: 'Add: "I know there\'s a bug, please look harder."', isCorrect: false, explanation: 'Persistence doesn\'t substitute for information — Claude needs expected vs actual behavior.' },
    ],
    improvedPrompt: 'Debug this function:\n\ndef calc(x): return x * 2 + 1\n\nExpected: calc(3) should return 10 (x² + 1)\nActual: calc(3) returns 7 (x * 2 + 1)\n\nFind the bug and provide the fix.',
  },
  {
    id: 9,
    prompt: 'Write tests for this API endpoint: POST /users',
    problem: 'Claude only wrote happy-path tests — creating a valid user. No edge cases, error scenarios, or security tests.',
    hint: 'The prompt only said "write tests" without specifying WHICH scenarios to cover.',
    options: [
      { text: 'Add: "Include: happy path, invalid input (empty body, bad email), auth failures (no token, expired), edge cases (duplicate email, SQL injection attempt)."', isCorrect: true, explanation: 'Explicitly listing test categories ensures comprehensive coverage across happy path, errors, and security.' },
      { text: 'Add: "Write more tests."', isCorrect: false, explanation: '"More" could mean 10 more happy-path tests — quantity ≠ comprehensive coverage.' },
      { text: 'Add: "Write REALLY thorough tests."', isCorrect: false, explanation: '"Thorough" is subjective — Claude\'s definition may differ from yours.' },
      { text: 'Add: "Test everything possible."', isCorrect: false, explanation: '"Everything possible" is infinite — explicit test categories are actionable.' },
    ],
    improvedPrompt: 'Write tests for POST /users endpoint:\n\n1. Happy path: valid user creation\n2. Invalid input: empty body, invalid email, missing required fields\n3. Auth: no token, expired token, insufficient permissions\n4. Edge cases: duplicate email, SQL injection in name field, max-length name\n\nUse Jest. Include expected status codes and response bodies.',
  },
  {
    id: 10,
    prompt: "You're an expert. Help me with my startup idea.",
    problem: 'Claude gave completely generic startup advice that could apply to any business — "know your customer, build an MVP, iterate fast."',
    hint: 'No context about the startup, market, stage, or what kind of help is needed.',
    options: [
      { text: 'Add: "My startup is a B2B SaaS for restaurant inventory management. We have 5 beta users. Evaluate: market size, top 3 competitors, and MVP feature priorities."', isCorrect: true, explanation: 'Specific context (industry, model, stage, users) plus defined analysis dimensions produce actionable advice.' },
      { text: 'Add: "You\'re REALLY an expert."', isCorrect: false, explanation: 'Emphasizing expertise doesn\'t provide the context Claude needs about your specific business.' },
      { text: 'Add: "Give me specific advice."', isCorrect: false, explanation: '"Specific" without context is paradoxical — specific about what? Claude doesn\'t know your business.' },
      { text: 'Add: "I need good advice, it\'s important to me!!!"', isCorrect: false, explanation: 'Emotional stakes don\'t compensate for missing information about the startup.' },
    ],
    improvedPrompt: "You are a startup advisor specializing in B2B SaaS.\n\nMy startup: Restaurant inventory management SaaS\nStage: Pre-seed, 5 beta users\nAsk: Evaluate market size, identify top 3 competitors, and recommend MVP feature priorities.\n\nThink step by step through each dimension.",
  },
]

const TIME_PER_CASE = 25

// ── Component ────────────────────────────────────────────────────────

type Phase = 'menu' | 'playing' | 'feedback' | 'results'

export default function HintMasterPage() {
  const [phase, setPhase] = useState<Phase>('menu')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [streak, setStreak] = useState(0)
  const [lives, setLives] = useState(3)
  const [timeLeft, setTimeLeft] = useState(TIME_PER_CASE)
  const [results, setResults] = useState<boolean[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [flash, setFlash] = useState(false)
  const [flashColor, setFlashColor] = useState<'green' | 'red'>('green')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const soundEnabled = useUserStore((s) => s.soundEnabled)
  const addXP = useXPStore((s) => s.addXP)
  const completeChallenge = useProgressStore((s) => s.completeChallenge)

  const currentCase = cases[currentIdx]

  const startGame = useCallback(() => {
    setPhase('playing')
    setCurrentIdx(0)
    setSelectedIdx(null)
    setScore(0)
    setCombo(0)
    setStreak(0)
    setLives(3)
    setTimeLeft(TIME_PER_CASE)
    setResults([])
  }, [])

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
    setLives(prev => prev - 1)
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
    const option = currentCase.options[idx]
    const isCorrect = option.isCorrect
    const speedBonus = Math.round((timeLeft / TIME_PER_CASE) * 30)

    if (isCorrect) {
      const points = 100 + speedBonus + (combo * 20)
      setScore(prev => prev + points)
      setCombo(prev => prev + 1)
      setStreak(prev => prev + 1)
      setResults(prev => [...prev, true])
      setFlashColor('green')
      if (soundEnabled) playCorrect()
    } else {
      setCombo(0)
      setStreak(0)
      setLives(prev => prev - 1)
      setResults(prev => [...prev, false])
      setFlashColor('red')
      if (soundEnabled) playIncorrect()
    }
    setFlash(true)
    setTimeout(() => setFlash(false), 500)
    setPhase('feedback')
  }

  const nextRound = () => {
    if (lives <= 0 || currentIdx + 1 >= cases.length) {
      finishGame()
    } else {
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      setSelectedIdx(null)
      setTimeLeft(TIME_PER_CASE)
      setPhase('playing')
    }
  }

  const finishGame = () => {
    const correct = results.filter(Boolean).length
    const xpEarned = Math.round((correct / cases.length) * 160) + Math.round(score / 80)
    addXP(Math.min(xpEarned, 200), 'prompting')
    completeChallenge('hint-master')
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
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Crosshair size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Hint Master</h1>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Broken prompts need ONE strategic fix. Can you spot the single best change each time? You have 3 lives — wrong answers cost a life!
          </p>
          <Card padding="lg" className="text-left mb-6">
            <h3 className="font-bold text-text-primary mb-3">📖 How It Works</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2"><span className="text-accent font-bold">1.</span> See a broken prompt and what went wrong with the output</li>
              <li className="flex gap-2"><span className="text-accent font-bold">2.</span> Pick the ONE best single-line fix from 4 options</li>
              <li className="flex gap-2"><span className="text-accent font-bold">3.</span> See the improved prompt and learn why your fix works</li>
              <li className="flex gap-2"><span className="text-accent font-bold">4.</span> Wrong answers cost a life — 3 strikes and you&apos;re out!</li>
            </ul>
            <div className="mt-4 p-3 rounded-xl bg-surface-raised">
              <p className="text-xs text-text-muted"><strong>Scoring:</strong> 100 base + speed bonus (up to 30) + combo bonus (20 per level). 3 lives total.</p>
            </div>
          </Card>
          <div className="flex items-center justify-center gap-4 mb-6 text-sm text-text-muted">
            <span className="flex items-center gap-1"><Crosshair size={14} /> {cases.length} cases</span>
            <span className="flex items-center gap-1"><Star size={14} className="text-gold" /> Up to 200 XP</span>
            <span>❤️ 3 lives</span>
            <span>⏱️ ~5 min</span>
          </div>
          <Button onClick={startGame} variant="primary" size="lg" icon={<Zap size={18} />}>Start Fixing</Button>
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <Crosshair size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Case {currentIdx + 1}/{cases.length}</p>
              <LivesDisplay lives={lives} maxLives={3} />
            </div>
          </div>
          <AnimatedScore value={score} label="Score" />
        </div>
        <TimerBar timeLeft={timeLeft} maxTime={TIME_PER_CASE} warning={7} />
        <ProgressDots total={cases.length} current={currentIdx} results={results} />

        <div className="mt-4 animate-fade-in">
          {/* Broken Prompt */}
          <Card padding="md" className="mb-3 border-l-4 border-l-red">
            <p className="text-[10px] font-medium text-red uppercase tracking-wider mb-2">❌ Broken Prompt</p>
            <pre className="text-sm text-text-primary whitespace-pre-wrap font-mono bg-surface-raised rounded-xl p-3 leading-relaxed">{currentCase.prompt}</pre>
          </Card>

          {/* Problem */}
          <Card padding="md" className="mb-3 border-l-4 border-l-gold">
            <p className="text-[10px] font-medium text-gold uppercase tracking-wider mb-1">⚠️ What Went Wrong</p>
            <p className="text-sm text-text-secondary leading-relaxed">{currentCase.problem}</p>
          </Card>

          {/* Hint */}
          <div className="mb-3 p-2 rounded-xl bg-accent/5 border border-accent/20">
            <p className="text-xs text-accent flex items-center gap-1.5"><Eye size={12} /> <strong>Hint:</strong> {currentCase.hint}</p>
          </div>

          <p className="text-xs font-medium text-text-muted mb-3">Pick the ONE best fix:</p>

          {/* Options */}
          <div className="space-y-2">
            {currentCase.options.map((option, idx) => (
              <button key={idx}
                style={{ animationDelay: `${idx * 0.06}s`, animationFillMode: 'both' }}
                onClick={() => selectOption(idx)}
                className="w-full text-left cursor-pointer group animate-fade-in">
                <Card padding="sm" className="hover:border-accent/50 transition-all group-hover:shadow-md">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-md bg-surface-raised flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <p className="text-sm text-text-secondary leading-relaxed">{option.text}</p>
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
    const isCorrect = selectedIdx !== null && currentCase.options[selectedIdx]?.isCorrect
    const correctOption = currentCase.options.find(o => o.isCorrect)
    const gameOver = lives <= 0

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ScreenFlash trigger={flash} color={flashColor} />

        <div className="animate-fade-in">
          <div className="text-center mb-6">
            <div
              className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 animate-bounce-in ${isCorrect ? 'bg-green/15' : 'bg-red/15'}`}>
              {isCorrect ? <CheckCircle size={32} className="text-green" /> : <XCircle size={32} className="text-red" />}
            </div>
            <h2 className="text-xl font-bold text-text-primary">{isCorrect ? 'Perfect Fix!' : selectedIdx === null ? "Time's Up!" : 'Wrong Fix!'}</h2>
            {!isCorrect && <p className="text-sm text-red mt-1">{gameOver ? '💀 Game Over — Out of lives!' : `❤️ ${lives} ${lives === 1 ? 'life' : 'lives'} remaining`}</p>}
          </div>

          {/* Correct fix explanation */}
          <Card padding="md" className="mb-3 border-l-4 border-l-green">
            <p className="text-[10px] font-medium text-green uppercase tracking-wider mb-2">✅ Best Fix</p>
            <p className="text-sm text-text-primary mb-2">{correctOption?.text}</p>
            <p className="text-xs text-text-secondary">{correctOption?.explanation}</p>
          </Card>

          {/* Wrong answer explanation */}
          {!isCorrect && selectedIdx !== null && (
            <Card padding="md" className="mb-3 border-l-4 border-l-red">
              <p className="text-[10px] font-medium text-red uppercase tracking-wider mb-1">Your choice</p>
              <p className="text-sm text-text-secondary">{currentCase.options[selectedIdx].explanation}</p>
            </Card>
          )}

          {/* Improved prompt */}
          <Card padding="md" className="mb-4 border-l-4 border-l-accent">
            <p className="text-[10px] font-medium text-accent uppercase tracking-wider mb-2">🔧 Improved Prompt</p>
            <pre className="text-sm text-text-primary whitespace-pre-wrap font-mono bg-surface-raised rounded-xl p-3 leading-relaxed border border-border-subtle">{currentCase.improvedPrompt}</pre>
          </Card>

          <div className="text-center">
            <Button onClick={nextRound} variant="primary" size="lg">
              {gameOver ? '🏆 See Results' : currentIdx + 1 >= cases.length ? '🏆 See Results' : `Next Case (${currentIdx + 2}/${cases.length})`}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Results Phase ──────────────────────────────────────────────
  if (phase === 'results') {
    const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0
    const survived = lives > 0
    const xpEarned = Math.min(Math.round((correctCount / cases.length) * 160) + Math.round(score / 80), 200)

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ConfettiBurst trigger={showConfetti} color={accuracy >= 80 ? 'gold' : 'green'} />
        <XPPopup amount={xpEarned} show={showXP} />

        <div className="text-center mb-6 animate-fade-in">
          <div
            className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg animate-bounce-in">
            <Trophy size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-1">{survived ? 'All Cases Complete!' : 'Game Over!'}</h1>
          <p className="text-text-secondary">{getRank(accuracy, [{ min: 90, label: 'Incredible eye for prompts!' }, { min: 70, label: 'Solid fix instincts!' }, { min: 50, label: 'Getting there!' }], 'Study the lessons and try again!')}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 max-w-md mx-auto">
          {[
            { label: 'Correct', value: `${correctCount}/${results.length}`, icon: Crosshair, color: 'text-accent' },
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
          <h3 className="font-bold text-text-primary mb-3">Case Results</h3>
          <div className="space-y-2">
            {results.map((correct, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-surface-raised">
                <div className="flex items-center gap-2">
                  {correct ? <CheckCircle size={16} className="text-green" /> : <XCircle size={16} className="text-red" />}
                  <span className="text-sm text-text-primary truncate">Case {i + 1}: {cases[i]?.prompt.slice(0, 40)}...</span>
                </div>
                <span className="text-xs text-text-muted">{correct ? '✓' : '✗'}</span>
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
