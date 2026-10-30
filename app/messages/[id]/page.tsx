'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import SoldSheet from '@/components/SoldSheet'
import VerifiedBadge from '@/components/VerifiedBadge'
import { DesktopConversationPane } from '@/components/ConversationList'

type Msg = { id: string; senderId: string; body: string; createdAt: string; pending?: boolean; failed?: boolean }

const SHADOW = 'shadow-[0_6px_20px_rgba(28,28,25,0.08)]'
const BUBBLE_MINE = 'bg-[#fbbf24] text-[#261a00] rounded-[2rem] rounded-br-[6px] shadow-[0_4px_14px_rgba(28,28,25,0.06)]'
const BUBBLE_THEIRS = 'bg-white text-[#1c1c19] rounded-[2rem] rounded-bl-[6px] shadow-[0_6px_20px_rgba(28,28,25,0.07)]'

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

function offerAmount(body: string): number | null {
  const m = /^I offer ₹(\d+)/.exec(body)
  return m ? Number(m[1]) : null
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
  const [offerError, setOfferError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [soldBusy, setSoldBusy] = useState(false)
  const [soldSheet, setSoldSheet] = useState(false)
  const [sellerVerified, setSellerVerified] = useState(false)

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
      // The book is reloaded every time, so a buyer sees "Sold" as soon as the seller marks it
      setInfo({ meId: d.me, isBuyer: d.isBuyer, otherName: d.other?.name || 'wrap&read user', listing: d.listing })
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

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { setStatus('signin'); return }
    fetchMessages(true)
  }, [isLoaded, isSignedIn, fetchMessages])

  useEffect(() => {
    if (status !== 'ready') return
    const t = setInterval(() => fetchMessages(false), 4000)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchMessages(false) }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVisible) }
  }, [status, fetchMessages])

  useEffect(() => {
    const saved = msgs.filter(m => !m.pending && !m.failed)
    if (saved.length) lastTsRef.current = saved[saved.length - 1].createdAt
    if (stickRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: prevLenRef.current === 0 ? 'auto' : 'smooth' })
    }
    prevLenRef.current = msgs.length
  }, [msgs])

  // A buyer sees the green tick next to a seller whose number is verified
  useEffect(() => {
    const lid = info?.listing?.id
    if (!lid || !info?.isBuyer) return
    let alive = true
    fetch('/api/listings/' + lid, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && d?.seller?.verified) setSellerVerified(true) })
      .catch(() => {})
    return () => { alive = false }
  }, [info?.listing?.id, info?.isBuyer])

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

  function openOffer() {
    const price = Number(info?.listing?.price) || 0
    setOffer(String(Math.max(1, Math.round(price * 0.9))))
    setOfferError('')
    setOfferOpen(true)
  }

  function sendOffer() {
    const price = Number(info?.listing?.price) || 0
    const n = Math.floor(Number(offer))
    if (!n || n < 1 || n > price) { setOfferError('Enter a price between ₹1 and ₹' + price.toLocaleString('en-IN') + '.'); return }
    send('I offer ₹' + n + ' for this book. Is that okay?')
    setOfferOpen(false)
  }

  const pageCls = "text-[#1c1c19] antialiased font-['Plus_Jakarta_Sans',sans-serif]"
  const pageStyle = { background: '#fcf9f4' }
  const mainBtn = 'w-full h-[52px] bg-[#fbbf24] text-[#6c4f00] text-[15px] font-bold shadow-[0_4px_14px_rgba(251,191,36,0.35)] rounded-full active:scale-[0.98] transition-transform'

  if (status !== 'ready') {
    return (
      <div className={pageCls + ' min-h-screen flex items-center justify-center p-5'} style={pageStyle}>
        <div className={'bg-white rounded-[2rem] p-7 max-w-sm w-full text-center ' + SHADOW}>
          {status === 'loading' && (
            <div className="flex flex-col gap-3 animate-pulse" aria-label="Loading chat">
              <div className="h-16 rounded-[1rem] bg-[#f6f3ee]" />
              <div className="h-10 w-3/4 rounded-[2rem] bg-[#f6f3ee] self-end" />
              <div className="h-10 w-2/3 rounded-[2rem] bg-[#f0ede9]" />
              <div className="h-10 w-1/2 rounded-[2rem] bg-[#f6f3ee] self-end" />
            </div>
          )}
          {status === 'signin' && (
            <>
              <h1 className="text-[20px] font-bold mb-1">Sign in to chat</h1>
              <p className="text-[14px] text-[#4f4633] mb-6">Chats are private between the buyer and the seller.</p>
              <SignInButton mode="modal"><button className={mainBtn}>Sign in</button></SignInButton>
            </>
          )}
          {status === 'missing' && (
            <>
              <h1 className="text-[20px] font-bold mb-1">Chat not found</h1>
              <p className="text-[14px] text-[#4f4633] mb-6">It may not exist, or it belongs to someone else.</p>
              <button onClick={() => router.push('/messages')} className={mainBtn}>My messages</button>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="text-[20px] font-bold mb-1">Could not load the chat</h1>
              <p className="text-[14px] text-[#4f4633] mb-6">Please check your connection and try again.</p>
              <button onClick={() => { setStatus('loading'); fetchMessages(true) }} className={mainBtn}>Try again</button>
            </>
          )}
        </div>
      </div>
    )
  }

  async function toggleSold(next: boolean) {
    if (soldBusy || !info?.listing?.id) return
    if (next) { setSoldSheet(true); return }
    const ask = next
      ? 'Mark this book as sold? Buyers will see it as Sold right away.'
      : 'Mark this book as available again?'
    if (!window.confirm(ask)) return
    setSoldBusy(true)
    try {
      const res = await fetch('/api/listings/' + info.listing.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sold: next }),
      })
      if (res.ok) {
        setInfo((prev: any) => prev ? { ...prev, listing: { ...prev.listing, sold: next } } : prev)
      } else {
        const d = await res.json().catch(() => ({}))
        alert(d?.error || 'Could not update. Please try again.')
      }
    } catch {
      alert('Could not update. Please try again.')
    }
    setSoldBusy(false)
  }

  const l = info.listing
  const img = l?.images?.[0]
  const sold = !!l?.sold
  const price = Number(l?.price) || 0
  const priceText = price === 0 ? 'Free' : '₹' + price.toLocaleString('en-IN')
  const pctOfMrp = l?.origPrice && l.origPrice > price && price > 0 ? Math.round((price / l.origPrice) * 100) : null
  const canOffer = info.isBuyer && !sold && price > 0
  const quick: string[] = info.isBuyer
    ? ['Is it still available?', 'Where can we meet?', ...(price > 0 ? ['Can you do ₹' + Math.max(1, Math.round(price * 0.85)) + '?'] : []), 'How is the condition?']
    : ["Yes, it's available", 'Offer accepted', 'Where should we meet?', 'Sorry, it has been sold']
  const showQuick = !(sold && info.isBuyer)
  const initial = String(info.otherName).charAt(0).toUpperCase()
  const presets = [0.8, 0.9, 0.95].map(p => ({ pct: Math.round(p * 100), val: Math.max(1, Math.round(price * p)) }))

  return (
    <div className={pageCls + ' flex flex-col min-h-screen'} style={pageStyle}>
      <div className="contents lg:flex lg:flex-1 lg:gap-6 lg:max-w-[1200px] lg:mx-auto lg:w-full lg:px-6 lg:pt-6">
      <DesktopConversationPane activeId={id} />
      <div className="contents lg:flex lg:flex-col lg:flex-1 lg:min-w-0">

      {/* Mark as sold: this chat's buyer is already selected */}
      {soldSheet && (
        <SoldSheet
          listingId={info.listing.id}
          title={info.listing.title}
          conversationId={id}
          onClose={() => setSoldSheet(false)}
          onDone={() => { setSoldSheet(false); setInfo((prev: any) => prev ? { ...prev, listing: { ...prev.listing, sold: true } } : prev) }}
        />
      )}

      {/* Make an offer sheet */}
      {offerOpen && (
        <div className="fixed inset-0 z-[400] bg-[#1c1c19]/40 flex items-end md:items-center justify-center" onClick={() => setOfferOpen(false)}>
          <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] px-5 pt-3 w-full max-w-lg shadow-[0_-10px_35px_rgba(28,28,25,0.18)] flex flex-col gap-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-[#e5e2dd] rounded-full mx-auto" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[20px] font-bold">Make an offer</h3>
                <p className="text-[12px] text-[#4f4633] mt-0.5 truncate">{l?.title} (Listed at {priceText})</p>
              </div>
              <button aria-label="Close" onClick={() => setOfferOpen(false)} className="w-8 h-8 rounded-full bg-[#f6f3ee] flex items-center justify-center text-[#4f4633] shrink-0 active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="bg-[#f0ede9] rounded-[2rem] p-4 flex flex-col items-center text-center gap-1">
              <span className="text-[12px] text-[#817661]">Your price</span>
              <div className="flex items-center justify-center gap-1 text-[#795900]">
                <span className="text-[28px] font-bold">₹</span>
                <input value={offer} onChange={e => { setOffer(e.target.value.replace(/\D/g, '').slice(0, 6)); setOfferError('') }} inputMode="numeric"
                  className="w-28 text-center text-[28px] font-bold bg-transparent text-[#795900] focus:outline-none" aria-label="Offer price" />
              </div>
            </div>
            {offerError && <p className="text-[12px] text-[#ba1a1a] -mt-2">{offerError}</p>}
            <div className="flex items-center gap-2">
              {presets.map(p => (
                <button key={p.pct} type="button" onClick={() => { setOffer(String(p.val)); setOfferError('') }}
                  className={'flex-1 py-2.5 rounded-full text-[14px] font-semibold active:scale-95 transition-transform ' + (String(p.val) === offer ? 'bg-[#ffdf9f] text-[#795900]' : 'bg-[#f6f3ee] text-[#1c1c19]')}>
                  ₹{p.val} <span className="text-[12px] font-normal text-[#817661]">({p.pct}%)</span>
                </button>
              ))}
            </div>
            <button onClick={sendOffer} className={mainBtn + ' flex items-center justify-center gap-2'}>
              <span className="material-symbols-outlined text-[20px]">local_offer</span>
              <span>Send offer{offer ? ' for ₹' + offer : ''}</span>
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-50 lg:sticky lg:top-[68px] lg:inset-x-auto lg:rounded-3xl lg:border lg:border-stone-200 bg-[#fcf9f4]/85 backdrop-blur-xl shadow-[0_6px_20px_rgba(28,28,25,0.06)]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="h-16 px-5 flex items-center justify-between gap-4 max-w-xl mx-auto lg:max-w-none">
          <button aria-label="Back to messages" onClick={() => router.push('/messages')} className={'w-10 h-10 rounded-full bg-[#f0ede9] flex items-center justify-center active:scale-95 transition-transform shrink-0 lg:hidden'}>
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex-1 min-w-0 flex flex-col items-center text-center">
            <div className="flex items-center gap-1 max-w-full min-w-0"><h1 className="text-[15px] font-semibold truncate">{info.otherName}</h1>{info.isBuyer && sellerVerified && <VerifiedBadge size={16} />}</div>
            <span className="text-[12px] text-[#817661]">{info.isBuyer ? 'Seller' : 'Buyer'}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 relative">
            <button aria-label="More" onClick={() => setMenuOpen(o => !o)} className={'w-10 h-10 rounded-full bg-[#f0ede9] flex items-center justify-center active:scale-95 transition-transform'}>
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#fbbf24] text-[#6c4f00] flex items-center justify-center ml-1 text-[14px] font-semibold">{initial}</div>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className={'absolute right-0 top-12 z-20 bg-white rounded-[1rem] py-1.5 w-44 ' + SHADOW}>
                  <button onClick={() => router.push('/listing/' + l.id)} className="w-full text-left px-4 py-2.5 text-[14px] hover:bg-[#f6f3ee]">View listing</button>
                  <button onClick={() => router.push('/messages')} className="w-full text-left px-4 py-2.5 text-[14px] hover:bg-[#f6f3ee]">All messages</button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full lg:pt-0! lg:mt-3" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 64px)' }}>
        <div className="flex flex-col w-full max-w-xl mx-auto pb-44 lg:max-w-none lg:pb-6">

          {/* Pinned book card */}
          <div className="sticky z-30 px-5 pt-1 pb-2 lg:top-[140px]! bg-gradient-to-b from-[#fcf9f4] via-[#fcf9f4]/95 to-transparent backdrop-blur-sm" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 64px)' }}>
            <div className={'bg-white rounded-[2rem] p-2 flex flex-col gap-1 ' + SHADOW}>
              <div className="flex items-center gap-2">
                <div className="relative w-12 h-14 rounded-[10px] overflow-hidden bg-[#f0ede9] shrink-0 flex items-center justify-center">
                  {img
                    ? <img src={img} alt="" className={'w-full h-full object-cover ' + (sold ? 'opacity-50' : '')} />
                    : <span className="material-symbols-outlined text-[22px] text-[#795900]/50">menu_book</span>}
                  {sold && <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold bg-white/40">Sold</span>}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between h-14 py-0.5">
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-semibold leading-tight truncate">{l?.title}</h2>
                      <span className="text-[12px] text-[#817661] block mt-0.5 truncate">{l?.subtitle || l?.category || ''}</span>
                    </div>
                    <button onClick={() => router.push('/listing/' + l.id)} className="text-[#795900] text-[12px] flex items-center font-semibold active:scale-95 transition-transform shrink-0 pt-0.5 whitespace-nowrap">
                      View listing<span className="material-symbols-outlined text-[15px] ml-0.5">chevron_right</span>
                    </button>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[16px] font-bold">{priceText}</span>
                    <span className="text-[12px] text-[#817661] truncate">{[l?.condition, pctOfMrp ? pctOfMrp + '% of MRP' : ''].filter(Boolean).join(' · ')}</span>
                  </div>
                </div>
              </div>
              <div className="pt-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[12px] text-[#4f4633]">
                  <span className={'w-1.5 h-1.5 rounded-full ' + (sold ? 'bg-[#817661]' : 'bg-[#2E8B57]')} />
                  <span>{sold ? (info.isBuyer ? 'This book has been sold' : 'You marked this as sold') : 'Available'}</span>
                </div>
                {canOffer && (
                  <button onClick={openOffer} className="bg-[#f6f3ee] text-[#795900] px-3 py-1.5 rounded-full text-[13px] font-semibold flex items-center gap-1 active:scale-95 transition-transform shadow-[0_2px_8px_rgba(28,28,25,0.06)]">
                    <span className="material-symbols-outlined text-[16px]">local_offer</span><span>Make an offer</span>
                  </button>
                )}
                {sold && info.isBuyer && (
                  <button onClick={() => router.push('/marketplace')} className="text-[#795900] text-[13px] font-semibold active:opacity-70">Find similar</button>
                )}
                {!info.isBuyer && !sold && (!l?.status || l.status === 'active') && (
                  <button onClick={() => toggleSold(true)} disabled={soldBusy} className="bg-[#f6f3ee] text-[#795900] px-3 py-1.5 rounded-full text-[13px] font-semibold flex items-center gap-1 active:scale-95 transition-transform disabled:opacity-60 shadow-[0_2px_8px_rgba(28,28,25,0.06)]">
                    <span className="material-symbols-outlined text-[16px]">sell</span><span>{soldBusy ? 'Saving…' : 'Mark as sold'}</span>
                  </button>
                )}
                {!info.isBuyer && sold && (
                  <button onClick={() => toggleSold(false)} disabled={soldBusy} className="text-[#795900] text-[13px] font-semibold active:opacity-70 disabled:opacity-60">{soldBusy ? 'Saving…' : 'Mark available'}</button>
                )}
              </div>
            </div>
          </div>

          {/* Safety note */}
          <div className="px-5 my-1">
            <div className="bg-[#f6f3ee]/80 rounded-full px-4 py-2 flex items-center justify-center gap-2 text-center shadow-[0_2px_10px_rgba(28,28,25,0.04)]">
              <span className="material-symbols-outlined text-[#795900] text-[17px] shrink-0">verified_user</span>
              <p className="text-[12px] text-[#4f4633]">Meet in daylight at school gates or market hubs · Never share OTPs</p>
            </div>
          </div>

          {/* Messages */}
          <section aria-label="Conversation" className="px-5 flex flex-col gap-4 mt-2">
            {msgs.length === 0 && (
              <p className="text-center text-[14px] text-[#4f4633] py-6">Say hello. Ask about the book, or agree a place to meet.</p>
            )}

            {msgs.map((m, i) => {
              const mine = m.senderId === info.meId
              const prev = i > 0 ? msgs[i - 1] : null
              const newDay = !prev || dayLabel(m.createdAt) !== dayLabel(prev.createdAt)
              const firstOfRun = !prev || newDay || (prev.senderId === info.meId) !== mine
              const read = !!otherReadAt && new Date(otherReadAt).getTime() >= new Date(m.createdAt).getTime()
              const amt = offerAmount(m.body)
              return (
                <div key={m.id} className="flex flex-col gap-4">
                  {newDay && (
                    <div className="flex items-center justify-center my-1">
                      <span className="text-[12px] text-[#817661] bg-white/70 px-3 py-1 rounded-full shadow-sm">{dayLabel(m.createdAt)}, {timeLabel(m.createdAt)}</span>
                    </div>
                  )}

                  {mine ? (
                    <div className={'flex flex-col items-end self-end gap-1 ' + (amt ? 'max-w-[86%] w-full' : 'max-w-[84%]')}>
                      {amt ? (
                        <div className="bg-gradient-to-br from-white to-[#f6f3ee] rounded-[2rem] rounded-br-[6px] p-4 shadow-[0_6px_22px_rgba(28,28,25,0.1)] w-full">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-6 h-6 rounded-full bg-[#ffdf9f] text-[#795900] flex items-center justify-center">
                                <span className="material-symbols-outlined text-[15px]">currency_rupee</span>
                              </span>
                              <span className="text-[14px] font-semibold">Offer sent</span>
                            </div>
                            <span className="text-[20px] font-bold text-[#795900]">₹{amt.toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-[12px] text-[#4f4633] mb-2">Asking price is {priceText}</p>
                          <div className="bg-white/90 rounded-full py-1 px-3 flex items-center justify-center gap-1 text-[#817661] text-[12px] shadow-sm">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            <span>Waiting for {info.otherName}</span>
                          </div>
                        </div>
                      ) : (
                        <div className={BUBBLE_MINE + ' p-3.5 ' + (m.pending ? 'opacity-70' : '') + (m.failed ? ' opacity-60' : '')}>
                          <p className="text-[14px] leading-relaxed break-words">{m.body}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-1 pr-1 text-[11px] text-[#817661]">
                        {m.failed ? (
                          <button onClick={() => send(m.body, m.id)} className="flex items-center gap-1 text-[#ba1a1a] text-[12px] font-semibold active:opacity-60">
                            <span className="w-2 h-2 rounded-full bg-[#ba1a1a]" />
                            <span>Not sent. Tap to retry</span>
                            <span className="material-symbols-outlined text-[14px]">refresh</span>
                          </button>
                        ) : (
                          <>
                            <span>{m.pending ? 'Sending…' : timeLabel(m.createdAt)}</span>
                            {!m.pending && (
                              <span className={'material-symbols-outlined text-[15px] ' + (read ? 'text-[#795900]' : 'text-[#817661]')} style={read ? { fontVariationSettings: "'FILL' 1" } : undefined}>{read ? 'done_all' : 'done'}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={'flex flex-col items-start self-start gap-1 ' + (amt ? 'max-w-[86%] w-full' : 'max-w-[85%]')}>
                      {firstOfRun && <span className="text-[12px] font-semibold text-[#4f4633] pl-1">{info.otherName}</span>}
                      {amt ? (
                        <div className="bg-gradient-to-br from-white to-[#f6f3ee] rounded-[2rem] rounded-bl-[6px] p-4 shadow-[0_6px_22px_rgba(28,28,25,0.1)] w-full">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-6 h-6 rounded-full bg-[#ffdf9f] text-[#795900] flex items-center justify-center">
                                <span className="material-symbols-outlined text-[15px]">currency_rupee</span>
                              </span>
                              <span className="text-[14px] font-semibold">Offer received</span>
                            </div>
                            <span className="text-[20px] font-bold text-[#795900]">₹{amt.toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-[12px] text-[#4f4633]">Asking price is {priceText}</p>
                        </div>
                      ) : (
                        <div className={BUBBLE_THEIRS + ' p-3.5'}>
                          <p className="text-[14px] leading-relaxed break-words">{m.body}</p>
                        </div>
                      )}
                      <span className="pl-1 text-[11px] text-[#817661]">{timeLabel(m.createdAt)}</span>
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </section>
        </div>

        {/* Quick replies and message box */}
        <div className="fixed bottom-0 inset-x-0 z-40 lg:sticky lg:inset-x-auto lg:mt-auto bg-gradient-to-t from-[#fcf9f4] via-[#fcf9f4]/95 to-transparent pt-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="max-w-xl mx-auto lg:max-w-none">
            {showQuick && (
              <div role="toolbar" aria-label="Suggested replies" className="px-5 mb-2 overflow-x-auto flex items-center gap-2" style={{ scrollbarWidth: 'none' }}>
                {quick.map(q => (
                  <button key={q} type="button" onClick={() => { setText(q); inputRef.current?.focus() }}
                    className="bg-white whitespace-nowrap text-[#1c1c19] text-[13px] font-semibold px-3.5 py-1.5 rounded-full shadow-[0_4px_12px_rgba(28,28,25,0.06)] active:scale-95 transition-transform shrink-0">{q}</button>
                ))}
              </div>
            )}
            <div className="px-5">
              <form className="bg-white rounded-full shadow-[0_6px_24px_rgba(28,28,25,0.1)] p-1.5 flex items-center gap-2" onSubmit={e => { e.preventDefault(); send(text) }}>
                {canOffer ? (
                  <button type="button" aria-label="Make an offer" onClick={openOffer}
                    className="w-10 h-10 rounded-full bg-[#f6f3ee] text-[#795900] flex items-center justify-center font-bold text-[16px] active:scale-95 transition-transform shrink-0">₹</button>
                ) : <span className="w-2 shrink-0" />}
                <input ref={inputRef} value={text} onChange={e => setText(e.target.value)} maxLength={1000} autoComplete="off"
                  placeholder={'Type a message to ' + info.otherName + '…'}
                  className="flex-1 min-w-0 bg-transparent text-[14px] text-[#1c1c19] placeholder:text-[#817661] focus:outline-none px-1" />
                <button type="submit" aria-label="Send message" disabled={!text.trim()}
                  className="w-10 h-10 rounded-full bg-[#fbbf24] text-[#6c4f00] flex items-center justify-center active:scale-95 transition-transform shrink-0 shadow-[0_4px_14px_rgba(251,191,36,0.35)] disabled:opacity-40 disabled:shadow-none">
                  <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                </button>
              </form>
              <div className="flex items-center px-2 pt-1.5 pb-1.5">
                <span className="text-[11px] text-[#817661] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E8B57]" />Messages refresh every few seconds
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
      </div>
    </div>
  )
}