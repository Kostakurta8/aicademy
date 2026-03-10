'use client'

import { useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useProgressStore } from '@/stores/progress-store'
import {
  Wand2, BookOpen, Gamepad2, Star, ChevronRight, Sparkles,
  Code2, Layers, Brain, Target, Zap, Shield, Lightbulb,
  GraduationCap, Trophy, CheckCircle, Copy, Check,
  Wrench, ChevronDown, ChevronUp, Flame, Award,
  Swords, Languages, Crosshair, Stethoscope,
} from 'lucide-react'

// ── Mastery System ───────────────────────────────────────────────────

const masteryLevels = [
  { name: 'Novice', min: 0, emoji: '🌱', color: 'text-green', bg: 'bg-green/10' },
  { name: 'Apprentice', min: 3, emoji: '📖', color: 'text-blue', bg: 'bg-blue/10' },
  { name: 'Journeyman', min: 5, emoji: '⚔️', color: 'text-gold', bg: 'bg-gold/10' },
  { name: 'Expert', min: 7, emoji: '🧙', color: 'text-purple', bg: 'bg-purple/10' },
  { name: 'Master', min: 8, emoji: '👑', color: 'text-accent', bg: 'bg-accent/10' },
]

// ── Lessons ──────────────────────────────────────────────────────────

const lessons = [
  { slug: 'understanding-claude', title: 'Understanding Claude', description: 'How Claude Opus 4.6 thinks — architecture, context windows, and what sets it apart.', icon: Brain, color: 'from-purple-500 to-violet-600', xp: 150, difficulty: 'Beginner', duration: '8 min', topics: ['Architecture', 'Context Windows', 'Capabilities'], steps: 3 },
  { slug: 'system-prompts', title: 'System Prompts & Roles', description: 'Master the system prompt — set persona, constraints, and behavior before the conversation begins.', icon: Shield, color: 'from-blue-500 to-cyan-600', xp: 180, difficulty: 'Beginner', duration: '10 min', topics: ['System Messages', 'Role Setting', 'Persona Design'], steps: 3 },
  { slug: 'xml-structure', title: 'XML Tags & Structure', description: "Claude's secret superpower — use XML tags to organize inputs and get precise outputs.", icon: Code2, color: 'from-emerald-500 to-green-600', xp: 200, difficulty: 'Intermediate', duration: '12 min', topics: ['XML Formatting', 'Tag Conventions', 'Structured Input'], steps: 4 },
  { slug: 'chain-of-thought', title: 'Chain of Thought', description: "Unlock Claude's deepest reasoning — extended thinking, step-by-step logic, and self-reflection.", icon: Layers, color: 'from-amber-500 to-orange-600', xp: 220, difficulty: 'Intermediate', duration: '15 min', topics: ['Extended Thinking', 'Step-by-Step', 'Reasoning Chains'], steps: 3 },
  { slug: 'few-shot-learning', title: 'Few-Shot & Examples', description: 'Teach Claude by showing, not telling. Master few-shot prompting with carefully crafted examples.', icon: Lightbulb, color: 'from-pink-500 to-rose-600', xp: 200, difficulty: 'Intermediate', duration: '12 min', topics: ['Few-Shot', 'Example Design', 'Pattern Matching'], steps: 3 },
  { slug: 'output-control', title: 'Output Control', description: 'Make Claude output exactly what you need — JSON, markdown, tables, or any structured format.', icon: Target, color: 'from-cyan-500 to-teal-600', xp: 180, difficulty: 'Intermediate', duration: '10 min', topics: ['Format Spec', 'Length Control', 'Structured Output'], steps: 3 },
  { slug: 'advanced-techniques', title: 'Advanced Techniques', description: 'Meta-prompting, self-correction loops, multi-turn strategies, and persona chaining.', icon: Zap, color: 'from-red-500 to-pink-600', xp: 250, difficulty: 'Advanced', duration: '18 min', topics: ['Meta-Prompting', 'Self-Correction', 'Multi-Turn'], steps: 4 },
  { slug: 'common-mistakes', title: 'Anti-Patterns & Pitfalls', description: 'The top 8 prompting mistakes and how to fix them — with before/after examples.', icon: Shield, color: 'from-slate-500 to-gray-600', xp: 160, difficulty: 'Beginner', duration: '10 min', topics: ['Common Mistakes', 'Vague Prompts', 'Recovery'], steps: 2 },
]

// ── Games ─────────────────────────────────────────────────────────────

