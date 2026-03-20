'use client'

import Card from '@/components/ui/Card'
import { useProgressStore } from '@/stores/progress-store'
import ClientOnly from '@/components/ui/ClientOnly'
import { ArrowLeft, CheckCircle, Lock, MapPin, Trophy } from 'lucide-react'
import Link from 'next/link'

const modules = [
  { slug: 'foundations', title: 'AI Foundations', icon: '🏗️', lessons: 3 },
  { slug: 'prompt-engineering', title: 'Prompt Engineering', icon: '✍️', lessons: 4 },
  { slug: 'tools-ecosystem', title: 'AI Tools Ecosystem', icon: '🧰', lessons: 3 },
  { slug: 'building-with-apis', title: 'Building with APIs', icon: '🔌', lessons: 4 },
  { slug: 'ethics', title: 'AI Ethics', icon: '⚖️', lessons: 3 },
  { slug: 'real-world-projects', title: 'Real-World Projects', icon: '🚀', lessons: 3 },
  { slug: 'image-video-audio', title: 'Image, Video & Audio', icon: '🎨', lessons: 3 },
  { slug: 'agents-automation', title: 'Agents & Automation', icon: '🤖', lessons: 3 },
]

export default function LearningPathPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard" className="text-text-muted hover:text-text-primary"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">🚩 Learning Path</h1>
          <p className="text-text-secondary text-sm">Follow the path, level up!</p>
        </div>
      </div>
      <ClientOnly fallback={<div className="space-y-8">{modules.map(m => <div key={m.slug} className="h-28 bg-surface rounded-xl" />)}</div>}>
        <PathView />
      </ClientOnly>
    </div>
  )
}

function PathView() {
  const moduleProgress = useProgressStore(s => s.moduleProgress)

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons, 0)
  const totalCompleted = modules.reduce((sum, m) => {
    return sum + (moduleProgress[m.slug]?.completedLessons?.length ?? 0)
  }, 0)
  const overallPct = Math.round((totalCompleted / totalLessons) * 100)
  const modulesCompleted = modules.filter((m, i) => {
    const done = moduleProgress[m.slug]?.completedLessons?.length ?? 0
    return done >= m.lessons
  }).length

  const getStatus = (slug: string, idx: number): 'completed' | 'current' | 'locked' => {
    const mod = moduleProgress[slug]
    const total = modules[idx].lessons
    const done = mod?.completedLessons?.length ?? 0
    if (done >= total) return 'completed'
    if (idx === 0) return 'current'
    const prevSlug = modules[idx - 1].slug
    const prevMod = moduleProgress[prevSlug]
    const prevTotal = modules[idx - 1].lessons
    const prevDone = prevMod?.completedLessons?.length ?? 0
    if (prevDone >= prevTotal) return 'current'
    return 'locked'
  }

  return (
    <div className="relative">
      {/* Overall Progress Summary */}
      <Card padding="sm" className="mb-6">
        <div className="flex items-center gap-4">
          {overallPct >= 100 ? (
            <Trophy size={20} className="text-gold shrink-0" />
          ) : (
            <MapPin size={20} className="text-accent shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-text-primary">
                {overallPct >= 100 ? 'All Modules Complete! 🎉' : `${totalCompleted}/${totalLessons} lessons completed`}
              </span>
              <span className="text-xs text-text-muted">{modulesCompleted}/{modules.length} modules</span>
            </div>
            <div className="w-full h-2 rounded-full bg-border-subtle overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${overallPct >= 100 ? 'bg-gold' : 'bg-accent'}`}
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Vertical line connector */}
      <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-border-subtle" />

      <div className="space-y-2">
        {modules.map((mod, i) => {
          const status = getStatus(mod.slug, i)
          const prog = moduleProgress[mod.slug]
          const done = prog?.completedLessons?.length ?? 0
          const pct = Math.round((done / mod.lessons) * 100)

          return (
            <div key={mod.slug}
            >
              <Link href={status === 'locked' ? '#' : `/modules/${mod.slug}`}
                className={status === 'locked' ? 'pointer-events-none' : ''}
              >
                <div className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${
                  status === 'current' ? 'bg-accent/10 border border-accent/30' :
                  status === 'completed' ? 'bg-surface-raised' : 'bg-surface opacity-60'
                }`}>
                  {/* Node dot */}
                  <div className={`relative z-10 flex items-center justify-center w-[22px] h-[22px] mt-1 rounded-full border-2 flex-shrink-0 ${
                    status === 'completed' ? 'bg-green-500 border-green-500' :
                    status === 'current' ? 'bg-accent border-accent animate-pulse' :
                    'bg-surface border-border-subtle'
                  }`}>
                    {status === 'completed' && <CheckCircle size={14} className="text-white" />}
                    {status === 'current' && <MapPin size={12} className="text-white" />}
                    {status === 'locked' && <Lock size={10} className="text-text-muted" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{mod.icon}</span>
                      <h3 className={`font-semibold ${status === 'locked' ? 'text-text-muted' : 'text-text-primary'}`}>
                        Module {i + 1}: {mod.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden max-w-[200px]">
                        <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-text-muted">{done}/{mod.lessons} lessons</span>
                    </div>
                  </div>

                  {status === 'current' && (
                    <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium mt-1">Current</span>
                  )}
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
