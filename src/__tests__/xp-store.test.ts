import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useXPStore } from '@/stores/xp-store'

// Mock celebrate and hapticCelebrate to prevent side effects
vi.mock('@/lib/celebrate', () => ({ celebrate: vi.fn() }))
vi.mock('@/lib/sounds', () => ({ hapticCelebrate: vi.fn() }))

describe('xp-store', () => {
  beforeEach(() => {
    useXPStore.setState({
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
    })
  })

  describe('addXP', () => {
    it('increases totalXP', () => {
      useXPStore.getState().addXP(50)
      expect(useXPStore.getState().totalXP).toBe(50)
    })

    it('accumulates XP across multiple calls', () => {
      useXPStore.getState().addXP(30)
      useXPStore.getState().addXP(70)
      expect(useXPStore.getState().totalXP).toBe(100)
    })

    it('calculates level based on XP', () => {
      useXPStore.getState().addXP(100)
      expect(useXPStore.getState().level).toBe(2)
    })

    it('tracks XP by module when moduleId is provided', () => {
      useXPStore.getState().addXP(50, 'prompting')
      useXPStore.getState().addXP(30, 'prompting')
      expect(useXPStore.getState().lifetimeXPByModule['prompting']).toBe(80)
    })

    it('does not track module XP when moduleId is omitted', () => {
      useXPStore.getState().addXP(50)
      expect(Object.keys(useXPStore.getState().lifetimeXPByModule)).toHaveLength(0)
    })

    it('tracks daily XP progress', () => {
      useXPStore.getState().addXP(30)
      expect(useXPStore.getState().dailyXPEarned).toBe(30)
      expect(useXPStore.getState().dailyGoalCompleted).toBe(false)

      useXPStore.getState().addXP(20) // total 50 = daily goal
      expect(useXPStore.getState().dailyXPEarned).toBe(50)
      expect(useXPStore.getState().dailyGoalCompleted).toBe(true)
    })
  })

  describe('addLearningTime', () => {
    it('accumulates learning time', () => {
      useXPStore.getState().addLearningTime(15)
      useXPStore.getState().addLearningTime(30)
      expect(useXPStore.getState().totalLearningTime).toBe(45)
    })
  })

  describe('getDailyXPProgress', () => {
    it('returns correct progress values', () => {
      useXPStore.getState().addXP(25)
      const progress = useXPStore.getState().getDailyXPProgress()
      expect(progress.earned).toBe(25)
      expect(progress.goal).toBe(50)
      expect(progress.percent).toBe(50)
    })

    it('caps percent at 100', () => {
      useXPStore.getState().addXP(100)
      const progress = useXPStore.getState().getDailyXPProgress()
      expect(progress.percent).toBe(100)
    })
  })
})
