'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ConfettiBurst, AnimatedScore, TimerBar, ScreenFlash, XPPopup, StreakFire } from '@/components/ui/GameEffects'
import { useXPStore } from '@/stores/xp-store'
import { useUserStore } from '@/stores/user-store'
import { playCorrect, playIncorrect, playLevelUp, playXPDing } from '@/lib/sounds'
import {
  ArrowLeft, Lock, Unlock, Key, Lightbulb, Brain, Eye, Zap,
  AlertTriangle, CheckCircle, HelpCircle, ChevronRight, RotateCcw,
  Shield, Cpu, FileText, Search, Star, Clock, Sparkles,
} from 'lucide-react'

// === ROOM DATA ===
interface Puzzle {
  id: string
  type: 'multiple-choice' | 'drag-order' | 'fill-blank' | 'code-crack'
  question: string
  context: string
  hint: string
  explanation: string
  // multiple-choice
  options?: string[]
  correctIndex?: number
  // drag-order
  correctOrder?: string[]
  shuffledItems?: string[]
  // fill-blank
  blanks?: { before: string; after: string; answer: string; alternatives?: string[] }[]
  // code-crack
  codeDigits?: number
  codeAnswer?: string
  codeClues?: { clue: string; revealed: boolean }[]
}

interface Room {
  id: number
  name: string
  theme: string
  icon: React.ReactNode
  color: string
  description: string
  timeLimit: number
  puzzles: Puzzle[]
}