const promptGames = [
  { slug: 'prompt-architect', title: 'Prompt Architect', description: 'Build optimal prompts block by block — pick the right components for each scenario.', icon: Wand2, color: 'from-violet-500 to-purple-600', xp: 200, difficulty: 'Medium', tag: '🏗️ Builder', playTime: '8 min' },
  { slug: 'prompt-doctor', title: 'Prompt Doctor', description: "Diagnose broken prompts! Find what's wrong, prescribe the fix, and see the transformation.", icon: Stethoscope, color: 'from-emerald-500 to-teal-600', xp: 180, difficulty: 'Medium', tag: '🩺 Diagnose', playTime: '6 min' },
  { slug: 'prompt-dojo', title: 'Prompt Dojo', description: 'Write your own prompts and get graded on 8 dimensions — clarity, structure, constraints, and more.', icon: Swords, color: 'from-orange-500 to-red-600', xp: 250, difficulty: 'Hard', tag: '🥋 Write', playTime: '10 min' },
  { slug: 'prompt-translator', title: 'Prompt Translator', description: 'Turn messy boss instructions into perfect structured Claude prompts. Speed matters!', icon: Languages, color: 'from-blue-500 to-indigo-600', xp: 180, difficulty: 'Medium', tag: '🔄 Translate', playTime: '6 min' },
  { slug: 'hint-master', title: 'Hint Master', description: 'Broken prompts need ONE strategic fix. Can you spot the single best change?', icon: Crosshair, color: 'from-pink-500 to-rose-600', xp: 160, difficulty: 'Easy', tag: '🎯 Spot', playTime: '5 min' },
]

// ── Prompt Patterns (Toolkit) ────────────────────────────────────────

interface PromptPattern {
  id: string; name: string; emoji: string; difficulty: string
  description: string; useCases: string[]; template: string; tips: string[]
}

