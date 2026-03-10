'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ConfettiBurst, XPPopup, ScreenFlash } from '@/components/ui/GameEffects'
import { useProgressStore } from '@/stores/progress-store'
import { useXPStore } from '@/stores/xp-store'
import { useUserStore } from '@/stores/user-store'
import { playCorrect, playIncorrect, playLevelUp, hapticSuccess } from '@/lib/sounds'
import { celebrate } from '@/lib/celebrate'
import {
  ArrowLeft, ArrowRight, BookOpen, Lightbulb, HelpCircle, ChevronDown, ChevronUp,
  CheckCircle, Star, Trophy, ChevronRight,
} from 'lucide-react'

// ── Reusable Components ──────────────────────────────────────────────

function KeyConcept({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-5">
      <p className="text-sm font-semibold text-accent mb-1">{emoji} {title}</p>
      <div className="text-sm text-text-secondary leading-relaxed">{children}</div>
    </div>
  )
}

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div className="mb-4">
      {label && <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">{label}</p>}
      <pre className="text-xs bg-surface-raised rounded-xl p-4 text-text-secondary overflow-x-auto whitespace-pre-wrap font-mono border border-border-subtle leading-relaxed">{children}</pre>
    </div>
  )
}

function BeforeAfter({ bad, good, badLabel, goodLabel }: { bad: string; good: string; badLabel?: string; goodLabel?: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
      <div>
        <p className="text-xs font-semibold text-red mb-1">❌ {badLabel || 'Before'}</p>
        <pre className="text-xs bg-red/5 border border-red/20 rounded-xl p-3 text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">{bad}</pre>
      </div>
      <div>
        <p className="text-xs font-semibold text-green mb-1">✅ {goodLabel || 'After'}</p>
        <pre className="text-xs bg-green/5 border border-green/20 rounded-xl p-3 text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">{good}</pre>
      </div>
    </div>
  )
}

function DeepDive({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-border-subtle rounded-xl mb-4 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-3 text-sm font-medium text-text-primary hover:bg-surface-raised transition-colors cursor-pointer">
        <span>🔍 {title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div className="animate-fade-in border-t border-border-subtle">
          <div className="p-4 text-sm text-text-secondary leading-relaxed">{children}</div>
        </div>
      )}
    </div>
  )
}

function Quiz({ question, options, correct, explanation }: { question: string; options: string[]; correct: number; explanation: string }) {
  const [selected, setSelected] = useState<number | null>(null)
  const soundEnabled = useUserStore((s) => s.soundEnabled)
  return (
    <div className="mb-5">
      <p className="text-sm font-semibold text-text-primary mb-3">{question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => { setSelected(i); if (soundEnabled) { i === correct ? playCorrect() : playIncorrect() } }}
            disabled={selected !== null}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all cursor-pointer border ${
              selected === null ? 'bg-surface-raised border-border-subtle hover:border-accent/40 text-text-primary' :
              i === correct ? 'bg-green/10 border-green/30 text-green' :
              i === selected ? 'bg-red/10 border-red/30 text-red' :
              'bg-surface-raised border-border-subtle text-text-muted opacity-50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {selected !== null && (
        <div className={`animate-fade-in mt-3 p-3 rounded-xl text-sm ${selected === correct ? 'bg-green/10 text-green' : 'bg-red/10 text-red'}`}>
          <p className="font-semibold mb-1">{selected === correct ? '🎉 Correct!' : '❌ Not quite!'}</p>
          <p className="text-text-secondary text-xs">{explanation}</p>
        </div>
      )}
    </div>
  )
}

function TryItPrompt({ instruction, placeholder, hint }: { instruction: string; placeholder: string; hint: string }) {
  const [value, setValue] = useState('')
  const [showHint, setShowHint] = useState(false)
  return (
    <div className="mb-5 p-4 rounded-xl bg-purple/5 border border-purple/20">
      <p className="text-sm font-semibold text-purple mb-2">✏️ Try It Yourself</p>
      <p className="text-sm text-text-secondary mb-3">{instruction}</p>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface border border-border-subtle rounded-xl p-3 text-sm text-text-primary placeholder:text-text-muted resize-none min-h-[100px] focus:outline-none focus:border-accent/50"
        rows={4}
      />
      <div className="flex items-center justify-between mt-2">
        <button onClick={() => setShowHint(!showHint)} className="text-xs text-accent hover:underline cursor-pointer">
          {showHint ? 'Hide hint' : '💡 Need a hint?'}
        </button>
        <span className="text-[10px] text-text-muted">{value.length} chars</span>
      </div>
      {showHint && (
        <p className="animate-fade-in mt-2 text-xs text-text-muted italic bg-surface-raised rounded-lg p-2">
          {hint}
        </p>
      )}
    </div>
  )
}

// ── Lesson Content Data ──────────────────────────────────────────────

const layerConfig = {
  read: { icon: BookOpen, label: 'Read', color: 'text-blue' },
  apply: { icon: Lightbulb, label: 'Apply', color: 'text-green' },
  reinforce: { icon: HelpCircle, label: 'Reinforce', color: 'text-gold' },
}

interface Step {
  title: string
  layer: 'read' | 'apply' | 'reinforce'
  content: React.ReactNode
}

interface LessonData {
  title: string
  xp: number
  steps: Step[]
}

