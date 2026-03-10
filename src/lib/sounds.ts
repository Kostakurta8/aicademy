let ctx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof globalThis.window === 'undefined') return null
  if (!ctx) {
    try {
      const AC = globalThis.AudioContext || (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
    } catch { return null }
  }
  return ctx
}

function beep(freq: number, duration: number, vol = 0.15) {
  const ac = getAudioContext()
  if (!ac) return
  if (ac.state === 'suspended') ac.resume()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.frequency.value = freq
  gain.gain.value = vol
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + duration)
}

export function playXPDing() {
  beep(880, 0.15)
  setTimeout(() => beep(1100, 0.12), 100)
}

export function playLevelUp() {
  beep(523, 0.1)
  setTimeout(() => beep(659, 0.1), 100)
  setTimeout(() => beep(784, 0.1), 200)
  setTimeout(() => beep(1047, 0.2), 300)
}

export function playCorrect() {
  beep(660, 0.12)
  setTimeout(() => beep(880, 0.15), 80)
}

export function playIncorrect() {
  beep(300, 0.2, 0.1)
  setTimeout(() => beep(250, 0.25, 0.1), 150)
}

/** Trigger haptic feedback on supported devices */
export function haptic(pattern: number | number[] = 10) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern) } catch {}
  }
}

/** Short tap haptic */
export function hapticTap() { haptic(8) }

/** Medium press haptic */
export function hapticMedium() { haptic(15) }

/** Success haptic pattern */
export function hapticSuccess() { haptic([10, 50, 20]) }

/** Level-up / celebration haptic */
export function hapticCelebrate() { haptic([15, 30, 15, 30, 40]) }