const promptPatterns: PromptPattern[] = [
  {
    id: 'classification', name: 'Classification', emoji: '🏷️', difficulty: 'Beginner',
    description: 'Categorize inputs into predefined labels with confidence scores.',
    useCases: ['Support tickets', 'Email routing', 'Content moderation', 'Sentiment analysis'],
    template: `<instructions>
Classify the [input_type] into one of: [categories]
Assign a confidence score (0.0 - 1.0).
</instructions>

<examples>
<example>
Input: "[example input]"
Output: {"category": "billing", "confidence": 0.92}
</example>
</examples>

<input>[data here]</input>

<output_format>
{"category": "string", "confidence": 0.0-1.0, "reasoning": "string"}
</output_format>`,
    tips: ['Always provide 2-3 examples', 'Define all categories upfront', 'Include confidence scores', 'Add an "other" category for edge cases'],
  },
  {
    id: 'extraction', name: 'Extraction', emoji: '🔬', difficulty: 'Beginner',
    description: 'Pull specific structured information from unstructured text.',
    useCases: ['Resume parsing', 'Invoice data', 'Entity recognition', 'Key facts'],
    template: `<instructions>
Extract the following fields from the document:
- [field 1]: [description]
- [field 2]: [description]
- [field 3]: [description]
If a field is not found, use null.
</instructions>

<document>[text here]</document>

<output_format>
{"field1": "value", "field2": "value", "field3": "value"}
</output_format>`,
    tips: ['List every field you need', 'Specify null handling for missing fields', 'Define data types (string, number, date)', 'Use examples for ambiguous fields'],
  },
  {
    id: 'summarization', name: 'Summarization', emoji: '📝', difficulty: 'Beginner',
    description: 'Condense content into key points with controlled length and focus.',
    useCases: ['Article summaries', 'Meeting notes', 'Report digests', 'Paper reviews'],
    template: `<instructions>
Summarize the document below in exactly [N] bullet points.
Focus on: [key aspects]
Audience: [target audience]
</instructions>

<document>[text here]</document>

<constraints>
- Maximum [N] words total
- No jargon or technical terms
- Include key statistics if present
</constraints>`,
    tips: ['Specify exact word/bullet count', 'Define the target audience', 'List which aspects to prioritize', 'Add constraints for tone and jargon'],
  },
  {
    id: 'code-review', name: 'Code Review', emoji: '🔍', difficulty: 'Intermediate',
    description: 'Analyze code for bugs, security vulnerabilities, and style issues.',
    useCases: ['PR reviews', 'Security audits', 'Style enforcement', 'Performance checks'],
    template: `You are a senior [language] developer with security expertise.

Review this code for:
1. Bugs and logic errors
2. Security vulnerabilities (injection, XSS, auth)
3. Performance issues
4. Style and readability

<code>
[code here]
</code>

<output_format>
| # | Issue | Severity | Line | Suggested Fix |
|---|-------|----------|------|---------------|
</output_format>`,
    tips: ['Specify the language and framework', 'List review dimensions explicitly', 'Set a persona (senior dev, security expert)', 'Request severity ratings for prioritization'],
  },
  {
    id: 'content-gen', name: 'Content Generation', emoji: '✍️', difficulty: 'Intermediate',
    description: 'Create original content matching specific voice, tone, and structure.',
    useCases: ['Blog posts', 'Marketing copy', 'Documentation', 'Social media'],
    template: `You are a [role] writing for [audience].

<instructions>
Write a [content type] about [topic].
Length: [N] words
Tone: [tone]
</instructions>

<brand_guide>
Voice: [voice description]
Keywords to include: [keyword1], [keyword2]
</brand_guide>

<output_format>
## [Title]
[Hook paragraph]
[Body with subheadings]
[Call to action]
</output_format>`,
    tips: ['Define persona and audience', 'Specify length, tone, and structure', 'Include brand voice guidelines', 'Add keywords for SEO if needed'],
  },
  {
    id: 'analysis', name: 'Deep Analysis', emoji: '📊', difficulty: 'Intermediate',
    description: 'Thorough analysis with structured reasoning across multiple dimensions.',
    useCases: ['Market research', 'Competitor analysis', 'Data interpretation', 'Risk assessment'],
    template: `<context>
[background information and data]
</context>

<instructions>
Analyze [subject] across these dimensions:
1. [dimension 1]
2. [dimension 2]
3. [dimension 3]
</instructions>

<reasoning>
Think step by step through each dimension before concluding.
</reasoning>

<output_format>
## Findings
## Evidence
## Recommendations (ranked by impact)
</output_format>`,
    tips: ['Use chain-of-thought for complex analysis', 'Define specific dimensions to evaluate', 'Request evidence for each finding', 'Ask for ranked recommendations'],
  },
  {
    id: 'data-transform', name: 'Data Transformation', emoji: '🔄', difficulty: 'Advanced',
    description: 'Convert data between formats with specific transformation rules.',
    useCases: ['Format conversion', 'Data cleaning', 'Schema migration', 'ETL pipelines'],
    template: `<instructions>
Transform the input data from [format A] to [format B].
Apply these rules:
1. [rule 1]
2. [rule 2]
3. [rule 3]
</instructions>

<example>
Input: [sample input]
Output: [expected output]
</example>

<input_data>
[actual data]
</input_data>`,
    tips: ['Show input/output examples', 'Define every transformation rule', 'Specify how to handle edge cases (nulls, malformed data)', 'Request a summary of changes made'],
  },
  {
    id: 'multi-step', name: 'Multi-Step Reasoning', emoji: '🧠', difficulty: 'Advanced',
    description: 'Complex problems requiring structured, step-by-step reasoning with synthesis.',
    useCases: ['Decision making', 'Strategy planning', 'Complex debugging', 'Research synthesis'],
    template: `<problem>
[detailed problem description]
</problem>

<reasoning_steps>
Think through this systematically:
1. First, identify [aspect 1]
2. Then, evaluate [aspect 2]
3. Consider trade-offs between [X] and [Y]
4. Synthesize into a final recommendation
</reasoning_steps>

<constraints>
[boundaries and limitations]
</constraints>

<output_format>
## Analysis
[step-by-step reasoning]
## Verdict
[clear recommendation with confidence level]
</output_format>`,
    tips: ['Break complex problems into numbered steps', 'Ask Claude to show reasoning before concluding', 'Include constraints and trade-offs', 'Request confidence levels on conclusions'],
  },
  {
    id: 'codebase-analyzer', name: 'Codebase Analyzer', emoji: '🔬', difficulty: 'Advanced',
    description: 'Systematically analyze an entire codebase — every folder, file, and line of code — for a comprehensive audit.',
    useCases: ['Full codebase audit', 'Architecture review', 'Tech debt assessment', 'Onboarding to new projects'],
    template: `You are a principal software engineer performing the most thorough codebase analysis ever conducted.

<project>
Repository: [repo name]
Stack: [languages, frameworks, tools]
Entry point: [main file or directory]
</project>

<instructions>
Perform a COMPLETE, EXHAUSTIVE analysis of this codebase. Go through EVERY folder, EVERY file, and EVERY line of code systematically.

Phase 1 — Structure & Architecture:
- Map the full directory tree with purpose of each folder
- Identify the architecture pattern (MVC, microservices, monolith, etc.)
- Document entry points, routing, and request flow
- List all external dependencies and their versions

Phase 2 — File-by-File Deep Dive:
For EACH file in the codebase:
- State the file path and purpose
- List all exports (functions, classes, types, constants)
- Identify dependencies (imports) and dependents (what imports this)
- Flag any issues: bugs, anti-patterns, security risks, dead code
- Rate complexity (Low / Medium / High)

Phase 3 — Cross-Cutting Concerns:
- Error handling patterns and gaps
- State management approach and data flow
- Authentication & authorization implementation
- API contracts and data validation
- Test coverage and testing strategy
- Performance bottlenecks and optimization opportunities
- Security vulnerabilities (OWASP Top 10)
- Accessibility compliance

Phase 4 — Quality Assessment:
- Code duplication and DRY violations
- Naming conventions and consistency
- Type safety coverage
- Documentation completeness
- Configuration management
- Environment handling

Phase 5 — Actionable Report:
- Critical issues (fix immediately)
- High-priority improvements (fix this sprint)
- Medium-priority tech debt (plan for next quarter)
- Low-priority suggestions (nice to have)
- Architecture recommendations
</instructions>

<output_format>
# Codebase Analysis Report

## Executive Summary
[2-3 sentence overview with health score: A/B/C/D/F]

## Architecture Map
[Directory tree with annotations]

## File-by-File Analysis
### [folder/file.ext]
- **Purpose:** [what it does]
- **Exports:** [list]
- **Issues:** [any problems found]
- **Complexity:** [Low/Medium/High]
(repeat for every file)

## Cross-Cutting Concerns
[findings organized by category]

## Issue Registry
| # | Severity | File | Line | Issue | Suggested Fix |
|---|----------|------|------|-------|---------------|

## Recommendations
[prioritized action items]
</output_format>`,
    tips: [
      'Feed files in batches if the codebase is large — start with the entry point and config files',
      'Ask the AI to output a directory tree first, then analyze each branch',
      'For massive codebases, split by module/package and run separate analyses',
      'Combine with grep/search results to give the AI full context on imports and dependencies',
      'Follow up with "What did you miss?" to catch blind spots',
    ],
  },
]

