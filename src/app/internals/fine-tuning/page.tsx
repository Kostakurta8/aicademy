'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Sliders, ArrowRight, RotateCcw } from 'lucide-react'

const concepts = [
  {
    id: 'dataset',
    name: 'Training Data',
    description: 'The data your model learns from',
    options: [
      { label: 'General Web Data', effect: 'Broad knowledge, may include biases and errors', quality: 60 },
      { label: 'Curated & Cleaned', effect: 'Higher quality, less bias, but more work needed', quality: 85 },
      { label: 'Domain-Specific', effect: 'Expert-level in one area, weaker in others', quality: 75 },
    ],
  },
  {
    id: 'size',
    name: 'Model Size',
    description: 'Number of parameters',
    options: [
      { label: '1B Parameters', effect: 'Fast, cheap, but limited reasoning ability', quality: 40 },
      { label: '7-8B Parameters', effect: 'Good balance of quality and speed', quality: 70 },
      { label: '70B Parameters', effect: 'Near state-of-the-art, but slow and expensive', quality: 90 },
    ],
  },
  {
    id: 'epochs',
    name: 'Training Duration',
    description: 'How many times the model sees each data point',
    options: [
      { label: '1 Epoch', effect: 'Underfitting — model hasn\'t learned patterns well', quality: 30 },
      { label: '3-5 Epochs', effect: 'Sweet spot — good generalization', quality: 80 },
      { label: '20+ Epochs', effect: 'Overfitting — memorizes training data, poor on new data', quality: 45 },
    ],
  },
  {
    id: 'alignment',
    name: 'Alignment Method',
    description: 'How the model is aligned with human intent',
    options: [
      { label: 'No Alignment', effect: 'Raw model — can produce harmful or biased content', quality: 20 },
      { label: 'RLHF', effect: 'Helpful, harmless, honest — industry standard', quality: 85 },
      { label: 'Constitutional AI', effect: 'Self-supervised alignment with principles', quality: 80 },
    ],
  },
]

export default function FineTuningSimulatorPage() {
  const [selections, setSelections] = useState<Record<string, number>>({
    dataset: 0, size: 1, epochs: 1, alignment: 1,
  })

  const overallScore = Math.round(
    concepts.reduce((sum, c) => sum + c.options[selections[c.id]].quality, 0) / concepts.length
  )

  const handleSelect = (conceptId: string, optionIdx: number) => {
    setSelections((prev) => ({ ...prev, [conceptId]: optionIdx }))
  }

  const handleReset = () => {
    setSelections({ dataset: 0, size: 1, epochs: 1, alignment: 1 })
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Fine-Tuning Simulator</h1>
        <p className="text-text-secondary">Explore how different training choices affect model quality. No real training — just conceptual.</p>
      </div>

      {/* Score */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">Estimated Model Quality</p>
            <p className="text-3xl font-bold text-text-primary">{overallScore}%</p>
          </div>
          <div className="w-24 h-24 relative">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-border-subtle" />
              <circle
                cx="50" cy="50" r="40" fill="none" strokeWidth="8"
                className={`${overallScore >= 70 ? 'text-green' : overallScore >= 50 ? 'text-gold' : 'text-red'} transition-all duration-500`}
                stroke="currentColor"
                strokeLinecap="round"
                strokeDasharray={`${overallScore * 2.51} 251`}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text-primary">{overallScore}%</span>
          </div>
        </div>
      </Card>

      {/* Choices */}
      <div className="space-y-6">
        {concepts.map((concept) => (
          <div key={concept.id}>
            <Card padding="md">
              <div className="flex items-center gap-2 mb-3">
                <Sliders size={16} className="text-accent" />
                <h3 className="text-base font-semibold text-text-primary">{concept.name}</h3>
              </div>
              <p className="text-sm text-text-secondary mb-4">{concept.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {concept.options.map((opt, oi) => (
                  <button
                    key={oi}
                    onClick={() => handleSelect(concept.id, oi)}
                    className={`p-3 rounded-xl border text-left text-sm transition-all cursor-pointer ${
                      selections[concept.id] === oi
                        ? 'border-accent bg-accent/10 ring-2 ring-accent'
                        : 'border-border-subtle bg-surface-raised hover:border-accent/50'
                    }`}
                  >
                    <p className="font-semibold text-text-primary mb-1">{opt.label}</p>
                    <p className="text-xs text-text-secondary">{opt.effect}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-border-subtle overflow-hidden">
                        <div
                          className={`h-full rounded-full ${opt.quality >= 70 ? 'bg-green' : opt.quality >= 50 ? 'bg-gold' : 'bg-red'}`}
                          style={{ width: `${opt.quality}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted">{opt.quality}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-6">
        <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={16} />}>Reset to Defaults</Button>
      </div>
    </div>
  )
}
