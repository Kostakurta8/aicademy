'use client'

import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ArrowLeft, ArrowRight, Check, Star, BookOpen, Lightbulb, HelpCircle, ChevronDown, ChevronUp, Trophy } from 'lucide-react'
import { useProgressStore } from '@/stores/progress-store'
import { useXPStore } from '@/stores/xp-store'
import { useUserStore } from '@/stores/user-store'
import { playLevelUp, playCorrect, playIncorrect, playXPDing, hapticSuccess } from '@/lib/sounds'
import { celebrate } from '@/lib/celebrate'
import { ConfettiBurst, XPPopup, ScreenFlash } from '@/components/ui/GameEffects'

// Lesson content data
const lessonContent: Record<string, {
  title: string; module: string; totalSteps: number;
  steps: { title: string; layer: 'read' | 'apply' | 'reinforce'; content: React.ReactNode }[]
}> = {
  'foundations/how-llms-work': {
    title: 'How LLMs Actually Work', module: 'Foundations of AI', totalSteps: 5,
    steps: [
      { title: 'What is an LLM?', layer: 'read', content: <ReadContent1 /> },
      { title: 'Next-Token Prediction', layer: 'read', content: <ReadContent2 /> },
      { title: 'Try It: Watch Prediction', layer: 'apply', content: <ApplyContent1 /> },
      { title: 'Try It: Temperature', layer: 'apply', content: <ApplyContent2 /> },
      { title: 'Check Your Understanding', layer: 'reinforce', content: <QuizContent1 /> },
    ],
  },
  'foundations/tokens-and-context': {
    title: 'Tokens, Context Windows & Temperature', module: 'Foundations of AI', totalSteps: 4,
    steps: [
      { title: 'What Are Tokens?', layer: 'read', content: <TokenRead1 /> },
      { title: 'Context Windows Explained', layer: 'read', content: <TokenRead2 /> },
      { title: 'Try It: Token Counter', layer: 'apply', content: <TokenApply1 /> },
      { title: 'Quick Quiz', layer: 'reinforce', content: <TokenQuiz /> },
    ],
  },
  'foundations/capabilities-map': {
    title: 'What AI Can and Can\'t Do', module: 'Foundations of AI', totalSteps: 3,
    steps: [
      { title: 'AI Capabilities', layer: 'read', content: <CapRead /> },
      { title: 'Try It: Sort the Tasks', layer: 'apply', content: <CapApply /> },
      { title: 'Check Understanding', layer: 'reinforce', content: <CapQuiz /> },
    ],
  },
  'prompt-engineering/prompt-anatomy': {
    title: 'Anatomy of a Perfect Prompt', module: 'Prompt Engineering', totalSteps: 4,
    steps: [
      { title: 'The RCFT Framework', layer: 'read', content: <PromptRead1 /> },
      { title: 'System vs User Prompts', layer: 'read', content: <PromptRead2 /> },
      { title: 'Build Your First Prompt', layer: 'apply', content: <PromptApply /> },
      { title: 'Quiz Time', layer: 'reinforce', content: <PromptQuiz /> },
    ],
  },
  // Module 2: Prompt Engineering (remaining lessons)
  'prompt-engineering/few-shot-techniques': {
    title: 'Few-Shot & Zero-Shot Techniques', module: 'Prompt Engineering', totalSteps: 5,
    steps: [
      { title: 'What is Zero-Shot?', layer: 'read', content: <FewShotRead1 /> },
      { title: 'Few-Shot Learning', layer: 'read', content: <FewShotRead2 /> },
      { title: 'Try It: Zero vs Few-Shot', layer: 'apply', content: <FewShotApply1 /> },
      { title: 'Build a Few-Shot Prompt', layer: 'apply', content: <FewShotApply2 /> },
      { title: 'Quiz', layer: 'reinforce', content: <FewShotQuiz /> },
    ],
  },
  'prompt-engineering/chain-of-thought': {
    title: 'Chain-of-Thought Prompting', module: 'Prompt Engineering', totalSteps: 5,
    steps: [
      { title: 'What is Chain-of-Thought?', layer: 'read', content: <CoTRead1 /> },
      { title: 'When to Use CoT', layer: 'read', content: <CoTRead2 /> },
      { title: 'Try It: Add Reasoning', layer: 'apply', content: <CoTApply1 /> },
      { title: 'Compare Results', layer: 'apply', content: <CoTApply2 /> },
      { title: 'Quiz', layer: 'reinforce', content: <CoTQuiz /> },
    ],
  },
  'prompt-engineering/advanced-techniques': {
    title: 'Advanced Prompt Patterns', module: 'Prompt Engineering', totalSteps: 6,
    steps: [
      { title: 'Tree-of-Thought', layer: 'read', content: <AdvRead1 /> },
      { title: 'Self-Consistency', layer: 'read', content: <AdvRead2 /> },
      { title: 'Meta-Prompting', layer: 'read', content: <AdvRead3 /> },
      { title: 'Try It: Tree-of-Thought', layer: 'apply', content: <AdvApply1 /> },
      { title: 'Try It: Meta-Prompt', layer: 'apply', content: <AdvApply2 /> },
      { title: 'Final Quiz', layer: 'reinforce', content: <AdvQuiz /> },
    ],
  },
  // Module 3: Tools Ecosystem
  'tools-ecosystem/chatbot-landscape': {
    title: 'The AI Chatbot Landscape', module: 'AI Tools Ecosystem', totalSteps: 4,
    steps: [
      { title: 'The Big Players', layer: 'read', content: <ToolsRead1 /> },
      { title: 'Comparing Capabilities', layer: 'read', content: <ToolsRead2 /> },
      { title: 'Try It: Match the Tool', layer: 'apply', content: <ToolsApply1 /> },
      { title: 'Quiz', layer: 'reinforce', content: <ToolsQuiz1 /> },
    ],
  },
  'tools-ecosystem/specialized-tools': {
    title: 'Specialized AI Tools', module: 'AI Tools Ecosystem', totalSteps: 4,
    steps: [
      { title: 'Writing & Content Tools', layer: 'read', content: <SpecToolsRead1 /> },
      { title: 'Coding & Design Tools', layer: 'read', content: <SpecToolsRead2 /> },
      { title: 'Try It: Tool Selector', layer: 'apply', content: <SpecToolsApply /> },
      { title: 'Quiz', layer: 'reinforce', content: <SpecToolsQuiz /> },
    ],
  },
  'tools-ecosystem/choosing-right-tool': {
    title: 'Choosing the Right Tool', module: 'AI Tools Ecosystem', totalSteps: 3,
    steps: [
      { title: 'Decision Framework', layer: 'read', content: <ChooseRead /> },
      { title: 'Try It: Tool Advisor', layer: 'apply', content: <ChooseApply /> },
      { title: 'Quiz', layer: 'reinforce', content: <ChooseQuiz /> },
    ],
  },
  // Module 4: Building with APIs
  'building-with-apis/api-basics': {
    title: 'API Fundamentals', module: 'Building with APIs', totalSteps: 5,
    steps: [
      { title: 'What is an API?', layer: 'read', content: <APIRead1 /> },
      { title: 'HTTP Methods & Headers', layer: 'read', content: <APIRead2 /> },
      { title: 'Authentication', layer: 'read', content: <APIRead3 /> },
      { title: 'Try It: Make an API Call', layer: 'apply', content: <APIApply /> },
      { title: 'Quiz', layer: 'reinforce', content: <APIQuiz /> },
    ],
  },
  'building-with-apis/openai-api': {
    title: 'Working with AI APIs', module: 'Building with APIs', totalSteps: 5,
    steps: [
      { title: 'Chat Completions API', layer: 'read', content: <AIAPIRead1 /> },
      { title: 'Streaming & Parameters', layer: 'read', content: <AIAPIRead2 /> },
      { title: 'Function Calling', layer: 'read', content: <AIAPIRead3 /> },
      { title: 'Try It: API Playground', layer: 'apply', content: <AIAPIApply /> },
      { title: 'Quiz', layer: 'reinforce', content: <AIAPIQuiz /> },
    ],
  },
  'building-with-apis/building-apps': {
    title: 'Building AI-Powered Apps', module: 'Building with APIs', totalSteps: 6,
    steps: [
      { title: 'Architecture Patterns', layer: 'read', content: <BuildRead1 /> },
      { title: 'Caching & Rate Limiting', layer: 'read', content: <BuildRead2 /> },
      { title: 'Error Handling', layer: 'read', content: <BuildRead3 /> },
      { title: 'Try It: Design an App', layer: 'apply', content: <BuildApply1 /> },
      { title: 'Try It: Error Strategy', layer: 'apply', content: <BuildApply2 /> },
      { title: 'Quiz', layer: 'reinforce', content: <BuildQuiz /> },
    ],
  },
  'building-with-apis/deployment': {
    title: 'Deploying AI Applications', module: 'Building with APIs', totalSteps: 5,
    steps: [
      { title: 'Deployment Options', layer: 'read', content: <DeployRead1 /> },
      { title: 'Cost Optimization', layer: 'read', content: <DeployRead2 /> },
      { title: 'Monitoring', layer: 'read', content: <DeployRead3 /> },
      { title: 'Try It: Cost Calculator', layer: 'apply', content: <DeployApply /> },
      { title: 'Quiz', layer: 'reinforce', content: <DeployQuiz /> },
    ],
  },
  // Module 5: Ethics & Critical Thinking
  'ethics/hallucinations': {
    title: 'AI Hallucinations & Fact-Checking', module: 'Ethics & Critical Thinking', totalSteps: 4,
    steps: [
      { title: 'What Are Hallucinations?', layer: 'read', content: <HalluRead1 /> },
      { title: 'Types of Hallucinations', layer: 'read', content: <HalluRead2 /> },
      { title: 'Try It: Spot the Fake', layer: 'apply', content: <HalluApply /> },
      { title: 'Quiz', layer: 'reinforce', content: <HalluQuiz /> },
    ],
  },
  'ethics/bias-fairness': {
    title: 'Bias & Fairness in AI', module: 'Ethics & Critical Thinking', totalSteps: 5,
    steps: [
      { title: 'What is AI Bias?', layer: 'read', content: <BiasRead1 /> },
      { title: 'Sources of Bias', layer: 'read', content: <BiasRead2 /> },
      { title: 'Mitigation Strategies', layer: 'read', content: <BiasRead3 /> },
      { title: 'Try It: Detect Bias', layer: 'apply', content: <BiasApply /> },
      { title: 'Quiz', layer: 'reinforce', content: <BiasQuiz /> },
    ],
  },
  'ethics/responsible-use': {
    title: 'Responsible AI Use', module: 'Ethics & Critical Thinking', totalSteps: 4,
    steps: [
      { title: 'Privacy & Data', layer: 'read', content: <ResponsibleRead1 /> },
      { title: 'Copyright & Job Impact', layer: 'read', content: <ResponsibleRead2 /> },
      { title: 'Try It: Ethical Dilemmas', layer: 'apply', content: <ResponsibleApply /> },
      { title: 'Quiz', layer: 'reinforce', content: <ResponsibleQuiz /> },
    ],
  },
  // Module 6: Real-World Projects
  'real-world-projects/content-generator': {
    title: 'Build a Content Generator', module: 'Real-World Projects', totalSteps: 6,
    steps: [
      { title: 'Project Overview', layer: 'read', content: <ContentGenRead1 /> },
      { title: 'Designing the Pipeline', layer: 'read', content: <ContentGenRead2 /> },
      { title: 'Try It: Build Input Form', layer: 'apply', content: <ContentGenApply1 /> },
      { title: 'Try It: Chain Prompts', layer: 'apply', content: <ContentGenApply2 /> },
      { title: 'Try It: Output Formatter', layer: 'apply', content: <ContentGenApply3 /> },
      { title: 'Review', layer: 'reinforce', content: <ContentGenQuiz /> },
    ],
  },
  'real-world-projects/ai-assistant': {
    title: 'Build a Custom AI Assistant', module: 'Real-World Projects', totalSteps: 7,
    steps: [
      { title: 'Planning Your Assistant', layer: 'read', content: <AssistantRead1 /> },
      { title: 'System Prompt Design', layer: 'read', content: <AssistantRead2 /> },
      { title: 'Conversation Design', layer: 'read', content: <AssistantRead3 /> },
      { title: 'Try It: Design System Prompt', layer: 'apply', content: <AssistantApply1 /> },
      { title: 'Try It: Build Guardrails', layer: 'apply', content: <AssistantApply2 /> },
      { title: 'Try It: Test Your Assistant', layer: 'apply', content: <AssistantApply3 /> },
      { title: 'Review', layer: 'reinforce', content: <AssistantQuiz /> },
    ],
  },
  'real-world-projects/data-pipeline': {
    title: 'Build an AI Data Pipeline', module: 'Real-World Projects', totalSteps: 6,
    steps: [
      { title: 'Data Pipeline Concepts', layer: 'read', content: <PipelineRead1 /> },
      { title: 'AI in Data Processing', layer: 'read', content: <PipelineRead2 /> },
      { title: 'Try It: Design a Pipeline', layer: 'apply', content: <PipelineApply1 /> },
      { title: 'Try It: Extraction Prompts', layer: 'apply', content: <PipelineApply2 /> },
      { title: 'Try It: Transform & Load', layer: 'apply', content: <PipelineApply3 /> },
      { title: 'Review', layer: 'reinforce', content: <PipelineQuiz /> },
    ],
  },
  // Module 7: Image, Video & Audio
  'image-video-audio/image-generation': {
    title: 'AI Image Generation', module: 'Image, Video & Audio', totalSteps: 5,
    steps: [
      { title: 'How Image AI Works', layer: 'read', content: <ImageRead1 /> },
      { title: 'Prompt Crafting for Images', layer: 'read', content: <ImageRead2 /> },
      { title: 'Tools Comparison', layer: 'read', content: <ImageRead3 /> },
      { title: 'Try It: Build Image Prompts', layer: 'apply', content: <ImageApply /> },
      { title: 'Quiz', layer: 'reinforce', content: <ImageQuiz /> },
    ],
  },
  'image-video-audio/video-audio': {
    title: 'AI Video & Audio Tools', module: 'Image, Video & Audio', totalSteps: 4,
    steps: [
      { title: 'Video AI Landscape', layer: 'read', content: <VideoRead1 /> },
      { title: 'Audio AI Tools', layer: 'read', content: <VideoRead2 /> },
      { title: 'Try It: Plan a Production', layer: 'apply', content: <VideoApply /> },
      { title: 'Quiz', layer: 'reinforce', content: <VideoQuiz /> },
    ],
  },
  'image-video-audio/multimodal': {
    title: 'Multimodal AI', module: 'Image, Video & Audio', totalSteps: 5,
    steps: [
      { title: 'What is Multimodal AI?', layer: 'read', content: <MultiRead1 /> },
      { title: 'Cross-Modal Workflows', layer: 'read', content: <MultiRead2 /> },
      { title: 'Try It: Multimodal Pipeline', layer: 'apply', content: <MultiApply1 /> },
      { title: 'Try It: Vision + Text', layer: 'apply', content: <MultiApply2 /> },
      { title: 'Quiz', layer: 'reinforce', content: <MultiQuiz /> },
    ],
  },
  // Module 8: Agents & Automation
  'agents-automation/agent-fundamentals': {
    title: 'Agent Fundamentals', module: 'Agents & Automation', totalSteps: 5,
    steps: [
      { title: 'What Are AI Agents?', layer: 'read', content: <AgentRead1 /> },
      { title: 'The ReAct Pattern', layer: 'read', content: <AgentRead2 /> },
      { title: 'Tool Use & Function Calling', layer: 'read', content: <AgentRead3 /> },
      { title: 'Try It: Design an Agent', layer: 'apply', content: <AgentApply /> },
      { title: 'Quiz', layer: 'reinforce', content: <AgentQuiz /> },
    ],
  },
  'agents-automation/multi-agent': {
    title: 'Multi-Agent Systems', module: 'Agents & Automation', totalSteps: 6,
    steps: [
      { title: 'Why Multiple Agents?', layer: 'read', content: <MultiAgentRead1 /> },
      { title: 'Orchestration Patterns', layer: 'read', content: <MultiAgentRead2 /> },
      { title: 'Communication Protocols', layer: 'read', content: <MultiAgentRead3 /> },
      { title: 'Try It: Design a Team', layer: 'apply', content: <MultiAgentApply1 /> },
      { title: 'Try It: Build Orchestrator', layer: 'apply', content: <MultiAgentApply2 /> },
      { title: 'Quiz', layer: 'reinforce', content: <MultiAgentQuiz /> },
    ],
  },
  'agents-automation/automation-workflows': {
    title: 'Automation Workflows', module: 'Agents & Automation', totalSteps: 5,
    steps: [
      { title: 'Workflow Fundamentals', layer: 'read', content: <AutoRead1 /> },
      { title: 'Triggers & Actions', layer: 'read', content: <AutoRead2 /> },
      { title: 'Try It: Design a Workflow', layer: 'apply', content: <AutoApply1 /> },
      { title: 'Try It: Error Handling', layer: 'apply', content: <AutoApply2 /> },
      { title: 'Quiz', layer: 'reinforce', content: <AutoQuiz /> },
    ],
  },
}

