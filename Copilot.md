# AIcademy — Codebase Audit Report

**Date:** 2025-07-08 (audit 1) | 2025-07-09 (improvements) | 2025-07-13 (audit 2)
**Scope:** Full repository audit — 112 source files across `src/`, `public/`, and root config.

---

## Applied Fixes (Phase 1 — Audit)

| # | File | Lines | Issue | Severity | Fix Applied |
|---|------|-------|-------|----------|-------------|
| 1 | `src/components/layout/CommandPalette.tsx` | 54–56 | Theme switching bypassed the theme store — used raw `document.documentElement.setAttribute('class', …)` so changes never persisted to localStorage | **High** | Imported `useThemeStore` and replaced all three theme actions with `setTheme('dark' \| 'light' \| 'high-contrast')` calls |
| 2 | `src/app/api/ai/chat/route.ts` | 19–35 | No input validation — user-supplied `model`, `messages`, `temperature`, and `max_tokens` were forwarded to Groq API without sanitization | **High** | Added `ALLOWED_MODELS` allowlist (Set), message count cap (50), temperature clamping (0–2), max_tokens clamping (1–4096), and array validation on `messages` |
| 3 | `src/app/challenges/page.tsx` | 57 | `dailyCompleted` was `useState(false)` with no setter — the daily challenge button could never show "Completed" | **High** | Wired to `useProgressStore.completedChallenges` with a date-based challenge ID (`daily-YYYY-M-D`), removed dead `useState` |
| 4 | `src/app/sandbox/prompt-builder/page.tsx` | 6 | Unused `Input` component import | **Low** | Removed the import line |

---

## Implemented Improvements (Phase 2)

| # | Improvement | Status | Changes |
|---|-------------|--------|---------|
| 1 | **Rate limiting** | ✅ Done | Created `src/lib/rate-limit.ts` (sliding window, 30 req/60s per IP). Integrated into API route with 429 responses and `X-RateLimit-Remaining` headers. |
| 2 | **A11y fixes** | ✅ Done | Added `role="presentation"` to CommandPalette backdrop. Added `htmlFor`/`id` pairs to all 4 prompt-builder textarea labels. |
| 3 | **Weekly challenge progress** | ✅ Done | Added `ActivityLog` interface and `logActivity` action to progress-store. Created `src/lib/weekly-progress.ts` with `useWeeklyCount` hook. Updated challenges page to derive real weekly progress. |
| 4 | **Error boundaries** | ✅ Done | Wrapped `{children}` in `<ErrorBoundary level="page">` and `<AITutor />` in `<ErrorBoundary level="ai">` in layout.tsx. |
| 5 | **Service worker cache** | ✅ Done | Rewrote `public/sw.js` with versioned cache (v2), static/dynamic cache split, stale-while-revalidate for static assets, network-only for API routes. |
| 6 | **Loading states** | ✅ Done | Created `PageSkeleton` component. Added `loading.tsx` files for games hub, 8 game routes, dashboard, modules, and sandbox. |
| 7 | **Type safety** | ✅ Done | Created `src/types/index.ts` with `ModuleSlug`, `GameSlug`, `MissionId`, `ChallengeId`, `AIModel`, `Difficulty` types. Applied in API route and games page. |
| 8 | **Inline styles** | ✅ Done | Converted 2 static inline styles to Tailwind in embeddings page (`h-[420px]`, `cursor-pointer`). Remaining dynamic styles (`width: ${percent}%`) are the correct pattern. |
| 9 | **Nested ternaries** | ✅ Done | Created `src/lib/get-rank.ts` utility. Refactored 8 nested ternary chains across 6 files (token-tetris, speed-type, model-arena, hallucination-hunter, hint-master, prompt-translator). |
| 10 | **PWA manifest** | ✅ Done | Added `categories`, `lang`, and `purpose` fields to `manifest.json`. |
| 11 | **Tests** | ✅ Done | Installed vitest + @testing-library/react. Created 5 test files with 36 tests covering: rate-limit, get-rank, progress-store, xp-store, and type definitions. |
| 12 | **Misc fixes** | ✅ Done | Removed unused `wasCompleted` variable from xp-store. |

---

## New Files Created

| File | Purpose |
|------|---------|
| `src/lib/rate-limit.ts` | In-memory sliding window rate limiter |
| `src/lib/weekly-progress.ts` | `useWeeklyCount` hook for weekly challenge progress |
| `src/lib/get-rank.ts` | `getRank` utility replacing nested ternary chains |
| `src/types/index.ts` | Shared type definitions (ModuleSlug, GameSlug, etc.) |
| `src/components/ui/PageSkeleton.tsx` | Reusable loading skeleton component |
| `src/app/games/loading.tsx` | Loading state for games hub |
| `src/app/games/*/loading.tsx` | Loading states for 8 game routes |
| `src/app/dashboard/loading.tsx` | Loading state for dashboard |
| `src/app/modules/loading.tsx` | Loading state for modules |
| `src/app/sandbox/loading.tsx` | Loading state for sandbox |
| `vitest.config.ts` | Vitest configuration |
| `src/__tests__/setup.ts` | Test setup (jest-dom) |
| `src/__tests__/*.test.ts` | 5 test files (36 tests) |

