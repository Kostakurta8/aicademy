# AIcademy — GitHub Copilot Project Knowledge Base

> **AIcademy** is an interactive AI literacy learning platform. Users master AI concepts through structured modules, prompt engineering lessons, interactive sandboxes, 13 educational games, developer labs, ethics tools, and a full gamification system (XP, levels, streaks, missions). All AI features are powered by Groq API. All user data lives client-side in localStorage — there is no database, no user auth, no backend persistence.

---

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | Next.js (App Router) | 16.1.6 | `src/app/` directory, file-system routing |
| UI | React | 19.2.3 | Functional components only, hooks-based |
| Styling | Tailwind CSS | 4 | Via `@tailwindcss/postcss`, CSS-first config |
| State | Zustand | 5.0.11 | `persist` middleware + `skipHydration: true` |
| Animation | Motion | 12.35+ | Import from `motion/react` (NOT `framer-motion`) |
| Icons | Lucide React | 0.577+ | Tree-shakeable, import individual icons |
| AI Backend | Groq API | Cloud | Proxied via `/api/ai/chat` and `/api/ai/models` |
| Language | TypeScript 5 | Strict mode | Path alias: `@/*` → `./src/*` |
| PWA | Service Worker + Manifest | — | Offline caching, installable |
| Sound | Web Audio API | — | Synthesized beeps, no audio files |

**Environment:** `GROQ_API_KEY` in `.env.local`. No database. No auth. All persistence = localStorage.

## Commands

```bash
npm run dev      # Dev server on :3000
npm run build    # Production build
npm start        # Production server
npm run lint     # ESLint (next core-web-vitals + typescript)
```

---

## Coding Conventions & Patterns

### Hard Rules — Follow These Always

1. **Every page is a Client Component** — Use `'use client'` at the top of every page.tsx
2. **Import Motion from `motion/react`** — Never use `framer-motion`. Example: `import { motion, AnimatePresence } from 'motion/react'`
3. **Import icons individually** — `import { Star, Flame } from 'lucide-react'` (never import the whole library)
4. **Use `@/` path alias** — All imports use `@/components/...`, `@/stores/...`, `@/lib/...`
5. **Wrap client-dependent UI in `<ClientOnly>`** — Any component reading from Zustand stores on initial render must be wrapped in `<ClientOnly fallback={...}>` to prevent hydration mismatch
6. **Use CSS variables for colors** — Never hardcode hex colors in Tailwind classes. Use semantic tokens: `bg-surface`, `text-text-primary`, `text-accent`, `border-border-subtle`, etc.
7. **Use the Card component** — All content cards use `<Card>` from `@/components/ui/Card`. Props: `padding`, `glow`, `hover`, `onClick`
8. **Use the Button component** — All buttons use `<Button>` from `@/components/ui/Button`. Variants: `primary`, `secondary`, `ghost`, `danger`
9. **Zustand store access pattern** — Use selector syntax: `const xp = useXPStore((s) => s.totalXP)` (never `useXPStore()` without selector)
10. **No `useEffect` for store reads** — Stores are pre-hydrated by ThemeProvider; just read them via selectors
11. **Page layout pattern** — Every page uses: `<div className="p-6 md:p-8 max-w-7xl mx-auto">`
12. **Animations** — Entry animations use `motion.div` with `initial={{ opacity: 0, y: 15 }}`, `animate={{ opacity: 1, y: 0 }}`
13. **Responsive design** — Mobile-first. Common breakpoints: `md:` (768px) for sidebar, grid columns
14. **No external CSS files per component** — All styling is Tailwind utility classes or CSS variables from `globals.css`

### Component Patterns

```tsx
// Typical page structure:
'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ClientOnly from '@/components/ui/ClientOnly'
import { useXPStore } from '@/stores/xp-store'
import { Star } from 'lucide-react'

export default function SomeFeaturePage() {
  const [state, setState] = useState(initialValue)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Hero section with icon + title + subtitle */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple to-blue flex items-center justify-center">
          <Star size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Page Title</h1>
        <p className="text-text-secondary">Description text</p>
      </motion.div>

      {/* Content */}
      <ClientOnly fallback={<div className="h-40" />}>
        <ContentThatReadsStores />
      </ClientOnly>
    </div>
  )
}
```

### Game Page Pattern