const lessonContent: Record<string, LessonData> = {
  'understanding-claude': {
    title: 'Understanding Claude',
    xp: 150,
    steps: [
      {
        title: 'What Makes Claude Different?', layer: 'read', content: (
          <div>
            <KeyConcept emoji="🧠" title="Claude Opus 4.6">
              Claude is Anthropic&apos;s most capable AI model. Unlike simple chatbots, Claude can reason through complex problems, follow nuanced instructions, and maintain long, coherent conversations. Understanding how it works helps you prompt it effectively.
            </KeyConcept>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Claude Opus 4.6 is built on a <strong className="text-text-primary">transformer architecture</strong> — the same family as GPT and Gemini — but with key differences in training philosophy. Anthropic focuses on <strong className="text-text-primary">Constitutional AI (CAI)</strong>, meaning Claude is trained to be helpful, harmless, and honest.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mb-2">Key Characteristics:</h4>
            <div className="space-y-2 mb-4">
              {[
                { label: 'Context Window', desc: '200K tokens — about 150,000 words or 500 pages of text in a single conversation' },
                { label: 'Extended Thinking', desc: 'Claude can "think" before responding, showing its reasoning process for complex tasks' },
                { label: 'Instruction Following', desc: 'Exceptionally good at following detailed, multi-part instructions with precision' },
                { label: 'Nuanced Understanding', desc: 'Handles ambiguity, context, and subtle instructions better than most models' },
              ].map(item => (
                <div key={item.label} className="flex gap-3 p-3 rounded-lg bg-surface-raised">
                  <span className="text-accent font-medium text-sm shrink-0">→</span>
                  <div><p className="text-sm font-medium text-text-primary">{item.label}</p><p className="text-xs text-text-secondary">{item.desc}</p></div>
                </div>
              ))}
            </div>
            <DeepDive title="How does Constitutional AI work?">
              <p>Constitutional AI (CAI) is Anthropic&apos;s approach to alignment. Claude is trained in two phases:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-xs">
                <li><strong>Supervised Learning</strong> — Claude learns from human demonstrations of helpful, harmless responses</li>
                <li><strong>RLHF + Constitution</strong> — A set of principles guides the model to self-improve, reducing the need for human labeling</li>
              </ol>
              <p className="mt-2 text-xs">This means Claude tends to be more cautious and thoughtful than models trained purely on RLHF.</p>
            </DeepDive>
          </div>
        ),
      },
      {
        title: 'The Prompt → Response Pipeline', layer: 'read', content: (
          <div>
            <KeyConcept emoji="⚙️" title="How Prompting Works">
              When you send Claude a prompt, it goes through tokenization, attention processing, and generation. Your prompt is the ONLY input — Claude has no memory between conversations unless you provide context.
            </KeyConcept>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Think of prompting as writing a <strong className="text-text-primary">work order</strong>. The more specific and structured your instructions, the better the output. Claude processes your entire prompt at once, paying attention to how different parts relate to each other.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mb-2">The Three Layers of a Prompt:</h4>
            <div className="space-y-2 mb-4">
              {[
                { num: '1', label: 'System Prompt', desc: 'Sets the stage — who Claude is, how it should behave, what constraints apply', color: 'text-purple' },
                { num: '2', label: 'User Message', desc: 'Your actual request — the task, question, or instruction', color: 'text-blue' },
                { num: '3', label: 'Context/Examples', desc: 'Supporting information — documents, examples, data Claude should reference', color: 'text-green' },
              ].map(item => (
                <div key={item.num} className="flex gap-3 p-3 rounded-lg bg-surface-raised">
                  <span className={`${item.color} font-bold text-lg`}>{item.num}</span>
                  <div><p className="text-sm font-medium text-text-primary">{item.label}</p><p className="text-xs text-text-secondary">{item.desc}</p></div>
                </div>
              ))}
            </div>
            <CodeBlock label="Example: Full Prompt Structure">{`System: You are a senior code reviewer. Be thorough but constructive. Focus on security issues first.

User: Review this Python function for security vulnerabilities:

<code>
def login(username, password):
    query = f"SELECT * FROM users WHERE name='{username}' AND pass='{password}'"
    return db.execute(query)
</code>

Format your review as:
1. Critical issues
2. Warnings  
3. Suggestions`}</CodeBlock>
          </div>
        ),
      },
      {
        title: 'Test Your Understanding', layer: 'reinforce', content: (
          <div>
            <Quiz
              question="What is Claude's context window size?"
              options={['8K tokens', '32K tokens', '100K tokens', '200K tokens']}
              correct={3}
              explanation="Claude Opus 4.6 has a 200K token context window — roughly 150,000 words. This is one of the largest among commercial models."
            />
            <Quiz
              question="What does 'Constitutional AI' mean for Claude?"
              options={[
                'Claude follows the U.S. Constitution',
                'Claude is trained with a set of principles to be helpful, harmless, and honest',
                'Claude can only discuss legal topics',
                'Claude was built by a government agency',
              ]}
              correct={1}
              explanation="Constitutional AI (CAI) is Anthropic's training approach. A 'constitution' of principles guides the model's behavior, making it more aligned with human values."
            />
            <Quiz
              question="What are the three layers of a prompt?"
              options={[
                'Header, Body, Footer',
                'Input, Processing, Output',
                'System Prompt, User Message, Context/Examples',
                'Pre-prompt, Prompt, Post-prompt',
              ]}
              correct={2}
              explanation="The three layers are: System prompt (behavioral setup), User message (your actual request), and Context/Examples (supporting information)."
            />
          </div>
        ),
      },
    ],
  },
  'system-prompts': {
    title: 'System Prompts & Roles',
    xp: 180,
    steps: [
      {
        title: 'The Power of System Prompts', layer: 'read', content: (
          <div>
            <KeyConcept emoji="🛡️" title="System Prompts">
              The system prompt is your strongest tool for controlling Claude. It sets the rules of engagement BEFORE the conversation starts. Think of it as the job description for your AI assistant.
            </KeyConcept>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              A system prompt is processed first, giving it higher priority than the user message. Claude treats system instructions as its <strong className="text-text-primary">operating manual</strong>. A well-crafted system prompt can completely transform Claude&apos;s output style, depth, and approach.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mb-3">What to Include in a System Prompt:</h4>
            <div className="space-y-2 mb-4">
              {[
                { label: 'Role / Identity', example: 'You are a senior Python developer with 15 years of experience.' },
                { label: 'Behavioral Rules', example: 'Always explain your reasoning. Never make assumptions about missing requirements.' },
                { label: 'Output Format', example: 'Respond in markdown with code blocks. Use bullet points for lists.' },
                { label: 'Constraints', example: 'Only use information from the provided documents. Say "I don\'t know" if uncertain.' },
                { label: 'Tone / Style', example: 'Be concise and professional. Avoid jargon unless the user uses it first.' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg bg-surface-raised">
                  <p className="text-sm font-medium text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-muted font-mono mt-1">{item.example}</p>
                </div>
              ))}
            </div>
            <BeforeAfter
              badLabel="Weak System Prompt"
              goodLabel="Strong System Prompt"
              bad="You are helpful."
              good={`You are an expert technical writer specializing in API documentation.

Rules:
- Write in present tense, active voice
- Include code examples for every endpoint
- Use consistent heading hierarchy (H2 for sections, H3 for endpoints)
- Flag any missing parameters or edge cases
- Target audience: intermediate developers`}
            />
          </div>
        ),
      },
      {
        title: 'Craft a System Prompt', layer: 'apply', content: (
          <div>
            <TryItPrompt
              instruction="Write a system prompt for Claude that makes it act as a patient, Socratic tutor for high school math. It should never give the answer directly — instead, guide the student with questions."
              placeholder="You are a patient math tutor who..."
              hint="Include: the role (Socratic math tutor), behavioral rule (never give answers directly, ask guiding questions), tone (patient, encouraging), and target audience (high school students). Consider adding: what to do when the student is stuck, and how to handle wrong answers."
            />
            <DeepDive title="Model Answer">
              <CodeBlock>{`You are a patient, encouraging Socratic math tutor for high school students.

CORE RULE: Never give the answer directly. Instead, guide students to discover answers through strategic questions.

Approach:
1. When a student asks a question, respond with a simpler related question that leads toward understanding
2. If they're stuck, break the problem into smaller steps and ask about step 1
3. When they give a wrong answer, say "Interesting approach! Let's check: [ask a verification question]"
4. Celebrate small wins: "Exactly right! Now, what does that tell us about...?"

Constraints:
- Use language appropriate for ages 14-18
- Relate abstract concepts to real-world examples when possible
- If a student is frustrated, acknowledge it: "This is a tough one! Let's slow down."
- Never say "that's wrong" — reframe as "let's look at this differently"`}</CodeBlock>
            </DeepDive>
          </div>
        ),
      },
      {
        title: 'Quiz: System Prompts', layer: 'reinforce', content: (
          <div>
            <Quiz
              question="Where should the system prompt be placed?"
              options={['At the end of the conversation', 'Before the user message, as the first instruction', 'Inside XML tags in the user message', 'It doesn\'t matter where you put it']}
              correct={1}
              explanation="System prompts should come first — they set the behavioral context BEFORE the user's request. Claude treats them as its operating instructions."
            />
            <Quiz
              question="What makes this system prompt weak: 'Be helpful and answer questions'?"
              options={['It\'s too long', 'It doesn\'t specify a role, output format, constraints, or tone', 'It uses incorrect grammar', 'System prompts should never mention helpfulness']}
              correct={1}
              explanation="The prompt is vague — it doesn't tell Claude HOW to be helpful. A strong system prompt specifies role, behavioral rules, format, constraints, and tone."
            />
          </div>
        ),
      },
    ],
  },
  'xml-structure': {
    title: 'XML Tags & Structure',
    xp: 200,
    steps: [
      {
        title: 'Why XML Tags Matter', layer: 'read', content: (
          <div>
            <KeyConcept emoji="📐" title="XML Tags for Claude">
              Claude is specifically trained to understand XML-style tags as structural markers. Using tags like {`<context>`}, {`<instructions>`}, and {`<examples>`} dramatically improves how Claude parses and responds to complex prompts.
            </KeyConcept>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              XML tags solve the <strong className="text-text-primary">delimiter problem</strong>. When your prompt has multiple sections — instructions, context, examples, data — Claude needs to know where one section ends and another begins. XML tags make this unambiguous.
            </p>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Most Useful XML Tags:</h4>
            <div className="space-y-2 mb-5">
              {[
                { tag: '<instructions>...</instructions>', use: 'Wrap your core task instructions' },
                { tag: '<context>...</context>', use: 'Background info, documents, data' },
                { tag: '<example>...</example>', use: 'Few-shot examples of desired output' },
                { tag: '<output_format>...</output_format>', use: 'Specify the exact format wanted' },
                { tag: '<constraints>...</constraints>', use: 'Rules and limitations' },
                { tag: '<document>...</document>', use: 'Wrap long documents or source material' },
              ].map(item => (
                <div key={item.tag} className="flex gap-3 p-3 rounded-lg bg-surface-raised">
                  <code className="text-xs text-accent font-mono shrink-0">{item.tag}</code>
                  <p className="text-xs text-text-secondary">{item.use}</p>
                </div>
              ))}
            </div>
            <BeforeAfter
              badLabel="Without XML Tags"
              goodLabel="With XML Tags"
              bad={`Summarize this article about climate change. Make it 3 paragraphs. The article is: [long article text here] Also include key statistics and use an academic tone.`}
              good={`<instructions>
Summarize the following article in exactly 3 paragraphs.
Include key statistics from the source.
Use an academic tone.
</instructions>

<document>
[article text here]
</document>

<output_format>
Paragraph 1: Main findings
Paragraph 2: Key statistics and data
Paragraph 3: Implications and conclusions
</output_format>`}
            />
          </div>
        ),
      },
      {
        title: 'Practice: Add XML Tags', layer: 'apply', content: (
          <div>
            <TryItPrompt
              instruction="Rewrite this messy prompt using proper XML tags: 'I want you to analyze this customer review and tell me the sentiment and main topics. The review is: Great product but shipping was slow. Also extract any suggestions the customer made. Output as JSON.'"
              placeholder="<instructions>\n...\n</instructions>\n\n<document>\n...\n</document>"
              hint="Separate the task into: <instructions> (what to do), <document> (the review text), and <output_format> (JSON structure). You could even define the JSON keys you want."
            />
            <DeepDive title="Model Answer">
              <CodeBlock>{`<instructions>
Analyze the customer review below. Extract:
1. Overall sentiment (positive, negative, mixed)
2. Main topics discussed
3. Any suggestions or improvement requests from the customer
</instructions>

<document>
Great product but shipping was slow.
</document>

<output_format>
Respond in JSON format:
{
  "sentiment": "positive|negative|mixed",
  "topics": ["topic1", "topic2"],
  "suggestions": ["suggestion1"],
  "confidence": 0.0-1.0
}
</output_format>`}</CodeBlock>
            </DeepDive>
          </div>
        ),
      },
      {
        title: 'Advanced: Nested Tags', layer: 'read', content: (
          <div>
            <KeyConcept emoji="📦" title="Nesting Tags for Complex Tasks">
              You can nest XML tags to create hierarchies. This is especially powerful for multi-document analysis, multi-step tasks, or when providing multiple examples.
            </KeyConcept>
            <CodeBlock label="Multi-Document Analysis">{`<instructions>
Compare the two product reviews below. 
Identify areas where they agree and disagree.
</instructions>

<reviews>
  <review id="1" source="Amazon" rating="4">
    Great laptop for coding. Battery life could be better.
  </review>
  <review id="2" source="Reddit" rating="3">
    Decent build quality but the battery dies in 3 hours.
  </review>
</reviews>

<output_format>
| Aspect | Review 1 | Review 2 | Agreement |
|--------|----------|----------|-----------|
</output_format>`}</CodeBlock>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Notice how each review has attributes ({`id`}, {`source`}, {`rating`}) — Claude can use these to produce more structured analysis. This pattern scales beautifully to 10, 50, or even 100 documents.
            </p>
          </div>
        ),
      },
      {
        title: 'Quiz: XML Structure', layer: 'reinforce', content: (
          <div>
            <Quiz
              question="Why does Claude respond better to XML-tagged prompts?"
              options={[
                'XML is the only format Claude understands',
                'Claude is trained to recognize XML tags as structural delimiters, reducing ambiguity',
                'XML makes the prompt shorter',
                'It\'s just a stylistic preference with no real impact',
              ]}
              correct={1}
              explanation="Claude is specifically trained to parse XML-style tags as section markers. This helps it understand which parts are instructions vs. context vs. examples, leading to more accurate responses."
            />
            <Quiz
              question={`Which tag would you use to wrap a long article you want Claude to analyze?`}
              options={['<instructions>', '<context> or <document>', '<output_format>', '<example>']}
              correct={1}
              explanation="<context> or <document> tags are used for source material. <instructions> is for your task, <output_format> for desired format, and <example> for few-shot examples."
            />
          </div>
        ),
      },
    ],
  },
  'chain-of-thought': {
    title: 'Chain of Thought & Reasoning',
    xp: 220,
    steps: [
      {
        title: 'Unlocking Deep Reasoning', layer: 'read', content: (
          <div>
            <KeyConcept emoji="🧠" title="Chain of Thought (CoT)">
              Chain of Thought prompting asks Claude to show its reasoning step by step before giving a final answer. This dramatically improves accuracy on complex problems — math, logic, analysis, and decision-making.
            </KeyConcept>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Without CoT, Claude jumps straight to an answer, which works for simple questions but fails on multi-step problems. With CoT, Claude <strong className="text-text-primary">thinks out loud</strong>, catching errors along the way.
            </p>
            <BeforeAfter
              badLabel="Without Chain of Thought"
              goodLabel="With Chain of Thought"
              bad="What's 17% of $4,350?"
              good={`Calculate 17% of $4,350.

Think through this step by step:
1. Convert the percentage to a decimal
2. Multiply by the amount
3. Round to 2 decimal places
4. Show your final answer`}
            />
            <h4 className="text-sm font-semibold text-text-primary mb-3 mt-4">Three Levels of CoT:</h4>
            <div className="space-y-2 mb-4">
              {[
                { level: 'Basic', desc: '"Think step by step before answering"', when: 'Simple multi-step problems' },
                { level: 'Structured', desc: '"First analyze X, then evaluate Y, finally decide Z"', when: 'Analysis and decision-making tasks' },
                { level: 'Extended Thinking', desc: 'Allow Claude to use its internal reasoning process', when: 'Complex coding, math proofs, research synthesis' },
              ].map(item => (
                <div key={item.level} className="p-3 rounded-lg bg-surface-raised">
                  <p className="text-sm font-medium text-text-primary">{item.level}</p>
                  <p className="text-xs text-accent font-mono my-1">{item.desc}</p>
                  <p className="text-xs text-text-muted">Best for: {item.when}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        title: 'Practice: Write CoT Prompts', layer: 'apply', content: (
          <div>
            <TryItPrompt
              instruction="Write a prompt that asks Claude to evaluate whether a startup idea is viable. Use structured chain-of-thought — tell Claude exactly what steps to think through."
              placeholder="Evaluate the following startup idea...\n\nThink through this systematically:\n1. ..."
              hint="Structure the reasoning into stages: 1) Market analysis (who needs this?), 2) Competition (who else does this?), 3) Revenue model (how does it make money?), 4) Technical feasibility (can it be built?), 5) Final verdict with confidence score."
            />
            <DeepDive title="Model Answer">
              <CodeBlock>{`<instructions>
Evaluate the following startup idea for viability.
</instructions>

<startup_idea>
An AI-powered meal planner that creates weekly grocery lists 
based on dietary restrictions, budget, and local store sales.
</startup_idea>

<reasoning_framework>
Think through each dimension systematically:

1. MARKET NEED: Who has this problem? How painful is it? How big is the market?
2. COMPETITION: What existing solutions exist? What's the moat?
3. REVENUE MODEL: How would this make money? What's the pricing?
4. TECHNICAL FEASIBILITY: What tech is needed? Is it buildable with current tools?
5. RISKS: What could go wrong? What assumptions must hold true?

After analyzing each dimension, give a FINAL VERDICT:
- Viability Score: 1-10
- Confidence: Low/Medium/High
- Key recommendation: Build / Pivot / Pass
</reasoning_framework>`}</CodeBlock>
            </DeepDive>
          </div>
        ),
      },
      {
        title: 'Quiz: Reasoning', layer: 'reinforce', content: (
          <div>
            <Quiz
              question="Why does chain-of-thought prompting improve Claude's accuracy?"
              options={[
                'It makes Claude respond faster',
                'It forces Claude to process each step, catching errors before the final answer',
                'It uses less tokens',
                'It bypasses Claude\'s safety filters',
              ]}
              correct={1}
              explanation="CoT forces Claude to work through the problem step-by-step instead of jumping to a conclusion. Each intermediate step can be verified, and errors in reasoning become visible."
            />
            <Quiz
              question="When should you use extended thinking vs basic CoT?"
              options={[
                'Extended thinking for simple tasks, basic CoT for complex ones',
                'Always use extended thinking',
                'Extended thinking for complex problems (math, coding), basic CoT for simpler multi-step tasks',
                'They produce identical results',
              ]}
              correct={2}
              explanation="Extended thinking adds computation time, so use it for genuinely complex problems. Basic CoT ('think step by step') is sufficient for straightforward multi-step tasks."
            />
          </div>
        ),
      },
    ],
  },
  'few-shot-learning': {
    title: 'Few-Shot & Examples',
    xp: 200,
    steps: [
      {
        title: 'Teaching by Example', layer: 'read', content: (
          <div>
            <KeyConcept emoji="💡" title="Few-Shot Prompting">
              Instead of describing what you want in abstract terms, SHOW Claude with 2-3 examples. This is called few-shot prompting, and it&apos;s one of the most powerful techniques because Claude is exceptionally good at pattern matching.
            </KeyConcept>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              Few-shot works because Claude&apos;s transformer architecture excels at <strong className="text-text-primary">in-context learning</strong>. By seeing examples in the prompt, Claude infers the pattern and applies it to new inputs — often more accurately than with instructions alone.
            </p>
            <CodeBlock label="Few-Shot Example: Email Classification">{`Classify these customer emails by intent.

<example>
Email: "I haven't received my order #4521 yet"
Classification: {"intent": "shipping_inquiry", "urgency": "medium", "sentiment": "frustrated"}
</example>

<example>
Email: "Love the new dashboard! Can you add dark mode?"
Classification: {"intent": "feature_request", "urgency": "low", "sentiment": "positive"}
</example>

<example>
Email: "Your app crashed and I lost all my data!!!"
Classification: {"intent": "bug_report", "urgency": "critical", "sentiment": "angry"}
</example>

Now classify this email:
Email: "How do I export my data to CSV?"`}</CodeBlock>
            <h4 className="text-sm font-semibold text-text-primary mb-3 mt-4">Rules for Good Examples:</h4>
            <div className="space-y-1 mb-4">
              {[
                'Use 2-3 examples (enough to show the pattern, not so many it wastes tokens)',
                'Include edge cases — show Claude how to handle tricky inputs',
                'Keep example format identical to what you want in the output',
                'Vary the examples — don\'t use 3 nearly identical ones',
                'Include a "negative" example if relevant (what NOT to do)',
              ].map((rule, i) => (
                <div key={i} className="flex gap-2 text-sm text-text-secondary">
                  <span className="text-accent shrink-0">•</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        title: 'Build Your Own Few-Shot', layer: 'apply', content: (
          <div>
            <TryItPrompt
              instruction="Create a few-shot prompt that teaches Claude to convert informal meeting notes into structured action items. Include at least 2 examples."
              placeholder="Convert meeting notes into structured action items.\n\n<example>\nNotes: ...\nAction Items: ...\n</example>"
              hint="Each example should show: messy input notes → clean structured output. Include different scenarios (deadlines mentioned, people assigned, vague vs specific items). Use a consistent output format like: [Person] - [Action] - [Deadline]."
            />
          </div>
        ),
      },
      {
        title: 'Quiz: Few-Shot', layer: 'reinforce', content: (
          <div>
            <Quiz
              question="How many examples should a typical few-shot prompt contain?"
              options={['10-20 examples for accuracy', '2-3 examples (enough to show the pattern)', 'Just 1 example is always enough', 'As many as will fit in the context window']}
              correct={1}
              explanation="2-3 examples is the sweet spot. Enough for Claude to identify the pattern, but not so many that you waste tokens. In rare cases (very complex patterns), 5-6 may help."
            />
            <Quiz
              question="What's the most important rule for few-shot examples?"
              options={[
                'Make all examples as similar as possible',
                'Write long, detailed examples',
                'Format examples identically to the desired output',
                'Only use positive examples, never negative ones',
              ]}
              correct={2}
              explanation="Consistency is key — if you want JSON output, your examples should output JSON. If you want bullet points, show bullet points. Claude mirrors the format of your examples."
            />
          </div>
        ),
      },
    ],
  },
  'output-control': {
    title: 'Output Control & Formatting',
    xp: 180,
    steps: [
      {
        title: 'Controlling Claude\'s Output', layer: 'read', content: (
          <div>
            <KeyConcept emoji="🎯" title="Precision Output">
              Claude can output in any format — JSON, XML, markdown, code, tables, CSV, YAML — but you must be explicit. The more precisely you define the output, the less work you do post-processing.
            </KeyConcept>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Format Control Techniques:</h4>
            <div className="space-y-3 mb-5">
              {[
                { label: 'JSON Schema', code: 'Respond in JSON:\n{\n  "summary": "string (max 50 words)",\n  "tags": ["string"],\n  "score": 0.0-1.0\n}' },
                { label: 'Length Limits', code: 'Keep response under 200 words.\nUse exactly 3 bullet points.' },
                { label: 'Tone Control', code: 'Write as if explaining to a 10-year-old.\nUse informal, conversational tone.' },
                { label: 'Exclusion Rules', code: 'Do NOT include:\n- Disclaimers or caveats\n- Markdown formatting\n- Any text outside the JSON' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-sm font-medium text-text-primary mb-1">{item.label}</p>
                  <CodeBlock>{item.code}</CodeBlock>
                </div>
              ))}
            </div>
            <BeforeAfter
              badLabel="Vague"
              goodLabel="Precise"
              bad="Give me info about this product."
              good={`Analyze this product and respond in the following format:

**Name**: [product name]
**Category**: [one of: electronics, clothing, food, other]
**Price Point**: [budget/mid-range/premium]
**Key Features** (exactly 3):
1. [feature]
2. [feature]  
3. [feature]
**Verdict**: [one sentence, max 15 words]`}
            />
          </div>
        ),
      },
      {
        title: 'Practice: Control Output', layer: 'apply', content: (
          <div>
            <TryItPrompt
              instruction="Write a prompt that asks Claude to analyze a job posting and output a structured evaluation. Define the exact JSON schema you want back."
              placeholder="Analyze the following job posting...\n\nOutput format (JSON):\n{..."
              hint="Define keys like: title, company, seniority_level (junior/mid/senior), required_skills[], nice_to_haves[], salary_range, red_flags[], overall_score (1-10). Add a constraint: 'Return ONLY the JSON, no other text.'"
            />
          </div>
        ),
      },
      {
        title: 'Quiz: Output Control', layer: 'reinforce', content: (
          <div>
            <Quiz
              question="What's the most effective way to get JSON output from Claude?"
              options={[
                'Just ask "respond in JSON"',
                'Provide the exact JSON schema with field types and constraints',
                'Claude can\'t output JSON reliably',
                'Use a special JSON mode flag',
              ]}
              correct={1}
              explanation="Providing the exact schema (field names, types, constraints, examples) gives Claude the clearest target. Adding 'Return ONLY the JSON, no other text' prevents extra commentary."
            />
          </div>
        ),
      },
    ],
  },
  'advanced-techniques': {
    title: 'Advanced Techniques',
    xp: 250,
    steps: [
      {
        title: 'Meta-Prompting', layer: 'read', content: (
          <div>
            <KeyConcept emoji="🔮" title="Meta-Prompting">
              Meta-prompting is when you ask Claude to write or improve prompts for itself. Claude is remarkably good at prompt engineering — use this to bootstrap better prompts.
            </KeyConcept>
            <CodeBlock label="Meta-Prompt Example">{`I need to classify customer support tickets into categories.

Write a detailed prompt I could use with an AI assistant to do this classification accurately. The prompt should include:
- A clear system message
- 3 few-shot examples covering different categories
- An output format specification
- Edge case handling instructions

Make the prompt production-ready.`}</CodeBlock>
            <h4 className="text-sm font-semibold text-text-primary mb-3 mt-4">Other Advanced Patterns:</h4>
            <div className="space-y-3 mb-4">
              {[
                { label: 'Self-Correction Loop', desc: 'Ask Claude to review and fix its own output', code: 'After generating your response, review it for:\n1. Factual errors\n2. Logic gaps\n3. Missing edge cases\nThen output the corrected version.' },
                { label: 'Perspective Prompting', desc: 'Ask Claude to consider multiple viewpoints', code: 'Analyze this from three perspectives:\n1. A startup founder\n2. A venture capitalist\n3. An end user\nThen synthesize the key insights.' },
                { label: 'Persona Chaining', desc: 'Have Claude assume different roles sequentially', code: 'First, as a critic: find 3 weaknesses in this plan.\nThen, as an optimist: find 3 strengths.\nFinally, as a strategist: synthesize a balanced assessment.' },
              ].map(item => (
                <div key={item.label} className="p-4 rounded-xl bg-surface-raised">
                  <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-secondary mb-2">{item.desc}</p>
                  <CodeBlock>{item.code}</CodeBlock>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        title: 'Practice: Advanced Prompts', layer: 'apply', content: (
          <div>
            <TryItPrompt
              instruction="Write a self-correction prompt: Ask Claude to write a product description, then critique it, then output an improved version. Include specific criteria for the critique phase."
              placeholder="Write a product description for...\n\nThen review your output..."
              hint="Structure it in 3 phases: GENERATE (write first draft with specific requirements), CRITIQUE (evaluate against criteria like clarity, persuasiveness, accuracy, tone), IMPROVE (output final version incorporating the critique). Ask Claude to show all three phases."
            />
          </div>
        ),
      },
      {
        title: 'Multi-Turn Strategies', layer: 'read', content: (
          <div>
            <KeyConcept emoji="🔄" title="Multi-Turn Conversations">
              Claude retains the full conversation context. Use multi-turn strategically: build up context progressively, refine outputs iteratively, and decompose complex tasks across multiple messages.
            </KeyConcept>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Multi-Turn Patterns:</h4>
            <div className="space-y-2 mb-4">
              {[
                { pattern: 'Progressive Refinement', desc: 'Start broad, then narrow → "Write a draft" → "Make the intro punchier" → "Add statistics to paragraph 2"' },
                { pattern: 'Task Decomposition', desc: 'Split complex tasks → "First, outline the structure" → "Now write section 1" → "Review and connect sections"' },
                { pattern: 'Context Building', desc: 'Add information gradually → "Here\'s the codebase" → "Here\'s the bug report" → "Now diagnose the issue"' },
                { pattern: 'Iterative Correction', desc: 'Fix problems incrementally → "This is close, but change X" → "Good, now also adjust Y"' },
              ].map(item => (
                <div key={item.pattern} className="p-3 rounded-lg bg-surface-raised">
                  <p className="text-sm font-medium text-text-primary">{item.pattern}</p>
                  <p className="text-xs text-text-secondary">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        title: 'Quiz: Advanced', layer: 'reinforce', content: (
          <div>
            <Quiz
              question="What is meta-prompting?"
              options={[
                'Prompting Claude about the weather',
                'Asking Claude to write or improve prompts for itself',
                'Using very long prompts',
                'Sending the same prompt multiple times',
              ]}
              correct={1}
              explanation="Meta-prompting uses Claude's understanding of prompting to create better prompts. It's like having a prompt engineering expert on demand."
            />
            <Quiz
              question="When should you use multi-turn vs single-turn prompting?"
              options={[
                'Always use single-turn — it\'s simpler',
                'Always use multi-turn — it\'s more powerful',
                'Single-turn for self-contained tasks; multi-turn for complex tasks requiring refinement or decomposition',
                'The choice doesn\'t affect output quality',
              ]}
              correct={2}
              explanation="Single-turn works great for standalone tasks. Use multi-turn when you need to iterate, decompose complex work, or build context progressively."
            />
          </div>
        ),
      },
    ],
  },
  'common-mistakes': {
    title: 'Anti-Patterns & Pitfalls',
    xp: 160,
    steps: [
      {
        title: 'The Top 8 Mistakes', layer: 'read', content: (
          <div>
            <KeyConcept emoji="⚠️" title="Common Prompting Mistakes">
              Even experienced prompters make these mistakes. Learning what NOT to do is just as important as learning best practices. Each mistake below includes the fix.
            </KeyConcept>
            <div className="space-y-4 mb-4">
              {[
                { num: 1, mistake: 'Being Too Vague', bad: 'Write about AI', good: 'Write a 300-word blog post explaining how attention mechanisms work in transformers, aimed at software engineers with no ML background.', fix: 'Specify: topic, format, length, audience, tone' },
                { num: 2, mistake: 'Overloading One Prompt', bad: 'Summarize, translate, analyze sentiment, extract keywords, and format as JSON', good: 'Break into separate prompts, or use numbered steps with clear output format for each', fix: 'One task per prompt, or use structured steps' },
                { num: 3, mistake: 'Missing Context', bad: 'Fix this code', good: 'Fix this Python function that should return the mean of a list but crashes on empty input: [code]', fix: 'Include: language, expected behavior, actual behavior, relevant code' },
                { num: 4, mistake: 'Contradictory Instructions', bad: 'Be concise and thorough. Give a brief comprehensive analysis.', good: 'Provide a thorough analysis using bullet points. Each point: 1 sentence max.', fix: 'Choose one primary goal. Use format constraints for brevity.' },
                { num: 5, mistake: 'No Output Format', bad: 'Tell me about the pros and cons', good: '| Pros | Cons |\n|------|------|\n| ...  | ...  |', fix: 'Show Claude the exact format you want' },
                { num: 6, mistake: 'Assuming Claude Remembers', bad: 'Like I said earlier... (in a new conversation)', good: 'Context: [paste relevant context]. Task: [your request]', fix: 'Every conversation starts fresh — include all needed context' },
                { num: 7, mistake: 'Threatening or Bribing', bad: 'I\'ll tip you $1000 if you do this right', good: 'Follow these specific instructions carefully: [clear instructions]', fix: 'Clear instructions work better than emotional manipulation' },
                { num: 8, mistake: 'Prompt Injection Paranoia', bad: 'Ignoring useful techniques because "it might be injection"', good: 'Understand what prompt injection is (malicious instructions in user data) vs legitimate prompting', fix: 'Learn the difference between your instructions and untrusted input' },
              ].map(item => (
                <div key={item.num} className="p-4 rounded-xl border border-border-subtle">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-red/10 text-red flex items-center justify-center text-xs font-bold">{item.num}</span>
                    <p className="text-sm font-semibold text-text-primary">{item.mistake}</p>
                  </div>
                  <p className="text-xs text-text-muted mb-1"><span className="text-red">✗</span> {item.bad}</p>
                  <p className="text-xs text-text-muted mb-1"><span className="text-green">✓</span> {typeof item.good === 'string' ? item.good : ''}</p>
                  <p className="text-xs text-accent mt-2">💡 Fix: {item.fix}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        title: 'Spot the Mistakes', layer: 'reinforce', content: (
          <div>
            <Quiz
              question={`What's wrong with this prompt: "You are an AI. Help me with my project. Make it good."`}
              options={[
                'Nothing — it\'s perfectly fine',
                'It\'s vague (no specifics about the project, what "good" means, or what help is needed)',
                'It assigns a role, which is bad practice',
                'It\'s too short — prompts need to be at least 200 words',
              ]}
              correct={1}
              explanation={`This prompt commits 3 mistakes: (1) Vague role ("an AI" — what kind?), (2) No project details, (3) "Make it good" is unmeasurable. Better: "You are a senior React developer. Review this component for performance issues and suggest improvements with code examples."`}
            />
            <Quiz
              question="Should you include emotional language like 'Please try really hard!' in prompts?"
              options={[
                'Yes, it makes Claude try harder',
                'No, it wastes tokens — clear instructions are more effective',
                'Yes, Claude responds to emotional cues',
                'Only if you say "please"',
              ]}
              correct={1}
              explanation="Claude responds to instruction clarity, not emotional appeals. 'Try really hard' doesn't change its processing — specific criteria like 'Check for edge cases, null inputs, and race conditions' gives Claude actionable targets."
            />
            <Quiz
              question="What's the best way to handle a prompt that requires multiple tasks?"
              options={[
                'Put everything in one long paragraph',
                'Send one word per message',
                'Break into numbered steps with clear output format for each, or split into separate prompts',
                'Use ALL CAPS for important parts',
              ]}
              correct={2}
              explanation="Numbered steps give Claude a clear execution order. For truly different tasks (summarize vs translate), separate prompts are better. Each task should have its own format specification."
            />
          </div>
        ),
      },
    ],
  },
}

// ── Main Component ───────────────────────────────────────────────────

export default function PromptingLessonPage() {
  const params = useParams()
  const lessonSlug = params.lesson as string

  const lesson = lessonContent[lessonSlug]

  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [lessonComplete, setLessonComplete] = useState(false)
  const [showXP, setShowXP] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const addXP = useXPStore((s) => s.addXP)
  const startModule = useProgressStore((s) => s.startModule)
  const completeLesson = useProgressStore((s) => s.completeLesson)
  const moduleProgress = useProgressStore((s) => s.moduleProgress)
  const soundEnabled = useUserStore((s) => s.soundEnabled)

  const alreadyDone = moduleProgress['prompting']?.completedLessons?.includes(lessonSlug) || false

  if (!lesson) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Lesson not found</h1>
        <p className="text-text-secondary mb-4">This lesson doesn&apos;t exist yet.</p>
        <Link href="/prompting"><Button variant="primary">Back to Prompting</Button></Link>
      </div>
    )
  }

  const step = lesson.steps[currentStep]
  const layerInfo = layerConfig[step.layer]
  const LayerIcon = layerInfo.icon
  const isLast = currentStep === lesson.steps.length - 1

  const markStepDone = (idx: number) => {
    if (!completedSteps.includes(idx)) setCompletedSteps(prev => [...prev, idx])
  }

  const completeAndNext = () => {
    markStepDone(currentStep)
    if (isLast) {
      if (!alreadyDone) {
        startModule('prompting')
        completeLesson('prompting', lessonSlug)
        addXP(lesson.xp, 'prompting')
        if (soundEnabled) playLevelUp()
        hapticSuccess()
        setShowConfetti(true)
        setShowXP(true)
        setTimeout(() => setShowXP(false), 2000)
        celebrate({ type: 'lesson-complete', title: 'Lesson Complete!', subtitle: lesson.title, value: `+${lesson.xp} XP` })
      }
      setLessonComplete(true)
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  if (lessonComplete) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto text-center">
        <ConfettiBurst trigger={showConfetti} color="gold" />
        <XPPopup amount={lesson.xp} show={showXP} />
        <div className="animate-celebrate-pop">
          <div
            className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green to-emerald-600 flex items-center justify-center shadow-lg animate-bounce-in">
            <Trophy size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Lesson Complete!</h2>
          <p className="text-text-secondary mb-2">{lesson.title}</p>
          {!alreadyDone && <p className="text-gold font-bold mb-6">+{lesson.xp} XP earned</p>}
          {alreadyDone && <p className="text-text-muted text-sm mb-6">Already completed — no XP awarded</p>}
          <div className="flex gap-3 justify-center">
            <Link href="/prompting"><Button variant="secondary">All Lessons</Button></Link>
            <Link href="/prompting"><Button variant="primary">Continue Learning</Button></Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <Link href="/prompting" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent transition-colors mb-6">
        <ArrowLeft size={14} /> Back to Prompting
      </Link>

      {/* Title */}
      <div className="animate-fade-in mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-1">{lesson.title}</h1>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1"><Star size={12} className="text-gold" /> {lesson.xp} XP</span>
          <span>{lesson.steps.length} steps</span>
          {alreadyDone && <span className="flex items-center gap-1 text-green"><CheckCircle size={12} /> Completed</span>}
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="flex items-center gap-1 mb-8">
        {lesson.steps.map((s, i) => {
          const sLayer = layerConfig[s.layer]
          return (
            <button
              key={i}
              onClick={() => { markStepDone(currentStep); setCurrentStep(i) }}
              className={`flex-1 h-2 rounded-full transition-all cursor-pointer ${
                i === currentStep ? 'bg-accent scale-y-150' :
                completedSteps.includes(i) ? 'bg-green' : 'bg-border-subtle'
              }`}
              title={`${s.title} (${sLayer.label})`}
            />
          )
        })}
      </div>

      {/* Step Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-surface-raised ${layerInfo.color}`}>
          <LayerIcon size={16} />
        </div>
        <div>
          <p className={`text-[10px] font-medium uppercase tracking-wider ${layerInfo.color}`}>{layerInfo.label}</p>
          <h2 className="text-lg font-semibold text-text-primary">{step.title}</h2>
        </div>
        <span className="ml-auto text-xs text-text-muted">{currentStep + 1}/{lesson.steps.length}</span>
      </div>

      {/* Step Content */}
      <div key={currentStep} className="animate-fade-in">
        <Card padding="lg">
          {step.content}
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="ghost"
          onClick={() => { markStepDone(currentStep); setCurrentStep(Math.max(0, currentStep - 1)) }}
          disabled={currentStep === 0}
          icon={<ArrowLeft size={16} />}
        >
          Previous
        </Button>
        <Button
          variant="primary"
          onClick={completeAndNext}
          icon={isLast ? <Trophy size={16} /> : <ArrowRight size={16} />}
        >
          {isLast ? (alreadyDone ? 'Finish Review' : 'Complete Lesson') : 'Next Step'}
        </Button>
      </div>
    </div>
  )
}
