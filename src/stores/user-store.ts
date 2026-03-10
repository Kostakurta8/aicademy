import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserStore {
  // Metadata
  storeVersion: number
  createdAt: string

  // Profile
  name: string
  avatar: string

  // AI Config
  groqApiKey: string
  preferredModel: string
  modelOverrides: Record<string, string>
  autoDetectModel: boolean

  // Preferences
  reducedMotion: boolean
  soundEnabled: boolean
  soundVolume: number
  activeSound: string | null
  pomodoroWork: number
  pomodoroBreak: number
  celebrationAnimations: boolean

  // State
  onboardingComplete: boolean
  selectedTrack: string | null
  experienceLevel: 'newbie' | 'master' | null
  introLessonComplete: boolean

  // Backup
  lastBackupDate: string | null
  backupReminderDismissed: boolean

  // Actions
  setName: (name: string) => void
  setAvatar: (avatar: string) => void
  setGroqApiKey: (key: string) => void
  setPreferredModel: (model: string) => void
  setOnboardingComplete: (complete: boolean) => void
  setSelectedTrack: (track: string | null) => void
  setExperienceLevel: (level: 'newbie' | 'master') => void
  setIntroLessonComplete: (complete: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
  setSoundVolume: (volume: number) => void
  setReducedMotion: (reduced: boolean) => void
  setCelebrationAnimations: (enabled: boolean) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      storeVersion: 1,
      createdAt: new Date().toISOString(),

      name: '',
      avatar: 'default',

      groqApiKey: '',
      preferredModel: 'llama-3.1-8b-instant',
      modelOverrides: {},
      autoDetectModel: true,

      reducedMotion: false,
      soundEnabled: true,
      soundVolume: 0.5,
      activeSound: null,
      pomodoroWork: 25,
      pomodoroBreak: 5,
      celebrationAnimations: true,

      onboardingComplete: false,
      selectedTrack: null,
      experienceLevel: null,
      introLessonComplete: false,

      lastBackupDate: null,
      backupReminderDismissed: false,

      setName: (name) => set({ name }),
      setAvatar: (avatar) => set({ avatar }),
      setGroqApiKey: (key) => set({ groqApiKey: key }),
      setPreferredModel: (model) => set({ preferredModel: model }),
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
      setSelectedTrack: (track) => set({ selectedTrack: track }),
      setExperienceLevel: (level) => set({ experienceLevel: level }),
      setIntroLessonComplete: (complete) => set({ introLessonComplete: complete }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setSoundVolume: (volume) => set({ soundVolume: volume }),
      setReducedMotion: (reduced) => set({ reducedMotion: reduced }),
      setCelebrationAnimations: (enabled) => set({ celebrationAnimations: enabled }),
    }),
    {
      name: 'aicademy-user',
      skipHydration: true,
    }
  )
)
