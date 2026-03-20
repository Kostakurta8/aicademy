import type { GameSlug, ModuleSlug } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PlanType = "free" | "pro";

// ── Content gating: 3 modules, 2 games, 1 flashcard deck, 1 sandbox free ──
export const FREE_MODULES: ModuleSlug[] = [
  "foundations",
  "prompt-engineering",
  "tools-ecosystem",
];
export const FREE_GAMES: GameSlug[] = [
  "token-tetris",
  "speed-type",
];
export const FREE_SANDBOXES = [
  "prompt-builder",
];
export const FREE_FLASHCARD_DECK_LIMIT = 1;

interface SubscriptionStore {
  plan: PlanType;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;

  // Actions
  setPlan: (plan: PlanType) => void;
  setStripeCustomerId: (id: string) => void;
  setStripeSubscriptionId: (id: string) => void;
  setCurrentPeriodEnd: (date: string) => void;
  canAccessModule: (slug: string) => boolean;
  canAccessGame: (slug: string) => boolean;
  canAccessSandbox: (slug: string) => boolean;
  canCreateFlashcardDeck: (currentDeckCount: number) => boolean;
  isPro: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      plan: "free" as PlanType,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,

      setPlan: (plan) => set({ plan }),
      setStripeCustomerId: (id) => set({ stripeCustomerId: id }),
      setStripeSubscriptionId: (id) => set({ stripeSubscriptionId: id }),
      setCurrentPeriodEnd: (date) => set({ currentPeriodEnd: date }),

      canAccessModule: (slug) => {
        if (get().plan === "pro") return true;
        return FREE_MODULES.includes(slug as ModuleSlug);
      },

      canAccessGame: (slug) => {
        if (get().plan === "pro") return true;
        return FREE_GAMES.includes(slug as GameSlug);
      },

      canAccessSandbox: (slug) => {
        if (get().plan === "pro") return true;
        return FREE_SANDBOXES.includes(slug);
      },

      canCreateFlashcardDeck: (currentDeckCount) => {
        if (get().plan === "pro") return true;
        return currentDeckCount < FREE_FLASHCARD_DECK_LIMIT;
      },

      isPro: () => get().plan === "pro",
    }),
    {
      name: "aicademy-subscription",
      skipHydration: true,
    },
  ),
);
