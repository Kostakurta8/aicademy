'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Dna, ArrowRight, RotateCcw, Trophy, Star, Sparkles } from 'lucide-react'
import { useXPStore } from '@/stores/xp-store'

interface EvolutionRound {
  aspect: string
  icon: string
  description: string
  hint: string
  checkKeywords: string[]
}

interface Scenario {
  id: number
  title: string
  terriblePrompt: string
  rounds: EvolutionRound[]
}

const scenarios: Scenario[] = [
  {
    id: 1,
    title: 'Blog Post Generator',
    terriblePrompt: 'Write a blog post about dogs.',
    rounds: [
      { aspect: '🎭 Add a Role', icon: '🎭', description: 'Give the AI a specific persona or expertise', hint: 'Try: "You are a professional pet blogger with 10 years of experience..."', checkKeywords: ['you are', 'act as', 'role', 'expert', 'professional', 'blogger', 'writer'] },
      { aspect: '🎯 Specify the Topic', icon: '🎯', description: 'Make the topic specific and focused', hint: 'Instead of "dogs", narrow it: breed comparison, training tips, health issues...', checkKeywords: ['breed', 'training', 'health', 'comparison', 'tips', 'guide', 'specific', 'golden', 'retriever', 'puppy'] },
      { aspect: '📋 Define the Format', icon: '📋', description: 'Tell the AI HOW to structure the output', hint: 'Add: headings, bullet points, word count, sections...', checkKeywords: ['heading', 'bullet', 'section', 'words', 'paragraph', 'list', 'format', 'structure', 'markdown'] },
      { aspect: '👤 Target the Audience', icon: '👤', description: 'Specify who this is for', hint: 'First-time dog owners? Experienced breeders? Families with kids?', checkKeywords: ['audience', 'beginner', 'owner', 'reader', 'family', 'new', 'first-time', 'experienced'] },
      { aspect: '✨ Add Constraints', icon: '✨', description: 'Add quality constraints and edge cases', hint: 'Tone, what to avoid, include sources, SEO keywords...', checkKeywords: ['tone', 'avoid', 'include', 'friendly', 'professional', 'source', 'seo', 'keyword', 'dont', 'must'] },
    ],
  },
  {
    id: 2,
    title: 'Code Reviewer',
    terriblePrompt: 'Look at my code.',
    rounds: [
      { aspect: '🎭 Set the Expert Role', icon: '🎭', description: 'Define what kind of code reviewer', hint: 'Senior backend engineer? Security specialist? Performance expert?', checkKeywords: ['senior', 'engineer', 'security', 'expert', 'developer', 'reviewer', 'specialist'] },
      { aspect: '💻 Provide the Code', icon: '💻', description: 'Include the actual code to review', hint: 'Paste real code or describe the codebase context', checkKeywords: ['code', 'function', 'class', 'python', 'javascript', 'api', 'endpoint', 'def', 'const'] },
      { aspect: '🔍 Define Review Criteria', icon: '🔍', description: 'What should they look for specifically?', hint: 'Security vulnerabilities, performance issues, best practices...', checkKeywords: ['security', 'performance', 'bug', 'vulnerability', 'best practice', 'error', 'check', 'review'] },
      { aspect: '📊 Specify Output Format', icon: '📊', description: 'How should findings be presented?', hint: 'Severity ratings, table format, code suggestions...', checkKeywords: ['severity', 'rating', 'table', 'suggestion', 'fix', 'priority', 'format', 'critical', 'high', 'low'] },
      { aspect: '🧠 Add Reasoning', icon: '🧠', description: 'Request step-by-step analysis', hint: 'Ask for explanation of WHY each issue matters', checkKeywords: ['step', 'explain', 'why', 'reason', 'think', 'impact', 'consequence', 'because'] },
    ],
  },
]

function scoreRound(text: string, round: EvolutionRound): number {
  const lower = text.toLowerCase()
  const found = round.checkKeywords.filter(k => lower.includes(k)).length
  const ratio = found / round.checkKeywords.length
  if (ratio >= 0.4) return 100
  if (ratio >= 0.25) return 75
  if (ratio >= 0.15) return 50
  if (ratio > 0) return 25
  return 0
}