const rooms: Room[] = [
  {
    id: 1, name: 'The Tokenizer\'s Vault', theme: 'How AI Processes Text',
    icon: <FileText size={24} />, color: 'from-blue-500 to-cyan-500',
    description: 'You\'re locked in a vault where AI processes text. Solve puzzles about tokenization, embeddings, and context windows to escape!',
    timeLimit: 180,
    puzzles: [
      {
        id: '1a', type: 'multiple-choice',
        question: 'The door lock displays: "The word \'unbelievable\' is split into __ tokens by most LLM tokenizers." How many tokens?',
        context: 'A glowing terminal shows a tokenizer in action. Words are being split into colored chunks.',
        hint: 'Tokenizers break words by common subwords. "un" + "believ" + "able" is typical.',
        explanation: 'Most BPE tokenizers split "unbelievable" into 3 tokens: "un", "believ", and "able". Common word parts are kept as single tokens for efficiency.',
        options: ['1 token', '2 tokens', '3 tokens', '5 tokens'],
        correctIndex: 2,
      },
      {
        id: '1b', type: 'drag-order',
        question: 'Arrange the steps of text processing in the correct order to open the next door:',
        context: 'Four locked gears on the wall need to be arranged. Each gear has a label.',
        hint: 'Think about the journey of text from raw input to meaningful numbers.',
        explanation: 'Text goes through: Raw text → Tokenization (splitting into tokens) → Embedding (converting to vectors) → Attention (finding relationships). This is the core transformer pipeline.',
        correctOrder: ['Raw Text Input', 'Tokenization', 'Embedding Vectors', 'Self-Attention'],
        shuffledItems: ['Self-Attention', 'Tokenization', 'Raw Text Input', 'Embedding Vectors'],
      },
      {
        id: '1c', type: 'fill-blank',
        question: 'Complete the inscription on the vault door to escape:',
        context: 'Golden letters on the door read a partially hidden message.',
        hint: 'It\'s measured in tokens, not words.',
        explanation: 'A context window is measured in tokens and represents the maximum amount of text an LLM can process at once. GPT-4 has a 128K token context window.',
        blanks: [
          { before: 'An LLM\'s memory is limited by its', after: ', measured in tokens.', answer: 'context window', alternatives: ['context-window', 'context_window'] },
        ],
      },
    ],
  },
  {
    id: 2, name: 'The Hallucination Chamber', theme: 'AI Reliability & Truth',
    icon: <Eye size={24} />, color: 'from-orange-500 to-red-500',
    description: 'Reality bends in this room. Separate AI truth from fiction before the walls close in!',
    timeLimit: 200,
    puzzles: [
      {
        id: '2a', type: 'multiple-choice',
        question: 'A hologram asks: "Why do LLMs hallucinate?" Which is the PRIMARY reason?',
        context: 'Holographic AI faces flicker between truth and lies. One keeps changing its answer.',
        hint: 'Think about what LLMs actually do — they don\'t "know" facts.',
        explanation: 'LLMs hallucinate because they predict statistically likely text, not verified facts. They have no internal fact-checking mechanism — they generate what "sounds right" based on training patterns.',
        options: [
          'They predict statistically likely text without fact verification',
          'Their training data contains errors',
          'They run out of memory',
          'They are designed to be creative',
        ],
        correctIndex: 0,
      },
      {
        id: '2b', type: 'code-crack',
        question: 'Crack the 4-digit code to escape! Each correct answer about hallucinations reveals a digit.',
        context: 'A massive combination lock with 4 slots. Answering questions correctly reveals each digit.',
        hint: 'The digits are hidden in the clues themselves — look at the first number mentioned in each answer.',
        explanation: 'Hallucination mitigation strategies: RAG (Retrieval-Augmented Generation), temperature reduction, asking for citations, and cross-referencing with reliable sources.',
        codeDigits: 4,
        codeAnswer: '7429',
        codeClues: [
          { clue: 'Digit 1: How many letters in "RAG" (Retrieval-Augmented Generation)?', revealed: false },
          { clue: 'Digit 2: Temperature ranges from 0 to 2. What\'s 2×2?', revealed: false },
          { clue: 'Digit 3: "Verify" has how many vowels minus 4?', revealed: false },
          { clue: 'Digit 4: The number of "C"s in "Cross-Check Citations Carefully" times 3?', revealed: false },
        ],
      },
      {
        id: '2c', type: 'multiple-choice',
        question: 'The final door shows 4 AI outputs. Which one is most likely a hallucination?',
        context: 'Four screens display AI-generated "facts." One is subtly wrong.',
        hint: 'Look for specific claims with exact numbers that seem authoritative but could be fabricated.',
        explanation: 'AI is most likely to hallucinate specific statistics, citations with page numbers, and historical "facts" with precise dates. The more specific and authoritative-sounding, the more suspicious you should be.',
        options: [
          '"Python was created by Guido van Rossum in 1991"',
          '"A 2019 Stanford study (p.47) found exactly 73.2% of users prefer..."',
          '"Machine learning is a subset of artificial intelligence"',
          '"Neural networks are inspired by biological neurons"',
        ],
        correctIndex: 1,
      },
    ],
  },
  {
    id: 3, name: 'The Prompt Engineer\'s Lab', theme: 'Advanced Prompt Craft',
    icon: <Lightbulb size={24} />, color: 'from-green-500 to-emerald-500',
    description: 'A prompt engineering laboratory. Craft, debug, and master prompts to unlock the exit!',
    timeLimit: 220,
    puzzles: [
      {
        id: '3a', type: 'drag-order',
        question: 'Arrange the RCFT prompt framework components in the correct order:',
        context: 'Four chemical vials on a shelf need to be mixed in order. Each contains a prompt component.',
        hint: 'RCFT stands for Role, Context, Format, Task — but what order should they appear in a prompt?',
        explanation: 'The RCFT framework: Role (who the AI should be) → Context (background information) → Format (desired output structure) → Task (the specific instruction). This order gives the AI the best context before the request.',
        correctOrder: ['Role', 'Context', 'Format', 'Task'],
        shuffledItems: ['Task', 'Role', 'Format', 'Context'],
      },
      {
        id: '3b', type: 'multiple-choice',
        question: 'A broken prompt sits on the workbench: "Write about dogs. Make it good. Use facts." What is the MAIN problem?',
        context: 'A lab report shows a failed experiment — the prompt produced generic, useless output.',
        hint: 'What\'s missing that would give the AI direction?',
        explanation: 'The prompt lacks specificity: no role, no target audience, no format, no scope. "Make it good" and "Use facts" are subjective and vague. A better prompt would specify: who\'s reading it, what format, how long, what angle, and what facts.',
        options: [
          'It\'s too vague — no role, audience, format, or specific scope',
          'It needs more emoji',
          'It should be written in all caps',
          'It needs a temperature setting',
        ],
        correctIndex: 0,
      },
      {
        id: '3c', type: 'fill-blank',
        question: 'Complete the prompt engineering principle to unlock the exit:',
        context: 'Laser-etched text on the exit door has gaps.',
        hint: 'Think Zero-Shot vs Few-Shot.',
        explanation: 'Few-shot prompting provides examples to guide the AI. For consistent formatting, giving 2-3 examples dramatically improves output quality compared to zero-shot (just describing what you want).',
        blanks: [
          { before: 'Providing examples in a prompt is called', after: 'prompting.', answer: 'few-shot', alternatives: ['few shot', 'fewshot'] },
        ],
      },
      {
        id: '3d', type: 'multiple-choice',
        question: 'You found a secret note: "To make an AI show its reasoning step-by-step, use..." Which technique?',
        context: 'A hidden drawer contains a note with a partially redacted technique name.',
        hint: 'It involves asking the AI to think through a "chain" of logic.',
        explanation: 'Chain-of-Thought (CoT) prompting asks the model to show its reasoning steps. Adding "Let\'s think step by step" or "Show your reasoning" dramatically improves accuracy on complex tasks like math, logic, and multi-step problems.',
        options: ['Chain-of-Thought prompting', 'Recursive prompting', 'Temperature boosting', 'Token pruning'],
        correctIndex: 0,
      },
    ],
  },
  {
    id: 4, name: 'The Ethics Firewall', theme: 'AI Safety & Ethics',
    icon: <Shield size={24} />, color: 'from-purple-500 to-pink-500',
    description: 'The final room. Navigate ethical dilemmas and safety concepts to break through the firewall!',
    timeLimit: 200,
    puzzles: [
      {
        id: '4a', type: 'multiple-choice',
        question: 'The firewall asks: "An AI hiring tool rejects candidates from certain zip codes. This is an example of..."',
        context: 'A firewall console shows a case study about automated hiring decisions.',
        hint: 'The zip codes correlate with demographics — what kind of bias is this?',
        explanation: 'This is proxy discrimination / algorithmic bias. Zip codes can correlate with race, income, and ethnicity. The AI doesn\'t need to explicitly discriminate — it uses proxy variables that have the same effect. This is one of the most dangerous forms of AI bias.',
        options: ['Proxy discrimination through algorithmic bias', 'A simple software bug', 'Intentional filtering', 'Random error'],
        correctIndex: 0,
      },
      {
        id: '4b', type: 'drag-order',
        question: 'Arrange the responsible AI development principles from highest to lowest priority:',
        context: 'Priority cards on a desk need to be stacked in order. Each represents a development principle.',
        hint: 'Safety comes first — what matters most when AI affects people\'s lives?',
        explanation: 'Responsible AI priorities: Safety (prevent harm) → Fairness (equal treatment) → Transparency (explainability) → Privacy (data protection). Safety must come first because unsafe AI can cause immediate, irreversible harm.',
        correctOrder: ['Safety & Harm Prevention', 'Fairness & Non-Discrimination', 'Transparency & Explainability', 'Privacy & Data Protection'],
        shuffledItems: ['Privacy & Data Protection', 'Safety & Harm Prevention', 'Transparency & Explainability', 'Fairness & Non-Discrimination'],
      },
      {
        id: '4c', type: 'multiple-choice',
        question: 'Final question: "A user asks an AI to generate a deepfake of a politician. The AI should..."',
        context: 'The exit button is locked behind one last ethical decision.',
        hint: 'Think about potential for harm vs user freedom.',
        explanation: 'Responsible AI systems should refuse requests that could cause real-world harm, like deepfakes of real people. AI safety alignment means the model should explain why it can\'t comply and suggest ethical alternatives.',
        options: [
          'Refuse and explain the potential for harm and misinformation',
          'Generate it because the user has freedom of speech',
          'Generate a lower quality version as a compromise',
          'Generate it but add a watermark',
        ],
        correctIndex: 0,
      },
    ],
  },
]

