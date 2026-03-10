'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Card from '@/components/ui/Card'
import { useProgressStore } from '@/stores/progress-store'
import ClientOnly from '@/components/ui/ClientOnly'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface GraphNode {
  id: string
  label: string
  x: number
  y: number
  module: string
  color: string
  completed: boolean
}

interface GraphEdge {
  from: string
  to: string
}

const NODE_RADIUS = 28
const COLORS: Record<string, string> = {
  foundations: '#a78bfa',
  'prompt-engineering': '#34d399',
  'tools-ecosystem': '#60a5fa',
  'building-with-apis': '#38bdf8',
  ethics: '#fb923c',
  'real-world-projects': '#f472b6',
  'image-video-audio': '#e879f9',
  'agents-automation': '#22d3ee',
}

const nodes: Omit<GraphNode, 'completed'>[] = [
  // Foundations (center-top)
  { id: 'what-is-ai', label: 'What is AI?', x: 400, y: 60, module: 'foundations', color: COLORS.foundations },
  { id: 'tokens', label: 'Tokens', x: 280, y: 140, module: 'foundations', color: COLORS.foundations },
  { id: 'capabilities', label: 'Capabilities', x: 520, y: 140, module: 'foundations', color: COLORS.foundations },
  // Prompt Engineering
  { id: 'first-prompt', label: 'First Prompt', x: 150, y: 240, module: 'prompt-engineering', color: COLORS['prompt-engineering'] },
  { id: 'few-shot', label: 'Few-Shot', x: 280, y: 280, module: 'prompt-engineering', color: COLORS['prompt-engineering'] },
  { id: 'cot', label: 'Chain of Thought', x: 150, y: 360, module: 'prompt-engineering', color: COLORS['prompt-engineering'] },
  // Tools Ecosystem
  { id: 'tools-overview', label: 'AI Tools', x: 520, y: 240, module: 'tools-ecosystem', color: COLORS['tools-ecosystem'] },
  { id: 'specialized', label: 'Specialized', x: 650, y: 280, module: 'tools-ecosystem', color: COLORS['tools-ecosystem'] },
  { id: 'choosing', label: 'Choosing Tools', x: 650, y: 380, module: 'tools-ecosystem', color: COLORS['tools-ecosystem'] },
  // Building with APIs
  { id: 'api-basics', label: 'API Basics', x: 400, y: 350, module: 'building-with-apis', color: COLORS['building-with-apis'] },
  { id: 'ai-apis', label: 'AI APIs', x: 400, y: 440, module: 'building-with-apis', color: COLORS['building-with-apis'] },
  { id: 'building-apps', label: 'Building Apps', x: 280, y: 480, module: 'building-with-apis', color: COLORS['building-with-apis'] },
  { id: 'deployment', label: 'Deployment', x: 520, y: 480, module: 'building-with-apis', color: COLORS['building-with-apis'] },
  // Ethics
  { id: 'hallucinations', label: 'Hallucinations', x: 120, y: 480, module: 'ethics', color: COLORS.ethics },
  { id: 'bias', label: 'Bias', x: 50, y: 560, module: 'ethics', color: COLORS.ethics },
  { id: 'responsible', label: 'Responsible AI', x: 170, y: 580, module: 'ethics', color: COLORS.ethics },
  // Real-World Projects
  { id: 'content-gen', label: 'Content Gen', x: 400, y: 560, module: 'real-world-projects', color: COLORS['real-world-projects'] },
  { id: 'assistant', label: 'Assistants', x: 300, y: 620, module: 'real-world-projects', color: COLORS['real-world-projects'] },
  { id: 'data-pipeline', label: 'Pipelines', x: 500, y: 620, module: 'real-world-projects', color: COLORS['real-world-projects'] },
  // Image/Video/Audio
  { id: 'image-gen', label: 'Image Gen', x: 650, y: 480, module: 'image-video-audio', color: COLORS['image-video-audio'] },
  { id: 'video-audio', label: 'Video & Audio', x: 720, y: 560, module: 'image-video-audio', color: COLORS['image-video-audio'] },
  { id: 'multimodal', label: 'Multimodal', x: 620, y: 600, module: 'image-video-audio', color: COLORS['image-video-audio'] },
  // Agents
  { id: 'agents', label: 'AI Agents', x: 400, y: 700, module: 'agents-automation', color: COLORS['agents-automation'] },
  { id: 'multi-agent', label: 'Multi-Agent', x: 300, y: 760, module: 'agents-automation', color: COLORS['agents-automation'] },
  { id: 'automation', label: 'Automation', x: 500, y: 760, module: 'agents-automation', color: COLORS['agents-automation'] },
]

