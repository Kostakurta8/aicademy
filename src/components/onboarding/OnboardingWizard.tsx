'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useUserStore } from '@/stores/user-store'
import { useXPStore } from '@/stores/xp-store'
import { playXPDing, playLevelUp } from '@/lib/sounds'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  Wrench,
  User,
  Palette,
  Check,
  Rocket,
  Brain,
  Zap,
  BookOpen,
  Gamepad2,
} from 'lucide-react'

const avatars = [
  { id: 'explorer', emoji: '🧭', label: 'Explorer' },
  { id: 'scientist', emoji: '🔬', label: 'Scientist' },
  { id: 'artist', emoji: '🎨', label: 'Artist' },
  { id: 'ninja', emoji: '🥷', label: 'Ninja' },
  { id: 'astronaut', emoji: '🚀', label: 'Astronaut' },
  { id: 'wizard', emoji: '🧙', label: 'Wizard' },
  { id: 'robot', emoji: '🤖', label: 'Robot' },
  { id: 'phoenix', emoji: '🦅', label: 'Phoenix' },
]

const tracks = [
  {
    id: 'student',
    title: 'Student',
    description: 'I\'m learning about AI for the first time. Start from the basics.',
    icon: GraduationCap,
    color: 'from-blue to-cyan',
    recommended: ['Foundations of AI', 'Prompt Engineering', 'Ethics'],
  },
  {
    id: 'professional',
    title: 'Professional',
    description: 'I want to use AI tools effectively in my work and career.',
    icon: Briefcase,
    color: 'from-purple to-pink',
    recommended: ['AI Tools Ecosystem', 'Real-World Projects', 'Building with APIs'],
  },
  {
    id: 'builder',
    title: 'Builder',
    description: 'I want to build AI-powered applications and integrate APIs.',
    icon: Wrench,
    color: 'from-orange to-red',
    recommended: ['Building with APIs', 'Agents & Automation', 'Image/Video/Audio'],
  },
]

const features = [
  { icon: BookOpen, title: '8 Learning Modules', desc: 'Structured lessons from beginner to advanced' },
  { icon: Gamepad2, title: '13 Educational Games', desc: 'Learn through play — earn XP and level up' },
  { icon: Zap, title: 'AI Sandboxes', desc: 'Hands-on tools with live AI responses' },
  { icon: Brain, title: 'Prompt Engineering', desc: 'Master the art of talking to AI' },
]

