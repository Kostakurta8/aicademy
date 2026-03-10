import {
  Brain, Shield, Code2, Layers, Lightbulb, Target, Zap,
  Wand2, Stethoscope, Swords, Languages, Crosshair,
} from 'lucide-react'

// ── Mastery System ───────────────────────────────────────────────────

export const masteryLevels = [
  { name: 'Novice', min: 0, emoji: '🌱', color: 'text-green', bg: 'bg-green/10' },
  { name: 'Apprentice', min: 3, emoji: '📖', color: 'text-blue', bg: 'bg-blue/10' },
  { name: 'Journeyman', min: 5, emoji: '⚔️', color: 'text-gold', bg: 'bg-gold/10' },
  { name: 'Expert', min: 7, emoji: '🧙', color: 'text-purple', bg: 'bg-purple/10' },
  { name: 'Master', min: 8, emoji: '👑', color: 'text-accent', bg: 'bg-accent/10' },
]

// ── Lessons ──────────────────────────────────────────────────────────

export const lessons = [
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

export const promptGames = [
  { slug: 'prompt-architect', title: 'Prompt Architect', description: 'Build optimal prompts block by block — pick the right components for each scenario.', icon: Wand2, color: 'from-violet-500 to-purple-600', xp: 200, difficulty: 'Medium', tag: '🏗️ Builder', playTime: '8 min' },
  { slug: 'prompt-doctor', title: 'Prompt Doctor', description: "Diagnose broken prompts! Find what's wrong, prescribe the fix, and see the transformation.", icon: Stethoscope, color: 'from-emerald-500 to-teal-600', xp: 180, difficulty: 'Medium', tag: '🩺 Diagnose', playTime: '6 min' },
  { slug: 'prompt-dojo', title: 'Prompt Dojo', description: 'Write your own prompts and get graded on 8 dimensions — clarity, structure, constraints, and more.', icon: Swords, color: 'from-orange-500 to-red-600', xp: 250, difficulty: 'Hard', tag: '🥋 Write', playTime: '10 min' },
  { slug: 'prompt-translator', title: 'Prompt Translator', description: 'Turn messy boss instructions into perfect structured Claude prompts. Speed matters!', icon: Languages, color: 'from-blue-500 to-indigo-600', xp: 180, difficulty: 'Medium', tag: '🔄 Translate', playTime: '6 min' },
  { slug: 'hint-master', title: 'Hint Master', description: 'Broken prompts need ONE strategic fix. Can you spot the single best change?', icon: Crosshair, color: 'from-pink-500 to-rose-600', xp: 160, difficulty: 'Easy', tag: '🎯 Spot', playTime: '5 min' },
]

// ── Prompt Patterns (Toolkit) ────────────────────────────────────────

export interface PromptPattern {
  id: string; name: string; emoji: string; difficulty: string
  description: string; useCases: string[]; template: string; tips: string[]
}

export const promptPatterns: PromptPattern[] = [
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

export const dailyTips = [
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

export const difficultyColor: Record<string, string> = {
  Beginner: 'bg-green/10 text-green border-green/20',
  Intermediate: 'bg-gold/10 text-gold border-gold/20',
  Advanced: 'bg-red/10 text-red border-red/20',
  Easy: 'bg-green/10 text-green border-green/20',
  Medium: 'bg-gold/10 text-gold border-gold/20',
  Hard: 'bg-red/10 text-red border-red/20',
}