const layerConfig = {
  read: { icon: BookOpen, label: 'Read', color: 'text-blue' },
  apply: { icon: Lightbulb, label: 'Apply', color: 'text-green' },
  reinforce: { icon: HelpCircle, label: 'Reinforce', color: 'text-gold' },
}

export default function LessonPage() {
  const params = useParams()
  const slug = params.slug as string
  const lessonSlug = params.lesson as string
  const key = `${slug}/${lessonSlug}`
  const lesson = lessonContent[key]
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [lessonComplete, setLessonComplete] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const addXP = useXPStore((s) => s.addXP)
  const completeLessonFn = useProgressStore((s) => s.completeLesson)
  const moduleProgress = useProgressStore((s) => s.moduleProgress)
  const soundEnabled = useUserStore((s) => s.soundEnabled)

  // Check if already completed
  const alreadyDone = moduleProgress[slug]?.completedLessons?.includes(lessonSlug)

  // Derive lesson ordering for this module
  const moduleLessonSlugs = Object.keys(lessonContent)
    .filter(k => k.startsWith(slug + '/'))
    .map(k => k.split('/')[1])
  const currentLessonIndex = moduleLessonSlugs.indexOf(lessonSlug)
  const nextLessonSlug = currentLessonIndex < moduleLessonSlugs.length - 1
    ? moduleLessonSlugs[currentLessonIndex + 1]
    : null
  const nextLessonKey = nextLessonSlug ? `${slug}/${nextLessonSlug}` : null
  const nextLessonTitle = nextLessonKey ? lessonContent[nextLessonKey]?.title : null

  // Check if all module lessons are completed (including current if just finished)
  const completedLessons = moduleProgress[slug]?.completedLessons ?? []
  const isModuleComplete = moduleLessonSlugs.every(s => completedLessons.includes(s))
  const willModuleBeComplete = !nextLessonSlug ||
    moduleLessonSlugs.every(s => s === lessonSlug || completedLessons.includes(s))

  const completeAndNext = useCallback(() => {
    if (!lesson) return
    const isLast = currentStep === lesson.totalSteps - 1
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep])
    }
    if (isLast && !alreadyDone) {
      completeLessonFn(slug, lessonSlug)
      addXP(100, slug)
      setLessonComplete(true)
      setShowXP(true)
      if (soundEnabled) playLevelUp()
      hapticSuccess()
      setTimeout(() => setShowXP(false), 2000)

      // Lesson-complete celebration
      celebrate({ type: 'lesson-complete', title: 'Lesson Complete!', subtitle: lesson.title, value: '+100 XP' })

      // Check if this was the last lesson in the module → module-complete
      const updatedProgress = useProgressStore.getState().moduleProgress[slug]
      const totalModuleLessons = Object.keys(lessonContent).filter(k => k.startsWith(slug + '/')).length
      if ((updatedProgress?.completedLessons?.length ?? 0) >= totalModuleLessons) {
        setTimeout(() => {
          celebrate({ type: 'module-complete', title: 'Module Complete!', subtitle: `${lesson.module} mastered!`, value: '🏆' })
        }, 3500)
      }
    } else if (!isLast) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, completedSteps, lesson, alreadyDone, slug, lessonSlug, completeLessonFn, addXP, soundEnabled])

  if (!lesson) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Link href={`/modules/${slug}`} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent mb-6">
          <ArrowLeft size={16} /> Back to Module
        </Link>
        <Card padding="lg" className="text-center">
          <h1 className="text-xl font-bold text-text-primary mb-2">Lesson Coming Soon</h1>
          <p className="text-text-secondary mb-4">This lesson is being built. Check back soon!</p>
          <Link href={`/modules/${slug}`}><Button variant="secondary">Back to Module</Button></Link>
        </Card>
      </div>
    )
  }

  const step = lesson.steps[currentStep]
  const layerInfo = layerConfig[step.layer]
  const LayerIcon = layerInfo.icon
  const isLast = currentStep === lesson.totalSteps - 1
  const isStepComplete = completedSteps.includes(currentStep)

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <ConfettiBurst trigger={lessonComplete} color="gold" />
      <XPPopup amount={100} show={showXP} />

      {/* Breadcrumb */}
      <Link href={`/modules/${slug}`} className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors mb-6">
        <ArrowLeft size={16} /> {lesson.module}
      </Link>

      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-text-primary mb-2">{lesson.title}</h1>

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-6">
          {lesson.steps.map((s, i) => {
            const conf = layerConfig[s.layer]
            return (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`
                  flex-1 h-2 rounded-full transition-all cursor-pointer
                  ${i === currentStep ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg' : ''}
                  ${completedSteps.includes(i)
                    ? 'bg-green' : i === currentStep
                    ? 'bg-accent' : 'bg-border-subtle'
                  }
                `}
                title={`Step ${i + 1}: ${s.title} (${conf.label})`}
                aria-label={`Go to step ${i + 1}`}
              />
            )
          })}
        </div>

        {/* Step info */}
        <div className="flex items-center gap-3 mb-6">
          <span className={`flex items-center gap-1.5 text-sm font-medium ${layerInfo.color}`}>
            <LayerIcon size={16} />
            {layerInfo.label}
          </span>
          <span className="text-sm text-text-muted">Step {currentStep + 1} of {lesson.totalSteps}</span>
          <span className="text-sm text-text-secondary font-medium">{step.title}</span>
        </div>
      </div>

      {/* Content */}
      <div key={currentStep} className="animate-fade-in">
        <Card padding="lg" className="mb-6">
          {step.content}
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          icon={<ArrowLeft size={16} />}
        >
          Previous
        </Button>
        {isLast ? (
          lessonComplete || alreadyDone ? (
            (lessonComplete && willModuleBeComplete) || isModuleComplete ? (
              /* Module fully complete — single "Back to Modules" */
              <Link href="/modules">
                <Button icon={<Trophy size={16} />}>
                  🏆 Module Complete! Back to Modules
                </Button>
              </Link>
            ) : (
              /* More lessons in this module — show Next Lesson + Back to Lessons */
              <div className="flex items-center gap-2">
                <Link href={`/modules/${slug}`}>
                  <Button variant="ghost" icon={<ArrowLeft size={16} />}>
                    Back to Lessons
                  </Button>
                </Link>
                {nextLessonSlug && (
                  <Link href={`/modules/${slug}/${nextLessonSlug}`}>
                    <Button icon={<ArrowRight size={16} />}>
                      Next: {nextLessonTitle ? (nextLessonTitle.length > 20 ? nextLessonTitle.slice(0, 20) + '…' : nextLessonTitle) : 'Next Lesson'}
                    </Button>
                  </Link>
                )}
              </div>
            )
          ) : (
            <Button icon={<Check size={16} />} onClick={completeAndNext}>
              Complete Lesson
            </Button>
          )
        ) : (
          <Button onClick={completeAndNext} icon={<ArrowRight size={16} />}>
            Next Step
          </Button>
        )}
      </div>
    </div>
  )
}

// === LESSON CONTENT COMPONENTS ===

