# AIcademy — Codebase Audit Report

**Date:** 2025-07-08
**Scope:** Full repository audit — 112 source files across `src/`, `public/`, and root config.

---

## Applied Fixes

| # | File | Lines | Issue | Severity | Fix Applied |
|---|------|-------|-------|----------|-------------|
| 1 | `src/components/layout/CommandPalette.tsx` | 54–56 | Theme switching bypassed the theme store — used raw `document.documentElement.setAttribute('class', …)` so changes never persisted to localStorage | **High** | Imported `useThemeStore` and replaced all three theme actions with `setTheme('dark' \| 'light' \| 'high-contrast')` calls |
| 2 | `src/app/api/ai/chat/route.ts` | 19–35 | No input validation — user-supplied `model`, `messages`, `temperature`, and `max_tokens` were forwarded to Groq API without sanitization | **High** | Added `ALLOWED_MODELS` allowlist (Set), message count cap (50), temperature clamping (0–2), max_tokens clamping (1–4096), and array validation on `messages` |
| 3 | `src/app/challenges/page.tsx` | 57 | `dailyCompleted` was `useState(false)` with no setter — the daily challenge button could never show "Completed" | **High** | Wired to `useProgressStore.completedChallenges` with a date-based challenge ID (`daily-YYYY-M-D`), removed dead `useState` |
| 4 | `src/app/sandbox/prompt-builder/page.tsx` | 6 | Unused `Input` component import | **Low** | Removed the import line |

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

---

## Improvement Plan

### High Priority

1. **Rate limiting on `/api/ai/chat`** — The API route now validates inputs but has no rate limiting. A malicious or runaway client can send unlimited requests. Add middleware-based rate limiting (e.g., `next-rate-limit` or an in-memory token bucket per IP).

2. **Accessibility (a11y) audit** — ESLint flags multiple issues:
   - `CommandPalette.tsx`: Backdrop `<div>` with `onClick` lacks keyboard handler and role; `role="dialog"` should use native `<dialog>`.
   - `prompt-builder/page.tsx`: `<label>` elements not associated with form controls (missing `htmlFor`/`id` pairing).
   - Multiple pages use interactive `<div>` elements without proper keyboard support.

3. **Weekly challenge progress tracking** — `getWeeklyChallenge()` always returns `progress: 0` hardcoded. Wire to `useProgressStore` to track actual progress toward weekly goals.

4. **Error boundaries around AI features** — AI chat, sandbox tools, and lab pages make network calls to `/api/ai/chat` but most lack error UI beyond console logs. Add user-facing error states with retry actions.

### Medium Priority

5. **Service worker cache strategy** — `public/sw.js` caches everything with a network-first fallback. Consider versioned cache keys and a stale-while-revalidate strategy for static assets, with network-only for API routes.

6. **Bundle size optimization** — `lucide-react` is already in `optimizePackageImports`, but several pages import 10+ icons. Consider per-page dynamic imports for rarely-visited game pages (13 game pages).

7. **Type safety on store actions** — Several stores use loose string types for IDs (`completedMissions: string[]`, `completedChallenges: string[]`). Consider branded types or enums to prevent typos in challenge/mission IDs.

8. **Consistent loading states** — Some pages show skeletons, some show spinners, some show nothing during hydration. Standardize on a single loading pattern across all pages.

### Low Priority

9. **ESLint inline-style warnings** — Multiple pages use `style={{ width: '...' }}` for progress bars. Extract to Tailwind arbitrary values or CSS custom properties.

10. **Nested ternary expressions** — `prompt-builder/page.tsx` and several other pages use deeply nested ternaries for conditional rendering. Extract to named helper functions or early returns for readability.

11. **Test coverage** — No test files found in the repository. Add at minimum:
    - Unit tests for store logic (XP calculations, spaced repetition algorithm, streak detection)
    - Integration tests for the API route (validation, streaming)
    - Component tests for critical UI flows (onboarding, flashcard review)

12. **PWA manifest completeness** — `manifest.json` exists but verify all required fields (icons at multiple sizes, `start_url`, `display`, `theme_color`) for full installability across platforms.
