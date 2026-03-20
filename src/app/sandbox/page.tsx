'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ClientOnly from '@/components/ui/ClientOnly'
import {
  FREE_SANDBOXES,
  useSubscriptionStore,
} from '@/stores/subscription-store'
import {
  Wand2,
  Link2,
  Scissors,
  GitCompare,
  Cpu,
  Eye,
  Library,
  Code2,
  Crown,
  Lock,
} from 'lucide-react'

const sandboxTools = [
  {
    slug: 'prompt-builder',
    title: 'Prompt Builder',
    description: 'Build prompts visually!',
    icon: Wand2,
    color: 'from-green to-emerald-600',
  },
  {
    slug: 'prompt-chains',
    title: 'Prompt Chains',
    description: 'Chain prompts together!',
    icon: Link2,
    color: 'from-blue to-indigo-600',
  },
  {
    slug: 'fix-the-prompt',
    title: 'Fix the Prompt',
    description: 'Fix the broken prompt!',
    icon: Scissors,
    color: 'from-orange to-red',
  },
  {
    slug: 'compare',
    title: 'Model Compare',
    description: 'Compare AI models!',
    icon: GitCompare,
    color: 'from-purple to-violet-600',
  },
  {
    slug: 'simulator',
    title: 'AI Simulator',
    description: 'Try real AI scenarios!',
    icon: Cpu,
    color: 'from-cyan to-teal-600',
  },
  {
    slug: 'context-window',
    title: 'Context Visualizer',
    description: 'See your token usage!',
    icon: Eye,
    color: 'from-gold to-amber-600',
  },
  {
    slug: 'prompt-library',
    title: 'Prompt Library',
    description: 'Browse & save prompts!',
    icon: Library,
    color: 'from-pink to-rose-600',
  },
  {
    slug: 'playground',
    title: 'Code Playground',
    description: 'Run AI code live!',
    icon: Code2,
    color: 'from-emerald-500 to-green',
  },
]

export default function SandboxPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">🧪 Sandbox</h1>
        <p className="text-sm text-text-secondary">Experiment with AI tools!</p>
      </div>

      <ClientOnly fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sandboxTools.map((tool) => (
            <div key={tool.slug} className="h-40 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      }>
        <SandboxGrid />
      </ClientOnly>
    </div>
  )
}

function SandboxGrid() {
  const canAccessSandbox = useSubscriptionStore((s) => s.canAccessSandbox)
  const isPro = useSubscriptionStore((s) => s.isPro())

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {sandboxTools.map((tool) => {
        const isFree = FREE_SANDBOXES.includes(tool.slug)
        const locked = !canAccessSandbox(tool.slug)

        return (
          <div key={tool.slug}>
            <Link href={locked ? '/pricing' : `/sandbox/${tool.slug}`}>
              <Card className={`h-full group relative overflow-hidden ${locked ? 'opacity-80 hover:opacity-100' : ''}`} padding="md">
                {locked && (
                  <div className="absolute inset-0 bg-surface/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-purple/10 flex items-center justify-center mb-1.5">
                      <Lock size={18} className="text-purple" />
                    </div>
                    <p className="text-xs font-semibold text-text-primary">Pro Tool</p>
                    <p className="text-[10px] text-text-muted flex items-center gap-1">
                      <Crown size={10} className="text-purple" /> Unlock with Pro
                    </p>
                  </div>
                )}
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center`}>
                      <tool.icon size={24} className="text-white" />
                    </div>
                    {isFree && !isPro && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green/10 text-green font-medium border border-green/20">
                        FREE
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mb-2">{tool.title}</h3>
                  <p className="text-sm text-text-secondary mb-4 flex-1">{tool.description}</p>
                  {!locked && (
                    <Button variant="primary" size="sm" className="w-full">
                      Launch
                    </Button>
                  )}
                </div>
              </Card>
            </Link>
          </div>
        )
      })}
    </div>
  )
}
