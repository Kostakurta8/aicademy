import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AIMessage } from '@/lib/ai/groq-client'

interface Conversation {
  id: string
  title: string
  messages: AIMessage[]
  createdAt: number
  updatedAt: number
}

interface AIStore {
  aiHealthy: boolean
  installedModels: string[]
  selectedModel: string
  isGenerating: boolean
  abortController: AbortController | null
  conversations: Conversation[]
  activeConversationId: string | null
  tutorOpen: boolean

  setAIHealth: (healthy: boolean, models: string[]) => void
  setSelectedModel: (model: string) => void
  setGenerating: (generating: boolean) => void
  setAbortController: (controller: AbortController | null) => void
  abortCurrentRequest: () => void

  setTutorOpen: (open: boolean) => void
  createConversation: (title?: string) => string
  addMessage: (conversationId: string, message: AIMessage) => void
  updateLastAssistantMessage: (conversationId: string, content: string) => void
  deleteConversation: (id: string) => void
  setActiveConversation: (id: string | null) => void
  getActiveConversation: () => Conversation | undefined
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      aiHealthy: false,
      installedModels: [],
      selectedModel: 'llama-3.1-8b-instant',
      isGenerating: false,
      abortController: null,
      conversations: [],
      activeConversationId: null,
      tutorOpen: false,

      setAIHealth: (healthy, models) => set({ aiHealthy: healthy, installedModels: models }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setGenerating: (generating) => set({ isGenerating: generating }),
      setAbortController: (controller) => set({ abortController: controller }),
      abortCurrentRequest: () => {
        const { abortController } = get()
        abortController?.abort()
        set({ abortController: null, isGenerating: false })
      },

      setTutorOpen: (open) => set({ tutorOpen: open }),
      createConversation: (title) => {
        const id = `conv-${Date.now()}`
        const conv: Conversation = {
          id, title: title || 'New Chat',
          messages: [], createdAt: Date.now(), updatedAt: Date.now(),
        }
        set((s) => ({
          conversations: [conv, ...s.conversations],
          activeConversationId: id,
        }))
        return id
      },

      addMessage: (conversationId, message) => set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() }
            : c
        ),
      })),

      updateLastAssistantMessage: (conversationId, content) => set((s) => ({
        conversations: s.conversations.map((c) => {
          if (c.id !== conversationId) return c
          const msgs = [...c.messages]
          const lastIdx = msgs.length - 1
          if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
            msgs[lastIdx] = { ...msgs[lastIdx], content }
          }
          return { ...c, messages: msgs, updatedAt: Date.now() }
        }),
      })),

      deleteConversation: (id) => set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== id),
        activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
      })),

      setActiveConversation: (id) => set({ activeConversationId: id }),
      getActiveConversation: () => {
        const { conversations, activeConversationId } = get()
        return conversations.find((c) => c.id === activeConversationId)
      },
    }),
    {
      name: 'aicademy-ai',
      skipHydration: true,
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
)
