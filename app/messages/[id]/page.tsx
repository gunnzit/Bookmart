'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'

type Msg = { id: string; senderId: string; body: string; createdAt: string; pending?: boolean; failed?: boolean }

const BUYER_QUICK = ['Is it still available?', 'Is the price negotiable?', 'Can we meet nearby?', 'How is the condition?']
const SELLER_QUICK = ["Yes, it's available", 'Where would you like to meet?', 'Price is slightly negotiable', 'Sorry, it has been sold']

function mergeMsgs(prev: Msg[], incoming: Msg[]): Msg[] {
  const map = new Map<string, Msg>()
  for (const m of prev) map.set(m.id, m)
  for (const m of incoming) map.set(m.id, m)
  return Array.from(map.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yest = new Date()
  yest.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isNearBottom() {
  return window.innerHeight + window.scrollY >= document.body.scrollHeight - 260
}

export default function ChatPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()

  const [info, setInfo] = useState<any>(null)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'signin' | 'missing' | 'error'>('loading')
  const [text, setText] = useState('')
  const [offerOpen, setOfferOpen] = useState(false)
  const [offer, setOffer] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const sendingRef = useRef(false)
  const lastTsRef = useRef<string | null>(null)
  const stickRef = useRef(true)
  const prevLenRef = useRef(0)

  const fetchMessages = useCallback(async (initial: boolean) => {
    if (!initial && (sendingRef.current || document.visibilityState !== 'visible')) return
    try {
      const after = initial ? null : lastTsRef.current
      const res = await fetch('/api/chat/conversations/' + id + (after ? '?after=' + encodeURIComponent(after) : ''), { cache: 'no-store' })
      if (res.status === 401) { setStatus('signin'); return }
      if (res.status === 404) { setStatus('missing'); return }
      if (!res.ok) { if (initial) setStatus('error'); return }
      const d = await res.json()
      setInfo({ meId: d.me, isBuyer: d.isBuyer, otherName: d.other?.name || 'Pageplus user', listing: d.listing })
      setOtherReadAt(d.otherReadAt || null)
      if (initial) setStatus('ready')
      if (Array.isArray(d.messages) && d.messages.length) {
        stickRef.current = initial || isNearBottom()
        setMsgs(prev => mergeMsgs(prev, d.messages))
      }
    } catch {
      if (initial) setStatus('error')
    }
  }, [id])

  // First load
  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { setStatus('signin'); return }
    fetchMessages(true)
  }, [isLoaded, isSignedIn, fetchMessages])

  // Check for new messages every 4 seconds while the tab is open
  useEffect(() => {
    if (status !== 'ready') return
    const t = setInterval(() => fetchMessages(false), 4000)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchMessages(false) }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible) }
  }, [status, fetchMessages])

  // Remember the newest saved message time, and keep the view at the bottom
  useEffect(() => {
    const saved = msgs.filter(m => !m.pending && !m.failed)
    if (saved.length) lastTsRef.current = saved[saved.length - 1].createdAt
    if (stickRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: prevLenRef.current === 0 ? 'auto' : 'smooth' })
    }
    prevLenRef.current = msgs.length
  }, [msgs])

  async function send(raw: string, retryId?: string) {
    const clean = raw.trim().slice(0, 1000)
    if (!clean || !info) return
    const tmpId = 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
    stickRef.current = true
    setMsgs(prev => [...prev.filter(m => m.id !== retryId), { id: tmpId, senderId: info.meId, body: clean, createdAt: new Date().toISOString(), pending: true }])
    setText('')
    sendingRef.current = true
    try {
      const res = await fetch('/api/chat/conversations/' + id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: clean }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok || !d.message) throw new Error('send failed')
      setMsgs(prev => mergeMsgs(prev.filter(m => m.id !== tmpId), [d.message]))
    } catch {
      setMsgs(prev => prev.map(m => (m.id === tmpId ? { ...m, pending: false, failed: true } : m)))
    } finally {
      sendingRef.current = false
    }
  }

  function sendOffer() {
    const n = Math.floor(Number(offer))
    if (!n || n < 1 || n > 100000) { alert('Enter a price between ₹1 and ₹1,00,000'); return }
    send('I offer ₹' + n + ' for this book. Is that okay?')
    setOffer('')
    setOfferOpen(false)
  }

  // ── Not-ready screens ────────────────────────────────────────────────────
  if (status !== 'ready') {
    return (
      <div className="bg-surface text-on-surface font-body-md min-h-screen flex items-center justify-center p-5">
        <div className="text-center max-w-sm">
          {status === 'loading' && (<><span className="material-symbols-outlined text-[44px] text-primary animate-pulse">forum</span><p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Loading chat…</p></>)}
          {status === 'signin' && (
            <>
              <span className="material-symbols-outlined text-[44px] text-primary">lock</span>
              <h1 className="font-headline-md text-headline-md mt-2 mb-1">Sign in to chat</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Chats are private between the buyer and the seller.</p>
              <SignInButton mode="modal"><button className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-6 py-3 rounded-xl shadow-md">Sign in</button></SignInButton>
            </>
          )}
          {status === 'missing' && (
            <>
              <span className="material-symbols-outlined text-[44px] text-primary">search_off</span>
              <h1 className="font-headline-md text-headline-md mt-2 mb-1">Chat not found</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">It may not exist, or it belongs to someone else.</p>
              <button onClick={() => router.push('/messages')} className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-6 py-3 rounded-xl shadow-md">My messages</button>
            </>
          )}
          {status === 'error' && (
            <>
              <span className="material-symbols-outlined text-[44px] text-error">error</span>
              <h1 className="font-headline-md text-headline-md mt-2 mb-1">Could not load the chat</h1>
              <button onClick={() => { setStatus('loading'); fetchMessages(true) }} className="mt-3 bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-6 py-3 rounded-xl shadow-md">Try again</button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Chat ─────────────────────────────────────────────────────────────────
  const l = info.listing
  const img = l?.images?.[0]
  const discount = l?.origPrice && l.origPrice > l.price ? Math.round((1 - l.price / l.origPrice) * 100) : 0
  const listingActive = !l?.status || l.status === 'active'
  const showVerified = info.isBuyer && listingActive
  const quick = info.isBuyer ? BUYER_QUICK : SELLER_QUICK

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased flex flex-col min-h-screen">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(45,30,18,0.04)]">
        <div className="h-16 px-gutter flex items-center gap-space-sm max-w-xl mx-auto">
          <button aria-label="Back to messages" onClick={() => router.push('/messages')} className="w-11 h-11 flex items-center justify-center -ml-space-xs rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all shrink-0">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-headline-sm text-headline-sm font-semibold shrink-0">
            {String(info.otherName).charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="font-headline-sm text-headline-sm text-on-surface truncate">{info.otherName}</h1>
              {showVerified && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#2E8B57]/10 text-[#2E8B57] font-label-micro text-label-micro shrink-0">
                  <span className="material-symbols-outlined text-[12px]">verified</span>VERIFIED
                </span>
              )}
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{info.isBuyer ? 'Seller' : 'Interested buyer'}</p>
          </div>
        </div>
      </header>

      <main className="flex flex-col relative w-full pt-16 bg-surface min-h-screen">
        {/* Pinned book bar */}
        <aside className="sticky top-16 z-30 w-full bg-surface-container-low/95 backdrop-blur-md shadow-sm">
          <div className="px-gutter py-space-sm max-w-xl mx-auto">
            <div className="flex items-center gap-space-sm bg-surface-container-lowest p-space-sm rounded-xl shadow-[0_2px_8px_-2px_rgba(45,30,18,0.06)]">
              <div className="relative w-14 h-16 rounded-lg overflow-hidden shrink-0 bg-primary-fixed/60 flex items-center justify-center text-[26px]">
                {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <span>{l?.emoji || '📚'}</span>}
                {l?.condition && <span className="absolute bottom-0 inset-x-0 bg-on-surface/70 text-surface text-center font-label-micro text-[9px] py-0.5 uppercase">{l.condition}</span>}
              </div>
              <div className="flex flex-col min-w-0 flex-1 justify-center">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-label-micro text-label-micro text-primary-container font-bold tracking-wider uppercase truncate">{l?.category}</span>
                  <span className={'font-label-micro text-label-micro px-1.5 py-0.5 rounded-full font-semibold shrink-0 ' + (l?.sold ? 'bg-surface-container text-on-surface-variant' : 'text-[#2E8B57] bg-[#2E8B57]/10')}>{l?.sold ? 'Sold' : 'Available'}</span>
                </div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight mt-0.5">{l?.title}</h2>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="font-headline-sm text-headline-sm text-primary font-bold">₹{l?.price}</span>
                  {discount > 0 && <span className="font-body-sm text-body-sm text-outline line-through">₹{l.origPrice}</span>}
                  {discount > 0 && <span className="font-label-micro text-label-micro text-secondary font-semibold">{discount}% OFF</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => router.push('/listing/' + l.id)} className="px-3 py-1.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg shadow-sm active:scale-95 transition-all whitespace-nowrap">View listing</button>
                {info.isBuyer && !l?.sold && (
                  <button onClick={() => setOfferOpen(o => !o)} className="px-3 py-1 bg-surface-container text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-container-high active:scale-95 transition-all">Make offer</button>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Messages */}
        <section aria-label="Conversation" className="flex flex-col px-gutter py-space-sm gap-space-md max-w-xl mx-auto w-full pb-52">
          <div className="bg-surface-container p-space-sm rounded-xl shadow-[0_1px_4px_rgba(45,30,18,0.04)] flex items-start gap-space-sm">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center shrink-0 text-primary mt-0.5">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div className="min-w-0">
              <p className="font-label-md text-label-md text-on-surface font-semibold">Pageplus Safety Advice</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Meet in a public, well-lit place. Check the book together before you pay. Never share an OTP or bank details.</p>
            </div>
          </div>

          {msgs.length === 0 && (
            <p className="text-center font-body-sm text-body-sm text-on-surface-variant py-6">Say hello 👋 Ask about the book, or agree a place to meet.</p>
          )}

          {msgs.map((m, i) => {
            const mine = m.senderId === info.meId
            const newDay = i === 0 || dayLabel(m.createdAt) !== dayLabel(msgs[i - 1].createdAt)
            const read = !!otherReadAt && new Date(otherReadAt).getTime() >= new Date(m.createdAt).getTime()
            return (
              <div key={m.id} className="flex flex-col gap-space-md">
                {newDay && (
                  <div className="flex items-center justify-center my-space-xs">
                    <span className="bg-surface-container-high text-on-surface-variant font-label-micro text-label-micro uppercase px-3 py-1 rounded-full shadow-sm">{dayLabel(m.createdAt)}</span>
                  </div>
                )}
                {mine ? (
                  <div className="flex flex-col items-end self-end max-w-[84%] gap-1">
                    <div className={'bg-primary-container text-on-primary p-space-sm rounded-2xl rounded-tr-sm shadow-sm ' + (m.pending ? 'opacity-70' : '') + (m.failed ? ' ring-2 ring-error' : '')}>
                      <p className="font-body-md text-body-md leading-relaxed break-words">{m.body}</p>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-micro text-label-micro px-1">
                      {m.failed ? (
                        <button onClick={() => send(m.body, m.id)} className="text-error font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">refresh</span>Not sent · Tap to retry
                        </button>
                      ) : (
                        <>
                          <span>{m.pending ? 'Sending…' : timeLabel(m.createdAt)}</span>
                          {!m.pending && <span className={'material-symbols-outlined text-[14px] ' + (read ? 'text-primary' : 'text-outline')}>{read ? 'done_all' : 'done'}</span>}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-end gap-2 max-w-[86%] self-start">
                    <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-label-micro text-label-micro shrink-0 mb-4">{String(info.otherName).charAt(0).toUpperCase()}</div>
                    <div className="flex flex-col items-start gap-1 min-w-0">
                      <div className="bg-surface-container-lowest text-on-surface p-space-sm rounded-2xl rounded-tl-sm shadow-[0_2px_6px_rgba(45,30,18,0.05)]">
                        <p className="font-body-md text-body-md leading-relaxed break-words">{m.body}</p>
                      </div>
                      <span className="text-on-surface-variant font-label-micro text-label-micro px-1">{timeLabel(m.createdAt)}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </section>

        {/* Compose area */}
        <div className="fixed bottom-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-xl shadow-[0_-4px_20px_rgba(45,30,18,0.06)] pb-safe">
          <div className="max-w-xl mx-auto flex flex-col pt-space-xs pb-space-sm px-gutter gap-space-xs">
            {offerOpen && info.isBuyer && !l?.sold && (
              <div className="flex items-center gap-2 bg-surface-container-lowest rounded-xl p-2 shadow-sm">
                <span className="font-headline-sm text-headline-sm text-primary pl-2">₹</span>
                <input value={offer} onChange={e => setOffer(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder={'Your offer (listed ₹' + l?.price + ')'}
                  className="flex-1 min-w-0 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none" />
                <button onClick={sendOffer} className="px-3 py-1.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg font-semibold active:scale-95 transition-transform">Send offer</button>
                <button aria-label="Cancel offer" onClick={() => setOfferOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            <div aria-label="Suggested quick replies" className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1" role="toolbar">
              {quick.map(q => (
                <button key={q} type="button" onClick={() => { setText(q); inputRef.current?.focus() }}
                  className="px-3 py-1.5 rounded-full bg-surface-container-lowest text-on-surface hover:bg-primary-fixed hover:text-primary active:scale-95 whitespace-nowrap font-label-md text-label-md shadow-sm transition-all shrink-0">{q}</button>
              ))}
            </div>

            <form className="flex items-center gap-2 mt-0.5" onSubmit={e => { e.preventDefault(); send(text) }}>
              <input ref={inputRef} value={text} onChange={e => setText(e.target.value)} maxLength={1000} autoComplete="off"
                placeholder={'Type a message to ' + info.otherName + '...'}
                className="flex-1 min-w-0 bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md py-2.5 px-4 rounded-full shadow-[inset_0_1px_3px_rgba(45,30,18,0.05)] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
              <button type="submit" aria-label="Send message" disabled={!text.trim()}
                className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md active:scale-90 transition-all shrink-0 disabled:opacity-40 disabled:shadow-none">
                <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}