function ReadContent1() {
  return (
    <div className="prose-custom">
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-accent mb-1">💡 Key Concept</p>
        <p className="text-sm text-text-secondary">LLMs don&apos;t &ldquo;understand&rdquo; language. They predict the next most likely token based on patterns in their training data.</p>
      </div>
      <p className="text-text-secondary leading-relaxed mb-4">Think of it like autocomplete on your phone — but trained on the entire internet. When you type &ldquo;The capital of France is&rdquo;, the model has seen this pattern thousands of times and assigns high probability to &ldquo;Paris&rdquo; as the next token.</p>
      <p className="text-text-secondary leading-relaxed mb-4"><strong className="text-text-primary">Large Language Model (LLM)</strong> = a neural network with billions of parameters, trained on massive text datasets, that generates text by predicting one token at a time.</p>
      <h3 className="text-base font-semibold text-text-primary mt-6 mb-3">Key Terms</h3>
      <div className="space-y-2">
        {[
          { term: 'Token', def: 'A chunk of text — roughly ¾ of a word. "hello" = 1 token, "unbelievable" = 3 tokens.' },
          { term: 'Parameter', def: 'A learned weight in the neural network. More parameters = more capacity to learn patterns.' },
          { term: 'Training Data', def: 'The text the model learned from — books, websites, code, articles.' },
        ].map(({ term, def }) => (
          <div key={term} className="flex gap-3 p-3 rounded-lg bg-surface-raised">
            <span className="text-sm font-semibold text-accent shrink-0">{term}</span>
            <span className="text-sm text-text-secondary">{def}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReadContent2() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-4">How Next-Token Prediction Works</h3>
      <div className="space-y-4 mb-6">
        {[
          { step: '1', title: 'Input text is tokenized', desc: 'Your prompt is broken into tokens (subword pieces).' },
          { step: '2', title: 'Tokens are embedded', desc: 'Each token is converted to a high-dimensional vector (numbers).' },
          { step: '3', title: 'Attention mechanism', desc: 'The model weighs which tokens are most relevant to each other.' },
          { step: '4', title: 'Probability distribution', desc: 'The model calculates probabilities for every possible next token.' },
          { step: '5', title: 'Sample next token', desc: 'One token is selected based on probabilities (influenced by temperature).' },
          { step: '6', title: 'Repeat', desc: 'The generated token is added to the input, and the process repeats.' },
        ].map(({ step, title, desc }) => (
          <div key={step} className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm shrink-0">{step}</div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{title}</p>
              <p className="text-sm text-text-secondary">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <DeepDive title="The math behind next-token prediction">
        <p className="text-sm text-text-secondary">Each token gets a probability score via the softmax function. Temperature scales these probabilities before sampling: lower temperature = more deterministic (picks the highest probability), higher = more random (gives lower-probability tokens a better chance).</p>
      </DeepDive>
    </div>
  )
}

function ApplyContent1() {
  const [input, setInput] = useState('The capital of France is')
  const [output, setOutput] = useState('')
  const [generating, setGenerating] = useState(false)

  const generate = async () => {
    setGenerating(true)
    setOutput('')
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: input }], stream: false, max_tokens: 50 }),
      })
      if (res.ok) {
        const data = await res.json()
        setOutput(data.choices?.[0]?.message?.content || 'No response')
      } else {
        setOutput('⚠️ AI not available. Check your API key in Settings.')
      }
    } catch {
      setOutput('⚠️ Could not connect to AI. Check your internet connection.')
    }
    setGenerating(false)
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Watch Prediction in Action</h3>
      <p className="text-sm text-text-secondary mb-4">Type a sentence and see what the AI predicts comes next.</p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full p-4 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-accent mb-3"
        placeholder="Type a sentence..."
      />
      <Button onClick={generate} loading={generating} className="mb-4">Generate Completion</Button>
      {output && (
        <div className="animate-fade-in">
          <div className="p-4 rounded-xl bg-green/5 border border-green/20">
            <p className="text-xs font-medium text-green mb-2">AI Output:</p>
            <p className="text-sm text-text-primary font-mono">{output}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ApplyContent2() {
  const [temp, setTemp] = useState(0.7)
  const [outputs, setOutputs] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'Once upon a time, in a land far away,' }], stream: false, temperature: temp, max_tokens: 40 }),
      })
      if (res.ok) {
        const data = await res.json()
        setOutputs(prev => [...prev, `[temp=${temp}] ${data.choices?.[0]?.message?.content}`])
      } else {
        setOutputs(prev => [...prev, `[temp=${temp}] ⚠️ AI not available`])
      }
    } catch {
      setOutputs(prev => [...prev, `[temp=${temp}] ⚠️ Connection failed`])
    }
    setGenerating(false)
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">🌡️ Temperature Experiment</h3>
      <p className="text-sm text-text-secondary mb-4">Adjust temperature and generate multiple times. Notice how higher = more creative.</p>
      <div className="mb-4">
        <label className="text-sm font-medium text-text-secondary block mb-2">Temperature: {temp}</label>
        <input type="range" min="0" max="2" step="0.1" value={temp} onChange={(e) => setTemp(parseFloat(e.target.value))} className="w-full accent-accent" />
        <div className="flex justify-between text-xs text-text-muted mt-1"><span>0 (Deterministic)</span><span>2 (Very Random)</span></div>
      </div>
      <Button onClick={generate} loading={generating} className="mb-4">Generate</Button>
      {outputs.length > 0 && (
        <div className="space-y-2">
          {outputs.map((out, i) => (
            <div key={i} className="p-3 rounded-lg bg-surface-raised text-sm text-text-secondary font-mono">{out}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function QuizContent1() {
  const [selected, setSelected] = useState<number | null>(null)
  const correct = 2

  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">✅ Check Your Understanding</h3>
      <p className="text-base font-medium text-text-primary mb-4">What does an LLM actually do?</p>
      <div className="space-y-2">
        {[
          'Understands and thinks about language',
          'Searches the internet for answers',
          'Predicts the next most likely token',
          'Translates between programming languages',
        ].map((opt, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            disabled={selected !== null}
            className={`
              w-full text-left p-4 rounded-xl border text-sm transition-all cursor-pointer
              ${selected === null ? 'border-border-subtle hover:border-accent bg-surface-raised' :
                i === correct ? 'border-green bg-green/10 text-green' :
                i === selected ? 'border-red bg-red/10 text-red' :
                'border-border-subtle bg-surface-raised opacity-50'
              }
            `}
          >
            {opt}
          </button>
        ))}
      </div>
      {selected !== null && (
        <div className="animate-fade-in mt-4">
          <div className={`p-4 rounded-xl ${selected === correct ? 'bg-green/10 border border-green/20' : 'bg-red/10 border border-red/20'}`}>
            <p className="text-sm font-semibold mb-1">{selected === correct ? '🎉 Correct! +25 XP' : '❌ Not quite!'}</p>
            <p className="text-sm text-text-secondary">LLMs predict the next most likely token based on probability patterns from training data. They don&apos;t &ldquo;understand&rdquo; or search the internet.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Simplified content for other lessons
function TokenRead1() {
  return (
    <div>
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-accent mb-1">💡 Key Concept</p>
        <p className="text-sm text-text-secondary">Tokens are the smallest unit of text that AI models work with. One token ≈ ¾ of a word in English.</p>
      </div>
      <p className="text-text-secondary leading-relaxed mb-4">When you send text to an AI, it doesn&apos;t see words — it sees <strong className="text-text-primary">tokens</strong>. &ldquo;Hello world&rdquo; = 2 tokens. &ldquo;Unbelievable&rdquo; = 3 tokens (&ldquo;un&rdquo;, &ldquo;believ&rdquo;, &ldquo;able&rdquo;).</p>
      <p className="text-text-secondary leading-relaxed mb-4">Why does this matter? Because AI models have a fixed <strong className="text-text-primary">context window</strong> — the maximum number of tokens they can process at once. GPT-4 has 128K tokens. Some models only have 4K.</p>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[
          { model: 'GPT-3.5', window: '4K tokens' },
          { model: 'GPT-4', window: '128K tokens' },
          { model: 'Claude 3', window: '200K tokens' },
          { model: 'Llama 3.1', window: '128K tokens' },
        ].map(({ model, window }) => (
          <div key={model} className="p-3 rounded-lg bg-surface-raised">
            <p className="text-sm font-semibold text-text-primary">{model}</p>
            <p className="text-xs text-text-muted">{window}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
function TokenRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Context Windows Explained</h3><p className="text-text-secondary leading-relaxed mb-4">The context window includes <strong className="text-text-primary">everything</strong> — your system prompt, conversation history, and the AI&apos;s response. When it fills up, the oldest messages get dropped.</p><p className="text-text-secondary leading-relaxed">This is why long conversations can &ldquo;forget&rdquo; earlier context. The AI isn&apos;t losing memory — the context window is simply full.</p></div> }
function TokenApply1() {
  const [text, setText] = useState('')
  const rough = Math.ceil((text.length || 0) * 0.75 / 4)
  return (
    <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Token Counter</h3><p className="text-sm text-text-secondary mb-4">Type or paste text to estimate the token count.</p><textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full p-4 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none h-32 outline-none focus:ring-2 focus:ring-accent mb-3" placeholder="Paste some text here..." /><div className="flex gap-4"><Card padding="sm"><p className="text-2xl font-bold text-accent">{rough}</p><p className="text-xs text-text-muted">≈ tokens</p></Card><Card padding="sm"><p className="text-2xl font-bold text-text-primary">{text.length}</p><p className="text-xs text-text-muted">characters</p></Card></div></div>
  )
}
function TokenQuiz() { return <QuizGeneric question="What happens when a conversation exceeds the context window?" options={['The AI crashes', 'Oldest messages are dropped', 'The AI compresses the conversation', 'Nothing — it just continues']} correct={1} explanation="When the context window fills up, the oldest tokens are dropped. The AI doesn't crash or compress — it simply can't see the early parts anymore." /> }
function CapRead() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">What AI Can and Can&apos;t Do</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><h4 className="font-semibold text-green mb-2">✅ AI Can</h4><ul className="space-y-1 text-sm text-text-secondary">{['Generate human-like text','Summarize documents','Translate languages','Write code','Analyze sentiment','Answer questions from context'].map(i => <li key={i}>• {i}</li>)}</ul></div><div><h4 className="font-semibold text-red mb-2">❌ AI Cannot</h4><ul className="space-y-1 text-sm text-text-secondary">{['Truly understand meaning','Access real-time information','Guarantee factual accuracy','Feel emotions','Learn from your conversation','Access the internet (unless given tools)'].map(i => <li key={i}>• {i}</li>)}</ul></div></div></div> }
function CapApply() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">🔬 Sort the Tasks</h3><p className="text-sm text-text-secondary mb-4">For each task below, decide: is AI good at this, or not?</p><div className="space-y-2">{[{task:'Write a poem about cats',good:true},{task:'Tell me today\'s weather',good:false},{task:'Summarize a 10-page paper',good:true},{task:'Prove a math theorem with certainty',good:false}].map(({task,good})=><div key={task} className={`p-3 rounded-lg border ${good?'border-green/20 bg-green/5':'border-red/20 bg-red/5'}`}><span className="text-sm">{good?'✅':'❌'} {task}</span></div>)}</div></div> }
function CapQuiz() { return <QuizGeneric question="Why can't AI guarantee factual accuracy?" options={['It\'s too slow','It predicts probable text, not verified facts','It doesn\'t have enough data','It\'s designed to lie']} correct={1} explanation="AI generates text based on probability patterns, not verified facts. It can produce plausible-sounding but incorrect information (hallucinations)." /> }
function PromptRead1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">The RCFT Framework</h3><p className="text-text-secondary mb-4">Every effective prompt has four components:</p><div className="space-y-3">{[{letter:'R',name:'Role',desc:'Who should the AI be? "You are a senior Python developer..."',color:'bg-purple/10 text-purple'},{letter:'C',name:'Context',desc:'What background info does the AI need?',color:'bg-blue/10 text-blue'},{letter:'F',name:'Format',desc:'How should the output look? JSON, bullet points, essay?',color:'bg-green/10 text-green'},{letter:'T',name:'Task',desc:'What exactly should the AI do?',color:'bg-orange/10 text-orange'}].map(({letter,name,desc,color})=><div key={letter} className="flex gap-3 items-start"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${color} shrink-0`}>{letter}</div><div><p className="font-semibold text-text-primary">{name}</p><p className="text-sm text-text-secondary">{desc}</p></div></div>)}</div></div> }
function PromptRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">System vs User Prompts</h3><p className="text-text-secondary mb-4"><strong className="text-text-primary">System prompt:</strong> Sets the AI&apos;s persona and rules. Sent once at the start. &ldquo;You are a helpful science tutor for 10-year-olds.&rdquo;</p><p className="text-text-secondary mb-4"><strong className="text-text-primary">User prompt:</strong> Your actual question or task. &ldquo;Explain how rainbows work.&rdquo;</p><div className="p-4 rounded-xl bg-surface-raised border border-border-subtle font-mono text-sm"><p className="text-purple mb-1">System: You are a helpful science tutor for 10-year-olds.</p><p className="text-blue mb-1">User: Explain how rainbows work.</p><p className="text-green">Assistant: Imagine sunlight is actually made up of many colors mixed together...</p></div></div> }
function PromptApply() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Build Your First Prompt</h3><p className="text-sm text-text-secondary mb-4">Use the RCFT framework to build a prompt. Fill in each section:</p><div className="space-y-3">{[{label:'Role',placeholder:'You are a...'},{label:'Context',placeholder:'The user needs help with...'},{label:'Format',placeholder:'Respond in...'},{label:'Task',placeholder:'Please...'}].map(({label,placeholder})=><div key={label}><label className="text-sm font-medium text-text-secondary mb-1 block">{label}</label><input className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" placeholder={placeholder}/></div>)}</div></div> }
function PromptQuiz() { return <QuizGeneric question="What is the purpose of a system prompt?" options={['To ask the AI a question','To set the AI\'s persona and rules','To get the AI to search the web','To format the output']} correct={1} explanation="System prompts set the AI's behavior, personality, and rules. They run before any user message and shape all subsequent responses." /> }

// Reusable quiz component
function QuizGeneric({ question, options, correct, explanation }: { question: string; options: string[]; correct: number; explanation: string }) {
  const [selected, setSelected] = useState<number | null>(null)
  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">✅ Quick Quiz</h3>
      <p className="text-base font-medium text-text-primary mb-4">{question}</p>
      <div className="space-y-2">{options.map((opt, i) => (
        <button key={i} onClick={() => setSelected(i)} disabled={selected !== null} className={`w-full text-left p-4 rounded-xl border text-sm transition-all cursor-pointer ${selected === null ? 'border-border-subtle hover:border-accent bg-surface-raised' : i === correct ? 'border-green bg-green/10 text-green' : i === selected ? 'border-red bg-red/10 text-red' : 'border-border-subtle bg-surface-raised opacity-50'}`}>{opt}</button>
      ))}</div>
      {selected !== null && <div className="animate-fade-in mt-4"><div className={`p-4 rounded-xl ${selected === correct ? 'bg-green/10 border border-green/20' : 'bg-red/10 border border-red/20'}`}><p className="text-sm font-semibold mb-1">{selected === correct ? '🎉 Correct! +25 XP' : '❌ Not quite!'}</p><p className="text-sm text-text-secondary">{explanation}</p></div></div>}
    </div>
  )
}

// Expandable deep dive
function DeepDive({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border-subtle rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-raised transition-colors cursor-pointer">
        <span className="text-sm font-medium text-text-primary">🔍 {title}</span>
        {open ? <ChevronUp size={16} className="text-text-muted" /> : <ChevronDown size={16} className="text-text-muted" />}
      </button>
      {open && <div className="animate-fade-in"><div className="px-4 pb-4">{children}</div></div>}
    </div>
  )
}

// ===========================
// MODULE 2: PROMPT ENGINEERING (remaining lessons)
// ===========================

function FewShotRead1() {
  return (
    <div>
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-accent mb-1">💡 Key Concept</p>
        <p className="text-sm text-text-secondary"><strong>Zero-shot</strong> = asking AI to do something without any examples. <strong>Few-shot</strong> = providing examples of what you want.</p>
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-4">Zero-Shot Prompting</h3>
      <p className="text-text-secondary leading-relaxed mb-4">When you simply ask the AI to do something without showing it examples, that&apos;s zero-shot. The AI relies entirely on its training data to understand your request.</p>
      <div className="p-4 rounded-xl bg-surface-raised font-mono text-sm mb-4">
        <p className="text-text-muted mb-1">{'// Zero-shot example:'}</p>
        <p className="text-green">&ldquo;Classify this review as positive or negative: &apos;The food was amazing!&apos;&rdquo;</p>
      </div>
      <p className="text-text-secondary leading-relaxed">Zero-shot works surprisingly well for common tasks because LLMs have seen millions of similar patterns during training.</p>
    </div>
  )
}

function FewShotRead2() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-4">Few-Shot Learning</h3>
      <p className="text-text-secondary leading-relaxed mb-4">Few-shot means giving the AI 2-5 examples of the input→output pattern you want before your actual request. This dramatically improves accuracy for custom tasks.</p>
      <div className="p-4 rounded-xl bg-surface-raised font-mono text-sm mb-4 space-y-2">
        <p className="text-text-muted">{'// Few-shot example:'}</p>
        <p className="text-blue">&ldquo;Classify sentiment:</p>
        <p className="text-green">Review: &apos;Great product!&apos; → Positive</p>
        <p className="text-green">Review: &apos;Terrible service&apos; → Negative</p>
        <p className="text-green">Review: &apos;It was okay&apos; → Neutral</p>
        <p className="text-blue">Review: &apos;Best purchase ever!&apos; → &rdquo;</p>
      </div>
      <div className="space-y-2">
        {[
          { n: '1-shot', desc: 'One example. Good for simple patterns.' },
          { n: '3-shot', desc: 'Three examples. Sweet spot for most tasks.' },
          { n: '5-shot', desc: 'Five examples. Best for complex/ambiguous tasks.' },
        ].map(({ n, desc }) => (
          <div key={n} className="flex gap-3 p-3 rounded-lg bg-surface-raised">
            <span className="text-sm font-semibold text-accent shrink-0">{n}</span>
            <span className="text-sm text-text-secondary">{desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FewShotApply1() {
  const [zeroResult, setZeroResult] = useState('')
  const [fewResult, setFewResult] = useState('')
  const [generating, setGenerating] = useState(false)

  const runComparison = async () => {
    setGenerating(true)
    try {
      const zeroRes = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'Extract the product name and price from this text: "I bought the Sony WH-1000XM5 headphones for $348 yesterday"' }], stream: false, max_tokens: 100 }),
      })
      const fewRes = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'Extract product name and price:\nText: "Got a MacBook Pro for $1999" → Product: MacBook Pro, Price: $1999\nText: "Bought AirPods at $249" → Product: AirPods, Price: $249\nText: "I bought the Sony WH-1000XM5 headphones for $348 yesterday" →' }], stream: false, max_tokens: 100 }),
      })
      if (zeroRes.ok) { const d = await zeroRes.json(); setZeroResult(d.choices?.[0]?.message?.content || 'No response') }
      else setZeroResult('⚠️ AI not available')
      if (fewRes.ok) { const d = await fewRes.json(); setFewResult(d.choices?.[0]?.message?.content || 'No response') }
      else setFewResult('⚠️ AI not available')
    } catch { setZeroResult('⚠️ Connection failed'); setFewResult('⚠️ Connection failed') }
    setGenerating(false)
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Zero-Shot vs Few-Shot Comparison</h3>
      <p className="text-sm text-text-secondary mb-4">Click to run the same task with zero-shot and few-shot prompting side by side.</p>
      <Button onClick={runComparison} loading={generating} className="mb-4">Run Comparison</Button>
      {(zeroResult || fewResult) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-orange/5 border border-orange/20">
            <p className="text-xs font-medium text-orange mb-2">Zero-Shot:</p>
            <p className="text-sm text-text-secondary font-mono">{zeroResult}</p>
          </div>
          <div className="p-4 rounded-xl bg-green/5 border border-green/20">
            <p className="text-xs font-medium text-green mb-2">Few-Shot (2 examples):</p>
            <p className="text-sm text-text-secondary font-mono">{fewResult}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function FewShotApply2() {
  const [task, setTask] = useState('')
  const [examples, setExamples] = useState('')
  const [testInput, setTestInput] = useState('')
  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Build a Few-Shot Prompt</h3>
      <p className="text-sm text-text-secondary mb-4">Design your own few-shot prompt for any classification or extraction task.</p>
      <div className="space-y-3">
        <div><label className="text-sm font-medium text-text-secondary mb-1 block">Task Description</label><input value={task} onChange={(e) => setTask(e.target.value)} className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="e.g., Classify emails as spam or not spam" /></div>
        <div><label className="text-sm font-medium text-text-secondary mb-1 block">Examples (one per line, input → output)</label><textarea value={examples} onChange={(e) => setExamples(e.target.value)} className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-accent" placeholder={'"Win a free iPhone!" → Spam\n"Meeting at 3pm tomorrow" → Not Spam'} /></div>
        <div><label className="text-sm font-medium text-text-secondary mb-1 block">Test Input</label><input value={testInput} onChange={(e) => setTestInput(e.target.value)} className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="Your test case to classify" /></div>
      </div>
      {task && examples && testInput && (
        <div className="mt-4 p-4 rounded-xl bg-accent/5 border border-accent/20">
          <p className="text-xs font-medium text-accent mb-2">Your Few-Shot Prompt:</p>
          <pre className="text-sm text-text-secondary font-mono whitespace-pre-wrap">{`${task}:\n${examples}\n${testInput} →`}</pre>
        </div>
      )}
    </div>
  )
}
function FewShotQuiz() { return <QuizGeneric question="When should you use few-shot over zero-shot?" options={['Always — few-shot is strictly better', 'When the task has a specific format the AI might not guess', 'Only when the AI gives wrong answers', 'Never — zero-shot is sufficient']} correct={1} explanation="Few-shot is most valuable when you need a specific output format or the task is unusual. For common tasks, zero-shot often works fine." /> }

function CoTRead1() {
  return (
    <div>
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-accent mb-1">💡 Key Concept</p>
        <p className="text-sm text-text-secondary">Chain-of-Thought (CoT) prompting forces the AI to &ldquo;think step by step&rdquo; before giving a final answer, dramatically improving accuracy on reasoning tasks.</p>
      </div>
      <p className="text-text-secondary leading-relaxed mb-4">Without CoT, an AI might jump to an answer. With CoT, it breaks down the problem:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-red/5 border border-red/20">
          <p className="text-xs font-medium text-red mb-2">❌ Without CoT:</p>
          <p className="text-sm font-mono text-text-secondary">&ldquo;If I have 3 apples and buy 2 bags of 6, how many do I have?&rdquo;</p>
          <p className="text-sm font-mono text-text-muted mt-1">→ &ldquo;18&rdquo; (wrong!)</p>
        </div>
        <div className="p-4 rounded-xl bg-green/5 border border-green/20">
          <p className="text-xs font-medium text-green mb-2">✅ With CoT:</p>
          <p className="text-sm font-mono text-text-secondary">&ldquo;Think step by step...&rdquo;</p>
          <p className="text-sm font-mono text-text-muted mt-1">→ &ldquo;3 + (2×6) = 3 + 12 = 15&rdquo;</p>
        </div>
      </div>
    </div>
  )
}

function CoTRead2() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-4">When to Use Chain-of-Thought</h3>
      <div className="space-y-2">
        {[
          { task: 'Math & logic problems', good: true },
          { task: 'Multi-step reasoning', good: true },
          { task: 'Code debugging', good: true },
          { task: 'Simple factual questions', good: false },
          { task: 'Creative writing', good: false },
          { task: 'Translation', good: false },
        ].map(({ task, good }) => (
          <div key={task} className={`p-3 rounded-lg border ${good ? 'border-green/20 bg-green/5' : 'border-red/20 bg-red/5'}`}>
            <span className="text-sm">{good ? '✅ Great for:' : '⚠️ Not needed for:'} {task}</span>
          </div>
        ))}
      </div>
      <DeepDive title="The magic phrase">
        <p className="text-sm text-text-secondary">Studies show that simply adding &ldquo;Let&apos;s think step by step&rdquo; to any prompt improves accuracy by 10-40% on reasoning tasks. This is called &ldquo;zero-shot CoT.&rdquo;</p>
      </DeepDive>
    </div>
  )
}

function CoTApply1() {
  const [prompt, setPrompt] = useState('')
  const [output, setOutput] = useState('')
  const [generating, setGenerating] = useState(false)
  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: prompt + '\n\nLet\'s think step by step:' }], stream: false, max_tokens: 200 }) })
      if (res.ok) { const d = await res.json(); setOutput(d.choices?.[0]?.message?.content || 'No response') }
      else setOutput('⚠️ AI not available')
    } catch { setOutput('⚠️ Connection failed') }
    setGenerating(false)
  }
  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Add Chain-of-Thought</h3>
      <p className="text-sm text-text-secondary mb-4">Enter a reasoning problem. We&apos;ll automatically add &ldquo;Let&apos;s think step by step&rdquo; and see how the AI breaks it down.</p>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full p-4 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-accent mb-3" placeholder="Enter a reasoning problem, e.g., 'A store has 15 items. 3 customers each buy 2 items, then a delivery adds 10 more items. How many items are in the store?'" />
      <Button onClick={generate} loading={generating} className="mb-4">Generate with CoT</Button>
      {output && <div className="p-4 rounded-xl bg-green/5 border border-green/20"><p className="text-xs font-medium text-green mb-2">Step-by-Step Reasoning:</p><pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono">{output}</pre></div>}
    </div>
  )
}
function CoTApply2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Compare: With vs Without CoT</h3><p className="text-sm text-text-secondary mb-4">Try the same problem both ways. Notice how step-by-step reasoning catches errors that direct answering misses.</p><div className="space-y-3"><div className="p-4 rounded-xl bg-surface-raised"><p className="text-sm font-medium text-text-primary mb-2">Practice Problem:</p><p className="text-sm text-text-secondary">&ldquo;A farmer has 17 sheep. All but 9 run away. How many sheep does the farmer have left?&rdquo;</p><p className="text-xs text-text-muted mt-2">Common wrong answer: 8. Correct answer: 9 (&ldquo;all but 9&rdquo; means 9 remain).</p></div></div></div> }
function CoTQuiz() { return <QuizGeneric question="What does 'zero-shot CoT' mean?" options={['Using chain-of-thought with no examples', 'Giving zero examples and no reasoning', 'Asking the AI to not think', 'Chain-of-thought that fails']} correct={0} explanation="Zero-shot CoT means simply adding 'Let's think step by step' without providing worked examples. It's surprisingly effective at improving reasoning accuracy." /> }

