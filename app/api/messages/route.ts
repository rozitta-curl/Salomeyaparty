import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY not configured' },
      { status: 500 }
    )
  }

  let body: {
    messages?: Array<{ role: string; content: string }>
    max_tokens?: number
    system?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const messages = [
    ...(body.system ? [{ role: 'system', content: body.system }] : []),
    ...(body.messages ?? []),
  ]

  const groqBody = {
    model: 'llama-3.1-8b-instant',
    messages,
    max_tokens: body.max_tokens ?? 1000,
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(groqBody),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Groq error:', response.status, JSON.stringify(data))
    return NextResponse.json(data, { status: response.status })
  }

  const text: string = data.choices?.[0]?.message?.content ?? ''
  return NextResponse.json({ content: [{ type: 'text', text }] })
}
