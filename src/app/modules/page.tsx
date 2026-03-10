'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import DifficultyBadge from '@/components/ui/DifficultyBadge'
import ClientOnly from '@/components/ui/ClientOnly'
import { useProgressStore } from '@/stores/progress-store'
import { Brain, Wand2, Wrench, Code2, Scale, Rocket, Image, Bot, CheckCircle, Play } from 'lucide-react'

const modules = [
  {
    slug: 'foundations',
    title: 'Foundations of AI',
    tagline: 'What is this thing, actually?',
    description: 'How LLMs work, tokens, context windows — interactive and visual.',
    icon: Brain,
    accent: 'purple',
    difficulty: 'beginner' as const,
    lessons: 3,
    estimatedHours: 3,
    xpReward: 800,
  },
  {
    slug: 'prompt-engineering',
    title: 'Prompt Engineering',
    tagline: 'Talk to AI like a pro',
    description: 'Master the art of crafting effective prompts for any task.',
    icon: Wand2,
    accent: 'green',
    difficulty: 'beginner' as const,
    lessons: 4,
    estimatedHours: 4,
    xpReward: 1000,
  },
  {
    slug: 'tools-ecosystem',
    title: 'AI Tools Ecosystem',
    tagline: 'Know your weapons',
    description: 'Navigate ChatGPT, Claude, Gemini, Midjourney and more.',
    icon: Wrench,
    accent: 'blue',
    difficulty: 'beginner' as const,
    lessons: 3,
    estimatedHours: 3,
    xpReward: 800,
  },
  {
    slug: 'building-with-apis',
    title: 'Building with APIs',
    tagline: 'Code meets AI',
    description: 'Connect AI to your apps with REST APIs and SDKs.',
    icon: Code2,
    accent: 'blue',
    difficulty: 'intermediate' as const,
    lessons: 4,
    estimatedHours: 5,
    xpReward: 1200,
  },
  {
    slug: 'ethics',
    title: 'Ethics & Critical Thinking',
    tagline: 'Use AI responsibly',
    description: 'Bias, hallucinations, deepfakes, and responsible AI use.',
    icon: Scale,
    accent: 'orange',
    difficulty: 'beginner' as const,
    lessons: 3,
    estimatedHours: 3,
    xpReward: 800,
  },
  {
    slug: 'real-world-projects',
    title: 'Real-World Projects',
    tagline: 'Build something real',
    description: 'Apply everything in hands-on guided projects.',
    icon: Rocket,
    accent: 'pink',
    difficulty: 'intermediate' as const,
    lessons: 3,
    estimatedHours: 5,
    xpReward: 1200,
  },
  {
    slug: 'image-video-audio',
    title: 'Image, Video & Audio',
    tagline: 'AI gets creative',
    description: 'Generate images, edit video, create music with AI.',
    icon: Image,
    accent: 'pink',
    difficulty: 'beginner' as const,
    lessons: 3,
    estimatedHours: 3,
    xpReward: 800,
  },
  {
    slug: 'agents-automation',
    title: 'Agents & Automation',
    tagline: 'AI that acts',
    description: 'Build autonomous agents and automated workflows.',
    icon: Bot,
    accent: 'cyan',
    difficulty: 'advanced' as const,
    lessons: 3,
    estimatedHours: 5,
    xpReward: 1200,
  },
]

const difficultyMap = {
  beginner: 'easy' as const,
  intermediate: 'medium' as const,
  advanced: 'hard' as const,
}

const accentColors: Record<string, string> = {
  purple: 'from-purple to-purple/60',
  green: 'from-green to-green/60',
  blue: 'from-blue to-blue/60',
  orange: 'from-orange to-orange/60',
  pink: 'from-pink to-pink/60',
  cyan: 'from-cyan to-cyan/60',
}

export default function ModulesPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-text-primary mb-2">Learning Modules</h1>
        <p className="text-text-secondary">8 modules covering everything from AI basics to building autonomous agents.</p>
      </div>

      <ClientOnly fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {modules.map(mod => (
            <div key={mod.slug} className="h-56 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      }>
        <ModulesGrid />
      </ClientOnly>
    </div>
  )
}

function ModulesGrid() {
  const moduleProgress = useProgressStore((s) => s.moduleProgress)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {modules.map((mod, idx) => {
        const progress = moduleProgress[mod.slug]
        const completedCount = progress?.completedLessons?.length ?? 0
        const isComplete = completedCount >= mod.lessons
        const isStarted = completedCount > 0
        const pct = Math.round((completedCount / mod.lessons) * 100)

        return (
          <div
            key={mod.slug}
          >
            <Link href={`/modules/${mod.slug}`}>
              <Card className={`h-full group ${isComplete ? 'ring-2 ring-green/40' : ''}`} padding="md">
                <div className="flex flex-col h-full">
                  {/* Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accentColors[mod.accent]} flex items-center justify-center`}>
                      <mod.icon size={24} className="text-white" />
                    </div>
                    {isComplete && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green/10 border border-green/20">
                        <CheckCircle size={14} className="text-green" />
                        <span className="text-[10px] font-bold text-green">Done</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <h3 className="text-base font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-accent font-medium mb-2">{mod.tagline}</p>
                  <p className="text-sm text-text-secondary mb-4 flex-1">{mod.description}</p>

                  {/* Meta */}
                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span>{completedCount}/{mod.lessons} lessons</span>
                      <span>~{mod.estimatedHours}h</span>
                    </div>
                    <DifficultyBadge difficulty={difficultyMap[mod.difficulty]} />
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 w-full h-1.5 rounded-full bg-border-subtle overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green' : 'bg-accent'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* CTA hint */}
                  {!isComplete && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={12} />
                      {isStarted ? 'Continue' : 'Start Module'}
                    </div>
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