export default function PromptEvolutionPage() {
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [roundIdx, setRoundIdx] = useState(0)
  const [currentPrompt, setCurrentPrompt] = useState(scenarios[0].terriblePrompt)
  const [showHint, setShowHint] = useState(false)
  const [roundScore, setRoundScore] = useState<number | null>(null)
  const [qualityHistory, setQualityHistory] = useState<number[]>([10])
  const [gameOver, setGameOver] = useState(false)
  const addXP = useXPStore((s) => s.addXP)

  const scenario = scenarios[scenarioIdx]
  const round = scenario.rounds[roundIdx]
  const currentQuality = qualityHistory[qualityHistory.length - 1]

  const handleSubmit = () => {
    const score = scoreRound(currentPrompt, round)
    setRoundScore(score)
    const newQuality = Math.min(100, currentQuality + Math.round(score * 0.18))
    setQualityHistory(prev => [...prev, newQuality])
  }

  const handleNext = () => {
    if (roundIdx < scenario.rounds.length - 1) {
      setRoundIdx(r => r + 1)
      setRoundScore(null)
      setShowHint(false)
    } else if (scenarioIdx < scenarios.length - 1) {
      setScenarioIdx(s => s + 1)
      setRoundIdx(0)
      setCurrentPrompt(scenarios[scenarioIdx + 1].terriblePrompt)
      setRoundScore(null)
      setShowHint(false)
      setQualityHistory([10])
    } else {
      setGameOver(true)
      addXP(Math.round(currentQuality * 1.6))
    }
  }

  const handleRestart = () => {
    setScenarioIdx(0)
    setRoundIdx(0)
    setCurrentPrompt(scenarios[0].terriblePrompt)
    setRoundScore(null)
    setShowHint(false)
    setQualityHistory([10])
    setGameOver(false)
  }

  if (gameOver) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="animate-celebrate-pop">
          <Card padding="lg" glow className="text-center">
            <Trophy size={56} className="text-gold mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-text-primary mb-2">Evolution Complete!</h2>
            <p className="text-text-secondary mb-4">Your prompt evolved from terrible to incredible!</p>
            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-2xl font-bold text-green">{currentQuality}%</p>
                <p className="text-xs text-text-muted">Final Quality</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-2xl font-bold text-gold">+{Math.round(currentQuality * 1.6)}</p>
                <p className="text-xs text-text-muted">XP Earned</p>
              </div>
            </div>
            <Button onClick={handleRestart} icon={<RotateCcw size={16} />}>Evolve Again</Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="animate-fade-in mb-6">
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3 mb-2">
          <Dna className="text-green" /> Prompt Evolution
        </h1>
        <p className="text-text-secondary">Evolve a terrible prompt into a masterpiece!</p>
      </div>

      {/* Quality Meter */}
      <Card padding="sm" className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
            <Sparkles size={14} className="text-gold" /> Prompt Quality
          </span>
          <span className="text-sm font-bold text-text-primary">{currentQuality}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-border-subtle overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red via-gold to-green transition-all duration-300"
            style={{ width: `${currentQuality}%` }}
          />
        </div>
        {/* Mini evolution dots */}
        <div className="flex items-center gap-1 mt-2">
          {qualityHistory.map((q, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${q >= 70 ? 'bg-green' : q >= 40 ? 'bg-gold' : 'bg-red'}`} />
          ))}
        </div>
      </Card>

      {/* Scenario info */}
      <Card padding="sm" className="mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-text-primary">📝 {scenario.title}</span>
          <span className="text-xs text-text-muted">Mutation {roundIdx + 1}/{scenario.rounds.length}</span>
        </div>
      </Card>

      {/* Current Round */}
        <div key={`${scenarioIdx}-${roundIdx}`} className="animate-fade-in">
          <Card padding="lg" className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{round.icon}</span>
              <div>
                <h3 className="text-base font-bold text-text-primary">Mutation: {round.aspect.replace(/^.\s/, '')}</h3>
                <p className="text-xs text-text-secondary">{round.description}</p>
              </div>
            </div>

            <textarea
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              className="w-full h-40 p-4 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none outline-none focus:ring-2 focus:ring-green font-mono mb-3"
              disabled={roundScore !== null}
            />

            {roundScore === null && (
              <div className="flex items-center gap-3">
                <Button onClick={handleSubmit} disabled={currentPrompt.length < 20} className="flex-1">
                  Apply Mutation
                </Button>
                <Button variant="ghost" onClick={() => setShowHint(!showHint)}>
                  {showHint ? 'Hide' : '💡 Hint'}
                </Button>
              </div>
            )}

            {showHint && roundScore === null && (
              <div className="animate-fade-in mt-3 p-3 rounded-lg bg-green/5 border border-green/20">
                <p className="text-sm text-green">{round.hint}</p>
              </div>
            )}

            {roundScore !== null && (
              <div className="animate-fade-in">
                <div className={`p-3 rounded-lg mb-3 text-center ${roundScore >= 75 ? 'bg-green/10 border border-green/20' : roundScore >= 50 ? 'bg-gold/10 border border-gold/20' : 'bg-orange/10 border border-orange/20'}`}>
                  <span className="text-lg font-bold">{roundScore >= 75 ? '🧬 Excellent Mutation!' : roundScore >= 50 ? '🔬 Good Progress!' : '🧪 Needs More Work'}</span>
                  <p className="text-xs text-text-muted mt-1">Quality: {qualityHistory[qualityHistory.length - 2]}% → {currentQuality}%</p>
                </div>
                <Button onClick={handleNext} icon={<ArrowRight size={16} />} className="w-full">
                  {roundIdx < scenario.rounds.length - 1 ? 'Next Mutation' : scenarioIdx < scenarios.length - 1 ? 'Next Scenario' : 'See Results'}
                </Button>
              </div>
            )}
          </Card>
        </div>
    </div>
  )
}
