'use client'

import Card from '@/components/ui/Card'
import { useBookmarkStore } from '@/stores/bookmark-store'
import ClientOnly from '@/components/ui/ClientOnly'
import { ArrowLeft, Bookmark, BookOpen, Wrench, Layers, FileText, Trash2 } from 'lucide-react'
import Link from 'next/link'

const typeIcons: Record<string, typeof BookOpen> = {
  lesson: BookOpen, sandbox: Wrench, flashcard: Layers, page: FileText,
}

export default function BookmarksPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="text-text-muted hover:text-text-primary"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Bookmarks</h1>
          <p className="text-text-secondary text-sm">Your saved lessons and pages for quick access.</p>
        </div>
      </div>
      <ClientOnly fallback={<div className="h-40 bg-surface rounded-xl" />}>
        <BookmarkList />
      </ClientOnly>
    </div>
  )
}

function BookmarkList() {
  const bookmarks = useBookmarkStore(s => s.bookmarks)
  const removeBookmark = useBookmarkStore(s => s.removeBookmark)

  if (bookmarks.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <Bookmark size={40} className="mx-auto mb-3 text-text-muted/30" />
          <p className="text-text-muted">No bookmarks yet</p>
          <p className="text-text-muted text-sm mt-1">Save lessons and pages to find them quickly later.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {bookmarks.map((bm, i) => {
        const Icon = typeIcons[bm.type] || FileText
        return (
          <div key={bm.id}
          >
            <Card padding="sm" className="flex items-center gap-3">
              <Icon size={18} className="text-accent flex-shrink-0" />
              <Link href={bm.path} className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{bm.title}</p>
                <p className="text-xs text-text-muted truncate">{bm.path}</p>
              </Link>
              <span className="text-[10px] text-text-muted capitalize px-2 py-0.5 rounded bg-surface-raised">{bm.type}</span>
              <button onClick={() => removeBookmark(bm.id)}
                className="p-1.5 rounded-lg text-text-muted hover:text-red-400 transition-colors cursor-pointer"
                aria-label="Remove bookmark"
              >
                <Trash2 size={14} />
              </button>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
