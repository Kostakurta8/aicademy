'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ArrowRight, Database, FileText, Search, Cpu, MessageCircle } from 'lucide-react'

const steps = [
  {
    id: 'query',
    icon: MessageCircle,
    label: 'User Query',
    description: 'The user asks a question',
    detail: 'Example: "What is our company\'s refund policy?"',
    color: 'text-purple',
  },
  {
    id: 'embed',
    icon: Cpu,
    label: 'Embed Query',
    description: 'Convert question to a vector',
    detail: 'The query is passed through an embedding model to create a dense vector representation that captures its semantic meaning.',
    color: 'text-blue',
  },
  {
    id: 'search',
    icon: Search,
    label: 'Vector Search',
    description: 'Find similar documents',
    detail: 'The query vector is compared against all document vectors in the vector database using cosine similarity. Top-K most similar chunks are retrieved.',
    color: 'text-green',
  },
  {
    id: 'retrieve',
    icon: FileText,
    label: 'Retrieve Context',
    description: 'Get relevant text chunks',
    detail: 'The actual text content of the top matching document chunks is retrieved. These become the "context" that the LLM will reference.',
    color: 'text-orange',
  },
  {
    id: 'augment',
    icon: Database,
    label: 'Augment Prompt',
    description: 'Combine context + question',
    detail: 'The retrieved context is injected into the prompt along with the original question. Format: "Based on the following context, answer the question: [context] Question: [query]"',
    color: 'text-pink',
  },
  {
    id: 'generate',
    icon: Cpu,
    label: 'Generate Answer',
    description: 'LLM produces grounded response',
    detail: 'The LLM generates an answer that is grounded in the retrieved documents, reducing hallucinations and providing accurate, source-backed responses.',
    color: 'text-cyan',
  },
]

export default function RAGPipelinePage() {
  const [activeStep, setActiveStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleAnimate = () => {
    setIsAnimating(true)
    setActiveStep(0)
    let i = 0
    const timer = setInterval(() => {
      i++
      if (i >= steps.length) {
        clearInterval(timer)
        setIsAnimating(false)
        return
      }
      setActiveStep(i)
    }, 1000)
  }

  const step = steps[activeStep]
  const StepIcon = step.icon

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-text-primary mb-2">RAG Pipeline Visualizer</h1>
        <p className="text-text-secondary">See how Retrieval-Augmented Generation combines search with AI generation.</p>
      </div>

      <div className="flex justify-center mb-6">
        <Button onClick={handleAnimate} disabled={isAnimating} icon={<ArrowRight size={16} />}>
          {isAnimating ? 'Animating...' : 'Run Pipeline'}
        </Button>
      </div>

      {/* Pipeline flow */}
      <Card padding="lg" className="mb-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  onClick={() => setActiveStep(i)}
                  style={{
                    transform: `scale(${i === activeStep ? 1.15 : 1})`,
                    opacity: i <= activeStep ? 1 : 0.4,
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer min-w-[80px] ${
                    i === activeStep ? 'border-accent bg-accent/10' : 'border-border-subtle bg-surface-raised'
                  }`}
                >
                  <Icon size={20} className={i === activeStep ? 'text-accent' : s.color} />
                  <span className="text-xs font-medium text-text-primary">{s.label}</span>
                </button>
                {i < steps.length - 1 && <ArrowRight size={14} className="text-text-muted shrink-0" />}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Detail */}
      <div key={activeStep} className="animate-fade-in">
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center`}>
              <StepIcon size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Step {activeStep + 1} of {steps.length}</p>
              <h3 className="text-lg font-bold text-text-primary">{step.label}</h3>
            </div>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed mb-4">{step.detail}</p>

          {activeStep === 0 && (
            <div className="p-3 rounded-lg bg-purple/5 border border-purple/20 font-mono text-sm text-text-primary">
              &ldquo;What is our company&apos;s refund policy?&rdquo;
            </div>
          )}
          {activeStep === 4 && (
            <pre className="p-3 rounded-lg bg-orange/5 border border-orange/20 text-xs text-text-secondary whitespace-pre-wrap font-mono">{`System: Answer based on the following context.

Context:
[Doc 1] "Refunds are available within 30 days..."
[Doc 2] "Digital products are non-refundable..."

Question: What is our company's refund policy?`}</pre>
          )}
        </Card>
      </div>
    </div>
  )
}
