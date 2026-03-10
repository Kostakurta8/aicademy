'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import DifficultyBadge from '@/components/ui/DifficultyBadge'
import { ArrowLeft, Play, Clock, Star, BookOpen, CheckCircle, Trophy, ArrowRight } from 'lucide-react'
import { useProgressStore } from '@/stores/progress-store'

const moduleData: Record<string, {
  title: string; tagline: string; description: string; accent: string; icon: string;
  lessons: { slug: string; title: string; estimatedMinutes: number; steps: number; xpReward: number; difficulty: 'easy' | 'medium' | 'hard'; description: string }[];
}> = {
  foundations: {
    title: 'Foundations of AI', tagline: 'What is this thing, actually?',
    description: 'Understand how AI and LLMs work from the ground up — tokens, context windows, temperature, and what AI can and can\'t do.',
    accent: 'purple', icon: '🧠',
    lessons: [
      { slug: 'how-llms-work', title: 'How LLMs Actually Work', estimatedMinutes: 25, steps: 5, xpReward: 100, difficulty: 'easy', description: 'Discover how large language models predict the next token.' },
      { slug: 'tokens-and-context', title: 'Tokens, Context Windows & Temperature', estimatedMinutes: 20, steps: 4, xpReward: 100, difficulty: 'medium', description: 'Learn how text becomes tokens and how context window size matters.' },
      { slug: 'capabilities-map', title: 'What AI Can and Can\'t Do', estimatedMinutes: 15, steps: 3, xpReward: 100, difficulty: 'easy', description: 'Map out the real capabilities and limitations of current AI.' },
    ],
  },
  'prompt-engineering': {
    title: 'Prompt Engineering', tagline: 'Talk to AI like a pro',
    description: 'Master the art of writing effective prompts. Learn techniques from zero-shot to chain-of-thought that professional prompt engineers use.',
    accent: 'green', icon: '✍️',
    lessons: [
      { slug: 'prompt-anatomy', title: 'Anatomy of a Perfect Prompt', estimatedMinutes: 20, steps: 4, xpReward: 100, difficulty: 'easy', description: 'Break down what makes a prompt effective: role, context, task, format.' },
      { slug: 'few-shot-techniques', title: 'Few-Shot & Zero-Shot Techniques', estimatedMinutes: 25, steps: 5, xpReward: 120, difficulty: 'medium', description: 'Give examples or let AI figure it out — when to use each approach.' },
      { slug: 'chain-of-thought', title: 'Chain-of-Thought Prompting', estimatedMinutes: 25, steps: 5, xpReward: 120, difficulty: 'medium', description: 'Force AI to show its reasoning step by step for better results.' },
      { slug: 'advanced-techniques', title: 'Advanced Prompt Patterns', estimatedMinutes: 30, steps: 6, xpReward: 150, difficulty: 'hard', description: 'Tree-of-thought, self-consistency, and meta-prompting techniques.' },
    ],
  },
  'tools-ecosystem': {
    title: 'AI Tools Ecosystem', tagline: 'Know your weapons', accent: 'blue', icon: '🛠️',
    description: 'Navigate the landscape of AI tools — ChatGPT, Claude, Gemini, Midjourney, and dozens more.',
    lessons: [
      { slug: 'chatbot-landscape', title: 'The AI Chatbot Landscape', estimatedMinutes: 20, steps: 4, xpReward: 100, difficulty: 'easy', description: 'Compare ChatGPT, Claude, Gemini, and other major AI chatbots.' },
      { slug: 'specialized-tools', title: 'Specialized AI Tools', estimatedMinutes: 20, steps: 4, xpReward: 100, difficulty: 'easy', description: 'Discover AI tools for writing, coding, research, design, and more.' },
      { slug: 'choosing-right-tool', title: 'Choosing the Right Tool', estimatedMinutes: 15, steps: 3, xpReward: 100, difficulty: 'medium', description: 'Decision framework for picking the best AI tool for any task.' },
    ],
  },
  'building-with-apis': {
    title: 'Building with APIs', tagline: 'Code meets AI', accent: 'blue', icon: '🔗',
    description: 'Connect AI to your applications using REST APIs, SDKs, and serverless functions.',
    lessons: [
      { slug: 'api-basics', title: 'API Fundamentals', estimatedMinutes: 25, steps: 5, xpReward: 120, difficulty: 'medium', description: 'HTTP methods, headers, authentication, and making your first API call.' },
      { slug: 'openai-api', title: 'Working with AI APIs', estimatedMinutes: 25, steps: 5, xpReward: 120, difficulty: 'medium', description: 'Chat completions, streaming, function calling, and embeddings.' },
      { slug: 'building-apps', title: 'Building AI-Powered Apps', estimatedMinutes: 30, steps: 6, xpReward: 150, difficulty: 'hard', description: 'Full-stack patterns for AI apps: caching, rate limiting, error handling.' },
      { slug: 'deployment', title: 'Deploying AI Applications', estimatedMinutes: 25, steps: 5, xpReward: 120, difficulty: 'hard', description: 'Cost optimization, monitoring, and scaling AI-powered services.' },
    ],
  },
  ethics: {
    title: 'Ethics & Critical Thinking', tagline: 'Use AI responsibly', accent: 'orange', icon: '⚖️',
    description: 'Understand AI biases, hallucinations, privacy concerns, and learn to use AI ethically.',
    lessons: [
      { slug: 'hallucinations', title: 'AI Hallucinations & Fact-Checking', estimatedMinutes: 20, steps: 4, xpReward: 100, difficulty: 'easy', description: 'Why AI makes things up and how to verify outputs.' },
      { slug: 'bias-fairness', title: 'Bias & Fairness in AI', estimatedMinutes: 25, steps: 5, xpReward: 120, difficulty: 'medium', description: 'How training data creates biased outputs and what to do about it.' },
      { slug: 'responsible-use', title: 'Responsible AI Use', estimatedMinutes: 20, steps: 4, xpReward: 100, difficulty: 'easy', description: 'Privacy, copyright, job impact, and creating ethical AI policies.' },
    ],
  },
  'real-world-projects': {
    title: 'Real-World Projects', tagline: 'Build something real', accent: 'pink', icon: '🚀',
    description: 'Apply everything you\'ve learned in guided, hands-on projects.',
    lessons: [
      { slug: 'content-generator', title: 'Build a Content Generator', estimatedMinutes: 30, steps: 6, xpReward: 150, difficulty: 'medium', description: 'Create a multi-format content generation pipeline.' },
      { slug: 'ai-assistant', title: 'Build a Custom AI Assistant', estimatedMinutes: 35, steps: 7, xpReward: 200, difficulty: 'hard', description: 'Design and build a domain-specific AI assistant from scratch.' },
      { slug: 'data-pipeline', title: 'Build an AI Data Pipeline', estimatedMinutes: 30, steps: 6, xpReward: 150, difficulty: 'hard', description: 'Create an automated pipeline that processes and analyzes data with AI.' },
    ],
  },
  'image-video-audio': {
    title: 'Image, Video & Audio', tagline: 'AI gets creative', accent: 'pink', icon: '🎨',
    description: 'Generate images, edit video, create music, and understand multimodal AI.',
    lessons: [
      { slug: 'image-generation', title: 'AI Image Generation', estimatedMinutes: 25, steps: 5, xpReward: 120, difficulty: 'easy', description: 'Master prompts for Midjourney, DALL-E, and Stable Diffusion.' },
      { slug: 'video-audio', title: 'AI Video & Audio Tools', estimatedMinutes: 20, steps: 4, xpReward: 100, difficulty: 'easy', description: 'Explore AI-powered video editing, voice cloning, and music generation.' },
      { slug: 'multimodal', title: 'Multimodal AI', estimatedMinutes: 25, steps: 5, xpReward: 120, difficulty: 'medium', description: 'Combine text, image, and audio in multi-modal AI workflows.' },
    ],
  },
  'agents-automation': {
    title: 'Agents & Automation', tagline: 'AI that acts', accent: 'cyan', icon: '🤖',
    description: 'Build autonomous AI agents and automated workflows that act independently.',
    lessons: [
      { slug: 'agent-fundamentals', title: 'Agent Fundamentals', estimatedMinutes: 25, steps: 5, xpReward: 120, difficulty: 'medium', description: 'What are AI agents, tool use, ReAct pattern, and agent loops.' },
      { slug: 'multi-agent', title: 'Multi-Agent Systems', estimatedMinutes: 30, steps: 6, xpReward: 150, difficulty: 'hard', description: 'Orchestrate multiple AI agents working together on complex tasks.' },
      { slug: 'automation-workflows', title: 'Automation Workflows', estimatedMinutes: 25, steps: 5, xpReward: 120, difficulty: 'medium', description: 'Build real automation pipelines with triggers, conditions, and actions.' },
    ],
  },
}