const edges: GraphEdge[] = [
  { from: 'what-is-ai', to: 'tokens' }, { from: 'what-is-ai', to: 'capabilities' },
  { from: 'tokens', to: 'first-prompt' }, { from: 'capabilities', to: 'tools-overview' },
  { from: 'first-prompt', to: 'few-shot' }, { from: 'few-shot', to: 'cot' },
  { from: 'tools-overview', to: 'specialized' }, { from: 'specialized', to: 'choosing' },
  { from: 'cot', to: 'api-basics' }, { from: 'choosing', to: 'api-basics' },
  { from: 'api-basics', to: 'ai-apis' }, { from: 'ai-apis', to: 'building-apps' },
  { from: 'ai-apis', to: 'deployment' },
  { from: 'cot', to: 'hallucinations' }, { from: 'hallucinations', to: 'bias' },
  { from: 'bias', to: 'responsible' },
  { from: 'building-apps', to: 'content-gen' }, { from: 'deployment', to: 'content-gen' },
  { from: 'content-gen', to: 'assistant' }, { from: 'content-gen', to: 'data-pipeline' },
  { from: 'deployment', to: 'image-gen' }, { from: 'image-gen', to: 'video-audio' },
  { from: 'video-audio', to: 'multimodal' },
  { from: 'assistant', to: 'agents' }, { from: 'data-pipeline', to: 'agents' },
  { from: 'multimodal', to: 'agents' },
  { from: 'agents', to: 'multi-agent' }, { from: 'agents', to: 'automation' },
]

export default function KnowledgeGraphPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="text-text-muted hover:text-text-primary"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Knowledge Graph</h1>
          <p className="text-text-secondary text-sm">See how all concepts connect. Completed topics glow.</p>
        </div>
      </div>
      <ClientOnly fallback={<div className="h-[600px] bg-surface rounded-xl" />}>
        <GraphView />
      </ClientOnly>
    </div>
  )
}

function GraphView() {
  const moduleProgress = useProgressStore((s) => s.moduleProgress)
  const [hovered, setHovered] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const svgRef = useRef<SVGSVGElement>(null)

  const completedLessons = new Set<string>()
  Object.values(moduleProgress).forEach(mod => {
    mod.completedLessons?.forEach(l => completedLessons.add(l))
  })

  const graphNodes: GraphNode[] = nodes.map(n => ({
    ...n,
    x: n.x + offset.x,
    y: n.y + offset.y,
    completed: completedLessons.has(n.id),
  }))

  const nodeMap = Object.fromEntries(graphNodes.map(n => [n.id, n]))

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true)
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    setOffset(prev => ({
      x: prev.x + e.clientX - lastPos.current.x,
      y: prev.y + e.clientY - lastPos.current.y,
    }))
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [dragging])

  const handleMouseUp = useCallback(() => setDragging(false), [])

  useEffect(() => {
    const handleGlobalUp = () => setDragging(false)
    window.addEventListener('mouseup', handleGlobalUp)
    return () => window.removeEventListener('mouseup', handleGlobalUp)
  }, [])

  return (
    <Card padding="none" className="overflow-hidden">
      <svg
        ref={svgRef}
        viewBox="0 0 800 820"
        className="w-full h-auto max-h-[70vh] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <defs>
          {Object.entries(COLORS).map(([key, color]) => (
            <filter key={key} id={`glow-${key}`}>
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor={color} floodOpacity="0.6" />
              <feComposite in2="blur" operator="in" />
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
        </defs>

        {/* Edges */}
        {edges.map(({ from, to }) => {
          const a = nodeMap[from]
          const b = nodeMap[to]
          if (!a || !b) return null
          const bothDone = a.completed && b.completed
          return (
            <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={bothDone ? a.color : '#555'} strokeWidth={bothDone ? 2 : 1}
              strokeOpacity={bothDone ? 0.8 : 0.3} />
          )
        })}

        {/* Nodes */}
        {graphNodes.map(node => (
          <g key={node.id}
            onMouseEnter={() => setHovered(node.id)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer"
          >
            <circle cx={node.x} cy={node.y} r={NODE_RADIUS}
              fill={node.completed ? node.color : '#2a2a3e'}
              stroke={node.color} strokeWidth={2}
              opacity={hovered === node.id ? 1 : 0.85}
              filter={node.completed ? `url(#glow-${node.module})` : undefined}
            />
            <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize="8" fill={node.completed ? '#fff' : '#aaa'}
              fontWeight={600}
            >
              {node.label}
            </text>
            {node.completed && (
              <text x={node.x} y={node.y - NODE_RADIUS - 6} textAnchor="middle" fontSize="10">✅</text>
            )}
          </g>
        ))}

        {/* Tooltip */}
        {hovered && nodeMap[hovered] && (
          <g>
            <rect x={nodeMap[hovered].x - 60} y={nodeMap[hovered].y + NODE_RADIUS + 8}
              width={120} height={24} rx={6}
              fill="#1a1a2e" stroke={nodeMap[hovered].color} strokeWidth={1} />
            <text x={nodeMap[hovered].x} y={nodeMap[hovered].y + NODE_RADIUS + 24}
              textAnchor="middle" fontSize="9" fill="#ccc">
              {nodeMap[hovered].completed ? 'Completed ✓' : 'Not started'}
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 p-4 border-t border-border-subtle">
        {Object.entries(COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-text-muted capitalize">{key.replace(/-/g, ' ')}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
