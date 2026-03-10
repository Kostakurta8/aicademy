import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { celebrate } from '@/lib/celebrate'
import { hapticCelebrate } from '@/lib/sounds'

// Daily reward XP by consecutive day (cycles after 7)
const DAILY_REWARDS = [10, 15, 20, 25, 30, 40, 50]

// Daily XP goal — clear target gives kids focus
const DAILY_XP_GOAL = 50

interface XPStore {
  totalXP: number
  level: number
  currentStreak: number
  longestStreak: number
  lastActivityDate: string
  streakFreezes: number
  streakFreezeEarned: number[]
  xpHistory: Array<{ date: string; xp: number }>
  streakHistory: string[]
  totalLearningTime: number
  lifetimeXPByModule: Record<string, number>
  weeklyXPHistory: Array<{ week: string; xp: number }>
  bestWeekXP: number
  comebackBonusAvailable: boolean
  lastDailyRewardDate: string
  dailyRewardStreak: number
  dailyXPEarned: number
  dailyXPDate: string
  dailyGoalCompleted: boolean

  addXP: (amount: number, moduleId?: string) => void
  checkStreak: () => void
  recordActivity: () => void
  useStreakFreeze: () => boolean
  addLearningTime: (minutes: number) => void
  canClaimDailyReward: () => boolean
  claimDailyReward: () => number
  getDailyRewardAmount: () => number
  getDailyXPProgress: () => { earned: number; goal: number; percent: number }
}

const XP_PER_LEVEL = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800,
  4700, 5700, 6800, 8000, 9300, 10700, 12200, 13800, 15500, 17300,
  19200, 21200, 23300, 25500, 27800, 30200, 32700, 35300, 38000, 40800,
]

