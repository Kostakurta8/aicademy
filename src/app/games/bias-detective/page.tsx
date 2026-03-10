'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ConfettiBurst, ScreenFlash, XPPopup, TimerBar, AnimatedScore, ComboIndicator, StreakFire } from '@/components/ui/GameEffects'
import { Search, RotateCcw, Trophy, ShieldAlert, Scale, Brain, Check, X, Eye, AlertTriangle, ChevronRight } from 'lucide-react'
import { useXPStore } from '@/stores/xp-store'

interface BiasCase {
  id: string
  scenario: string
  aiResponse: string
  biasType: string
  options: string[]
  correctIndex: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  explanation: string
  fixedResponse: string
}

const severityConfig = {
  low: { label: 'Low', color: 'text-yellow', bg: 'bg-yellow/10', border: 'border-yellow/30' },
  medium: { label: 'Medium', color: 'text-orange', bg: 'bg-orange/10', border: 'border-orange/30' },
  high: { label: 'High', color: 'text-red', bg: 'bg-red/10', border: 'border-red/30' },
  critical: { label: 'Critical', color: 'text-red', bg: 'bg-red/15', border: 'border-red/50' },
}

const cases: BiasCase[] = [
  {
    id: 'hiring',
    scenario: 'HR department uses an AI to screen job applications for a software engineering role.',
    aiResponse: 'Based on my analysis, I recommend prioritizing candidates from top-tier universities like MIT and Stanford. Candidates with names that are easier to pronounce tend to be better cultural fits for the team.',
    biasType: 'Selection Bias + Name Discrimination',
    options: ['Confirmation Bias', 'Selection & Name Bias', 'Availability Heuristic', 'Anchoring Bias'],
    correctIndex: 1,
    severity: 'critical',
    explanation: 'This AI shows both selection bias (favoring elite universities over skills) and name-based discrimination, which can systematically exclude qualified candidates from diverse backgrounds.',
    fixedResponse: 'I recommend evaluating candidates based on demonstrated skills, relevant experience, and problem-solving abilities regardless of educational institution or name.',
  },
  {
    id: 'loan',
    scenario: 'A bank uses AI to evaluate loan applications.',
    aiResponse: 'Applicant from ZIP code 90210 approved with preferred rate. Applicant from ZIP code 30314 flagged as high-risk despite identical income and credit score.',
    biasType: 'Geographic/Proxy Discrimination',
    options: ['Geographic Proxy Bias', 'Confirmation Bias', 'Recency Bias', 'Survivorship Bias'],
    correctIndex: 0,
    severity: 'critical',
    explanation: 'Using ZIP codes as risk factors is a well-known proxy for racial discrimination (digital redlining). Two applicants with identical financials receive different outcomes based on location alone.',
    fixedResponse: 'Both applicants qualify for the preferred rate based on their income, credit score, and repayment history.',
  },
  {
    id: 'medical',
    scenario: 'An AI diagnostic tool evaluates patient symptoms for a possible heart condition.',
    aiResponse: 'Patient (female, age 45) presents with chest pain and shortness of breath. Recommendation: likely anxiety or stress-related. Prescribe mild sedative. Note: heart attack risk is primarily associated with male patients.',
    biasType: 'Gender Bias in Medical Diagnosis',
    options: ['Automation Bias', 'Gender Bias', 'Selection Bias', 'Framing Effect'],
    correctIndex: 1,
    severity: 'high',
    explanation: 'The AI dismisses cardiac symptoms in a female patient due to historical bias in medical training data. Heart disease is the leading cause of death for women, but symptoms are often attributed to anxiety.',
    fixedResponse: 'Patient presents with chest pain and shortness of breath. Recommend immediate cardiac workup including ECG and troponin levels regardless of gender.',
  },
  {
    id: 'translate',
    scenario: 'AI translation system translates professional titles from a gender-neutral language.',
    aiResponse: 'Translations: "Doctor" → "He is a doctor." "Nurse" → "She is a nurse." "Engineer" → "He is an engineer." "Teacher" → "She is a teacher."',
    biasType: 'Gender Stereotyping',
    options: ['Cultural Bias', 'Reporting Bias', 'Gender Stereotyping', 'Sampling Bias'],
    correctIndex: 2,
    severity: 'high',
    explanation: 'The AI assigns gendered pronouns based on stereotypical associations of professions with specific genders, reinforcing occupational stereotypes in its output.',
    fixedResponse: 'In gender-neutral translations, use "They are a doctor/nurse/engineer/teacher" or ask the user for the intended pronoun.',
  },
  {
    id: 'policing',
    scenario: 'A city deploys predictive policing AI to allocate patrol resources.',
    aiResponse: 'High crime prediction zones: primarily neighborhoods with higher minority populations. Recommend increased patrol presence in these areas. Lower crime predicted in suburban areas — reduce patrol allocation.',
    biasType: 'Feedback Loop Bias',
    options: ['Feedback Loop Bias', 'Base Rate Fallacy', 'Halo Effect', 'Dunning-Kruger Effect'],
    correctIndex: 0,
    severity: 'critical',
    explanation: 'More policing → more arrests → more "crime" data → more policing. This creates a self-reinforcing feedback loop that over-polices certain communities while under-detecting crime elsewhere.',
    fixedResponse: 'Crime prediction should account for reporting bias and patrol-density effects. Recommend balanced patrol allocation with community-based safety metrics.',
  },
  {
    id: 'beauty',
    scenario: 'An AI-powered beauty scoring app rates uploaded photos on "attractiveness."',
    aiResponse: 'Analysis: Lighter skin tones scored 15% higher on average. European facial features received higher symmetry ratings. Users with darker complexions received suggestions for "skin brightening."',
    biasType: 'Racial Bias in Training Data',
    options: ['Measurement Bias', 'Racial Training Data Bias', 'Anchoring Bias', 'Gambler\'s Fallacy'],
    correctIndex: 1,
    severity: 'critical',
    explanation: 'The model was trained predominantly on images reflecting Eurocentric beauty standards, creating racial bias that systematically rates certain ethnicities lower and recommends harmful alterations.',
    fixedResponse: 'This application should not assign attractiveness scores. If beauty analysis is needed, it must celebrate diversity across all skin tones and features without ranking.',
  },
  {
    id: 'resume',
    scenario: 'An AI resume screener is used to shortlist candidates for interviews.',
    aiResponse: 'Filtered results: Resumes containing "women\'s chess club," "maternity leave," or "part-time" were automatically down-ranked. Resumes with "captain," "aggressive," and "dominant" were up-ranked.',
    biasType: 'Linguistic Gender Bias',
    options: ['Attribution Bias', 'Linguistic Gender Bias', 'Status Quo Bias', 'Negativity Bias'],
    correctIndex: 1,
    severity: 'high',
    explanation: 'The AI learned to associate masculine-coded language with competence and feminine-coded language or life events (maternity) with lower performance, systematically disadvantaging women.',
    fixedResponse: 'Resume screening should focus on skills, qualifications, and achievements. Gender-coded terms and life events should not influence candidate ranking.',
  },
  {
    id: 'chatbot',
    scenario: 'A customer service chatbot handles support tickets for a tech company.',
    aiResponse: 'Detected accent pattern: non-native English speaker. Routing to simplified FAQ. Users with native English patterns are routed to full technical support with human agent escalation.',
    biasType: 'Language Proficiency Discrimination',
    options: ['Automation Bias', 'Stereotyping Bias', 'Language Proficiency Bias', 'Sampling Bias'],
    correctIndex: 2,
    severity: 'high',
    explanation: 'The chatbot provides inferior service based on perceived language proficiency, creating a two-tier support system that discriminates against non-native speakers.',
    fixedResponse: 'All users receive the same level of technical support. Language assistance should be offered as an option, not forced based on accent detection.',
  },
  {
    id: 'content',
    scenario: 'A social media AI moderates content across global communities.',
    aiResponse: 'Flagged content in Arabic and Hindi at 3x the rate of English content. Cultural expressions and traditional attire images flagged as "potentially inappropriate." English slang and colloquialisms given more lenient moderation.',
    biasType: 'Cultural and Linguistic Bias',
    options: ['Ethnocentric Bias', 'Recency Bias', 'Confirmation Bias', 'Survivorship Bias'],
    correctIndex: 0,
    severity: 'high',
    explanation: 'The moderation model was primarily trained on English content standards, causing it to disproportionately flag content from other cultures and languages, effectively silencing diverse voices.',
    fixedResponse: 'Content moderation must apply culturally-aware standards with equal treatment across all languages, trained with diverse cultural context.',
  },
  {
    id: 'autonomous',
    scenario: 'An autonomous vehicle AI makes split-second decisions in unavoidable hazard scenarios.',
    aiResponse: 'Ethical subroutine activated: In pedestrian detection, well-dressed individuals in business areas received higher avoidance priority than casually-dressed individuals in residential areas.',
    biasType: 'Socioeconomic Value Bias',
    options: ['Trolley Problem Bias', 'Socioeconomic Value Bias', 'Framing Effect', 'Hindsight Bias'],
    correctIndex: 1,
    severity: 'critical',
    explanation: 'The AI assigns differential value to human life based on appearance and location, reflecting socioeconomic bias. All pedestrians must receive equal protection regardless of how they look or where they are.',
    fixedResponse: 'All pedestrians receive identical avoidance priority. The system must protect all human life equally without considering appearance, location, or any demographic factor.',
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

export default function BiasDetectivePage() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'feedback' | 'gameOver'>('intro')
  const [gameOrder, setGameOrder] = useState<BiasCase[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState(45)
  const [timerActive, setTimerActive] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [flashColor, setFlashColor] = useState<'green' | 'red' | 'gold'>('green')
  const [showXP, setShowXP] = useState(false)
  const [answers, setAnswers] = useState<{ caseId: string; correct: boolean; time: number }[]>([])
  const [showEvidence, setShowEvidence] = useState(false)
  const addXP = useXPStore((s) => s.addXP)

  const startGame = useCallback(() => {
    setGameOrder(shuffleArray(cases))
    setCurrentIdx(0)
    setSelected(null)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setAnswers([])
    setShowEvidence(false)
    setPhase('playing')
    setTimeLeft(45)
    setTimerActive(true)
  }, [])

  // Timer  
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { handleAnswer(-1); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timeLeft])

  const handleAnswer = useCallback((idx: number) => {
    if (phase !== 'playing') return
    setTimerActive(false)
    setSelected(idx)

    const currentCase = gameOrder[currentIdx]
    const isCorrect = idx === currentCase.correctIndex
    const timeUsed = 45 - timeLeft

    if (isCorrect) {
      const timeBonus = Math.max(0, Math.round(timeLeft * 0.5))
      const streakBonus = streak * 10
      const points = 100 + timeBonus + streakBonus
      setScore(s => s + points)
      setStreak(s => s + 1)
      setBestStreak(prev => Math.max(prev, streak + 1))
      setFlashColor('green')
    } else {
      setStreak(0)
      setFlashColor('red')
    }

    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 400)
    setAnswers(prev => [...prev, { caseId: currentCase.id, correct: isCorrect, time: timeUsed }])
    setPhase('feedback')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx, gameOrder, timeLeft, streak])

  const nextCase = () => {
    setShowEvidence(false)
    if (currentIdx + 1 >= gameOrder.length) {
      const totalXP = score + 50
      addXP(totalXP)
      setShowConfetti(true)
      setShowXP(true)
      setPhase('gameOver')
      setTimeout(() => { setShowConfetti(false); setShowXP(false) }, 4000)
    } else {
      setCurrentIdx(i => i + 1)
      setSelected(null)
      setTimeLeft(45)
      setTimerActive(true)
      setPhase('playing')
    }
  }

  const currentCase = gameOrder[currentIdx]
  const correctAnswers = answers.filter(a => a.correct).length

  // ============ INTRO ============
  if (phase === 'intro') {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="animate-celebrate-pop">
          <Card padding="lg" glow className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-600 to-red flex items-center justify-center shadow-xl shadow-amber-500/20 relative">
              <Search size={40} className="text-white" />
              <div className="animate-wiggle absolute inset-0 rounded-2xl border-2 border-amber-400/40" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Bias Detective</h1>
            <p className="text-text-secondary mb-6">Investigate AI responses and identify hidden biases. Can you spot what&apos;s wrong?</p>

            <div className="grid grid-cols-3 gap-3 mb-6 max-w-md mx-auto">
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-text-primary">{cases.length}</p>
                <p className="text-[10px] text-text-muted">Cases</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-red">45s</p>
                <p className="text-[10px] text-text-muted">Per Case</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-lg font-bold text-gold">1000+</p>
                <p className="text-[10px] text-text-muted">Max XP</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-left max-w-md mx-auto mb-6">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-raised text-xs text-text-secondary">
                <Eye size={14} className="text-amber-500 shrink-0" />
                <span>Read the AI&apos;s response carefully for hidden biases</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-raised text-xs text-text-secondary">
                <AlertTriangle size={14} className="text-red shrink-0" />
                <span>Each case has a severity rating — critical cases need urgent attention</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-surface-raised text-xs text-text-secondary">
                <Scale size={14} className="text-accent shrink-0" />
                <span>After identifying the bias, see how the response should have been written</span>
              </div>
            </div>

            <Button onClick={startGame} size="lg" className="w-full max-w-sm">
              <Search size={18} className="mr-2" /> Begin Investigation
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  // ============ GAME OVER ============
  if (phase === 'gameOver') {
    const accuracy = Math.round((correctAnswers / cases.length) * 100)
    const getRank = (acc: number) => {
      if (acc >= 90) return '🕵️ Master Detective'
      if (acc >= 70) return '🔍 Senior Investigator'
      if (acc >= 50) return '📋 Junior Analyst'
      return '🔰 Trainee'
    }
    const rank = getRank(accuracy)

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ConfettiBurst trigger={showConfetti} color="gold" />
        <XPPopup amount={score + 50} show={showXP} />

        <div className="animate-fade-in">
          <Card padding="lg" glow className="text-center mb-6">
            <div className="animate-celebrate-pop">
              <Trophy size={48} className="text-gold mx-auto mb-3" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">Investigation Complete!</h2>
            <p className="text-text-secondary mb-1">{rank}</p>

            <div className="grid grid-cols-4 gap-3 my-6">
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-green">{correctAnswers}/{cases.length}</p>
                <p className="text-[10px] text-text-muted">Solved</p>
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
                <p className="text-xl font-bold text-gold">+{score + 50}</p>
                <p className="text-[10px] text-text-muted">XP</p>
              </div>
            </div>

            {/* Accuracy bar */}
            <div className="w-full bg-surface-raised rounded-full h-3 mb-4 max-w-xs mx-auto overflow-hidden">
              <div style={{ width: `${accuracy}%` }}
                className={`h-full rounded-full transition-all duration-300 ${accuracy >= 70 ? 'bg-green' : accuracy >= 40 ? 'bg-yellow' : 'bg-red'}`} />
            </div>
          </Card>

          {/* Case Summary */}
          <div className="space-y-2 mb-6">
            {answers.map((answer, i) => {
              const c = gameOrder[i]
              const sev = severityConfig[c.severity]
              return (
                <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border ${answer.correct ? 'border-green bg-green/5' : 'border-red bg-red/5'}`}>
                  {answer.correct ? <Check size={16} className="text-green shrink-0" /> : <X size={16} className="text-red shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-primary truncate">{c.biasType}</p>
                    <p className="text-[10px] text-text-muted">{answer.time}s</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sev.bg} ${sev.color} font-bold`}>{sev.label}</span>
                </div>
              )
            })}
          </div>

          <Button onClick={() => setPhase('intro')} icon={<RotateCcw size={16} />} size="lg" className="w-full">
            New Investigation
          </Button>
        </div>
      </div>
    )
  }

  // ============ FEEDBACK ============
  if (phase === 'feedback' && currentCase) {
    const isCorrect = selected === currentCase.correctIndex
    const sev = severityConfig[currentCase.severity]

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ScreenFlash trigger={showFlash} color={flashColor} />

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-4">
          {gameOrder.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${
              i < currentIdx ? (answers[i]?.correct ? 'bg-green' : 'bg-red') : i === currentIdx ? (isCorrect ? 'bg-green' : 'bg-red') : 'bg-surface-raised'
            }`} />
          ))}
        </div>

        <div className="animate-fade-in">
          <Card padding="lg" className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              {isCorrect ? <Check size={24} className="text-green" /> : <X size={24} className="text-red" />}
              <div>
                <h3 className="text-lg font-bold text-text-primary">{isCorrect ? 'Correct!' : 'Not Quite'}</h3>
                <p className="text-xs text-text-secondary">The bias: <span className="font-bold text-text-primary">{currentCase.biasType}</span></p>
              </div>
              <div className="ml-auto">
                <span className={`text-[10px] px-2 py-1 rounded-full ${sev.bg} ${sev.color} font-bold border ${sev.border}`}>
                  {sev.label} Severity
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-raised mb-4">
              <p className="text-sm text-text-secondary">{currentCase.explanation}</p>
            </div>

            <button onClick={() => setShowEvidence(!showEvidence)}
              className="text-xs text-accent flex items-center gap-1 mb-2 cursor-pointer hover:underline">
              <Eye size={12} /> {showEvidence ? 'Hide' : 'Show'} corrected response
            </button>

              {showEvidence && (
                <div className="animate-fade-in p-3 rounded-xl bg-green/5 border border-green/20 overflow-hidden">
                  <p className="text-xs text-text-muted mb-1 font-bold">✅ How it should respond:</p>
                  <p className="text-sm text-text-secondary">{currentCase.fixedResponse}</p>
                </div>
              )}
          </Card>

          <Button onClick={nextCase} size="lg" className="w-full">
            {currentIdx + 1 >= gameOrder.length ? 'See Results' : 'Next Case'} <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      </div>
    )
  }

  // ============ PLAYING ============
  if (!currentCase) return null

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <ScreenFlash trigger={showFlash} color={flashColor} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <ShieldAlert size={18} className="text-amber-500" />
            <span className="text-sm font-bold text-text-primary">Case {currentIdx + 1}/{gameOrder.length}</span>
          </div>
          {streak > 1 && <ComboIndicator combo={streak} />}
          <StreakFire streak={streak} />
        </div>
        <AnimatedScore value={score} label="Score" color="text-gold" size="sm" />
      </div>

      <TimerBar timeLeft={timeLeft} maxTime={45} warning={10} />

      {/* Progress dots */}
      <div className="flex items-center gap-1 mb-4 mt-2">
        {gameOrder.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
            i < currentIdx ? (answers[i]?.correct ? 'bg-green' : 'bg-red') : i === currentIdx ? 'bg-accent' : 'bg-surface-raised'
          }`} />
        ))}
      </div>

      {/* Case File */}
      <div className="animate-fade-in" key={currentCase.id}>
        <Card padding="lg" className="mb-4 border-l-4 border-l-amber-500">
          {/* Severity badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-accent" />
              <p className="text-xs font-bold text-text-muted uppercase tracking-wide">Scenario</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${severityConfig[currentCase.severity].bg} ${severityConfig[currentCase.severity].color} font-bold`}>
              {severityConfig[currentCase.severity].label} Risk
            </span>
          </div>
          <p className="text-sm text-text-secondary mb-4">{currentCase.scenario}</p>

          <div className="p-4 rounded-xl bg-red/5 border border-red/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red" />
              <p className="text-xs font-bold text-red">AI Response Under Investigation</p>
            </div>
            <p className="text-sm text-text-primary leading-relaxed">{currentCase.aiResponse}</p>
          </div>
        </Card>

        {/* Options */}
        <p className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wide">What type of bias is present?</p>
        <div className="grid grid-cols-1 gap-2">
          {currentCase.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={selected !== null}
              className="p-3 rounded-xl border-2 border-border-subtle bg-surface hover:border-accent/50 hover:bg-accent/5 text-left transition-all cursor-pointer disabled:opacity-50 disabled:cursor-default hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="text-sm font-medium text-text-primary">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
