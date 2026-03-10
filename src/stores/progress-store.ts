import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProgressStore {
  moduleProgress: Record<string, {
    started: boolean
    completedLessons: string[]
    quizScores: Record<string, number>
    unlocked: boolean
  }>
  lessonProgress: Record<string, {
    currentStep: number
    totalSteps: number
    layerCompleted: { read: boolean; apply: boolean; reinforce: boolean }
    lastVisited: number
  }>
  completedMissions: string[]
  completedChallenges: string[]
  completedWeeklyChallenges: string[]
  skillProfile: Record<string, number>

  startModule: (moduleId: string) => void
  completeLesson: (moduleId: string, lessonId: string) => void
  saveLessonStep: (lessonKey: string, step: number, totalSteps: number) => void
  updateSkillProfile: (topic: string, score: number) => void
  completeMission: (missionId: string) => void
  completeChallenge: (challengeId: string) => void
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set) => ({
      moduleProgress: {},
      lessonProgress: {},
      completedMissions: [],
      completedChallenges: [],
      completedWeeklyChallenges: [],
      skillProfile: {},

      startModule: (moduleId) => set((s) => ({
        moduleProgress: {
          ...s.moduleProgress,
          [moduleId]: s.moduleProgress[moduleId] || {
            started: true, completedLessons: [], quizScores: {}, unlocked: true,
          },
        },
      })),

      completeLesson: (moduleId, lessonId) => set((s) => {
        const mod = s.moduleProgress[moduleId] || {
          started: true, completedLessons: [], quizScores: {}, unlocked: true,
        }
        if (mod.completedLessons.includes(lessonId)) return s
        return {
          moduleProgress: {
            ...s.moduleProgress,
            [moduleId]: { ...mod, completedLessons: [...mod.completedLessons, lessonId] },
          },
        }
      }),

      saveLessonStep: (lessonKey, step, totalSteps) => set((s) => ({
        lessonProgress: {
          ...s.lessonProgress,
          [lessonKey]: {
            currentStep: step,
            totalSteps,
            layerCompleted: s.lessonProgress[lessonKey]?.layerCompleted || {
              read: false, apply: false, reinforce: false,
            },
            lastVisited: Date.now(),
          },
        },
      })),

      updateSkillProfile: (topic, score) => set((s) => ({
        skillProfile: { ...s.skillProfile, [topic]: Math.max(0, Math.min(100, score)) },
      })),

      completeMission: (missionId) => set((s) => ({
        completedMissions: [...s.completedMissions, missionId],
      })),

      completeChallenge: (challengeId) => set((s) => ({
        completedChallenges: [...s.completedChallenges, challengeId],
      })),
    }),
    { name: 'aicademy-progress', skipHydration: true }
  )
)