export default function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('explorer')
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<'newbie' | 'master' | null>(null)
  const [completing, setCompleting] = useState(false)

  const setUserName = useUserStore((s) => s.setName)
  const setUserAvatar = useUserStore((s) => s.setAvatar)
  const setUserTrack = useUserStore((s) => s.setSelectedTrack)
  const setOnboardingComplete = useUserStore((s) => s.setOnboardingComplete)
  const setExperienceLevel = useUserStore((s) => s.setExperienceLevel)

  const totalSteps = 5

  const handleComplete = () => {
    setCompleting(true)
    setUserName(name.trim() || 'Explorer')
    setUserAvatar(selectedAvatar)
    setUserTrack(selectedTrack)
    if (selectedLevel) setExperienceLevel(selectedLevel)
    useXPStore.getState().addXP(50)
    playXPDing()

    setTimeout(() => {
      playLevelUp()
      setOnboardingComplete(true)
    }, 1200)
  }

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0
    if (step === 3) return selectedTrack !== null
    if (step === 4) return selectedLevel !== null
    return true
  }

  return (
    <div className="fixed inset-0 z-[200] bg-bg flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted font-medium">Step {step + 1} of {totalSteps}</span>
            <span className="text-xs text-accent font-medium">{Math.round(((step + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple to-blue rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div
              key="welcome"
              className="animate-fade-in text-center"
            >
              <div
                className="animate-celebrate-pop w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple to-blue flex items-center justify-center"
              >
                <Sparkles size={40} className="text-white" />
              </div>
              <h1 className="text-4xl font-bold text-text-primary mb-3">Welcome to AIcademy</h1>
              <p className="text-lg text-text-secondary mb-8 max-w-md mx-auto">
                Your interactive AI literacy journey starts here. Let&apos;s set things up in under a minute.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8 max-w-lg mx-auto">
                {features.map((f, i) => (
                  <div
                    key={f.title}
                    className="animate-fade-in"
                    style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                  >
                    <Card padding="sm" hover={false} className="text-left">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                          <f.icon size={16} className="text-accent" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{f.title}</p>
                          <p className="text-xs text-text-muted mt-0.5">{f.desc}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Name & Avatar */}
          {step === 1 && (
            <div
              key="profile"
              className="animate-fade-in text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green to-emerald-600 flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Who are you?</h2>
              <p className="text-text-secondary mb-8">Pick a name and avatar — you can change these later in Settings.</p>

              <div className="max-w-sm mx-auto mb-8">
                <label htmlFor="onboarding-name" className="block text-sm font-medium text-text-secondary mb-2 text-left">
                  Your Name
                </label>
                <input
                  id="onboarding-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={30}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter' && canProceed()) setStep(2) }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">Choose Your Avatar</label>
                <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
                  {avatars.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`
                        flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all cursor-pointer
                        ${selectedAvatar === avatar.id
                          ? 'border-accent bg-accent/10 scale-105'
                          : 'border-border-subtle bg-surface hover:border-accent/50'
                        }
                      `}
                    >
                      <span className="text-2xl">{avatar.emoji}</span>
                      <span className="text-xs text-text-muted">{avatar.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Feature Tour */}
          {step === 2 && (
            <div
              key="tour"
              className="animate-fade-in text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan to-blue flex items-center justify-center">
                <Palette size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">How AIcademy Works</h2>
              <p className="text-text-secondary mb-8">Here&apos;s what you&apos;ll find inside.</p>

              <div className="space-y-4 text-left max-w-lg mx-auto">
                {[
                  { icon: '📚', title: 'Learn', desc: 'Work through 8 modules with 3-layer lessons: Read → Apply → Reinforce.' },
                  { icon: '🎮', title: 'Practice', desc: '13 educational games that test your knowledge — earn XP and level up.' },
                  { icon: '🧪', title: 'Experiment', desc: 'AI sandboxes let you build prompts, compare models, and test ideas live.' },
                  { icon: '📈', title: 'Track Progress', desc: 'XP, levels, streaks, skill profiles — watch yourself grow.' },
                  { icon: '🤖', title: 'AI Tutor', desc: 'Ask questions anytime — your AI assistant is always one click away.' },
                ].map((item, i) => (
                  <div
                    key={item.title}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <Card padding="sm" hover={false}>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className="font-semibold text-text-primary">{item.title}</p>
                          <p className="text-sm text-text-secondary">{item.desc}</p>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Learning Track */}
          {step === 3 && !completing && (
            <div
              key="track"
              className="animate-fade-in text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange to-red flex items-center justify-center">
                <Rocket size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Choose Your Path</h2>
              <p className="text-text-secondary mb-8">This helps us recommend the right content. You can switch anytime.</p>

              <div className="space-y-4 max-w-lg mx-auto">
                {tracks.map((track, i) => (
                  <div
                    key={track.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <button
                      onClick={() => setSelectedTrack(track.id)}
                      className={`
                        w-full text-left p-5 rounded-2xl border-2 transition-all cursor-pointer
                        ${selectedTrack === track.id
                          ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
                          : 'border-border-subtle bg-surface hover:border-accent/30'
                        }
                      `}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${track.color} flex items-center justify-center shrink-0`}>
                          <track.icon size={24} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-text-primary text-lg">{track.title}</h3>
                            {selectedTrack === track.id && (
                              <div className="animate-celebrate-pop">
                                <Check size={20} className="text-accent" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary mt-1">{track.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {track.recommended.map((mod) => (
                              <span key={mod} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                                {mod}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Experience Level */}
          {step === 4 && !completing && (
            <div
              key="level"
              className="animate-fade-in text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Brain size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">What&apos;s Your AI Experience?</h2>
              <p className="text-text-secondary mb-8">We&apos;ll tailor your first lesson based on your level.</p>

              <div className="flex flex-col gap-4 max-w-lg mx-auto">
                {[
                  {
                    id: 'newbie' as const,
                    emoji: '🌱',
                    title: 'I\'m New to AI',
                    description: 'I want to start from scratch and learn the fundamentals step-by-step.',
                    color: 'from-green to-emerald-600',
                  },
                  {
                    id: 'master' as const,
                    emoji: '⚡',
                    title: 'I Know My Way Around',
                    description: 'I\'ve used AI tools before and want to deepen my skills with advanced topics.',
                    color: 'from-purple to-indigo-600',
                  },
                ].map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedLevel(level.id)}
                    className={`
                      w-full text-left p-6 rounded-2xl border-2 transition-all cursor-pointer
                      ${selectedLevel === level.id
                        ? 'border-accent bg-accent/5 shadow-lg shadow-accent/10'
                        : 'border-border-subtle bg-surface hover:border-accent/30'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${level.color} flex items-center justify-center shrink-0`}>
                        <span className="text-2xl">{level.emoji}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-text-primary text-lg">{level.title}</h3>
                          {selectedLevel === level.id && (
                            <div className="animate-celebrate-pop">
                              <Check size={20} className="text-accent" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary mt-1">{level.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Completing animation */}
          {completing && (
            <div
              key="completing"
              className="animate-fade-in text-center py-12"
            >
              <div
                className="animate-celebrate-pop w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple via-blue to-cyan flex items-center justify-center"
              >
                <Sparkles size={48} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-3">You&apos;re all set, {name || 'Explorer'}!</h2>
              <p className="text-text-secondary mb-2">You earned <span className="text-accent font-bold">+50 XP</span> for completing onboarding.</p>
              <div
                className="animate-fade-in mt-6"
                style={{ animationDelay: '0.8s' }}
              >
                <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-br from-purple to-blue animate-pulse" />
                <p className="text-sm text-text-muted mt-3">Loading your dashboard...</p>
              </div>
            </div>
          )}

        {/* Navigation buttons */}
        {!completing && (
          <div
            className="animate-fade-in flex items-center justify-between mt-10"
          >
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} icon={<ArrowLeft size={16} />}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps - 1 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                icon={<ArrowRight size={16} />}
                className="flex-row-reverse"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed()}
                icon={<Rocket size={16} />}
              >
                Start Learning
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
