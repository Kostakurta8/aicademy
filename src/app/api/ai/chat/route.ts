import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import type { AIModel } from '@/types'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const ALLOWED_MODELS: Set<AIModel> = new Set([
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
])

const MAX_MESSAGES = 50
const MAX_TOKENS_LIMIT = 4096

function getApiKey(): string | null {
  return process.env.GROQ_API_KEY || null
}

export async function POST(req: NextRequest) {
  // Rate limit: 30 requests per 60 seconds per IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'
  const { allowed, remaining, resetMs } = checkRateLimit(ip, 30, 60_000)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(resetMs / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY not configured. Add it to your .env.local file.' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()
    const { model, messages, stream, temperature, max_tokens } = body

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
      return NextResponse.json(
        { error: `messages must be an array with 1-${MAX_MESSAGES} items.` },
        { status: 400 }
      )
    }

    // Validate model against allowlist
    const safeModel = ALLOWED_MODELS.has(model) ? model : 'llama-3.1-8b-instant'

    // Clamp temperature and max_tokens
    const safeTemp = typeof temperature === 'number' ? Math.min(Math.max(temperature, 0), 2) : 0.7
    const safeMaxTokens = typeof max_tokens === 'number' ? Math.min(Math.max(max_tokens, 1), MAX_TOKENS_LIMIT) : 1024

    if (stream) {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: safeModel,
          messages,
          stream: true,
          temperature: safeTemp,
          max_tokens: safeMaxTokens,
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        return NextResponse.json(
          { error: `Groq API error: ${text}` },
          { status: response.status }
        )
      }

      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-RateLimit-Remaining': String(remaining),
        },
      })
    }

    // Non-streaming
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: safeModel,
        messages,
        stream: false,
        temperature: safeTemp,
        max_tokens: safeMaxTokens,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json(
        { error: `Groq API error: ${text}` },
        { status: response.status }
      )
    }

    return NextResponse.json(await response.json())
  } catch {
    return NextResponse.json(
      { error: 'Could not reach Groq API.' },
      { status: 503 }
    )
  }
}
