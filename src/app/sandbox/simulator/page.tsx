'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { chatComplete } from '@/lib/ai/groq-client'
import { Cpu, Send, Loader2 } from 'lucide-react'

const scenarios = [
  { id: 'customer-support', label: '🎧 Customer Support', systemPrompt: 'You are a helpful customer support agent for TechCo, a software company. Be professional, empathetic, and solution-oriented. If you don\'t know the answer, say so and offer to escalate.' },
  { id: 'content-writer', label: '✍️ Content Writer', systemPrompt: 'You are a professional content writer. Write engaging, SEO-friendly content. Use clear headings, short paragraphs, and include a call-to-action.' },
  { id: 'code-assistant', label: '💻 Code Assistant', systemPrompt: 'You are a senior software engineer helping with code. Provide clean, well-commented code with explanations. Mention potential edge cases and best practices.' },
  { id: 'tutor', label: '📚 Math Tutor', systemPrompt: 'You are a patient math tutor for high school students. Explain concepts step by step using simple language. Use analogies when helpful. Never just give the answer — guide the student to find it.' },
  { id: 'creative', label: '🎨 Creative Writer', systemPrompt: 'You are a creative fiction writer. Write vivid, engaging prose with strong imagery and compelling characters. Match the requested genre and tone.' },
]

export default function SimulatorPage() {
  const [selectedScenario, setSelectedScenario] = useState(scenarios[0])
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [input, setInput] = useState('')
  const [generating, setGenerating] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || generating) return
    const userMsg = { role: 'user' as const, content: input.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setGenerating(true)

    const { content, error } = await chatComplete(
      [
        { role: 'system', content: selectedScenario.systemPrompt },
        ...updated,
      ],
      { temperature: 0.7 }
    )

    setMessages([...updated, { role: 'assistant', content: content || `⚠️ ${error || 'No response'}` }])
    setGenerating(false)
  }

  const handleReset = () => {
    setMessages([])
    setInput('')
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">AI Use-Case Simulator</h1>
        <p className="text-text-secondary">Simulate real-world AI scenarios. See how system prompts shape behavior.</p>
      </div>

      {/* Scenario picker */}
      <div className="flex flex-wrap gap-2 mb-6">
        {scenarios.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSelectedScenario(s); handleReset() }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              selectedScenario.id === s.id
                ? 'bg-accent text-white'
                : 'bg-surface-raised text-text-secondary hover:bg-border-subtle/30'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* System prompt preview */}
      <Card padding="sm" className="mb-6">
        <p className="text-xs font-medium text-accent mb-1">System Prompt:</p>
        <p className="text-sm text-text-secondary font-mono">{selectedScenario.systemPrompt}</p>
      </Card>

      {/* Chat area */}
      <Card padding="md" className="mb-4">
        <div className="min-h-[300px] max-h-[400px] overflow-y-auto space-y-3 mb-4">
          {messages.length === 0 && (
            <p className="text-sm text-text-muted text-center py-12">Start a conversation as a {selectedScenario.label} scenario.</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-accent text-white rounded-br-md'
                  : 'bg-surface-raised text-text-secondary rounded-bl-md'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {generating && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl bg-surface-raised rounded-bl-md">
                <Loader2 size={14} className="animate-spin text-text-muted" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend() } }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent"
            disabled={generating}
          />
          <Button onClick={handleSend} disabled={generating || !input.trim()} icon={<Send size={16} />}>Send</Button>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button variant="ghost" onClick={handleReset}>Clear Chat</Button>
      </div>
    </div>
  )
}
