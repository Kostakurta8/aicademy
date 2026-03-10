'use client'

import { useState, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ConfettiBurst, ScreenFlash, XPPopup } from '@/components/ui/GameEffects'
import { Cpu, RotateCcw, Check, X, Zap, Plus, Minus, ArrowDown, Layers, Sparkles } from 'lucide-react'
import { useXPStore } from '@/stores/xp-store'

interface Layer {
  id: string
  name: string
  shortName: string
  color: string
  description: string
  icon: string
}

interface Architecture {
  id: string
  name: string
  subtitle: string
  description: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  layers: Layer[]
  correctOrder: string[]
}

const allLayers: Record<string, Layer> = {
  input_embed: { id: 'input_embed', name: 'Input Embedding', shortName: 'Embed', color: 'from-blue to-cyan-500', description: 'Converts input tokens into dense vector representations', icon: '📥' },
  pos_encode: { id: 'pos_encode', name: 'Positional Encoding', shortName: 'PosEnc', color: 'from-cyan-500 to-teal-500', description: 'Adds position information so the model knows token order', icon: '📍' },
  multi_attn: { id: 'multi_attn', name: 'Multi-Head Attention', shortName: 'MHA', color: 'from-violet-500 to-purple', description: 'Allows each token to attend to all other tokens in parallel heads', icon: '👁️' },
  masked_attn: { id: 'masked_attn', name: 'Masked Self-Attention', shortName: 'Masked', color: 'from-purple to-pink', description: 'Attention that only looks at previous tokens (causal/autoregressive)', icon: '🎭' },
  cross_attn: { id: 'cross_attn', name: 'Cross-Attention', shortName: 'Cross', color: 'from-pink to-rose-500', description: 'Decoder attends to encoder output — bridges encoder and decoder', icon: '🔗' },
  add_norm1: { id: 'add_norm1', name: 'Add & Normalize', shortName: 'A&N', color: 'from-emerald-500 to-green', description: 'Residual connection + layer normalization for training stability', icon: '⚖️' },
  ffn: { id: 'ffn', name: 'Feed-Forward Network', shortName: 'FFN', color: 'from-amber-500 to-orange-500', description: 'Two linear transformations with activation — processes each position independently', icon: '🔀' },
  add_norm2: { id: 'add_norm2', name: 'Add & Normalize', shortName: 'A&N', color: 'from-emerald-500 to-green', description: 'Second residual connection + normalization after FFN', icon: '⚖️' },
  linear: { id: 'linear', name: 'Linear Projection', shortName: 'Linear', color: 'from-red to-rose-500', description: 'Projects hidden states to vocabulary size for token prediction', icon: '📊' },
  softmax: { id: 'softmax', name: 'Softmax Output', shortName: 'Softmax', color: 'from-rose-500 to-red', description: 'Converts logits into probability distribution over vocabulary', icon: '🎯' },
}

const architectures: Architecture[] = [
  {
    id: 'simple-ffn',
    name: 'Simple Feed-Forward',
    subtitle: 'The basics of neural networks',
    description: 'Build a simple 4-layer network: embed tokens, add position info, process through FFN, and output predictions.',
    difficulty: 'Easy',
    layers: [allLayers.input_embed, allLayers.pos_encode, allLayers.ffn, allLayers.softmax],
    correctOrder: ['input_embed', 'pos_encode', 'ffn', 'softmax'],
  },
  {
    id: 'encoder',
    name: 'Encoder (BERT-style)',
    subtitle: 'Bidirectional understanding',
    description: 'Build an encoder block: embed, encode position, apply multi-head self-attention with residual connections, then feed-forward.',
    difficulty: 'Medium',
    layers: [allLayers.input_embed, allLayers.pos_encode, allLayers.multi_attn, allLayers.add_norm1, allLayers.ffn, allLayers.add_norm2],
    correctOrder: ['input_embed', 'pos_encode', 'multi_attn', 'add_norm1', 'ffn', 'add_norm2'],
  },
  {
    id: 'decoder',
    name: 'Decoder (GPT-style)',
    subtitle: 'Autoregressive generation',
    description: 'Build a decoder block: embed, position encode, masked attention (causal), normalize, FFN, normalize, then project to output.',
    difficulty: 'Medium',
    layers: [allLayers.input_embed, allLayers.pos_encode, allLayers.masked_attn, allLayers.add_norm1, allLayers.ffn, allLayers.add_norm2, allLayers.linear, allLayers.softmax],
    correctOrder: ['input_embed', 'pos_encode', 'masked_attn', 'add_norm1', 'ffn', 'add_norm2', 'linear', 'softmax'],
  },
  {
    id: 'full-transformer',
    name: 'Full Transformer',
    subtitle: 'Encoder-Decoder architecture',
    description: 'Build the complete original Transformer: encoder path with multi-head attention, then decoder with masked attention, cross-attention to encoder, and output projection.',
    difficulty: 'Hard',
    layers: [
      allLayers.input_embed, allLayers.pos_encode, allLayers.multi_attn, allLayers.add_norm1,
      allLayers.ffn, allLayers.add_norm2, allLayers.masked_attn,
      allLayers.cross_attn, allLayers.linear, allLayers.softmax,
    ],
    correctOrder: ['input_embed', 'pos_encode', 'multi_attn', 'add_norm1', 'ffn', 'add_norm2', 'masked_attn', 'cross_attn', 'linear', 'softmax'],
  },
]