function AdvRead1() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-4">Tree-of-Thought (ToT)</h3>
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-4">
        <p className="text-sm text-text-secondary">ToT explores multiple reasoning paths simultaneously, like a chess player considering different moves. It evaluates each path and picks the best one.</p>
      </div>
      <div className="p-4 rounded-xl bg-surface-raised font-mono text-sm">
        <p className="text-text-muted mb-2">{'// Tree-of-Thought prompt:'}</p>
        <p className="text-green">&ldquo;Consider 3 different approaches to [problem].</p>
        <p className="text-green">For each approach, think through 2-3 steps.</p>
        <p className="text-green">Evaluate which approach is most promising.</p>
        <p className="text-green">Continue with the best approach.&rdquo;</p>
      </div>
    </div>
  )
}
function AdvRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Self-Consistency</h3><p className="text-text-secondary mb-4">Generate multiple answers to the same question with higher temperature, then pick the most common answer. Like asking 5 experts and going with the majority.</p><div className="space-y-2">{[{ step: '1', desc: 'Ask the same question 3-5 times' }, { step: '2', desc: 'Use temperature 0.7-1.0 for variety' }, { step: '3', desc: 'Check which answer appears most often' }, { step: '4', desc: 'The majority answer is usually correct' }].map(({ step, desc }) => (<div key={step} className="flex gap-3 items-center p-3 rounded-lg bg-surface-raised"><div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm shrink-0">{step}</div><span className="text-sm text-text-secondary">{desc}</span></div>))}</div></div> }
function AdvRead3() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Meta-Prompting</h3><p className="text-text-secondary mb-4">Ask the AI to write its own prompt. This leverages the model&apos;s understanding of what makes a good prompt.</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm mb-4"><p className="text-blue">&ldquo;You are a prompt engineering expert.</p><p className="text-blue">Write the perfect prompt for: [task description]</p><p className="text-blue">Include: role, context, format, and examples.&rdquo;</p></div><p className="text-text-secondary text-sm">This is surprisingly effective — AI models can often write better prompts than humans because they understand their own processing patterns.</p></div> }
function AdvApply1() {
  const [problem, setProblem] = useState('')
  const [output, setOutput] = useState('')
  const [generating, setGenerating] = useState(false)
  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: `Consider 3 different approaches to solving this problem:\n\n${problem}\n\nFor each approach:\n1. Describe the approach in one sentence\n2. Think through 2-3 steps\n3. Note potential issues\n\nThen pick the best approach and provide the final answer.` }], stream: false, max_tokens: 400 }) })
      if (res.ok) { const d = await res.json(); setOutput(d.choices?.[0]?.message?.content || 'No response') }
      else setOutput('⚠️ AI not available')
    } catch { setOutput('⚠️ Connection failed') }
    setGenerating(false)
  }
  return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Try Tree-of-Thought</h3><p className="text-sm text-text-secondary mb-4">Enter a complex problem and watch the AI explore multiple solution paths.</p><textarea value={problem} onChange={(e) => setProblem(e.target.value)} className="w-full p-4 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-accent mb-3" placeholder="e.g., 'How should a small business decide between hiring an employee vs. using AI tools?'" /><Button onClick={generate} loading={generating} className="mb-4">Explore Paths</Button>{output && <div className="p-4 rounded-xl bg-green/5 border border-green/20"><p className="text-xs font-medium text-green mb-2">Tree-of-Thought Output:</p><pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono">{output}</pre></div>}</div>
}
function AdvApply2() {
  const [task, setTask] = useState('')
  const [output, setOutput] = useState('')
  const [generating, setGenerating] = useState(false)
  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: `You are a world-class prompt engineering expert. Write the perfect prompt for the following task. Include a role, detailed context, specific format requirements, and 2 few-shot examples.\n\nTask: ${task}` }], stream: false, max_tokens: 400 }) })
      if (res.ok) { const d = await res.json(); setOutput(d.choices?.[0]?.message?.content || 'No response') }
      else setOutput('⚠️ AI not available')
    } catch { setOutput('⚠️ Connection failed') }
    setGenerating(false)
  }
  return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Meta-Prompting: AI Writes Your Prompt</h3><p className="text-sm text-text-secondary mb-4">Describe a task and let the AI write an optimized prompt for it.</p><input value={task} onChange={(e) => setTask(e.target.value)} className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent mb-3" placeholder="e.g., 'Summarize medical research papers for patients'" /><Button onClick={generate} loading={generating} className="mb-4">Generate Prompt</Button>{output && <div className="p-4 rounded-xl bg-accent/5 border border-accent/20"><p className="text-xs font-medium text-accent mb-2">AI-Generated Prompt:</p><pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono">{output}</pre></div>}</div>
}
function AdvQuiz() { return <QuizGeneric question="What is the key advantage of Tree-of-Thought over Chain-of-Thought?" options={['It uses less tokens', 'It explores multiple reasoning paths before choosing', 'It works without a model', 'It is faster']} correct={1} explanation="Tree-of-Thought explores multiple reasoning paths simultaneously and evaluates which is most promising, while Chain-of-Thought follows a single linear path." /> }

// ===========================
// MODULE 3: AI TOOLS ECOSYSTEM
// ===========================

