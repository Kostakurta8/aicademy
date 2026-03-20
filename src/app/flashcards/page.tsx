'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ClientOnly from '@/components/ui/ClientOnly'
import { useFlashcardStore, type FlashCard } from '@/stores/flashcard-store'
import { useXPStore } from '@/stores/xp-store'
import { useSubscriptionStore, FREE_FLASHCARD_DECK_LIMIT } from '@/stores/subscription-store'
import { playCorrect, playXPDing, playIncorrect } from '@/lib/sounds'
import {
  Layers, RotateCcw, Check, Brain, Plus, Trash2,
  Edit3, BarChart3, BookOpen, FolderOpen, X, Save,
  Award, Clock, TrendingUp, Lock, Crown,
} from 'lucide-react'
import Link from 'next/link'

type Tab = 'review' | 'cards' | 'stats'

function getIntervalLabel(card: FlashCard, quality: number): string {
  if (quality < 3) return '< 1 min'
  const { interval, repetition, easeFactor } = card
  let next: number
  if (repetition === 0) next = 1
  else if (repetition === 1) next = 6
  else next = Math.round(interval * easeFactor)
  if (next === 1) return '1 day'
  if (next < 30) return `${next} days`
  if (next < 365) return `${Math.round(next / 30)} mo`
  return `${(next / 365).toFixed(1)} yr`
}

// ---------- Review Tab ----------

