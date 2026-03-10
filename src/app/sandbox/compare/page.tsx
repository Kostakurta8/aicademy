'use client'

import { useState, useRef, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ClientOnly from '@/components/ui/ClientOnly'
import { useAIStore } from '@/stores/ai-store'
import { useXPStore } from '@/stores/xp-store'
import { chatComplete, type AIMessage } from '@/lib/ai/groq-client'
import { playCorrect, playXPDing } from '@/lib/sounds'
import {
  GitCompare,
  Play,
  RotateCcw,
  Copy,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  Sparkles,
  Zap,
  ThumbsUp,
  AlertTriangle,
} from 'lucide-react'

interface ModelResult {
  model: string
  output: string
  status: 'idle' | 'loading' | 'done' | 'error'
  error?: string
  latency: number
  tokenEstimate: number
}

const FALLBACK_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
]

const samplePrompts = [
  { label: 'Explain Quantum Computing', prompt: 'Explain quantum computing to a 10-year-old in 3 sentences.' },
  { label: 'Write a Haiku', prompt: 'Write a haiku about artificial intelligence.' },
  { label: 'Debug This Code', prompt: 'What\'s wrong with this code?\n\nfor i in range(10):\n  print(i)\n  if i = 5:\n    break' },
  { label: 'Compare REST vs GraphQL', prompt: 'Compare REST and GraphQL APIs. Give 3 pros and 3 cons of each in a table format.' },
]

