import { describe, it, expect } from 'vitest'
import type { AIModel, Difficulty, GameSlug, ModuleSlug, MissionId, ChallengeId } from '@/types'

describe('type definitions', () => {
  it('AIModel accepts valid values', () => {
    const model: AIModel = 'llama-3.1-8b-instant'
    expect(model).toBe('llama-3.1-8b-instant')
  })

  it('Difficulty accepts valid values', () => {
    const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard']
    expect(difficulties).toHaveLength(3)
  })

  it('GameSlug accepts valid values', () => {
    const slug: GameSlug = 'token-tetris'
    expect(slug).toBe('token-tetris')
  })

  it('ModuleSlug accepts valid values', () => {
    const slug: ModuleSlug = 'foundations'
    expect(slug).toBe('foundations')
  })

  it('MissionId accepts valid values', () => {
    const id: MissionId = 'tourist-guide'
    expect(id).toBe('tourist-guide')
  })

  it('ChallengeId accepts static and daily pattern', () => {
    const static_id: ChallengeId = 'prompt-dojo'
    const daily_id: ChallengeId = `daily-2025-6-15`
    expect(static_id).toBe('prompt-dojo')
    expect(daily_id).toBe('daily-2025-6-15')
  })
})
