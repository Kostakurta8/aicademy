// Lightweight celebration event bus — keeps store ↔ component decoupled
// CelebrationOverlay registers itself; xp-store triggers without importing the full overlay

export type CelebrationType = 'level-up' | 'streak' | 'lesson-complete' | 'module-complete' | 'achievement'

export interface CelebrationData {
  type: CelebrationType
  title: string
  subtitle: string
  value?: string | number
}

let triggerFn: ((data: CelebrationData) => void) | null = null

export function celebrate(data: CelebrationData) {
  triggerFn?.(data)
}

export function registerCelebrationTrigger(fn: (data: CelebrationData) => void) {
  triggerFn = fn
}

export function unregisterCelebrationTrigger() {
  triggerFn = null
}