Games follow a consistent state machine:
- States: `intro` → `playing` → `result`
- Intro screen: title, rules, start button
- Playing: timer/lives/score HUD at top, game content in center
- Result: score summary, XP earned, play again button
- Call `useXPStore.getState().addXP(amount)` on game completion
- Use `GameEffects.tsx` components: `ConfettiBurst`, `AnimatedScore`, `ComboIndicator`, `TimerBar`, `XPPopup`, `ScreenFlash`, `StreakFire`, `LivesDisplay`, `ProgressDots`
- Sound effects via `playCorrect()`, `playIncorrect()`, `playXPDing()`, `playLevelUp()` from `@/lib/sounds`

### Data Pattern

All game/lesson content is **hardcoded in the page file** as const arrays/objects. There is no CMS, no API for content, no JSON files. Example:
```tsx
const rounds = [
  { topic: 'Transformers', statements: [...], correctAnswer: 1 },
  // ...
]
```

---

## Architecture Overview

### Root Layout (`src/app/layout.tsx`)

```
<html lang="en" className="dark" suppressHydrationWarning>
  <head> manifest.json + apple-touch-icon + theme-color </head>
  <body className="${inter} ${jetbrainsMono} antialiased">
    <ClientOnly fallback={loading spinner}>
      <ThemeProvider>
        <a skip-to-content />
        <Sidebar />            ← 6 nav items, collapsible (260px / 72px)
        <Navbar />             ← AI status, theme cycler, mobile hamburger
        <main id="main-content" className="min-h-screen pt-16 ml-0 md:ml-[260px]">
          {children}
        </main>
        <ToastContainer />     ← Bottom-right toast stack (max 3)
        <CommandPalette />     ← Ctrl+K fuzzy search
        <KeyboardShortcuts />  ← Global keybinds + ? overlay
        <AITutor />            ← Floating chat widget (bottom-right)
      </ThemeProvider>
    </ClientOnly>
  </body>
</html>
```

**Fonts:** Inter (body, `--font-inter`) + JetBrains Mono (code, `--font-jetbrains`)

### Sidebar — 6-Tab Navigation

| Icon | Label | Route | Scope |
|------|-------|-------|-------|
| LayoutDashboard | Home | `/dashboard` | Overview & stats |
| BookOpen | Learn | `/modules` | 8 learning modules |
| Wand2 | Prompting | `/prompting` | Prompt engineering track |
| Gamepad2 | Practice | `/games` | 13 games + daily quests |
| TrendingUp | Progress | `/progress` | Analytics & streaks |
| Settings | Settings | `/settings` | Profile, AI config, prefs |

Active state: `bg-accent/10 text-accent`. Collapsible on desktop (72px), full-screen overlay on mobile.

### ThemeProvider — Central Initialization Hub

On mount, ThemeProvider:
1. Manually rehydrates 6 persisted Zustand stores: `theme`, `user`, `xp`, `progress`, `ai`, `bookmark`
2. Calls `checkAIHealth()` → populates available Groq models
3. Registers `/sw.js` service worker for PWA
4. Applies theme class on `<html>` and listens for `prefers-color-scheme` changes

**Critical:** All stores use `skipHydration: true`. They are NOT auto-hydrated — ThemeProvider calls `rehydrate()` on each one. If you add a new persisted store, you MUST add its `rehydrate()` call in ThemeProvider.

---

## Full Route Map

### Core Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Hero with CTA, feature pills, gradient background |
| `/dashboard` | Dashboard | Greeting, quick actions, stats cards, module grid (8) |
| `/modules` | Module Hub | 8 learning modules with metadata (difficulty, lessons, hours, XP) |
| `/modules/[slug]` | Module Detail | Individual module overview with lesson list |
| `/modules/[slug]/[lesson]` | Lesson | Three-layer learning: Read → Apply → Reinforce |
| `/learning-path` | Learning Path | Visual sequential timeline with unlock system |
| `/progress` | Progress | XP, level, streak, 30-day chart, skill profile |
| `/settings` | Settings | Profile, API key, model selector, preferences, backup/export |
| `/bookmarks` | Bookmarks | Saved lessons, sandboxes, pages |
| `/certificate` | Certificate | Generate learning certificates |
| `/recovery` | Recovery | Data recovery |

### Games (13 total) — `/games/*`

