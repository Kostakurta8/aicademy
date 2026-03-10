'use client'

import { useState, useRef, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ClientOnly from '@/components/ui/ClientOnly'
import { chatComplete, type AIMessage } from '@/lib/ai/groq-client'

import { useXPStore } from '@/stores/xp-store'
import { playCorrect, playXPDing } from '@/lib/sounds'
import {
  Play, Code2, Copy, Check, RotateCcw, ChevronDown,
  Sparkles, Terminal, BookOpen, Loader2, AlertCircle,
} from 'lucide-react'

interface ExecutionStep {
  label: string
  messages: AIMessage[]
  model: string
  temperature: number
  maxTokens: number
  result?: string
  error?: string
  latency?: number
  status: 'pending' | 'running' | 'done' | 'error'
}

const EXAMPLES = [
  {
    title: 'Simple Prompt',
    description: 'Send a basic prompt and get a response',
    code: `// Simple prompt — one API call
const response = await ai.chat({
  model: "llama-3.1-8b-instant",
  messages: [
    { role: "user", content: "Explain what an API is in 2 sentences." }
  ],
  temperature: 0.7,
  max_tokens: 200
});

console.log(response);`,
  },
  {
    title: 'System Prompt + Few-Shot',
    description: 'Set a system role and provide examples',
    code: `// System prompt with few-shot examples
const response = await ai.chat({
  model: "llama-3.1-8b-instant",
  messages: [
    { role: "system", content: "You are a concise translator. Translate English to French. Reply with ONLY the translation." },
    { role: "user", content: "Hello, how are you?" },
    { role: "assistant", content: "Bonjour, comment allez-vous ?" },
    { role: "user", content: "The weather is beautiful today." }
  ],
  temperature: 0.3,
  max_tokens: 100
});

console.log(response);`,
  },
  {
    title: 'Chain of Thought',
    description: 'Force step-by-step reasoning',
    code: `// Chain of thought — instruct the model to reason
const response = await ai.chat({
  model: "llama-3.3-70b-versatile",
  messages: [
    { role: "system", content: "You are a math tutor. Always show your reasoning step by step before giving the final answer." },
    { role: "user", content: "If a train travels 120 km in 1.5 hours, and then 80 km in 1 hour, what is the average speed for the entire trip?" }
  ],
  temperature: 0.2,
  max_tokens: 500
});

console.log(response);`,
  },
  {
    title: 'Multi-Step Chain',
    description: 'Feed one response into the next call',
    code: `// Step 1: Generate a topic
const step1 = await ai.chat({
  model: "llama-3.1-8b-instant",
  messages: [
    { role: "user", content: "Give me ONE interesting AI topic to learn about. Reply with ONLY the topic name, nothing else." }
  ],
  temperature: 0.9,
  max_tokens: 50
});

console.log("Topic:", step1);

// Step 2: Generate an explanation using step1's output
const step2 = await ai.chat({
  model: "llama-3.1-8b-instant",
  messages: [
    { role: "system", content: "You are an AI educator. Explain topics clearly in 3 bullet points." },
    { role: "user", content: "Explain this AI topic: " + step1 }
  ],
  temperature: 0.5,
  max_tokens: 300
});

console.log("Explanation:", step2);`,
  },
  {
    title: 'Temperature Comparison',
    description: 'See how temperature affects outputs',
    code: `// Low temperature — deterministic
const cold = await ai.chat({
  model: "llama-3.1-8b-instant",
  messages: [
    { role: "user", content: "Write a one-sentence description of artificial intelligence." }
  ],
  temperature: 0.0,
  max_tokens: 100
});

console.log("Temperature 0.0:", cold);

// High temperature — creative
const hot = await ai.chat({
  model: "llama-3.1-8b-instant",
  messages: [
    { role: "user", content: "Write a one-sentence description of artificial intelligence." }
  ],
  temperature: 1.0,
  max_tokens: 100
});

console.log("Temperature 1.0:", hot);`,
  },
  {
    title: 'JSON Output',
    description: 'Get structured JSON from the model',
    code: `// Ask for structured JSON output
const response = await ai.chat({
  model: "llama-3.3-70b-versatile",
  messages: [
    { role: "system", content: "You are a data extraction API. Always respond with valid JSON only, no markdown." },
    { role: "user", content: "Extract entities from this text: 'Elon Musk founded SpaceX in 2002 in Hawthorne, California.' Return JSON with keys: persons, organizations, dates, locations." }
  ],
  temperature: 0.1,
  max_tokens: 300
});

console.log(response);`,
  },
]

// Parse the code to extract ai.chat() calls sequentially
function parseCode(code: string): ExecutionStep[] {
  const steps: ExecutionStep[] = []
  // Match ai.chat({ ... }) blocks
  const callRegex = /await\s+ai\.chat\(\{([\s\S]*?)\}\s*\)/g
  let match: RegExpExecArray | null

  while ((match = callRegex.exec(code)) !== null) {
    const block = match[1]

    // Extract model
    const modelMatch = /model:\s*["'`]([^"'`]+)["'`]/.exec(block)
    const model = modelMatch?.[1] || 'llama-3.1-8b-instant'

    // Extract temperature
    const tempMatch = /temperature:\s*([\d.]+)/.exec(block)
    const temperature = tempMatch ? Number.parseFloat(tempMatch[1]) : 0.7

    // Extract max_tokens
    const tokensMatch = /max_tokens:\s*(\d+)/.exec(block)
    const maxTokens = tokensMatch ? Number.parseInt(tokensMatch[1], 10) : 1024

    // Extract messages array
    const msgsMatch = /messages:\s*\[([\s\S]*?)\]/.exec(block)
    const messages: AIMessage[] = []

    if (msgsMatch) {
      const msgsBlock = msgsMatch[1]
      const msgRegex = /\{\s*role:\s*["'`](\w+)["'`]\s*,\s*content:\s*["'`]([\s\S]*?)["'`]\s*\}/g
      let msgMatch: RegExpExecArray | null

      while ((msgMatch = msgRegex.exec(msgsBlock)) !== null) {
        messages.push({
          role: msgMatch[1] as 'system' | 'user' | 'assistant',
          content: msgMatch[2],
        })
      }

      // Handle string concatenation in content (e.g., "Explain: " + step1)
      // If last message content looks incomplete, we'll resolve at runtime
    }

    const label = `Step ${steps.length + 1}: ${model}`
    steps.push({ label, messages, model, temperature, maxTokens, status: 'pending' })
  }

  return steps
}

function resolveStepMessages(
  step: ExecutionStep,
  previousResult: string,
  code: string,
  stepIndex: number
): AIMessage[] {
  const resolvedMessages = step.messages.map((m) => {
    let content = m.content
    if (previousResult && content.includes('{{PREV}}')) {
      content = content.replace('{{PREV}}', previousResult)
    }
    return { ...m, content }
  })

  if (previousResult && stepIndex > 0) {
    const lastMsg = resolvedMessages.at(-1)
    if (lastMsg) {
      const callBlocks = code.split(/await\s+ai\.chat/)
      if (callBlocks[stepIndex + 1]) {
        const concatMatch = /content:\s*["'`]([^"'`]*)["'`]\s*\+\s*\w+/.exec(
          callBlocks[stepIndex + 1]
        )
        if (concatMatch) {
          resolvedMessages[resolvedMessages.length - 1] = {
            ...lastMsg,
            content: concatMatch[1] + previousResult,
          }
        }
      }
    }
  }

  return resolvedMessages
}