function ToolsRead1() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-4">The Big Players</h3>
      <div className="space-y-3">
        {[
          { name: 'ChatGPT (OpenAI)', model: 'GPT-4o', strengths: 'All-rounder, plugins, vision, coding', color: 'bg-green/10 text-green' },
          { name: 'Claude (Anthropic)', model: 'Claude 3.5 Sonnet', strengths: 'Long context (200K), safety-focused, analysis', color: 'bg-purple/10 text-purple' },
          { name: 'Gemini (Google)', model: 'Gemini 1.5 Pro', strengths: 'Multimodal, Google integration, 1M context', color: 'bg-blue/10 text-blue' },
          { name: 'Llama (Meta)', model: 'Llama 3.1 405B', strengths: 'Open source, runs locally, customizable', color: 'bg-orange/10 text-orange' },
          { name: 'Mistral', model: 'Mixtral 8x22B', strengths: 'Efficient, multilingual, open weights', color: 'bg-cyan/10 text-cyan' },
        ].map(({ name, model, strengths, color }) => (
          <div key={name} className="p-4 rounded-xl bg-surface-raised">
            <div className="flex items-center gap-2 mb-1"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{model}</span></div>
            <p className="text-sm font-semibold text-text-primary">{name}</p>
            <p className="text-xs text-text-muted mt-1">{strengths}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
function ToolsRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Comparing Capabilities</h3><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border-subtle">{['Feature','ChatGPT','Claude','Gemini'].map(h=><th key={h} className="text-left p-2 text-text-muted font-medium">{h}</th>)}</tr></thead><tbody>{[['Vision','✅','✅','✅'],['Code','⭐⭐⭐','⭐⭐⭐','⭐⭐'],['Context','128K','200K','1M'],['Plugins','✅','❌','✅'],['Price','$20/mo','$20/mo','$20/mo'],['Open Source','❌','❌','❌']].map(([f,...vals])=><tr key={f} className="border-b border-border-subtle/50"><td className="p-2 text-text-primary font-medium">{f}</td>{vals.map((v,i)=><td key={i} className="p-2 text-text-secondary">{v}</td>)}</tr>)}</tbody></table></div></div> }
function ToolsApply1() {
  const [selected, setSelected] = useState<Record<string, string>>({})
  const scenarios = [
    { task: 'Analyze a 300-page legal document', best: 'Claude', why: 'Longest context window (200K tokens)' },
    { task: 'Generate code with web browsing', best: 'ChatGPT', why: 'Best plugin ecosystem + strong coding' },
    { task: 'Run AI privately on your laptop', best: 'Llama', why: 'Open source, runs locally via Ollama' },
    { task: 'Analyze images and video', best: 'Gemini', why: 'Best multimodal capabilities + Google integration' },
  ]
  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Match the Tool to the Task</h3>
      <p className="text-sm text-text-secondary mb-4">For each scenario, pick the best AI tool. Click to reveal the answer.</p>
      <div className="space-y-3">
        {scenarios.map(({ task, best, why }) => (
          <div key={task} className="p-4 rounded-xl bg-surface-raised">
            <p className="text-sm font-medium text-text-primary mb-2">{task}</p>
            {selected[task] ? (
              <div className="p-3 rounded-lg bg-green/5 border border-green/20">
                <p className="text-xs font-medium text-green">Best: {best}</p>
                <p className="text-xs text-text-muted">{why}</p>
              </div>
            ) : (
              <button onClick={() => setSelected(prev => ({...prev, [task]: best}))} className="text-xs text-accent hover:underline cursor-pointer">Reveal answer →</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
function ToolsQuiz1() { return <QuizGeneric question="Which AI tool currently has the largest context window?" options={['ChatGPT (128K)', 'Claude (200K)', 'Gemini (1M+)', 'Llama (128K)']} correct={2} explanation="Google's Gemini 1.5 Pro supports up to 1 million tokens of context, the largest among major AI tools." /> }

function SpecToolsRead1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Writing & Content Tools</h3><div className="space-y-2">{[{name:'Jasper',use:'Marketing copy, blog posts, social media',tier:'Premium ($49/mo)'},{name:'Copy.ai',use:'Email sequences, product descriptions',tier:'Freemium'},{name:'Grammarly',use:'Grammar, tone, clarity improvement',tier:'Freemium'},{name:'Notion AI',use:'Note-taking, summarization, brainstorming',tier:'Add-on ($8/mo)'},{name:'Otter.ai',use:'Meeting transcription, summaries',tier:'Freemium'}].map(({name,use,tier})=><div key={name} className="p-3 rounded-lg bg-surface-raised"><p className="text-sm font-semibold text-text-primary">{name} <span className="text-xs text-text-muted font-normal">— {tier}</span></p><p className="text-xs text-text-secondary">{use}</p></div>)}</div></div> }
function SpecToolsRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Coding & Design Tools</h3><div className="space-y-2">{[{name:'GitHub Copilot',use:'Code completion, chat, PR reviews',tier:'$10/mo'},{name:'Cursor',use:'AI-first code editor, whole-file editing',tier:'Freemium'},{name:'v0.dev',use:'Generate React UIs from text descriptions',tier:'Free'},{name:'Midjourney',use:'Artistic image generation from prompts',tier:'$10/mo'},{name:'Canva AI',use:'Design templates, image editing, branding',tier:'Freemium'}].map(({name,use,tier})=><div key={name} className="p-3 rounded-lg bg-surface-raised"><p className="text-sm font-semibold text-text-primary">{name} <span className="text-xs text-text-muted font-normal">— {tier}</span></p><p className="text-xs text-text-secondary">{use}</p></div>)}</div></div> }
function SpecToolsApply() {
  const [scenario, setScenario] = useState('')
  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">🔬 AI Tool Selector</h3>
      <p className="text-sm text-text-secondary mb-4">Describe what you need to accomplish, and think about which specialized tool would be best.</p>
      <textarea value={scenario} onChange={(e) => setScenario(e.target.value)} className="w-full p-4 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none h-24 outline-none focus:ring-2 focus:ring-accent mb-3" placeholder="e.g., 'I need to create marketing emails for a product launch'" />
      {scenario.length > 20 && <div className="p-4 rounded-xl bg-accent/5 border border-accent/20"><p className="text-xs font-medium text-accent mb-2">💡 Consider:</p><p className="text-sm text-text-secondary">For your task, think about: (1) Is it writing, coding, or design? (2) Do you need a specialized tool or a general chatbot? (3) What&apos;s your budget? Free tools like ChatGPT can handle most tasks, but specialized tools offer better workflows.</p></div>}
    </div>
  )
}
function SpecToolsQuiz() { return <QuizGeneric question="What is GitHub Copilot primarily used for?" options={['Image generation', 'Code completion and AI coding assistance', 'Meeting transcription', 'Marketing copy']} correct={1} explanation="GitHub Copilot is an AI coding assistant that provides code completion, chat-based help, and code review directly in your editor." /> }

function ChooseRead() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Decision Framework</h3><p className="text-text-secondary mb-4">Use this 4-step framework to pick the right AI tool:</p><div className="space-y-3">{[{step:'1. Define the Task',desc:'What exactly do you need? Writing, coding, analysis, images?',color:'bg-purple/10 text-purple'},{step:'2. Check Constraints',desc:'Budget, privacy needs, volume, integration requirements?',color:'bg-blue/10 text-blue'},{step:'3. Match Capabilities',desc:'Which tools support your specific needs?',color:'bg-green/10 text-green'},{step:'4. Test & Compare',desc:'Try 2-3 options with the same task. Pick what works best.',color:'bg-orange/10 text-orange'}].map(({step,desc,color})=><div key={step} className="flex gap-3 items-start p-3 rounded-lg bg-surface-raised"><div className={`px-2 py-1 rounded-lg text-xs font-medium ${color} shrink-0`}>{step.split('.')[0]}</div><div><p className="text-sm font-semibold text-text-primary">{step.split('. ')[1]}</p><p className="text-xs text-text-secondary">{desc}</p></div></div>)}</div></div> }
function ChooseApply() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Tool Advisor Exercise</h3><p className="text-sm text-text-secondary mb-4">For each scenario, apply the decision framework:</p><div className="space-y-3">{[{s:'A student writing a thesis',tip:'Budget: Free → ChatGPT/Claude free tiers. Need: Long-form writing + research.'},{s:'A startup building an AI chatbot',tip:'Budget: Variable → OpenAI API for flexibility. Need: API access + customization.'},{s:'A designer creating social media posts',tip:'Budget: Moderate → Canva AI for templates + Midjourney for unique images.'}].map(({s,tip})=><div key={s} className="p-4 rounded-xl bg-surface-raised"><p className="text-sm font-medium text-text-primary mb-2">{s}</p><p className="text-xs text-text-muted">{tip}</p></div>)}</div></div> }
function ChooseQuiz() { return <QuizGeneric question="What should be your FIRST step when choosing an AI tool?" options={['Find the cheapest option', 'Define exactly what task you need done', 'Ask a friend what they use', 'Try every tool available']} correct={1} explanation="Always start by clearly defining your task. Different tasks (writing vs coding vs images) require different tools, so knowing what you need narrows the field immediately." /> }

// ===========================
// MODULE 4: BUILDING WITH APIs
// ===========================

function APIRead1() { return <div><div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6"><p className="text-sm font-medium text-accent mb-1">💡 Key Concept</p><p className="text-sm text-text-secondary">An API (Application Programming Interface) lets two programs talk to each other. Think of it as a waiter taking your order to the kitchen.</p></div><p className="text-text-secondary leading-relaxed mb-4">When you use ChatGPT&apos;s website, you&apos;re using a UI. When you call the OpenAI API from code, you&apos;re going straight to the kitchen. APIs let you build custom AI-powered apps.</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm"><p className="text-text-muted">{'// Your app → API request → AI model → API response → Your app'}</p><p className="text-green mt-2">fetch(&apos;https://api.openai.com/v1/chat/completions&apos;, {'{'}</p><p className="text-green ml-4">method: &apos;POST&apos;,</p><p className="text-green ml-4">body: JSON.stringify({'{'} messages: [...] {'}'})</p><p className="text-green">{'}'})</p></div></div> }
function APIRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">HTTP Methods & Headers</h3><div className="space-y-2">{[{method:'GET',desc:'Retrieve data (list models, check health)',color:'text-green'},{method:'POST',desc:'Send data and get a response (chat, generate)',color:'text-blue'},{method:'PUT',desc:'Update existing data',color:'text-orange'},{method:'DELETE',desc:'Remove data',color:'text-red'}].map(({method,desc,color})=><div key={method} className="flex gap-3 p-3 rounded-lg bg-surface-raised"><span className={`text-sm font-bold font-mono ${color} shrink-0 w-16`}>{method}</span><span className="text-sm text-text-secondary">{desc}</span></div>)}</div><div className="mt-4 p-4 rounded-xl bg-surface-raised font-mono text-sm"><p className="text-text-muted mb-1">{'// Common Headers:'}</p><p className="text-green">&apos;Content-Type&apos;: &apos;application/json&apos;</p><p className="text-green">&apos;Authorization&apos;: &apos;Bearer sk-...&apos;</p></div></div> }
function APIRead3() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Authentication</h3><p className="text-text-secondary mb-4">Most AI APIs use <strong className="text-text-primary">API keys</strong> — secret strings that identify your account. Never expose them in client-side code!</p><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div className="p-4 rounded-xl bg-red/5 border border-red/20"><p className="text-xs font-medium text-red mb-2">❌ NEVER do this:</p><p className="text-xs font-mono text-text-secondary">const key = &apos;sk-abc123...&apos;</p><p className="text-xs text-text-muted mt-1">Exposed in browser = stolen</p></div><div className="p-4 rounded-xl bg-green/5 border border-green/20"><p className="text-xs font-medium text-green mb-2">✅ Do this instead:</p><p className="text-xs font-mono text-text-secondary">{'// Use server-side proxy'}</p><p className="text-xs font-mono text-text-secondary">{'// Store in .env file'}</p><p className="text-xs text-text-muted mt-1">Key stays on server</p></div></div></div> }
function APIApply() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Make an API Call</h3><p className="text-sm text-text-secondary mb-4">This is what a real API call to Groq looks like from code. Our app already uses this pattern!</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm whitespace-pre-wrap text-text-secondary">{`// Example: Call Groq's API
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'user', content: 'Explain APIs in one sentence' }
    ]
  })
});
const data = await response.json();
console.log(data.content);`}</div><p className="text-xs text-text-muted mt-3">This is the exact pattern AIcademy uses to talk to the Groq API.</p></div> }
function APIQuiz() { return <QuizGeneric question="Why should API keys never be in client-side JavaScript?" options={['They slow down the browser', 'Anyone can see them in browser dev tools', 'They only work on servers', 'Browsers block them automatically']} correct={1} explanation="Client-side code is visible to anyone using the browser's dev tools. API keys in client code can be stolen and used to make unauthorized requests on your account." /> }

function AIAPIRead1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Chat Completions API</h3><p className="text-text-secondary mb-4">The most common AI API pattern: send an array of messages, get a response.</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm whitespace-pre-wrap text-text-secondary">{`{
  "model": "gpt-4o",
  "messages": [
    { "role": "system", "content": "You are helpful." },
    { "role": "user", "content": "Hi!" },
    { "role": "assistant", "content": "Hello!" },
    { "role": "user", "content": "What's 2+2?" }
  ],
  "temperature": 0.7,
  "max_tokens": 100
}`}</div><div className="mt-4 space-y-1">{[{role:'system',desc:'Sets behavior (sent once)'},{role:'user',desc:'Human messages'},{role:'assistant',desc:'Previous AI responses (for context)'}].map(({role,desc})=><div key={role} className="flex gap-2 text-sm"><span className="text-accent font-mono">{role}:</span><span className="text-text-secondary">{desc}</span></div>)}</div></div> }
function AIAPIRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Streaming Responses</h3><p className="text-text-secondary mb-4">Instead of waiting for the full response, streaming sends tokens as they&apos;re generated. This is how chatbots show text appearing word-by-word.</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm mb-4"><p className="text-text-muted">{'// Non-streaming: wait 5 seconds, get full response'}</p><p className="text-green">stream: false → {'{'} &quot;response&quot;: &quot;Hello! How can I...&quot; {'}'}</p><p className="text-text-muted mt-2">{'// Streaming: get tokens instantly'}</p><p className="text-green">stream: true → &quot;Hello&quot; → &quot;!&quot; → &quot; How&quot; → &quot; can&quot; → ...</p></div><p className="text-xs text-text-muted">AIcademy&apos;s AI Tutor uses streaming with buffered rendering to prevent re-render storms.</p></div> }
function AIAPIRead3() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Function Calling</h3><p className="text-text-secondary mb-4">Some APIs let the AI &ldquo;call functions&rdquo; — it decides when to use tools you define.</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm whitespace-pre-wrap text-text-secondary">{`// Define tools:
"tools": [{
  "type": "function",
  "function": {
    "name": "get_weather",
    "parameters": {
      "location": "string"
    }
  }
}]

