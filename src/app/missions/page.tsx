'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Swords, Lock, Star, Clock, ChevronRight } from 'lucide-react'

const missions = [
  {
    id: 'tourist-guide',
    title: 'The AI Tourist Guide',
    description: 'Build a complete travel itinerary generator using prompt chains.',
    difficulty: 'Medium',
    xp: 500,
    steps: 5,
    unlocked: true,
  },
  {
    id: 'content-machine',
    title: 'The Content Machine',
    description: 'Create a blog post pipeline: outline → draft → edit → format.',
    difficulty: 'Medium',
    xp: 600,
    steps: 6,
    unlocked: true,
  },
  {
    id: 'code-reviewer',
    title: 'AI Code Reviewer',
    description: 'Build an AI system that reviews code for bugs and best practices.',
    difficulty: 'Hard',
    xp: 800,
    steps: 7,
    unlocked: true,
  },
  {
    id: 'debate-champion',
    title: 'Debate Champion',
    description: 'Create two AI agents that debate a topic from opposing sides.',
    difficulty: 'Hard',
    xp: 900,
    steps: 8,
    unlocked: true,
  },
  {
    id: 'data-analyst',
    title: 'AI Data Analyst',
    description: 'Build an intelligent data analysis pipeline with AI summaries.',
    difficulty: 'Expert',
    xp: 1000,
    steps: 10,
    unlocked: true,
  },
]

export default function MissionsPage() {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">🎯 Missions</h1>
        <p className="text-text-secondary text-sm">Complete missions to prove your skills!</p>
      </div>

      <div className="space-y-4">
        {missions.map((mission, idx) => (
          <div
            key={mission.id}
          >
            <Card
              padding="md"
              className={`${!mission.unlocked ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  mission.unlocked ? 'bg-accent/10' : 'bg-surface-raised'
                }`}>
                  {mission.unlocked ? (
                    <Swords size={24} className="text-accent" />
                  ) : (
                    <Lock size={24} className="text-text-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-text-primary">{mission.title}</h3>
                  <p className="text-sm text-text-secondary mt-0.5">{mission.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><Star size={12} className="text-gold" />{mission.xp} XP</span>
                    <span>{mission.steps} steps</span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      mission.difficulty === 'Medium' ? 'bg-gold/10 text-gold' :
                      mission.difficulty === 'Hard' ? 'bg-orange/10 text-orange' :
                      'bg-red/10 text-red'
                    }`}>{mission.difficulty}</span>
                  </div>
                </div>
                <Link href={`/missions/${mission.id}`}>
                  <Button
                    variant={mission.unlocked ? 'primary' : 'secondary'}
                    size="sm"
                    disabled={!mission.unlocked}
                    icon={mission.unlocked ? <ChevronRight size={16} /> : <Lock size={14} />}
                  >
                    {mission.unlocked ? 'Start' : 'Locked'}
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
