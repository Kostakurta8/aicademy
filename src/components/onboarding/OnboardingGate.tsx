'use client'

import { useState, useEffect } from 'react'
import { useUserStore } from '@/stores/user-store'
import OnboardingWizard from './OnboardingWizard'
import IntroLesson from './IntroLesson'

const SESSION_KEY = 'aicademy-intro-shown'

export default function OnboardingGate() {
  const onboardingComplete = useUserStore((s) => s.onboardingComplete)
  const introLessonComplete = useUserStore((s) => s.introLessonComplete)
  const [sessionIntroShown, setSessionIntroShown] = useState(true) // default true to avoid flash

  useEffect(() => {
    // Check if intro was already shown in this browser session
    const shown = sessionStorage.getItem(SESSION_KEY)
    if (!shown) setSessionIntroShown(false)
  }, [])

  // First-time users: show the full onboarding wizard
  if (!onboardingComplete) return <OnboardingWizard />

  // Returning users: show the intro lesson once per browser session
  if (!introLessonComplete || !sessionIntroShown) {
    return (
      <IntroLesson
        onComplete={() => {
          sessionStorage.setItem(SESSION_KEY, '1')
          setSessionIntroShown(true)
        }}
      />
    )
  }

  return null
}