function getLogLabel(code: string, index: number): string {
  const logLabels = code.match(/console\.log\(["'`]([^"'`]*)["'`]/g)
  if (logLabels?.[index]) {
    return logLabels[index].replace(/console\.log\(["'`]/, '').replace(/["'`]$/, '')
  }
  return `Step ${index + 1}`
}

export default function PlaygroundPage() {
  const [code, setCode] = useState(EXAMPLES[0].code)
  const [steps, setSteps] = useState<ExecutionStep[]>([])
  const [outputs, setOutputs] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const hasRun = useRef(false)

  const handleRun = useCallback(async () => {
    const parsed = parseCode(code)
    if (parsed.length === 0) {
      setOutputs(['⚠️ No ai.chat() calls found in your code. Use the examples to get started.'])
      return
    }

    setRunning(true)
    setSteps(parsed)
    setOutputs([])

    const allOutputs: string[] = []
    let previousResult = ''

    for (let i = 0; i < parsed.length; i++) {
      setSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: 'running' } : s))
      )

      const resolvedMessages = resolveStepMessages(parsed[i], previousResult, code, i)

      const start = performance.now()
      const result = await chatComplete(resolvedMessages, {
        model: parsed[i].model,
        temperature: parsed[i].temperature,
        max_tokens: parsed[i].maxTokens,
      })
      const latency = Math.round(performance.now() - start)

      if (result.error) {
        setSteps((prev) =>
          prev.map((s, idx) =>
            idx === i ? { ...s, status: 'error', error: result.error, latency } : s
          )
        )
        allOutputs.push(`❌ Step ${i + 1} Error: ${result.error}`)
        setOutputs([...allOutputs])
        break
      }

      previousResult = result.content
      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: 'done', result: result.content, latency } : s
        )
      )

      allOutputs.push(`${getLogLabel(code, i)} ${result.content}`)
      setOutputs([...allOutputs])
    }

    setRunning(false)

    if (hasRun.current) {
      playCorrect()
    } else {
      hasRun.current = true
      useXPStore.getState().addXP(20, 'playground')
      useXPStore.getState().recordActivity()
      playXPDing()
    }
  }, [code])

  const handleCopy = () => {
    navigator.clipboard.writeText(outputs.join('\n\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ClientOnly>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="animate-fade-in mb-6">
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <Code2 className="text-accent" /> Code Playground
          </h1>
          <p className="text-text-secondary">
            Write prompt-engineering code and execute it live against the AI API. See real responses in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code editor panel */}
          <div className="space-y-4">
            {/* Examples dropdown */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowExamples(!showExamples)}
                icon={<BookOpen size={14} />}
              >
                Examples <ChevronDown size={14} className={`transition-transform ${showExamples ? 'rotate-180' : ''}`} />
              </Button>
              {showExamples && (
                  <div
                    className="animate-fade-in absolute z-20 mt-2 left-0 right-0 lg:right-auto lg:w-80"
                  >
                    <Card padding="sm" className="shadow-xl border border-border-subtle">
                      {EXAMPLES.map((ex) => (
                        <button
                          key={ex.title}
                          onClick={() => {
                            setCode(ex.code)
                            setSteps([])
                            setOutputs([])
                            setShowExamples(false)
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-surface-alt transition-colors"
                        >
                          <p className="text-sm font-medium text-text-primary">{ex.title}</p>
                          <p className="text-xs text-text-muted">{ex.description}</p>
                        </button>
                      ))}
                    </Card>
                  </div>
                )}
            </div>

            {/* Editor */}
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-surface-alt/50">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red/60" />
                    <div className="w-3 h-3 rounded-full bg-gold/60" />
                    <div className="w-3 h-3 rounded-full bg-green/60" />
                  </div>
                  <span className="text-xs text-text-muted ml-2">playground.js</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCode('')
                      setSteps([])
                      setOutputs([])
                    }}
                    icon={<RotateCcw size={12} />}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-[var(--color-surface)] text-text-primary font-mono text-sm p-4 resize-none focus:outline-none"
                rows={20}
                spellCheck={false}
                placeholder="// Write your prompt code here..."
              />
            </Card>

            {/* Run button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleRun}
              disabled={running || !code.trim()}
              icon={running ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            >
              {running ? 'Executing...' : 'Run Code'}
            </Button>
          </div>

          {/* Output panel */}
          <div className="space-y-4">
            {/* Step progress */}
            {steps.length > 0 && (
              <Card padding="md">
                <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <Terminal size={14} className="text-accent" /> Execution Steps
                </h3>
                <div className="space-y-2">
                  {steps.map((step) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {step.status === 'pending' && (
                          <div className="w-5 h-5 rounded-full border-2 border-border-subtle" />
                        )}
                        {step.status === 'running' && (
                          <Loader2 size={20} className="text-accent animate-spin" />
                        )}
                        {step.status === 'done' && (
                          <div className="w-5 h-5 rounded-full bg-green flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                        {step.status === 'error' && (
                          <div className="w-5 h-5 rounded-full bg-red flex items-center justify-center">
                            <AlertCircle size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary truncate">{step.label}</p>
                        <p className="text-[10px] text-text-muted">
                          temp: {step.temperature} · max: {step.maxTokens} tokens
                          {step.latency ? ` · ${step.latency}ms` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Output */}
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-surface-alt/50">
                <span className="text-xs text-text-muted flex items-center gap-1.5">
                  <Sparkles size={12} className="text-accent" /> Output
                </span>
                {outputs.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleCopy} icon={copied ? <Check size={12} /> : <Copy size={12} />}>
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                )}
              </div>
              <div className="p-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                {outputs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-text-muted">
                    <Terminal size={32} className="opacity-30 mb-3" />
                    <p className="text-sm">Run your code to see output here</p>
                    <p className="text-xs mt-1 opacity-60">Results from each ai.chat() call will appear</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {outputs.map((output) => (
                      <div
                        key={output.slice(0, 30)}
                        className="animate-fade-in"
                      >
                        <div className="bg-surface-alt rounded-lg p-3">
                          <pre className="text-sm text-text-primary whitespace-pre-wrap font-mono leading-relaxed break-words">
                            {output}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Tips */}
            {steps.length === 0 && (
              <Card padding="sm" className="border border-accent/20">
                <h4 className="text-xs font-semibold text-accent mb-2">How It Works</h4>
                <ul className="text-xs text-text-muted space-y-1">
                  <li>• Write <code className="text-accent/80">await ai.chat({'{}'})</code> calls with messages, model, temperature</li>
                  <li>• Use <code className="text-accent/80">console.log()</code> labels to name your outputs</li>
                  <li>• Multi-step chains automatically pass results forward</li>
                  <li>• Try the examples to see different prompt techniques</li>
                </ul>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ClientOnly>
  )
}
