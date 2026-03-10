'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Scale, ArrowRight, Check, RotateCcw } from 'lucide-react'

const scenarios = [
  {
    id: 1,
    title: 'Resume Screening',
    description: 'An AI hiring tool was trained on 10 years of company hiring data. The company historically hired mostly men for engineering roles.',
    question: 'What bias might this AI system develop?',
    options: [
      'It will work perfectly since it has lots of data',
      'It may unfairly rank female candidates lower for engineering roles',
      'It will only hire the most qualified candidates',
      'It will be completely random in its selections',
    ],
    correct: 1,
    explanation: 'If historical hiring data reflects gender imbalance, the AI learns to associate male candidates with engineering roles. It will replicate the bias, potentially scoring women lower even with identical qualifications. This is a real problem — Amazon scrapped such a tool in 2018.',
    biasType: 'Historical Bias',
  },
  {
    id: 2,
    title: 'Medical Diagnosis',
    description: 'An AI diagnostic tool was trained primarily on data from patients in the United States. It\'s now being used globally.',
    question: 'What issue could arise?',
    options: [
      'It will work better for US patients',
      'It will give the same results worldwide',
      'It may misdiagnose conditions that present differently in other populations',
      'It will simply refuse to analyze international patients',
    ],
    correct: 2,
    explanation: 'Medical conditions can present differently across ethnic groups, and disease prevalence varies by region. A model trained mostly on one population may miss conditions common in others or misinterpret symptoms. This is representation bias — the training data doesn\'t represent the full user population.',
    biasType: 'Representation Bias',
  },
  {
    id: 3,
    title: 'Language Translation',
    description: 'An AI translation tool defaults to "he" for doctors and "she" for nurses when translating from gender-neutral languages.',
    question: 'What kind of bias is this?',
    options: [
      'A helpful feature that saves time',
      'Algorithmic bias — it\'s a bug in the code',
      'Stereotypical bias learned from training data reflecting societal stereotypes',
      'A random error that happens occasionally',
    ],
    correct: 2,
    explanation: 'The model learned gender stereotypes from its training data, which reflects historical societal patterns. When translating from languages without gendered pronouns, it defaults to stereotypical associations (doctors = male, nurses = female). Google Translate has worked to fix this specific issue.',
    biasType: 'Stereotypical Bias',
  },
  {
    id: 4,
    title: 'Content Moderation',
    description: 'An AI content moderator flags African American Vernacular English (AAVE) as "toxic" at 2x the rate of Standard American English.',
    question: 'Why does this happen?',
    options: [
      'AAVE is inherently more toxic',
      'The AI is programmed to target specific groups',
      'The training data for "toxic" content disproportionately included AAVE',
      'It\'s a coincidence with no real pattern',
    ],
    correct: 2,
    explanation: 'Annotation bias: human annotators who labeled training data may have been unfamiliar with AAVE and marked culturally specific language as "toxic." The AI then learned to associate AAVE features with toxicity. This is well-documented in academic research on content moderation AI.',
    biasType: 'Annotation Bias',
  },
]

export default function BiasAnalyzerPage() {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [completed, setCompleted] = useState<number[]>([])

  const scenario = scenarios[currentIdx]

  const handleSelect = (optIdx: number) => {
    if (selected !== null) return
    setSelected(optIdx)
    if (optIdx === scenario.correct) {
      setCompleted((prev) => [...new Set([...prev, scenario.id])])
    }
  }

  const handleNext = () => {
    if (currentIdx < scenarios.length - 1) {
      setCurrentIdx((i) => i + 1)
      setSelected(null)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Bias &amp; Fairness Analyzer</h1>
        <p className="text-text-secondary">Explore real-world scenarios where AI bias causes harm. Learn to identify and mitigate bias.</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {scenarios.map((s, i) => (
          <button key={s.id} onClick={() => { setCurrentIdx(i); setSelected(null) }}
            className={`flex-1 h-2 rounded-full cursor-pointer transition-colors ${
              completed.includes(s.id) ? 'bg-green' : i === currentIdx ? 'bg-accent' : 'bg-border-subtle'
            }`} />
        ))}
        <span className="text-sm text-text-muted ml-2">{completed.length}/{scenarios.length}</span>
      </div>

      <div key={scenario.id} className="animate-fade-in">
        <Card padding="lg" className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">#{scenario.id}: {scenario.title}</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-orange/10 text-orange">{scenario.biasType}</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle mb-4">
            <p className="text-sm text-text-secondary leading-relaxed">{scenario.description}</p>
          </div>

          <p className="text-base font-medium text-text-primary mb-4">{scenario.question}</p>

          <div className="space-y-2 mb-4">
            {scenario.options.map((opt, i) => (
              <button key={i} onClick={() => handleSelect(i)} disabled={selected !== null}
                className={`w-full text-left p-4 rounded-xl border text-sm transition-all cursor-pointer ${
                  selected === null ? 'border-border-subtle hover:border-accent bg-surface-raised' :
                  i === scenario.correct ? 'border-green bg-green/10 text-green' :
                  i === selected ? 'border-red bg-red/10 text-red' :
                  'border-border-subtle bg-surface-raised opacity-50'}`}>
                {opt}
              </button>
            ))}
          </div>

          {selected !== null && (
            <div className="animate-fade-in">
              <div className={`p-4 rounded-xl ${selected === scenario.correct ? 'bg-green/10 border border-green/20' : 'bg-red/10 border border-red/20'}`}>
                <p className="text-sm font-semibold mb-1">{selected === scenario.correct ? '✅ Correct! +30 XP' : '❌ Not quite.'}</p>
                <p className="text-sm text-text-secondary">{scenario.explanation}</p>
              </div>
            </div>
          )}
        </Card>

        {selected !== null && currentIdx < scenarios.length - 1 && (
          <div className="flex justify-end">
            <Button onClick={handleNext} icon={<ArrowRight size={16} />}>Next Scenario</Button>
          </div>
        )}
      </div>

      {completed.length === scenarios.length && (
        <div className="animate-fade-in">
          <Card padding="lg" glow className="text-center">
            <h2 className="text-xl font-bold text-text-primary mb-2">🎓 All Scenarios Complete!</h2>
            <p className="text-text-secondary mb-4">You&apos;ve learned about {scenarios.length} types of AI bias. +{completed.length * 30} XP</p>
            <Button onClick={() => { setCurrentIdx(0); setSelected(null); setCompleted([]) }} icon={<RotateCcw size={16} />}>Review Again</Button>
          </Card>
        </div>
      )}
    </div>
  )
}
