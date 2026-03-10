'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { chatComplete } from '@/lib/ai/groq-client'
import { ArrowLeft, ArrowRight, Check, Loader2, Star, Swords } from 'lucide-react'

const missionData: Record<string, { title: string; xp: number; steps: Array<{ title: string; instruction: string; type: 'write' | 'review' | 'refine'; aiPrompt?: string }> }> = {
  'tourist-guide': {
    title: 'The AI Tourist Guide',
    xp: 500,
    steps: [
      { title: 'Choose a Destination', instruction: 'Write the name of a city you\'d like to visit and describe what kind of trip you want (adventure, relaxation, cultural, foodie).', type: 'write' },
      { title: 'Generate an Itinerary', instruction: 'Write a prompt that asks an AI to create a 3-day itinerary for your chosen destination. Include specific requirements like budget, interests, and travel style.', type: 'write', aiPrompt: 'Generate a 3-day travel itinerary' },
      { title: 'Review the Output', instruction: 'Look at the AI-generated itinerary. Identify at least 2 things that need improvement (missing info, unrealistic timing, lacking detail).', type: 'review' },
      { title: 'Refine Your Prompt', instruction: 'Rewrite your prompt to fix the issues you found. Be more specific about timing, add constraints, and request a particular format.', type: 'refine', aiPrompt: 'Refine the itinerary' },
      { title: 'Final Polish', instruction: 'Add a "local tips" section by writing a prompt that asks for insider knowledge, hidden gems, and cultural etiquette for your destination.', type: 'write', aiPrompt: 'Add local tips and hidden gems' },
    ],
  },
  'content-machine': {
    title: 'The Content Machine',
    xp: 600,
    steps: [
      { title: 'Pick a Topic', instruction: 'Choose a topic for a blog post. Write a brief on your target audience, desired tone, and key points to cover.', type: 'write' },
      { title: 'Generate an Outline', instruction: 'Write a prompt that generates a structured blog post outline with sections, subheadings, and key points.', type: 'write', aiPrompt: 'Generate a blog post outline' },
      { title: 'Draft the Introduction', instruction: 'Write a prompt for the AI to draft an engaging introduction with a hook, context, and thesis statement.', type: 'write', aiPrompt: 'Draft an engaging introduction' },
      { title: 'Write Body Sections', instruction: 'Create prompts for each body section. Use the outline as context and ask for specific examples and data.', type: 'write', aiPrompt: 'Write body section with examples' },
      { title: 'Generate a Conclusion', instruction: 'Write a prompt for a conclusion that summarizes key points and includes a clear call-to-action.', type: 'write', aiPrompt: 'Write a strong conclusion' },
      { title: 'Edit & Polish', instruction: 'Write a prompt that asks the AI to proofread and improve the entire article. Ask for SEO suggestions and readability improvements.', type: 'refine', aiPrompt: 'Proofread and improve the article' },
    ],
  },
  'code-reviewer': {
    title: 'AI Code Reviewer',
    xp: 800,
    steps: [
      { title: 'Choose a Language', instruction: 'Pick a programming language (JavaScript, Python, etc.) and describe the type of code you want reviewed (web app, API, script).', type: 'write' },
      { title: 'Write Review Criteria', instruction: 'Define what your AI code reviewer should check for: bugs, security issues, performance, naming conventions, best practices. Write these as a system prompt.', type: 'write' },
      { title: 'Submit Sample Code', instruction: 'Paste or write a code snippet (20-50 lines) that intentionally has 3-5 issues. Then write a prompt asking the AI to review it.', type: 'write', aiPrompt: 'Review this code for bugs, security issues, and best practices' },
      { title: 'Evaluate the Review', instruction: 'Look at the AI review. Did it catch all issues? Were there false positives? Rate its accuracy and note any missed problems.', type: 'review' },
      { title: 'Add Severity Levels', instruction: 'Refine your prompt to ask the AI to categorize issues by severity: Critical, Warning, Info. Ask for fix suggestions with code.', type: 'refine', aiPrompt: 'Review code with severity levels and fix suggestions' },
      { title: 'Format as PR Comments', instruction: 'Write a prompt that formats the review as GitHub-style PR comments with line references and inline suggestions.', type: 'refine', aiPrompt: 'Format review as GitHub PR comments' },
      { title: 'Test Edge Cases', instruction: 'Submit tricky code: deeply nested logic, race conditions, or subtle security flaws. See how the reviewer handles complex scenarios.', type: 'write', aiPrompt: 'Review complex code for subtle issues' },
    ],
  },
  'debate-champion': {
    title: 'Debate Champion',
    xp: 900,
    steps: [
      { title: 'Choose a Topic', instruction: 'Pick a debatable topic (technology ethics, remote work vs office, AI regulation). Write it as a clear motion statement.', type: 'write' },
      { title: 'Create Agent Personas', instruction: 'Design two AI debater personas with different backgrounds and viewpoints. Write system prompts for each.', type: 'write' },
      { title: 'Opening Statements', instruction: 'Write a prompt for Agent A to make a 3-paragraph opening argument FOR the motion. Include instructions for using evidence and logic.', type: 'write', aiPrompt: 'Make an opening argument for the motion' },
      { title: 'Counter Arguments', instruction: 'Feed Agent A\'s argument to Agent B and write a prompt for a rebuttal. Agent B should address specific points and present counter-evidence.', type: 'write', aiPrompt: 'Write a rebuttal to the opening argument' },
      { title: 'Cross-Examination', instruction: 'Write a prompt where Agent A asks 3 pointed questions about weaknesses in Agent B\'s rebuttal.', type: 'write', aiPrompt: 'Ask cross-examination questions' },
      { title: 'Responses & Follow-up', instruction: 'Have Agent B answer the questions, then Agent A responds. Write prompts that maintain intellectual rigor.', type: 'write', aiPrompt: 'Answer cross-examination and follow up' },
      { title: 'Closing Statements', instruction: 'Write prompts for both agents to give closing statements that summarize their strongest arguments.', type: 'write', aiPrompt: 'Write a closing statement summarizing key arguments' },
      { title: 'Judge the Debate', instruction: 'Write a prompt for a neutral judge AI to evaluate both sides on logic, evidence, persuasiveness, and declare a winner with reasoning.', type: 'review', aiPrompt: 'Judge this debate objectively and declare a winner' },
    ],
  },
  'data-analyst': {
    title: 'AI Data Analyst',
    xp: 1000,
    steps: [
      { title: 'Define Your Dataset', instruction: 'Describe a dataset you want to analyze (customer data, survey results, sales figures). Include columns, data types, and sample rows.', type: 'write' },
      { title: 'Data Cleaning Prompt', instruction: 'Write a prompt that asks the AI to identify data quality issues: missing values, outliers, inconsistencies. Ask for a cleaning plan.', type: 'write', aiPrompt: 'Analyze this dataset for quality issues and suggest cleaning steps' },
      { title: 'Exploratory Analysis', instruction: 'Write a prompt for initial exploration: summary statistics, distributions, correlations. Ask for specific metrics relevant to your domain.', type: 'write', aiPrompt: 'Perform exploratory data analysis' },
      { title: 'Generate Insights', instruction: 'Ask the AI to identify the 5 most important patterns or trends in the data. Request both expected and surprising findings.', type: 'write', aiPrompt: 'Identify top 5 patterns and trends' },
      { title: 'Visualization Plan', instruction: 'Write a prompt asking the AI to recommend specific chart types for each insight. Include axis labels, titles, and color schemes.', type: 'write', aiPrompt: 'Recommend visualizations for each insight' },
      { title: 'Statistical Tests', instruction: 'Ask the AI to suggest appropriate statistical tests to validate the findings. Include significance levels and assumptions.', type: 'write', aiPrompt: 'Suggest statistical tests for validation' },
      { title: 'Build a Dashboard', instruction: 'Design an AI-powered dashboard layout. Write a prompt describing the key metrics, filters, and interactive elements needed.', type: 'write', aiPrompt: 'Design a data dashboard layout' },
      { title: 'Anomaly Detection', instruction: 'Write a prompt that asks the AI to identify unusual patterns or outliers that might indicate problems or opportunities.', type: 'write', aiPrompt: 'Detect anomalies and unusual patterns' },
      { title: 'Generate Report', instruction: 'Write a prompt for a comprehensive analysis report: executive summary, methodology, findings, recommendations, and next steps.', type: 'write', aiPrompt: 'Generate a full analysis report' },
      { title: 'Present Findings', instruction: 'Create a prompt that turns the analysis into a presentation: 10 slides with key talking points, one insight per slide, actionable recommendations.', type: 'refine', aiPrompt: 'Create a 10-slide presentation of findings' },
    ],
  },
}