// AI decides to call it:
"tool_calls": [{
  "function": {
    "name": "get_weather",
    "arguments": '{"location": "Tokyo"}'
  }
}]`}</div></div> }
function AIAPIApply() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 API Playground</h3><p className="text-sm text-text-secondary mb-4">Understand the anatomy of an API request by examining each part:</p><div className="space-y-3">{[{label:'Endpoint',value:'/api/ai/chat',desc:'Where to send the request'},{label:'Method',value:'POST',desc:'Sending data to the server'},{label:'Content-Type',value:'application/json',desc:'Telling the server we send JSON'},{label:'Body',value:'{ model, messages, stream }',desc:'The actual data'}].map(({label,value,desc})=><div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised"><span className="text-sm font-semibold text-accent w-28 shrink-0">{label}</span><span className="text-sm font-mono text-text-primary">{value}</span><span className="text-xs text-text-muted ml-auto">{desc}</span></div>)}</div></div> }
function AIAPIQuiz() { return <QuizGeneric question="What is the advantage of streaming API responses?" options={['Uses less bandwidth', 'User sees text appearing immediately instead of waiting', 'Is more accurate', 'Costs less money']} correct={1} explanation="Streaming shows tokens as they're generated, giving users immediate feedback instead of waiting for the complete response. This dramatically improves perceived performance." /> }

function BuildRead1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Architecture Patterns</h3><p className="text-text-secondary mb-4">AI-powered apps follow predictable patterns:</p><div className="space-y-2">{[{pattern:'Proxy Pattern',desc:'Client → Your Server → AI API. Hides API keys, adds logging.',icon:'🔀'},{pattern:'Queue Pattern',desc:'Requests queue up for processing. Handles rate limits gracefully.',icon:'📋'},{pattern:'Cache Pattern',desc:'Store common responses to reduce API calls and costs.',icon:'💾'},{pattern:'Fallback Pattern',desc:'If primary AI fails, fall back to a cheaper/smaller model.',icon:'🔄'}].map(({pattern,desc,icon})=><div key={pattern} className="flex gap-3 p-3 rounded-lg bg-surface-raised"><span className="text-xl">{icon}</span><div><p className="text-sm font-semibold text-text-primary">{pattern}</p><p className="text-xs text-text-secondary">{desc}</p></div></div>)}</div></div> }
function BuildRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Caching & Rate Limiting</h3><p className="text-text-secondary mb-4">AI API calls are expensive. Smart caching can cut costs by 50-80%:</p><div className="space-y-2">{[{strategy:'Exact Match Cache',desc:'If the same prompt is sent twice, return the cached response.',savings:'High'},{strategy:'Semantic Cache',desc:'If a SIMILAR prompt was sent, return cached. Needs embeddings.',savings:'Medium'},{strategy:'TTL Cache',desc:'Cache expires after N minutes. Good for time-sensitive data.',savings:'Variable'}].map(({strategy,desc,savings})=><div key={strategy} className="p-3 rounded-lg bg-surface-raised"><p className="text-sm font-semibold text-text-primary">{strategy} <span className="text-xs text-green">({savings} savings)</span></p><p className="text-xs text-text-secondary">{desc}</p></div>)}</div></div> }
function BuildRead3() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Error Handling</h3><p className="text-text-secondary mb-4">AI APIs can fail in unique ways. Handle them gracefully:</p><div className="space-y-2">{[{error:'429 Rate Limit',action:'Exponential backoff: wait 1s, 2s, 4s, 8s...',color:'text-orange'},{error:'500 Server Error',action:'Retry up to 3 times, then fall back to backup model',color:'text-red'},{error:'Timeout',action:'Set 30s timeout, show partial results if streaming',color:'text-gold'},{error:'Invalid Response',action:'Validate JSON structure, retry with clearer prompt',color:'text-blue'}].map(({error,action,color})=><div key={error} className="flex gap-3 p-3 rounded-lg bg-surface-raised"><span className={`text-sm font-mono font-bold ${color} shrink-0 w-32`}>{error}</span><span className="text-sm text-text-secondary">{action}</span></div>)}</div></div> }
function BuildApply1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Design an AI App Architecture</h3><p className="text-sm text-text-secondary mb-4">Plan the architecture for an AI-powered customer support chatbot:</p><div className="space-y-3">{['What pattern would you use? (Proxy, Queue, Cache, Fallback)','Where should the API key be stored?','How would you handle rate limits?','What fallback would you use if the primary model is down?'].map((q,i)=><div key={i}><label className="text-xs font-medium text-text-muted block mb-1">Question {i+1}</label><input className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" placeholder={q}/></div>)}</div></div> }
function BuildApply2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Error Handling Strategy</h3><p className="text-sm text-text-secondary mb-4">For each error scenario, write the handling code pattern:</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm whitespace-pre-wrap text-text-secondary">{`async function callAI(prompt: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
        signal: AbortSignal.timeout(30000) // 30s timeout
      });
      
      if (res.status === 429) {
        // Rate limited: exponential backoff
        await sleep(Math.pow(2, i) * 1000);
        continue;
      }
      
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) return fallbackResponse();
    }
  }
}`}</div></div> }
function BuildQuiz() { return <QuizGeneric question="What is the Proxy Pattern in AI apps?" options={['Direct API calls from the browser', 'Routing requests through your own server to hide API keys', 'Using a VPN for API calls', 'Caching API responses locally']} correct={1} explanation="The Proxy Pattern routes API calls through your own server (Client → Your Server → AI API). This hides API keys, enables logging, and lets you add caching/rate-limiting." /> }

function DeployRead1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Deployment Options</h3><div className="space-y-2">{[{option:'Vercel / Netlify',desc:'Serverless functions, great for Next.js. Auto-scales.',best:'Small-medium apps'},{option:'Railway / Render',desc:'Container hosting, more control over runtime.',best:'Custom servers'},{option:'AWS Lambda / GCP Functions',desc:'Pay-per-invocation, maximum scale.',best:'High-traffic APIs'},{option:'Self-hosted (VPS)',desc:'Full control, predictable costs.',best:'Ollama/local models'}].map(({option,desc,best})=><div key={option} className="p-3 rounded-lg bg-surface-raised"><p className="text-sm font-semibold text-text-primary">{option}</p><p className="text-xs text-text-secondary">{desc}</p><p className="text-xs text-green mt-1">Best for: {best}</p></div>)}</div></div> }
function DeployRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Cost Optimization</h3><p className="text-text-secondary mb-4">AI API costs add up fast. A single GPT-4 request costs ~$0.03. At 10,000 requests/day, that&apos;s $300/day!</p><div className="space-y-2">{[{tip:'Use smaller models for simple tasks',impact:'50-80% cost reduction'},{tip:'Cache identical/similar requests',impact:'30-60% fewer API calls'},{tip:'Set max_tokens to limit response length',impact:'Predictable costs per request'},{tip:'Use streaming to abort early if off-track',impact:'Save on wasted tokens'},{tip:'Batch similar requests together',impact:'Reduce overhead per request'}].map(({tip,impact})=><div key={tip} className="flex justify-between p-3 rounded-lg bg-surface-raised"><span className="text-sm text-text-secondary">{tip}</span><span className="text-xs text-green font-medium">{impact}</span></div>)}</div></div> }
function DeployRead3() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Monitoring & Observability</h3><p className="text-text-secondary mb-4">In production, monitor these metrics:</p><div className="space-y-2">{[{metric:'Latency',desc:'Time to first token + total response time',target:'< 2s TTFT'},{metric:'Error Rate',desc:'% of failed requests (4xx + 5xx)',target:'< 1%'},{metric:'Token Usage',desc:'Average tokens per request (input + output)',target:'Track weekly'},{metric:'Cost per Query',desc:'Average cost of each API call',target:'Set budget alerts'},{metric:'User Satisfaction',desc:'Are users getting helpful responses?',target:'Track thumbs up/down'}].map(({metric,desc,target})=><div key={metric} className="flex items-center gap-3 p-3 rounded-lg bg-surface-raised"><div className="flex-1"><p className="text-sm font-semibold text-text-primary">{metric}</p><p className="text-xs text-text-secondary">{desc}</p></div><span className="text-xs text-accent font-mono">{target}</span></div>)}</div></div> }
function DeployApply() {
  const [requests, setRequests] = useState(1000)
  const [avgTokens, setAvgTokens] = useState(500)
  const costPerToken = 0.00003
  const monthlyCost = requests * 30 * avgTokens * costPerToken
  return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Cost Calculator</h3><p className="text-sm text-text-secondary mb-4">Estimate your monthly AI API costs:</p><div className="space-y-3"><div><label className="text-sm font-medium text-text-secondary mb-1 block">Daily Requests: {requests}</label><input type="range" min="100" max="100000" step="100" value={requests} onChange={(e) => setRequests(parseInt(e.target.value))} className="w-full accent-accent" /></div><div><label className="text-sm font-medium text-text-secondary mb-1 block">Avg Tokens/Request: {avgTokens}</label><input type="range" min="100" max="4000" step="50" value={avgTokens} onChange={(e) => setAvgTokens(parseInt(e.target.value))} className="w-full accent-accent" /></div><div className="p-4 rounded-xl bg-accent/5 border border-accent/20 text-center"><p className="text-2xl font-bold text-accent">${monthlyCost.toFixed(2)}</p><p className="text-xs text-text-muted">Estimated monthly cost (GPT-4o pricing)</p></div></div></div>
}
function DeployQuiz() { return <QuizGeneric question="What is the MOST impactful way to reduce AI API costs?" options={['Use a faster internet connection', 'Cache responses for identical/similar queries', 'Reduce max_tokens to 10', 'Only use free models']} correct={1} explanation="Caching is typically the most impactful optimization, potentially reducing costs by 30-60% by avoiding duplicate API calls for the same or similar queries." /> }

// ===========================
// MODULE 5: ETHICS & CRITICAL THINKING
// ===========================

function HalluRead1() { return <div><div className="bg-orange/5 border border-orange/20 rounded-xl p-4 mb-6"><p className="text-sm font-medium text-orange mb-1">⚠️ Important</p><p className="text-sm text-text-secondary">AI hallucinations are not bugs — they&apos;re a fundamental feature of how LLMs work. They generate plausible text, not verified truth.</p></div><p className="text-text-secondary leading-relaxed mb-4">When an AI &ldquo;hallucinates,&rdquo; it generates information that sounds confident and correct but is actually made up. This happens because LLMs predict probable text, not factual text.</p><p className="text-text-secondary leading-relaxed">A model might confidently cite a research paper that doesn&apos;t exist, give you a phone number that belongs to someone else, or describe historical events that never happened — all in perfect, convincing prose.</p></div> }
function HalluRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Types of Hallucinations</h3><div className="space-y-2">{[{type:'Factual Fabrication',example:'Citing a fake research paper with real-sounding authors',risk:'High'},{type:'Confident Errors',example:'Saying "Python was created in 1989" (it was 1991)',risk:'Medium'},{type:'Attribution Errors',example:'Attributing a quote to the wrong person',risk:'High'},{type:'Logical Errors',example:'Giving mathematically wrong answers with confident reasoning',risk:'Medium'},{type:'Link Fabrication',example:'Generating URLs that look real but lead nowhere',risk:'High'}].map(({type,example,risk})=><div key={type} className="p-3 rounded-lg bg-surface-raised"><div className="flex justify-between mb-1"><p className="text-sm font-semibold text-text-primary">{type}</p><span className={`text-xs px-2 py-0.5 rounded-full ${risk==='High'?'bg-red/10 text-red':'bg-orange/10 text-orange'}`}>{risk} risk</span></div><p className="text-xs text-text-secondary">{example}</p></div>)}</div></div> }
function HalluApply() {
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const items = [
    { text: 'The Eiffel Tower is 330 meters tall', real: true },
    { text: 'Dr. James Mitchell published "AI Ethics in Practice" at Stanford in 2019', real: false },
    { text: 'Python uses indentation for code blocks', real: true },
    { text: 'The "Quantum Computing Act of 2023" was signed by the US President', real: false },
  ]
  return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Spot the Hallucination</h3><p className="text-sm text-text-secondary mb-4">Which of these AI-generated statements are real vs hallucinated? Click to reveal.</p><div className="space-y-2">{items.map((item, i) => <div key={i} className="p-4 rounded-xl bg-surface-raised cursor-pointer" onClick={() => setSelected(prev => ({...prev, [i]: true}))}><p className="text-sm text-text-primary mb-2">&ldquo;{item.text}&rdquo;</p>{selected[i] ? <p className={`text-xs font-medium ${item.real ? 'text-green' : 'text-red'}`}>{item.real ? '✅ Real fact' : '❌ Hallucination — this was fabricated by AI'}</p> : <p className="text-xs text-accent">Click to reveal →</p>}</div>)}</div></div>
}
function HalluQuiz() { return <QuizGeneric question="Why do AI models hallucinate?" options={['They deliberately lie', 'They generate probable text, not verified truth', 'They have bad training data', "They don't have enough parameters"]} correct={1} explanation="Hallucinations occur because LLMs are trained to predict the most probable next token, not to verify facts. They generate plausible-sounding text based on patterns, not truth." /> }

function BiasRead1() { return <div><div className="bg-orange/5 border border-orange/20 rounded-xl p-4 mb-6"><p className="text-sm font-medium text-orange mb-1">⚠️ Important</p><p className="text-sm text-text-secondary">AI bias isn&apos;t intentional — it&apos;s inherited from biased training data, reflecting existing societal patterns and inequalities.</p></div><p className="text-text-secondary leading-relaxed mb-4">If an AI model is trained on historical hiring data that favored men, it will learn that pattern and reproduce it. The AI isn&apos;t sexist — but its outputs are.</p><p className="text-text-secondary leading-relaxed">This affects everything from resume screening to loan approvals to medical diagnoses.</p></div> }
function BiasRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Sources of Bias</h3><div className="space-y-2">{[{source:'Training Data Bias',desc:'Internet text overrepresents certain demographics, languages, and viewpoints.',icon:'📊'},{source:'Selection Bias',desc:'The data chosen for training doesn\'t represent the full population.',icon:'🔍'},{source:'Confirmation Bias',desc:'Models reinforce existing stereotypes because they appear frequently in data.',icon:'🔄'},{source:'Measurement Bias',desc:'The criteria used to evaluate AI can itself be biased.',icon:'📏'}].map(({source,desc,icon})=><div key={source} className="flex gap-3 p-3 rounded-lg bg-surface-raised"><span className="text-xl">{icon}</span><div><p className="text-sm font-semibold text-text-primary">{source}</p><p className="text-xs text-text-secondary">{desc}</p></div></div>)}</div></div> }
function BiasRead3() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Mitigation Strategies</h3><div className="space-y-2">{[{strategy:'Diverse Training Data',desc:'Include data from underrepresented groups and perspectives'},{strategy:'Bias Testing',desc:'Run tests with different demographics to check for disparate outcomes'},{strategy:'Human Review',desc:'Have diverse humans review AI outputs for bias'},{strategy:'Prompt Engineering',desc:'Ask the AI to consider multiple perspectives in its response'},{strategy:'Red-Teaming',desc:'Actively try to make the AI produce biased outputs to find weaknesses'}].map(({strategy,desc})=><div key={strategy} className="p-3 rounded-lg bg-surface-raised"><p className="text-sm font-semibold text-text-primary">{strategy}</p><p className="text-xs text-text-secondary">{desc}</p></div>)}</div></div> }
function BiasApply() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Detect Bias Exercise</h3><p className="text-sm text-text-secondary mb-4">Read each AI-generated output and identify potential biases:</p><div className="space-y-3">{[{prompt:'Write a description of a CEO',output:'He walked into the boardroom...',bias:'Gender bias: assumed CEO is male'},{prompt:'Describe a nurse',output:'She carefully checked the patient...',bias:'Gender bias: assumed nurse is female'},{prompt:'List great scientists',output:'Einstein, Newton, Hawking, Feynman...',bias:'Western/male bias: no women or non-Western scientists'}].map(({prompt,output,bias})=><div key={prompt} className="p-4 rounded-xl bg-surface-raised"><p className="text-xs text-text-muted mb-1">Prompt: &ldquo;{prompt}&rdquo;</p><p className="text-sm text-text-primary mb-2">Output: &ldquo;{output}&rdquo;</p><p className="text-xs text-orange">🔍 Bias: {bias}</p></div>)}</div></div> }
function BiasQuiz() { return <QuizGeneric question="What is the PRIMARY reason AI models exhibit bias?" options={['They are programmed to be biased', 'They learn biases present in their training data', 'They have too few parameters', 'They are not smart enough']} correct={1} explanation="AI models learn patterns from their training data. If the data contains societal biases (which it does), the model will reproduce those biases in its outputs." /> }

function ResponsibleRead1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Privacy & Data Concerns</h3><div className="space-y-2">{[{issue:'Data in Prompts',desc:'Anything you type into an AI chatbot might be used for training. Never share passwords, secrets, or PII.',severity:'Critical'},{issue:'Data Retention',desc:'Many services store conversations. Check privacy policies before sharing sensitive info.',severity:'High'},{issue:'Local Models',desc:'Running models locally (like Ollama) keeps all data on your machine — the privacy gold standard.',severity:'Best Practice'}].map(({issue,desc,severity})=><div key={issue} className="p-3 rounded-lg bg-surface-raised"><div className="flex justify-between mb-1"><p className="text-sm font-semibold text-text-primary">{issue}</p><span className={`text-xs px-2 py-0.5 rounded-full ${severity==='Critical'?'bg-red/10 text-red':severity==='High'?'bg-orange/10 text-orange':'bg-green/10 text-green'}`}>{severity}</span></div><p className="text-xs text-text-secondary">{desc}</p></div>)}</div></div> }
function ResponsibleRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Copyright & Job Impact</h3><p className="text-text-secondary mb-4">Key ethical considerations:</p><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><h4 className="font-semibold text-text-primary mb-2">📝 Copyright</h4><ul className="space-y-1 text-sm text-text-secondary">{['AI-generated content may not be copyrightable','Models trained on copyrighted works (legal gray area)','Always disclose AI assistance in professional work','Check your organization\'s AI usage policy'].map(i=><li key={i}>• {i}</li>)}</ul></div><div><h4 className="font-semibold text-text-primary mb-2">💼 Job Impact</h4><ul className="space-y-1 text-sm text-text-secondary">{['AI augments rather than replaces most jobs','Focus on skills AI can\'t do: creativity, empathy, judgment','Learn to use AI tools to stay competitive','New jobs are being created: prompt engineer, AI trainer'].map(i=><li key={i}>• {i}</li>)}</ul></div></div></div> }
function ResponsibleApply() {
  const scenarios = [
    { scenario: 'Using AI to write a college essay without disclosure', verdict: 'Unethical', why: 'Misrepresents your own work. Most schools consider this academic dishonesty.' },
    { scenario: 'Using AI to help brainstorm ideas for a project', verdict: 'Ethical', why: 'AI as a brainstorming tool is like using a dictionary — it assists your thinking.' },
    { scenario: 'Sharing customer data in ChatGPT to analyze feedback', verdict: 'Risky', why: 'Customer PII could be stored/trained on. Use local models or anonymize first.' },
    { scenario: 'Using AI to generate marketing copy and editing it', verdict: 'Ethical', why: 'Common practice. The human review and editing adds value and accountability.' },
  ]
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})
  return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Ethical Dilemmas</h3><p className="text-sm text-text-secondary mb-4">For each scenario, decide: ethical, unethical, or it depends?</p><div className="space-y-3">{scenarios.map((s, i) => <div key={i} className="p-4 rounded-xl bg-surface-raised cursor-pointer" onClick={() => setRevealed(prev => ({...prev, [i]: true}))}><p className="text-sm text-text-primary mb-2">{s.scenario}</p>{revealed[i] ? <div className={`p-3 rounded-lg ${s.verdict==='Ethical'?'bg-green/10 border border-green/20':'bg-orange/10 border border-orange/20'}`}><p className="text-xs font-medium">{s.verdict === 'Ethical' ? '✅' : '⚠️'} {s.verdict}</p><p className="text-xs text-text-muted mt-1">{s.why}</p></div> : <p className="text-xs text-accent">Click to reveal →</p>}</div>)}</div></div>
}
function ResponsibleQuiz() { return <QuizGeneric question="What is the safest way to use AI with sensitive data?" options={['Use ChatGPT — it deletes all data', 'Run local models (like Ollama) so data never leaves your machine', 'Encrypt the data before sending it', 'Use anonymous browser mode']} correct={1} explanation="Running models locally (e.g., Ollama, llama.cpp) ensures your data never leaves your machine. Cloud services may store or train on your data, even with encryption." /> }

// ===========================
// MODULE 6: REAL-WORLD PROJECTS
// ===========================

function ContentGenRead1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Project Overview: Content Generator</h3><p className="text-text-secondary mb-4">You&apos;ll build a multi-format content generation pipeline that takes a topic and produces a complete content package: blog post, social media posts, and email newsletter.</p><div className="space-y-2">{[{step:'1. Input',desc:'Topic, target audience, tone, content types'},{step:'2. Research',desc:'AI generates key points and structure'},{step:'3. Generate',desc:'Prompt chains create each content type'},{step:'4. Review',desc:'Output formatted and ready to use'}].map(({step,desc})=><div key={step} className="flex gap-3 p-3 rounded-lg bg-surface-raised"><span className="text-sm font-bold text-accent shrink-0">{step}</span><span className="text-sm text-text-secondary">{desc}</span></div>)}</div></div> }
function ContentGenRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Designing the Prompt Pipeline</h3><p className="text-text-secondary mb-4">Each content type uses the output of the previous step as context:</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm"><p className="text-blue">Step 1: Research Prompt → Key points</p><p className="text-green">Step 2: Blog Prompt + Key points → Blog post</p><p className="text-orange">Step 3: Social Prompt + Blog post → Social posts</p><p className="text-purple">Step 4: Email Prompt + Key points → Newsletter</p></div></div> }
function ContentGenApply1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Build Your Input Form</h3><p className="text-sm text-text-secondary mb-4">Design the input parameters for your content generator:</p><div className="space-y-3">{['Topic (what are you writing about?)','Target Audience (who is this for?)','Tone (professional, casual, humorous?)','Content Types (blog, social, email?)'].map((label)=><div key={label}><label className="text-xs font-medium text-text-muted block mb-1">{label}</label><input className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" placeholder={label} /></div>)}</div></div> }
function ContentGenApply2() {
  const [output, setOutput] = useState('')
  const [generating, setGenerating] = useState(false)
  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'You are a content strategist. Create a brief content outline for a blog post about "How AI is changing education". Include: 5 key sections, target audience (educators), and key takeaways. Format as a structured outline.' }], stream: false, max_tokens: 300 }) })
      if (res.ok) { const d = await res.json(); setOutput(d.choices?.[0]?.message?.content || 'No response') }
      else setOutput('⚠️ AI not available')
    } catch { setOutput('⚠️ Connection failed') }
    setGenerating(false)
  }
  return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Chain Prompts Together</h3><p className="text-sm text-text-secondary mb-4">Watch a prompt chain in action — first generating an outline, then using it for content.</p><Button onClick={generate} loading={generating} className="mb-4">Run Content Pipeline</Button>{output && <div className="p-4 rounded-xl bg-green/5 border border-green/20"><p className="text-xs font-medium text-green mb-2">Pipeline Output:</p><pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono">{output}</pre></div>}</div>
}
function ContentGenApply3() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Output Formatter</h3><p className="text-sm text-text-secondary mb-4">The final step: format outputs for different platforms. Think about character limits, hashtags, and formatting.</p><div className="space-y-3"><div className="p-4 rounded-xl bg-surface-raised"><p className="text-xs font-medium text-blue mb-2">Twitter/X</p><p className="text-sm text-text-secondary">280 character limit • Use hashtags • Thread for long content</p></div><div className="p-4 rounded-xl bg-surface-raised"><p className="text-xs font-medium text-purple mb-2">LinkedIn</p><p className="text-sm text-text-secondary">3000 char limit • Professional tone • Use line breaks for readability</p></div><div className="p-4 rounded-xl bg-surface-raised"><p className="text-xs font-medium text-green mb-2">Email Newsletter</p><p className="text-sm text-text-secondary">Subject line • Preview text • CTA button • Mobile-friendly</p></div></div></div> }
function ContentGenQuiz() { return <QuizGeneric question="What is the main benefit of prompt chaining?" options={['It uses fewer tokens', 'Each step can build on the output of the previous step', 'It runs faster', 'It costs less']} correct={1} explanation="Prompt chaining lets you break complex tasks into steps where each prompt uses the previous output as context, producing better results than a single long prompt." /> }

function AssistantRead1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Planning Your Assistant</h3><p className="text-text-secondary mb-4">A custom AI assistant needs three things:</p><div className="space-y-2">{[{need:'Domain Knowledge',desc:'What topic area does it specialize in?',icon:'🧠'},{need:'Persona',desc:'How should it communicate? Formal? Friendly? Technical?',icon:'🎭'},{need:'Guardrails',desc:'What should it refuse to do? What are its boundaries?',icon:'🚧'}].map(({need,desc,icon})=><div key={need} className="flex gap-3 p-3 rounded-lg bg-surface-raised"><span className="text-xl">{icon}</span><div><p className="text-sm font-semibold text-text-primary">{need}</p><p className="text-xs text-text-secondary">{desc}</p></div></div>)}</div></div> }
function AssistantRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">System Prompt Design</h3><p className="text-text-secondary mb-4">The system prompt is the DNA of your assistant. It defines everything:</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm whitespace-pre-wrap text-text-secondary">{`You are [Name], a [role] assistant specializing in [domain].

