'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { AnimatedScore, ConfettiBurst, XPPopup, TimerBar, ScreenFlash, ProgressDots, StreakFire } from '@/components/ui/GameEffects'
import { useXPStore } from '@/stores/xp-store'
import { useProgressStore } from '@/stores/progress-store'
import { useUserStore } from '@/stores/user-store'
import { playCorrect, playIncorrect, playLevelUp, playXPDing } from '@/lib/sounds'
import { ArrowLeft, Swords, Trophy, Star, RotateCcw, TrendingUp, Zap } from 'lucide-react'

// ── Scoring Dimensions ───────────────────────────────────────────────

const dimensions = [
  { id: 'clarity', label: 'Clarity', emoji: '🔍', description: 'Clear task with specific action verb' },
  { id: 'specificity', label: 'Specificity', emoji: '🎯', description: 'Precise details, not vague language' },
  { id: 'structure', label: 'Structure', emoji: '📐', description: 'Organized with sections, lists, or XML tags' },
  { id: 'format', label: 'Format Spec', emoji: '📋', description: 'Defined output format (JSON, table, etc.)' },
  { id: 'constraints', label: 'Constraints', emoji: '⛔', description: 'Clear boundaries and limitations' },
  { id: 'context', label: 'Context', emoji: '📄', description: 'Audience, background, purpose provided' },
  { id: 'examples', label: 'Examples', emoji: '💡', description: 'Few-shot examples or sample output' },
  { id: 'antiPatterns', label: 'Clean Style', emoji: '✨', description: 'No emotional manipulation or filler' },
]

// ── Scoring Function ─────────────────────────────────────────────────

