import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Bookmark {
  id: string
  type: 'lesson' | 'sandbox' | 'flashcard' | 'page'
  title: string
  path: string
  createdAt: number
}

interface BookmarkStore {
  bookmarks: Bookmark[]
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void
  removeBookmark: (id: string) => void
  isBookmarked: (path: string) => boolean
}

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      addBookmark: (b) => set(s => ({
        bookmarks: [...s.bookmarks, { ...b, id: `bm-${Date.now()}`, createdAt: Date.now() }],
      })),

      removeBookmark: (id) => set(s => ({
        bookmarks: s.bookmarks.filter(b => b.id !== id),
      })),

      isBookmarked: (path) => get().bookmarks.some(b => b.path === path),
    }),
    { name: 'aicademy-bookmarks', skipHydration: true }
  )
)
