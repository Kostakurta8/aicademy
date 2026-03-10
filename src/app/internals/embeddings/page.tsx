'use client'

import { useState, useMemo } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Search, ZoomIn } from 'lucide-react'

interface Word { text: string; x: number; y: number; cluster: number }

const clusters = [
  { label: 'Animals', color: '#7c3aed', words: ['dog', 'cat', 'horse', 'bird', 'fish', 'whale', 'tiger', 'lion', 'eagle'] },
  { label: 'Food', color: '#16a34a', words: ['apple', 'pizza', 'bread', 'rice', 'pasta', 'sushi', 'salad', 'cake', 'soup'] },
  { label: 'Technology', color: '#2563eb', words: ['computer', 'phone', 'internet', 'software', 'AI', 'robot', 'data', 'cloud', 'code'] },
  { label: 'Emotions', color: '#db2777', words: ['happy', 'sad', 'angry', 'love', 'fear', 'joy', 'hope', 'peace', 'calm'] },
  { label: 'Science', color: '#ea580c', words: ['atom', 'cell', 'gene', 'star', 'planet', 'gravity', 'energy', 'molecule', 'wave'] },
]

function generatePositions(): Word[] {
  const words: Word[] = []
  const rng = (seed: number) => {
    let s = seed
    return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647 }
  }

  clusters.forEach((cluster, ci) => {
    const centerX = 150 + (ci % 3) * 200
    const centerY = 120 + Math.floor(ci / 3) * 200
    const rand = rng(ci * 100 + 42)

    cluster.words.forEach((word) => {
      words.push({
        text: word,
        x: centerX + (rand() - 0.5) * 140,
        y: centerY + (rand() - 0.5) * 120,
        cluster: ci,
      })
    })
  })
  return words
}

export default function EmbeddingsExplorerPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const words = useMemo(() => generatePositions(), [])

  const highlighted = searchTerm
    ? words.filter((w) => w.text.toLowerCase().includes(searchTerm.toLowerCase()))
    : []

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Embedding Space Explorer</h1>
        <p className="text-text-secondary">Visualize how AI represents words as points in high-dimensional space. Similar words cluster together.</p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a word..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {clusters.map((c) => (
          <div key={c.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
            <span className="text-xs text-text-secondary">{c.label}</span>
          </div>
        ))}
      </div>

      {/* 2D Map */}
      <Card padding="md" className="mb-6">
        <div className="relative w-full h-[420px]">
          <svg width="100%" height="420" viewBox="0 0 700 420" className="overflow-visible">
            {/* Cluster boundaries */}
            {clusters.map((cluster, ci) => {
              const clusterWords = words.filter((w) => w.cluster === ci)
              const cx = clusterWords.reduce((a, w) => a + w.x, 0) / clusterWords.length
              const cy = clusterWords.reduce((a, w) => a + w.y, 0) / clusterWords.length
              return (
                <g key={ci}>
                  <circle cx={cx} cy={cy} r={80} fill={cluster.color} opacity={0.05} stroke={cluster.color} strokeOpacity={0.15} strokeWidth={1} strokeDasharray="4 4" />
                  <text x={cx} y={cy - 65} textAnchor="middle" fill={cluster.color} fontSize={10} fontWeight={600} opacity={0.5}>{cluster.label}</text>
                </g>
              )
            })}

            {/* Words */}
            {words.map((word) => {
              const isHighlighted = highlighted.some((h) => h.text === word.text)
              const isHovered = hoveredWord === word.text
              const color = clusters[word.cluster].color
              return (
                <g key={word.text}
                   onMouseEnter={() => setHoveredWord(word.text)}
                   onMouseLeave={() => setHoveredWord(null)}
                   className="cursor-pointer"
                >
                  <circle
                    cx={word.x} cy={word.y} r={isHovered ? 6 : 4}
                    fill={color}
                    opacity={searchTerm && !isHighlighted ? 0.15 : 0.8}
                  />
                  <text
                    x={word.x} y={word.y - 8}
                    textAnchor="middle"
                    fill={isHovered || isHighlighted ? color : 'currentColor'}
                    className="text-text-secondary"
                    fontSize={isHovered ? 12 : 10}
                    fontWeight={isHovered || isHighlighted ? 600 : 400}
                    opacity={searchTerm && !isHighlighted ? 0.2 : 0.8}
                  >
                    {word.text}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </Card>

      {/* Info */}
      <Card padding="md">
        <h3 className="text-base font-semibold text-text-primary mb-2 flex items-center gap-2"><ZoomIn size={16} className="text-accent" /> How Embeddings Work</h3>
        <p className="text-sm text-text-secondary leading-relaxed mb-3">
          In reality, word embeddings live in 768-4096 dimensional space — far too many dimensions to visualize directly.
          This 2D view is a simplified projection that shows the key insight: <strong className="text-text-primary">semantically similar words are close together</strong>.
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          Famous example: <code className="px-1 py-0.5 bg-surface-raised rounded text-xs">King - Man + Woman ≈ Queen</code>. 
          This works because embeddings encode relationships as geometric directions.
        </p>
      </Card>
    </div>
  )
}
