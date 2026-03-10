'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Search, BarChart3, UserCheck, ShieldAlert, Newspaper } from 'lucide-react'

const ethicsTools = [
  {
    slug: 'hallucination-detector',
    title: 'Hallucination Detector',
    description: 'Test AI outputs for factual accuracy. Learn to spot and prevent hallucinations.',
    icon: Search,
    color: 'from-orange to-red',
  },
  {
    slug: 'bias-analyzer',
    title: 'Bias & Fairness Analyzer',
    description: 'Analyze AI outputs for demographic bias and unfair patterns.',
    icon: BarChart3,
    color: 'from-purple to-violet-600',
  },
  {
    slug: 'ai-vs-human',
    title: 'AI vs Human Quiz',
    description: 'Can you tell which text was written by AI? Test your detection skills.',
    icon: UserCheck,
    color: 'from-blue to-indigo-600',
  },
  {
    slug: 'red-team',
    title: 'Red-Teaming Lab',
    description: 'Learn educational red-teaming techniques to test AI safety boundaries.',
    icon: ShieldAlert,
    color: 'from-red to-rose-600',
  },
  {
    slug: 'news-detector',
    title: 'AI News Detector',
    description: 'Practice distinguishing real news from AI-generated articles.',
    icon: Newspaper,
    color: 'from-green to-emerald-600',
  },
]

export default function EthicsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Ethics & Safety Tools</h1>
        <p className="text-text-secondary">Interactive tools to understand AI risks, biases, and responsible use.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ethicsTools.map((tool, idx) => (
          <div key={tool.slug}>
            <Card className="h-full" padding="md">
              <div className="flex flex-col h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
                  <tool.icon size={24} className="text-white" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{tool.title}</h3>
                <p className="text-sm text-text-secondary mb-4 flex-1">{tool.description}</p>
                <Link href={`/ethics/${tool.slug}`}>
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