function scorePrompt(text: string): Record<string, number> {
  const scores: Record<string, number> = {}
  const lower = text.toLowerCase()
  const words = text.trim().split(/\s+/).length

  // Clarity (0-3)
  let clarity = 0
  if (words >= 10) clarity++
  if (words >= 25) clarity++
  if (/\b(write|create|analyze|generate|classify|review|summarize|explain|evaluate|build|design|find|extract|compare|translate|convert|debug|test|check|identify|list|describe)\b/i.test(text)) clarity++
  scores.clarity = Math.min(3, clarity)

  // Specificity (0-3)
  let spec = 0
  if (/\d+/.test(text)) spec++
  if (/["'].*["']/.test(text) || /\b(specifically|particular|exactly|precisely)\b/i.test(text)) spec++
  if (words > 30 && !/\b(something|stuff|things|whatever|nice|good|great|awesome|cool)\b/i.test(lower)) spec++
  scores.specificity = Math.min(3, spec)

  // Structure (0-3)
  let struct = 0
  if (text.includes('\n') && text.split('\n').filter(l => l.trim()).length >= 3) struct++
  if (/\d+\.\s|[-•*]\s|#{1,3}\s/.test(text)) struct++
  if (/<\w+>/.test(text)) struct++
  scores.structure = Math.min(3, struct)

  // Format (0-3)
  let format = 0
  const formatWords = ['format', 'output', 'respond in', 'respond as', 'return', 'json', 'markdown', 'table', 'list', 'bullet', 'csv', 'yaml', 'schema', 'template']
  format = Math.min(3, formatWords.filter(w => lower.includes(w)).length)
  scores.format = format

  // Constraints (0-3)
  let constraints = 0
  const constraintWords = ["don't", "do not", "only", "never", "must", "avoid", "limit", "maximum", "minimum", "at most", "at least", "no more than", "restrict", "exclude"]
  constraints = Math.min(3, constraintWords.filter(w => lower.includes(w)).length)
  scores.constraints = constraints

  // Context (0-3)
  let context = 0
  const contextPhrases = ['audience', 'aimed at', 'background', 'context', 'target', 'purpose', 'experience', 'beginner', 'expert', 'developer', 'student', 'user', 'reader', 'team', 'for a', 'for the']
  context = Math.min(3, contextPhrases.filter(w => lower.includes(w)).length)
  scores.context = context

  // Examples (0-3)
  let examples = 0
  const examplePhrases = ['example', 'e.g.', 'like this', 'such as', 'sample', 'for instance', 'input:', 'output:', 'here is', 'here are']
  const exampleCount = examplePhrases.filter(w => lower.includes(w)).length
  if (exampleCount >= 1) examples++
  if (exampleCount >= 2) examples++
  if (/<example>/.test(text) || /```/.test(text)) examples++
  scores.examples = Math.min(3, examples)

  // Anti-patterns (3 = clean, 0 = many anti-patterns)
  let clean = 3
  if (/please\s+please|PLEASE|!!!+|\?\?\?+/.test(text)) clean--
  if (/tip you|reward|pay you|\$\d+/i.test(text)) clean--
  if (/try\s+(your\s+)?hard|really\s+important|super\s+important|do\s+your\s+best/i.test(lower)) clean--
  scores.antiPatterns = Math.max(0, clean)

  return scores
}

function getGrade(total: number): { letter: string; label: string; color: string } {
  if (total >= 22) return { letter: 'S', label: 'Master Prompter', color: 'text-accent' }
  if (total >= 18) return { letter: 'A', label: 'Excellent', color: 'text-green' }
  if (total >= 14) return { letter: 'B', label: 'Good', color: 'text-blue' }
  if (total >= 10) return { letter: 'C', label: 'Needs Work', color: 'text-gold' }
  return { letter: 'D', label: 'Keep Practicing', color: 'text-red' }
}

// ── Scenarios ────────────────────────────────────────────────────────

interface Scenario {
  id: number; title: string; task: string; difficulty: string
  tips: Record<string, string>
}

const scenarios: Scenario[] = [
  {
    id: 1, title: 'Customer Ticket Classifier', difficulty: 'Easy',
    task: 'You need AI to classify incoming customer support tickets by category (billing, technical, general inquiry, complaint) and urgency level (low/medium/high/critical).',
    tips: { clarity: 'Include "classify" as the main action verb.', specificity: 'List the exact categories and urgency levels.', structure: 'Use XML tags to separate instructions, examples, and format.', format: 'Define JSON output with category and urgency fields.', constraints: 'Set rules like "one category per ticket" or "default to low if unclear".', context: 'Mention the support team processing 100+ tickets daily.', examples: 'Include 2-3 example tickets with their correct classification.', antiPatterns: 'Keep instructions professional and direct.' },
  },
  {
    id: 2, title: 'Code Review Assistant', difficulty: 'Medium',
    task: 'Design a prompt that makes AI review a pull request for bugs, security issues, and style problems, organizing feedback by severity.',
    tips: { clarity: 'Use "review" with specific areas to check.', specificity: 'List check areas: bugs, security, style, performance.', structure: 'Separate code context from instructions with XML tags.', format: 'Ask for tabular output by severity (critical/warning/info).', constraints: '"Focus on top 5 issues" or "ignore formatting nitpicks".', context: 'Specify the language, framework, and coding standards.', examples: 'Show an example review comment with severity and fix.', antiPatterns: 'Avoid vague requests like "make this code good".' },
  },
  {
    id: 3, title: 'Research Summary', difficulty: 'Easy',
    task: 'Create a prompt that summarizes academic research papers into key findings, methodology, and implications for a general audience.',
    tips: { clarity: '"Summarize" with target sections (findings, methodology, implications).', specificity: 'Define word counts per section or total.', structure: 'Wrap the paper in XML tags, define output sections.', format: 'Define sections: Overview, Key Findings, Methodology, Implications.', constraints: '"Maximum 500 words" or "no jargon or acronyms".', context: 'Specify "for a general audience" or "non-specialists".', examples: 'Include an example summary demonstrating desired style.', antiPatterns: 'Focus on clear instructions, not emotional pressure.' },
  },
  {
    id: 4, title: 'Marketing Copy Generator', difficulty: 'Medium',
    task: 'Write a prompt that generates compelling product descriptions for an e-commerce store, matching brand voice and including SEO keywords.',
    tips: { clarity: '"Write" or "generate" product descriptions as the action.', specificity: 'Include brand name, tone, and target word count.', structure: 'Separate brand guide, product details, and output format.', format: 'Define: headline → description → bullet points → CTA.', constraints: '"Include these keywords" or "max 150 words per product".', context: 'Describe the target customer and brand personality.', examples: 'Show one example description in the desired style.', antiPatterns: 'Avoid just "make it catchy" — define what catchy means.' },
  },
  {
    id: 5, title: 'SQL Query Debugger', difficulty: 'Hard',
    task: 'Build a prompt that debugs and optimizes a slow SQL query, explaining the issues and providing a fixed version with performance improvements.',
    tips: { clarity: '"Debug" and "optimize" as action verbs.', specificity: 'Include DB engine, table sizes, and execution time.', structure: 'Wrap SQL in XML tags, separate symptoms from task.', format: 'Ask for: issues → explanation → optimized query → improvement.', constraints: '"Don\'t change the schema" or "keep backward compatibility".', context: 'Provide table schema, indexes, and approximate row counts.', examples: 'Show EXPLAIN output if available.', antiPatterns: 'Don\'t just say "fix this query" — provide full context.' },
  },
  {
    id: 6, title: 'Meeting Notes to Actions', difficulty: 'Easy',
    task: 'Create a prompt that converts messy meeting transcript notes into structured action items with owners, deadlines, and priority.',
    tips: { clarity: '"Convert" or "extract" action items as the action.', specificity: 'List output fields: owner, action, deadline, priority.', structure: 'Wrap notes in <transcript> tags, define output structure.', format: 'Request: | Owner | Action | Deadline | Priority |.', constraints: '"Infer deadlines from context" or "mark unclear items".', context: 'Mention the team/department and meeting type.', examples: 'Show messy notes → clean action items transformation.', antiPatterns: 'Clear structure beats emotional urgency.' },
  },
  {
    id: 7, title: 'Competitor Analysis', difficulty: 'Hard',
    task: 'Design a prompt for comprehensive competitor analysis across features, pricing, strengths, weaknesses, and market positioning.',
    tips: { clarity: '"Analyze" or "compare" with specific dimensions.', specificity: 'Name the competitors and exact comparison dimensions.', structure: 'Use chain-of-thought for analysis, separate instructions.', format: 'Request comparison table + SWOT + summary.', constraints: '"Only analyze provided data" or "no speculation".', context: 'Specify your company position and what decisions this informs.', examples: 'Show an example row of the comparison table.', antiPatterns: 'Avoid overloading — focus on 3-5 key dimensions.' },
  },
  {
    id: 8, title: 'API Documentation', difficulty: 'Hard',
    task: 'Build a prompt that generates REST API documentation from source code, including endpoints, parameters, responses, and example requests.',
    tips: { clarity: '"Generate documentation" from provided source code.', specificity: 'List what to document: endpoints, params, responses, auth.', structure: 'Wrap source code in XML, define doc structure.', format: 'Request OpenAPI-style format or structured markdown.', constraints: '"Include all public endpoints" or "mark required params".', context: 'Specify the framework and API style (REST/GraphQL).', examples: 'Show one documented endpoint as an example.', antiPatterns: 'Detailed instructions are justified for thorough docs.' },
  },
]

const TIME_PER_SCENARIO = 90

// ── Component ────────────────────────────────────────────────────────

type Phase = 'menu' | 'writing' | 'scored' | 'results'

export default function PromptDojoPage() {
  const [phase, setPhase] = useState<Phase>('menu')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [promptText, setPromptText] = useState('')
  const [timeLeft, setTimeLeft] = useState(TIME_PER_SCENARIO)
  const [roundScores, setRoundScores] = useState<{ scenario: Scenario; scores: Record<string, number>; total: number }[]>([])
  const [currentScores, setCurrentScores] = useState<Record<string, number> | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [flash, setFlash] = useState(false)
  const [streak, setStreak] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const soundEnabled = useUserStore((s) => s.soundEnabled)
  const addXP = useXPStore((s) => s.addXP)
  const completeChallenge = useProgressStore((s) => s.completeChallenge)

  const currentScenario = scenarios[currentIdx]
  const totalPossible = scenarios.length * 24
  const grandTotal = roundScores.reduce((sum, r) => sum + r.total, 0)

  const startGame = useCallback(() => {
    setPhase('writing')
    setCurrentIdx(0)
    setPromptText('')
    setTimeLeft(TIME_PER_SCENARIO)
    setRoundScores([])
    setCurrentScores(null)
    setStreak(0)
  }, [])

  // Timer
  useEffect(() => {
    if (phase !== 'writing') return
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

  const submitPrompt = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const scores = scorePrompt(promptText)
    const total = Object.values(scores).reduce((a, b) => a + b, 0)
    setCurrentScores(scores)
    setRoundScores(prev => [...prev, { scenario: currentScenario, scores, total }])
    setPhase('scored')

    if (total >= 18) {
      setStreak(prev => prev + 1)
      setFlash(true)
      setTimeout(() => setFlash(false), 500)
      if (soundEnabled) playCorrect()
    } else if (total >= 10) {
      if (soundEnabled) playXPDing()
    } else {
      setStreak(0)
      if (soundEnabled) playIncorrect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptText, currentScenario, soundEnabled])

  const nextRound = () => {
    if (currentIdx + 1 >= scenarios.length) {
      finishGame()
    } else {
      setCurrentIdx(prev => prev + 1)
      setPromptText('')
      setTimeLeft(TIME_PER_SCENARIO)
      setCurrentScores(null)
      setPhase('writing')
    }
  }

  const finishGame = () => {
    const total = roundScores.reduce((sum, r) => sum + r.total, 0)
    const xpEarned = Math.round((total / totalPossible) * 250)
    addXP(xpEarned, 'prompting')
    completeChallenge('prompt-dojo')
    setShowConfetti(true)
    setShowXP(true)
    if (soundEnabled) playLevelUp()
    setTimeout(() => { setShowConfetti(false); setShowXP(false) }, 3000)
    setPhase('results')
  }

  // ── Menu Phase ─────────────────────────────────────────────────
  if (phase === 'menu') {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <Link href="/prompting" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Prompting
        </Link>
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Swords size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Prompt Dojo</h1>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Write your own prompts for real-world scenarios and get graded on 8 dimensions. How well can you craft the perfect prompt?
          </p>
          <Card padding="lg" className="text-left mb-6">
            <h3 className="font-bold text-text-primary mb-3">📖 How It Works</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2"><span className="text-accent font-bold">1.</span> Read a scenario describing what you need AI to do</li>
              <li className="flex gap-2"><span className="text-accent font-bold">2.</span> Write the best prompt you can in 90 seconds</li>
              <li className="flex gap-2"><span className="text-accent font-bold">3.</span> Get scored on 8 dimensions: Clarity, Specificity, Structure, Format, Constraints, Context, Examples, Clean Style</li>
              <li className="flex gap-2"><span className="text-accent font-bold">4.</span> Review tips for improvement after each round</li>
            </ul>
            <div className="mt-4 p-3 rounded-xl bg-surface-raised">
              <p className="text-xs text-text-muted"><strong>Grading:</strong> S (22-24) = Master • A (18-21) = Excellent • B (14-17) = Good • C (10-13) = Needs Work • D (0-9) = Practice More</p>
            </div>
          </Card>
          <div className="flex items-center justify-center gap-4 mb-6 text-sm text-text-muted">
            <span className="flex items-center gap-1"><Swords size={14} /> {scenarios.length} scenarios</span>
            <span className="flex items-center gap-1"><Star size={14} className="text-gold" /> Up to 250 XP</span>
            <span>⏱️ ~10 min</span>
          </div>
          <Button onClick={startGame} variant="primary" size="lg" icon={<Zap size={18} />}>Enter the Dojo</Button>
        </div>
      </div>
    )
  }

  // ── Writing Phase ──────────────────────────────────────────────
  if (phase === 'writing') {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ScreenFlash trigger={flash} color="green" />
        <StreakFire streak={streak} />
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Swords size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Round {currentIdx + 1}/{scenarios.length}</p>
              <p className="text-xs text-text-muted">{currentScenario.difficulty}</p>
            </div>
          </div>
          <AnimatedScore value={grandTotal} label="Total Score" />
        </div>
        <TimerBar timeLeft={timeLeft} maxTime={TIME_PER_SCENARIO} warning={15} />
        <ProgressDots total={scenarios.length} current={currentIdx} results={roundScores.map(r => r.total >= 14)} />

        <div className="mt-4 animate-fade-in">
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎯</span>
              <h2 className="text-lg font-bold text-text-primary">{currentScenario.title}</h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-4 p-3 rounded-xl bg-surface-raised border border-border-subtle">{currentScenario.task}</p>
            <label className="text-xs font-medium text-text-muted block mb-2">Write your prompt below:</label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full h-64 rounded-xl bg-surface-raised border border-border-subtle p-4 text-sm text-text-primary font-mono resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent placeholder-text-muted"
              placeholder="Write the best prompt you can for this scenario...&#10;&#10;Tips: Use XML tags, include examples, define output format, set constraints..."
              autoFocus
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-text-muted">{promptText.trim().split(/\s+/).filter(Boolean).length} words</p>
              <Button onClick={submitPrompt} variant="primary" disabled={promptText.trim().length < 5}>
                Submit Prompt
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // ── Scored Phase ───────────────────────────────────────────────
  if (phase === 'scored' && currentScores) {
    const total = Object.values(currentScores).reduce((a, b) => a + b, 0)
    const grade = getGrade(total)

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ScreenFlash trigger={flash} color={total >= 18 ? 'gold' : total >= 14 ? 'green' : 'red'} />
        <ConfettiBurst trigger={showConfetti} color={total >= 22 ? 'gold' : 'green'} />

        <div className="animate-fade-in">
          <div className="text-center mb-6">
            <div
              className={`text-6xl font-black ${grade.color} mb-2 animate-bounce-in`}>
              {grade.letter}
            </div>
            <p className="text-sm text-text-secondary">{grade.label} — {total}/24 points</p>
            <h2 className="text-lg font-bold text-text-primary mt-1">{currentScenario.title}</h2>
          </div>

          <Card padding="lg" className="mb-4">
            <h3 className="font-bold text-text-primary mb-4">Score Breakdown</h3>
            <div className="space-y-3">
              {dimensions.map(dim => {
                const score = currentScores[dim.id] || 0
                return (
                  <div key={dim.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <span>{dim.emoji}</span>
                        <span className="text-text-primary font-medium">{dim.label}</span>
                      </span>
                      <span className={`font-bold ${score >= 3 ? 'text-green' : score >= 2 ? 'text-gold' : score >= 1 ? 'text-red' : 'text-text-muted'}`}>{score}/3</span>
                    </div>
                    <div className="h-2 rounded-full bg-border-subtle overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${score >= 3 ? 'bg-green' : score >= 2 ? 'bg-gold' : score >= 1 ? 'bg-red' : 'bg-border-subtle'}`}
                        style={{ width: `${(score / 3) * 100}%` }}
                      />
                    </div>
                    {score < 3 && (
                      <p className="text-[10px] text-text-muted mt-0.5">💡 {currentScenario.tips[dim.id]}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Your prompt */}
          <Card padding="md" className="mb-4">
            <h3 className="font-semibold text-text-primary text-sm mb-2">Your Prompt</h3>
            <pre className="text-xs bg-surface-raised rounded-xl p-3 text-text-secondary whitespace-pre-wrap font-mono border border-border-subtle max-h-40 overflow-y-auto">{promptText}</pre>
          </Card>

          <div className="text-center">
            <Button onClick={nextRound} variant="primary" size="lg">
              {currentIdx + 1 >= scenarios.length ? '🏆 See Final Results' : `Next Scenario (${currentIdx + 2}/${scenarios.length})`}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Results Phase ──────────────────────────────────────────────
  if (phase === 'results') {
    const finalGrade = getGrade(Math.round(grandTotal / scenarios.length))
    const avgScore = Math.round(grandTotal / scenarios.length)
    const xpEarned = Math.round((grandTotal / totalPossible) * 250)

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ConfettiBurst trigger={showConfetti} color="gold" />
        <XPPopup amount={xpEarned} show={showXP} />

        <div className="text-center mb-6 animate-fade-in">
          <div
            className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg animate-bounce-in">
            <Trophy size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-1">Dojo Complete!</h1>
          <p className="text-text-secondary">Average Grade: <span className={`font-black text-2xl ${finalGrade.color}`}>{finalGrade.letter}</span></p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 max-w-md mx-auto">
          {[
            { label: 'Total Score', value: `${grandTotal}/${totalPossible}`, icon: TrendingUp, color: 'text-accent' },
            { label: 'Avg per Round', value: `${avgScore}/24`, icon: Star, color: 'text-gold' },
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
          <h3 className="font-bold text-text-primary mb-3">Round Breakdown</h3>
          <div className="space-y-2">
            {roundScores.map((r, i) => {
              const g = getGrade(r.total)
              return (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-surface-raised">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-black ${g.color} w-6 text-center`}>{g.letter}</span>
                    <span className="text-sm text-text-primary">{r.scenario.title}</span>
                  </div>
                  <span className="text-sm text-text-muted font-mono">{r.total}/24</span>
                </div>
              )
            })}
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
