'use client'

import { useState, useRef, useEffect } from 'react'
import { useAIStore } from '@/stores/ai-store'
import { streamChat, useBufferedStream, type AIMessage } from '@/lib/ai/groq-client'
import ClientOnly from '@/components/ui/ClientOnly'
import { MessageCircle, X, Send, Trash2, Loader2, StopCircle, GitBranch, ChevronLeft, ChevronRight } from 'lucide-react'

const TUTOR_SYSTEM_PROMPT = `You are AIcademy's AI Tutor — a friendly, encouraging mentor who helps users learn about AI and technology. 

Rules:
- Be concise. Keep answers under 200 words unless explicitly asked to elaborate.
- Use analogies and real-world examples to explain complex topics.
- If the user seems confused, offer to re-explain using a different approach.
- Celebrate when they understand something new.
- Use emoji sparingly but warmly.
- If asked something outside AI/tech, gently redirect: "Great question! That's a bit outside my specialty, but here's how it connects to AI..."
- Format with markdown: use **bold** for key terms, bullet lists for multiple points, and \`code\` for technical terms.`

export default function AITutor() {
  return (
    <ClientOnly>
      <AITutorInner />
    </ClientOnly>
  )
}

function AITutorInner() {
  const tutorOpen = useAIStore((s) => s.tutorOpen)
  const setTutorOpen = useAIStore((s) => s.setTutorOpen)
  const isGenerating = useAIStore((s) => s.isGenerating)
  const setGenerating = useAIStore((s) => s.setGenerating)
  const conversations = useAIStore((s) => s.conversations)
  const activeConversationId = useAIStore((s) => s.activeConversationId)
  const createConversation = useAIStore((s) => s.createConversation)
  const addMessage = useAIStore((s) => s.addMessage)
  const updateLastAssistantMessage = useAIStore((s) => s.updateLastAssistantMessage)
  const abortCurrentRequest = useAIStore((s) => s.abortCurrentRequest)
  const setAbortController = useAIStore((s) => s.setAbortController)
  const selectedModel = useAIStore((s) => s.selectedModel)

  const [input, setInput] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { displayText, appendToken, reset: resetStream } = useBufferedStream()

  const setActiveConversation = useAIStore((s) => s.setActiveConversation)
  const deleteConversation = useAIStore((s) => s.deleteConversation)

  const activeConv = conversations.find((c) => c.id === activeConversationId)
  const messages = activeConv?.messages || []

  const branchFromMessage = (msgIndex: number) => {
    const branchedMessages = messages.slice(0, msgIndex + 1)
    const branchTitle = `Branch: ${activeConv?.title || 'Chat'}`.slice(0, 40)
    const newId = createConversation(branchTitle)
    // Replace the empty conversation messages with the branched ones
    useAIStore.setState((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === newId ? { ...c, messages: [...branchedMessages] } : c
      ),
    }))
    resetStream()
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, displayText])

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return

    let convId = activeConversationId
    if (!convId) {
      convId = createConversation(input.slice(0, 40))
    }

    const userMsg: AIMessage = { role: 'user', content: input.trim() }
    addMessage(convId, userMsg)
    setInput('')
    setGenerating(true)
    resetStream()

    const assistantMsg: AIMessage = { role: 'assistant', content: '' }
    addMessage(convId, assistantMsg)

    const allMessages: AIMessage[] = [
      { role: 'system', content: TUTOR_SYSTEM_PROMPT },
      ...messages,
      userMsg,
    ]

    const controller = streamChat({
      model: selectedModel,
      messages: allMessages,
      onToken: (token) => appendToken(token),
      onComplete: (fullText) => {
        updateLastAssistantMessage(convId!, fullText)
        setGenerating(false)
        setAbortController(null)
      },
      onError: (error) => {
        updateLastAssistantMessage(convId!, `⚠️ ${error}`)
        setGenerating(false)
        setAbortController(null)
      },
    })

    setAbortController(controller)
  }

  return (
    <>
      {/* Floating button */}
      {!tutorOpen && (
        <button
          onClick={() => setTutorOpen(true)}
          className="animate-celebrate-pop fixed bottom-24 md:bottom-6 right-6 z-[60] w-14 h-14 rounded-full bg-accent text-white shadow-lg shadow-accent/30 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 transition-transform"
          aria-label="Open AI Tutor"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat panel */}
      {tutorOpen && (
          <div
            className="animate-fade-in fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[60] w-[calc(100vw-2rem)] md:w-[380px] h-[min(540px,calc(100vh-8rem))] md:h-[540px] bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface-raised">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <MessageCircle size={16} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">AI Tutor</p>
                  <p className="text-xs text-text-muted">{selectedModel}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {conversations.length > 1 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer ${showHistory ? 'bg-surface text-accent' : ''}`}
                    aria-label="Conversation history"
                    title="Conversation history"
                  >
                    {showHistory ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
                <button
                  onClick={() => { createConversation(); resetStream(); setShowHistory(false) }}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                  aria-label="New conversation"
                  title="New conversation"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setTutorOpen(false)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                  aria-label="Close tutor"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Conversation History Panel */}
            {showHistory && (
              <div className="border-b border-border-subtle bg-surface-raised p-2 max-h-[150px] overflow-y-auto">
                <p className="text-xs text-text-muted mb-1.5 px-1">Conversations</p>
                {conversations.map((conv) => (
                  <button key={conv.id}
                    onClick={() => { setActiveConversation(conv.id); setShowHistory(false); resetStream() }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between group cursor-pointer ${
                      conv.id === activeConversationId ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-surface'
                    }`}
                  >
                    <span className="truncate">{conv.title}</span>
                    <span className="text-text-muted text-[10px] flex-shrink-0 ml-2">{conv.messages.length} msgs</span>
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && !isGenerating && (
                <div className="text-center py-8">
                  <MessageCircle size={32} className="text-text-muted/30 mx-auto mb-3" />
                  <p className="text-sm text-text-muted">Ask me anything about AI!</p>
                  <div className="flex flex-wrap gap-2 mt-4 justify-center">
                    {['What is an LLM?', 'Explain tokens', 'What is RAG?'].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); }}
                        className="px-3 py-1.5 rounded-full text-xs bg-accent/10 text-accent hover:bg-accent/20 transition-colors cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`group flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="relative">
                    <div className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-accent text-white rounded-br-md'
                        : 'bg-surface-raised text-text-secondary rounded-bl-md'
                    }`}>
                      {msg.role === 'assistant' && i === messages.length - 1 && isGenerating
                        ? (displayText || <Loader2 size={14} className="animate-spin text-text-muted" />)
                        : msg.content
                      }
                    </div>
                    {/* Branch button */}
                    {!isGenerating && messages.length > 1 && (
                      <button
                        onClick={() => branchFromMessage(i)}
                        className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-surface-raised border border-border-subtle text-text-muted hover:text-accent cursor-pointer"
                        title="Branch from here"
                        aria-label="Branch conversation from this message"
                      >
                        <GitBranch size={10} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border-subtle">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Ask anything..."
                  className="flex-1 px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-sm outline-none focus:ring-2 focus:ring-accent"
                  disabled={isGenerating}
                />
                {isGenerating ? (
                  <button
                    onClick={abortCurrentRequest}
                    className="p-2 rounded-xl bg-red text-white cursor-pointer"
                    aria-label="Stop generating"
                  >
                    <StopCircle size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="p-2 rounded-xl bg-accent text-white disabled:opacity-50 cursor-pointer"
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
    </>
  )
}
