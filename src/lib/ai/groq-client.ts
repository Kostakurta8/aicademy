'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export function useBufferedStream() {
  const bufferRef = useRef('')
  const [displayText, setDisplayText] = useState('')
  const rafRef = useRef<number>(0)

  const appendToken = useCallback((token: string) => {
    bufferRef.current += token
  }, [])

  const reset = useCallback(() => {
    bufferRef.current = ''
    setDisplayText('')
  }, [])

  useEffect(() => {
    const flush = () => {
      if (bufferRef.current !== displayText) {
        setDisplayText(bufferRef.current)
      }
      rafRef.current = requestAnimationFrame(flush)
    }
    rafRef.current = requestAnimationFrame(flush)
    return () => cancelAnimationFrame(rafRef.current)
  })

  return { displayText, appendToken, reset, rawBuffer: bufferRef }
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface StreamOptions {
  model?: string
  messages: AIMessage[]
  onToken: (token: string) => void
  onComplete: (fullText: string) => void
  onError: (error: string) => void
  temperature?: number
  max_tokens?: number
}

export function streamChat({
  model = 'llama-3.1-8b-instant',
  messages,
  onToken,
  onComplete,
  onError,
  temperature = 0.7,
  max_tokens = 1024,
}: StreamOptions): AbortController {
  const controller = new AbortController()

  const run = async () => {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, stream: true, temperature, max_tokens }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        onError(errData.error || `API returned ${res.status}`)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) { onError('No response stream'); return }

      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(Boolean)

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') { onComplete(fullText); return }
            try {
              const json = JSON.parse(data)
              const token = json.choices?.[0]?.delta?.content || ''
              if (token) { fullText += token; onToken(token) }
            } catch { /* skip malformed */ }
          }
        }
      }
      onComplete(fullText)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      onError('Could not connect to AI API. Check your API key in Settings.')
    }
  }

  run()
  return controller
}

export async function chatComplete(
  messages: AIMessage[],
  options?: { model?: string; temperature?: number; max_tokens?: number }
): Promise<{ content: string; error?: string }> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model || 'llama-3.1-8b-instant',
        messages,
        stream: false,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.max_tokens ?? 1024,
      }),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      return { content: '', error: errData.error || `API returned ${res.status}` }
    }

    const data = await res.json()
    return { content: data.choices?.[0]?.message?.content || '' }
  } catch {
    return { content: '', error: 'AI API not reachable. Check your API key.' }
  }
}

export async function checkAIHealth(): Promise<{
  healthy: boolean
  models: string[]
  error?: string
}> {
  try {
    const res = await fetch('/api/ai/models')
    if (!res.ok) return { healthy: false, models: [], error: 'API not reachable' }
    const data = await res.json()
    return { healthy: true, models: data.models || [] }
  } catch {
    return { healthy: false, models: [], error: 'Connection failed' }
  }
}
