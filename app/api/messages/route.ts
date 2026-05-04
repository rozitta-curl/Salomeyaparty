import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured' },
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

  const contents = (body.messages ?? []).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }))

  const geminiBody: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: body.max_tokens ?? 1000,
    },
  }

  if (body.system) {
    geminiBody.systemInstruction = {
      parts: [{ text: body.system }],
    }
  }

  const model = 'gemini-2.5-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geminiBody),
  }

  let response: Response
  let data: unknown
  const maxRetries = 3
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    response = await fetch(url, fetchOptions)
    data = await response.json()
    if (response.status !== 503) break
    if (attempt < maxRetries - 1) {
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }

  if (!response!.ok) {
    console.error('Gemini error:', response!.status, JSON.stringify(data))
    return NextResponse.json(data, { status: response!.status })
  }

  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  return NextResponse.json({ content: [{ type: 'text', text }] })
}