export default function ModuleDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const mod = moduleData[slug]
  const progress = useProgressStore((s) => s.moduleProgress[slug])
  const completedLessons = progress?.completedLessons || []
  const completedCount = completedLessons.length
  const isModuleComplete = mod ? completedCount >= mod.lessons.length : false

  // Find the first incomplete lesson (the "next" lesson to take)
  const nextLessonIdx = mod?.lessons.findIndex(l => !completedLessons.includes(l.slug)) ?? -1

  if (!mod) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Module Not Found</h1>
        <Link href="/modules"><Button variant="secondary">Back to Modules</Button></Link>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <Link href="/modules" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors mb-6">
        <ArrowLeft size={16} /> Back to Modules
      </Link>

      <div className="animate-fade-in">
        <div className="flex items-start gap-4 mb-8">
          <span className="text-5xl">{mod.icon}</span>
          <div>
            <p className="text-sm font-medium text-accent mb-1">{mod.tagline}</p>
            <h1 className="text-3xl font-bold text-text-primary mb-2">{mod.title}</h1>
            <p className="text-text-secondary">{mod.description}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-text-muted">
              <span className="flex items-center gap-1"><BookOpen size={14} /> {mod.lessons.length} lessons</span>
              <span className="flex items-center gap-1"><Clock size={14} /> ~{Math.round(mod.lessons.reduce((a, l) => a + l.estimatedMinutes, 0) / 60)}h</span>
              <span className="flex items-center gap-1"><Star size={14} className="text-gold" /> {mod.lessons.reduce((a, l) => a + l.xpReward, 0)} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Complete Banner OR Progress Bar */}
      {isModuleComplete ? (
        <Card padding="md" className="mb-8 border-2 border-green/30 bg-green/5">
          <div className="flex items-center gap-3">
            <Trophy size={24} className="text-green shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-green">Module Complete! 🎉</h3>
              <p className="text-sm text-text-secondary">You&apos;ve mastered all {mod.lessons.length} lessons. Great work!</p>
            </div>
            <span className="text-sm font-bold text-green">{completedCount}/{mod.lessons.length}</span>
          </div>
        </Card>
      ) : (
        <Card padding="sm" className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2 rounded-full bg-border-subtle overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${(completedCount / mod.lessons.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-text-muted">{completedCount}/{mod.lessons.length} complete</span>
          </div>
        </Card>
      )}

      {/* Continue CTA — prominent button for next lesson */}
      {!isModuleComplete && nextLessonIdx >= 0 && (
        <Link href={`/modules/${slug}/${mod.lessons[nextLessonIdx].slug}`}>
          <Card padding="md" className="mb-6 group cursor-pointer border border-accent/20 hover:border-accent/50 transition-all bg-accent/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Play size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-accent">
                  {completedCount === 0 ? 'Start Learning' : 'Continue Learning'}
                </p>
                <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                  {mod.lessons[nextLessonIdx].title}
                </h3>
              </div>
              <ArrowRight size={20} className="text-accent shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>
        </Link>
      )}

      {/* Lessons */}
      <h2 className="text-lg font-semibold text-text-primary mb-4">Lessons</h2>
      <div className="space-y-3">
        {mod.lessons.map((lesson, idx) => {
          const isDone = completedLessons.includes(lesson.slug)
          const isNext = idx === nextLessonIdx
          const iconStyle = isDone
            ? 'bg-green/20 text-green'
            : isNext ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'

          return (
            <div key={lesson.slug}>
              <Link href={`/modules/${slug}/${lesson.slug}`}>
                <Card padding="md" className={`group ${isNext ? 'ring-2 ring-accent/40' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${iconStyle}`}>
                      {isDone ? <CheckCircle size={20} /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base font-semibold transition-colors ${
                        isDone
                          ? 'text-green group-hover:text-accent'
                          : 'text-text-primary group-hover:text-accent'
                      }`}>
                        {lesson.title}
                        {isDone && <span className="ml-2 text-xs text-green">✓ Complete</span>}
                        {isNext && !isDone && <span className="ml-2 text-xs text-accent font-medium">← Up next</span>}
                      </h3>
                      <p className="text-sm text-text-secondary mt-0.5">{lesson.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1"><Clock size={12} /> {lesson.estimatedMinutes} min</span>
                        <span>{lesson.steps} steps</span>
                        <span className="flex items-center gap-1"><Star size={12} className="text-gold" /> {lesson.xpReward} XP</span>
                        <DifficultyBadge difficulty={lesson.difficulty} />
                      </div>
                    </div>
                    <Play size={20} className="text-text-muted group-hover:text-accent transition-colors shrink-0" />
                  </div>
                </Card>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
