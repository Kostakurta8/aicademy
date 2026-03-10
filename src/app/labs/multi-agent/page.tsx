'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Bot, Play, RotateCcw, MessageCircle } from 'lucide-react'

const agentTypes = [
  { id: 'researcher', name: '🔍 Researcher', prompt: 'I find and summarize information on a topic.' },
  { id: 'writer', name: '✍️ Writer', prompt: 'I take research and draft well-structured content.' },
  { id: 'reviewer', name: '🔎 Reviewer', prompt: 'I check content for accuracy, clarity, and quality.' },
  { id: 'formatter', name: '📐 Formatter', prompt: 'I format the final output with proper structure.' },
]

interface AgentMessage {
  agentId: string
  agentName: string
  message: string
  step: number
}

const simulatedRun: AgentMessage[] = [
  { agentId: 'researcher', agentName: '🔍 Researcher', step: 1, message: 'Searching for information on "What is prompt engineering?"...' },
  { agentId: 'researcher', agentName: '🔍 Researcher', step: 1, message: 'Found 5 relevant sources. Key findings:\n• Prompt engineering = crafting inputs to guide AI behavior\n• Techniques include zero-shot, few-shot, chain-of-thought\n• Important for getting reliable, high-quality outputs' },
  { agentId: 'writer', agentName: '✍️ Writer', step: 2, message: 'Drafting article based on research...' },
  { agentId: 'writer', agentName: '✍️ Writer', step: 2, message: '# What is Prompt Engineering?\n\nPrompt engineering is the practice of designing and refining inputs (prompts) to guide AI models toward producing desired outputs...\n\n## Key Techniques\n1. **Zero-shot**: Direct instruction without examples\n2. **Few-shot**: Providing examples to establish patterns\n3. **Chain-of-thought**: Breaking reasoning into steps' },
  { agentId: 'reviewer', agentName: '🔎 Reviewer', step: 3, message: 'Reviewing draft for accuracy...\n\n✅ Technical accuracy: Correct\n⚠️ Missing: real-world applications section\n⚠️ Suggestion: Add difficulty comparison between techniques\n✅ Clarity: Good for target audience' },
  { agentId: 'writer', agentName: '✍️ Writer', step: 3, message: 'Incorporating feedback: adding applications section and difficulty comparison...' },
  { agentId: 'formatter', agentName: '📐 Formatter', step: 4, message: 'Formatting final output...\n\n✅ Headers: properly structured\n✅ Code examples: formatted with syntax highlighting\n✅ Length: 450 words (target: 400-500)\n✅ SEO: meta description added\n\n📄 Final document ready!' },
]

export default function MultiAgentPage() {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [topic, setTopic] = useState('What is prompt engineering?')

  const handleRun = () => {
    setMessages([])
    setIsRunning(true)
    let i = 0

    const timer = setInterval(() => {
      if (i >= simulatedRun.length) {
        clearInterval(timer)
        setIsRunning(false)
        return
      }
      setMessages((prev) => [...prev, simulatedRun[i]])
      i++
    }, 1200)
  }

  const activeAgents = new Set(messages.map((m) => m.agentId))
  const currentStep = messages.length > 0 ? messages[messages.length - 1].step : 0

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Multi-Agent Sandbox</h1>
        <p className="text-text-secondary">Watch multiple AI agents collaborate on a task. Each agent has a specialized role.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent config */}
        <div className="space-y-4">
          <Card padding="md">
            <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2"><Bot size={16} className="text-accent" /> Agents</h2>
            {agentTypes.map((a) => (
              <div key={a.id} className={`flex items-start gap-3 p-2.5 rounded-lg mb-2 transition-colors ${
                activeAgents.has(a.id) ? 'bg-accent/10 border border-accent/20' : 'bg-surface-raised'
              }`}>
                <span className="text-lg">{a.name.split(' ')[0]}</span>
                <div>
                  <p className="text-sm font-medium text-text-primary">{a.name.slice(2)}</p>
                  <p className="text-xs text-text-secondary">{a.prompt}</p>
                </div>
              </div>
            ))}
          </Card>

          <Card padding="md">
            <label className="text-sm font-medium text-text-secondary block mb-2">Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent mb-3"
            />
            <div className="flex gap-2">
              <Button onClick={handleRun} disabled={isRunning} icon={<Play size={16} />} className="flex-1">
                {isRunning ? 'Running...' : 'Run Pipeline'}
              </Button>
              <Button variant="ghost" onClick={() => { setMessages([]); setIsRunning(false) }} icon={<RotateCcw size={14} />}>Reset</Button>
            </div>
          </Card>

          {/* Steps indicator */}
          <Card padding="sm">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className={`flex-1 h-1.5 rounded-full transition-colors ${
                  step <= currentStep ? 'bg-accent' : 'bg-border-subtle'
                }`} />
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2 text-center">
              {currentStep === 0 ? 'Ready' : `Step ${currentStep}/4`}
            </p>
          </Card>
        </div>

        {/* Message stream */}
        <div className="lg:col-span-2">
          <Card padding="md" className="h-full">
            <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2"><MessageCircle size={16} className="text-accent" /> Agent Communication</h2>
            <div className="space-y-3 min-h-[400px] max-h-[500px] overflow-y-auto">
              {messages.length === 0 && (
                <p className="text-sm text-text-muted text-center py-16">Click &ldquo;Run Pipeline&rdquo; to see agents collaborate.</p>
              )}
              {messages.map((msg, i) => (
                <div key={i}>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-raised">
                    <span className="text-sm shrink-0">{msg.agentName.split(' ')[0]}</span>
                    <div>
                      <p className="text-xs font-medium text-accent mb-1">{msg.agentName.slice(2)} — Step {msg.step}</p>
                      <pre className="text-sm text-text-secondary whitespace-pre-wrap">{msg.message}</pre>
                    </div>
                  </div>
                </div>
              ))}
              {isRunning && (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Agents working...
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
