'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Type, Network, Box, SlidersHorizontal, GitBranch } from 'lucide-react'

const tools = [
  {
    slug: 'token-viewer',
    title: 'Token Visualizer',
    description: 'See how text gets broken into tokens. Visualize generation token-by-token.',
    icon: Type,
    color: 'from-cyan to-teal-600',
  },
  {
    slug: 'llm-diagram',
    title: 'LLM Architecture Diagram',
    description: 'Interactive diagram of transformer architecture — attention, FFN, embeddings.',
    icon: Network,
    color: 'from-purple to-violet-600',
  },
  {
    slug: 'embeddings',
    title: '3D Embedding Explorer',
    description: 'Visualize word embeddings in 3D space. See how meaning maps to geometry.',
    icon: Box,
    color: 'from-blue to-indigo-600',
  },
  {
    slug: 'fine-tuning',
    title: 'Fine-Tuning Simulator',
    description: 'Understand fine-tuning by adjusting parameters and seeing effects.',
    icon: SlidersHorizontal,
    color: 'from-green to-emerald-600',
  },
  {
    slug: 'rag-pipeline',
    title: 'RAG Pipeline',
    description: 'Build and visualize a Retrieval-Augmented Generation pipeline step by step.',
    icon: GitBranch,
    color: 'from-orange to-amber-600',
  },
]

export default function InternalsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">🔬 AI Internals</h1>
        <p className="text-sm text-text-secondary">See how AI works inside!</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map((tool, idx) => (
          <div key={tool.slug}>
            <Card className="h-full" padding="md">
              <div className="flex flex-col h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
                  <tool.icon size={24} className="text-white" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{tool.title}</h3>
                <p className="text-sm text-text-secondary mb-4 flex-1">{tool.description}</p>
                <Link href={`/internals/${tool.slug}`}>
                  <Button variant="primary" size="sm" className="w-full">Explore</Button>
                </Link>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
