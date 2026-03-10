'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ClientOnly from '@/components/ui/ClientOnly'
import { useBookmarkStore } from '@/stores/bookmark-store'
import {
  BookOpen, Plus, Trash2, Search, Bookmark, Wrench, Layers, FileText, PenLine,
} from 'lucide-react'
import Link from 'next/link'

interface JournalEntry {
  id: string; date: string; title: string; content: string; tags: string[]
}

const sampleEntries: JournalEntry[] = [
  { id: '1', date: '2026-03-05', title: 'Understanding Transformer Architecture', content: 'Today I learned how self-attention works in transformers. The key insight is that each token creates Query, Key, and Value vectors, and the attention score determines how much each token "pays attention" to every other token.', tags: ['transformers', 'attention'] },
  { id: '2', date: '2026-03-04', title: 'Prompt Engineering Breakthrough', content: 'Chain-of-thought prompting is incredibly powerful. By simply adding "Think step by step" to my prompts, the AI\'s accuracy improved dramatically.', tags: ['prompt-engineering', 'chain-of-thought'] },
  { id: '3', date: '2026-03-03', title: 'RAG vs Fine-Tuning', content: 'RAG adds external knowledge at inference time (good for facts that change), while fine-tuning bakes knowledge into the model itself (good for style/behavior).', tags: ['rag', 'fine-tuning'] },
]

const typeIcons: Record<string, typeof BookOpen> = { lesson: BookOpen, sandbox: Wrench, flashcard: Layers, page: FileText }

type Tab = 'journal' | 'bookmarks'

export default function NotebookPage() {
  const [activeTab, setActiveTab] = useState<Tab>('journal')

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="animate-fade-in mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2 mb-1">
          <PenLine size={24} className="text-accent" /> Notebook
        </h1>
        <p className="text-sm text-text-secondary">Your journal, bookmarks, and learning notes in one place.</p>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-raised mb-6 max-w-xs">
        {[
          { id: 'journal' as const, label: 'Journal', icon: BookOpen },
          { id: 'bookmarks' as const, label: 'Bookmarks', icon: Bookmark },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.id ? 'bg-accent text-white shadow-md' : 'text-text-secondary hover:text-text-primary'
            }`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'journal' && (
          <div key="journal" className="animate-fade-in">
            <JournalSection />
          </div>
        )}
        {activeTab === 'bookmarks' && (
          <div key="bookmarks" className="animate-fade-in">
            <ClientOnly fallback={<div className="h-40 bg-surface rounded-xl" />}><BookmarkSection /></ClientOnly>
          </div>
        )}
    </div>
  )
}

function JournalSection() {
  const [entries, setEntries] = useState<JournalEntry[]>(sampleEntries)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)

  const filtered = entries.filter(e =>
    !searchTerm || e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.tags.some(t => t.includes(searchTerm.toLowerCase()))
  )

  const handleAdd = () => {
    if (!newTitle.trim() || !newContent.trim()) return
    setEntries([{ id: `j-${Date.now()}`, date: new Date().toISOString().split('T')[0], title: newTitle.trim(), content: newContent.trim(), tags: newTags.split(',').map(t => t.trim()).filter(Boolean) }, ...entries])
    setNewTitle(''); setNewContent(''); setNewTags(''); setIsAdding(false)
  }

  return (
    <>
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search journal..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} icon={<Plus size={16} />}>New Entry</Button>
      </div>

      {isAdding && (
        <div className="animate-fade-in">
          <Card padding="md" className="mb-4">
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title"
              className="w-full px-3 py-2 mb-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" />
            <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="What did you learn today?"
              className="w-full h-28 p-3 mb-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none outline-none focus:ring-2 focus:ring-accent" />
            <input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="Tags (comma-separated)"
              className="w-full px-3 py-2 mb-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" />
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!newTitle.trim() || !newContent.trim()}>Save</Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-2">
          {filtered.length === 0 && <Card padding="md" className="text-center"><BookOpen size={24} className="text-text-muted/30 mx-auto mb-2" /><p className="text-sm text-text-muted">No entries found.</p></Card>}
          {filtered.map(entry => (
            <Card key={entry.id} padding="sm" onClick={() => setSelectedEntry(entry)} className={`cursor-pointer ${selectedEntry?.id === entry.id ? 'ring-2 ring-accent' : ''}`}>
              <p className="text-[10px] text-text-muted mb-0.5">{entry.date}</p>
              <h3 className="text-sm font-semibold text-text-primary mb-0.5 truncate">{entry.title}</h3>
              <p className="text-xs text-text-secondary line-clamp-2">{entry.content}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {entry.tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">#{t}</span>)}
              </div>
            </Card>
          ))}
        </div>
        <div className="lg:col-span-2">
          {selectedEntry ? (
            <div key={selectedEntry.id} className="animate-fade-in">
              <Card padding="lg">
                <div className="flex items-start justify-between mb-3">
                  <div><p className="text-xs text-text-muted">{selectedEntry.date}</p><h2 className="text-lg font-bold text-text-primary">{selectedEntry.title}</h2></div>
                  <button onClick={() => { setEntries(e => e.filter(x => x.id !== selectedEntry.id)); setSelectedEntry(null) }}
                    className="p-2 rounded-lg text-text-muted hover:text-red hover:bg-red/10 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap mb-3">{selectedEntry.content}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.tags.map(t => <span key={t} className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">#{t}</span>)}
                </div>
              </Card>
            </div>
          ) : (
            <Card padding="lg" className="text-center"><BookOpen size={32} className="text-text-muted/20 mx-auto mb-3" /><p className="text-sm text-text-muted">Select an entry to read, or create a new one.</p></Card>
          )}
        </div>
      </div>
    </>
  )
}

function BookmarkSection() {
  const bookmarks = useBookmarkStore(s => s.bookmarks)
  const removeBookmark = useBookmarkStore(s => s.removeBookmark)

  if (bookmarks.length === 0) {
    return (
      <Card><div className="text-center py-12"><Bookmark size={40} className="mx-auto mb-3 text-text-muted/30" /><p className="text-text-muted">No bookmarks yet</p><p className="text-text-muted text-sm mt-1">Save lessons and pages to find them here.</p></div></Card>
    )
  }

  return (
    <div className="space-y-2">
      {bookmarks.map((bm, i) => {
        const Icon = typeIcons[bm.type] || FileText
        return (
          <div key={bm.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.03}s`, animationFillMode: 'both' }}>
            <Card padding="sm" className="flex items-center gap-3">
              <Icon size={18} className="text-accent flex-shrink-0" />
              <Link href={bm.path} className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{bm.title}</p>
                <p className="text-xs text-text-muted truncate">{bm.path}</p>
              </Link>
              <span className="text-[10px] text-text-muted capitalize px-2 py-0.5 rounded bg-surface-raised">{bm.type}</span>
              <button onClick={() => removeBookmark(bm.id)} className="p-1.5 rounded-lg text-text-muted hover:text-red-400 transition-colors cursor-pointer" aria-label="Remove">
                <Trash2 size={14} />
              </button>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
