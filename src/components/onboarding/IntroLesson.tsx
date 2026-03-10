'use client'

import { useState, useCallback } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useUserStore } from '@/stores/user-store'
import { useXPStore } from '@/stores/xp-store'
import { playCorrect, playIncorrect, playLevelUp, hapticSuccess } from '@/lib/sounds'
import { celebrate } from '@/lib/celebrate'
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Trophy,
  Sparkles,
  Zap,
  Check,
  X,
  Gamepad2,
} from 'lucide-react'

// ─── Newbie Lesson Content ───────────────────────────────────────────────────

function NewbieRead1() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-text-primary">What is Artificial Intelligence?</h3>
      <p className="text-text-secondary leading-relaxed">
        Artificial Intelligence (AI) is software that can learn patterns from data and make predictions or decisions.
        Unlike traditional programs where humans write every rule, AI systems learn those rules from examples.
      </p>
      <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
        <p className="text-sm text-text-secondary">
          <span className="font-bold text-accent">Simple analogy:</span> Think of AI like teaching a dog tricks.
          You don&apos;t explain &quot;gravity&quot; to the dog — you show it what you want, reward good behavior, and it learns the pattern.
          AI works similarly: you show it data, and it figures out the patterns.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-green/5 border border-green/10">
          <p className="text-xs font-bold text-green mb-1">✅ AI CAN</p>
          <p className="text-sm text-text-secondary">Recognize patterns, translate languages, generate text and images</p>
        </div>
        <div className="p-3 rounded-lg bg-red/5 border border-red/10">
          <p className="text-xs font-bold text-red mb-1">❌ AI CAN&apos;T</p>
          <p className="text-sm text-text-secondary">Truly understand meaning, feel emotions, or think creatively like humans</p>
        </div>
      </div>
    </div>
  )
}

function NewbieRead2() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-text-primary">How Do You Talk to AI?</h3>
      <p className="text-text-secondary leading-relaxed">
        When you use AI tools like ChatGPT, you communicate through <span className="font-bold text-accent">prompts</span>.
        A prompt is simply the text you type to tell the AI what you want. The better your prompt, the better the response.
      </p>
      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-red/5 border border-red/10">
          <p className="text-xs font-bold text-red mb-1">❌ Vague Prompt</p>
          <p className="text-sm text-text-secondary italic">&quot;Tell me about space&quot;</p>
        </div>
        <div className="p-3 rounded-lg bg-green/5 border border-green/10">
          <p className="text-xs font-bold text-green mb-1">✅ Clear Prompt</p>
          <p className="text-sm text-text-secondary italic">&quot;Explain how black holes form in 3 simple sentences for a 14-year-old&quot;</p>
        </div>
      </div>
      <p className="text-sm text-text-muted">
        Throughout AIcademy, you&apos;ll master the art of writing great prompts — this skill is called <strong>Prompt Engineering</strong>.
      </p>
    </div>
  )
}

// ─── Master Lesson Content ───────────────────────────────────────────────────

