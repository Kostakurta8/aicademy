'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Scissors, ArrowRight, Check, RotateCcw, Star } from 'lucide-react'

const exercises = [
  {
    id: 1,
    title: 'The Vague Request',
    brokenPrompt: 'Write something about dogs.',
    badOutput: 'Dogs are nice. They are pets. People like dogs. They come in many sizes.',
    hint: 'Add specifics: what kind of content? what tone? what length? what audience?',
    exampleFix: 'Write a 200-word blog post for pet owners comparing the energy levels and exercise needs of Golden Retrievers vs. French Bulldogs. Use a friendly, informative tone with bullet points.',
  },
  {
    id: 2,
    title: 'Missing Format',
    brokenPrompt: 'Explain the difference between Python and JavaScript.',
    badOutput: 'Python and JavaScript are both programming languages. Python is used for data science and JavaScript for web development...',
    hint: 'Specify the output format: comparison table, bullet list, or structured sections.',
    exampleFix: 'Compare Python and JavaScript in a markdown table with these columns: Feature, Python, JavaScript. Include rows for: typing system, primary use cases, learning curve, package manager, and popular frameworks.',
  },
  {
    id: 3,
    title: 'No Role Context',
    brokenPrompt: 'Help me with my code.',
    badOutput: 'Sure, I can help! What code do you need help with?',
    hint: 'Give the AI a role and provide the actual code to review.',
    exampleFix: 'You are a senior Python developer. Review this Flask route for security issues, performance problems, and best practice violations. Code:\n\n```python\n@app.route("/users/<id>")\ndef get_user(id):\n    user = db.execute(f"SELECT * FROM users WHERE id = {id}")\n    return jsonify(user)\n```',
  },
  {
    id: 4,
    title: 'Temperature Disaster',
    brokenPrompt: 'Generate a JSON object with 3 random product names and prices.',
    badOutput: '{"products": [{"name": "Sparkle ✨ Magic Wand 🪄", "price": "maybe $9.99??"}]}',
    hint: 'For structured output, tell the AI to be precise and specify exactly the JSON schema expected.',
    exampleFix: 'Generate a JSON array of exactly 3 products. Each product must have: "name" (string, realistic product name, no emoji), "price" (number, between 5.00 and 99.99). Output ONLY valid JSON, no explanation.',
  },
  {
    id: 5,
    title: 'Chain-of-Thought Missing',
    brokenPrompt: 'Is 7,291 a prime number?',
    badOutput: 'Yes, 7,291 is a prime number.',
    hint: 'Force the AI to show its work step-by-step to avoid confident wrong answers.',
    exampleFix: 'Determine if 7,291 is a prime number. Think step by step:\n1. Check divisibility by small primes (2, 3, 5, 7, 11, ...)\n2. Show your work for each check\n3. State your final answer with confidence level\n\nNote: 7,291 = 7 × 1,041.57... so check carefully.',
  },
]

export default function FixThePromptPage() {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userFix, setUserFix] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [completed, setCompleted] = useState<number[]>([])

  const exercise = exercises[currentIdx]
  const isCompleted = completed.includes(exercise.id)

  const handleSubmit = () => {
    if (userFix.trim().length > 20) {
      setCompleted((prev) => [...new Set([...prev, exercise.id])])
      setShowAnswer(true)
    }
  }

  const handleNext = () => {
    if (currentIdx < exercises.length - 1) {
      setCurrentIdx((i) => i + 1)
      setUserFix('')
      setShowHint(false)
      setShowAnswer(false)
    }
  }

  const handleReset = () => {
    setCurrentIdx(0)
    setUserFix('')
    setShowHint(false)
    setShowAnswer(false)
    setCompleted([])
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Fix the Prompt</h1>
        <p className="text-text-secondary">Given a broken prompt and bad output — can you write a better prompt?</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {exercises.map((e, i) => (
          <button
            key={e.id}
            onClick={() => { setCurrentIdx(i); setUserFix(''); setShowHint(false); setShowAnswer(false) }}
            className={`flex-1 h-2 rounded-full cursor-pointer transition-colors ${
              completed.includes(e.id) ? 'bg-green' : i === currentIdx ? 'bg-accent' : 'bg-border-subtle'
            }`}
          />
        ))}
        <span className="text-sm text-text-muted ml-2">{completed.length}/{exercises.length}</span>
      </div>

      {/* Exercise */}
      <div key={exercise.id} className="animate-fade-in">
        <Card padding="lg" className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Scissors size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">#{exercise.id}: {exercise.title}</h2>
          </div>

          {/* Broken prompt */}
          <div className="mb-4">
            <p className="text-xs font-medium text-red mb-1">❌ Broken Prompt:</p>
            <div className="p-3 rounded-lg bg-red/5 border border-red/20 font-mono text-sm text-text-primary">{exercise.brokenPrompt}</div>
          </div>

          {/* Bad output */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gold mb-1">😐 Bad Output:</p>
            <div className="p-3 rounded-lg bg-gold/5 border border-gold/20 text-sm text-text-secondary">{exercise.badOutput}</div>
          </div>

          {/* User's fix */}
          <div className="mb-4">
            <p className="text-xs font-medium text-green mb-1">✍️ Write a Better Prompt:</p>
            <textarea
              value={userFix}
              onChange={(e) => setUserFix(e.target.value)}
              placeholder="Rewrite the prompt to get better results..."
              className="w-full h-32 p-4 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none outline-none focus:ring-2 focus:ring-green font-mono"
              disabled={showAnswer}
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {!showAnswer && (
              <>
                <Button onClick={handleSubmit} disabled={userFix.trim().length < 20} icon={<Check size={16} />}>
                  Submit Fix
                </Button>
                <Button variant="ghost" onClick={() => setShowHint(!showHint)}>
                  {showHint ? 'Hide Hint' : '💡 Show Hint'}
                </Button>
              </>
            )}
            {showAnswer && currentIdx < exercises.length - 1 && (
              <Button onClick={handleNext} icon={<ArrowRight size={16} />}>Next Exercise</Button>
            )}
            {showAnswer && currentIdx === exercises.length - 1 && (
              <Button onClick={handleReset} icon={<RotateCcw size={16} />}>Start Over</Button>
            )}
          </div>

          {/* Hint */}
          {showHint && !showAnswer && (
            <div className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/20 animate-fade-in">
              <p className="text-sm text-accent">💡 {exercise.hint}</p>
            </div>
          )}

          {/* Answer reveal */}
          {showAnswer && (
            <div className="mt-4 animate-fade-in">
              <div className="p-4 rounded-lg bg-green/5 border border-green/20">
                <p className="text-xs font-medium text-green mb-2 flex items-center gap-1"><Star size={12} /> Example Fix (+50 XP):</p>
                <pre className="text-sm text-text-secondary whitespace-pre-wrap font-mono">{exercise.exampleFix}</pre>
              </div>
            </div>
          )}
        </Card>
      </div>

      {completed.length === exercises.length && (
        <div className="animate-fade-in">
          <Card padding="lg" glow className="text-center">
            <h2 className="text-xl font-bold text-text-primary mb-2">🎉 All Exercises Complete!</h2>
            <p className="text-text-secondary mb-4">You earned {completed.length * 50} XP for fixing {completed.length} broken prompts.</p>
            <Button onClick={handleReset} icon={<RotateCcw size={16} />}>Practice Again</Button>
          </Card>
        </div>
      )}
    </div>
  )
}