function ReviewTab() {
  const cards = useFlashcardStore((s) => s.cards)
  const reviewCard = useFlashcardStore((s) => s.reviewCard)
  const resetProgress = useFlashcardStore((s) => s.resetProgress)
  const [flipped, setFlipped] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null)
  const decks = useFlashcardStore((s) => s.decks)

  const [now, setNow] = useState(Date.now)
  useEffect(() => { queueMicrotask(() => setNow(Date.now())) }, [cards, selectedDeck])

  const dueCards = useMemo(() => {
    return cards
      .filter((c) => c.nextReview <= now && (!selectedDeck || c.deck === selectedDeck))
      .sort((a, b) => a.nextReview - b.nextReview)
  }, [cards, selectedDeck, now])

  const currentCard = dueCards[0]

  const handleAnswer = useCallback(
    (quality: number) => {
      if (!currentCard) return
      reviewCard(currentCard.id, quality)
      setReviewedCount((p) => p + 1)
      setFlipped(false)

      // XP + sounds
      if (quality >= 3) {
        useXPStore.getState().addXP(5, 'flashcards')
        useXPStore.getState().recordActivity()
        playCorrect()
      } else {
        playIncorrect()
      }
    },
    [currentCard, reviewCard]
  )

  return (
    <div>
      {/* Deck filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setSelectedDeck(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !selectedDeck
              ? 'bg-accent text-white'
              : 'bg-surface-alt text-text-secondary hover:text-text-primary'
          }`}
        >
          All Decks
        </button>
        {decks.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDeck(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedDeck === d
                ? 'bg-accent text-white'
                : 'bg-surface-alt text-text-secondary hover:text-text-primary'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-accent">{cards.length}</p>
          <p className="text-xs text-text-muted">Total Cards</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-green">{reviewedCount}</p>
          <p className="text-xs text-text-muted">Reviewed</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-gold">{dueCards.length}</p>
          <p className="text-xs text-text-muted">Due</p>
        </Card>
      </div>

      {!currentCard ? (
          <div key="complete" className="animate-bounce-in">
            <Card padding="lg" className="text-center">
              <div className="py-8">
                <div className="w-16 h-16 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-green" />
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">All caught up!</h2>
                <p className="text-text-secondary mb-6">
                  {reviewedCount > 0
                    ? `Great session — you reviewed ${reviewedCount} card${reviewedCount > 1 ? 's' : ''}. Come back when more are due.`
                    : 'No cards due right now. Add new cards or come back later.'}
                </p>
                <Button variant="secondary" onClick={resetProgress} icon={<RotateCcw size={16} />}>
                  Reset All Progress
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div key={currentCard.id} className="animate-fade-in">
            <div
              onClick={() => setFlipped(!flipped)}
              className="cursor-pointer mb-6"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setFlipped(!flipped)
              }}
              aria-label={flipped ? 'Show question' : 'Show answer'}
            >
              <Card padding="lg" glow={flipped} className="min-h-[280px] flex items-center justify-center border-2 transition-colors duration-300">
                <div className="text-center w-full">
                  <span className="text-xs font-medium text-accent uppercase tracking-widest mb-4 block">
                    {currentCard.deck}
                  </span>
                  {!flipped ? (
                      <div key="front" className="animate-fade-in">
                        <Brain size={40} className="text-accent mx-auto mb-6 opacity-30" />
                        <p className="text-2xl font-semibold text-text-primary px-4">{currentCard.front}</p>
                        <p className="text-sm text-text-muted mt-8 opacity-50">Click to reveal answer</p>
                      </div>
                    ) : (
                      <div key="back" className="animate-fade-in">
                        <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-4">Answer</p>
                        <p className="text-xl text-text-secondary leading-relaxed px-4">{currentCard.back}</p>
                      </div>
                    )}
                </div>
              </Card>
            </div>

            {flipped && (
              <div className="grid grid-cols-4 gap-3 animate-fade-in">
                <Button variant="danger" size="lg" className="flex-1" onClick={() => handleAnswer(1)}>
                  <div className="flex flex-col items-center">
                    <span>Again</span>
                    <span className="text-[10px] opacity-70 font-normal">{getIntervalLabel(currentCard, 1)}</span>
                  </div>
                </Button>
                <Button variant="secondary" size="lg" className="flex-1" onClick={() => handleAnswer(2)}>
                  <div className="flex flex-col items-center">
                    <span>Hard</span>
                    <span className="text-[10px] opacity-70 font-normal">{getIntervalLabel(currentCard, 2)}</span>
                  </div>
                </Button>
                <Button variant="primary" size="lg" className="flex-1" onClick={() => handleAnswer(3)}>
                  <div className="flex flex-col items-center">
                    <span>Good</span>
                    <span className="text-[10px] opacity-70 font-normal">{getIntervalLabel(currentCard, 3)}</span>
                  </div>
                </Button>
                <Button variant="primary" size="lg" className="flex-1 !bg-green hover:!bg-green/90 !border-green" onClick={() => handleAnswer(5)}>
                  <div className="flex flex-col items-center text-white">
                    <span>Easy</span>
                    <span className="text-[10px] opacity-70 font-normal">{getIntervalLabel(currentCard, 5)}</span>
                  </div>
                </Button>
              </div>
            )}
          </div>
        )}
    </div>
  )
}

// ---------- Cards Tab ----------

function CardsTab() {
  const cards = useFlashcardStore((s) => s.cards)
  const decks = useFlashcardStore((s) => s.decks)
  const addCard = useFlashcardStore((s) => s.addCard)
  const editCard = useFlashcardStore((s) => s.editCard)
  const deleteCard = useFlashcardStore((s) => s.deleteCard)
  const addDeck = useFlashcardStore((s) => s.addDeck)
  const deleteDeck = useFlashcardStore((s) => s.deleteDeck)
  const canCreateDeck = useSubscriptionStore((s) => s.canCreateFlashcardDeck(decks.length))

  const [filterDeck, setFilterDeck] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ front: '', back: '', deck: decks[0] || '' })
  const [newDeckName, setNewDeckName] = useState('')
  const [showDeckInput, setShowDeckInput] = useState(false)

  const filtered = filterDeck ? cards.filter((c) => c.deck === filterDeck) : cards
  const [renderNow] = useState(Date.now)

  const handleSave = () => {
    if (!form.front.trim() || !form.back.trim() || !form.deck) return
    if (editingId) {
      editCard(editingId, form.front.trim(), form.back.trim())
      setEditingId(null)
    } else {
      addCard(form.front.trim(), form.back.trim(), form.deck)
      useXPStore.getState().addXP(3, 'flashcards')
      playXPDing()
    }
    setForm({ front: '', back: '', deck: form.deck })
    setShowAdd(false)
  }

  const startEdit = (card: FlashCard) => {
    setEditingId(card.id)
    setForm({ front: card.front, back: card.back, deck: card.deck })
    setShowAdd(true)
  }

  const handleAddDeck = () => {
    if (!newDeckName.trim()) return
    addDeck(newDeckName.trim())
    setForm((f) => ({ ...f, deck: newDeckName.trim() }))
    setNewDeckName('')
    setShowDeckInput(false)
  }

  return (
    <div>
      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterDeck(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !filterDeck ? 'bg-accent text-white' : 'bg-surface-alt text-text-secondary hover:text-text-primary'
            }`}
          >
            All ({cards.length})
          </button>
          {decks.map((d) => {
            const count = cards.filter((c) => c.deck === d).length
            return (
              <button
                key={d}
                onClick={() => setFilterDeck(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors group relative ${
                  filterDeck === d
                    ? 'bg-accent text-white'
                    : 'bg-surface-alt text-text-secondary hover:text-text-primary'
                }`}
              >
                {d} ({count})
                {count === 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteDeck(d)
                      if (filterDeck === d) setFilterDeck(null)
                    }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red rounded-full text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete empty deck"
                  >
                    ×
                  </button>
                )}
              </button>
            )
          })}
        </div>
        <Button
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => {
            setEditingId(null)
            setForm({ front: '', back: '', deck: filterDeck || decks[0] || '' })
            setShowAdd(true)
          }}
        >
          Add Card
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
          <div className="animate-fade-in">
            <Card padding="md" className="mb-6">
              <h3 className="text-sm font-semibold text-text-primary mb-4">
                {editingId ? 'Edit Card' : 'New Card'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="card-front" className="text-xs text-text-muted mb-1 block">Front (Question)</label>
                  <input
                    id="card-front"
                    value={form.front}
                    onChange={(e) => setForm((f) => ({ ...f, front: e.target.value }))}
                    className="w-full bg-surface-alt border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                    placeholder="What is...?"
                  />
                </div>
                <div>
                  <label htmlFor="card-back" className="text-xs text-text-muted mb-1 block">Back (Answer)</label>
                  <textarea
                    id="card-back"
                    value={form.back}
                    onChange={(e) => setForm((f) => ({ ...f, back: e.target.value }))}
                    rows={3}
                    className="w-full bg-surface-alt border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent resize-none"
                    placeholder="The answer is..."
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label htmlFor="card-deck" className="text-xs text-text-muted mb-1 block">Deck</label>
                    <select
                      id="card-deck"
                      value={form.deck}
                      onChange={(e) => setForm((f) => ({ ...f, deck: e.target.value }))}
                      className="w-full bg-surface-alt border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                    >
                      {decks.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!showDeckInput ? (
                    canCreateDeck ? (
                      <Button size="sm" variant="ghost" onClick={() => setShowDeckInput(true)}>
                        <FolderOpen size={14} /> New Deck
                      </Button>
                    ) : (
                      <Link href="/pricing" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-purple bg-purple/10 hover:bg-purple/20 transition-colors">
                        <Crown size={12} /> Pro: Unlimited Decks
                      </Link>
                    )
                  ) : (
                    <div className="flex gap-1">
                      <input
                        value={newDeckName}
                        onChange={(e) => setNewDeckName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddDeck()}
                        className="bg-surface-alt border border-border-subtle rounded-lg px-2 py-1.5 text-sm text-text-primary w-32 focus:outline-none focus:border-accent"
                        placeholder="Deck name"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleAddDeck}>
                        <Check size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowDeckInput(false)}>
                        <X size={14} />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} icon={<Save size={14} />}>
                    {editingId ? 'Update' : 'Add Card'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowAdd(false)
                      setEditingId(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

      {/* Card list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card padding="md" className="text-center">
            <p className="text-text-muted py-4">No cards in this deck yet.</p>
          </Card>
        )}
        {filtered.map((card) => {
          const isDue = card.nextReview <= renderNow
          return (
            <div key={card.id} className="transition-all duration-300 animate-fade-in">
              <Card padding="sm" className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isDue ? 'bg-orange' : 'bg-green'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{card.front}</p>
                  <p className="text-xs text-text-muted truncate">{card.back}</p>
                </div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider whitespace-nowrap hidden sm:block">
                  {card.deck}
                </span>
                <span className="text-[10px] text-text-muted whitespace-nowrap">
                  {card.interval > 0 ? `${card.interval}d` : 'New'}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(card)}
                    className="p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
                    title="Edit card"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => deleteCard(card.id)}
                    className="p-1.5 rounded-md text-text-muted hover:text-red hover:bg-red/10 transition-colors"
                    title="Delete card"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- Stats Tab ----------

function StatsTab() {
  const cards = useFlashcardStore((s) => s.cards)
  const reviewHistory = useFlashcardStore((s) => s.reviewHistory)

  const [now] = useState(Date.now)
  const today = useMemo(() => new Date(now).toDateString(), [now])
  const reviewedToday = reviewHistory.filter((r) => new Date(r.date).toDateString() === today).length
  const dueNow = cards.filter((c) => c.nextReview <= now).length
  const mastered = cards.filter((c) => c.repetition >= 5).length
  const learning = cards.filter((c) => c.repetition > 0 && c.repetition < 5).length
  const newCards = cards.filter((c) => c.repetition === 0 && c.lastReviewed === null).length

  // Average ease factor
  const avgEase = cards.length > 0 ? cards.reduce((a, c) => a + c.easeFactor, 0) / cards.length : 2.5

  // Retention rate (quality >= 3 in last 50 reviews)
  const recent = reviewHistory.slice(-50)
  const retention = recent.length > 0 ? Math.round((recent.filter((r) => r.quality >= 3).length / recent.length) * 100) : 0

  // Last 7 days review count
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dayStr = d.toDateString()
    return {
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      count: reviewHistory.filter((r) => new Date(r.date).toDateString() === dayStr).length,
    }
  })
  const maxDayCount = Math.max(...last7Days.map((d) => d.count), 1)

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm" className="text-center">
          <Award size={20} className="text-accent mx-auto mb-1" />
          <p className="text-2xl font-bold text-accent">{mastered}</p>
          <p className="text-xs text-text-muted">Mastered</p>
        </Card>
        <Card padding="sm" className="text-center">
          <TrendingUp size={20} className="text-gold mx-auto mb-1" />
          <p className="text-2xl font-bold text-gold">{learning}</p>
          <p className="text-xs text-text-muted">Learning</p>
        </Card>
        <Card padding="sm" className="text-center">
          <BookOpen size={20} className="text-blue mx-auto mb-1" />
          <p className="text-2xl font-bold text-blue">{newCards}</p>
          <p className="text-xs text-text-muted">New</p>
        </Card>
        <Card padding="sm" className="text-center">
          <Clock size={20} className="text-orange mx-auto mb-1" />
          <p className="text-2xl font-bold text-orange">{dueNow}</p>
          <p className="text-xs text-text-muted">Due Now</p>
        </Card>
      </div>

      {/* Scorecard */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Performance</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-3xl font-bold text-green">{retention}%</p>
            <p className="text-xs text-text-muted">Retention Rate</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-accent">{reviewedToday}</p>
            <p className="text-xs text-text-muted">Reviewed Today</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-text-primary">{avgEase.toFixed(2)}</p>
            <p className="text-xs text-text-muted">Avg Ease Factor</p>
          </div>
        </div>
      </Card>

      {/* 7-day activity chart */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Last 7 Days</h3>
        <div className="flex items-end gap-2 h-32">
          {last7Days.map((day) => (
            <div key={day.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-text-muted">{day.count}</span>
              <div className="w-full relative h-[80px]">
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-md bg-accent/60 transition-all duration-500"
                  style={{ minHeight: day.count > 0 ? '4px' : '0', height: `${(day.count / maxDayCount) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-text-muted">{day.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Mastery distribution */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Mastery Distribution</h3>
        <div className="space-y-2">
          {[
            { label: 'New', count: newCards, color: 'bg-blue' },
            { label: 'Learning (1-2 reps)', count: cards.filter((c) => c.repetition >= 1 && c.repetition <= 2).length, color: 'bg-orange' },
            { label: 'Familiar (3-4 reps)', count: cards.filter((c) => c.repetition >= 3 && c.repetition <= 4).length, color: 'bg-gold' },
            { label: 'Mastered (5+ reps)', count: mastered, color: 'bg-green' },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-36">{row.label}</span>
              <div className="flex-1 h-3 bg-surface-alt rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-600 ${row.color}`}
                  style={{ width: `${cards.length ? (row.count / cards.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-text-muted w-8 text-right">{row.count}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="text-center">
        <p className="text-xs text-text-muted">Total reviews: {reviewHistory.length}</p>
      </div>
    </div>
  )
}

// ---------- Main Page ----------

export default function FlashcardsPage() {
  const [tab, setTab] = useState<Tab>('review')

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'review', label: 'Review', icon: <Brain size={16} /> },
    { key: 'cards', label: 'Cards', icon: <BookOpen size={16} /> },
    { key: 'stats', label: 'Stats', icon: <BarChart3 size={16} /> },
  ]

  return (
    <ClientOnly>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex items-center gap-3">
            <Layers className="text-accent" /> Spaced Repetition
          </h1>
          <p className="text-text-secondary">
            SM-2 powered flashcards. Review concepts at optimal intervals for long-term retention.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-surface-alt rounded-xl p-1 mb-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-surface text-accent shadow-sm'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
          <div
            key={tab}
            className="animate-fade-in"
          >
            {tab === 'review' && <ReviewTab />}
            {tab === 'cards' && <CardsTab />}
            {tab === 'stats' && <StatsTab />}
          </div>
      </div>
    </ClientOnly>
  )
}