| Slug | Game | XP | Difficulty | Mechanic |
|------|------|----|------------|----------|
| `prompt-duel` | Prompt Duel | 150 | Medium | Write prompts vs AI benchmark, keyword scoring |
| `token-tetris` | Token Tetris | 120 | Easy | Fit blocks into token budget, 4 levels |
| `hallucination-hunter` | Hallucination Hunter | 180 | Hard | Spot fake facts, 8 rounds, 3 lives |
| `speed-type` | Speed Type AI | 100 | Easy | 60s typing, 20 AI terms, combo streaks |
| `bias-detective` | Bias Detective | 170 | Medium | Case files, severity levels, progressive |
| `ai-jeopardy` | AI Jeopardy | 200 | Medium | 5×5 grid, 15s timer, daily doubles |
| `neural-network-builder` | Neural Network Builder | 250 | Hard | Drag layers, 4 architectures |
| `ai-escape-room` | AI Escape Room | 220 | Hard | 4 rooms, multi-type puzzles, timer |
| `model-arena` | Model Arena | 140 | Medium | Judge AI responses, scoring rubric |
| `prompt-evolution` | Prompt Evolution | 160 | Medium | 5-stage prompt improvement |
| `ai-timeline` | AI Timeline | 130 | Easy | Sort 14 milestones chronologically |
| `prompt-heist` | Prompt Heist | 200 | Hard | 3 missions, decode prompts, bypass filters |
| `ai-myth-busters` | AI Myth Busters | 150 | Medium | 16 claims, MYTH/FACT with sources |

**Daily Quests** (6 challenges, tracked via `completedChallenges[]` in progress store):
First Prompt (50 XP), Speed Demon (100 XP), Bias Spotter (120 XP), Room Breaker (80 XP), Myth Buster (75 XP), Secret Agent (110 XP)

### Prompting Track — `/prompting/*`

**8 Lessons** (three-layer: read/apply/reinforce):
1. Understanding Claude (150 XP, Beginner) → Architecture, Context Windows, Capabilities
2. System Prompts & Roles (180 XP, Beginner) → System Messages, Persona Design
3. XML Tags & Structure (200 XP, Intermediate) → XML Formatting, Structured Input
4. Chain of Thought (220 XP, Intermediate) → Step-by-Step Reasoning
5. Few-Shot Learning (200 XP, Intermediate) → Example Design, Pattern Matching
6. Output Control (180 XP, Intermediate) → Format Spec, Length Control
7. Advanced Techniques (250 XP, Advanced) → Meta-Prompting, Self-Correction
8. Anti-Patterns & Pitfalls (160 XP, Beginner) → Common Mistakes, Recovery

**5 Prompting Games:**
- `/prompting/prompt-architect` — Build prompts block-by-block
- `/prompting/prompt-doctor` — Diagnose broken prompts
- `/prompting/prompt-dojo` — Write and grade prompts on 8 dimensions
- `/prompting/prompt-translator` — Convert instructions → structured prompts
- `/prompting/hint-master` — Spot the single best prompt fix

**Prompt Patterns Toolkit:** Classification, Summarization, Extraction, Translation, Paraphrasing, Content Generation, Code Generation, Brainstorming, Analysis, Question Answering

### Sandbox Tools — `/sandbox/*`

| Tool | Status | Description |
|------|--------|-------------|
| Prompt Builder | ✅ | Visual builder (role/context/task/format), 3 presets, live AI output |
| Prompt Chains | 🔜 | Node-based multi-step workflow canvas |
| Fix the Prompt | ✅ | Fix broken prompts, see before/after |
| Model Compare | 🔜 | Same prompt → multiple models side-by-side |
| AI Use-Case Simulator | ✅ | Real-world scenarios (support, content, code) |
| Context Window Visualizer | ✅ | Token counting, visual fill-up |
| Prompt Library | ✅ | Curated templates, browse/save |

### AI Internals — `/internals/*`

| Tool | What It Teaches |
|------|----------------|
| Token Viewer | How tokenization works, token-by-token display |
| LLM Diagram | Interactive transformer architecture visualization |
| 3D Embeddings | Vector space, word relationships in 3D |
| Fine-Tuning Simulator | Adjust parameters, see effects on model behavior |
| RAG Pipeline | Step-by-step retrieval-augmented generation flow |

### Ethics & Safety — `/ethics/*`

| Tool | What It Does |
|------|-------------|
| Hallucination Detector | Test AI outputs for factual accuracy |
| Bias Analyzer | Analyze demographic bias in AI outputs |
| AI vs Human Quiz | Detect AI-generated text |
| Red-Team Lab | Educational prompt injection / safety testing |

