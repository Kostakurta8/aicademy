'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  Wand2,
  Link2,
  Scissors,
  GitCompare,
  Cpu,
  Eye,
  Library,
  Code2,
} from 'lucide-react'

const sandboxTools = [
  {
    slug: 'prompt-builder',
    title: 'Prompt Builder',
    description: 'Craft perfect prompts with a visual builder. Add role, context, format, and test live.',
    icon: Wand2,
    color: 'from-green to-emerald-600',
    status: 'available' as const,
  },
  {
    slug: 'prompt-chains',
    title: 'Prompt Chains',
    description: 'Build multi-step prompt workflows with a node-based canvas editor.',
    icon: Link2,
    color: 'from-blue to-indigo-600',
    status: 'available' as const,
  },
  {
    slug: 'fix-the-prompt',
    title: 'Fix the Prompt',
    description: 'Given a broken prompt and bad output — can you fix it?',
    icon: Scissors,
    color: 'from-orange to-red',
    status: 'available' as const,
  },
  {
    slug: 'compare',
    title: 'Model Compare',
    description: 'Send the same prompt to multiple models and compare outputs side-by-side.',
    icon: GitCompare,
    color: 'from-purple to-violet-600',
    status: 'available' as const,
  },
  {
    slug: 'simulator',
    title: 'AI Use-Case Simulator',
    description: 'Simulate real-world AI scenarios: customer support, content writing, coding.',
    icon: Cpu,
    color: 'from-cyan to-teal-600',
    status: 'available' as const,
  },
  {
    slug: 'context-window',
    title: 'Context Window Visualizer',
    description: 'See how many tokens your prompt uses. Visualize the context window filling up.',
    icon: Eye,
    color: 'from-gold to-amber-600',
    status: 'available' as const,
  },
  {
    slug: 'prompt-library',
    title: 'Prompt Library',
    description: 'Browse, save, and share curated prompts. Use template variables for reusability.',
    icon: Library,
    color: 'from-pink to-rose-600',
    status: 'available' as const,
  },
  {
    slug: 'playground',
    title: 'Code Playground',
    description: 'Write prompt-engineering code and execute it live against the AI API with real results.',
    icon: Code2,
    color: 'from-emerald-500 to-green',
    status: 'available' as const,
  },
]

export default function SandboxPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2">Sandbox</h1>
        <p className="text-text-secondary">Hands-on tools to practice and experiment with AI prompts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sandboxTools.map((tool, idx) => (
          <div
            key={tool.slug}
          >
            <Card className="h-full" padding="md">
              <div className="flex flex-col h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
                  <tool.icon size={24} className="text-white" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{tool.title}</h3>
                <p className="text-sm text-text-secondary mb-4 flex-1">{tool.description}</p>
                <Link href={`/sandbox/${tool.slug}`}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                  >
                    Launch
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