function ModelCompareContent() {
  const installedModels = useAIStore((s) => s.installedModels)
  const availableModels = installedModels.length > 0 ? installedModels : FALLBACK_MODELS

  const [prompt, setPrompt] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>(
    availableModels.slice(0, 2)
  )
  const [results, setResults] = useState<ModelResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(512)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [xpAwarded, setXpAwarded] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const abortRef = useRef(false)

  const toggleModel = useCallback((model: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(model)) {
        if (prev.length <= 2) return prev // minimum 2
        return prev.filter((m) => m !== model)
      }
      if (prev.length >= 4) return prev // maximum 4
      return [...prev, model]
    })
  }, [])

  const runComparison = async () => {
    if (!prompt.trim() || selectedModels.length < 2) return

    abortRef.current = false
    setIsRunning(true)
    setWinner(null)

    const initialResults: ModelResult[] = selectedModels.map((model) => ({
      model,
      output: '',
      status: 'loading',
      latency: 0,
      tokenEstimate: 0,
    }))
    setResults(initialResults)

    const promises = selectedModels.map(async (model, idx) => {
      const startTime = performance.now()
      const messages: AIMessage[] = []
      if (systemPrompt.trim()) {
        messages.push({ role: 'system', content: systemPrompt.trim() })
      }
      messages.push({ role: 'user', content: prompt.trim() })

      const result = await chatComplete(messages, {
        model,
        temperature,
        max_tokens: maxTokens,
      })

      const latency = Math.round(performance.now() - startTime)
      const tokenEstimate = Math.round((result.content || '').split(/\s+/).length * 1.3)

      if (abortRef.current) return

      setResults((prev) =>
        prev.map((r, i) =>
          i === idx
            ? {
                ...r,
                output: result.content || '',
                status: result.error ? 'error' : 'done',
                error: result.error,
                latency,
                tokenEstimate,
              }
            : r
        )
      )
    })

    await Promise.all(promises)
    setIsRunning(false)

    if (!xpAwarded && !abortRef.current) {
      useXPStore.getState().addXP(25)
      playXPDing()
      setXpAwarded(true)
    } else if (!abortRef.current) {
      playCorrect()
    }
  }

  const reset = () => {
    abortRef.current = true
    setIsRunning(false)
    setResults([])
    setWinner(null)
  }

  const allDone = results.length > 0 && results.every((r) => r.status === 'done' || r.status === 'error')
  const successResults = results.filter((r) => r.status === 'done')
  const fastest = successResults.length > 0
    ? successResults.reduce((a, b) => (a.latency < b.latency ? a : b))
    : null

  return (
    <div>
      {/* Model Selector */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-text-primary">Select Models (2-4)</span>
          <span className="text-xs text-text-muted">{selectedModels.length} selected</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableModels.map((model) => {
            const isSelected = selectedModels.includes(model)
            return (
              <button
                key={model}
                onClick={() => toggleModel(model)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer
                  ${isSelected
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'bg-surface-raised text-text-muted border border-border-subtle hover:border-accent/30'
                  }
                `}
              >
                {model}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Prompt Input */}
      <Card padding="md" className="mb-6">
        {/* Sample prompts */}
        <div className="flex flex-wrap gap-2 mb-3">
          {samplePrompts.map((sp) => (
            <button
              key={sp.label}
              onClick={() => setPrompt(sp.prompt)}
              className="text-xs px-2.5 py-1 rounded-lg bg-surface-raised text-text-muted hover:text-accent hover:border-accent/30 border border-border-subtle transition-all cursor-pointer"
            >
              {sp.label}
            </button>
          ))}
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter the prompt you want to compare across models..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none text-sm"
        />

        {/* Advanced Settings Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-accent hover:underline mt-2 cursor-pointer"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>

          {showAdvanced && (
            <div className="overflow-hidden animate-fade-in">
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs text-text-muted block mb-1">System Prompt (optional)</label>
                  <input
                    type="text"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="You are a helpful assistant..."
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-border-subtle text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Temperature ({temperature})</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Max Tokens ({maxTokens})</label>
                    <input
                      type="range"
                      min="64"
                      max="2048"
                      step="64"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
      </Card>

      {/* Run / Reset */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-text-muted">
          Comparing <span className="text-accent font-semibold">{selectedModels.length}</span> models
        </div>
        <div className="flex gap-3">
          {results.length > 0 && (
            <Button variant="ghost" onClick={reset} icon={<RotateCcw size={16} />}>
              Reset
            </Button>
          )}
          <Button
            onClick={runComparison}
            loading={isRunning}
            disabled={isRunning || !prompt.trim() || selectedModels.length < 2}
            icon={isRunning ? undefined : <Play size={16} />}
          >
            {isRunning ? 'Comparing...' : 'Compare'}
          </Button>
        </div>
      </div>

      {/* Results Grid */}
      {results.length > 0 && (
          <div
            className={`animate-fade-in grid gap-4 ${results.length === 2 ? 'grid-cols-1 md:grid-cols-2' : results.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}
          >
            {results.map((result, idx) => (
              <div
                key={result.model}
                className="animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: 'both' }}
              >
                <Card
                  padding="none"
                  className={`h-full ${
                    winner === result.model ? 'ring-2 ring-green shadow-lg shadow-green/10' :
                    fastest?.model === result.model && allDone ? 'ring-1 ring-accent/30' : ''
                  }`}
                >
                  {/* Model Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-surface-raised/50 border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        result.status === 'done' ? 'bg-green' :
                        result.status === 'loading' ? 'bg-accent animate-pulse' :
                        result.status === 'error' ? 'bg-red' : 'bg-text-muted/30'
                      }`} />
                      <span className="text-xs font-mono font-semibold text-text-primary truncate max-w-[200px]">
                        {result.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.status === 'done' && (
                        <>
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Clock size={10} />
                            {(result.latency / 1000).toFixed(1)}s
                          </span>
                          {fastest?.model === result.model && (
                            <span className="text-xs text-green flex items-center gap-1">
                              <Zap size={10} /> Fastest
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Output */}
                  <div className="px-4 py-3 min-h-[200px] max-h-[400px] overflow-y-auto">
                    {result.status === 'loading' && (
                      <div className="flex items-center gap-2 text-text-muted">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Generating...</span>
                      </div>
                    )}
                    {result.status === 'error' && (
                      <div className="flex items-start gap-2 text-red">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <span className="text-sm">{result.error}</span>
                      </div>
                    )}
                    {result.status === 'done' && (
                      <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                        {result.output}
                      </p>
                    )}
                  </div>

                  {/* Footer Actions */}
                  {result.status === 'done' && (
                    <div className="flex items-center justify-between px-4 py-2 border-t border-border-subtle">
                      <span className="text-xs text-text-muted">~{result.tokenEstimate} tokens</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigator.clipboard.writeText(result.output)}
                          className="p-1.5 rounded-lg hover:bg-surface-raised text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                          aria-label="Copy"
                        >
                          <Copy size={12} />
                        </button>
                        {allDone && (
                          <button
                            onClick={() => setWinner(winner === result.model ? null : result.model)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              winner === result.model
                                ? 'bg-green/10 text-green'
                                : 'hover:bg-surface-raised text-text-muted hover:text-text-primary'
                            }`}
                            aria-label="Vote as best"
                          >
                            <ThumbsUp size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            ))}
          </div>
        )}

      {/* Summary */}
      {allDone && successResults.length > 0 && (
          <div
            className="animate-fade-in mt-6"
          >
            <Card padding="md" className="text-center">
              <Sparkles size={20} className="text-accent mx-auto mb-2" />
              <p className="text-sm text-text-primary font-semibold">
                Comparison Complete — {successResults.length} model{successResults.length > 1 ? 's' : ''} responded
              </p>
              {fastest && (
                <p className="text-xs text-text-secondary mt-1">
                  Fastest: <span className="text-accent font-mono">{fastest.model}</span> ({(fastest.latency / 1000).toFixed(1)}s)
                </p>
              )}
              {winner && (
                <p className="text-xs text-green mt-1">
                  Your pick: <span className="font-mono">{winner}</span> 🏆
                </p>
              )}
            </Card>
          </div>
        )}
    </div>
  )
}

export default function ModelComparePage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="animate-fade-in mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple to-violet-600 flex items-center justify-center">
            <GitCompare size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Model Compare</h1>
            <p className="text-text-secondary">Send the same prompt to multiple models. Compare speed, quality, and style.</p>
          </div>
        </div>
      </div>

      <ClientOnly fallback={<div className="h-60" />}>
        <ModelCompareContent />
      </ClientOnly>
    </div>
  )
}
