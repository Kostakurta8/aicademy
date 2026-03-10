'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ConfettiBurst, AnimatedScore, ScreenFlash, XPPopup, StreakFire, LivesDisplay, ProgressDots } from '@/components/ui/GameEffects'
import { useXPStore } from '@/stores/xp-store'
import { useUserStore } from '@/stores/user-store'
import { playCorrect, playIncorrect, playLevelUp, playXPDing } from '@/lib/sounds'
import {
  ArrowLeft, Check, X, Star, RotateCcw, Brain, Sparkles,
  AlertTriangle, CheckCircle, Lightbulb, ChevronRight,
  Flame, Trophy, Zap, ThumbsUp, ThumbsDown, HelpCircle,
  BookOpen, Shield, Eye, Cpu, MessageSquare,
} from 'lucide-react'

// === MYTH DATA ===
interface AIMyth {
  id: number
  statement: string
  isMyth: boolean // true = it's a myth (FALSE statement), false = it's a fact (TRUE statement)
  category: string
  categoryIcon: React.ReactNode
  difficulty: 1 | 2 | 3
  explanation: string
  deepDive: string
  source: string
}

const allMyths: AIMyth[] = [
  // MYTHS (false statements)
  {
    id: 1,
    statement: 'AI understands the meaning of the text it generates.',
    isMyth: true,
    category: 'How AI Works',
    categoryIcon: <Cpu size={14} />,
    difficulty: 1,
    explanation: 'MYTH! LLMs don\'t "understand" anything. They predict the next most likely token based on statistical patterns from training data. There\'s no comprehension, consciousness, or meaning — just very sophisticated pattern matching.',
    deepDive: 'This is called the "Chinese Room" problem. An LLM is like someone who follows rules to respond in Chinese without understanding Chinese. The outputs look meaningful, but there\'s no understanding behind them.',
    source: 'Searle\'s Chinese Room Argument (1980)',
  },
  {
    id: 2,
    statement: 'AI can become sentient if given enough data and compute power.',
    isMyth: true,
    category: 'AI Capabilities',
    categoryIcon: <Brain size={14} />,
    difficulty: 2,
    explanation: 'MYTH! There is zero evidence that scaling data or compute leads to sentience. Current AI architectures (transformers, neural networks) process information fundamentally differently from biological brains. More data = better pattern matching, NOT consciousness.',
    deepDive: 'Sentience requires subjective experience (qualia). No amount of matrix multiplication creates subjective experience. The "more compute = sentience" myth confuses performance improvement with emergence of consciousness.',
    source: 'Computational theory of mind debate',
  },
  {
    id: 3,
    statement: 'A larger model (more parameters) is always better than a smaller one.',
    isMyth: true,
    category: 'AI Models',
    categoryIcon: <Cpu size={14} />,
    difficulty: 1,
    explanation: 'MYTH! Smaller, well-tuned models often outperform larger ones on specific tasks. A 7B parameter model fine-tuned for coding can beat a 70B general model at code. Plus, larger models are slower, more expensive, and harder to deploy.',
    deepDive: 'The "Chinchilla scaling laws" showed that training data quality and quantity matter more than raw parameter count. Microsoft\'s Phi models proved small models can rival much larger ones with curated training data.',
    source: 'Chinchilla Scaling Laws (Hoffmann et al., 2022)',
  },
  {
    id: 4,
    statement: 'AI-generated content is always plagiarized from training data.',
    isMyth: true,
    category: 'AI Output',
    categoryIcon: <MessageSquare size={14} />,
    difficulty: 2,
    explanation: 'MYTH! LLMs generate new text by combining learned patterns — they don\'t copy-paste from training data (though it can rarely happen with heavily repeated content). It\'s more like how a human writer is influenced by books they\'ve read.',
    deepDive: 'LLMs learn statistical relationships between tokens, not memorized passages. However, "memorization" of training data CAN happen with frequently repeated text (like famous quotes or code snippets). This is an active area of research.',
    source: 'Carlini et al., "Extracting Training Data from Large Language Models" (2021)',
  },
  {
    id: 5,
    statement: 'Prompt engineering is just about being polite to the AI.',
    isMyth: true,
    category: 'Prompt Engineering',
    categoryIcon: <MessageSquare size={14} />,
    difficulty: 1,
    explanation: 'MYTH! Prompt engineering is about structuring inputs for optimal outputs — defining roles, giving context, specifying formats, providing examples (few-shot), and using techniques like chain-of-thought. Politeness has zero effect on output quality.',
    deepDive: 'Key techniques include: RCFT framework (Role-Context-Format-Task), few-shot prompting (examples), chain-of-thought (step-by-step reasoning), and constitutional prompting (giving the AI rules to follow). None involve politeness.',
    source: 'Wei et al., "Chain-of-Thought Prompting" (2022)',
  },
  {
    id: 6,
    statement: 'AI will replace all programmers within the next few years.',
    isMyth: true,
    category: 'AI & Society',
    categoryIcon: <Shield size={14} />,
    difficulty: 1,
    explanation: 'MYTH! AI is a powerful coding tool, but it can\'t architect systems, understand business requirements, debug complex issues, or make design decisions. It augments developers rather than replacing them — like how calculators didn\'t replace mathematicians.',
    deepDive: 'AI coding assistants boost productivity 30-50% on routine tasks but struggle with novel problems, system-level thinking, and multi-step debugging. The most valuable developer skills (architecture, communication, problem decomposition) remain uniquely human.',
    source: 'GitHub Copilot productivity studies (2023)',
  },
  {
    id: 7,
    statement: 'If an AI is confident in its answer, the answer is likely correct.',
    isMyth: true,
    category: 'AI Reliability',
    categoryIcon: <AlertTriangle size={14} />,
    difficulty: 2,
    explanation: 'MYTH! LLMs are equally confident whether they\'re right or wrong — they generate the most probable next token regardless of factual accuracy. A hallucinated answer sounds just as confident as a correct one. NEVER trust confidence as a signal of accuracy.',
    deepDive: 'This is called "calibration failure." LLMs aren\'t calibrated — their tone doesn\'t reflect their actual confidence. A model saying "I\'m 95% sure" doesn\'t mean 95% accuracy. Always verify important claims externally.',
    source: 'Kadavath et al., "Language Models (Mostly) Know What They Know" (2022)',
  },
  {
    id: 8,
    statement: 'Fine-tuning an AI model requires millions of examples.',
    isMyth: true,
    category: 'AI Training',
    categoryIcon: <Cpu size={14} />,
    difficulty: 3,
    explanation: 'MYTH! Modern fine-tuning techniques like LoRA and QLoRA can adapt a model with as few as 100-1,000 high-quality examples. Quality trumps quantity. A small, curated dataset often produces better results than a massive noisy one.',
    deepDive: 'LoRA (Low-Rank Adaptation) only updates a small fraction of model weights, making fine-tuning possible with minimal data and compute. Some techniques like "instruct-tuning" work with just dozens of carefully crafted examples.',
    source: 'Hu et al., "LoRA: Low-Rank Adaptation" (2021)',
  },
  // FACTS (true statements)
  {
    id: 9,
    statement: 'AI can exhibit bias that reflects biases in its training data.',
    isMyth: false,
    category: 'AI Ethics',
    categoryIcon: <Shield size={14} />,
    difficulty: 1,
    explanation: 'FACT! AI models absolutely reflect biases in their training data. If the data contains gender, racial, or cultural biases, the model will reproduce and sometimes amplify them. This is why dataset curation and bias testing are crucial.',
    deepDive: 'Famous example: Amazon\'s hiring AI was trained on 10 years of resumes (mostly male applicants) and learned to penalize women\'s resumes. The AI didn\'t "decide" to be sexist — it learned patterns from biased data.',
    source: 'Bolukbasi et al., "Man is to Computer Programmer as Woman is to Homemaker"',
  },
  {
    id: 10,
    statement: 'GPT-4 was trained on data with a knowledge cutoff (it doesn\'t know recent events).',
    isMyth: false,
    category: 'How AI Works',
    categoryIcon: <Cpu size={14} />,
    difficulty: 1,
    explanation: 'FACT! LLMs are trained on data up to a specific date. They don\'t browse the internet (unless given that tool) and genuinely don\'t know about events after their training cutoff. This is a fundamental limitation of pre-trained models.',
    deepDive: 'This is why RAG (Retrieval-Augmented Generation) was invented — it lets an LLM access current information by searching a knowledge base. Without RAG, the model\'s knowledge is frozen at its training date.',
    source: 'OpenAI model documentation',
  },
  {
    id: 11,
    statement: 'The same prompt can give different answers each time due to temperature settings.',
    isMyth: false,
    category: 'AI Models',
    categoryIcon: <Cpu size={14} />,
    difficulty: 2,
    explanation: 'FACT! Temperature controls randomness in token selection. At temperature 0, the model always picks the most likely token (deterministic). At higher temperatures, it samples from a wider distribution, producing varied outputs.',
    deepDive: 'Temperature 0 = always the same answer. Temperature 0.7 = creative but coherent. Temperature 1.5+ = wild, unpredictable. For factual tasks, use low temperature. For creative writing, use higher temperature.',
    source: 'Transformer architecture specification',
  },
  {
    id: 12,
    statement: 'Transformer models process all tokens in a sequence simultaneously, not one by one.',
    isMyth: false,
    category: 'How AI Works',
    categoryIcon: <Cpu size={14} />,
    difficulty: 3,
    explanation: 'FACT! Unlike RNNs that process tokens sequentially, transformers use self-attention to process all tokens in parallel. This parallelism is what makes transformers fast to train and why they can capture long-range dependencies.',
    deepDive: 'The self-attention mechanism computes relationships between ALL token pairs simultaneously. This "all-at-once" processing is why GPUs (which excel at parallel computation) are so important for transformer training.',
    source: 'Vaswani et al., "Attention is All You Need" (2017)',
  },
  {
    id: 13,
    statement: 'An AI trained on English can sometimes handle other languages it wasn\'t explicitly trained for.',
    isMyth: false,
    category: 'AI Capabilities',
    categoryIcon: <Brain size={14} />,
    difficulty: 3,
    explanation: 'FACT! This is called "cross-lingual transfer." Large models trained predominantly on English can exhibit surprising ability in other languages, especially related ones. This happens because multilingual text in the training data creates shared representations.',
    deepDive: 'Models like GPT-4 have emergent multilingual ability because their internet training data includes text in many languages. The shared tokenizer and embedding space allows concepts learned in one language to partially transfer.',
    source: 'Pires et al., "How Multilingual is Multilingual BERT?" (2019)',
  },
  {
    id: 14,
    statement: 'Prompt injection attacks can make AI systems ignore their safety instructions.',
    isMyth: false,
    category: 'AI Security',
    categoryIcon: <Shield size={14} />,
    difficulty: 2,
    explanation: 'FACT! Prompt injection is a real security vulnerability where malicious inputs override system-level instructions. For example, hidden text in a document could tell the AI to ignore its safety rules. This remains an unsolved problem in AI security.',
    deepDive: 'There is currently NO foolproof defense against prompt injection. System prompts can be extracted, safety rules can be overridden through creative rephrasing, and indirect injection (via external data) is extremely hard to prevent.',
    source: 'OWASP Top 10 for LLMs (2023)',
  },
  {
    id: 15,
    statement: 'Reinforcement Learning from Human Feedback (RLHF) is used to align AI with human values.',
    isMyth: false,
    category: 'AI Training',
    categoryIcon: <Cpu size={14} />,
    difficulty: 3,
    explanation: 'FACT! RLHF trains a "reward model" from human preferences, then uses it to fine-tune the LLM. Humans rank multiple AI outputs, and the model learns to prefer outputs humans rated higher. This is how ChatGPT became "helpful and harmless."',
    deepDive: 'The process: (1) Train a reward model from human comparisons, (2) Use PPO (Proximal Policy Optimization) to update the LLM to maximize the reward model\'s score. Alternatives like DPO (Direct Preference Optimization) simplify this pipeline.',
    source: 'Ouyang et al., "Training language models to follow instructions with human feedback" (2022)',
  },
  {
    id: 16,
    statement: 'AI models can be "jailbroken" to bypass their safety training.',
    isMyth: false,
    category: 'AI Security',
    categoryIcon: <Shield size={14} />,
    difficulty: 2,
    explanation: 'FACT! Jailbreaking is real and well-documented. Techniques like role-playing scenarios, base64 encoding, "DAN" prompts, and multi-turn attacks can bypass safety training. AI companies constantly patch new jailbreaks, but it remains an ongoing arms race.',
    deepDive: 'Safety training is a "fine-tuning veneer" on top of the base model\'s capabilities. The base model CAN generate harmful content — safety training just makes it refuse. Jailbreaks essentially undo or circumvent that training layer.',
    source: 'Shen et al., "Do Anything Now: Characterizing and Evaluating In-The-Wild Jailbreak Prompts" (2023)',
  },
]