export default function MissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const mission = missionData[id]

  const [currentStep, setCurrentStep] = useState(0)
  const [userInputs, setUserInputs] = useState<string[]>([])
  const [aiResponse, setAiResponse] = useState('')
  const [generating, setGenerating] = useState(false)
  const [completed, setCompleted] = useState<boolean[]>([])

  if (!mission) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Mission Not Found</h1>
        <p className="text-text-secondary mb-4">This mission isn&apos;t available yet.</p>
        <Button onClick={() => router.push('/missions')}>Back to Missions</Button>
      </div>
    )
  }

  const step = mission.steps[currentStep]
  const isLastStep = currentStep === mission.steps.length - 1

  const handleSubmit = async () => {
    const input = userInputs[currentStep] || ''
    if (input.trim().length < 10) return

    if (step.aiPrompt) {
      setGenerating(true)
      setAiResponse('')
      const { content, error } = await chatComplete(
        [
          { role: 'system', content: `You are helping a learner with a mission called "${mission.title}". Be educational and encouraging.` },
          { role: 'user', content: `Task: ${step.aiPrompt}\n\nUser's input:\n${input}` },
        ],
        { temperature: 0.7 }
      )
      setAiResponse(content || `⚠️ ${error || 'No response'}`)
      setGenerating(false)
    }

    const newCompleted = [...completed]
    newCompleted[currentStep] = true
    setCompleted(newCompleted)
  }

  const handleNext = () => {
    if (currentStep < mission.steps.length - 1) {
      setCurrentStep((i) => i + 1)
      setAiResponse('')
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <button onClick={() => router.push('/missions')} className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-6 cursor-pointer">
        <ArrowLeft size={16} /> Back to Missions
      </button>

      <div className="mb-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <Swords size={24} className="text-accent" />
          <h1 className="text-2xl font-bold text-text-primary">{mission.title}</h1>
        </div>
        <p className="text-text-secondary flex items-center gap-2">
          <Star size={14} className="text-gold" /> {mission.xp} XP • {mission.steps.length} steps
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-6">
        {mission.steps.map((_, i) => (
          <div key={i} className={`flex-1 h-2 rounded-full transition-colors ${
            completed[i] ? 'bg-green' : i === currentStep ? 'bg-accent' : 'bg-border-subtle'
          }`} />
        ))}
      </div>

      {/* Step */}
      <div key={currentStep} className="animate-fade-in">
        <Card padding="lg" className="mb-6">
          <p className="text-xs font-medium text-accent mb-1">Step {currentStep + 1} of {mission.steps.length}</p>
          <h2 className="text-lg font-bold text-text-primary mb-2">{step.title}</h2>
          <p className="text-sm text-text-secondary mb-4">{step.instruction}</p>

          <textarea
            value={userInputs[currentStep] || ''}
            onChange={(e) => { const arr = [...userInputs]; arr[currentStep] = e.target.value; setUserInputs(arr) }}
            placeholder="Write your response here..."
            className="w-full h-32 p-4 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm resize-none outline-none focus:ring-2 focus:ring-accent font-mono mb-4"
          />

          <div className="flex gap-3">
            {!completed[currentStep] && (
              <Button onClick={handleSubmit} loading={generating} disabled={(userInputs[currentStep] || '').trim().length < 10} icon={<Check size={16} />}>
                {step.aiPrompt ? 'Submit & Run AI' : 'Complete Step'}
              </Button>
            )}
            {completed[currentStep] && !isLastStep && (
              <Button onClick={handleNext} icon={<ArrowRight size={16} />}>Next Step</Button>
            )}
          </div>

          {aiResponse && (
            <div className="mt-4 p-4 rounded-xl bg-accent/5 border border-accent/20 animate-fade-in">
              <p className="text-xs font-medium text-accent mb-2">🤖 AI Response:</p>
              <pre className="text-sm text-text-secondary whitespace-pre-wrap">{aiResponse}</pre>
            </div>
          )}
        </Card>
      </div>

      {completed.filter(Boolean).length === mission.steps.length && (
        <div className="animate-fade-in">
          <Card padding="lg" glow className="text-center">
            <h2 className="text-xl font-bold text-text-primary mb-2">🎉 Mission Complete!</h2>
            <p className="text-text-secondary mb-4">You earned {mission.xp} XP for completing {mission.title}!</p>
            <Button onClick={() => router.push('/missions')}>Back to Missions</Button>
          </Card>
        </div>
      )}
    </div>
  )
}
