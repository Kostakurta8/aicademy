'use client'

import { useState, useCallback, useRef } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ClientOnly from '@/components/ui/ClientOnly'
import { useAIStore } from '@/stores/ai-store'
import { useXPStore } from '@/stores/xp-store'
import { chatComplete, type AIMessage } from '@/lib/ai/groq-client'
import { playCorrect, playXPDing } from '@/lib/sounds'
import {
  Link2,
  Plus,
  Play,
  Trash2,
  GripVertical,
  MessageSquare,
  Settings2,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowDown,
  Copy,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react'

interface ChainNode {
  id: string
  type: 'system' | 'user' | 'transform'
  label: string
  content: string
  temperature: number
  maxTokens: number
  output: string
  status: 'idle' | 'running' | 'done' | 'error'
  errorMessage?: string
}

const presets = [
  {
    name: 'Blog Writer Pipeline',
    icon: '📝',
    nodes: [
      { type: 'system' as const, label: 'Topic Brainstormer', content: 'You are a creative content strategist. Given a topic, generate 3 unique blog post angles with catchy titles.', temperature: 0.9, maxTokens: 300 },
      { type: 'user' as const, label: 'Select & Outline', content: 'Pick the most engaging angle from above. Create a detailed outline with introduction, 4 main sections, and conclusion.', temperature: 0.7, maxTokens: 500 },
      { type: 'user' as const, label: 'Write Introduction', content: 'Write a compelling introduction paragraph based on the outline above. Use a hook, context, and thesis statement.', temperature: 0.8, maxTokens: 400 },
    ],
  },
  {
    name: 'Code Review Chain',
    icon: '🔍',
    nodes: [
      { type: 'system' as const, label: 'Code Analyzer', content: 'You are a senior code reviewer. Analyze the provided code for bugs, performance issues, and code smells. Be specific.', temperature: 0.3, maxTokens: 600 },
      { type: 'user' as const, label: 'Security Audit', content: 'Based on the analysis above, focus on security vulnerabilities. Check for injection risks, auth issues, data exposure, and OWASP Top 10.', temperature: 0.3, maxTokens: 500 },
      { type: 'user' as const, label: 'Refactored Code', content: 'Based on the issues found, rewrite the code with all fixes applied. Add brief comments explaining each fix.', temperature: 0.4, maxTokens: 800 },
    ],
  },
  {
    name: 'Translation & Localization',
    icon: '🌍',
    nodes: [
      { type: 'user' as const, label: 'Translate', content: 'Translate the following text into Spanish, maintaining the original tone and intent.', temperature: 0.3, maxTokens: 400 },
      { type: 'user' as const, label: 'Cultural Adaptation', content: 'Review the translation above. Adapt idioms, cultural references, and humor for a Latin American audience.', temperature: 0.6, maxTokens: 400 },
      { type: 'user' as const, label: 'Quality Check', content: 'Compare the original intent with the adapted translation. List any meaning shifts, and provide a final polished version.', temperature: 0.4, maxTokens: 500 },
    ],
  },
]

function createNode(overrides?: Partial<ChainNode>): ChainNode {
  return {
    id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'user',
    label: 'Prompt Step',
    content: '',
    temperature: 0.7,
    maxTokens: 512,
    output: '',
    status: 'idle',
    errorMessage: undefined,
    ...overrides,
  }
}

function PromptChainsContent() {
  const [nodes, setNodes] = useState<ChainNode[]>([
    createNode({ type: 'system', label: 'System Context', content: 'You are a helpful AI assistant.' }),
    createNode({ label: 'Step 1', content: '' }),
  ])
  const [userInput, setUserInput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [expandedNode, setExpandedNode] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState<string | null>(null)
  const [xpAwarded, setXpAwarded] = useState(false)
  const selectedModel = useAIStore((s) => s.selectedModel)
  const abortRef = useRef(false)

  const updateNode = useCallback((id: string, updates: Partial<ChainNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)))
  }, [])

  const addNode = () => {
    setNodes((prev) => [...prev, createNode({ label: `Step ${prev.length}` })])
  }

  const removeNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id))
  }

  const moveNode = (index: number, direction: 'up' | 'down') => {
    setNodes((prev) => {
      const next = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next
    })
  }

  const loadPreset = (preset: typeof presets[0]) => {
    setNodes(preset.nodes.map((n) => createNode(n)))
    setUserInput('')
  }

  const resetChain = () => {
    abortRef.current = true
    setIsRunning(false)
    setNodes((prev) => prev.map((n) => ({ ...n, output: '', status: 'idle', errorMessage: undefined })))
  }

  const runChain = async () => {
    if (!userInput.trim() && nodes.every((n) => !n.content.trim())) return

    abortRef.current = false
    setIsRunning(true)
    setNodes((prev) => prev.map((n) => ({ ...n, output: '', status: 'idle', errorMessage: undefined })))

    let conversationHistory: AIMessage[] = []
    let previousOutput = ''

    // If there's user input, prepend it
    if (userInput.trim()) {
      conversationHistory.push({ role: 'user', content: userInput.trim() })
    }

    for (let i = 0; i < nodes.length; i++) {
      if (abortRef.current) break

      const node = nodes[i]
      updateNode(node.id, { status: 'running' })

      // Build messages for this step
      const messages: AIMessage[] = []

      if (node.type === 'system') {
        messages.push({ role: 'system', content: node.content })
        // Add all previous context
        messages.push(...conversationHistory)
        if (!conversationHistory.length && userInput.trim()) {
          messages.push({ role: 'user', content: userInput.trim() })
        }
      } else {
        // For user/transform nodes, include any system node that was first
        const systemNode = nodes[0]?.type === 'system' ? nodes[0] : null
        if (systemNode) {
          messages.push({ role: 'system', content: systemNode.content })
        }

        // Include the user's initial input
        if (userInput.trim()) {
          messages.push({ role: 'user', content: userInput.trim() })
        }

        // Include previous outputs as context
        if (previousOutput) {
          messages.push({ role: 'assistant', content: previousOutput })
        }

        // This node's prompt
        if (node.content.trim()) {
          messages.push({ role: 'user', content: node.content })
        }
      }

      if (messages.length === 0 || (messages.length === 1 && messages[0].role === 'system')) {
        updateNode(node.id, { status: 'done', output: '(No prompt provided for this step)' })
        continue
      }

      const result = await chatComplete(messages, {
        model: selectedModel,
        temperature: node.temperature,
        max_tokens: node.maxTokens,
      })

      if (abortRef.current) break

      if (result.error) {
        updateNode(node.id, { status: 'error', errorMessage: result.error })
        break
      }

      previousOutput = result.content
      conversationHistory = [
        ...conversationHistory,
        ...(node.content.trim() ? [{ role: 'user' as const, content: node.content }] : []),
        { role: 'assistant' as const, content: result.content },
      ]
      updateNode(node.id, { status: 'done', output: result.content })
    }

    setIsRunning(false)

    // Award XP once
    if (!xpAwarded && !abortRef.current) {
      useXPStore.getState().addXP(30)
      playXPDing()
      setXpAwarded(true)
    } else if (!abortRef.current) {
      playCorrect()
    }
  }

  const completedCount = nodes.filter((n) => n.status === 'done').length

  return (
    <div>
      {/* Presets */}
      <div className="mb-6">
        <p className="text-sm text-text-muted mb-3 font-medium">Quick Start Templates</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => loadPreset(preset)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border-subtle hover:border-accent/50 text-sm text-text-secondary hover:text-text-primary transition-all cursor-pointer"
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Initial User Input */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={16} className="text-blue" />
          <span className="text-sm font-semibold text-text-primary">Initial Input</span>
          <span className="text-xs text-text-muted">(passed to all steps)</span>
        </div>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter your initial text, topic, or content to process through the chain..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-surface-raised border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none text-sm font-mono"
        />
      </Card>

      {/* Chain Nodes */}
      <div className="space-y-0">
        {nodes.map((node, index) => (
          <div key={node.id}>
            {/* Connector Arrow */}
            {index > 0 && (
              <div className="flex justify-center py-2">
                <ArrowDown size={20} className="text-text-muted" />
              </div>
            )}

            <Card padding="none" className={`overflow-hidden ${node.status === 'running' ? 'ring-2 ring-accent/50' : ''}`}>
              {/* Node Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-surface-raised/50 border-b border-border-subtle">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  node.status === 'done' ? 'bg-green' :
                  node.status === 'running' ? 'bg-accent animate-pulse' :
                  node.status === 'error' ? 'bg-red' : 'bg-text-muted/30'
                }`} />

                <GripVertical size={14} className="text-text-muted shrink-0" />

                <input
                  value={node.label}
                  onChange={(e) => updateNode(node.id, { label: e.target.value })}
                  className="flex-1 bg-transparent text-sm font-semibold text-text-primary focus:outline-none"
                  placeholder="Step name..."
                />

                <select
                  value={node.type}
                  onChange={(e) => updateNode(node.id, { type: e.target.value as ChainNode['type'] })}
                  className="text-xs px-2 py-1 rounded-lg bg-surface border border-border-subtle text-text-secondary cursor-pointer"
                >
                  <option value="system">System</option>
                  <option value="user">User</option>
                  <option value="transform">Transform</option>
                </select>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowSettings(showSettings === node.id ? null : node.id)}
                    className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    aria-label="Settings"
                  >
                    <Settings2 size={14} />
                  </button>
                  <button
                    onClick={() => moveNode(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Move up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveNode(index, 'down')}
                    disabled={index === nodes.length - 1}
                    className="p-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text-primary transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Move down"
                  >
                    <ChevronDown size={14} />
                  </button>
                  {nodes.length > 1 && (
                    <button
                      onClick={() => removeNode(node.id)}
                      className="p-1.5 rounded-lg hover:bg-red/10 text-text-muted hover:text-red transition-colors cursor-pointer"
                      aria-label="Remove step"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Settings Panel */}
              {showSettings === node.id && (
                  <div
                    className="overflow-hidden border-b border-border-subtle animate-fade-in"
                  >
                    <div className="px-4 py-3 flex gap-6 bg-surface/50">
                      <div className="flex-1">
                        <label className="text-xs text-text-muted mb-1 block">Temperature ({node.temperature})</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={node.temperature}
                          onChange={(e) => updateNode(node.id, { temperature: parseFloat(e.target.value) })}
                          className="w-full accent-accent"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-text-muted mb-1 block">Max Tokens ({node.maxTokens})</label>
                        <input
                          type="range"
                          min="64"
                          max="2048"
                          step="64"
                          value={node.maxTokens}
                          onChange={(e) => updateNode(node.id, { maxTokens: parseInt(e.target.value) })}
                          className="w-full accent-accent"
                        />
                      </div>
                    </div>
                  </div>
                )}

              {/* Prompt Content */}
              <div className="px-4 py-3">
                <textarea
                  value={node.content}
                  onChange={(e) => updateNode(node.id, { content: e.target.value })}
                  placeholder={node.type === 'system' ? 'Define the AI\'s role and behavior...' : 'Enter the prompt for this step...'}
                  rows={3}
                  className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none resize-none font-mono"
                />
              </div>

              {/* Output */}
              {(node.output || node.status === 'running' || node.status === 'error') && (
                  <div
                    className="overflow-hidden border-t border-border-subtle animate-fade-in"
                  >
                    <div className="px-4 py-3 bg-surface/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {node.status === 'running' && <Loader2 size={14} className="animate-spin text-accent" />}
                          {node.status === 'done' && <CheckCircle2 size={14} className="text-green" />}
                          {node.status === 'error' && <XCircle size={14} className="text-red" />}
                          <span className="text-xs font-medium text-text-muted">
                            {node.status === 'running' ? 'Generating...' :
                             node.status === 'done' ? 'Output' :
                             node.status === 'error' ? 'Error' : ''}
                          </span>
                        </div>
                        {node.output && (
                          <button
                            onClick={() => navigator.clipboard.writeText(node.output)}
                            className="p-1 rounded hover:bg-surface-raised text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                            aria-label="Copy output"
                          >
                            <Copy size={12} />
                          </button>
                        )}
                      </div>

                      {node.status === 'error' ? (
                        <p className="text-sm text-red">{node.errorMessage}</p>
                      ) : node.status === 'running' ? (
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-2 h-2 rounded-full bg-accent animate-pulse"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div
                          className="text-sm text-text-secondary whitespace-pre-wrap max-h-60 overflow-y-auto cursor-pointer"
                          onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
                        >
                          {expandedNode === node.id
                            ? node.output
                            : node.output.length > 400
                              ? node.output.slice(0, 400) + '... (click to expand)'
                              : node.output
                          }
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </Card>
          </div>
        ))}
      </div>

      {/* Add Step + Run */}
      <div className="flex items-center justify-between mt-6">
        <Button variant="ghost" onClick={addNode} icon={<Plus size={16} />}>
          Add Step
        </Button>

        <div className="flex items-center gap-3">
          {(isRunning || completedCount > 0) && (
            <Button variant="ghost" onClick={resetChain} icon={<RotateCcw size={16} />}>
              Reset
            </Button>
          )}
          <Button
            onClick={runChain}
            loading={isRunning}
            disabled={isRunning}
            icon={isRunning ? undefined : <Play size={16} />}
          >
            {isRunning ? 'Running...' : `Run Chain (${nodes.length} steps)`}
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      {completedCount === nodes.length && completedCount > 0 && !isRunning && (
          <div
            className="mt-6 animate-fade-in"
          >
            <Card padding="md" glow className="text-center">
              <Sparkles size={24} className="text-accent mx-auto mb-2" />
              <p className="text-text-primary font-semibold">Chain Complete!</p>
              <p className="text-sm text-text-secondary">All {nodes.length} steps executed successfully.</p>
            </Card>
          </div>
        )}
    </div>
  )
}

export default function PromptChainsPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue to-indigo-600 flex items-center justify-center">
            <Link2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Prompt Chains</h1>
            <p className="text-text-secondary">Build multi-step AI workflows. Each step feeds into the next.</p>
          </div>
        </div>
      </div>

      <ClientOnly fallback={<div className="h-60" />}>
        <PromptChainsContent />
      </ClientOnly>
    </div>
  )
}
