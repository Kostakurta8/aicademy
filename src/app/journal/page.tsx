'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ClientOnly from '@/components/ui/ClientOnly'
import { useJournalStore, type JournalEntry } from '@/stores/journal-store'
import { BookOpen, Plus, Trash2, Search } from 'lucide-react'

export default function JournalPage() {
  return (
    <ClientOnly fallback={<div className="h-96" />}>
      <JournalContent />
    </ClientOnly>
  )
}

function JournalContent() {
  const entries = useJournalStore((s) => s.entries)
  const addEntry = useJournalStore((s) => s.addEntry)
  const deleteEntry = useJournalStore((s) => s.deleteEntry)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)

  const filtered = entries.filter((e) =>
    !searchTerm ||
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.tags.some((t) => t.includes(searchTerm.toLowerCase()))
  )

  const handleAdd = () => {
    if (!newTitle.trim() || !newContent.trim()) return
    addEntry({
      title: newTitle.trim(),
      content: newContent.trim(),
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
    })
    setNewTitle('')
    setNewContent('')
    setNewTags('')
    setIsAdding(false)
  }

  const handleDelete = (id: string) => {
    deleteEntry(id)
    if (selectedEntry?.id === id) setSelectedEntry(null)
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Learning Journal</h1>
        <p className="text-text-secondary">Reflect on what you&apos;ve learned. Personal notes, insights, and breakthroughs.</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search journal..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" />
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} icon={<Plus size={16} />}>New Entry</Button>
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="animate-fade-in">
          <Card padding="md" className="mb-6">
            <h3 className="text-base font-semibold text-text-primary mb-3">New Journal Entry</h3>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Title"
              className="w-full px-3 py-2 mb-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" />
            <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="What did you learn today?"
              className="w-full h-32 p-3 mb-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none outline-none focus:ring-2 focus:ring-accent" />
            <input value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="Tags (comma-separated)"
              className="w-full px-3 py-2 mb-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent" />
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!newTitle.trim() || !newContent.trim()}>Save Entry</Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry list */}
        <div className="lg:col-span-1 space-y-3">
          {filtered.length === 0 && (
            <Card padding="md" className="text-center">
              <BookOpen size={24} className="text-text-muted/30 mx-auto mb-2" />
              <p className="text-sm text-text-muted">No entries found.</p>
            </Card>
          )}
          {filtered.map((entry) => (
            <div key={entry.id}>
              <Card padding="sm" onClick={() => setSelectedEntry(entry)} className={`cursor-pointer ${selectedEntry?.id === entry.id ? 'ring-2 ring-accent' : ''}`}>
                <p className="text-xs text-text-muted mb-1">{entry.date}</p>
                <h3 className="text-sm font-semibold text-text-primary mb-1 truncate">{entry.title}</h3>
                <p className="text-xs text-text-secondary line-clamp-2">{entry.content}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.tags.map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">#{t}</span>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Detail view */}
        <div className="lg:col-span-2">
          {selectedEntry ? (
            <div key={selectedEntry.id} className="animate-fade-in">
              <Card padding="lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-text-muted">{selectedEntry.date}</p>
                    <h2 className="text-xl font-bold text-text-primary">{selectedEntry.title}</h2>
                  </div>
                  <button onClick={() => handleDelete(selectedEntry.id)} className="p-2 rounded-lg text-text-muted hover:text-red hover:bg-red/10 transition-colors cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap mb-4">{selectedEntry.content}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.tags.map((t) => (
                    <span key={t} className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent">#{t}</span>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card padding="lg" className="text-center">
              <BookOpen size={32} className="text-text-muted/20 mx-auto mb-3" />
              <p className="text-sm text-text-muted">Select an entry to read, or create a new one.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