const difficultyColors = {
  Easy: 'text-green bg-green/10',
  Medium: 'text-yellow bg-yellow/10',
  Hard: 'text-red bg-red/10',
}

function getFlowDotClass(isFlowing: boolean, isCorrectPos: boolean) {
  if (!isFlowing) return 'bg-surface-raised'
  return isCorrectPos ? 'bg-green' : 'bg-red'
}

export default function NeuralNetworkBuilderPage() {
  const [phase, setPhase] = useState<'select' | 'building' | 'result'>('select')
  const [selectedArch, setSelectedArch] = useState<Architecture | null>(null)
  const [availableLayers, setAvailableLayers] = useState<Layer[]>([])
  const [builtLayers, setBuiltLayers] = useState<Layer[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [flashColor, setFlashColor] = useState<'green' | 'red' | 'gold'>('green')
  const [showXP, setShowXP] = useState(false)
  const [flowStep, setFlowStep] = useState(-1)
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null)
  const [xpEarned, setXpEarned] = useState(0)
  const addXP = useXPStore((s) => s.addXP)

  const startBuild = useCallback((arch: Architecture) => {
    setSelectedArch(arch)
    // Shuffle available layers
    const shuffled = [...arch.layers].sort(() => Math.random() - 0.5)
    setAvailableLayers(shuffled)
    setBuiltLayers([])
    setFlowStep(-1)
    setPhase('building')
  }, [])

  const addLayer = (layer: Layer) => {
    setBuiltLayers(prev => [...prev, layer])
    setAvailableLayers(prev => {
      const idx = prev.findIndex(l => l.id === layer.id)
      const next = [...prev]
      next.splice(idx, 1)
      return next
    })
  }

  const removeLayer = (idx: number) => {
    const removed = builtLayers[idx]
    setBuiltLayers(prev => prev.filter((_, i) => i !== idx))
    setAvailableLayers(prev => [...prev, removed])
  }

  const submitBuild = useCallback(() => {
    if (!selectedArch) return
    const correct = selectedArch.correctOrder
    const built = builtLayers.map(l => l.id)

    let correctCount = 0
    built.forEach((id, i) => {
      if (id === correct[i]) correctCount++
    })

    const isPerfect = correctCount === correct.length && built.length === correct.length
    const score = Math.round((correctCount / correct.length) * 100)
    let diffBonus = 0
    if (selectedArch.difficulty === 'Hard') diffBonus = 100
    else if (selectedArch.difficulty === 'Medium') diffBonus = 50
    const xp = Math.round(score * 1.5) + (isPerfect ? 100 : 0) + diffBonus
    setXpEarned(xp)
    addXP(xp)

    if (isPerfect) {
      setFlashColor('gold')
      setShowConfetti(true)
    } else if (score >= 60) {
      setFlashColor('green')
    } else {
      setFlashColor('red')
    }
    setShowFlash(true)
    setShowXP(true)
    setTimeout(() => setShowFlash(false), 500)
    setTimeout(() => { setShowConfetti(false); setShowXP(false) }, 4000)

    // Animate data flow
    setPhase('result')
    let step = 0
    const interval = setInterval(() => {
      setFlowStep(step)
      step++
      if (step > correct.length) clearInterval(interval)
    }, 300)
  }, [selectedArch, builtLayers, addXP])

  // ============ SELECT ARCHITECTURE ============
  if (phase === 'select') {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="animate-celebrate-pop">
          <Card padding="lg" className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue flex items-center justify-center shadow-xl shadow-cyan-500/20 relative">
              <Cpu size={40} className="text-white" />
              <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-cyan-400/30 animate-[spin_8s_linear_infinite]" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Neural Network Builder</h1>
            <p className="text-text-secondary mb-2">Assemble neural network architectures layer by layer. Choose your challenge!</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {architectures.map((arch, i) => (
            <div key={arch.id} style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }} className="animate-fade-in">
              <Card padding="md" hover className="cursor-pointer h-full" onClick={() => startBuild(arch)}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-text-primary">{arch.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${difficultyColors[arch.difficulty]}`}>{arch.difficulty}</span>
                </div>
                <p className="text-xs text-accent mb-2">{arch.subtitle}</p>
                <p className="text-xs text-text-secondary mb-3">{arch.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Layers size={12} className="text-text-muted" />
                    <span className="text-[10px] text-text-muted">{arch.layers.length} layers</span>
                  </div>
                  <span className="text-[10px] text-gold font-bold">
                    {arch.difficulty === 'Hard' ? '250+' : (arch.difficulty === 'Medium' ? '200+' : '150+')} XP
                  </span>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!selectedArch) return null

  // ============ RESULT ============
  if (phase === 'result') {
    const correct = selectedArch.correctOrder
    const built = builtLayers.map(l => l.id)
    let correctCount = 0
    built.forEach((id, i) => { if (id === correct[i]) correctCount++ })
    const isPerfect = correctCount === correct.length && built.length === correct.length
    const score = built.length === 0 ? 0 : Math.round((correctCount / correct.length) * 100)

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ConfettiBurst trigger={showConfetti} color="gold" />
        <ScreenFlash trigger={showFlash} color={flashColor} />
        <XPPopup amount={xpEarned} show={showXP} />

        <div className="animate-fade-in">
          <Card padding="lg" glow={isPerfect} className="text-center mb-6">
            <div className="animate-celebrate-pop">
              {isPerfect ? <Sparkles size={48} className="text-gold mx-auto mb-3" /> : <Cpu size={48} className="text-accent mx-auto mb-3" />}
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-1">{isPerfect ? 'Perfect Architecture!' : 'Build Submitted!'}</h2>
            <p className="text-sm text-text-secondary mb-1">{selectedArch.name}</p>

            <div className="grid grid-cols-3 gap-3 my-6">
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-green">{correctCount}/{correct.length}</p>
                <p className="text-[10px] text-text-muted">Correct</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-accent">{score}%</p>
                <p className="text-[10px] text-text-muted">Accuracy</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-raised">
                <p className="text-xl font-bold text-gold">+{xpEarned}</p>
                <p className="text-[10px] text-text-muted">XP</p>
              </div>
            </div>
          </Card>

          {/* Data Flow Visualization */}
          <p className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wide">Correct Architecture — Data Flow</p>
          <div className="space-y-1 mb-6">
            {correct.map((layerId, i) => {
              const layer = allLayers[layerId]
              const userPlaced = built[i]
              const isCorrectPos = userPlaced === layerId
              const isFlowing = flowStep >= i

              return (
                <div key={`${layerId}-${i}`}
                  style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both', opacity: isFlowing ? 1 : 0.3, transition: 'opacity 0.3s ease-out' }}
                  className="animate-fade-in flex items-center gap-3"
                >
                  {/* Flow connector */}
                  <div className="flex flex-col items-center w-8 shrink-0">
                    <div
                      style={{ transition: 'transform 0.4s, background-color 0.4s' }}
                      className={`w-3 h-3 rounded-full ${getFlowDotClass(isFlowing, isCorrectPos)}`}
                    />
                    {i < correct.length - 1 && (
                      <div
                        style={{ opacity: isFlowing && flowStep > i ? 1 : 0.2, transition: 'opacity 0.3s' }}
                        className="w-0.5 h-6 bg-accent/30"
                      />
                    )}
                  </div>

                  {/* Layer card */}
                  <div className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                    isFlowing
                      ? (isCorrectPos ? 'border-green bg-green/5' : 'border-red bg-red/5')
                      : 'border-border-subtle bg-surface'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{layer.icon}</span>
                        <span className="text-sm font-semibold text-text-primary">{layer.name}</span>
                      </div>
                      {isFlowing && (isCorrectPos ? <Check size={14} className="text-green" /> : <X size={14} className="text-red" />)}
                    </div>
                    <p className="text-xs text-text-muted mt-1">{layer.description}</p>
                    {isFlowing && !isCorrectPos && userPlaced && (
                      <p className="text-[10px] text-red mt-1">You placed: {allLayers[userPlaced]?.name ?? 'nothing'}</p>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Data flow arrow at bottom */}
            {flowStep >= correct.length && (
              <div className="animate-fade-in text-center pt-2">
                <span className="text-xs text-accent font-bold">⚡ Output: Next token prediction</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={() => startBuild(selectedArch)} variant="secondary" className="flex-1">
              <RotateCcw size={14} className="mr-1" /> Retry
            </Button>
            <Button onClick={() => setPhase('select')} className="flex-1">
              <Layers size={14} className="mr-1" /> All Architectures
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ============ BUILDING ============
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Cpu className="text-cyan-500" size={22} /> {selectedArch.name}
            </h1>
            <p className="text-xs text-text-muted">{selectedArch.subtitle}</p>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${difficultyColors[selectedArch.difficulty]}`}>
            {selectedArch.difficulty}
          </span>
        </div>
        <p className="text-xs text-text-secondary">{selectedArch.description}</p>
      </div>

      {/* Built Stack */}
      <Card padding="md" className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wide">Your Build ({builtLayers.length}/{selectedArch.layers.length})</p>
          {builtLayers.length > 0 && (
            <button onClick={() => { setAvailableLayers(prev => [...prev, ...builtLayers]); setBuiltLayers([]) }}
              className="text-[10px] text-red cursor-pointer hover:underline">Clear All</button>
          )}
        </div>

        {builtLayers.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border-subtle rounded-xl">
            <ArrowDown size={20} className="text-text-muted mx-auto mb-2" />
            <p className="text-xs text-text-muted">Click layers below to add them here</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {builtLayers.map((layer, idx) => (
                <div
                  key={`${layer.id}-${idx}`}
                  className="animate-fade-in flex items-center gap-2 transition-all duration-300"
                >
                  {/* Connection line */}
                  <div className="flex flex-col items-center w-6 shrink-0">
                    <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${layer.color}`} />
                    {idx < builtLayers.length - 1 && <div className="w-0.5 h-4 bg-accent/20" />}
                  </div>

                  <div className={`flex-1 flex items-center gap-2 p-2.5 rounded-lg bg-surface-raised border border-white/10`}>
                    <span className="text-sm shrink-0">{layer.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{layer.name}</p>
                    </div>
                    <button onClick={() => removeLayer(idx)}
                      title="Remove layer"
                      aria-label={`Remove ${layer.name}`}
                      className="p-1 rounded hover:bg-red/10 text-text-muted hover:text-red transition-colors cursor-pointer shrink-0">
                      <Minus size={12} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Available Layers */}
      <p className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wide">Available Layers</p>
      {availableLayers.length === 0 ? (
        <div className="text-center py-4 mb-4">
          <Check size={20} className="text-green mx-auto mb-1" />
          <p className="text-xs text-text-muted">All layers placed!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 mb-4">
          {availableLayers.map((layer, idx) => (
            <button
              key={`avail-${layer.id}-${idx}`}
              onClick={() => addLayer(layer)}
              onMouseEnter={() => setHoveredLayer(layer.id)}
              onMouseLeave={() => setHoveredLayer(null)}
              className="flex items-center gap-3 p-3 rounded-xl border-2 border-border-subtle bg-surface hover:border-accent/30 text-left transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${layer.color} flex items-center justify-center text-sm shrink-0`}>
                {layer.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{layer.name}</p>
                {hoveredLayer === layer.id && (
                    <p className="animate-fade-in text-xs text-text-muted overflow-hidden">{layer.description}</p>
                  )}
              </div>
              <Plus size={16} className="text-accent shrink-0" />
            </button>
          ))}
        </div>
      )}

      <Button onClick={submitBuild} size="lg" className="w-full"
        disabled={builtLayers.length !== selectedArch.layers.length}>
        <Zap size={18} className="mr-2" />
        {builtLayers.length === selectedArch.layers.length ? 'Submit Architecture' : `Place ${selectedArch.layers.length - builtLayers.length} more layer${selectedArch.layers.length - builtLayers.length === 1 ? '' : 's'}`}
      </Button>
    </div>
  )
}
