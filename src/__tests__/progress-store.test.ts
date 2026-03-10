import { describe, it, expect, beforeEach } from 'vitest'
import { useProgressStore } from '@/stores/progress-store'

describe('progress-store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useProgressStore.setState({
      moduleProgress: {},
      lessonProgress: {},
      completedMissions: [],
      completedChallenges: [],
      completedWeeklyChallenges: [],
      skillProfile: {},
      activityLog: {
        lessonsCompleted: [],
        promptsSent: [],
        flashcardsReviewed: [],
        perfectQuizzes: [],
      },
    })
  })

  describe('startModule', () => {
    it('initializes new module progress', () => {
      useProgressStore.getState().startModule('foundations')
      const mod = useProgressStore.getState().moduleProgress['foundations']
      expect(mod).toBeDefined()
      expect(mod.started).toBe(true)
      expect(mod.completedLessons).toEqual([])
    })

    it('does not overwrite existing module progress', () => {
      useProgressStore.getState().startModule('foundations')
      useProgressStore.getState().completeLesson('foundations', 'lesson-1')
      useProgressStore.getState().startModule('foundations')
      const mod = useProgressStore.getState().moduleProgress['foundations']
      expect(mod.completedLessons).toEqual(['lesson-1'])
    })
  })

  describe('completeLesson', () => {
    it('adds lesson to completedLessons', () => {
      useProgressStore.getState().completeLesson('prompting', 'intro')
      const mod = useProgressStore.getState().moduleProgress['prompting']
      expect(mod.completedLessons).toContain('intro')
    })

    it('does not add duplicate lessons', () => {
      useProgressStore.getState().completeLesson('prompting', 'intro')
      useProgressStore.getState().completeLesson('prompting', 'intro')
      const mod = useProgressStore.getState().moduleProgress['prompting']
      expect(mod.completedLessons).toEqual(['intro'])
    })
  })

  describe('completeMission', () => {
    it('adds mission to completedMissions', () => {
      useProgressStore.getState().completeMission('tourist-guide')
      expect(useProgressStore.getState().completedMissions).toContain('tourist-guide')
    })
  })

  describe('completeChallenge', () => {
    it('adds challenge to completedChallenges', () => {
      useProgressStore.getState().completeChallenge('prompt-dojo')
      expect(useProgressStore.getState().completedChallenges).toContain('prompt-dojo')
    })
  })

  describe('updateSkillProfile', () => {
    it('clamps score between 0 and 100', () => {
      useProgressStore.getState().updateSkillProfile('prompting', 150)
      expect(useProgressStore.getState().skillProfile['prompting']).toBe(100)

      useProgressStore.getState().updateSkillProfile('ethics', -20)
      expect(useProgressStore.getState().skillProfile['ethics']).toBe(0)
    })
  })

  describe('logActivity', () => {
    it('appends timestamps', () => {
      useProgressStore.getState().logActivity('lessonsCompleted')
      useProgressStore.getState().logActivity('lessonsCompleted')
      expect(useProgressStore.getState().activityLog.lessonsCompleted).toHaveLength(2)
    })

    it('prunes entries older than 30 days', () => {
      // Manually inject an old timestamp
      const oldTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000
      useProgressStore.setState({
        activityLog: {
          lessonsCompleted: [oldTimestamp],
          promptsSent: [],
          flashcardsReviewed: [],
          perfectQuizzes: [],
        },
      })
      useProgressStore.getState().logActivity('lessonsCompleted')
      const timestamps = useProgressStore.getState().activityLog.lessonsCompleted
      // Old timestamp should be pruned, only the new one remains
      expect(timestamps).toHaveLength(1)
      expect(timestamps[0]).toBeGreaterThan(oldTimestamp)
    })
  })

  describe('saveLessonStep', () => {
    it('saves step progress', () => {
      useProgressStore.getState().saveLessonStep('mod-1:lesson-1', 3, 5)
      const progress = useProgressStore.getState().lessonProgress['mod-1:lesson-1']
      expect(progress.currentStep).toBe(3)
      expect(progress.totalSteps).toBe(5)
      expect(progress.lastVisited).toBeGreaterThan(0)
    })
  })
})
