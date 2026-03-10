'use client'

import { useState, useMemo } from 'react'
import Card from '@/components/ui/Card'
import { Eye, AlertTriangle } from 'lucide-react'

const MODEL_WINDOWS: Record<string, number> = {
  'GPT-3.5': 4096,
  'GPT-4': 128000,
  'GPT-4o': 128000,
  'Claude 3 Haiku': 200000,
  'Claude 3.5 Sonnet': 200000,
  'Llama 3.1 8B': 128000,
  'Mistral 7B': 32000,
  'Gemma 2': 8192,
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export default function ContextWindowPage() {
  const [text, setText] = useState('')
  const [selectedModel, setSelectedModel] = useState('Llama 3.1 8B')

  const tokens = useMemo(() => estimateTokens(text), [text])
  const maxTokens = MODEL_WINDOWS[selectedModel]
  const percentage = Math.min((tokens / maxTokens) * 100, 100)
  const isOverflow = tokens > maxTokens

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Context Window Visualizer</h1>
        <p className="text-text-secondary">See how much of a model&apos;s context window your text uses.</p>
      </div>

      {/* Model selector */}
      <Card padding="md" className="mb-6">
        <label className="text-sm font-medium text-text-secondary block mb-2">Select Model</label>
        <div className="flex flex-wrap gap-2">
          {Object.keys(MODEL_WINDOWS).map((model) => (
            <button
              key={model}
              onClick={() => setSelectedModel(model)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                selectedModel === model
                  ? 'bg-accent text-white'
                  : 'bg-surface-raised text-text-secondary hover:bg-border-subtle/30'
              }`}
            >
              {model} ({(MODEL_WINDOWS[model] / 1000).toFixed(0)}K)
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card padding="md">
          <label className="text-sm font-medium text-text-secondary block mb-2">Your Text / Prompt</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your prompt, system message, or any text here to see how many tokens it uses..."
            className="w-full h-64 p-4 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none outline-none focus:ring-2 focus:ring-accent font-mono"
          />
          <div className="flex items-center justify-between mt-3 text-xs text-text-muted">
            <span>{text.length} characters</span>
            <span>≈ {tokens.toLocaleString()} tokens</span>
          </div>
        </Card>

        {/* Visualization */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={18} className="text-accent" />
            <h2 className="text-base font-semibold text-text-primary">Context Window Usage</h2>
          </div>

          {/* Visual bar */}
          <div className="relative mb-6">
            <div className="w-full h-12 rounded-xl bg-surface-raised border border-border-subtle overflow-hidden">
              <div
                className={`h-full rounded-xl transition-all duration-500 ease-out ${
                  isOverflow ? 'bg-red' : percentage > 80 ? 'bg-gold' : 'bg-accent'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-text-muted">
              <span>0</span>
              <span>{(maxTokens / 2).toLocaleString()}</span>
              <span>{maxTokens.toLocaleString()}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-surface-raised">
              <p className="text-2xl font-bold text-text-primary">{tokens.toLocaleString()}</p>
              <p className="text-xs text-text-muted">Tokens used</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-raised">
              <p className="text-2xl font-bold text-text-primary">{(maxTokens - tokens).toLocaleString()}</p>
              <p className="text-xs text-text-muted">Tokens remaining</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-raised">
              <p className="text-2xl font-bold text-text-primary">{percentage.toFixed(1)}%</p>
              <p className="text-xs text-text-muted">Window used</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-raised">
              <p className="text-2xl font-bold text-text-primary">{selectedModel}</p>
              <p className="text-xs text-text-muted">{maxTokens.toLocaleString()} max</p>
            </div>
          </div>

          {/* Warnings */}
          {isOverflow && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red/10 border border-red/20 animate-fade-in">
              <AlertTriangle size={16} className="text-red shrink-0 mt-0.5" />
              <p className="text-xs text-red">Your text exceeds this model&apos;s context window. Oldest tokens will be dropped.</p>
            </div>
          )}
          {!isOverflow && percentage > 80 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-gold/10 border border-gold/20 animate-fade-in">
              <AlertTriangle size={16} className="text-gold shrink-0 mt-0.5" />
              <p className="text-xs text-gold">Getting close to the limit. Leave room for the AI&apos;s response!</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