### Developer Labs — `/labs/*`

| Lab | Description |
|-----|-------------|
| AI CLI Simulator | Terminal-style curl/API practice |
| Agent Orchestration | Visual multi-agent system builder |
| Webhook Builder | AI-powered automation workflows |
| Vector DB Lab | Embeddings, similarity search |
| RAG Pipeline Builder | Visual RAG pipeline construction |

### Missions — `/missions/*`

| Mission | Difficulty | XP | Steps |
|---------|-----------|-----|-------|
| AI Tourist Guide | Medium | 500 | 5 |
| Content Machine | Medium | 600 | 6 |
| AI Code Reviewer | Hard | 800 | 7 |
| Debate Champion | Hard | 900 | 8 |
| AI Data Analyst | Expert | 1000 | 10 |

### Personal Tools

| Route | Purpose |
|-------|---------|
| `/journal` | Learning reflection entries with tags |
| `/notebook` | Combined journal + bookmarks with search |
| `/flashcards` | Spaced repetition learning |
| `/cheat-sheets` | Quick reference guides |
| `/challenges` | Weekly challenges |
| `/pomodoro` | Focus timer (work/break configurable in settings) |
| `/knowledge-graph` | Concept map visualization |

---

## Design System

### Triple Theme System

Applied via CSS class on `<html>`: `.dark` (default), `.light`, `.high-contrast`.

**Core CSS Variables** (defined in `globals.css`):

| Token | Dark | Light | High Contrast |
|-------|------|-------|---------------|
| `--bg` | `#070710` | `#f8fafc` | `#000000` |
| `--surface` | `#0f0f1a` | `#ffffff` | `#1a1a1a` |
| `--surface-raised` | `#16162a` | `#f1f5f9` | `#2a2a2a` |
| `--text-primary` | `#f1f5f9` | `#0f172a` | `#ffffff` |
| `--text-secondary` | `#94a3b8` | `#475569` | `#e0e0e0` |
| `--text-muted` | `#475569` | `#94a3b8` | `#b0b0b0` |
| `--border` | `#1e1e3a` | `#e2e8f0` | `#ffffff` |

