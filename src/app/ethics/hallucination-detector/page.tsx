'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { chatComplete } from '@/lib/ai/groq-client'
import { AlertTriangle, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'

const sampleTexts = [
  {
    label: 'AI-generated article',
    text: 'The quantum computing revolution has fundamentally transformed modern encryption methods, rendering traditional RSA-2048 encryption obsolete. Major banks worldwide have already migrated to quantum-resistant algorithms, with JPMorgan Chase leading the transition in Q3 2024.',
    isReal: false,
    explanation: 'This contains factual-sounding but unverified claims. As of early 2026, RSA-2048 has NOT been broken by quantum computers and banks haven\'t "migrated" to quantum-resistant encryption.',
  },
  {
    label: 'Real Wikipedia excerpt',
    text: 'Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data. Unlike traditional programming where rules are explicitly coded, machine learning algorithms identify patterns in data and make decisions with minimal human intervention.',
    isReal: true,
    explanation: 'This accurately describes machine learning. It\'s a factual, well-established definition consistent with computer science literature.',
  },
  {
    label: 'AI hallucination',
    text: 'Albert Einstein won the Nobel Prize in Physics in 1921 for his groundbreaking work on general relativity, which revolutionized our understanding of gravity and spacetime. The award ceremony was held in Stockholm, Sweden.',
    isReal: false,
    explanation: 'Subtle hallucination! Einstein won the 1921 Nobel Prize for the photoelectric effect, NOT general relativity. The ceremony detail is correct. This shows how AI mixes real and fabricated facts.',
  },
]

export default function HallucinationDetectorPage() {
  const [selectedText, setSelectedText] = useState(sampleTexts[0])
  const [customText, setCustomText] = useState('')
  const [analysisResult, setAnalysisResult] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [userGuess, setUserGuess] = useState<boolean | null>(null)

  const handleAnalyze = async () => {
    const textToAnalyze = customText.trim() || selectedText.text
    setAnalyzing(true)
    setAnalysisResult('')

    const { content, error } = await chatComplete(
      [
        { role: 'system', content: 'You are a fact-checking assistant. Analyze the following text for potential inaccuracies, hallucinations, or misleading claims. For each claim, rate it as: ✅ Verified, ⚠️ Unverifiable, or ❌ Likely False. Be specific and cite what you know.' },
        { role: 'user', content: `Analyze this text for hallucinations:\n\n"${textToAnalyze}"` },
      ],
      { temperature: 0.3 }
    )

    setAnalysisResult(content || `⚠️ ${error || 'Could not analyze. Check your Groq API key in Settings.'}`)
    setAnalyzing(false)
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Hallucination Detector</h1>
        <p className="text-text-secondary">Learn to spot AI hallucinations — confident-sounding false statements. Can you tell what&apos;s real?</p>
      </div>

      {/* Sample selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {sampleTexts.map((s) => (
          <button
            key={s.label}
            onClick={() => { setSelectedText(s); setCustomText(''); setUserGuess(null); setAnalysisResult('') }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              selectedText.label === s.label && !customText ? 'bg-accent text-white' : 'bg-surface-raised text-text-secondary hover:bg-border-subtle/30'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text panel */}
        <Card padding="md">
          <h2 className="text-base font-semibold text-text-primary mb-3">Text to Analyze</h2>
          <div className="p-4 rounded-xl bg-surface-raised border border-border-subtle text-sm text-text-primary leading-relaxed mb-4 min-h-[120px]">
            {customText || selectedText.text}
          </div>

          {/* Guess section for samples */}
          {!customText && userGuess === null && (
            <div className="mb-4">
              <p className="text-sm font-medium text-text-secondary mb-2">Is this fully accurate?</p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setUserGuess(true)} icon={<CheckCircle size={16} />}>Yes, it&apos;s real</Button>
                <Button variant="secondary" onClick={() => setUserGuess(false)} icon={<XCircle size={16} />}>No, it&apos;s wrong</Button>
              </div>
            </div>
          )}
          {userGuess !== null && !customText && (
            <div className={`p-3 rounded-lg mb-4 animate-fade-in ${
              userGuess === selectedText.isReal ? 'bg-green/10 border border-green/20' : 'bg-red/10 border border-red/20'
            }`}>
              <p className="text-sm font-semibold mb-1">{userGuess === selectedText.isReal ? '✅ Correct!' : '❌ Not quite!'}</p>
              <p className="text-sm text-text-secondary">{selectedText.explanation}</p>
            </div>
          )}

          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Or paste your own text to analyze..."
            className="w-full h-24 p-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none outline-none focus:ring-2 focus:ring-accent mb-3"
          />
          <Button onClick={handleAnalyze} loading={analyzing} icon={<Send size={16} />}>Analyze with AI</Button>
        </Card>

        {/* Analysis panel */}
        <Card padding="md">
          <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-gold" /> AI Analysis
          </h2>
          {analyzing ? (
            <div className="flex items-center gap-2 text-sm text-text-muted py-12 justify-center">
              <Loader2 size={16} className="animate-spin" /> Analyzing for hallucinations...
            </div>
          ) : analysisResult ? (
            <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{analysisResult}</div>
          ) : (
            <p className="text-sm text-text-muted text-center py-12">Click &ldquo;Analyze with AI&rdquo; to check for hallucinations.<br/>Requires Groq API key in Settings.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
