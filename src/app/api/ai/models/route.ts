import { NextResponse } from 'next/server'

function getApiKey(): string | null {
  return process.env.GROQ_API_KEY || null
}

const AVAILABLE_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
]

export async function GET() {
  const apiKey = getApiKey()
  if (!apiKey) {
    return NextResponse.json({ healthy: false, models: [], error: 'No API key configured' })
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ healthy: false, models: AVAILABLE_MODELS, error: 'Could not verify API key' })
    }

    const data = await res.json()
    const models = (data.data || []).map((m: { id: string }) => m.id)
    return NextResponse.json({ healthy: true, models: models.length > 0 ? models : AVAILABLE_MODELS })
  } catch {
    return NextResponse.json({ healthy: false, models: AVAILABLE_MODELS, error: 'Connection failed' })
  }
}