// Difficulty-specific round configs
const difficultyConfigs = {
  rookie: { label: 'Rookie', rounds: 8, myths: () => allMyths.filter(m => m.difficulty <= 2), lives: 3, timePerQuestion: 20, color: 'from-green to-emerald-400' },
  agent: { label: 'Agent', rounds: 12, myths: () => allMyths, lives: 3, timePerQuestion: 15, color: 'from-blue to-cyan-400' },
  mastermind: { label: 'Mastermind', rounds: 16, myths: () => allMyths, lives: 2, timePerQuestion: 10, color: 'from-red to-orange-400' },
}

type Difficulty = keyof typeof difficultyConfigs

export default function AIMythBusters() {
  const [phase, setPhase] = useState<'menu' | 'playing' | 'results'>('menu')
  const [difficulty, setDifficulty] = useState<Difficulty>('rookie')
  const [roundQueue, setRoundQueue] = useState<AIMyth[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [answer, setAnswer] = useState<'myth' | 'fact' | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [showDeepDive, setShowDeepDive] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFlash, setShowFlash] = useState<'green' | 'red' | null>(null)
  const [showXP, setShowXP] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isTimerActive, setIsTimerActive] = useState(false)
  // Card flip animation
  const [isFlipping, setIsFlipping] = useState(false)

  const soundEnabled = useUserStore((s) => s.soundEnabled)
  const addXP = useXPStore((s) => s.addXP)

  const config = difficultyConfigs[difficulty]
  const currentMyth = roundQueue[currentIndex]

  const handleAnswer = (playerAnswer: 'myth' | 'fact') => {
    setIsTimerActive(false)
    setAnswer(playerAnswer)

    const isCorrect = (playerAnswer === 'myth') === currentMyth.isMyth

    if (isCorrect) {
      const timeBonus = Math.floor(timeLeft * 5)
      const streakBonus = streak >= 3 ? 75 : streak >= 2 ? 40 : 0
      const difficultyBonus = currentMyth.difficulty * 25
      const points = 100 + timeBonus + streakBonus + difficultyBonus
      setScore(s => s + points)
      setStreak(s => s + 1)
      setBestStreak(b => Math.max(b, streak + 1))
      setCorrect(c => c + 1)
      setShowFlash('green')
      if (soundEnabled) playCorrect()
    } else {
      setLives(l => l - 1)
      setStreak(0)
      setWrong(w => w + 1)
      setShowFlash('red')
      if (soundEnabled) playIncorrect()
    }

    setTimeout(() => setShowFlash(null), 500)
    setIsFlipping(true)
    setTimeout(() => {
      setShowResult(true)
      setIsFlipping(false)
    }, 400)
  }

  // Timer
  useEffect(() => {
    if (!isTimerActive || showResult) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer)
          handleAnswer(currentMyth.isMyth ? 'fact' : 'myth') // Wrong answer on timeout
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isTimerActive, showResult, currentIndex])

  const startGame = (diff: Difficulty) => {
    const cfg = difficultyConfigs[diff]
    const pool = cfg.myths()
    // Shuffle and pick rounds
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, cfg.rounds)
    setDifficulty(diff)
    setRoundQueue(shuffled)
    setCurrentIndex(0)
    setScore(0)
    setLives(cfg.lives)
    setStreak(0)
    setBestStreak(0)
    setCorrect(0)
    setWrong(0)
    setAnswer(null)
    setShowResult(false)
    setShowDeepDive(false)
    setShowConfetti(false)
    setShowXP(false)
    setTimeLeft(cfg.timePerQuestion)
    setIsTimerActive(true)
    setPhase('playing')
  }

  const nextRound = () => {
    if (lives <= 0 || currentIndex >= roundQueue.length - 1) {
      // Game over
      if (lives > 0 && correct > wrong) {
        setShowConfetti(true)
        if (soundEnabled) playLevelUp()
      }
      const xpEarned = Math.floor(score / 12) + 75
      addXP(xpEarned)
      setShowXP(true)
      setTimeout(() => setShowXP(false), 2500)
      setPhase('results')
      return
    }
    setCurrentIndex(i => i + 1)
    setAnswer(null)
    setShowResult(false)
    setShowDeepDive(false)
    setTimeLeft(config.timePerQuestion)
    setIsTimerActive(true)
  }

  // === MENU ===
  if (phase === 'menu') {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Link href="/games" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent mb-6">
          <ArrowLeft size={16} /> Back to Games
        </Link>
        <div className="animate-fade-in text-center">
          <div
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/20 animate-celebrate-pop"
          >
            <Flame size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-3">AI Myth Busters</h1>
          <p className="text-text-secondary max-w-lg mx-auto mb-8">
            Can you tell AI facts from fiction? Statements flash on screen — smash <strong>MYTH</strong> or <strong>FACT</strong>
            before time runs out. Wrong answers cost lives!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            {(Object.entries(difficultyConfigs) as [Difficulty, typeof difficultyConfigs.rookie][]).map(([key, cfg], i) => (
              <div key={key} style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }} className="animate-fade-in">
                <Card padding="lg" className="text-center cursor-pointer hover:border-accent/40 transition-all" onClick={() => startGame(key)}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center mx-auto mb-3 text-white`}>
                    {key === 'rookie' ? <ThumbsUp size={24} /> : key === 'agent' ? <Brain size={24} /> : <Flame size={24} />}
                  </div>
                  <p className="text-base font-bold text-text-primary">{cfg.label}</p>
                  <div className="flex flex-col gap-0.5 mt-2 text-xs text-text-muted">
                    <span>{cfg.rounds} questions</span>
                    <span>{cfg.lives} lives · {cfg.timePerQuestion}s timer</span>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-text-secondary">
            <span className="flex items-center gap-1"><Zap size={14} className="text-gold" /> Streak Bonuses</span>
            <span className="flex items-center gap-1"><BookOpen size={14} className="text-blue" /> Deep Dive Explanations</span>
            <span className="flex items-center gap-1"><Star size={14} className="text-purple" /> 3 Difficulty Levels</span>
          </div>
        </div>
      </div>
    )
  }

  // === RESULTS ===
  if (phase === 'results') {
    const accuracy = roundQueue.length > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0
    const xpEarned = Math.floor(score / 12) + 75
    const survived = lives > 0

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto text-center">
        <ConfettiBurst trigger={showConfetti && survived} color="multi" />
        <XPPopup amount={xpEarned} show={showXP} />
        <div className="animate-celebrate-pop">
          <div
            className={`w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-celebrate-pop ${
              survived ? 'bg-gradient-to-br from-gold to-amber-400 shadow-gold/20' : 'bg-gradient-to-br from-red to-orange-500 shadow-red/20'
            }`}
          >
            {survived ? <Trophy size={48} className="text-white" /> : <X size={48} className="text-white" />}
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            {survived ? accuracy >= 80 ? '🧠 Myth Buster Master!' : '✅ You Survived!' : '💀 Busted!'}
          </h1>
          <p className="text-text-secondary mb-6">
            {survived
              ? `You correctly identified ${correct} out of ${correct + wrong} statements on ${config.label} difficulty!`
              : `You ran out of lives after ${correct + wrong} statements. Study the explanations and try again!`}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Score', value: score, icon: <Star size={18} className="text-gold" /> },
              { label: 'Accuracy', value: `${accuracy}%`, icon: <CheckCircle size={18} className="text-green" /> },
              { label: 'Best Streak', value: bestStreak, icon: <Flame size={18} className="text-orange" /> },
              { label: 'Correct', value: `${correct}/${correct + wrong}`, icon: <ThumbsUp size={18} className="text-blue" /> },
            ].map((stat, i) => (
              <div key={stat.label} style={{ animationDelay: `${(0.3 + i * 0.1)}s`, animationFillMode: 'both' }} className="animate-fade-in">
                <Card padding="md" className="text-center">
                  <div className="flex justify-center mb-2">{stat.icon}</div>
                  <p className="text-xl font-bold text-text-primary">{stat.value}</p>
                  <p className="text-xs text-text-muted">{stat.label}</p>
                </Card>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-3">
            <Button onClick={() => startGame(difficulty)} icon={<RotateCcw size={16} />}>Play Again</Button>
            <Button onClick={() => setPhase('menu')} variant="secondary">Change Difficulty</Button>
            <Link href="/games"><Button variant="secondary">Back to Games</Button></Link>
          </div>
        </div>
      </div>
    )
  }

  // === PLAYING ===
  const isCorrect = answer ? (answer === 'myth') === currentMyth.isMyth : null
  const progressPercent = ((currentIndex + (showResult ? 1 : 0)) / roundQueue.length) * 100
  const timerPercent = (timeLeft / config.timePerQuestion) * 100

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <ScreenFlash trigger={!!showFlash} color={showFlash || 'green'} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/games" className="text-sm text-text-muted hover:text-accent"><ArrowLeft size={16} /></Link>
        <div className="flex items-center gap-4">
          <AnimatedScore value={score} label="Score" icon={<Star size={14} className="text-gold" />} size="sm" />
          {streak >= 3 && <StreakFire streak={streak} />}
          <LivesDisplay lives={lives} maxLives={config.lives} />
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs text-text-muted font-medium">{currentIndex + 1}/{roundQueue.length}</span>
        <div className="flex-1 h-2 rounded-full bg-border-subtle overflow-hidden">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${progressPercent}%`, transition: 'width 0.3s ease' }}
          />
        </div>
        <span className="text-xs text-text-muted font-medium">{config.label}</span>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 rounded-full bg-border-subtle overflow-hidden mb-6">
        <div
          className={`h-full rounded-full ${timeLeft <= 5 ? 'bg-red' : timeLeft <= 10 ? 'bg-orange' : 'bg-green'}`}
          style={{ width: `${timerPercent}%`, transition: 'width 0.5s ease' }}
        />
      </div>

      {/* Statement Card */}
        <div
          key={currentMyth.id}
          className={`animate-fade-in`}
        >
          <Card padding="lg" className={`text-center mb-6 ${showResult ? (isCorrect ? 'border-green/40' : 'border-red/40') : ''}`}>
            {/* Category */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-surface-raised text-xs font-medium text-text-muted flex items-center gap-1.5">
                {currentMyth.categoryIcon} {currentMyth.category}
              </span>
              <span className="px-2 py-1 rounded-full bg-surface-raised text-xs text-text-muted">
                {'★'.repeat(currentMyth.difficulty)}{'☆'.repeat(3 - currentMyth.difficulty)}
              </span>
            </div>

            {/* Statement */}
            {!showResult ? (
              <>
                <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center mx-auto mb-4">
                  <HelpCircle size={24} className="text-accent" />
                </div>
                <p className="text-xl font-semibold text-text-primary leading-relaxed mb-4">
                  &ldquo;{currentMyth.statement}&rdquo;
                </p>
                <p className="text-sm text-text-muted">Is this a myth or a fact?</p>
              </>
            ) : (
              <>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  currentMyth.isMyth ? 'bg-red/10' : 'bg-green/10'
                }`}>
                  {currentMyth.isMyth
                    ? <X size={24} className="text-red" />
                    : <Check size={24} className="text-green" />}
                </div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    currentMyth.isMyth ? 'bg-red/10 text-red' : 'bg-green/10 text-green'
                  }`}>
                    {currentMyth.isMyth ? '❌ MYTH' : '✅ FACT'}
                  </span>
                  {isCorrect !== null && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isCorrect ? 'bg-green/10 text-green' : 'bg-red/10 text-red'
                    }`}>
                      {isCorrect ? 'You got it right!' : 'Wrong answer'}
                    </span>
                  )}
                </div>
                <p className="text-base text-text-primary font-medium mb-3">
                  &ldquo;{currentMyth.statement}&rdquo;
                </p>
                <p className="text-sm text-text-secondary mb-3">{currentMyth.explanation}</p>

                {/* Deep Dive Toggle */}
                {!showDeepDive ? (
                  <button onClick={() => setShowDeepDive(true)} className="text-xs text-accent hover:text-accent/80 flex items-center gap-1 mx-auto cursor-pointer">
                    <BookOpen size={12} /> Deep Dive
                  </button>
                ) : (
                  <div className="animate-fade-in">
                    <div className="mt-3 p-3 rounded-xl bg-surface-raised text-left">
                      <p className="text-sm text-text-secondary mb-2">{currentMyth.deepDive}</p>
                      <p className="text-xs text-text-muted italic">📚 Source: {currentMyth.source}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

      {/* Action Buttons */}
      {!showResult ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleAnswer('myth')}
            className="p-4 rounded-2xl bg-gradient-to-br from-red/10 to-red/5 border border-red/20 hover:border-red/40 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.97]"
          >
            <ThumbsDown size={28} className="text-red mx-auto mb-2" />
            <p className="text-lg font-bold text-red">MYTH</p>
            <p className="text-xs text-text-muted">It&apos;s false</p>
          </button>
          <button
            onClick={() => handleAnswer('fact')}
            className="p-4 rounded-2xl bg-gradient-to-br from-green/10 to-green/5 border border-green/20 hover:border-green/40 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.97]"
          >
            <ThumbsUp size={28} className="text-green mx-auto mb-2" />
            <p className="text-lg font-bold text-green">FACT</p>
            <p className="text-xs text-text-muted">It&apos;s true</p>
          </button>
        </div>
      ) : (
        <div className="flex justify-center">
          <Button onClick={nextRound}>
            {lives <= 0 || currentIndex >= roundQueue.length - 1 ? 'See Results' : 'Next Statement'}
            <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}