PERSONALITY:
- Tone: [friendly/professional/casual]
- Style: [concise/detailed/educational]
- Language: [simple/technical]

RULES:
- Always [specific behavior]
- Never [prohibited behavior]
- If unsure, [fallback behavior]

KNOWLEDGE:
- You know about: [topics]
- You don't know about: [limitations]`}</div></div> }
function AssistantRead3() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Conversation Design</h3><p className="text-text-secondary mb-4">Great assistants don&apos;t just answer — they guide the conversation:</p><div className="space-y-2">{[{pattern:'Greeting',example:'Welcome! I\'m your cooking assistant. What would you like to make today?'},{pattern:'Clarification',example:'I\'d love to help! Are you looking for a quick weeknight meal or something special?'},{pattern:'Step-by-Step',example:'Great choice! Let\'s start with the ingredients. Do you have...?'},{pattern:'Error Recovery',example:'I\'m not sure about that ingredient. Could you double-check the name?'}].map(({pattern,example})=><div key={pattern} className="p-3 rounded-lg bg-surface-raised"><p className="text-sm font-semibold text-text-primary">{pattern}</p><p className="text-xs text-text-secondary italic">&ldquo;{example}&rdquo;</p></div>)}</div></div> }
function AssistantApply1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Design Your System Prompt</h3><p className="text-sm text-text-secondary mb-4">Create a system prompt for a domain-specific AI assistant:</p><div className="space-y-3">{['Assistant Name & Role','Personality (tone, style)','3 things it should always do','3 things it should never do','Domain knowledge boundaries'].map((label)=><div key={label}><label className="text-xs font-medium text-text-muted block mb-1">{label}</label><input className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" placeholder={label}/></div>)}</div></div> }
function AssistantApply2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Build Guardrails</h3><p className="text-sm text-text-secondary mb-4">Define safety boundaries for your assistant:</p><div className="space-y-3">{['What topics should it refuse to discuss?','How should it handle medical/legal questions?','What should it do when it doesn\'t know the answer?','How should it handle inappropriate requests?'].map((q,i)=><div key={i}><label className="text-xs font-medium text-text-muted block mb-1">{q}</label><textarea className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none h-16 outline-none focus:ring-2 focus:ring-accent" placeholder="Write your guardrail..."/></div>)}</div></div> }
function AssistantApply3() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [generating, setGenerating] = useState(false)
  const test = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'system', content: 'You are FitBot, a friendly fitness assistant. You help with workout plans and nutrition advice. You NEVER give medical diagnoses. You always recommend consulting a doctor for health concerns.' }, { role: 'user', content: message }], stream: false, max_tokens: 200 }) })
      if (res.ok) { const d = await res.json(); setResponse(d.choices?.[0]?.message?.content || 'No response') }
      else setResponse('⚠️ AI not available')
    } catch { setResponse('⚠️ Connection failed') }
    setGenerating(false)
  }
  return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Test Your Assistant</h3><p className="text-sm text-text-secondary mb-4">Try chatting with &ldquo;FitBot&rdquo; — a demo fitness assistant. Try testing its guardrails!</p><input value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent mb-3" placeholder="Ask FitBot something (try: 'I have chest pain')" /><Button onClick={test} loading={generating} className="mb-4">Send to FitBot</Button>{response && <div className="p-4 rounded-xl bg-green/5 border border-green/20"><p className="text-xs font-medium text-green mb-2">🤖 FitBot:</p><p className="text-sm text-text-secondary">{response}</p></div>}</div>
}
function AssistantQuiz() { return <QuizGeneric question="What is the most important element of a custom AI assistant?" options={['The model size', 'A well-designed system prompt with guardrails', 'The response speed', 'The user interface']} correct={1} explanation="The system prompt defines your assistant's persona, knowledge boundaries, and safety guardrails. It's the most important factor in making a useful and safe assistant." /> }

function PipelineRead1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Data Pipeline Concepts</h3><p className="text-text-secondary mb-4">A data pipeline is a series of steps that transform raw data into useful insights:</p><div className="flex flex-col gap-2">{['📥 Extract — Collect raw data from sources','🔄 Transform — Clean, normalize, and enrich','🧠 Analyze — AI processes and extracts insights','📤 Load — Store results in usable format'].map(step=><div key={step} className="p-3 rounded-lg bg-surface-raised text-sm text-text-secondary">{step}</div>)}</div></div> }
function PipelineRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">AI in Data Processing</h3><p className="text-text-secondary mb-4">AI excels at tasks that are hard to code with rules:</p><div className="space-y-2">{[{task:'Text Classification',example:'Sort support tickets by urgency'},{task:'Entity Extraction',example:'Pull names, dates, prices from documents'},{task:'Summarization',example:'Condense 50-page reports into 1-page briefs'},{task:'Sentiment Analysis',example:'Determine customer satisfaction from reviews'},{task:'Anomaly Detection',example:'Flag unusual patterns in data'}].map(({task,example})=><div key={task} className="p-3 rounded-lg bg-surface-raised"><p className="text-sm font-semibold text-text-primary">{task}</p><p className="text-xs text-text-secondary">{example}</p></div>)}</div></div> }
function PipelineApply1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Design a Pipeline</h3><p className="text-sm text-text-secondary mb-4">Design an AI data pipeline for customer feedback analysis:</p><div className="space-y-3">{['Step 1: What data sources? (surveys, reviews, support tickets)','Step 2: What cleaning/normalization is needed?','Step 3: What AI analysis? (sentiment, topics, urgency)','Step 4: What output format? (dashboard, report, alerts)'].map((q,i)=><div key={i}><label className="text-xs font-medium text-text-muted block mb-1">{q}</label><input className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="Describe this step..." /></div>)}</div></div> }
function PipelineApply2() {
  const [output, setOutput] = useState('')
  const [generating, setGenerating] = useState(false)
  const run = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'user', content: 'Extract entities from this text. Return JSON with: persons, organizations, dates, amounts.\n\nText: "On March 15, 2024, Apple Inc. CEO Tim Cook announced a $500 million investment in AI research at their Cupertino headquarters."\n\nJSON output:' }], stream: false, max_tokens: 200 }) })
      if (res.ok) { const d = await res.json(); setOutput(d.choices?.[0]?.message?.content || 'No response') }
      else setOutput('⚠️ AI not available')
    } catch { setOutput('⚠️ Connection failed') }
    setGenerating(false)
  }
  return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Entity Extraction Demo</h3><p className="text-sm text-text-secondary mb-4">Watch AI extract structured data from unstructured text.</p><Button onClick={run} loading={generating} className="mb-4">Run Extraction</Button>{output && <div className="p-4 rounded-xl bg-green/5 border border-green/20"><p className="text-xs font-medium text-green mb-2">Extracted Entities:</p><pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono">{output}</pre></div>}</div>
}
function PipelineApply3() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Transform & Load</h3><p className="text-sm text-text-secondary mb-4">After extraction, data needs to be transformed and stored:</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm whitespace-pre-wrap text-text-secondary">{`// Transform: Normalize extracted data
const normalized = {
  persons: extractedData.persons.map(p => p.toLowerCase()),
  dates: extractedData.dates.map(d => new Date(d).toISOString()),
  amounts: extractedData.amounts.map(a => parseFloat(a.replace(/[$,]/g, ''))),
};

