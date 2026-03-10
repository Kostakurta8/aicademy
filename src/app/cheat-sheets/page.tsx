'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Copy, Check, Download, FileText, Search } from 'lucide-react'

const cheatSheets = [
  {
    id: 'prompt-engineering',
    title: 'Prompt Engineering',
    color: 'from-purple to-violet-600',
    sections: [
      { heading: 'RCFT Framework', items: ['Role: Who the AI should be', 'Context: Background info needed', 'Format: Desired output structure', 'Task: Specific action to perform'] },
      { heading: 'Techniques', items: ['Zero-shot: Direct instruction, no examples', 'Few-shot: Provide 2-3 examples first', 'Chain-of-thought: "Think step by step"', 'Constraint setting: "In under 100 words"', 'Output format: "Respond in JSON/table/markdown"'] },
      { heading: 'Temperature Guide', items: ['0.0-0.3: Factual, code, math, structured', '0.4-0.7: Balanced general tasks', '0.8-1.0: Creative writing, brainstorming'] },
    ],
  },
  {
    id: 'llm-fundamentals',
    title: 'LLM Fundamentals',
    color: 'from-blue to-indigo-600',
    sections: [
      { heading: 'Key Concepts', items: ['Token: smallest unit of text (≈ 4 chars)', 'Context window: max tokens in one request', 'Embedding: word → dense number vector', 'Attention: how tokens relate to each other', 'Parameters: learned weights (7B, 70B, etc.)'] },
      { heading: 'Model Sizes', items: ['1-3B: Fast, basic tasks, mobile', '7-8B: Good all-rounder (Llama 3.1 8B)', '13-34B: Strong reasoning, slower', '70B+: Near state-of-art, needs GPU'] },
      { heading: 'Architecture', items: ['Transformer: attention + feed-forward layers', 'Self-attention: Q·K·V mechanism', 'Tokenizer: BPE (Byte-Pair Encoding)', 'RoPE: Rotary position embeddings'] },
    ],
  },
  {
    id: 'ai-ethics',
    title: 'AI Ethics & Safety',
    color: 'from-green to-emerald-600',
    sections: [
      { heading: 'Bias Types', items: ['Historical: data reflects past inequities', 'Representation: training data not diverse', 'Measurement: metrics encode assumptions', 'Aggregation: one model for different groups'] },
      { heading: 'Hallucination Types', items: ['Factual: confidently wrong facts', 'Fabricated citations: fake papers/sources', 'Conflation: mixing real facts incorrectly', 'Temporal: outdated or future-dated claims'] },
      { heading: 'Mitigation', items: ['Always verify AI outputs with sources', 'Use RAG for grounded responses', 'Set low temperature for factual tasks', 'Request citations/confidence levels', 'Human review for critical decisions'] },
    ],
  },
  {
    id: 'groq-api',
    title: 'Groq API',
    color: 'from-cyan to-teal-600',
    sections: [
      { heading: 'API Endpoints', items: ['POST /chat/completions — chat completion', 'GET /models — list available models', 'POST /embeddings — get embeddings', 'Base URL: api.groq.com/openai/v1/', 'Auth: Bearer token in header'] },
      { heading: 'Key Parameters', items: ['model: llama-3.1-8b-instant (fast)', 'messages[]: array of {role, content}', 'temperature: 0.0-2.0 randomness', 'max_tokens: output length limit', 'stream: true for SSE streaming'] },
      { heading: 'Popular Models', items: ['llama-3.1-8b-instant — fast general', 'llama-3.3-70b-versatile — powerful', 'mixtral-8x7b-32768 — large context', 'gemma2-9b-it — Google, reasoning', 'llama-guard-3-8b — safety checks'] },
    ],
  },
  {
    id: 'api-patterns',
    title: 'AI API Patterns',
    color: 'from-orange to-amber-600',
    sections: [
      { heading: 'Request Structure', items: ['model: which model to use', 'messages[]: array of {role, content}', 'temperature: 0.0-2.0 randomness control', 'max_tokens / num_predict: output limit', 'stream: true/false for SSE streaming'] },
      { heading: 'Roles', items: ['system: sets behavior and constraints', 'user: the human message', 'assistant: AI previous responses (context)'] },
      { heading: 'Error Handling', items: ['Retry with exponential backoff', 'Check model availability before requests', 'Handle rate limits (429)', 'Validate response format', 'Set reasonable timeouts'] },
    ],
  },
]

export default function CheatSheetsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = cheatSheets.filter((cs) =>
    !searchTerm || cs.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cs.sections.some((s) => s.items.some((i) => i.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  const handleCopy = (cs: typeof cheatSheets[0]) => {
    const text = `# ${cs.title}\n\n` + cs.sections.map((s) =>
      `## ${s.heading}\n${s.items.map((i) => `- ${i}`).join('\n')}`
    ).join('\n\n')
    navigator.clipboard.writeText(text)
    setCopiedId(cs.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Cheat Sheets</h1>
        <p className="text-text-secondary">Quick reference cards for key AI concepts. Copy or download as needed.</p>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search cheat sheets..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((cs, idx) => (
          <div key={cs.id}>
            <Card padding="md" className="h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cs.color} flex items-center justify-center`}>
                    <FileText size={18} className="text-white" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary">{cs.title}</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(cs)}
                  icon={copiedId === cs.id ? <Check size={14} /> : <Copy size={14} />}>
                  {copiedId === cs.id ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              {cs.sections.map((section) => (
                <div key={section.heading} className="mb-4 last:mb-0">
                  <p className="text-xs font-semibold text-accent mb-1.5">{section.heading}</p>
                  <ul className="space-y-1">
                    {section.items.map((item, i) => (
                      <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
