import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface JournalEntry {
  id: string
  date: string
  title: string
  content: string
  tags: string[]
  moduleSlug?: string
}

interface JournalStore {
  entries: JournalEntry[]
  addEntry: (entry: Omit<JournalEntry, 'id' | 'date'>) => void
  deleteEntry: (id: string) => void
}

const sampleEntries: JournalEntry[] = [
  {
    id: '1',
    date: '2026-03-05',
    title: 'Understanding Transformer Architecture',
    content: 'Today I learned how self-attention works in transformers. The key insight is that each token creates Query, Key, and Value vectors, and the attention score determines how much each token "pays attention" to every other token. The formula Attention(Q,K,V) = softmax(QK^T/√dk)V finally makes sense!',
    tags: ['transformers', 'attention', 'architecture'],
    moduleSlug: 'foundations',
  },
  {
    id: '2',
    date: '2026-03-04',
    title: 'Prompt Engineering Breakthrough',
    content: 'Chain-of-thought prompting is incredibly powerful. By simply adding "Think step by step" to my prompts, the AI\'s math accuracy went from ~40% to ~85%. The key is to force the model to show its work before giving a final answer.',
    tags: ['prompt-engineering', 'chain-of-thought'],
    moduleSlug: 'prompt-engineering',
  },
  {
    id: '3',
    date: '2026-03-03',
    title: 'RAG vs Fine-Tuning',
    content: 'Learned the key difference: RAG adds external knowledge at inference time (good for facts that change), while fine-tuning bakes knowledge into the model itself (good for style/behavior). RAG is usually the better first choice because it\'s cheaper and more maintainable.',
    tags: ['rag', 'fine-tuning', 'comparison'],
  },
]

export const useJournalStore = create<JournalStore>()(
  persist(
    (set) => ({
      entries: sampleEntries,

      addEntry: (entry) => set((s) => ({
        entries: [
          {
            id: `j-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            ...entry,
          },
          ...s.entries,
        ],
      })),

      deleteEntry: (id) => set((s) => ({
        entries: s.entries.filter((e) => e.id !== id),
      })),
    }),
    { name: 'aicademy-journal', skipHydration: true }
  )
)
