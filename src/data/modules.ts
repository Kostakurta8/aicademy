import { Brain, Wand2, Wrench, Code2, Scale, Rocket, Image, Bot } from 'lucide-react'

// Ordered learning path — this is the LINEAR sequence (consistent across app)
export const learningPath = [
  { slug: 'foundations', title: 'AI Foundations', icon: '🧠', emoji: '🧠', totalLessons: 3, color: 'from-purple to-blue' },
  { slug: 'prompt-engineering', title: 'Prompt Engineering', icon: '✍️', emoji: '✍️', totalLessons: 4, color: 'from-blue to-cyan' },
  { slug: 'tools-ecosystem', title: 'AI Tools', icon: '🛠️', emoji: '🛠️', totalLessons: 3, color: 'from-cyan to-green' },
  { slug: 'building-with-apis', title: 'Building with APIs', icon: '🔗', emoji: '🔗', totalLessons: 4, color: 'from-green to-gold' },
  { slug: 'ethics', title: 'Ethics & Thinking', icon: '⚖️', emoji: '⚖️', totalLessons: 3, color: 'from-gold to-orange' },
  { slug: 'real-world-projects', title: 'Real Projects', icon: '🚀', emoji: '🚀', totalLessons: 3, color: 'from-orange to-pink' },
  { slug: 'image-video-audio', title: 'Media AI', icon: '🎨', emoji: '🎨', totalLessons: 3, color: 'from-pink to-purple' },
  { slug: 'agents-automation', title: 'AI Agents', icon: '🤖', emoji: '🤖', totalLessons: 3, color: 'from-purple to-red' },
]

export const TOTAL_LESSONS = learningPath.reduce((sum, m) => sum + m.totalLessons, 0)

export const quickActions = [
  { label: 'Learn', href: '/modules', gradient: 'from-blue to-cyan', emoji: '📚' },
  { label: 'Play', href: '/games', gradient: 'from-green to-gold', emoji: '🎮' },
  { label: 'Prompt', href: '/prompting', gradient: 'from-purple to-pink', emoji: '✨' },
  { label: 'Cards', href: '/flashcards', gradient: 'from-orange to-red', emoji: '🃏' },
]

export const modules = [
  {
    slug: 'foundations',
    title: 'Foundations of AI',
    tagline: 'What is AI? 🤔',
    description: 'LLMs, tokens & context windows.',
    icon: Brain,
    accent: 'purple',
    difficulty: 'beginner' as const,
    lessons: 3,
    estimatedHours: 3,
    xpReward: 800,
  },
  {
    slug: 'prompt-engineering',
    title: 'Prompt Engineering',
    tagline: 'Talk to AI like a pro ✍️',
    description: 'Craft prompts that actually work.',
    icon: Wand2,
    accent: 'green',
    difficulty: 'beginner' as const,
    lessons: 4,
    estimatedHours: 4,
    xpReward: 1000,
  },
  {
    slug: 'tools-ecosystem',
    title: 'AI Tools Ecosystem',
    tagline: 'Know your tools 🛠️',
    description: 'ChatGPT, Claude, Gemini & more.',
    icon: Wrench,
    accent: 'blue',
    difficulty: 'beginner' as const,
    lessons: 3,
    estimatedHours: 3,
    xpReward: 800,
  },
  {
    slug: 'building-with-apis',
    title: 'Building with APIs',
    tagline: 'Code meets AI 🔗',
    description: 'Connect AI to your apps.',
    icon: Code2,
    accent: 'blue',
    difficulty: 'intermediate' as const,
    lessons: 4,
    estimatedHours: 5,
    xpReward: 1200,
  },
  {
    slug: 'ethics',
    title: 'Ethics & Critical Thinking',
    tagline: 'Use AI responsibly ⚖️',
    description: 'Bias, hallucinations & deepfakes.',
    icon: Scale,
    accent: 'orange',
    difficulty: 'beginner' as const,
    lessons: 3,
    estimatedHours: 3,
    xpReward: 800,
  },
  {
    slug: 'real-world-projects',
    title: 'Real-World Projects',
    tagline: 'Build something real 🚀',
    description: 'Hands-on guided projects.',
    icon: Rocket,
    accent: 'pink',
    difficulty: 'intermediate' as const,
    lessons: 3,
    estimatedHours: 5,
    xpReward: 1200,
  },
  {
    slug: 'image-video-audio',
    title: 'Image, Video & Audio',
    tagline: 'AI gets creative 🎨',
    description: 'Generate images, video & music.',
    icon: Image,
    accent: 'pink',
    difficulty: 'beginner' as const,
    lessons: 3,
    estimatedHours: 3,
    xpReward: 800,
  },
  {
    slug: 'agents-automation',
    title: 'Agents & Automation',
    tagline: 'AI that acts 🤖',
    description: 'Build agents & workflows.',
    icon: Bot,
    accent: 'cyan',
    difficulty: 'advanced' as const,
    lessons: 3,
    estimatedHours: 5,
    xpReward: 1200,
  },
]

export const difficultyMap = {
  beginner: 'easy' as const,
  intermediate: 'medium' as const,
  advanced: 'hard' as const,
}

export const accentColors: Record<string, string> = {
  purple: 'from-purple to-purple/60',
  green: 'from-green to-green/60',
  blue: 'from-blue to-blue/60',
  orange: 'from-orange to-orange/60',
  pink: 'from-pink to-pink/60',
  cyan: 'from-cyan to-cyan/60',
}
