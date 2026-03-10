import { useProgressStore } from '@/stores/progress-store'

/** Get the start-of-week timestamp (Sunday 00:00:00) */
function getWeekStart(): number {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  d.setDate(d.getDate() - d.getDay())
  return d.getTime()
}

type ActivityType = 'lessonsCompleted' | 'promptsSent' | 'flashcardsReviewed' | 'perfectQuizzes'

/** Returns the count of activities this week for a given type */
export function useWeeklyCount(type: ActivityType): number {
  const timestamps = useProgressStore((s) => s.activityLog[type])
  const weekStart = getWeekStart()
  return timestamps.filter((t) => t >= weekStart).length
}

/** Maps weekly challenge index to the activity type it tracks */
export const WEEKLY_CHALLENGE_ACTIVITY: ActivityType[] = [
  'lessonsCompleted',
  'promptsSent',
  'flashcardsReviewed',
  'perfectQuizzes',
]