function getLevelForXP(xp: number): number {
  for (let i = XP_PER_LEVEL.length - 1; i >= 0; i--) {
    if (xp >= XP_PER_LEVEL[i]) return i + 1
  }
  return 1
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export const useXPStore = create<XPStore>()(
  persist(
    (set, get) => ({
      totalXP: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: '',
      streakFreezes: 0,
      streakFreezeEarned: [],
      xpHistory: [],
      streakHistory: [],
      totalLearningTime: 0,
      lifetimeXPByModule: {},
      weeklyXPHistory: [],
      bestWeekXP: 0,
      comebackBonusAvailable: false,
      lastDailyRewardDate: '',
      dailyRewardStreak: 0,
      dailyXPEarned: 0,
      dailyXPDate: '',
      dailyGoalCompleted: false,

      addXP: (amount, moduleId) => {
        const oldLevel = get().level
        set((s) => {
          const newXP = s.totalXP + amount
          const newLevel = getLevelForXP(newXP)
          const today = getToday()
          const existingEntry = s.xpHistory.find((e) => e.date === today)
          const xpHistory = existingEntry
            ? s.xpHistory.map((e) => (e.date === today ? { ...e, xp: e.xp + amount } : e))
            : [...s.xpHistory.slice(-89), { date: today, xp: amount }]
          const lifetimeXPByModule = moduleId
            ? { ...s.lifetimeXPByModule, [moduleId]: (s.lifetimeXPByModule[moduleId] || 0) + amount }
            : s.lifetimeXPByModule

          // Daily goal tracking
          const dailyXPDate = s.dailyXPDate === today ? s.dailyXPDate : today
          const dailyXPEarned = s.dailyXPDate === today ? s.dailyXPEarned + amount : amount
          const dailyGoalCompleted = dailyXPEarned >= DAILY_XP_GOAL

          return { totalXP: newXP, level: newLevel, xpHistory, lifetimeXPByModule, dailyXPEarned, dailyXPDate, dailyGoalCompleted }
        })
        const newLevel = get().level
        if (newLevel > oldLevel) {
          hapticCelebrate()
          celebrate({ type: 'level-up', title: `Level ${newLevel}!`, subtitle: 'You reached a new level!', value: `Level ${newLevel}` })
        }
        // Celebrate daily goal completion
        const state = get()
        if (state.dailyGoalCompleted && state.dailyXPEarned - amount < DAILY_XP_GOAL) {
          hapticCelebrate()
          celebrate({ type: 'achievement', title: 'Daily Goal! 🎯', subtitle: `You earned ${DAILY_XP_GOAL} XP today!`, value: '🏆 Goal Complete' })
        }
      },

      checkStreak: () => {
        const { lastActivityDate, currentStreak } = get()
        const today = getToday()
        if (lastActivityDate === today) return
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        if (lastActivityDate === yesterdayStr) return
        const lastDate = new Date(lastActivityDate)
        const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86400000)
        if (daysSince >= 3) {
          set({ comebackBonusAvailable: true })
        }
        if (daysSince > 1 && currentStreak > 0) {
          const { streakFreezes } = get()
          if (streakFreezes > 0) {
            set((s) => ({ streakFreezes: s.streakFreezes - 1 }))
          } else {
            set({ currentStreak: 0 })
          }
        }
      },

      recordActivity: () => {
        const { lastActivityDate, currentStreak, longestStreak, streakHistory } = get()
        const today = getToday()
        if (lastActivityDate === today) return
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        const newStreak = lastActivityDate === yesterdayStr ? currentStreak + 1 : 1
        const newLongest = Math.max(newStreak, longestStreak)
        let newFreezes = get().streakFreezes
        const earned = get().streakFreezeEarned
        if (newStreak === 7 && !earned.includes(7)) {
          newFreezes = Math.min(newFreezes + 1, 3)
          earned.push(7)
          celebrate({ type: 'streak', title: '7 Day Streak!', subtitle: 'Streak freeze earned!', value: '🔥 7 days' })
          hapticCelebrate()
        }
        if (newStreak === 30 && !earned.includes(30)) {
          newFreezes = Math.min(newFreezes + 1, 3)
          earned.push(30)
          celebrate({ type: 'streak', title: '30 Day Streak!', subtitle: 'Another streak freeze earned!', value: '🔥 30 days' })
          hapticCelebrate()
        }
        if (newStreak === 90 && !earned.includes(90)) {
          newFreezes = Math.min(newFreezes + 1, 3)
          earned.push(90)
          celebrate({ type: 'streak', title: '90 Day Streak!', subtitle: 'Ultimate streak freeze earned!', value: '🔥 90 days' })
          hapticCelebrate()
        }
        set({
          lastActivityDate: today,
          currentStreak: newStreak,
          longestStreak: newLongest,
          streakHistory: [...streakHistory.slice(-365), today],
          streakFreezes: newFreezes,
          streakFreezeEarned: earned,
        })
      },

      useStreakFreeze: () => {
        const { streakFreezes } = get()
        if (streakFreezes <= 0) return false
        set((s) => ({ streakFreezes: s.streakFreezes - 1 }))
        return true
      },

      canClaimDailyReward: () => {
        return get().lastDailyRewardDate !== getToday()
      },

      getDailyRewardAmount: () => {
        const { dailyRewardStreak } = get()
        return DAILY_REWARDS[dailyRewardStreak % DAILY_REWARDS.length]
      },

      claimDailyReward: () => {
        const state = get()
        const today = getToday()
        if (state.lastDailyRewardDate === today) return 0

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        const newRewardStreak = state.lastDailyRewardDate === yesterdayStr
          ? state.dailyRewardStreak + 1
          : 0
        const reward = DAILY_REWARDS[newRewardStreak % DAILY_REWARDS.length]

        set({ lastDailyRewardDate: today, dailyRewardStreak: newRewardStreak })
        get().addXP(reward)
        hapticCelebrate()
        celebrate({ type: 'achievement', title: 'Daily Reward!', subtitle: `Day ${newRewardStreak + 1} streak`, value: `+${reward} XP` })
        return reward
      },

      addLearningTime: (minutes) => {
        set((s) => ({ totalLearningTime: s.totalLearningTime + minutes }))
      },

      getDailyXPProgress: () => {
        const { dailyXPEarned, dailyXPDate } = get()
        const today = getToday()
        const earned = dailyXPDate === today ? dailyXPEarned : 0
        return { earned, goal: DAILY_XP_GOAL, percent: Math.min((earned / DAILY_XP_GOAL) * 100, 100) }
      },
    }),
    { name: 'aicademy-xp', skipHydration: true }
  )
)

export { XP_PER_LEVEL, getLevelForXP, DAILY_REWARDS, DAILY_XP_GOAL }
