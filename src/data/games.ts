import {
  Swords, Puzzle, HelpCircle, Search, Dna, Network, ShieldAlert,
  Keyboard, Clock, Trophy, Lock, KeyRound, Flame,
} from 'lucide-react'
import type { Difficulty, GameSlug } from '@/types'

export const dailyChallenges = [
  { id: 'quest-prompt', title: 'First Prompt', description: 'Build your first prompt!', xp: 50, icon: '✍️', href: '/sandbox/prompt-builder' },
  { id: 'quest-speed', title: 'Speed Demon', description: 'Type as fast as you can!', xp: 100, icon: '⚡', href: '/games/speed-type' },
  { id: 'quest-bias', title: 'Bias Spotter', description: 'Find the hidden bias!', xp: 120, icon: '🔍', href: '/games/bias-detective' },
  { id: 'quest-escape', title: 'Room Breaker', description: 'Escape the AI room!', xp: 80, icon: '🔓', href: '/games/ai-escape-room' },
  { id: 'quest-myth', title: 'Myth Buster', description: 'Bust some AI myths!', xp: 75, icon: '🔥', href: '/games/ai-myth-busters' },
  { id: 'quest-heist', title: 'Secret Agent', description: 'Complete a stealth mission!', xp: 110, icon: '🕵️', href: '/games/prompt-heist' },
]

export const games: Array<{ slug: GameSlug; title: string; description: string; icon: typeof Swords; color: string; xp: number; difficulty: Difficulty; tag: string; playTime: string }> = [
  { slug: 'prompt-duel', title: 'Prompt Duel', description: 'Race to write the best prompt!', icon: Swords, color: 'from-red-500 to-orange-500', xp: 150, difficulty: 'Medium', tag: '🔥 Popular', playTime: '5 min' },
  { slug: 'token-tetris', title: 'Token Tetris', description: 'Fit prompts into a token budget!', icon: Puzzle, color: 'from-cyan-500 to-blue-500', xp: 120, difficulty: 'Easy', tag: '🧩 Puzzle', playTime: '4 min' },
  { slug: 'ai-jeopardy', title: 'AI Jeopardy', description: '25 questions, 5 categories — go!', icon: HelpCircle, color: 'from-blue-500 to-purple-500', xp: 200, difficulty: 'Medium', tag: '🏆 Classic', playTime: '8 min' },
  { slug: 'hallucination-hunter', title: 'Hallucination Hunter', description: 'Spot the AI lies! 3 strikes = out.', icon: Search, color: 'from-orange-500 to-red-500', xp: 180, difficulty: 'Hard', tag: '🔍 Detective', playTime: '6 min' },
  { slug: 'prompt-evolution', title: 'Prompt Evolution', description: 'Evolve a bad prompt into a great one!', icon: Dna, color: 'from-green-500 to-emerald-500', xp: 160, difficulty: 'Medium', tag: '🧬 Creative', playTime: '7 min' },
  { slug: 'neural-network-builder', title: 'Neural Network Builder', description: 'Build a brain, layer by layer!', icon: Network, color: 'from-purple-500 to-pink-500', xp: 250, difficulty: 'Hard', tag: '🧠 Deep', playTime: '5 min' },
  { slug: 'bias-detective', title: 'Bias Detective', description: 'Crack cases and spot hidden bias!', icon: ShieldAlert, color: 'from-amber-500 to-orange-500', xp: 170, difficulty: 'Medium', tag: '⚖️ Ethics', playTime: '6 min' },
  { slug: 'speed-type', title: 'Speed Type AI', description: '60 seconds of typing madness!', icon: Keyboard, color: 'from-emerald-500 to-cyan-500', xp: 100, difficulty: 'Easy', tag: '⌨️ Speed', playTime: '1 min' },
  { slug: 'ai-timeline', title: 'AI Timeline', description: 'Sort AI history milestones!', icon: Clock, color: 'from-violet-500 to-purple-500', xp: 130, difficulty: 'Easy', tag: '📅 History', playTime: '4 min' },
  { slug: 'model-arena', title: 'Model Arena', description: 'Judge which AI answer is better!', icon: Trophy, color: 'from-yellow-500 to-amber-500', xp: 140, difficulty: 'Medium', tag: '⚔️ Versus', playTime: '5 min' },
  { slug: 'ai-escape-room', title: 'AI Escape Room', description: 'Solve puzzles to escape 4 rooms!', icon: Lock, color: 'from-red-500 to-rose-600', xp: 220, difficulty: 'Hard', tag: '🔒 Puzzle', playTime: '10 min' },
  { slug: 'prompt-heist', title: 'Prompt Heist', description: 'Go undercover on 3 stealth missions!', icon: KeyRound, color: 'from-amber-500 to-red-600', xp: 200, difficulty: 'Hard', tag: '🕵️ Stealth', playTime: '8 min' },
  { slug: 'ai-myth-busters', title: 'AI Myth Busters', description: 'Myth or Fact? You decide!', icon: Flame, color: 'from-violet-500 to-fuchsia-500', xp: 150, difficulty: 'Medium', tag: '🔥 Quick', playTime: '5 min' },
]

export const difficultyColor: Record<Difficulty, string> = {
  Easy: 'bg-green/10 text-green border-green/20',
  Medium: 'bg-gold/10 text-gold border-gold/20',
  Hard: 'bg-red/10 text-red border-red/20',
}