// ── Daily Tips ───────────────────────────────────────────────────────

const dailyTips = [
  { emoji: '📐', tip: 'Start every complex prompt with XML tags to separate instructions from context — Claude is trained to recognize them.' },
  { emoji: '🎯', tip: 'Replace "write about X" with "write a 300-word analysis of X targeting senior developers." Specificity wins.' },
  { emoji: '💡', tip: '2-3 few-shot examples teach Claude more than a paragraph of explanation. Show, don\'t tell.' },
  { emoji: '🛡️', tip: 'Your system prompt is the most powerful tool — it sets behavioral rules that persist through the entire conversation.' },
  { emoji: '⛔', tip: 'Add constraints early: "Maximum 200 words. No jargon. Only cite provided sources." Guardrails prevent drift.' },
  { emoji: '🧠', tip: '"Think step by step before answering" activates chain-of-thought reasoning and catches errors.' },
  { emoji: '📋', tip: 'Always specify output format explicitly. "Return JSON: {key: type}" beats "give me structured data."' },
  { emoji: '🔄', tip: 'Ask Claude to review its own output: "Check your response for errors, then output the corrected version."' },
  { emoji: '🎭', tip: 'Personas work: "You are a senior security engineer" produces better code reviews than no role.' },
  { emoji: '✂️', tip: 'One task per prompt. Splitting "summarize + translate + analyze" into 3 prompts gives better results.' },
]

// ── Helpers ──────────────────────────────────────────────────────────

const difficultyColor: Record<string, string> = {
  Beginner: 'bg-green/10 text-green border-green/20',
  Intermediate: 'bg-gold/10 text-gold border-gold/20',
  Advanced: 'bg-red/10 text-red border-red/20',
  Easy: 'bg-green/10 text-green border-green/20',
  Medium: 'bg-gold/10 text-gold border-gold/20',
  Hard: 'bg-red/10 text-red border-red/20',
}

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
                                {p.tips.map((tip, i) => (
                                  <p key={i} className="text-xs text-text-muted flex gap-2"><span className="text-accent shrink-0">💡</span> {tip}</p>
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