**Semantic Color Tokens:** `--purple` (#7c3aed), `--blue` (#2563eb), `--green` (#16a34a), `--orange` (#ea580c), `--pink` (#db2777), `--cyan` (#0891b2), `--gold` (#d97706), `--red` (#ef4444)

**Derived:** `--accent: var(--purple)`, `--focus-ring: var(--purple)`, `--gradient-start: #7c3aed`, `--gradient-end: #2563eb`

### Glass Morphism

- `.glass` — `background: var(--glass-bg)` + `border: var(--glass-border)` + `backdrop-blur: var(--glass-blur)` (12px). Disabled in HC mode.
- `.glass-card` — Glass + `rounded-2xl` + hover lift (`y: -2px`) + glow shadow.
- `.neon-glow` — Purple glow shadow (dark mode only), subtle shadow in light, solid border in HC.

### Tailwind Class Naming Convention

```
bg-bg, bg-surface, bg-surface-raised        ← Background layers (3 tiers)
text-text-primary, text-text-secondary, text-text-muted  ← Text hierarchy
border-border-subtle                         ← Borders (maps to --border)
text-accent, bg-accent, ring-accent          ← Interactive accent (purple)
text-purple, text-blue, text-green, etc.     ← Semantic colors
bg-purple/10, bg-accent/10                   ← Transparent tints
```

### Layout Constants
- Sidebar: `--sidebar-width: 260px` (collapsed: `72px`)
- Navbar: `--navbar-height: 64px` → main content uses `pt-16 ml-0 md:ml-[260px]`

### Animations
- `@keyframes gradient-shift` — 15s infinite loop, used in `.animated-gradient-bg`
- Page entries: `motion.div` with `initial={{ opacity: 0, y: 15 }}` + `animate={{ opacity: 1, y: 0 }}`
- Staggered children: `transition={{ delay: index * 0.05 }}`
- Buttons: `whileHover={{ scale: 1.02 }}` + `whileTap={{ scale: 0.98 }}`
- Reduced motion: All animations respect `prefers-reduced-motion` media query

### Accessibility
- Skip-to-content link (visible on focus)
- Focus rings: `2px solid var(--focus-ring)` with `2px` offset (HC: `3px yellow`)
- Semantic HTML: `<main role="main">`, `<nav aria-label>`, `<button aria-label>`
- Keyboard navigation: Escape to close modals, Tab through interactive elements

---

## State Management — 8 Zustand Stores

All persisted stores use key prefix `aicademy-*` in localStorage. All use `skipHydration: true`.

### `ai-store.ts` (key: `aicademy-ai`)
```typescript
{
  aiHealthy: boolean                    // Groq API reachable?
  installedModels: string[]             // Available model IDs from Groq
  selectedModel: string                 // Default: 'llama-3.1-8b-instant'
  isGenerating: boolean                 // Currently streaming?
  abortController: AbortController|null // Cancel active stream
  conversations: Conversation[]         // { id, title, messages: AIMessage[], createdAt, updatedAt }
  activeConversationId: string|null     // Current chat
  tutorOpen: boolean                    // AI Tutor panel visible?
}
// Persisted: selectedModel, conversations, activeConversationId
```

### `progress-store.ts` (key: `aicademy-progress`)
```typescript
{
  moduleProgress: Record<slug, {
    started: boolean
    completedLessons: string[]
    quizScores: Record<string, number>
    unlocked: boolean
  }>
  lessonProgress: Record<key, {
    currentStep: number
    totalSteps: number
    layerCompleted: { read: boolean, apply: boolean, reinforce: boolean }
    lastVisited: number // timestamp
  }>
  completedMissions: string[]
  completedChallenges: string[]
  completedWeeklyChallenges: string[]
  skillProfile: Record<string, number>  // topic → 0-100 score
}
```

### `xp-store.ts` (key: `aicademy-xp`)
```typescript
{
  totalXP: number
  level: number                         // 1-30, derived from XP_PER_LEVEL thresholds
  currentStreak: number                 // consecutive days
  longestStreak: number
  lastActivityDate: string              // 'YYYY-MM-DD'
  streakFreezes: number                 // max 3
  streakFreezeEarned: number[]          // milestones: [7, 30, 90]
  xpHistory: Array<{date, xp}>         // last 90 days
  streakHistory: string[]               // last 365 days
  totalLearningTime: number             // minutes
  lifetimeXPByModule: Record<string, number>
  weeklyXPHistory: Array<{week, xp}>
  bestWeekXP: number
  comebackBonusAvailable: boolean
}
// XP_PER_LEVEL = [0, 100, 250, 500, 800, 1200, ..., 40800] (30 levels)
```

### `user-store.ts` (key: `aicademy-user`)
```typescript
{
  storeVersion: number
  createdAt: string
  name: string                          // Display name
  avatar: string                        // Avatar identifier
  groqApiKey: string                    // Optional user-provided key
  preferredModel: string
  modelOverrides: Record<string, string>
  autoDetectModel: boolean
  reducedMotion: boolean
  soundEnabled: boolean
  soundVolume: number                   // 0-1
  pomodoroWork: number                  // minutes
  pomodoroBreak: number                 // minutes
  celebrationAnimations: boolean
  onboardingComplete: boolean
  selectedTrack: null | 'student' | 'professional' | 'builder'
  lastBackupDate: string|null
  backupReminderDismissed: boolean
}
```

### `theme-store.ts` (key: `aicademy-theme`)
```typescript
{
  theme: 'dark' | 'light' | 'high-contrast' | 'system'
  resolvedTheme: 'dark' | 'light' | 'high-contrast'
}
// cycleTheme: dark → light → high-contrast → dark
```

### `bookmark-store.ts` (key: `aicademy-bookmarks`)
```typescript
{
  bookmarks: Array<{
    id: string
    type: 'lesson' | 'sandbox' | 'flashcard' | 'page'
    title: string
    path: string
    createdAt: string
  }>
}
```

### `ui-store.ts` (NOT persisted)
```typescript
{
  sidebarCollapsed: boolean
  sidebarMobileOpen: boolean
  commandPaletteOpen: boolean
  activeModal: string | null
}
```

### `notification-store.ts` (NOT persisted)
```typescript
{
  toasts: Array<{ id, type, title, message?, duration, dismissible, createdAt }>
  maxVisible: 3
}
// Hook: useToast() → { success(title, msg?), error(title, msg?), warning(title, msg?), info(title, msg?) }
```

---

## AI Integration — Groq API

### API Routes

**`POST /api/ai/chat`** — Proxies to `https://api.groq.com/openai/v1/chat/completions`
- Requires `GROQ_API_KEY` env var (401 if missing)
- Body: `{ model?, messages: AIMessage[], stream: boolean, temperature?, max_tokens? }`
- Streaming: returns `text/event-stream` (SSE)
- Non-streaming: returns JSON `{ choices: [{ message: { content } }] }`

**`GET /api/ai/models`** — Returns `{ healthy, models[], error? }`
- Fallback models: `llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, `gemma2-9b-it`, `mixtral-8x7b-32768`

### Client Library (`src/lib/ai/groq-client.ts`)

| Export | Type | Purpose |
|--------|------|---------|
| `streamChat(options)` | Function | Streaming chat, returns `AbortController` |
| `chatComplete(messages, opts)` | Function | Non-streaming chat → `Promise<{content, error}>` |
| `checkAIHealth()` | Function | Probe API → `Promise<{healthy, models[], error?}>` |
| `useBufferedStream()` | Hook | `{ displayText, appendToken, reset }` — 60fps RAF-based rendering |
| `AIMessage` | Interface | `{ role: 'system'\|'user'\|'assistant', content: string }` |
| `StreamOptions` | Interface | `{ model, messages, onToken, onComplete, onError, temperature?, max_tokens? }` |

### Sound System (`src/lib/sounds.ts`)

Web Audio API — no external audio files:
- `playXPDing()` — Two-tone beep (880Hz→1100Hz) for earning XP
- `playLevelUp()` — Four-note ascending melody (C, E, G, C) for level-ups
- `playCorrect()` — Two-note success chime (660Hz→880Hz)
- `playIncorrect()` — Two-note descending buzz (300Hz→250Hz)

Controlled by `userStore.soundEnabled` and `userStore.soundVolume`.

---

## Components Reference

### UI Components (`src/components/ui/`)

| Component | Key Props | Usage |
|-----------|-----------|-------|
| `Button` | `variant: 'primary'\|'secondary'\|'ghost'\|'danger'`, `size: 'sm'\|'md'\|'lg'`, `loading`, `icon` | All buttons. Motion-animated hover/tap. |
| `Card` | `padding: 'none'\|'sm'\|'md'\|'lg'`, `glow`, `hover`, `onClick` | All content cards. Glass-morphism. Keyboard-accessible when clickable. |
| `Input` | `label`, `error`, `helperText` | Form inputs. ARIA labels + focus ring. |
| `Modal` | `isOpen`, `onClose`, `title`, `size` | Dialogs. Focus trap, Escape to close. |
| `ClientOnly` | `children`, `fallback` | SSR safety wrapper. |
| `DifficultyBadge` | `difficulty: 'easy'\|'medium'\|'hard'` | Color-coded dots. |
| `ErrorBoundary` | `children` | Catches render errors. |
| `GameEffects` | (multiple exports) | `ConfettiBurst`, `AnimatedScore`, `ComboIndicator`, `TimerBar`, `XPPopup`, `ScreenFlash`, `StreakFire`, `LivesDisplay`, `ProgressDots` |

### Layout Components (`src/components/layout/`)

| Component | Purpose |
|-----------|---------|
| `Sidebar` | 6-tab nav, collapsible, mobile overlay |
| `Navbar` | AI health badge, theme cycler, mobile trigger |
| `ThemeProvider` | Store rehydration, SW registration, theme init |
| `CommandPalette` | Ctrl+K fuzzy search across all pages |
| `KeyboardShortcuts` | Global keybinds + help overlay (?) |

### AI Components (`src/components/ai/`)

| Component | Purpose |
|-----------|---------|
| `AITutor` | Floating chat widget, conversation history, streaming, model selection |

---

## Learning Model — How the Platform Teaches

### Three-Layer Lesson System
Every lesson in a module has three layers:
1. **Read** — Theory, explanation, diagrams
2. **Apply** — Hands-on exercise, live prompt testing
3. **Reinforce** — Quiz, practice, reflection

Progress tracked per-layer in `lessonProgress.layerCompleted: { read, apply, reinforce }`.

### 8 Module Curriculum

| # | Module | Slug | Lessons | XP | Difficulty |
|---|--------|------|---------|----|-----------|
| 1 | Foundations of AI | `foundations` | 4 | 800 | Beginner |
| 2 | Prompt Engineering | `prompt-engineering` | 6 | 1000 | Beginner |
| 3 | AI Tools Ecosystem | `tools-ecosystem` | 3 | 800 | Beginner |
| 4 | Building with APIs | `building-with-apis` | 4 | 1200 | Intermediate |
| 5 | Ethics & Critical Thinking | `ethics` | 3 | 800 | Beginner |
| 6 | Real-World Projects | `real-world-projects` | 3 | 1200 | Intermediate |
| 7 | Image, Video & Audio | `image-video-audio` | 3 | 800 | Beginner |
| 8 | Agents & Automation | `agents-automation` | 3 | 1000 | Intermediate |

Sequential unlock: Module N unlocks when Module N-1 is 100% complete.

### Gamification System
- **XP:** Earned from lessons, games, missions, challenges. 30 levels (max 40,800 XP)
- **Streaks:** Daily activity tracking. Freeze available at 7/30/90 day milestones. Comeback bonus after 3+ day gap.
- **Daily Quests:** 6 challenges refreshed daily, tracked in progress store.
- **Skill Profile:** Topic → score (0-100) mapping, updated as user completes content.

### Learning Tracks
User selects: `student`, `professional`, or `builder` — stored in `userStore.selectedTrack`.

---

## PWA Features

**Manifest** (`public/manifest.json`):
- Name: "AIcademy — AI Literacy Learning Platform"
- Start URL: `/dashboard` | Display: `standalone`
- Theme: `#8b5cf6` (purple) | Background: `#070710` (dark)
- Icons: 192×192 and 512×512 PNG

**Service Worker** (`public/sw.js`):
- Cache name: `aicademy-v1`
- Offline URLs cached: `/dashboard`, `/modules`
- Strategy: Network-first with fallback to cache
- Cleans up old caches on activate

---

## File Organization

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (sidebar, navbar, providers)
│   ├── page.tsx            # Landing page (/)
│   ├── globals.css         # Design system CSS variables + utilities
│   ├── api/ai/             # API routes (chat, models)
│   ├── dashboard/          # Home dashboard
│   ├── modules/            # Learning modules hub + [slug] + [slug]/[lesson]
│   ├── prompting/          # Prompt engineering track + games
│   ├── games/              # 13 educational games
│   ├── sandbox/            # 7 interactive tools
│   ├── internals/          # 5 AI internals visualizers
│   ├── ethics/             # Ethics & safety tools
│   ├── labs/               # Developer labs
│   ├── missions/           # Multi-step guided projects
│   ├── progress/           # Analytics & streak tracking
│   ├── settings/           # User preferences & config
│   └── [personal tools]/   # journal, notebook, flashcards, etc.
├── components/
│   ├── ai/                 # AITutor widget
│   ├── layout/             # Sidebar, Navbar, ThemeProvider, CommandPalette, KeyboardShortcuts
│   ├── notifications/      # ToastContainer
│   └── ui/                 # Button, Card, Input, Modal, ClientOnly, GameEffects, etc.
├── lib/
│   ├── sounds.ts           # Web Audio API sound effects
│   └── ai/                 # Groq client library (streamChat, chatComplete, checkAIHealth)
└── stores/                 # 8 Zustand stores (ai, bookmark, notification, progress, theme, ui, user, xp)
```

---

## Key Constraints to Remember

1. **No database** — Everything is localStorage. Don't suggest Prisma, Drizzle, or database solutions.
2. **No auth** — No login, no user accounts, no sessions. Don't suggest NextAuth or Clerk.
3. **No external APIs except Groq** — Don't suggest OpenAI, Anthropic, etc. without asking first.
4. **Client-side rendering** — All pages are `'use client'`. Don't suggest Server Components, server actions, or RSC patterns.
5. **Tailwind 4** — Uses CSS-first config (`@import "tailwindcss"`), NOT `tailwind.config.js`. No `tailwind.config.ts` file exists.
6. **Motion, not framer-motion** — Import from `motion/react`. The package is `motion`, not `framer-motion`.
7. **Content is hardcoded** — Game data, lesson content, module definitions are all inline const arrays. No CMS, no JSON imports.
8. **PWA-first** — The app is installable. Keep it fast, offline-capable, and responsive.
9. **Windows development** — Developer runs on Windows. Use PowerShell-compatible commands.
10. **Glassmorphism aesthetic** — Dark-first, glass cards, subtle glows, neon accents. This is the visual identity.
