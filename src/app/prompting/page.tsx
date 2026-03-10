'use client'

import { useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import { useProgressStore } from '@/stores/progress-store'
import {
  Wand2, BookOpen, Gamepad2, Star, ChevronRight, Sparkles,
  GraduationCap, Copy, Check,
  Wrench, ChevronDown, ChevronUp, Award,
} from 'lucide-react'
import {
  masteryLevels, lessons, promptGames, promptPatterns,
  dailyTips, difficultyColor,
} from '@/data/prompting'

type Tab = 'lessons' | 'games' | 'toolkit' | 'reference'

// ── Component ────────────────────────────────────────────────────────

export default function PromptingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('lessons')
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const moduleProgress = useProgressStore((s) => s.moduleProgress)
  const completedChallenges = useProgressStore((s) => s.completedChallenges)

  const completedLessons = moduleProgress['prompting']?.completedLessons || []
  const progress = Math.round((completedLessons.length / lessons.length) * 100)
  const gamesCompleted = promptGames.filter(g => completedChallenges.includes(g.slug)).length

  const currentMastery = [...masteryLevels].reverse().find(l => completedLessons.length >= l.min) || masteryLevels[0]
  const nextMastery = masteryLevels.find(l => l.min > completedLessons.length)

  const dayIndex = new Date().getDate() % dailyTips.length
  const todayTip = dailyTips[dayIndex]

  const copyTemplate = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const tabs = [
    { id: 'lessons' as const, label: 'Lessons', icon: BookOpen, count: lessons.length },
    { id: 'games' as const, label: 'Games', icon: Gamepad2, count: promptGames.length },
    { id: 'toolkit' as const, label: 'Toolkit', icon: Wrench, count: promptPatterns.length },
    { id: 'reference' as const, label: 'Reference', icon: Sparkles },
  ]

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* ── Hero ── */}
      <div className="animate-fade-in mb-6 text-center">
        <div className="animate-bounce-in w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-violet-500 via-purple to-pink flex items-center justify-center shadow-lg shadow-purple/20 relative">
          <Wand2 size={40} className="text-white" />
          <div className="animate-float absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500 via-purple to-pink" />
        </div>
        <h1 className="text-4xl font-bold text-text-primary mb-2">
          Prompt <span className="bg-gradient-to-r from-violet-400 via-purple to-pink bg-clip-text text-transparent">Mastery</span>
        </h1>
        <p className="text-text-secondary max-w-xl mx-auto mb-4">
          Master the art of prompting Claude Opus 4.6 — from basics to advanced techniques.
        </p>

        {/* Mastery Badge */}
        <div className={`animate-bounce-in inline-flex items-center gap-2 px-4 py-2 rounded-full ${currentMastery.bg} border border-current/10 mb-5`}
          style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
          <span className="text-lg">{currentMastery.emoji}</span>
          <span className={`font-bold text-sm ${currentMastery.color}`}>{currentMastery.name}</span>
          {nextMastery && (
            <span className="text-[10px] text-text-muted ml-1">
              → {nextMastery.emoji} {nextMastery.name} ({nextMastery.min - completedLessons.length} more)
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="animate-fade-in flex items-center justify-center gap-6 flex-wrap"
          style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
          {[
            { icon: GraduationCap, label: 'Lessons', value: `${completedLessons.length}/${lessons.length}`, color: 'text-blue' },
            { icon: Gamepad2, label: 'Games', value: `${gamesCompleted}/${promptGames.length}`, color: 'text-green' },
            { icon: Award, label: 'Mastery', value: currentMastery.name, color: currentMastery.color },
            { icon: Star, label: 'Total XP', value: `${lessons.reduce((a, l) => a + l.xp, 0) + promptGames.reduce((a, g) => a + g.xp, 0)}`, color: 'text-gold' },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center">
                <stat.icon size={16} className={stat.color} />
              </div>
              <div className="text-left">
                <p className="font-bold text-text-primary text-xs">{stat.value}</p>
                <p className="text-[10px] text-text-muted">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="max-w-xs mx-auto mt-4">
          <div className="h-2 rounded-full bg-border-subtle overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-purple to-pink transition-all duration-700"
              style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[10px] text-text-muted mt-1">{progress}% complete</p>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-raised mb-8 max-w-xl mx-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.id ? 'bg-accent text-white shadow-md' : 'text-text-secondary hover:text-text-primary'
            }`}>
            <tab.icon size={15} />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-surface'}`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
        {/* ── Lessons Tab ── */}
        {activeTab === 'lessons' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {lessons.map((lesson, idx) => {
                const done = completedLessons.includes(lesson.slug)
                return (
                  <div key={lesson.slug} className="animate-fade-in" style={{ animationDelay: `${idx * 0.04}s`, animationFillMode: 'both' }}>
                    <Link href={`/prompting/${lesson.slug}`}>
                      <Card className="h-full group cursor-pointer relative overflow-hidden" padding="md">
                        {done && <div className="absolute top-0 right-0 w-16 h-16"><div className="absolute top-2 right-[-20px] bg-green text-white text-[8px] font-bold py-0.5 px-6 rotate-45">DONE</div></div>}
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${lesson.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                            <lesson.icon size={24} className="text-white" />
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyColor[lesson.difficulty]}`}>{lesson.difficulty}</span>
                            <span className="text-[10px] text-text-muted">{lesson.steps} steps</span>
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-text-primary mb-1 group-hover:text-accent transition-colors">{lesson.title}</h3>
                        <p className="text-xs text-text-secondary mb-3 leading-relaxed">{lesson.description}</p>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {lesson.topics.map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-surface-raised text-text-muted">{t}</span>)}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-xs text-gold font-medium"><Star size={10} /> {lesson.xp} XP</span>
                            <span className="text-[10px] text-text-muted">~{lesson.duration}</span>
                          </div>
                          <div className="text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all"><ChevronRight size={16} /></div>
                        </div>
                      </Card>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Games Tab ── */}
        {activeTab === 'games' && (
          <div className="animate-fade-in">
            <div className="max-w-4xl mx-auto">
              {/* Daily Tip */}
              <div className="animate-fade-in mb-6">
                <Card padding="md" className="border-l-4 border-l-accent">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{todayTip.emoji}</span>
                    <div>
                      <p className="text-[10px] font-medium text-accent uppercase tracking-wider mb-1">Daily Prompt Tip</p>
                      <p className="text-sm text-text-secondary leading-relaxed">{todayTip.tip}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Game progress bar */}
              <div className="flex items-center gap-3 mb-4">
                <p className="text-xs text-text-muted">{gamesCompleted}/{promptGames.length} games completed</p>
                <div className="flex-1 h-1.5 rounded-full bg-border-subtle overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent to-pink transition-all" style={{ width: `${(gamesCompleted / promptGames.length) * 100}%` }} />
                </div>
              </div>

              {/* Games Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {promptGames.map((game, idx) => {
                  const done = completedChallenges.includes(game.slug)
                  return (
                    <div key={game.slug} className="animate-fade-in" style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'both' }}>
                      <Link href={`/prompting/${game.slug}`}>
                        <Card className="h-full group cursor-pointer relative overflow-hidden" padding="md">
                          {done && <div className="absolute top-0 right-0 w-16 h-16"><div className="absolute top-2 right-[-20px] bg-green text-white text-[8px] font-bold py-0.5 px-6 rotate-45">DONE</div></div>}
                          <div className="flex items-start justify-between mb-3">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                              <game.icon size={24} className="text-white" />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-raised text-text-muted">{game.tag}</span>
                              <span className="text-[10px] text-text-muted">~{game.playTime}</span>
                            </div>
                          </div>
                          <h3 className="text-base font-bold text-text-primary mb-1 group-hover:text-accent transition-colors">{game.title}</h3>
                          <p className="text-xs text-text-secondary mb-3 leading-relaxed">{game.description}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyColor[game.difficulty]}`}>{game.difficulty}</span>
                              <span className="flex items-center gap-1 text-xs text-gold font-medium"><Star size={10} /> {game.xp}</span>
                            </div>
                            <div className="text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all"><ChevronRight size={16} /></div>
                          </div>
                        </Card>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Toolkit Tab ── */}
        {activeTab === 'toolkit' && (
          <div className="animate-fade-in">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-text-primary mb-1">Prompt Pattern Library</h2>
                <p className="text-sm text-text-secondary">Reusable templates for common prompting tasks — click to expand, copy to use</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promptPatterns.map((p, idx) => (
                  <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.04}s`, animationFillMode: 'both' }}>
                    <Card padding="md" className="overflow-hidden">
                      <button onClick={() => setExpandedPattern(expandedPattern === p.id ? null : p.id)}
                        className="w-full text-left flex items-center gap-3 cursor-pointer">
                        <span className="text-2xl shrink-0">{p.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-text-primary text-sm">{p.name}</h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${difficultyColor[p.difficulty]}`}>{p.difficulty}</span>
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5 truncate">{p.description}</p>
                        </div>
                        {expandedPattern === p.id ? <ChevronUp size={16} className="text-text-muted shrink-0" /> : <ChevronDown size={16} className="text-text-muted shrink-0" />}
                      </button>
                        {expandedPattern === p.id && (
                          <div className="animate-fade-in overflow-hidden">
                            <div className="border-t border-border-subtle mt-3 pt-3">
                              <div className="flex flex-wrap gap-1 mb-3">
                                {p.useCases.map(u => <span key={u} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">{u}</span>)}
                              </div>
                              <div className="relative">
                                <button onClick={() => copyTemplate(p.id, p.template)}
                                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-surface hover:bg-border-subtle transition-colors cursor-pointer z-10">
                                  {copiedId === p.id ? <Check size={14} className="text-green" /> : <Copy size={14} className="text-text-muted" />}
                                </button>
                                <pre className="text-xs bg-surface-raised rounded-xl p-4 pr-10 text-text-secondary overflow-x-auto whitespace-pre-wrap font-mono border border-border-subtle leading-relaxed">{p.template}</pre>
                              </div>
                              <div className="mt-3 space-y-1">
                                {p.tips.map((tip) => (
                                  <p key={tip} className="text-xs text-text-muted flex gap-2"><span className="text-accent shrink-0">💡</span> {tip}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Reference Tab ── */}
        {activeTab === 'reference' && (
          <div className="animate-fade-in">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-text-primary mb-1">Claude Opus 4.6 Cheat Sheet</h2>
                <p className="text-sm text-text-secondary">Quick reference for crafting better prompts</p>
              </div>

              {[
                {
                  title: '📐 Structure Your Prompt',
                  tips: [
                    { label: 'System Prompt', desc: 'Set role, constraints, and personality first', code: 'You are an expert data analyst. Always cite sources. Be concise.' },
                    { label: 'XML Tags', desc: 'Wrap different sections in tags for clarity', code: '<context>...</context>\n<instructions>...</instructions>\n<output_format>...</output_format>' },
                    { label: 'Few-Shot Examples', desc: 'Show 2-3 examples of desired output', code: '<example>\nInput: "hello world"\nOutput: {"greeting": "hello", "subject": "world"}\n</example>' },
                  ],
                },
                {
                  title: '🧠 Leverage Reasoning',
                  tips: [
                    { label: 'Think Step-by-Step', desc: 'Activate chain-of-thought for complex tasks', code: 'Think through this step by step before giving your answer.' },
                    { label: 'Extended Thinking', desc: 'For complex tasks, allow deep reasoning', code: 'Take your time to analyze all aspects. Show your reasoning process.' },
                    { label: 'Self-Correction', desc: 'Ask Claude to verify its own work', code: 'After answering, review your response for errors and correct them.' },
                    { label: 'Perspective Prompting', desc: 'Consider multiple viewpoints', code: 'Analyze from 3 perspectives:\n1. As a CTO\n2. As a customer\n3. As a competitor' },
                  ],
                },
                {
                  title: '🎯 Control Output',
                  tips: [
                    { label: 'JSON Schema', desc: 'Be explicit about the format you want', code: 'Respond in JSON: {"title": "string", "tags": ["string"], "score": 0.0-1.0}' },
                    { label: 'Length Limits', desc: 'Specify word/line counts', code: 'Keep response under 200 words. Use exactly 3 bullet points.' },
                    { label: 'Exclusion Rules', desc: 'Tell Claude what NOT to include', code: 'Do NOT include disclaimers, caveats, or text outside the JSON.' },
                    { label: 'Tone Control', desc: 'Set the communication style', code: 'Write as if explaining to a sharp 12-year-old. No jargon.' },
                  ],
                },
                {
                  title: '🔄 Advanced Patterns',
                  tips: [
                    { label: 'Meta-Prompting', desc: 'Ask Claude to write prompts for itself', code: 'Write a detailed prompt I could use to classify customer tickets. Include system message, examples, and output format.' },
                    { label: 'Persona Chaining', desc: 'Multiple roles in sequence', code: 'First as a critic: find 3 flaws.\nThen as an optimist: find 3 strengths.\nFinally as a strategist: synthesize.' },
                    { label: 'Progressive Refinement', desc: 'Build up in multi-turn conversations', code: 'Turn 1: "Write a draft"\nTurn 2: "Make the intro punchier"\nTurn 3: "Add statistics to paragraph 2"' },
                  ],
                },
                {
                  title: '⚠️ Common Mistakes',
                  tips: [
                    { label: 'Too Vague', desc: '"Write something about AI" → No direction', code: '❌ Write about AI\n✅ Write a 500-word post explaining transformer attention for ML-curious engineers.' },
                    { label: 'Overloading', desc: "Don't cram 10 tasks in 1 prompt", code: '❌ Summarize, translate, format, and analyze...\n✅ Focus on one task per prompt, or use numbered steps.' },
                    { label: 'Emotional Manipulation', desc: 'Clear instructions beat pleading', code: '❌ PLEASE try REALLY hard!!! I\'ll tip $1000!!!\n✅ Follow these specific criteria: [criteria]' },
                    { label: 'Missing Context', desc: "Claude can't read your mind", code: '❌ Fix this code\n✅ Fix this Python function that should return the mean but crashes on empty input: [code]' },
                  ],
                },
                {
                  title: '⚡ Power Moves',
                  tips: [
                    { label: 'Prefill', desc: 'Start Claude\'s response for guaranteed format', code: 'Start your response with: ```json\\n{' },
                    { label: 'Negative Instructions', desc: 'Sometimes "don\'t" is clearer than "do"', code: 'Do NOT:\n- Make assumptions about missing data\n- Use technical jargon\n- Include disclaimers' },
                    { label: 'Confidence Scores', desc: 'Ask Claude to rate its own certainty', code: 'Rate your confidence in this answer (0.0-1.0) and explain why.' },
                  ],
                },
              ].map((section, idx) => (
                <div key={section.title} className="animate-fade-in" style={{ animationDelay: `${idx * 0.06}s`, animationFillMode: 'both' }}>
                  <Card padding="lg">
                    <h3 className="text-lg font-bold text-text-primary mb-4">{section.title}</h3>
                    <div className="space-y-4">
                      {section.tips.map(tip => (
                        <div key={tip.label} className="border-l-2 border-accent/30 pl-4">
                          <p className="text-sm font-semibold text-text-primary">{tip.label}</p>
                          <p className="text-xs text-text-secondary mb-2">{tip.desc}</p>
                          <div className="relative">
                            <button onClick={() => copyTemplate(`ref-${tip.label}`, tip.code)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-md hover:bg-surface transition-colors cursor-pointer">
                              {copiedId === `ref-${tip.label}` ? <Check size={12} className="text-green" /> : <Copy size={12} className="text-text-muted" />}
                            </button>
                            <pre className="text-xs bg-surface-raised rounded-lg p-3 pr-8 text-text-muted overflow-x-auto whitespace-pre-wrap font-mono">{tip.code}</pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  )
}