// === GAME COMPONENT ===
export default function AIEscapeRoom() {
  const [phase, setPhase] = useState<'intro' | 'playing' | 'results'>('intro')
  const [currentRoom, setCurrentRoom] = useState(0)
  const [currentPuzzle, setCurrentPuzzle] = useState(0)
  const [timeLeft, setTimeLeft] = useState(rooms[0].timeLimit)
  const [score, setScore] = useState(0)
  const [totalPuzzlesSolved, setTotalPuzzlesSolved] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [streak, setStreak] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [puzzleResult, setPuzzleResult] = useState<'correct' | 'wrong' | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showFlash, setShowFlash] = useState<'green' | 'red' | null>(null)
  const [showXP, setShowXP] = useState(false)
  const [roomsCleared, setRoomsCleared] = useState<number[]>([])
  // Puzzle-specific state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [dragOrder, setDragOrder] = useState<string[]>([])
  const [blankInputs, setBlankInputs] = useState<string[]>([])
  const [codeInput, setCodeInput] = useState('')
  const [revealedClues, setRevealedClues] = useState<boolean[]>([])

  const soundEnabled = useUserStore((s) => s.soundEnabled)
  const addXP = useXPStore((s) => s.addXP)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const room = rooms[currentRoom]
  const puzzle = room.puzzles[currentPuzzle]

  const handleTimeUp = () => {
    setPhase('results')
  }

  const resetPuzzleState = () => {
    setSelectedAnswer(null)
    setShowHint(false)
    setShowExplanation(false)
    setPuzzleResult(null)
    setBlankInputs(puzzle.blanks?.map(() => '') || [])
    setDragOrder([...(puzzle.shuffledItems || [])])
    setCodeInput('')
    setRevealedClues(puzzle.codeClues?.map(() => false) || [])
  }

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || puzzleResult) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          handleTimeUp()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, puzzleResult, currentRoom])

  // Initialize puzzle state
  useEffect(() => {
    if (phase !== 'playing') return
    queueMicrotask(() => resetPuzzleState())
  }, [currentPuzzle, currentRoom, phase])

  const checkAnswer = () => {
    let correct = false

    if (puzzle.type === 'multiple-choice') {
      correct = selectedAnswer === puzzle.correctIndex
    } else if (puzzle.type === 'drag-order') {
      correct = JSON.stringify(dragOrder) === JSON.stringify(puzzle.correctOrder)
    } else if (puzzle.type === 'fill-blank') {
      correct = puzzle.blanks!.every((blank, i) => {
        const input = blankInputs[i]?.toLowerCase().trim()
        return input === blank.answer.toLowerCase() || blank.alternatives?.map(a => a.toLowerCase()).includes(input)
      })
    } else if (puzzle.type === 'code-crack') {
      correct = codeInput === puzzle.codeAnswer
    }

    if (correct) {
      const hintPenalty = showHint ? 25 : 0
      const timeBonus = Math.floor(timeLeft / room.timeLimit * 50)
      const streakBonus = streak >= 2 ? 30 : 0
      const points = 100 - hintPenalty + timeBonus + streakBonus
      setScore(s => s + points)
      setTotalPuzzlesSolved(n => n + 1)
      setStreak(s => s + 1)
      setPuzzleResult('correct')
      setShowFlash('green')
      if (soundEnabled) playCorrect()
      setTimeout(() => setShowFlash(null), 500)
    } else {
      setStreak(0)
      setPuzzleResult('wrong')
      setShowFlash('red')
      if (soundEnabled) playIncorrect()
      setTimeout(() => setShowFlash(null), 500)
    }
    setShowExplanation(true)
  }

  const nextPuzzle = () => {
    if (currentPuzzle < room.puzzles.length - 1) {
      setCurrentPuzzle(p => p + 1)
    } else {
      // Room cleared
      setRoomsCleared(prev => [...prev, currentRoom])
      if (soundEnabled) playXPDing()
      if (currentRoom < rooms.length - 1) {
        setCurrentRoom(r => r + 1)
        setCurrentPuzzle(0)
        setTimeLeft(rooms[currentRoom + 1].timeLimit)
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 100)
      } else {
        // All rooms cleared!
        setShowConfetti(true)
        if (soundEnabled) playLevelUp()
        const xpEarned = Math.floor(score / 10) + 100
        addXP(xpEarned)
        setShowXP(true)
        setTimeout(() => setShowXP(false), 2500)
        setPhase('results')
      }
    }
  }

  const useHint = () => {
    setShowHint(true)
    setHintsUsed(h => h + 1)
  }

  const moveDragItem = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= dragOrder.length) return
    const newOrder = [...dragOrder]
    ;[newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]]
    setDragOrder(newOrder)
  }

  const startGame = () => {
    setPhase('playing')
    setCurrentRoom(0)
    setCurrentPuzzle(0)
    setTimeLeft(rooms[0].timeLimit)
    setScore(0)
    setTotalPuzzlesSolved(0)
    setHintsUsed(0)
    setStreak(0)
    setRoomsCleared([])
    setShowConfetti(false)
    setShowXP(false)
  }

  // === INTRO SCREEN ===
  if (phase === 'intro') {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Link href="/games" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent mb-6">
          <ArrowLeft size={16} /> Back to Games
        </Link>
        <div className="animate-fade-in text-center">
          <div
            className="animate-celebrate-pop w-24 h-24 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20"
          >
            <Lock size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-text-primary mb-3">AI Escape Room</h1>
          <p className="text-text-secondary max-w-lg mx-auto mb-8">
            You&apos;re trapped in 4 rooms. Each room has AI puzzles to solve. Use your knowledge of
            tokenization, hallucinations, prompt engineering, and ethics to escape!
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
            {rooms.map((r, i) => (
              <div key={r.id} style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }} className="animate-fade-in">
                <Card padding="sm" className="text-center">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center mx-auto mb-2 text-white`}>
                    {r.icon}
                  </div>
                  <p className="text-xs font-semibold text-text-primary">{r.name}</p>
                  <p className="text-[10px] text-text-muted mt-1">{r.puzzles.length} puzzles</p>
                </Card>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-text-secondary mb-8">
            <span className="flex items-center gap-1"><Lightbulb size={14} className="text-gold" /> Hints available</span>
            <span className="flex items-center gap-1"><Clock size={14} className="text-blue" /> Timed rooms</span>
            <span className="flex items-center gap-1"><Star size={14} className="text-purple" /> Streak bonuses</span>
          </div>

          <Button onClick={startGame} className="text-lg px-8 py-3">
            Enter the Escape Room <Lock size={18} className="ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  // === RESULTS SCREEN ===
  if (phase === 'results') {
    const totalPuzzles = rooms.reduce((a, r) => a + r.puzzles.length, 0)
    const escaped = roomsCleared.length === rooms.length
    const xpEarned = Math.floor(score / 10) + 100

    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <ConfettiBurst trigger={showConfetti && escaped} color="gold" />
        <XPPopup amount={xpEarned} show={showXP} />
        <div className="animate-celebrate-pop text-center">
          <div
            className={`animate-celebrate-pop w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg ${
              escaped ? 'bg-gradient-to-br from-green to-emerald-400 shadow-green/20' : 'bg-gradient-to-br from-red-500 to-orange-500 shadow-red-500/20'
            }`}
          >
            {escaped ? <Unlock size={48} className="text-white" /> : <Lock size={48} className="text-white" />}
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            {escaped ? '🎉 You Escaped!' : '🔒 Time\'s Up!'}
          </h1>
          <p className="text-text-secondary mb-6">
            {escaped
              ? `Incredible! You solved all ${totalPuzzles} puzzles across ${rooms.length} rooms!`
              : `You cleared ${roomsCleared.length}/${rooms.length} rooms with ${totalPuzzlesSolved} puzzles solved.`}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Score', value: score, icon: <Star size={18} className="text-gold" /> },
              { label: 'Puzzles Solved', value: `${totalPuzzlesSolved}/${totalPuzzles}`, icon: <CheckCircle size={18} className="text-green" /> },
              { label: 'Hints Used', value: hintsUsed, icon: <Lightbulb size={18} className="text-orange" /> },
              { label: 'Rooms Cleared', value: `${roomsCleared.length}/${rooms.length}`, icon: <Unlock size={18} className="text-blue" /> },
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
            <Button onClick={startGame} icon={<RotateCcw size={16} />}>Play Again</Button>
            <Link href="/games"><Button variant="secondary">Back to Games</Button></Link>
          </div>
        </div>
      </div>
    )
  }

  // === PLAYING SCREEN ===
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <ConfettiBurst trigger={showConfetti} color="gold" />
      <ScreenFlash trigger={!!showFlash} color={showFlash || 'green'} />
      <XPPopup amount={50} show={showXP} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/games" className="text-sm text-text-muted hover:text-accent">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-4">
          <AnimatedScore value={score} label="Score" icon={<Star size={14} className="text-gold" />} size="sm" />
          {streak >= 2 && <StreakFire streak={streak} />}
        </div>
      </div>

      {/* Room progress */}
      <div className="flex gap-2 mb-4">
        {rooms.map((r, i) => (
          <div key={r.id} className={`flex-1 h-2 rounded-full ${
            roomsCleared.includes(i) ? 'bg-green' : i === currentRoom ? 'bg-accent' : 'bg-border-subtle'
          }`} />
        ))}
      </div>

      {/* Room info */}
      <div className="animate-fade-in" key={room.id}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${room.color} flex items-center justify-center text-white`}>
            {room.icon}
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">{room.name}</h2>
            <p className="text-xs text-text-muted">Puzzle {currentPuzzle + 1} of {room.puzzles.length} · {room.theme}</p>
          </div>
        </div>
        <TimerBar timeLeft={timeLeft} maxTime={room.timeLimit} warning={30} />
      </div>

      {/* Puzzle */}
        <div
          key={puzzle.id}
          className="animate-fade-in mt-6"
        >
          {/* Context */}
          <Card padding="sm" className="mb-4 bg-surface-raised/50">
            <p className="text-xs text-text-muted italic flex items-center gap-2">
              <Eye size={12} /> {puzzle.context}
            </p>
          </Card>

          {/* Question */}
          <Card padding="lg" className="mb-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">{puzzle.question}</h3>

            {/* Multiple Choice */}
            {puzzle.type === 'multiple-choice' && puzzle.options && (
              <div className="space-y-2">
                {puzzle.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => !puzzleResult && setSelectedAnswer(i)}
                    disabled={!!puzzleResult}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      puzzleResult
                        ? i === puzzle.correctIndex
                          ? 'bg-green/10 border-green/40 text-green'
                          : i === selectedAnswer
                            ? 'bg-red/10 border-red/40 text-red'
                            : 'bg-surface border-border-subtle text-text-muted'
                        : selectedAnswer === i
                          ? 'bg-accent/10 border-accent/40 text-accent'
                          : 'bg-surface border-border-subtle text-text-secondary hover:border-accent/30'
                    }`}
                  >
                    <span className="text-sm font-medium">{String.fromCharCode(65 + i)}. {opt}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Drag Order */}
            {puzzle.type === 'drag-order' && (
              <div className="space-y-2">
                {dragOrder.map((item, i) => (
                  <div key={item} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    puzzleResult
                      ? puzzle.correctOrder![i] === item
                        ? 'bg-green/10 border-green/40'
                        : 'bg-red/10 border-red/40'
                      : 'bg-surface border-border-subtle'
                  }`}>
                    <span className="text-xs font-bold text-text-muted w-5">{i + 1}.</span>
                    <span className="flex-1 text-sm text-text-primary font-medium">{item}</span>
                    {!puzzleResult && (
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveDragItem(i, 'up')} disabled={i === 0}
                          className="p-1 rounded hover:bg-surface-raised text-text-muted hover:text-accent disabled:opacity-30 cursor-pointer">▲</button>
                        <button onClick={() => moveDragItem(i, 'down')} disabled={i === dragOrder.length - 1}
                          className="p-1 rounded hover:bg-surface-raised text-text-muted hover:text-accent disabled:opacity-30 cursor-pointer">▼</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Fill Blank */}
            {puzzle.type === 'fill-blank' && puzzle.blanks && (
              <div className="space-y-3">
                {puzzle.blanks.map((blank, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap text-sm text-text-secondary">
                    <span>{blank.before}</span>
                    <input
                      type="text"
                      value={blankInputs[i] || ''}
                      onChange={e => {
                        const newInputs = [...blankInputs]
                        newInputs[i] = e.target.value
                        setBlankInputs(newInputs)
                      }}
                      disabled={!!puzzleResult}
                      placeholder="type answer..."
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium w-48 bg-surface ${
                        puzzleResult
                          ? blankInputs[i]?.toLowerCase().trim() === blank.answer.toLowerCase() || blank.alternatives?.map(a => a.toLowerCase()).includes(blankInputs[i]?.toLowerCase().trim())
                            ? 'border-green/40 text-green'
                            : 'border-red/40 text-red'
                          : 'border-border-subtle text-text-primary focus:border-accent outline-none'
                      }`}
                    />
                    <span>{blank.after}</span>
                    {puzzleResult && !(blankInputs[i]?.toLowerCase().trim() === blank.answer.toLowerCase() || blank.alternatives?.map(a => a.toLowerCase()).includes(blankInputs[i]?.toLowerCase().trim())) && (
                      <span className="text-xs text-green ml-1">Correct: {blank.answer}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Code Crack */}
            {puzzle.type === 'code-crack' && (
              <div className="space-y-3">
                {puzzle.codeClues?.map((clue, i) => (
                  <div key={i} className="p-3 rounded-xl bg-surface-raised">
                    <p className="text-sm text-text-secondary">{clue.clue}</p>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-sm text-text-muted font-medium">Enter code:</span>
                  <input
                    type="text"
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, puzzle.codeDigits))}
                    disabled={!!puzzleResult}
                    maxLength={puzzle.codeDigits}
                    placeholder={'_'.repeat(puzzle.codeDigits || 4)}
                    className={`px-4 py-2 rounded-lg border text-center text-2xl font-mono tracking-[0.5em] w-40 bg-surface ${
                      puzzleResult
                        ? codeInput === puzzle.codeAnswer ? 'border-green/40 text-green' : 'border-red/40 text-red'
                        : 'border-border-subtle text-text-primary focus:border-accent outline-none'
                    }`}
                  />
                  {puzzleResult && codeInput !== puzzle.codeAnswer && (
                    <span className="text-xs text-green">Answer: {puzzle.codeAnswer}</span>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Hint */}
          {!puzzleResult && (
            <div className="flex items-center gap-3 mb-4">
              {!showHint ? (
                <button onClick={useHint} className="flex items-center gap-1.5 text-xs text-gold hover:text-gold/80 transition-colors cursor-pointer">
                  <Lightbulb size={14} /> Use Hint (-25 pts)
                </button>
              ) : (
                <div className="animate-fade-in">
                  <Card padding="sm" className="bg-gold/5 border border-gold/20">
                    <p className="text-sm text-gold flex items-center gap-2"><Lightbulb size={14} /> {puzzle.hint}</p>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Explanation */}
            {showExplanation && (
              <div className="animate-fade-in">
                <Card padding="md" className={`mb-4 ${puzzleResult === 'correct' ? 'bg-green/5 border border-green/20' : 'bg-red/5 border border-red/20'}`}>
                  <div className="flex items-start gap-2">
                    {puzzleResult === 'correct' ? <CheckCircle size={16} className="text-green mt-0.5" /> : <AlertTriangle size={16} className="text-red mt-0.5" />}
                    <div>
                      <p className="text-sm font-semibold text-text-primary mb-1">{puzzleResult === 'correct' ? '✅ Correct!' : '❌ Not quite!'}</p>
                      <p className="text-sm text-text-secondary">{puzzle.explanation}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            {!puzzleResult ? (
              <Button onClick={checkAnswer} disabled={
                (puzzle.type === 'multiple-choice' && selectedAnswer === null) ||
                (puzzle.type === 'fill-blank' && blankInputs.some(b => !b.trim())) ||
                (puzzle.type === 'code-crack' && codeInput.length !== puzzle.codeDigits)
              }>
                Submit Answer <Zap size={16} className="ml-1" />
              </Button>
            ) : (
              <Button onClick={nextPuzzle}>
                {currentPuzzle < room.puzzles.length - 1
                  ? 'Next Puzzle'
                  : currentRoom < rooms.length - 1
                    ? `Enter ${rooms[currentRoom + 1].name}`
                    : '🎉 See Results'}
                <ChevronRight size={16} className="ml-1" />
              </Button>
            )}
          </div>
        </div>
    </div>
  )
}
