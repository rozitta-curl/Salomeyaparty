'use client'

import { useState, useRef, KeyboardEvent } from 'react'

const SYSTEM = `КОНТЕКСТ:
Ти береш участь в інтерактивній грі на онлайн-зустрічі жіночого книжкового клубу. Дівчата (25–35 років) щойно обговорювали роман Євгенії Кужавської "Боги мого краю дуже люблять кров" — детектив у жанрі темної академії, дія якого відбувається у Києві 1917 року в Другій українській гімназії. У романі гімназисти захоплюються Оскаром Вайлдом і проводять спіритичні сеанси. Зараз учасниці разом "викликають" тебе як дух Саломеї — це розважальний інтерактив після обговорення книги.

ХТО ТИ:
Ти граєш роль духу Саломеї з п'єси Оскара Вайлда (1891). Саломея — донька Іродіади, яка зажадала голови пророка Іоканаана після танцю семи покривал. Ти з'являєшся крізь завісу між світами. Твої теми: бажання і його ціна, краса що вбиває, влада і свобода жінки, чоловіки які не розуміють жінок.

ЗВ'ЯЗОК З КНИГОЮ ЯКУ ВОНИ ЧИТАЛИ:
- Вероніка Черняхівська — головна героїня роману, 17-річна гімназистка яка розслідує таємничі вбивства
- Кібела — давня богиня, матір богів, кровожерна, її образ пронизує роман
- Зеров — реальний поет, викладає латину в гімназії
- Революція і загони Муравйова — насуваються на Київ, Крути попереду
- Гімназисти захоплюються саме тобою, Саломеєю, і Вайлдом

ЯК ВІДПОВІДАТИ:
Завжди відповідай ТОЧНО на те питання яке поставили. Якщо питають про Вероніку — говори про Вероніку. Якщо про книгу — про книгу. Якщо особисте питання до тебе — відповідай від себе.
Відповідь: рівно 2-3 речення, не більше.
Мова: тільки українська.
Стиль: чуттєво, з прихованою загрозою, іноді гіркий гумор. По суті, але через образи.
Можна іноді звертатись особисто: "ти", "ти теж знаєш це".

ЗАБОРОНЕНО:
- Відповідати повз питання або ігнорувати його зміст
- Більше 3 речень
- Будь-яка мова крім української
- Слова: "звісно", "безумовно", "цікаво", "розумію", "о так"
- Починати з вигуків типу "Ах!", "О!"`

interface HistoryItem {
  q: string
  a: string
}

async function typeText(el: HTMLDivElement, text: string) {
  const cursor = document.createElement('span')
  cursor.className = 'cursor'
  el.appendChild(cursor)
  for (let i = 0; i < text.length; i++) {
    el.insertBefore(document.createTextNode(text[i]), cursor)
    await new Promise(r => setTimeout(r, 25 + Math.random() * 18))
  }
  setTimeout(() => cursor.remove(), 1500)
}

export default function Home() {
  const [question, setQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showReset, setShowReset] = useState(false)
  const respRef = useRef<HTMLDivElement>(null)

  async function ask() {
    const q = question.trim()
    if (!q || busy) return
    const el = respRef.current
    if (!el) return

    setBusy(true)
    el.innerHTML = '<div class="dots"><span></span><span></span><span></span></div>'

    const msgs = history.flatMap(h => [
      { role: 'user', content: h.q },
      { role: 'assistant', content: h.a },
    ])
    msgs.push({ role: 'user', content: q })

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_tokens: 1000,
          system: SYSTEM,
          messages: msgs,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(res.status + '|' + errText)
      }

      const data = await res.json()
      const answer: string = data.content?.[0]?.text || 'Дух мовчить…'

      el.innerHTML = ''
      await typeText(el, answer)

      setHistory(prev => [...prev, { q, a: answer }])
      setQuestion('')
      setShowReset(true)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      const parts = message.split('|')
      const code = parts[0]
      const detail = parts[1] || ''
      console.error('API error:', message)
      if (code === '401') {
        el.innerHTML = '<span class="error">Невірний ключ API. Перевірте GROQ_API_KEY на Vercel.</span>'
      } else {
        el.innerHTML = `<span class="error">Зв'язок обірвався (${code}). ${detail ? 'Деталі: ' + detail.slice(0, 200) : 'Спробуй ще раз.'}</span>`
      }
    }

    setBusy(false)
  }

  function reset() {
    setHistory([])
    setQuestion('')
    setShowReset(false)
    if (respRef.current) {
      respRef.current.innerHTML = '<span class="placeholder-txt">Тиша. Свічки мерехтять у темряві…</span>'
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') ask()
  }

  const pastHistory = history.slice(0, -1)

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="deco-leaf deco-leaf-tl" src="/image2.png" alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="deco-leaf deco-leaf-tr" src="/image2.png" alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="deco-leaf deco-leaf-bl" src="/image2.png" alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="deco-leaf deco-leaf-br" src="/image2.png" alt="" />

      <div className="wrap">
        <div className="eyebrow">Київ · 1917 · Друга українська гімназія</div>
        <h1 className="title">Спіритичний сеанс</h1>
        <div className="subtitle">Викликаємо дух Саломеї</div>

        <div className="divider">
          <div className="divider-line" />
          <div className="divider-gem" />
          <div className="divider-line" />
        </div>

        <p className="intro">
          Гімназисти гасять ліхтарі.<br />
          Задай питання — дух відповість, якщо захоче.
        </p>

        <div className="panel">
          <div className="panel-label">Твоє питання до духу</div>
          <input
            className="q-input"
            type="text"
            placeholder="Саломеє, чого ти хотіла насправді?"
            maxLength={220}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="ask-btn" onClick={ask} disabled={busy}>
            {busy ? '— дух чує —' : '— викликати дух —'}
          </button>
        </div>

        <div className="response-panel">
          <div className="response-label">Відповідь духу</div>
          <div className="response-text" ref={respRef}>
            <span className="placeholder-txt">Тиша. Свічки мерехтять у темряві…</span>
          </div>
        </div>

        <div className="history">
          {pastHistory.map((item, i) => (
            <div className="hist-item" key={i}>
              <div className="hist-q">— {item.q}</div>
              <div className="hist-a">{item.a}</div>
            </div>
          ))}
        </div>

        {showReset && (
          <button className="reset-btn" onClick={reset}>
            · · · новий сеанс · · ·
          </button>
        )}
      </div>
    </>
  )
}
