// ── Module slugs used across the app ──
export type ModuleSlug =
  | 'foundations'
  | 'prompt-engineering'
  | 'tools-ecosystem'
  | 'building-with-apis'
  | 'ethics'
  | 'real-world-projects'
  | 'image-video-audio'
  | 'agents-automation'
  | 'prompting'

// ── XP source identifiers (superset of ModuleSlug + standalone tools) ──
export type XPSource = ModuleSlug | 'flashcards' | 'playground'

// ── Mission IDs from missions page ──
export type MissionId =
  | 'tourist-guide'
  | 'content-machine'
  | 'code-reviewer'
  | 'debate-champion'
  | 'data-analyst'

// ── Challenge IDs (prompting tools + daily pattern) ──
export type ChallengeId =
  | 'hint-master'
  | 'prompt-doctor'
  | 'prompt-dojo'
  | 'prompt-architect'
  | 'prompt-translator'
  | `daily-${number}-${number}-${number}`

// ── Game slugs matching /games/* routes ──
export type GameSlug =
  | 'prompt-duel'
  | 'token-tetris'
  | 'ai-jeopardy'
  | 'hallucination-hunter'
  | 'prompt-evolution'
  | 'neural-network-builder'
  | 'bias-detective'
  | 'speed-type'
  | 'ai-timeline'
  | 'model-arena'
  | 'ai-escape-room'
  | 'prompt-heist'
  | 'ai-myth-busters'

// ── AI model identifiers allowed by the API ──
export type AIModel =
  | 'llama-3.1-8b-instant'
  | 'llama-3.3-70b-versatile'
  | 'mixtral-8x7b-32768'
  | 'gemma2-9b-it'

// ── Difficulty levels used across games and modules ──
export type Difficulty = 'Easy' | 'Medium' | 'Hard'
