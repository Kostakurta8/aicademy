'use client'

import { useState, useRef, useEffect } from 'react'
import Card from '@/components/ui/Card'
import { Terminal as TermIcon, ChevronRight } from 'lucide-react'

const helpText = `Available commands:
  curl      — Make HTTP requests (simulated)
  echo      — Print text
  help      — Show this help
  clear     — Clear screen
  history   — Show command history
  groq      — Simulate Groq API CLI commands
  env       — Show environment variables
  whoami    — Who are you?

Try: curl -X POST https://api.groq.com/openai/v1/chat/completions -d '{"model": "llama-3.1-8b-instant"}'`

const fakeResponses: Record<string, string> = {
  whoami: 'aicademy-learner',
  'groq models': 'AVAILABLE MODELS\nllama-3.1-8b-instant     Meta     Fast general purpose\nllama-3.3-70b-versatile  Meta     Powerful, versatile\nmixtral-8x7b-32768       Mistral  Large context window\ngemma2-9b-it             Google   Strong reasoning',
  'groq status': '✅ Groq API is reachable at https://api.groq.com/openai/v1/',
  'groq --help': 'Usage:\n  groq [command]\n\nCommands:\n  status   Check API connectivity\n  models   List available models\n  chat     Start a chat session\n  usage    Show API usage stats',
  'env': 'GROQ_API_KEY=gsk_****\nNODE_ENV=development\nPORT=3000\nAI_MODEL=llama-3.1-8b-instant',
  'history': '(history will be shown dynamically)',
}

export default function TerminalLabPage() {
  const [lines, setLines] = useState<Array<{ type: 'input' | 'output'; text: string }>>([
    { type: 'output', text: '🖥️ AIcademy Terminal Simulator v1.0' },
    { type: 'output', text: 'Type "help" for available commands.\n' },
  ])
  const [input, setInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [lines])

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim()
    if (!trimmed) return

    setCommandHistory((prev) => [...prev, trimmed])
    setHistoryIdx(-1)

    const newLines = [...lines, { type: 'input' as const, text: `$ ${trimmed}` }]

    if (trimmed === 'clear') {
      setLines([])
      return
    }

    if (trimmed === 'help') {
      newLines.push({ type: 'output', text: helpText })
    } else if (trimmed === 'history') {
      const hist = [...commandHistory, trimmed].map((c, i) => `  ${i + 1}  ${c}`).join('\n')
      newLines.push({ type: 'output', text: hist })
    } else if (trimmed.startsWith('echo ')) {
      newLines.push({ type: 'output', text: trimmed.slice(5) })
    } else if (trimmed.startsWith('curl')) {
      const isPost = trimmed.includes('-X POST') || trimmed.includes('-d')
      if (isPost) {
        newLines.push({ type: 'output', text: 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\n  "model": "llama-3.1-8b-instant",\n  "choices": [{"message": {"role": "assistant", "content": "Hello! How can I help you today?"}}],\n  "usage": {"prompt_tokens": 12, "completion_tokens": 9}\n}' })
      } else {
        newLines.push({ type: 'output', text: 'HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\n  "models": [\n    {"name": "llama3.1:8b", "size": 4700000000}\n  ]\n}' })
      }
    } else if (fakeResponses[trimmed]) {
      newLines.push({ type: 'output', text: fakeResponses[trimmed] })
    } else if (trimmed.startsWith('groq chat')) {
      newLines.push({ type: 'output', text: '>>> Simulated Groq chat session (llama-3.1-8b-instant)\n>>> Type messages to chat. Use Ctrl+D to exit.\n>>> (In AIcademy, use the AI Tutor for real conversations!)' })
    } else if (trimmed.startsWith('groq usage')) {
      newLines.push({ type: 'output', text: 'API Usage (today):\n  Requests: 42\n  Tokens: 15,230 input / 8,450 output\n  Rate limit: 30 RPM / 14,400 RPD' })
    } else {
      newLines.push({ type: 'output', text: `command not found: ${trimmed.split(' ')[0]}\nType "help" for available commands.` })
    }

    setLines(newLines)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIdx = historyIdx === -1 ? commandHistory.length - 1 : Math.max(0, historyIdx - 1)
        setHistoryIdx(newIdx)
        setInput(commandHistory[newIdx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx !== -1) {
        const newIdx = historyIdx + 1
        if (newIdx >= commandHistory.length) {
          setHistoryIdx(-1)
          setInput('')
        } else {
          setHistoryIdx(newIdx)
          setInput(commandHistory[newIdx])
        }
      }
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Terminal CLI Simulator</h1>
        <p className="text-text-secondary">Practice curl commands, Groq API, and AI interactions in a safe sandbox.</p>
      </div>

      <Card padding="none">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-raised border-b border-border-subtle rounded-t-xl">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red/60" />
            <div className="w-3 h-3 rounded-full bg-gold/60" />
            <div className="w-3 h-3 rounded-full bg-green/60" />
          </div>
          <span className="text-xs text-text-muted ml-2 flex items-center gap-1"><TermIcon size={12} /> aicademy-terminal</span>
        </div>

        {/* Body */}
        <div
          ref={scrollRef}
          onClick={() => inputRef.current?.focus()}
          className="h-[450px] overflow-y-auto p-4 font-mono text-sm bg-[#0a0a14] cursor-text"
        >
          {lines.map((line, i) => (
            <div key={i} className={`whitespace-pre-wrap ${line.type === 'input' ? 'text-green' : 'text-gray-300'}`}>
              {line.text}
            </div>
          ))}

          {/* Input line */}
          <div className="flex items-center gap-1 text-green mt-1">
            <ChevronRight size={14} />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-green outline-none caret-green"
              autoFocus
              spellCheck={false}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
