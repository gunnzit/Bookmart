'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'

type Conv = {
  id: string
  role: 'buying' | 'selling'
  otherName: string
  listing: { id: string; title: string; images: string[]; emoji?: string | null; sold: boolean }
  lastText: string | null
  lastAt: string
  lastMine: boolean
  unread: boolean
}

const SHADOW = 'shadow-[0_6px_20px_rgba(28,28,25,0.08)]'

function when(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const yest = new Date()
  yest.setDate(now.getDate() - 1)
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  if (d.toDateString() === yest.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function preview(text: string | null) {
  if (!text) return ''
  const m = /^I offer ₹(\d+)/.exec(text)
  return m ? 'Offer of ₹' + Number(m[1]).toLocaleString('en-IN') : text
}

export default function MessagesPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const [rows, setRows] = useState<Conv[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [tab, setTab] = useState<'all' | 'buying' | 'selling'>('all')

  async function load(showLoading: boolean) {
    if (showLoading) setStatus('loading')
    try {
      const res = await fetch('/api/chat/conversations', { cache: 'no-store' })
      if (!res.ok) throw new Error('failed')
      const d = await res.json()
      setRows(Array.isArray(d.conversations) ? d.conversations : [])
      setStatus('ready')
    } catch {
      setStatus(s => (s === 'ready' ? s : 'error'))
    }
  }

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    load(true)
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(false) }, 10000)
    return () => clearInterval(t)
  }, [isLoaded, isSignedIn])

  const pageCls = "min-h-screen text-[#1c1c19] antialiased font-['Plus_Jakarta_Sans',sans-serif]"
  const pageStyle = { background: '#fcf9f4' }
  const mainBtn = 'w-full h-[52px] bg-[#fbbf24] text-[#6c4f00] text-[15px] font-bold shadow-[0_4px_14px_rgba(251,191,36,0.35)] rounded-full active:scale-[0.98] transition-transform'

  const shown = rows.filter(r => tab === 'all' || r.role === tab)
  const unreadTotal = rows.filter(r => r.unread).length
  const chips: { key: 'all' | 'buying' | 'selling'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'buying', label: 'Buying' },
    { key: 'selling', label: 'Selling' },
  ]

  return (
    <div className={pageCls} style={pageStyle}>
      <header className="fixed top-0 inset-x-0 z-50 bg-[#fcf9f4]/85 backdrop-blur-xl shadow-[0_6px_20px_rgba(28,28,25,0.06)]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="h-16 px-5 flex items-center justify-between gap-4 max-w-xl mx-auto">
          <button aria-label="Back to market" onClick={() => router.push('/marketplace')} className={'w-10 h-10 rounded-full bg-[#f0ede9] flex items-center justify-center active:scale-95 transition-transform shrink-0'}>
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex-1 min-w-0 flex flex-col items-center text-center">
            <h1 className="text-[20px] font-bold leading-tight">Messages</h1>
            {unreadTotal > 0 && <span className="text-[12px] text-[#795900] font-semibold">{unreadTotal} new</span>}
          </div>
          <span className="w-10 shrink-0" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 pb-16" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 80px)' }}>
        {isLoaded && !isSignedIn ? (
          <div className={'bg-white rounded-[2rem] p-7 text-center mt-6 ' + SHADOW}>
            <h2 className="text-[20px] font-bold mb-1">Sign in to see your messages</h2>
            <p className="text-[14px] text-[#4f4633] mb-6">Chat with buyers and sellers about books.</p>
            <SignInButton mode="modal"><button className={mainBtn}>Sign in</button></SignInButton>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4 overflow-x-auto -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
              {chips.map(c => (
                <button key={c.key} onClick={() => setTab(c.key)}
                  className={'shrink-0 h-9 px-4 rounded-full text-[13px] font-semibold transition-colors ' + (tab === c.key ? 'bg-[#fbbf24] text-[#6c4f00]' : 'bg-white text-[#1c1c19] ' + SHADOW)}>
                  {c.label}
                </button>
              ))}
            </div>

            {status === 'loading' && (
              <div className="flex flex-col gap-3" aria-label="Loading messages">
                {[0, 1, 2].map(i => <div key={i} className="h-[84px] rounded-[2rem] bg-white/70 animate-pulse" />)}
              </div>
            )}

            {status === 'error' && (
              <div className={'bg-white rounded-[2rem] p-6 text-center ' + SHADOW}>
                <p className="text-[14px] text-[#4f4633] mb-4">Could not load your messages.</p>
                <button onClick={() => load(true)} className={mainBtn}>Try again</button>
              </div>
            )}

            {status === 'ready' && shown.length === 0 && (
              <div className={'bg-white rounded-[2rem] p-8 text-center ' + SHADOW}>
                <h2 className="text-[15px] font-semibold mb-1">{tab === 'selling' ? 'No buyers yet' : 'No messages yet'}</h2>
                <p className="text-[14px] text-[#4f4633] mb-5">
                  {tab === 'selling' ? 'When a buyer messages you about your book, it shows up here.' : 'Open a book in the market and tap Chat to buy.'}
                </p>
                <button onClick={() => router.push('/marketplace')} className={mainBtn}>Browse the market</button>
              </div>
            )}

            {status === 'ready' && shown.length > 0 && (
              <ul className="flex flex-col gap-3">
                {shown.map(c => {
                  const img = c.listing?.images?.[0]
                  const sold = !!c.listing?.sold
                  return (
                    <li key={c.id}>
                      <button onClick={() => router.push('/messages/' + c.id)}
                        className={'w-full text-left bg-white rounded-[2rem] p-3 flex items-center gap-3 active:scale-[0.99] transition-transform ' + SHADOW}>
                        <div className="relative w-12 h-14 rounded-[10px] overflow-hidden shrink-0 bg-[#f0ede9] flex items-center justify-center">
                          {img
                            ? <img src={img} alt="" className={'w-full h-full object-cover ' + (sold ? 'opacity-50' : '')} />
                            : <span className="material-symbols-outlined text-[22px] text-[#795900]/50">menu_book</span>}
                          {sold && <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold bg-white/40">Sold</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className={'text-[15px] truncate ' + (c.unread ? 'font-bold' : 'font-semibold')}>{c.otherName}</h3>
                            <span className={'text-[12px] shrink-0 ' + (c.unread ? 'text-[#795900] font-semibold' : 'text-[#817661]')}>{when(c.lastAt)}</span>
                          </div>
                          <p className="text-[12px] text-[#817661] truncate mt-0.5">
                            {c.listing?.title} · {c.role === 'buying' ? 'Buying' : 'Selling'}{sold ? ' · Sold' : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className={'text-[14px] truncate flex-1 ' + (c.unread ? 'text-[#1c1c19] font-semibold' : 'text-[#4f4633]')}>
                              {c.lastMine ? 'You: ' : ''}{preview(c.lastText)}
                            </p>
                            {c.unread && <span aria-label="Unread" className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] shrink-0" />}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  )
}