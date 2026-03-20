import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PlanType = 'free' | 'pro'

interface SubscriptionStore {
  plan: PlanType
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  currentPeriodEnd: string | null
  aiMessagesUsedToday: number
  aiMessageDate: string
  // Free tier limits
  dailyAILimit: number

  // Actions
  setPlan: (plan: PlanType) => void
  setStripeCustomerId: (id: string) => void
  setStripeSubscriptionId: (id: string) => void
  setCurrentPeriodEnd: (date: string) => void
  useAIMessage: () => boolean
  canSendAIMessage: () => boolean
  getRemainingMessages: () => number
  resetDailyCount: () => void
}

const FREE_DAILY_AI_LIMIT = 10

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      plan: 'free' as PlanType,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      aiMessagesUsedToday: 0,
      aiMessageDate: '',
      dailyAILimit: FREE_DAILY_AI_LIMIT,

      setPlan: (plan) => set({ plan }),
      setStripeCustomerId: (id) => set({ stripeCustomerId: id }),
      setStripeSubscriptionId: (id) => set({ stripeSubscriptionId: id }),
      setCurrentPeriodEnd: (date) => set({ currentPeriodEnd: date }),

      useAIMessage: () => {
        const state = get()
        const today = getToday()

        // Pro users have unlimited
        if (state.plan === 'pro') return true

        // Reset counter if new day
        if (state.aiMessageDate !== today) {
          set({ aiMessagesUsedToday: 1, aiMessageDate: today })
          return true
        }

        if (state.aiMessagesUsedToday >= FREE_DAILY_AI_LIMIT) {
          return false
        }

        set({ aiMessagesUsedToday: state.aiMessagesUsedToday + 1 })
        return true
      },

      canSendAIMessage: () => {
        const state = get()
        if (state.plan === 'pro') return true
        const today = getToday()
        if (state.aiMessageDate !== today) return true
        return state.aiMessagesUsedToday < FREE_DAILY_AI_LIMIT
      },

      getRemainingMessages: () => {
        const state = get()
        if (state.plan === 'pro') return Infinity
        const today = getToday()
        if (state.aiMessageDate !== today) return FREE_DAILY_AI_LIMIT
        return Math.max(0, FREE_DAILY_AI_LIMIT - state.aiMessagesUsedToday)
      },

      resetDailyCount: () => {
        set({ aiMessagesUsedToday: 0, aiMessageDate: getToday() })
      },
    }),
    {
      name: 'aicademy-subscription',
      skipHydration: true,
    }
  )
)

export { FREE_DAILY_AI_LIMIT }
