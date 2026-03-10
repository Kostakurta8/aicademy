'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import { Layers, ArrowRight, Zap } from 'lucide-react'

const layers = [
  {
    id: 'input',
    name: 'Input Layer',
    icon: '📥',
    description: 'Raw text enters the model',
    detail: 'Your prompt text is received as a string of characters. Nothing has been processed yet.',
    color: 'border-purple/30 bg-purple/5',
  },
  {
    id: 'tokenizer',
    name: 'Tokenizer',
    icon: '✂️',
    description: 'Text → Tokens (BPE)',
    detail: 'The tokenizer splits text into subword tokens using Byte-Pair Encoding (BPE). "unbelievable" → ["un", "believ", "able"]. Each token maps to an integer ID in the vocabulary.',
    color: 'border-blue/30 bg-blue/5',
  },
  {
    id: 'embedding',
    name: 'Embedding Layer',
    icon: '📊',
    description: 'Tokens → Vectors (768-4096 dim)',
    detail: 'Each token ID is converted to a dense vector of numbers (e.g., 4096 dimensions for LLaMA 3). These vectors capture semantic meaning — similar words have similar vectors.',
    color: 'border-green/30 bg-green/5',
  },
  {
    id: 'position',
    name: 'Positional Encoding',
    icon: '📍',
    description: 'Adds position information',
    detail: 'Since transformers process all tokens in parallel, they need position info. Rotary Position Embeddings (RoPE) encode where each token sits in the sequence.',
    color: 'border-cyan/30 bg-cyan/5',
  },
  {
    id: 'attention',
    name: 'Self-Attention (×N)',
    icon: '🔍',
    description: 'Tokens attend to each other',
    detail: 'The core of the transformer. Each token creates Query, Key, and Value vectors. Attention score = softmax(Q·K^T / √d). Multi-head attention runs multiple attention patterns in parallel. LLaMA 3 8B has 32 layers × 32 heads.',
    color: 'border-orange/30 bg-orange/5',
  },
  {
    id: 'ffn',
    name: 'Feed-Forward Network',
    icon: '🧮',
    description: 'Non-linear transformation',
    detail: 'After attention, each token passes through a feed-forward network (two linear layers with a non-linearity like SiLU). This adds model capacity and learns complex patterns.',
    color: 'border-pink/30 bg-pink/5',
  },
  {
    id: 'norm',
    name: 'Layer Normalization',
    icon: '⚖️',
    description: 'Stabilizes training',
    detail: 'RMSNorm normalizes the hidden states to prevent the values from exploding or vanishing as they pass through many layers. Applied before each attention and FFN block.',
    color: 'border-gold/30 bg-gold/5',
  },
  {
    id: 'output',
    name: 'Output Head',
    icon: '📤',
    description: 'Vectors → Probabilities',
    detail: 'The final hidden state is projected to vocabulary size (32K-128K tokens) via a linear layer. Softmax converts these logits into probabilities. The next token is sampled from this distribution.',
    color: 'border-purple/30 bg-purple/5',
  },
]

export default function LLMDiagramPage() {
  const [activeLayer, setActiveLayer] = useState('attention')

  const active = layers.find((l) => l.id === activeLayer)

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-text-primary mb-2">LLM Architecture Diagram</h1>
        <p className="text-text-secondary">Interactive walkthrough of how a Large Language Model processes text.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Diagram flow */}
        <div className="lg:col-span-3">
          <Card padding="md">
            <h2 className="text-sm font-semibold text-text-muted mb-4 flex items-center gap-2"><Layers size={16} /> Data Flow</h2>
            <div className="space-y-2">
              {layers.map((layer, i) => (
                <div key={layer.id}>
                  <button
                    onClick={() => setActiveLayer(layer.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer hover:translate-x-1 ${
                      activeLayer === layer.id
                        ? `${layer.color} ring-2 ring-accent`
                        : 'border-border-subtle bg-surface-raised hover:bg-border-subtle/20'
                    }`}
                  >
                    <span className="text-xl">{layer.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{layer.name}</p>
                      <p className="text-xs text-text-secondary">{layer.description}</p>
                    </div>
                    {activeLayer === layer.id && <Zap size={14} className="text-accent shrink-0" />}
                  </button>
                  {i < layers.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowRight size={14} className="text-text-muted rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {active && (
            <div key={active.id} className="animate-fade-in">
              <Card padding="lg" className="sticky top-20">
                <span className="text-3xl mb-3 block">{active.icon}</span>
                <h3 className="text-lg font-bold text-text-primary mb-2">{active.name}</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">{active.detail}</p>

                {active.id === 'attention' && (
                  <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-xs font-medium text-accent mb-1">💡 Key Formula</p>
                    <p className="text-sm font-mono text-text-primary">Attention(Q,K,V) = softmax(QK<sup>T</sup>/√d<sub>k</sub>)V</p>
                  </div>
                )}

                {active.id === 'embedding' && (
                  <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-xs font-medium text-accent mb-1">💡 Analogy</p>
                    <p className="text-sm text-text-secondary">Think of embeddings as GPS coordinates for words. &ldquo;King&rdquo; and &ldquo;Queen&rdquo; are nearby; &ldquo;King&rdquo; and &ldquo;Banana&rdquo; are far apart.</p>
                  </div>
                )}

                {active.id === 'output' && (
                  <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-xs font-medium text-accent mb-1">💡 Temperature Effect</p>
                    <p className="text-sm text-text-secondary">Low temperature → sharp distribution (picks the most likely token). High temperature → flat distribution (more randomness).</p>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