function MasterRead1() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-text-primary">LLMs Under the Hood</h3>
      <p className="text-text-secondary leading-relaxed">
        Large Language Models (LLMs) like GPT-4 and Llama are <span className="font-bold text-accent">autoregressive transformers</span>.
        They predict the next token in a sequence based on the context of all previous tokens.
      </p>
      <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle font-mono text-sm">
        <p className="text-text-muted mb-1">{/* Simplified prediction loop */}{'// Simplified prediction loop'}</p>
        <p className="text-text-secondary">
          <span className="text-purple">while</span> (!stop_token) {'{'}<br />
          &nbsp;&nbsp;next_token = <span className="text-accent">model.predict</span>(context)<br />
          &nbsp;&nbsp;context.<span className="text-green">append</span>(next_token)<br />
          {'}'}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Temperature', desc: 'Controls randomness (0 = deterministic, 1 = creative)' },
          { label: 'Top-P', desc: 'Nucleus sampling — limits token pool by cumulative probability' },
          { label: 'Context Window', desc: 'Max tokens the model can "see" at once (8K–128K+)' },
        ].map((item) => (
          <div key={item.label} className="p-2.5 rounded-lg bg-accent/5 border border-accent/10">
            <p className="text-xs font-bold text-accent">{item.label}</p>
            <p className="text-[11px] text-text-muted mt-0.5">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MasterRead2() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-text-primary">Advanced Prompt Patterns</h3>
      <p className="text-text-secondary leading-relaxed">
        Beyond basic prompting, there are powerful techniques that dramatically improve AI output quality.
      </p>
      <div className="space-y-3">
        {[
          {
            title: 'Chain-of-Thought (CoT)',
            desc: 'Ask the model to think step-by-step before answering.',
            example: '"Solve this step by step: If a train travels..."',
          },
          {
            title: 'Few-Shot Learning',
            desc: 'Provide 2-3 examples so the model understands the pattern.',
            example: '"Input: happy → Output: 😊, Input: sad → Output: 😢, Input: excited → "',
          },
          {
            title: 'System Prompts',
            desc: 'Set persistent instructions that shape every response.',
            example: '"You are a senior Python developer. Always explain trade-offs."',
          },
        ].map((technique) => (
          <div key={technique.title} className="p-3 rounded-lg bg-surface-raised border border-border-subtle">
            <p className="text-sm font-bold text-text-primary">{technique.title}</p>
            <p className="text-xs text-text-secondary mt-0.5">{technique.desc}</p>
            <p className="text-xs text-accent/70 mt-1 italic">{technique.example}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Shared Quiz Game ────────────────────────────────────────────────────────

interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

const newbieQuiz: QuizQuestion[] = [
  {
    question: 'What does AI learn from?',
    options: ['Magic', 'Data and patterns', 'Human brain transplant', 'The internet alone'],
    correct: 1,
    explanation: 'AI learns by finding patterns in data — the more quality data, the better it performs.',
  },
  {
    question: 'What is a "prompt"?',
    options: ['A type of AI model', 'The text you type to talk to AI', 'An AI\'s memory', 'A programming language'],
    correct: 1,
    explanation: 'A prompt is simply the text instruction you give to an AI to get a response.',
  },
  {
    question: 'Which prompt is better?',
    options: ['"Tell me stuff"', '"Write a 100-word summary of photosynthesis for a middle schooler"'],
    correct: 1,
    explanation: 'Specific prompts with clear context, audience, and format get much better results.',
  },
  {
    question: 'Can AI truly understand what it writes?',
    options: ['Yes, AI understands everything', 'No, AI predicts likely text patterns without real understanding'],
    correct: 1,
    explanation: 'Current AI generates text by predicting patterns — it doesn\'t truly "understand" meaning like humans do.',
  },
]

const masterQuiz: QuizQuestion[] = [
  {
    question: 'What type of model architecture do most modern LLMs use?',
    options: ['Recurrent Neural Network', 'Convolutional Network', 'Autoregressive Transformer', 'Decision Tree'],
    correct: 2,
    explanation: 'Modern LLMs like GPT-4 and Llama use the autoregressive transformer architecture.',
  },
  {
    question: 'What does Temperature = 0 produce?',
    options: ['Maximum creativity', 'Deterministic (most likely) output', 'Random noise', 'Longer responses'],
    correct: 1,
    explanation: 'Temperature 0 always picks the most probable next token, giving deterministic output.',
  },
  {
    question: 'Chain-of-Thought prompting helps by...',
    options: ['Making responses shorter', 'Forcing step-by-step reasoning before the answer', 'Reducing token usage', 'Bypassing safety filters'],
    correct: 1,
    explanation: 'CoT encourages the model to reason through intermediate steps, improving accuracy on complex tasks.',
  },
  {
    question: 'Few-shot learning means...',
    options: ['Training a new model from scratch', 'Providing examples in the prompt so the model learns the pattern', 'Using less data', 'Running the model fewer times'],
    correct: 1,
    explanation: 'Few-shot learning provides examples directly in the prompt — no retraining needed.',
  },
]

// ─── Main IntroLesson Component ─────────────────────────────────────────────

type Phase = 'lesson' | 'quiz' | 'complete'

function getIndicatorClass(answered: boolean, isCorrect: boolean, isSelected: boolean): string {
  if (answered && isCorrect) return 'border-green bg-green text-white'
  if (answered && isSelected && !isCorrect) return 'border-red bg-red text-white'
  return 'border-border-subtle'
}

export default function IntroLesson({ onComplete }: { onComplete?: () => void } = {}) {
  const experienceLevel = useUserStore((s) => s.experienceLevel)
  const setIntroLessonComplete = useUserStore((s) => s.setIntroLessonComplete)
  const soundEnabled = useUserStore((s) => s.soundEnabled)
  const userName = useUserStore((s) => s.name)

  const isNewbie = experienceLevel === 'newbie'
  const lessonTitle = isNewbie ? 'AI 101: Your First Steps' : 'AI Deep Dive: Beyond the Basics'

  const readSteps = isNewbie
    ? [
        { title: 'What is AI?', content: <NewbieRead1 /> },
        { title: 'How to Talk to AI', content: <NewbieRead2 /> },
      ]
    : [
        { title: 'LLMs Under the Hood', content: <MasterRead1 /> },
        { title: 'Advanced Prompt Patterns', content: <MasterRead2 /> },
      ]

  const quizQuestions = isNewbie ? newbieQuiz : masterQuiz

  const [phase, setPhase] = useState<Phase>('lesson')
  const [lessonStep, setLessonStep] = useState(0)

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)

  const handleFinishLesson = useCallback(() => {
    setPhase('quiz')
  }, [])

  const handleAnswer = useCallback((optionIndex: number) => {
    if (answered) return
    setSelectedAnswer(optionIndex)
    setAnswered(true)
    const correct = optionIndex === quizQuestions[quizIndex].correct
    if (correct) {
      setScore((s) => s + 1)
      if (soundEnabled) playCorrect()
    } else if (soundEnabled) {
      playIncorrect()
    }
  }, [answered, quizIndex, quizQuestions, soundEnabled])

  const handleNextQuestion = useCallback(() => {
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex((i) => i + 1)
      setSelectedAnswer(null)
      setAnswered(false)
    } else {
      // Quiz complete
      setPhase('complete')
      const xpEarned = 75 + score * 25
      useXPStore.getState().addXP(xpEarned)
      if (soundEnabled) playLevelUp()
      hapticSuccess()
      celebrate({
        type: 'lesson-complete',
        title: 'Intro Complete!',
        subtitle: `You scored ${score}/${quizQuestions.length}`,
        value: `+${xpEarned} XP`,
      })
    }
  }, [quizIndex, quizQuestions, score, soundEnabled, selectedAnswer])

  const handleFinish = useCallback(() => {
    setIntroLessonComplete(true)
    onComplete?.()
  }, [setIntroLessonComplete, onComplete])

  const getTotalProgress = (): number => {
    const total = readSteps.length + quizQuestions.length + 1
    if (phase === 'lesson') return (lessonStep + 1) / total
    if (phase === 'quiz') return (readSteps.length + quizIndex + 1) / total
    return 1
  }
  const totalProgress = getTotalProgress()

  return (
    <div className="fixed inset-0 z-[200] bg-bg flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted font-medium">{lessonTitle}</span>
            <span className="text-xs text-accent font-medium">{Math.round(totalProgress * 100)}%</span>
          </div>
          <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple to-blue rounded-full transition-all duration-500 ease-out"
              style={{ width: `${totalProgress * 100}%` }}
            />
          </div>
        </div>

          {/* ─── Lesson Phase ─── */}
          {phase === 'lesson' && (
            <div
              key={`lesson-${lessonStep}`}
              className="animate-fade-in"
            >
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={16} className="text-blue" />
                <span className="text-sm font-medium text-blue">Read</span>
                <span className="text-sm text-text-muted">— Step {lessonStep + 1} of {readSteps.length}</span>
              </div>
              <Card padding="lg" className="mb-6">
                {readSteps[lessonStep].content}
              </Card>

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setLessonStep(Math.max(0, lessonStep - 1))}
                  disabled={lessonStep === 0}
                  icon={<ArrowLeft size={16} />}
                >
                  Back
                </Button>
                {lessonStep < readSteps.length - 1 ? (
                  <Button onClick={() => setLessonStep(lessonStep + 1)} icon={<ArrowRight size={16} />} className="flex-row-reverse">
                    Continue
                  </Button>
                ) : (
                  <Button onClick={handleFinishLesson} icon={<Gamepad2 size={16} />} className="flex-row-reverse">
                    Start Quiz Game
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ─── Quiz Phase ─── */}
          {phase === 'quiz' && (
            <div
              key={`quiz-${quizIndex}`}
              className="animate-fade-in"
            >
              <div className="flex items-center gap-2 mb-4">
                <Gamepad2 size={16} className="text-gold" />
                <span className="text-sm font-medium text-gold">Quiz Game</span>
                <span className="text-sm text-text-muted">— Question {quizIndex + 1} of {quizQuestions.length}</span>
                <span className="ml-auto text-sm font-bold text-accent">{score}/{quizIndex + 1} correct</span>
              </div>

              <Card padding="lg" className="mb-6">
                <h3 className="text-lg font-bold text-text-primary mb-4">{quizQuestions[quizIndex].question}</h3>
                <div className="space-y-3">
                  {quizQuestions[quizIndex].options.map((option, i) => {
                    const isCorrect = i === quizQuestions[quizIndex].correct
                    const isSelected = selectedAnswer === i
                    let borderColor = 'border-border-subtle hover:border-accent/40'
                    if (answered) {
                      if (isCorrect) borderColor = 'border-green bg-green/5'
                      else if (isSelected && !isCorrect) borderColor = 'border-red bg-red/5'
                      else borderColor = 'border-border-subtle opacity-50'
                    } else if (isSelected) {
                      borderColor = 'border-accent bg-accent/5'
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleAnswer(i)}
                        disabled={answered}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${borderColor} ${answered ? '' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${getIndicatorClass(answered, isCorrect, isSelected)}`}>
                            {answered && isCorrect && <Check size={14} />}
                            {answered && isSelected && !isCorrect && <X size={14} />}
                            {!answered && <span className="text-xs text-text-muted">{String.fromCodePoint(65 + i)}</span>}
                          </div>
                          <span className="text-sm text-text-primary">{option}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {answered && (
                  <div
                    className="animate-fade-in mt-4 p-3 rounded-xl bg-accent/5 border border-accent/10"
                  >
                    <p className="text-sm text-text-secondary">
                      <span className="font-bold text-accent">Explanation: </span>
                      {quizQuestions[quizIndex].explanation}
                    </p>
                  </div>
                )}
              </Card>

              {answered && (
                <div className="flex justify-end">
                  <Button onClick={handleNextQuestion} icon={<ArrowRight size={16} />} className="flex-row-reverse">
                    {quizIndex < quizQuestions.length - 1 ? 'Next Question' : 'See Results'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ─── Complete Phase ─── */}
          {phase === 'complete' && (
            <div
              key="complete"
              className="animate-fade-in text-center py-8"
            >
              <div
                className="animate-celebrate-pop w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gold to-orange flex items-center justify-center"
              >
                <Trophy size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-3">
                {isNewbie ? 'Great Start' : 'Impressive'}, {userName || 'Explorer'}!
              </h2>
              <p className="text-text-secondary mb-2">
                You scored <span className="font-bold text-accent">{score}/{quizQuestions.length}</span> on the quiz.
              </p>
              <p className="text-text-secondary mb-6">
                You earned <span className="font-bold text-gold">+{75 + score * 25} XP</span> for completing your intro lesson.
              </p>

              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-8">
                {[
                  { icon: <BookOpen size={18} className="text-blue" />, label: 'Lesson', value: '✓' },
                  { icon: <Gamepad2 size={18} className="text-gold" />, label: 'Quiz', value: `${score}/${quizQuestions.length}` },
                  { icon: <Zap size={18} className="text-accent" />, label: 'XP Earned', value: `+${75 + score * 25}` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="p-3 rounded-xl bg-surface-raised/50 border border-border-subtle flex flex-col items-center gap-1">
                    {icon}
                    <span className="text-lg font-bold text-text-primary">{value}</span>
                    <span className="text-[10px] text-text-muted uppercase">{label}</span>
                  </div>
                ))}
              </div>

              <Button onClick={handleFinish} icon={<Sparkles size={16} />} size="lg">
                Enter AIcademy
              </Button>
            </div>
          )}
      </div>
    </div>
  )
}
