# AIcademy — AI Literacy Learning Platform

Interactive lessons, games, sandboxes, and gamified learning for understanding AI. Powered by Groq AI.

## Tech Stack

- **Next.js 16** (Turbopack) + **React 19** + **TypeScript 5**
- **Tailwind CSS 4** + glassmorphism design system
- **Zustand 5** for state (localStorage persistence, no database)
- **Groq API** for AI features (chat, sandbox, missions)
- **Vitest** + Testing Library for tests

## Getting Started (Local)

```bash
npm install
cp .env.example .env.local   # then add your Groq API key
npm run dev                   # http://localhost:3000
```

Get a free Groq API key at https://console.groq.com/keys

## Scripts

| Command         | Description             |
| --------------- | ----------------------- |
| `npm run dev`   | Start dev server        |
| `npm run build` | Production build        |
| `npm start`     | Start production server |
| `npm run lint`  | ESLint check            |
| `npm test`      | Run tests               |

## Environment Variables

| Variable       | Required              | Description                                         |
| -------------- | --------------------- | --------------------------------------------------- |
| `GROQ_API_KEY` | Yes (for AI features) | Groq API key — the rest of the app works without it |

## Deploy to Vercel (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"** and select `Kostakurta8/aicademy`
3. Vercel auto-detects Next.js — no config changes needed
4. Add environment variable: `GROQ_API_KEY` = your key
5. Click **Deploy** — you'll get a `.vercel.app` URL in ~2 minutes

> The `vercel.json` in this repo sets the region to `fra1` (Frankfurt) and adds security headers.

## Deploy to Render

1. Go to [render.com/new](https://dashboard.render.com/web/new)
2. Connect your GitHub and select `Kostakurta8/aicademy`
3. Render reads `render.yaml` automatically, or configure manually:
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variable: `GROQ_API_KEY` = your key
5. Click **Create Web Service**

## Project Structure

```
src/
  app/           64 routes (pages, API, loading states)
  components/    22 components (UI, layout, AI, onboarding)
  data/          Static data (modules, games, prompting)
  lib/           Utilities (AI client, sounds, rate limiter)
  stores/        10 Zustand stores (XP, progress, AI, etc.)
  types/         Type definitions
  __tests__/     32 test cases
```

## License

Private project.