// Load: Store in database or output file
await db.insert('extracted_entities', normalized);
await generateReport(normalized);`}</div></div> }
function PipelineQuiz() { return <QuizGeneric question="What is AI particularly good at in data pipelines?" options={['Storing data in databases', 'Tasks that are hard to code with rules (classification, extraction)', 'Compressing files', 'Sorting numbers']} correct={1} explanation="AI excels at tasks like classification, entity extraction, and summarization — tasks that require understanding context and nuance, which are very difficult to code with traditional rules." /> }

// ===========================
// MODULE 7: IMAGE, VIDEO & AUDIO
// ===========================

function ImageRead1() { return <div><div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6"><p className="text-sm font-medium text-accent mb-1">💡 Key Concept</p><p className="text-sm text-text-secondary">Image AI models work by learning the relationship between text descriptions and visual patterns. They don&apos;t &ldquo;draw&rdquo; — they generate pixels based on learned associations.</p></div><p className="text-text-secondary leading-relaxed mb-4">Two main approaches:</p><div className="space-y-2">{[{type:'Diffusion Models',desc:'Start with noise and gradually remove it, guided by the text prompt. (Stable Diffusion, DALL-E 3, Midjourney)',how:'Noise → Less noise → Image'},{type:'GANs',desc:'Two networks compete: one generates, one judges. (StyleGAN, BigGAN)',how:'Generator → Discriminator → Better generator'}].map(({type,desc,how})=><div key={type} className="p-3 rounded-lg bg-surface-raised"><p className="text-sm font-semibold text-text-primary">{type}</p><p className="text-xs text-text-secondary">{desc}</p><p className="text-xs text-accent mt-1">{how}</p></div>)}</div></div> }
function ImageRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Prompt Crafting for Images</h3><p className="text-text-secondary mb-4">Image prompts have a specific structure:</p><div className="space-y-2">{[{part:'Subject',example:'A golden retriever puppy',required:true},{part:'Style',example:'oil painting, watercolor, 3D render, photograph',required:true},{part:'Mood/Lighting',example:'dramatic lighting, soft morning light, neon glow',required:false},{part:'Composition',example:'close-up, wide angle, bird\'s eye view',required:false},{part:'Quality Modifiers',example:'highly detailed, 4K, professional, award-winning',required:false}].map(({part,example,required})=><div key={part} className="flex gap-3 p-3 rounded-lg bg-surface-raised"><div className="flex-1"><p className="text-sm font-semibold text-text-primary">{part} {required && <span className="text-xs text-red">*required</span>}</p><p className="text-xs text-text-secondary">{example}</p></div></div>)}</div></div> }
function ImageRead3() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Tools Comparison</h3><div className="space-y-2">{[{tool:'Midjourney',strengths:'Best artistic quality, beautiful aesthetics',weaknesses:'Discord-only, $10/mo, less precise control',best:'Art, marketing, creative work'},{tool:'DALL-E 3',strengths:'Best text in images, good at following instructions',weaknesses:'Less artistic, censored more heavily',best:'Diagrams, illustrations with text'},{tool:'Stable Diffusion',strengths:'Free, open source, runs locally, fully customizable',weaknesses:'Steeper learning curve, needs good hardware',best:'Privacy-sensitive work, fine-tuning'}].map(({tool,strengths,weaknesses,best})=><div key={tool} className="p-4 rounded-xl bg-surface-raised"><p className="text-sm font-semibold text-text-primary mb-1">{tool}</p><p className="text-xs text-green">✅ {strengths}</p><p className="text-xs text-orange">⚠️ {weaknesses}</p><p className="text-xs text-accent mt-1">Best for: {best}</p></div>)}</div></div> }
function ImageApply() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Build Image Prompts</h3><p className="text-sm text-text-secondary mb-4">Practice building effective image generation prompts:</p><div className="space-y-3">{[{label:'Subject',placeholder:'A futuristic city'},{label:'Style',placeholder:'cyberpunk digital art'},{label:'Mood/Lighting',placeholder:'neon lights, rain, night'},{label:'Composition',placeholder:'wide angle, dramatic perspective'},{label:'Quality',placeholder:'highly detailed, 8K, cinematic'}].map(({label,placeholder})=><div key={label}><label className="text-xs font-medium text-text-muted block mb-1">{label}</label><input className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" placeholder={placeholder}/></div>)}</div></div> }
function ImageQuiz() { return <QuizGeneric question="Which image AI tool is best for running locally with full privacy?" options={['Midjourney', 'DALL-E 3', 'Stable Diffusion', 'Canva AI']} correct={2} explanation="Stable Diffusion is open source and can run entirely on your local machine, making it the best choice for privacy-sensitive work where data shouldn't leave your computer." /> }

function VideoRead1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Video AI Landscape</h3><div className="space-y-2">{[{tool:'Sora (OpenAI)',desc:'Text-to-video generation, photorealistic scenes',status:'Limited access'},{tool:'Runway Gen-3',desc:'Text/image-to-video, motion brush, style transfer',status:'Available ($15/mo)'},{tool:'Pika',desc:'Simple text-to-video, good for short clips',status:'Freemium'},{tool:'HeyGen',desc:'AI avatar videos, lip-sync, translation',status:'Available ($29/mo)'},{tool:'Descript',desc:'Video editing with AI: remove filler words, green screen',status:'Available ($24/mo)'}].map(({tool,desc,status})=><div key={tool} className="p-3 rounded-lg bg-surface-raised"><div className="flex justify-between mb-1"><p className="text-sm font-semibold text-text-primary">{tool}</p><span className="text-xs text-text-muted">{status}</span></div><p className="text-xs text-text-secondary">{desc}</p></div>)}</div></div> }
function VideoRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Audio AI Tools</h3><div className="space-y-2">{[{tool:'ElevenLabs',desc:'Voice cloning, text-to-speech (most realistic)',use:'Audiobooks, voiceovers, dubbing'},{tool:'Suno',desc:'AI music generation from text descriptions',use:'Background music, jingles, songs'},{tool:'Udio',desc:'High-quality AI music with vocals',use:'Full songs, demos, creative projects'},{tool:'Whisper (OpenAI)',desc:'Speech-to-text transcription (open source)',use:'Transcription, subtitles, note-taking'},{tool:'Adobe Podcast',desc:'Audio enhancement, noise removal',use:'Podcast production, interview cleanup'}].map(({tool,desc,use})=><div key={tool} className="p-3 rounded-lg bg-surface-raised"><p className="text-sm font-semibold text-text-primary">{tool}</p><p className="text-xs text-text-secondary">{desc}</p><p className="text-xs text-accent mt-1">Use case: {use}</p></div>)}</div></div> }
function VideoApply() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Plan a Production</h3><p className="text-sm text-text-secondary mb-4">Plan an AI-assisted video production pipeline:</p><div className="space-y-3">{['What type of video? (explainer, ad, tutorial, social)','Script: Which AI tool would you use to write the script?','Visuals: Image generation or video AI?','Audio: Voiceover (ElevenLabs) or music (Suno)?','Editing: How would you assemble the final video?'].map((q,i)=><div key={i}><label className="text-xs font-medium text-text-muted block mb-1">{q}</label><input className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="Your answer..."/></div>)}</div></div> }
function VideoQuiz() { return <QuizGeneric question="Which AI tool is best for realistic voice cloning?" options={['Suno', 'Whisper', 'ElevenLabs', 'Adobe Podcast']} correct={2} explanation="ElevenLabs is the leading AI voice cloning and text-to-speech platform, producing the most realistic and customizable voice synthesis currently available." /> }

function MultiRead1() { return <div><div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6"><p className="text-sm font-medium text-accent mb-1">💡 Key Concept</p><p className="text-sm text-text-secondary">Multimodal AI can process and generate multiple types of media: text + images + audio + video in a single conversation.</p></div><p className="text-text-secondary leading-relaxed mb-4">Models like GPT-4o and Gemini can &ldquo;see&rdquo; images, &ldquo;hear&rdquo; audio, and respond with text — all in one interaction. This opens up entirely new possibilities.</p><div className="space-y-2">{[{mode:'Text → Image',example:'Describe a scene and generate a picture'},{mode:'Image → Text',example:'Upload a photo and ask questions about it'},{mode:'Audio → Text',example:'Transcribe speech and summarize'},{mode:'Text → Audio',example:'Convert articles to spoken word'},{mode:'Text → Video',example:'Describe a scene and generate a clip'}].map(({mode,example})=><div key={mode} className="flex gap-3 p-3 rounded-lg bg-surface-raised"><span className="text-sm font-bold text-accent shrink-0 w-28">{mode}</span><span className="text-sm text-text-secondary">{example}</span></div>)}</div></div> }
function MultiRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Cross-Modal Workflows</h3><p className="text-text-secondary mb-4">The real power is combining modalities in workflows:</p><div className="p-4 rounded-xl bg-surface-raised text-sm space-y-2"><p className="text-blue">1. 📝 Write script → (Text generation)</p><p className="text-green">2. 🎨 Generate illustrations → (Image generation)</p><p className="text-orange">3. 🎙️ Create voiceover → (Text-to-speech)</p><p className="text-purple">4. 🎬 Assemble video → (Video editing)</p><p className="text-cyan">5. 🌍 Translate → (Multimodal translation)</p></div><p className="text-xs text-text-muted mt-3">This entire workflow can be automated with the right tool chain!</p></div> }
function MultiApply1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Design a Multimodal Pipeline</h3><p className="text-sm text-text-secondary mb-4">Design a pipeline that uses at least 3 different modalities:</p><div className="space-y-3">{['What is the end product? (video, interactive guide, presentation)','Step 1: What text content is needed?','Step 2: What images/visuals?','Step 3: What audio? (voice, music, effects)','How are they combined into the final product?'].map((q,i)=><div key={i}><label className="text-xs font-medium text-text-muted block mb-1">{q}</label><input className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="Describe..."/></div>)}</div></div> }
function MultiApply2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Vision + Text Exercise</h3><p className="text-sm text-text-secondary mb-4">Multimodal models can analyze images and answer questions. Here&apos;s how you would use vision capabilities:</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm whitespace-pre-wrap text-text-secondary">{`// Vision API call example:
{
  "model": "gpt-4o",
  "messages": [{
    "role": "user",
    "content": [
      { "type": "text", "text": "What's in this image?" },
      { "type": "image_url", "image_url": {
        "url": "data:image/jpeg;base64,..."
      }}
    ]
  }]
}`}</div><p className="text-xs text-text-muted mt-3">The model receives both text and image data, and responds with text describing what it sees.</p></div> }
function MultiQuiz() { return <QuizGeneric question="What makes a model 'multimodal'?" options={['It runs on multiple computers', 'It can process and generate multiple types of media (text, images, audio)', 'It supports multiple languages', 'It has multiple versions']} correct={1} explanation="Multimodal AI can work with multiple types of media — text, images, audio, and video — in a single interaction, unlike text-only models." /> }

// ===========================
// MODULE 8: AGENTS & AUTOMATION
// ===========================

function AgentRead1() { return <div><div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6"><p className="text-sm font-medium text-accent mb-1">💡 Key Concept</p><p className="text-sm text-text-secondary">An AI agent is an LLM that can take actions — not just generate text. It can browse the web, write files, run code, and make decisions autonomously.</p></div><p className="text-text-secondary leading-relaxed mb-4">While a chatbot waits for your next message, an agent can:</p><div className="space-y-2">{['🔍 Search the web for information','📁 Read and write files','🖥️ Execute code','🛠️ Call APIs and tools','🤔 Make decisions based on results','🔄 Loop until the task is complete'].map(action=><div key={action} className="p-2 rounded-lg bg-surface-raised text-sm text-text-secondary">{action}</div>)}</div></div> }
function AgentRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">The ReAct Pattern</h3><p className="text-text-secondary mb-4"><strong className="text-text-primary">ReAct</strong> (Reasoning + Acting) is the core pattern for AI agents:</p><div className="space-y-3">{[{step:'1. Thought',desc:'The agent reasons about what to do next',example:'"I need to find the weather in Tokyo."',color:'text-purple'},{step:'2. Action',desc:'The agent uses a tool',example:'call(get_weather, {city: "Tokyo"})',color:'text-blue'},{step:'3. Observation',desc:'The agent receives the tool result',example:'"Temperature: 22°C, Sunny"',color:'text-green'},{step:'4. Repeat or Answer',desc:'Decide: need more info or ready to answer?',example:'"I now have the answer. The weather in Tokyo is..."',color:'text-orange'}].map(({step,desc,example,color})=><div key={step} className="flex gap-3 items-start p-3 rounded-lg bg-surface-raised"><div className={`text-sm font-bold ${color} shrink-0 w-24`}>{step}</div><div><p className="text-sm text-text-primary">{desc}</p><p className="text-xs text-text-muted font-mono">{example}</p></div></div>)}</div></div> }
function AgentRead3() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Tool Use & Function Calling</h3><p className="text-text-secondary mb-4">Agents need tools. You define what tools are available, and the AI decides when to use them:</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm whitespace-pre-wrap text-text-secondary">{`// Define available tools:
tools = [
  {
    name: "search_web",
    description: "Search the internet for info",
    parameters: { query: "string" }
  },
  {
    name: "run_code",
    description: "Execute Python code",
    parameters: { code: "string" }
  },
  {
    name: "send_email",
    description: "Send an email",
    parameters: { to: "string", subject: "string", body: "string" }
  }
]`}</div></div> }
function AgentApply() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Design an Agent</h3><p className="text-sm text-text-secondary mb-4">Design an AI agent for a specific use case:</p><div className="space-y-3">{['Agent name and purpose','What tools does it need? (list 3-5)','What is its decision-making criteria?','When should it stop and ask for human input?','What are its safety boundaries?'].map((q,i)=><div key={i}><label className="text-xs font-medium text-text-muted block mb-1">{q}</label><input className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="Your answer..."/></div>)}</div></div> }
function AgentQuiz() { return <QuizGeneric question="What is the ReAct pattern?" options={['A React.js component pattern', 'Reasoning + Acting: think, use tools, observe, repeat', 'Real-time Action pattern for databases', 'Reactive programming for AI']} correct={1} explanation="ReAct (Reasoning + Acting) is the core agent pattern: the AI thinks about what to do, uses a tool, observes the result, and repeats until it can answer." /> }

function MultiAgentRead1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Why Multiple Agents?</h3><p className="text-text-secondary mb-4">Some tasks are too complex for a single agent. Multi-agent systems divide work among specialized agents:</p><div className="space-y-2">{[{benefit:'Specialization',desc:'Each agent focuses on what it does best (researcher, writer, reviewer)'},{benefit:'Parallel Processing',desc:'Multiple agents can work simultaneously on different parts'},{benefit:'Check & Balance',desc:'One agent reviews another\'s work for quality assurance'},{benefit:'Scalability',desc:'Add more agents as tasks grow in complexity'}].map(({benefit,desc})=><div key={benefit} className="p-3 rounded-lg bg-surface-raised"><p className="text-sm font-semibold text-text-primary">{benefit}</p><p className="text-xs text-text-secondary">{desc}</p></div>)}</div></div> }
function MultiAgentRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Orchestration Patterns</h3><div className="space-y-3">{[{pattern:'Sequential',desc:'Agent A → Agent B → Agent C (like a pipeline)',best:'Document processing workflows',icon:'→'},{pattern:'Hierarchical',desc:'Manager agent delegates to worker agents',best:'Complex projects with subtasks',icon:'↓'},{pattern:'Collaborative',desc:'Agents discuss and refine together',best:'Creative tasks, debates, reviews',icon:'↔'},{pattern:'Competitive',desc:'Multiple agents solve separately, best answer wins',best:'Maximum accuracy tasks',icon:'⚡'}].map(({pattern,desc,best,icon})=><div key={pattern} className="flex gap-3 p-3 rounded-lg bg-surface-raised"><span className="text-xl w-8 text-center">{icon}</span><div><p className="text-sm font-semibold text-text-primary">{pattern}</p><p className="text-xs text-text-secondary">{desc}</p><p className="text-xs text-accent mt-1">Best for: {best}</p></div></div>)}</div></div> }
function MultiAgentRead3() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Communication Protocols</h3><p className="text-text-secondary mb-4">How agents share information:</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm whitespace-pre-wrap text-text-secondary">{`// Message passing between agents:
{
  from: "researcher-agent",
  to: "writer-agent",
  type: "handoff",
  content: {
    findings: [...],
    context: "Write based on these research findings",
    constraints: { word_limit: 500, tone: "formal" }
  }
}

// Shared memory (blackboard pattern):
shared_state = {
  topic: "AI in Healthcare",
  research: [...],  // written by researcher
  draft: "...",     // written by writer  
  review: "...",    // written by reviewer
  status: "in_review"
}`}</div></div> }
function MultiAgentApply1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Design an Agent Team</h3><p className="text-sm text-text-secondary mb-4">Design a team of AI agents for content creation:</p><div className="space-y-3">{[{role:'Researcher',prompt:'What does this agent do? What tools does it need?'},{role:'Writer',prompt:'How does it use the researcher\'s output?'},{role:'Editor',prompt:'What quality checks does it perform?'},{role:'Publisher',prompt:'How does it format and deliver the final output?'}].map(({role,prompt})=><div key={role}><label className="text-xs font-medium text-text-muted block mb-1">{role} Agent — {prompt}</label><textarea className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none h-16 outline-none focus:ring-2 focus:ring-accent" placeholder={`Describe the ${role} agent...`}/></div>)}</div></div> }
function MultiAgentApply2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Build an Orchestrator</h3><p className="text-sm text-text-secondary mb-4">Design the orchestration logic for your agent team:</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm whitespace-pre-wrap text-text-secondary">{`// Orchestrator pseudocode:
async function runPipeline(topic) {
  // Step 1: Researcher gathers information
  const research = await researcherAgent.run(topic);
  
  // Step 2: Writer creates draft using research
  const draft = await writerAgent.run(research);
  
  // Step 3: Editor reviews and suggests changes
  const review = await editorAgent.run(draft);
  
  // Step 4: If changes needed, writer revises
  if (review.needsChanges) {
    const revised = await writerAgent.revise(draft, review);
    return publisherAgent.format(revised);
  }
  
  return publisherAgent.format(draft);
}`}</div></div> }
function MultiAgentQuiz() { return <QuizGeneric question="What is the 'hierarchical' multi-agent pattern?" options={['All agents work independently', 'A manager agent delegates tasks to worker agents', 'Agents compete for the best answer', 'Agents take turns in sequence']} correct={1} explanation="In the hierarchical pattern, a manager agent breaks down tasks and delegates them to specialized worker agents, coordinating their efforts toward a goal." /> }

function AutoRead1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">Workflow Automation Fundamentals</h3><p className="text-text-secondary mb-4">An automated workflow is a series of actions triggered by an event:</p><div className="space-y-2">{[{part:'Trigger',desc:'What starts the workflow? (time, event, condition)',examples:'New email received, daily at 9am, file uploaded'},{part:'Condition',desc:'Should the workflow continue? (filter)',examples:'If email is from a VIP, if file is PDF'},{part:'Action',desc:'What happens?',examples:'Summarize with AI, send notification, update database'},{part:'Output',desc:'Where does the result go?',examples:'Slack message, email reply, dashboard update'}].map(({part,desc,examples})=><div key={part} className="p-3 rounded-lg bg-surface-raised"><p className="text-sm font-semibold text-text-primary">{part}</p><p className="text-xs text-text-secondary">{desc}</p><p className="text-xs text-text-muted">E.g.: {examples}</p></div>)}</div></div> }
function AutoRead2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-4">AI-Powered Triggers & Actions</h3><div className="space-y-2">{[{workflow:'Email Triage',trigger:'New email received',aiAction:'Classify urgency, extract action items, draft reply',output:'Sorted inbox + draft replies'},{workflow:'Content Monitor',trigger:'RSS feed updated',aiAction:'Summarize article, check relevance to topics',output:'Daily digest email'},{workflow:'Support Bot',trigger:'Support ticket created',aiAction:'Classify issue, suggest solution, escalate if complex',output:'Auto-reply or escalation'},{workflow:'Code Review',trigger:'Pull request opened',aiAction:'Review code for bugs, suggest improvements',output:'Review comments on PR'}].map(({workflow,trigger,aiAction,output})=><div key={workflow} className="p-4 rounded-xl bg-surface-raised"><p className="text-sm font-semibold text-text-primary">{workflow}</p><div className="flex flex-wrap gap-2 mt-2 text-xs"><span className="px-2 py-1 rounded bg-blue/10 text-blue">Trigger: {trigger}</span><span className="px-2 py-1 rounded bg-purple/10 text-purple">AI: {aiAction}</span><span className="px-2 py-1 rounded bg-green/10 text-green">Output: {output}</span></div></div>)}</div></div> }
function AutoApply1() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Design a Workflow</h3><p className="text-sm text-text-secondary mb-4">Design an automated workflow for your daily work:</p><div className="space-y-3">{['What triggers this workflow?','What condition should be checked?','What AI action should be performed?','Where should the output go?','How often should this run?'].map((q,i)=><div key={i}><label className="text-xs font-medium text-text-muted block mb-1">{q}</label><input className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" placeholder="Describe..."/></div>)}</div></div> }
function AutoApply2() { return <div><h3 className="text-lg font-semibold text-text-primary mb-2">🔬 Error Handling in Workflows</h3><p className="text-sm text-text-secondary mb-4">Automated workflows need robust error handling:</p><div className="p-4 rounded-xl bg-surface-raised font-mono text-sm whitespace-pre-wrap text-text-secondary">{`// Workflow error handling patterns:
async function robustWorkflow() {
  try {
    const result = await aiAction(input);
    
    // Validate AI output
    if (!isValidOutput(result)) {
      // Retry with clearer prompt
      return await aiAction(input, { retry: true });
    }
    
    return result;
  } catch (error) {
    if (error.type === 'rate_limit') {
      // Wait and retry
      await sleep(60000);
      return await robustWorkflow();
    }
    
    // Escalate to human
    await notifyHuman(error, input);
    return fallbackResponse();
  }
}`}</div></div> }
function AutoQuiz() { return <QuizGeneric question="What are the four parts of an automated workflow?" options={['Input, Process, Output, Storage', 'Trigger, Condition, Action, Output', 'Start, Run, Check, End', 'Plan, Execute, Review, Deploy']} correct={1} explanation="Automated workflows follow the pattern: Trigger (what starts it), Condition (should it continue?), Action (what happens), and Output (where results go)." /> }