---

## Audit Findings — No Fix Required (Pre-existing / Informational)

| Area | Finding | Notes |
|------|---------|-------|
| `useState(Date.now)` in flashcards/page.tsx | Three instances at lines 42, 222, 449 | **Not a bug** — valid React lazy initialization (React calls `Date.now` as initializer function) |
| `dangerouslySetInnerHTML` | Searched entire codebase | **None found** — no XSS via innerHTML |
| `XP_PER_LEVEL` / `DAILY_XP_GOAL` exports | Referenced in Sidebar, Navbar, BottomNav | Verified exported at `xp-store.ts` line 233 |
| `.env.local` / API key | GROQ_API_KEY stored in `.env.local` | Properly git-ignored via `.env*` pattern in `.gitignore` |
| `poweredByHeader: false` | `next.config.ts` | Good — prevents server fingerprinting |
| Zustand `skipHydration: true` | All 9 stores | Correct SSR hydration strategy with `ThemeProvider` orchestrating rehydration |
| Dynamic inline styles | 33 instances of `style={{ width }}` | **Correct pattern** — Tailwind cannot handle runtime-computed percentages |

---

## Applied Fixes (Phase 3 — Audit 2, 2025-07-13)

| # | File | Lines | Issue | Severity | Fix Applied |
|---|------|-------|-------|----------|-------------|
| 1 | `src/app/settings/page.tsx` | 177 | **API key shown as plaintext** — `<Input>` for Groq API key had no `type="password"`, exposing the key visually | **High** | Added `type="password"` to the API key `<Input>` component |
| 2 | `src/app/recovery/page.tsx` | 37–40 | **"Clear Settings Only" clears ALL data** — `clearLocalStorage()` called `localStorage.clear()` but UI said "Keeps lesson data" | **Medium** | Replaced with selective clear that preserves `aicademy-progress`, `aicademy-xp`, and `aicademy-flashcard` keys |
| 3 | `src/app/progress/page.tsx` | 8–18, 45, 170 | **Fake analytics displayed as real data** — `Math.random()` chart data, hardcoded "12.5 hrs" focus time, static skill levels | **Medium** | Wired Focus Time to `useXPStore.totalLearningTime`, skill levels to `useProgressStore.skillProfile`, replaced random heatmap with deterministic pattern, wrapped in `ClientOnly` |
| 4 | `src/app/recovery/page.tsx` | Full | **Hardcoded dark theme colors** — used `bg-[#070710]`, `text-white`, `bg-white/5`, `text-gray-300` bypassing the design system | **Low** | Replaced all hardcoded colors with CSS variable classes (`bg-surface`, `text-text-primary`, `bg-surface-raised`, `border-border-subtle`, etc.) |
| 5 | `src/app/modules/[slug]/page.tsx` | 7 | Unused `ClientOnly` import | **Low** | Removed import |
| 6 | `src/app/prompting/page.tsx` | 5, 10, 16 | Unused imports: `Button`, `Trophy`, `CheckCircle`, `Flame`, `PromptPattern` | **Low** | Removed all 5 unused imports |
| 7 | `src/app/settings/page.tsx` | 3, 15 | Unused imports: `useEffect`, `Loader2` | **Low** | Removed both unused imports |

---

## Audit 2 — Verified Correct (No Fix Needed)

| Area | Finding | Notes |
|------|---------|-------|
| `challengeRoutes['temperature']` → `/sandbox/simulator` | `challenges/page.tsx` line 48 | **Not a dead route** — `src/app/sandbox/simulator/page.tsx` exists (504 lines) |
| `certRef` in `certificate/page.tsx` | Lines 12, 74 | Ref is created AND attached to the certificate preview div — likely reserved for future html2canvas functionality |
| `claimDailyReward()` in `xp-store.ts` | Lines 197–217 | **Fully implemented** — includes reward streak tracking, XP award, celebration trigger |
| `switchMode`/`useEffect` in `pomodoro/page.tsx` | Lines 24–50 | `setIsRunning(false)` in `switchMode` prevents interval recreation — timer works correctly |
| `Date.now` in `flashcards/page.tsx` | Lines 42, 222, 449 | **Correct** — React treats function passed to `useState` as a lazy initializer |
| All files complete | prompt-chains (504 lines), prompting/[lesson] (1101 lines), compare (432 lines) | No truncated files — all properly closed |
| `dangerouslySetInnerHTML` | Full codebase search | **None found** — zero XSS vectors via innerHTML |
