'use client'

import { useState, useEffect, useRef } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Play, Pause, RotateCcw, Zap } from 'lucide-react'

const sampleTexts = [
  { label: 'Simple', text: 'The cat sat on the mat.' },
  { label: 'Complex', text: 'Artificial intelligence has transformed the way we interact with technology, enabling machines to learn from experience and perform human-like tasks.' },
  { label: 'Code', text: 'function fibonacci(n) { return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2); }' },
]

// Simplified tokenizer that splits like a BPE tokenizer would
function tokenize(text: string): string[] {
  // Rough BPE approximation: split on spaces, punctuation, and common subword boundaries
  const tokens: string[] = []
  const pattern = /(\s+|[.,!?;:'"()\[\]{}]|[A-Z][a-z]+|[a-z]+|[0-9]+|\S)/g
  let match
  while ((match = pattern.exec(text)) !== null) {
    tokens.push(match[0])
  }
  return tokens
}

const tokenColors = [
  'bg-purple/20 text-purple border-purple/30',
  'bg-blue/20 text-blue border-blue/30',
  'bg-green/20 text-green border-green/30',
  'bg-orange/20 text-orange border-orange/30',
  'bg-pink/20 text-pink border-pink/30',
  'bg-cyan/20 text-cyan border-cyan/30',
  'bg-gold/20 text-gold border-gold/30',
]

export default function TokenVisualizerPage() {
  const [inputText, setInputText] = useState(sampleTexts[0].text)
  const [tokens, setTokens] = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(300)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    queueMicrotask(() => {
      setTokens(tokenize(inputText))
      setCurrentIdx(-1)
      setIsPlaying(false)
    })
  }, [inputText])

  useEffect(() => {
    if (isPlaying && currentIdx < tokens.length - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIdx((i) => {
          if (i >= tokens.length - 1) {
            setIsPlaying(false)
            return i
          }
          return i + 1
        })
      }, speed)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, tokens.length, speed, currentIdx])

  const handlePlay = () => {
    if (currentIdx >= tokens.length - 1) setCurrentIdx(-1)
    setIsPlaying(true)
  }

  const handleReset = () => {
    setCurrentIdx(-1)
    setIsPlaying(false)
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Token Visualizer</h1>
        <p className="text-text-secondary">Watch how text gets split into tokens — the building blocks of AI understanding.</p>
      </div>

      {/* Sample selector */}
      <div className="flex gap-2 mb-4">
        {sampleTexts.map((s) => (
          <button
            key={s.label}
            onClick={() => setInputText(s.text)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
              inputText === s.text ? 'bg-accent text-white' : 'bg-surface-raised text-text-secondary hover:bg-border-subtle/30'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <Card padding="md" className="mb-6">
        <label className="text-sm font-medium text-text-secondary block mb-2">Input Text</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full h-24 p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none outline-none focus:ring-2 focus:ring-accent"
        />
      </Card>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6">
        <Button onClick={isPlaying ? () => setIsPlaying(false) : handlePlay} icon={isPlaying ? <Pause size={16} /> : <Play size={16} />}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button variant="ghost" onClick={handleReset} icon={<RotateCcw size={16} />}>Reset</Button>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-text-muted">Speed:</label>
          <input type="range" min="50" max="800" step="50" value={800 - speed} onChange={(e) => setSpeed(800 - parseInt(e.target.value))} className="w-24 accent-accent" />
        </div>
      </div>

      {/* Token visualization */}
      <Card padding="lg" className="mb-6">
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Zap size={16} className="text-accent" /> Tokenized Output
        </h2>
        <div className="flex flex-wrap gap-1.5 min-h-[80px]">
          {tokens.map((token, i) => (
            <span
              key={`${i}-${token}`}
              style={{
                opacity: i <= currentIdx || currentIdx === -1 ? 1 : 0.3,
                transform: i === currentIdx ? 'scale(1.1)' : 'scale(1)',
              }}
              className={`
                inline-flex items-center px-2 py-1 rounded-md text-sm font-mono border
                ${tokenColors[i % tokenColors.length]}
                ${i === currentIdx ? 'ring-2 ring-accent shadow-lg' : ''}
                transition-all duration-150
              `}
            >
              {token === ' ' ? '▪' : token}
            </span>
          ))}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-accent">{tokens.length}</p>
          <p className="text-xs text-text-muted">Total Tokens</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-text-primary">{inputText.length}</p>
          <p className="text-xs text-text-muted">Characters</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-text-primary">{tokens.length > 0 ? (inputText.length / tokens.length).toFixed(1) : '0'}</p>
          <p className="text-xs text-text-muted">Chars/Token</p>
        </Card>
      </div>
    </div>
  )
}
