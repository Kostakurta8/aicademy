import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FlashCard {
  id: string
  front: string
  back: string
  deck: string
  easeFactor: number
  interval: number        // in days
  repetition: number      // number of consecutive correct answers
  nextReview: number      // timestamp
  createdAt: number
  lastReviewed: number | null
}

interface ReviewRecord {
  cardId: string
  quality: number
  date: number
}

interface FlashcardStore {
  cards: FlashCard[]
  decks: string[]
  reviewHistory: ReviewRecord[]

  addCard: (front: string, back: string, deck: string) => void
  editCard: (id: string, front: string, back: string) => void
  deleteCard: (id: string) => void
  addDeck: (name: string) => void
  deleteDeck: (name: string) => void
  reviewCard: (id: string, quality: number) => void
  resetProgress: () => void
}

// SM-2 Algorithm implementation
function sm2(card: FlashCard, quality: number): Pick<FlashCard, 'easeFactor' | 'interval' | 'repetition' | 'nextReview' | 'lastReviewed'> {
  // quality: 0=blackout, 1=again, 2=hard, 3=good, 4=easy, 5=perfect
  let { easeFactor, interval, repetition } = card

  if (quality >= 3) {
    // Correct response
    if (repetition === 0) {
      interval = 1
    } else if (repetition === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetition += 1
  } else {
    // Incorrect — reset
    repetition = 0
    interval = 1
  }

  // Update ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const qDiff = 5 - quality
  easeFactor = easeFactor + (0.1 - qDiff * (0.08 + qDiff * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  const now = Date.now()
  const nextReview = now + interval * 86400000

  return { easeFactor, interval, repetition, nextReview, lastReviewed: now }
}

const DEFAULT_DECKS = ['AI Foundations', 'Prompt Engineering', 'LLM Internals', 'Ethics & Safety']

const DEFAULT_CARDS: Omit<FlashCard, 'id' | 'easeFactor' | 'interval' | 'repetition' | 'nextReview' | 'createdAt' | 'lastReviewed'>[] = [
  { front: 'What is a Token?', back: 'A chunk of text — roughly ¾ of a word. LLMs process text as sequences of tokens.', deck: 'AI Foundations' },
  { front: 'What is a Context Window?', back: 'The maximum number of tokens an LLM can process in a single request, including both input and output.', deck: 'AI Foundations' },
  { front: 'What does Temperature control?', back: 'The randomness of model output. 0.0 = deterministic, 1.0+ = creative and diverse.', deck: 'AI Foundations' },
  { front: 'What is RAG?', back: 'Retrieval-Augmented Generation — injecting relevant context from a knowledge base into the prompt before generating an answer.', deck: 'AI Foundations' },
  { front: 'What is a System Prompt?', back: 'An instruction given to the model that sets its role, behavior, and constraints for the conversation.', deck: 'Prompt Engineering' },
  { front: 'What is Few-Shot Prompting?', back: 'Providing several examples of input-output pairs in the prompt so the model learns the desired pattern.', deck: 'Prompt Engineering' },
  { front: 'What is Chain-of-Thought?', back: 'A technique that asks the model to reason step-by-step, improving accuracy on complex tasks.', deck: 'Prompt Engineering' },
  { front: 'What is Prompt Injection?', back: 'An attack where malicious instructions are hidden in user input to override the system prompt.', deck: 'Prompt Engineering' },
  { front: 'What are Embeddings?', back: 'Dense vector representations of text that capture semantic meaning, used for similarity search and retrieval.', deck: 'LLM Internals' },
  { front: 'What is Fine-Tuning?', back: 'Training a pre-trained model on a specific dataset to specialize its behavior for a particular task or domain.', deck: 'LLM Internals' },
  { front: 'What is the Transformer architecture?', back: 'A neural network architecture using self-attention mechanisms to process sequences in parallel, powering modern LLMs.', deck: 'LLM Internals' },
  { front: 'What is Top-P (Nucleus Sampling)?', back: 'A decoding strategy that samples from the smallest set of tokens whose cumulative probability exceeds P.', deck: 'LLM Internals' },
  { front: 'What is AI Hallucination?', back: 'When an AI model generates plausible-sounding but factually incorrect or fabricated information.', deck: 'Ethics & Safety' },
  { front: 'What is Algorithmic Bias?', back: 'Systematic errors in AI outputs caused by biased training data or design choices that unfairly favor certain groups.', deck: 'Ethics & Safety' },
  { front: 'What is RLHF?', back: 'Reinforcement Learning from Human Feedback — training models using human preference data to align outputs with human values.', deck: 'Ethics & Safety' },
  { front: 'What is a Guardrail?', back: 'Safety mechanisms that constrain AI behavior, preventing harmful, biased, or off-topic outputs.', deck: 'Ethics & Safety' },
]

function makeDefaultCards(): FlashCard[] {
  const now = Date.now()
  return DEFAULT_CARDS.map((c, i) => ({
    ...c,
    id: `default-${i + 1}`,
    easeFactor: 2.5,
    interval: 0,
    repetition: 0,
    nextReview: now - 1000, // Due immediately
    createdAt: now,
    lastReviewed: null,
  }))
}

let idCounter = Date.now()

export const useFlashcardStore = create<FlashcardStore>()(
  persist(
    (set, get) => ({
      cards: makeDefaultCards(),
      decks: [...DEFAULT_DECKS],
      reviewHistory: [],

      addCard: (front, back, deck) => {
        const now = Date.now()
        const card: FlashCard = {
          id: `card-${++idCounter}`,
          front,
          back,
          deck,
          easeFactor: 2.5,
          interval: 0,
          repetition: 0,
          nextReview: now - 1000,
          createdAt: now,
          lastReviewed: null,
        }
        set((s) => ({ cards: [...s.cards, card] }))
      },

      editCard: (id, front, back) => {
        set((s) => ({
          cards: s.cards.map((c) => (c.id === id ? { ...c, front, back } : c)),
        }))
      },

      deleteCard: (id) => {
        set((s) => ({ cards: s.cards.filter((c) => c.id !== id) }))
      },

      addDeck: (name) => {
        const { decks } = get()
        if (!decks.includes(name)) {
          set({ decks: [...decks, name] })
        }
      },

      deleteDeck: (name) => {
        set((s) => ({
          decks: s.decks.filter((d) => d !== name),
          cards: s.cards.filter((c) => c.deck !== name),
        }))
      },

      reviewCard: (id, quality) => {
        const now = Date.now()
        set((s) => {
          const card = s.cards.find((c) => c.id === id)
          if (!card) return s

          const updated = sm2(card, quality)
          return {
            cards: s.cards.map((c) => (c.id === id ? { ...c, ...updated } : c)),
            reviewHistory: [...s.reviewHistory.slice(-499), { cardId: id, quality, date: now }],
          }
        })
      },

      resetProgress: () => {
        const now = Date.now()
        set((s) => ({
          cards: s.cards.map((c) => ({
            ...c,
            easeFactor: 2.5,
            interval: 0,
            repetition: 0,
            nextReview: now - 1000,
            lastReviewed: null,
          })),
          reviewHistory: [],
        }))
      },
    }),
    {
      name: 'aicademy-flashcards',
      skipHydration: true,
    }
  )
)
