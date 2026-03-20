'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Terminal, Users, Webhook, Database, GitBranch } from 'lucide-react'

const labs = [
  {
    slug: 'terminal',
    title: 'AI CLI Simulator',
    description: 'Terminal-style interface to practice curl commands and API calls.',
    icon: Terminal,
    color: 'from-green to-emerald-600',
  },
  {
    slug: 'multi-agent',
    title: 'Agent Orchestration',
    description: 'Build and test multi-agent systems with visual orchestration tools.',
    icon: Users,
    color: 'from-purple to-violet-600',
  },
  {
    slug: 'webhooks',
    title: 'Webhook Builder',
    description: 'Design AI-powered automation workflows with webhook triggers.',
    icon: Webhook,
    color: 'from-blue to-indigo-600',
  },
  {
    slug: 'vector-db',
    title: 'Vector DB Lab',
    description: 'Explore vector databases, embeddings, and similarity search.',
    icon: Database,
    color: 'from-cyan to-teal-600',
  },
  {
    slug: 'rag-builder',
    title: 'RAG Pipeline Builder',
    description: 'Visual builder for Retrieval-Augmented Generation pipelines.',
    icon: GitBranch,
    color: 'from-orange to-amber-600',
  },
]

export default function LabsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">🧪 Dev Labs</h1>
        <p className="text-sm text-text-secondary">Build cool stuff with AI!</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {labs.map((lab, idx) => (
          <div key={lab.slug}>
            <Card className="h-full" padding="md">
              <div className="flex flex-col h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${lab.color} flex items-center justify-center mb-4`}>
                  <lab.icon size={24} className="text-white" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{lab.title}</h3>
                <p className="text-sm text-text-secondary mb-4 flex-1">{lab.description}</p>
                <Link href={`/labs/${lab.slug}`}>
                  <Button variant="primary" size="sm" className="w-full">Launch Lab</Button>
                </Link>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
