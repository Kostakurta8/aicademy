'use client'

import { useRouter } from 'next/navigation'
import { useProgressStore } from '@/stores/progress-store'
import { useWeeklyCount, WEEKLY_CHALLENGE_ACTIVITY } from '@/lib/weekly-progress'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Trophy, Clock, Star, Calendar, ChevronRight } from 'lucide-react'

function getDailyChallenge() {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const challenges = [
    { title: 'Fix the Broken Prompt', description: 'A chain-of-thought prompt is producing bad results. Find the issue and fix it.', xp: 100, type: 'fix-prompt' },
    { title: 'Token Budget Challenge', description: 'Rewrite this 500-token prompt to achieve the same result in under 200 tokens.', xp: 100, type: 'token-budget' },
    { title: 'Role-Play Master', description: 'Create a system prompt that makes the AI act as a Socratic teacher.', xp: 100, type: 'role-play' },
    { title: 'Output Format Expert', description: 'Get the AI to output a valid JSON object with exactly these fields.', xp: 100, type: 'format' },
    { title: 'Temperature Tamer', description: 'Find the optimal temperature for generating creative vs factual content.', xp: 100, type: 'temperature' },
    { title: 'Context Window Master', description: 'Fit as much useful context as possible within a 2000-token window.', xp: 150, type: 'context' },
    { title: 'Prompt Debugging', description: 'This prompt returns inconsistent results. Diagnose and fix the issue.', xp: 150, type: 'debug' },
  ]
  return challenges[seed % challenges.length]
}

function getWeeklyChallenge() {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  const weekNum = Math.floor(weekStart.getTime() / (7 * 24 * 60 * 60 * 1000))
  const challenges = [
    { title: 'Complete 2 Lessons', description: 'Finish any 2 lessons from any module.', xp: 300, goal: 2 },
    { title: 'Send 15 Prompts', description: 'Send 15 prompts in any sandbox tool.', xp: 250, goal: 15 },
    { title: 'Review 50 Flashcards', description: 'Review 50 flashcards using spaced repetition.', xp: 200, goal: 50 },
    { title: 'Perfect Quiz Score', description: 'Get 100% on any quiz.', xp: 400, goal: 1 },
  ]
  const idx = weekNum % challenges.length
  return { ...challenges[idx], activityIndex: idx }
}

const challengeRoutes: Record<string, string> = {
  'fix-prompt': '/sandbox/fix-the-prompt',
  'token-budget': '/sandbox/context-window',
  'role-play': '/sandbox/prompt-builder',
  'format': '/sandbox/prompt-builder',
  'temperature': '/sandbox/simulator',
  'context': '/sandbox/context-window',
  'debug': '/sandbox/fix-the-prompt',
}

export default function ChallengesPage() {
  const router = useRouter()
  const daily = getDailyChallenge()
  const weekly = getWeeklyChallenge()
  const completedChallenges = useProgressStore((s) => s.completedChallenges)
  const today = new Date()
  const dailyChallengeId = `daily-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  const dailyCompleted = completedChallenges.includes(dailyChallengeId)

  const activityType = WEEKLY_CHALLENGE_ACTIVITY[weekly.activityIndex]
  const weeklyProgress = useWeeklyCount(activityType)
  const weeklyPercent = Math.min((weeklyProgress / weekly.goal) * 100, 100)

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Challenges</h1>
        <p className="text-text-secondary">Daily and weekly challenges to keep your skills sharp.</p>
      </div>

      {/* Daily Challenge */}
      <div>
        <Card padding="lg" glow className="mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-orange flex items-center justify-center shrink-0">
              <Trophy size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gold">Daily Challenge</span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock size={12} />
                  Resets at midnight
                </span>
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">{daily.title}</h2>
              <p className="text-sm text-text-secondary mb-4">{daily.description}</p>
              <div className="flex items-center gap-4">
                <Button disabled={dailyCompleted} icon={dailyCompleted ? undefined : <ChevronRight size={16} />} onClick={() => router.push(challengeRoutes[daily.type] || '/sandbox')}>
                  {dailyCompleted ? '✓ Completed' : 'Start Challenge'}
                </Button>
                <span className="flex items-center gap-1 text-sm text-gold font-medium">
                  <Star size={14} />
                  {daily.xp} XP
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Weekly Challenge */}
      <div>
        <Card padding="lg" className="mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple to-blue flex items-center justify-center shrink-0">
              <Calendar size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-purple">Weekly Challenge</span>
                <span className="text-xs text-text-muted">Resets Monday</span>
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">{weekly.title}</h2>
              <p className="text-sm text-text-secondary mb-4">{weekly.description}</p>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-1 h-2 rounded-full bg-border-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple transition-all duration-500"
                    style={{ width: `${weeklyPercent}%` }}
                  />
                </div>
                <span className="text-sm text-text-muted">{Math.min(weeklyProgress, weekly.goal)}/{weekly.goal}</span>
              </div>
              <span className="flex items-center gap-1 text-sm text-purple font-medium">
                <Star size={14} />
                {weekly.xp} XP
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Past Challenges */}
      <h2 className="text-lg font-semibold text-text-primary mb-4">Past Challenges</h2>
      <Card padding="md">
        <p className="text-sm text-text-muted text-center py-8">
          Complete your first challenge to see your history here.
        </p>
      </Card>
    </div>
  )
}
