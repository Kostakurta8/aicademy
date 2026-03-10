'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ConfettiBurst, ScreenFlash, XPPopup, TimerBar, AnimatedScore, ComboIndicator, StreakFire } from '@/components/ui/GameEffects'
import { Swords, RotateCcw, Trophy, Check, X, Zap, ChevronRight, Star, Eye, Crown, Shield, Target } from 'lucide-react'
import { useXPStore } from '@/stores/xp-store'

interface Matchup {
  id: string
  prompt: string
  skill: string
  responseA: { text: string; model: string }
  responseB: { text: string; model: string }
  betterResponse: 'A' | 'B'
  reason: string
  criteria: string[]
}

const matchups: Matchup[] = [
  {
    id: 'explain-ml',
    prompt: 'Explain machine learning to a 10-year-old.',
    skill: 'Simplification',
    responseA: {
      text: 'Imagine you\'re teaching a dog to sit. You show the dog what to do, and every time it does it right, you give it a treat. After many tries, the dog learns! Machine learning is like that — we show the computer lots of examples, reward it when it gets things right, and eventually it learns patterns all by itself.',
      model: 'GPT-4',
    },
    responseB: {
      text: 'Machine learning is a subset of artificial intelligence that uses statistical methods to enable machines to improve with experience. It involves training algorithms on datasets to make predictions or decisions without being explicitly programmed for each scenario.',
      model: 'GPT-3.5',
    },
    betterResponse: 'A',
    reason: 'Response A uses a relatable analogy (training a dog) that a 10-year-old can understand. Response B uses technical jargon inappropriate for the audience.',
    criteria: ['Age-appropriate language', 'Uses analogy', 'Engaging'],
  },
  {
    id: 'code-review',
    prompt: 'Review this code: function add(a, b) { return a + b; }',
    skill: 'Code Analysis',
    responseA: {
      text: 'The function looks fine. It adds two numbers and returns the result. Good job!',
      model: 'Mistral-7B',
    },
    responseB: {
      text: 'The function works for basic addition. A few suggestions:\n\n1. **Type safety**: Consider adding input validation — `add("2", 3)` would return "23" due to string concatenation.\n2. **TypeScript**: `function add(a: number, b: number): number` adds compile-time safety.\n3. **Edge cases**: Consider handling NaN, Infinity, or non-numeric inputs.\n4. **Naming**: The function name is clear and follows conventions.',
      model: 'Claude 3.5',
    },
    betterResponse: 'B',
    reason: 'Response B provides actionable, specific feedback covering type safety, edge cases, and improvements. Response A is superficial and misses important issues.',
    criteria: ['Actionable feedback', 'Edge cases', 'Specific suggestions'],
  },
  {
    id: 'ethics',
    prompt: 'Should AI be used to make hiring decisions?',
    skill: 'Nuanced Reasoning',
    responseA: {
      text: 'AI in hiring is a complex topic with valid arguments on both sides.\n\n**Potential benefits**: Reduces human unconscious bias in initial screening, processes large applicant pools efficiently, and can ensure consistent evaluation criteria.\n\n**Significant risks**: AI can amplify historical biases in training data, lacks understanding of context and nuance, may discriminate based on proxy variables (ZIP code, name), and reduces human agency in life-impacting decisions.\n\n**Recommendation**: AI can assist but should not replace human judgment. Ensure regular bias audits, transparency in criteria, and human review of all AI recommendations.',
      model: 'Claude 3.5',
    },
    responseB: {
      text: 'Yes, AI should definitely be used for hiring decisions. AI is objective and unbiased, unlike humans who have personal preferences. It can process thousands of resumes quickly and select the best candidates based on data. Companies that use AI hiring tools are more efficient and make better hiring choices.',
      model: 'Llama-2-7B',
    },
    betterResponse: 'A',
    reason: 'Response A presents a balanced, nuanced view acknowledging both benefits and risks. Response B makes the false claim that AI is inherently unbiased and presents a one-sided view.',
    criteria: ['Balanced perspective', 'Acknowledges risks', 'Nuanced conclusion'],
  },
  {
    id: 'creative',
    prompt: 'Write a haiku about artificial intelligence.',
    skill: 'Creative Writing',
    responseA: {
      text: 'Silicon mind wakes\nPatterns dancing through the void\nDreaming without sleep',
      model: 'GPT-4',
    },
    responseB: {
      text: 'AI is so smart\nIt can do many good things\nTechnology rules',
      model: 'GPT-3',
    },
    betterResponse: 'A',
    reason: 'Response A uses evocative imagery ("silicon mind," "patterns dancing," "dreaming without sleep") with proper 5-7-5 syllable structure. Response B is generic, uses no imagery, and is more of a statement than poetry.',
    criteria: ['Imagery & metaphor', '5-7-5 structure', 'Emotional depth'],
  },
  {
    id: 'debug',
    prompt: 'Why does this Python code fail? `result = [1, 2, 3] + "hello"`',
    skill: 'Debugging',
    responseA: {
      text: 'This fails because Python doesn\'t allow adding a list and a string directly — they\'re different types.\n\n**Error**: `TypeError: can only concatenate list (not "str") to list`\n\n**Fixes**:\n```python\n# If you want to append the string:\nresult = [1, 2, 3] + ["hello"]  # [1, 2, 3, "hello"]\n\n# If you want to extend with characters:\nresult = [1, 2, 3] + list("hello")  # [1, 2, 3, "h", "e", "l", "l", "o"]\n```',
      model: 'Claude 3.5',
    },
    responseB: {
      text: 'The code fails because you can\'t add lists and strings in Python. Try converting the list to a string first using str() or the string to a list.',
      model: 'Mistral-7B',
    },
    betterResponse: 'A',
    reason: 'Response A gives the exact error message, explains why, and provides multiple concrete fix options with code examples. Response B is vague and doesn\'t show actual solutions.',
    criteria: ['Exact error', 'Multiple solutions', 'Code examples'],
  },
  {
    id: 'summarize',
    prompt: 'Summarize the concept of "attention mechanism" in transformers in 2 sentences.',
    skill: 'Concise Explanation',
    responseA: {
      text: 'Attention allows the model to focus on different parts of the input when processing each element, weighing which words are most relevant to each other. In transformers, "self-attention" lets every token attend to every other token in the sequence simultaneously, enabling rich contextual understanding.',
      model: 'GPT-4',
    },
    responseB: {
      text: 'Attention mechanism is a very important part of transformer models that was introduced in 2017. It works by computing queries, keys, and values using matrix multiplication, where the attention scores are calculated using the softmax function of the dot product of queries and keys divided by the square root of the dimension.',
      model: 'Llama-2-13B',
    },
    betterResponse: 'A',
    reason: 'Response A is intuitive and explains the concept clearly in 2 sentences. Response B dives into implementation details (QKV, softmax, dot products) instead of explaining the concept, and doesn\'t actually summarize what attention achieves.',
    criteria: ['Conceptual clarity', 'Follows 2-sentence constraint', 'Accessible language'],
  },
  {
    id: 'safety',
    prompt: 'How do I pick a lock?',
    skill: 'Safety Handling',
    responseA: {
      text: 'I can explain lockpicking as an educational topic:\n\nLockpicking is a legitimate skill used by locksmiths and security professionals. The basic principle involves manipulating pin tumblers using a tension wrench and pick. However, I want to note:\n\n⚠️ Picking locks you don\'t own is illegal in most jurisdictions.\n✅ Consider contacting a licensed locksmith if you\'re locked out.\n📚 If interested in the hobby, check out r/lockpicking for legal practice locks.',
      model: 'Claude 3.5',
    },
    responseB: {
      text: 'I cannot help with that request as it could be used for illegal activities.',
      model: 'GPT-3.5',
    },
    betterResponse: 'A',
    reason: 'Response A balances helpfulness with safety — it acknowledges the legitimate aspects while providing clear warnings and legal alternatives. Response B is overly restrictive and assumes malicious intent.',
    criteria: ['Balanced safety', 'Educational value', 'Provides alternatives'],
  },
  {
    id: 'reasoning',
    prompt: 'If all roses are flowers, and some flowers fade quickly, can we conclude that some roses fade quickly?',
    skill: 'Logical Reasoning',
    responseA: {
      text: 'No, we cannot conclude that.\n\nLet me break down the logic:\n1. **All roses are flowers** (Roses ⊂ Flowers)\n2. **Some flowers fade quickly** (∃ Flowers that fade quickly)\n\nThe flowers that fade quickly might not include any roses. The "some flowers" could refer to non-rose flowers like daisies or tulips. This is a classic syllogistic fallacy — the undistributed middle term.',
      model: 'GPT-4',
    },
    responseB: {
      text: 'Yes, since roses are flowers and some flowers fade quickly, it logically follows that some roses must also fade quickly.',
      model: 'Llama-2-7B',
    },
    betterResponse: 'A',
    reason: 'Response A correctly identifies this as a syllogistic fallacy and explains why the conclusion doesn\'t follow. Response B commits the very fallacy the prompt is testing.',
    criteria: ['Correct logic', 'Clear reasoning', 'Identifies fallacy'],
  },
  {
    id: 'data',
    prompt: 'What percentage of the internet is in English?',
    skill: 'Factual Accuracy',
    responseA: {
      text: 'As of recent estimates (W3Techs, 2023), approximately 58-60% of web content is in English, though this has been gradually declining as content in other languages grows. This is notable because only about 16-17% of the world\'s population are native English speakers.\n\nNote: These figures can vary by measurement method (websites vs. pages vs. data volume).',
      model: 'Claude 3.5',
    },
    responseB: {
      text: 'About 90% of the internet is in English because most websites and technology companies are based in English-speaking countries. English has always dominated the internet since its creation.',
      model: 'Mistral-7B',
    },
    betterResponse: 'A',
    reason: 'Response A provides accurate, cited statistics with appropriate caveats about methodology. Response B significantly overstates the figure (90% vs ~60%) and makes unsupported claims.',
    criteria: ['Accurate data', 'Cites sources', 'Appropriate caveats'],
  },
]

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function ModelArenaPage() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'reveal' | 'gameOver'>('intro')
  const [gameMatchups, setGameMatchups] = useState<Matchup[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [swapped, setSwapped] = useState<boolean[]>([]) // Whether A/B are swapped for this matchup
  const [selected, setSelected] = useState<'A' | 'B' | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(35)
  const [timerActive, setTimerActive] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [flashColor, setFlashColor] = useState<'green' | 'red' | 'gold'>('green')
  const [showXP, setShowXP] = useState(false)
  const [results, setResults] = useState<{ matchupId: string; correct: boolean }[]>([])
  const addXP = useXPStore((s) => s.addXP)

  const startGame = useCallback(() => {
    const shuffled = shuffleArray(matchups)
    setGameMatchups(shuffled)
    // Randomly swap A/B display for each matchup to prevent position bias
    setSwapped(shuffled.map(() => Math.random() > 0.5))
    setCurrentIdx(0)
    setSelected(null)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setResults([])
    setTimeLeft(35)
    setTimerActive(true)
    setPhase('playing')
  }, [])

  // Timer
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setTimerActive(false)
          handlePick(null)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timeLeft])

  const handlePick = useCallback((pick: 'A' | 'B' | null) => {
    setTimerActive(false)
    if (!pick) {
      // Timeout
      setSelected(null)
      setStreak(0)
      setFlashColor('red')
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 400)
      setResults(prev => [...prev, { matchupId: gameMatchups[currentIdx]?.id ?? '', correct: false }])
      setPhase('reveal')
      return
    }

    setSelected(pick)
    const matchup = gameMatchups[currentIdx]
    const isSwap = swapped[currentIdx]

    // Determine the actual better response in displayed positions
    const actualBetter = isSwap
      ? (matchup.betterResponse === 'A' ? 'B' : 'A')
      : matchup.betterResponse

    const isCorrect = pick === actualBetter

    if (isCorrect) {
      const timeBonus = Math.round(timeLeft * 2)
      const streakBonus = streak * 20
      setScore(s => s + 100 + timeBonus + streakBonus)
      setStreak(s => s + 1)
      setBestStreak(prev => Math.max(prev, streak + 1))
      setFlashColor('green')
    } else {
      setStreak(0)
      setFlashColor('red')
    }

    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 400)
    setResults(prev => [...prev, { matchupId: matchup.id, correct: isCorrect }])
    setPhase('reveal')
  }, [currentIdx, gameMatchups, swapped, streak, timeLeft])

  const nextMatchup = () => {
    if (currentIdx + 1 >= gameMatchups.length) {
      const totalXP = score + 60
      addXP(totalXP)
      setShowConfetti(true)
      setShowXP(true)
      setPhase('gameOver')
      setTimeout(() => { setShowConfetti(false); setShowXP(false) }, 4000)
    } else {
      setCurrentIdx(i => i + 1)
      setSelected(null)
      setTimeLeft(35)
      setTimerActive(true)
      setPhase('playing')
    }
  }

  const matchup = gameMatchups[currentIdx]
  const isSwap = swapped[currentIdx]
  const correctCount = results.filter(r => r.correct).length

  // Get displayed responses (potentially swapped)
  const displayA = matchup ? (isSwap ? matchup.responseB : matchup.responseA) : null
  const displayB = matchup ? (isSwap ? matchup.responseA : matchup.responseB) : null

  // ============ INTRO ============
  if (phase === 'intro') {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="animate-celebrate-pop">
          <Card padding="lg" glow className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-red flex items-center justify-center shadow-xl shadow-orange-500/20 relative">
              <Swords size={40} className="text-white" />
              <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-orange-400/30 animate-[spin_8s_linear_infinite]" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Model Arena</h1>
            <p className="text-text-secondary mb-6">Two AI models enter, you decide which response is better. Can you tell quality from quantity?</p>

            <div className="grid grid-cols-3 gap-3 mb-6 max-w-md mx-auto">
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-text-primary">{matchups.length}</p>
                <p className="text-[10px] text-text-muted">Matchups</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-red">35s</p>
                <p className="text-[10px] text-text-muted">Per Round</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-gold">1000+</p>
                <p className="text-[10px] text-text-muted">Max XP</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-left max-w-md mx-auto mb-6">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-raised text-xs text-text-secondary">
                <Eye size={14} className="text-orange-500 shrink-0" />
                <span>Responses are shown blind — model names revealed after your choice</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-raised text-xs text-text-secondary">
                <Target size={14} className="text-accent shrink-0" />
                <span>Evaluation criteria shown for each matchup to guide your decision</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-raised text-xs text-text-secondary">
                <Zap size={14} className="text-gold shrink-0" />
                <span>Streak bonuses reward consecutive correct picks</span>
              </div>
            </div>

            <Button onClick={startGame} size="lg" className="w-full max-w-sm">
              <Swords size={18} className="mr-2" /> Enter the Arena
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // ============ GAME OVER ============
  if (phase === 'gameOver') {
    const accuracy = Math.round((correctCount / matchups.length) * 100)
    const totalXP = score + 60
    const rank = accuracy >= 90 ? '🏆 Arena Champion' : accuracy >= 70 ? '⚔️ Seasoned Judge' : accuracy >= 50 ? '🛡️ Apprentice' : '🔰 Spectator'

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ConfettiBurst trigger={showConfetti} color="gold" />
        <XPPopup amount={totalXP} show={showXP} />

        <div className="animate-fade-in">
          <Card padding="lg" glow className="text-center mb-6">
            <div className="animate-celebrate-pop">
              <Crown size={48} className="text-gold mx-auto mb-3" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">Arena Complete!</h2>
            <p className="text-text-secondary mb-1">{rank}</p>

            <div className="grid grid-cols-4 gap-3 my-6">
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-green">{correctCount}/{matchups.length}</p>
                <p className="text-[10px] text-text-muted">Correct</p>
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

            <div className="w-full bg-surface-raised rounded-full h-3 mb-4 max-w-xs mx-auto overflow-hidden">
              <div style={{ width: `${accuracy}%`, transition: 'width 1s ease-out 0.3s' }}
                className={`h-full rounded-full ${accuracy >= 70 ? 'bg-green' : accuracy >= 40 ? 'bg-yellow' : 'bg-red'}`} />
            </div>
          </Card>

          {/* Matchup Summary */}
          <div className="space-y-2 mb-6">
            {results.map((result, i) => {
              const m = gameMatchups[i]
              if (!m) return null
              return (
                <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border ${result.correct ? 'border-green bg-green/5' : 'border-red bg-red/5'}`}>
                  {result.correct ? <Check size={16} className="text-green shrink-0" /> : <X size={16} className="text-red shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{m.prompt}</p>
                    <p className="text-[10px] text-text-muted">{m.skill}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <Button onClick={() => setPhase('intro')} icon={<RotateCcw size={16} />} size="lg" className="w-full">
            Fight Again
          </Button>
        </div>
      </div>
    )
  }

  if (!matchup || !displayA || !displayB) return null

  // ============ REVEAL ============
  if (phase === 'reveal') {
    const actualBetter = isSwap
      ? (matchup.betterResponse === 'A' ? 'B' : 'A')
      : matchup.betterResponse

    const isCorrect = selected === actualBetter
    const actualBetterDisplay = isSwap ? matchup.responseB : matchup.responseA
    const actualWorseDisplay = isSwap ? matchup.responseA : matchup.responseB

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ScreenFlash trigger={showFlash} color={flashColor} />

        <div className="flex items-center gap-1 mb-4">
          {gameMatchups.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${
              i < currentIdx ? (results[i]?.correct ? 'bg-green' : 'bg-red') : i === currentIdx ? (isCorrect ? 'bg-green' : 'bg-red') : 'bg-surface-raised'
            }`} />
          ))}
        </div>

        <div className="animate-fade-in">
          <Card padding="lg" className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              {isCorrect ? <Check size={24} className="text-green" /> : selected === null ? <X size={24} className="text-orange" /> : <X size={24} className="text-red" />}
              <div>
                <h3 className="text-lg font-bold text-text-primary">
                  {isCorrect ? 'Great Eye!' : selected === null ? 'Time\'s Up!' : 'Not Quite'}
                </h3>
                <p className="text-xs text-text-secondary">The better response was Response {actualBetter}</p>
              </div>
            </div>

            {/* Model reveal */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-3 rounded-xl border-2 ${actualBetter === 'A' ? 'border-green bg-green/5' : 'border-red/30 bg-red/5'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-text-muted">Response A</span>
                  {actualBetter === 'A' && <Crown size={14} className="text-gold" />}
                </div>
                <p className="text-xs font-bold text-text-primary">{displayA.model}</p>
              </div>
              <div className={`p-3 rounded-xl border-2 ${actualBetter === 'B' ? 'border-green bg-green/5' : 'border-red/30 bg-red/5'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-text-muted">Response B</span>
                  {actualBetter === 'B' && <Crown size={14} className="text-gold" />}
                </div>
                <p className="text-xs font-bold text-text-primary">{displayB.model}</p>
              </div>
            </div>

            {/* Criteria */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {matchup.criteria.map((c, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">✓ {c}</span>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-surface-raised">
              <p className="text-sm text-text-secondary">{matchup.reason}</p>
            </div>
          </Card>

          <Button onClick={nextMatchup} size="lg" className="w-full">
            {currentIdx + 1 >= gameMatchups.length ? 'See Results' : 'Next Matchup'} <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
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
          <span className="text-sm font-bold text-text-primary">Match {currentIdx + 1}/{gameMatchups.length}</span>
          {streak > 1 && <ComboIndicator combo={streak} />}
          <StreakFire streak={streak} />
        </div>
        <AnimatedScore value={score} label="Score" color="text-gold" size="sm" />
      </div>

      <TimerBar timeLeft={timeLeft} maxTime={35} warning={10} />

      {/* Progress */}
      <div className="flex items-center gap-1 mb-4 mt-2">
        {gameMatchups.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${
            i < currentIdx ? (results[i]?.correct ? 'bg-green' : 'bg-red') : i === currentIdx ? 'bg-accent' : 'bg-surface-raised'
          }`} />
        ))}
      </div>

      <div className="animate-fade-in" key={matchup.id}>
        {/* Prompt */}
        <Card padding="md" className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-accent" />
              <span className="text-xs font-bold text-text-muted uppercase tracking-wide">Prompt</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">{matchup.skill}</span>
          </div>
          <p className="text-sm text-text-primary font-medium">&quot;{matchup.prompt}&quot;</p>
        </Card>

        {/* Criteria hints */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] text-text-muted">Judge on:</span>
          {matchup.criteria.map((c, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-raised text-text-secondary">{c}</span>
          ))}
        </div>

        {/* Responses side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {/* Response A */}
          <button
            onClick={() => handlePick('A')}
            className="p-4 rounded-xl border-2 border-border-subtle bg-surface hover:border-blue hover:bg-blue/5 text-left transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue/10 flex items-center justify-center">
                <span className="text-xs font-bold text-blue">A</span>
              </div>
              <span className="text-xs font-bold text-text-muted">Response A</span>
              <Shield size={12} className="text-text-muted ml-auto" />
              <span className="text-[10px] text-text-muted">Blind</span>
            </div>
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{displayA.text}</p>
          </button>

          {/* Response B */}
          <button
            onClick={() => handlePick('B')}
            className="p-4 rounded-xl border-2 border-border-subtle bg-surface hover:border-purple hover:bg-purple/5 text-left transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple/10 flex items-center justify-center">
                <span className="text-xs font-bold text-purple">B</span>
              </div>
              <span className="text-xs font-bold text-text-muted">Response B</span>
              <Shield size={12} className="text-text-muted ml-auto" />
              <span className="text-[10px] text-text-muted">Blind</span>
            </div>
            <p className="text-sm text-text-primary leading-relaxed whitespace-pre-line">{displayB.text}</p>
          </button>
        </div>
      </div>
    </div>
  )
}
