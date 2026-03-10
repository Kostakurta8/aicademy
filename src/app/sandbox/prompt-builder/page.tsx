'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Send, RotateCcw, Copy, Check } from 'lucide-react'

const presets = [
  {
    name: 'Blog Writer',
    role: 'You are an experienced blog writer who creates engaging, SEO-optimized content.',
    context: 'Writing for a tech startup blog targeting developers.',
    task: 'Write a 300-word blog post about the benefits of using AI in software testing.',
    format: 'Markdown with headers, bullet points, and a call-to-action at the end.',
  },
  {
    name: 'Code Reviewer',
    role: 'You are a senior software engineer who provides thorough, constructive code reviews.',
    context: 'Reviewing a junior developer\'s Python code for a REST API.',
    task: 'Review this code for bugs, best practices, and potential improvements.',
    format: 'Numbered list of issues, each with: severity (critical/warning/suggestion), line reference, explanation, and fix.',
  },
  {
    name: 'Socratic Teacher',
    role: 'You are a Socratic teacher who never gives direct answers but guides students through questions.',
    context: 'Teaching a college student about machine learning concepts.',
    task: 'Help the student understand what overfitting is.',
    format: 'Series of guiding questions, each building on the previous answer. Max 5 questions.',
  },
]

export default function PromptBuilderPage() {
  const [role, setRole] = useState('')
  const [context, setContext] = useState('')
  const [task, setTask] = useState('')
  const [format, setFormat] = useState('')
  const [output, setOutput] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const buildPrompt = () => {
    const parts: string[] = []
    if (role) parts.push(`Role: ${role}`)
    if (context) parts.push(`Context: ${context}`)
    if (task) parts.push(`Task: ${task}`)
    if (format) parts.push(`Format: ${format}`)
    return parts.join('\n\n')
  }

  const handleSend = async () => {
    const prompt = buildPrompt()
    if (!prompt.trim()) return
    setGenerating(true)
    setOutput('')
    try {
      const systemPrompt = role || undefined
      const userPrompt = [context, task, format ? `Output format: ${format}` : ''].filter(Boolean).join('\n\n')
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: userPrompt || prompt },
          ],
          stream: false,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setOutput(data.choices?.[0]?.message?.content || 'No response received.')
      } else {
        setOutput('⚠️ AI API not available. Check your API key in Settings.')
      }
    } catch {
      setOutput('⚠️ Could not connect to AI. Check your internet connection.')
    }
    setGenerating(false)
  }

  const loadPreset = (preset: typeof presets[0]) => {
    setRole(preset.role)
    setContext(preset.context)
    setTask(preset.task)
    setFormat(preset.format)
    setOutput('')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Prompt Builder</h1>
        <p className="text-text-secondary">Build and test prompts using the RCFT framework. Powered by Groq AI.</p>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-sm text-text-muted py-1">Try a preset:</span>
        {presets.map((p) => (
          <button
            key={p.name}
            onClick={() => loadPreset(p)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Builder */}
        <div>
          <Card padding="md">
            <h2 className="text-base font-semibold text-text-primary mb-4">Build Your Prompt</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-purple mb-1 block">🎭 Role</label>
                <textarea
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none h-16 outline-none focus:ring-2 focus:ring-purple"
                  placeholder="You are a..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-blue mb-1 block">📋 Context</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none h-16 outline-none focus:ring-2 focus:ring-blue"
                  placeholder="Background information..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-orange mb-1 block">🎯 Task</label>
                <textarea
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none h-16 outline-none focus:ring-2 focus:ring-orange"
                  placeholder="What should the AI do?"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-green mb-1 block">📐 Format</label>
                <textarea
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none h-16 outline-none focus:ring-2 focus:ring-green"
                  placeholder="Expected output format..."
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSend} loading={generating} icon={<Send size={16} />} className="flex-1">
                  Send to AI
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setRole(''); setContext(''); setTask(''); setFormat(''); setOutput('') }}
                  icon={<RotateCcw size={16} />}
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Output */}
        <div>
          <Card padding="md" className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-text-primary">AI Response</h2>
              {output && (
                <Button variant="ghost" size="sm" onClick={handleCopy} icon={copied ? <Check size={14} /> : <Copy size={14} />}>
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              )}
            </div>
            <div className="min-h-[400px]">
              {generating ? (
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Generating response...
                </div>
              ) : output ? (
                <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap font-mono">
                  {output}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <Send size={32} className="text-text-muted/30 mb-3" />
                  <p className="text-sm text-text-muted">Build a prompt and click &ldquo;Send to AI&rdquo; to see the response.</p>
                  <p className="text-xs text-text-muted mt-1">Powered by Groq AI.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Assembled prompt preview */}
      {(role || context || task || format) && (
        <div className="mt-6">
          <Card padding="md">
            <h3 className="text-sm font-semibold text-text-muted mb-2">Assembled Prompt Preview</h3>
            <pre className="text-xs text-text-secondary bg-surface-raised p-4 rounded-xl overflow-auto whitespace-pre-wrap font-mono">
              {buildPrompt()}
            </pre>
          </Card>
        </div>
      )}
    </div>
  )
}
