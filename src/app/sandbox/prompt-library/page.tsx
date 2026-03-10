'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Library, Copy, Check, Search } from 'lucide-react'

const prompts = [
  { id: '1', title: 'Blog Post Generator', category: 'Writing', tags: ['content', 'blog'], prompt: 'You are an expert blog writer. Write a {length}-word blog post about {topic} for {audience}. Use a {tone} tone. Include:\n- An engaging title\n- Introduction with a hook\n- 3-4 main sections with headers\n- Bullet points where appropriate\n- A conclusion with a call-to-action' },
  { id: '2', title: 'Code Reviewer', category: 'Development', tags: ['code', 'review'], prompt: 'You are a senior {language} developer. Review the following code for:\n1. Bugs and logic errors\n2. Security vulnerabilities\n3. Performance issues\n4. Code style and best practices\n5. Naming conventions\n\nFor each issue found, provide:\n- Severity: critical/warning/suggestion\n- Line reference (if applicable)\n- Explanation of the problem\n- Suggested fix with code\n\nCode to review:\n```\n{code}\n```' },
  { id: '3', title: 'Meeting Summary', category: 'Productivity', tags: ['business', 'meetings'], prompt: 'Summarize the following meeting notes into a structured format:\n\n## Meeting Summary\n- **Date:** {date}\n- **Attendees:** {attendees}\n\n## Key Decisions\n- (list each decision)\n\n## Action Items\n| Owner | Task | Due Date |\n|-------|------|----------|\n\n## Next Steps\n- (list next steps)\n\nMeeting notes:\n{notes}' },
  { id: '4', title: 'Socratic Teacher', category: 'Education', tags: ['teaching', 'learning'], prompt: 'You are a Socratic teacher. Never give direct answers. Instead, guide the student through a series of questions that help them discover the answer themselves.\n\nRules:\n- Ask one question at a time\n- Build on their previous answer\n- If they\'re stuck, give a small hint as a question\n- Celebrate when they find the answer\n- Maximum 5 guiding questions before revealing\n\nTopic to teach: {topic}\nStudent level: {level}' },
  { id: '5', title: 'API Documentation', category: 'Development', tags: ['docs', 'api'], prompt: 'Generate API documentation for the following endpoint:\n\nEndpoint: {method} {path}\nDescription: {description}\n\nInclude:\n- Description\n- Parameters (path, query, body) with types\n- Request example (curl + JavaScript fetch)\n- Success response (200) with example JSON\n- Error responses (400, 401, 404, 500)\n- Rate limiting info\n- Notes/caveats' },
  { id: '6', title: 'Email Drafter', category: 'Writing', tags: ['email', 'professional'], prompt: 'Draft a professional email:\n\n- **Purpose:** {purpose}\n- **Recipient:** {recipient}\n- **Tone:** {tone}\n- **Key points to cover:**\n  {points}\n\nKeep it concise (under 200 words). Include:\n- Clear subject line\n- Appropriate greeting\n- Body with main message\n- Specific call-to-action\n- Professional sign-off' },
  { id: '7', title: 'Debate Both Sides', category: 'Analysis', tags: ['analysis', 'critical-thinking'], prompt: 'Analyze the following topic from both perspectives:\n\nTopic: {topic}\n\n## Arguments FOR:\n1. (with evidence/reasoning)\n2.\n3.\n\n## Arguments AGAINST:\n1. (with evidence/reasoning)\n2.\n3.\n\n## Nuanced Take:\nProvide a balanced, nuanced conclusion that acknowledges the strongest points from both sides.' },
  { id: '8', title: 'User Story Writer', category: 'Development', tags: ['agile', 'product'], prompt: 'Generate user stories for the following feature:\n\nFeature: {feature}\nProduct: {product}\n\nFor each user story, include:\n- Format: "As a [user type], I want to [action] so that [benefit]"\n- Acceptance criteria (Given/When/Then format)\n- Priority: must-have / should-have / nice-to-have\n- Estimated complexity: S / M / L / XL\n\nGenerate at least 5 user stories covering the main use cases.' },
]

const categories = ['All', ...new Set(prompts.map((p) => p.category))]

export default function PromptLibraryPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = prompts.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.tags.some((t) => t.includes(search.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Prompt Library</h1>
        <p className="text-text-secondary">Curated prompt templates with fill-in variables. Copy, customize, and use.</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                selectedCategory === cat ? 'bg-accent text-white' : 'bg-surface-raised text-text-secondary hover:bg-border-subtle/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts grid */}
      <div className="space-y-4">
        {filtered.map((p, idx) => (
          <div key={p.id}>
            <Card padding="md">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-base font-semibold text-text-primary">{p.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">{p.category}</span>
                    {p.tags.map((t) => (
                      <span key={t} className="text-xs text-text-muted">#{t}</span>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(p.id, p.prompt)}
                  icon={copiedId === p.id ? <Check size={14} /> : <Copy size={14} />}
                >
                  {copiedId === p.id ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <pre className="text-xs text-text-secondary bg-surface-raised p-3 rounded-lg overflow-auto whitespace-pre-wrap font-mono max-h-48">
                {p.prompt}
              </pre>
            </Card>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card padding="lg" className="text-center">
          <Library size={32} className="text-text-muted/30 mx-auto mb-3" />
          <p className="text-sm text-text-muted">No prompts match your search.</p>
        </Card>
      )}
    </div>
  )
}
