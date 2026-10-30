'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export type Conv = {
  id: string
  role: 'buying' | 'selling'
  otherName: string
  listing: { id: string; title: string; images: string[]; emoji?: string | null; sold: boolean }
  lastText: string | null
  lastAt: string
  lastMine: boolean
  unread: boolean
}

export type ConvStatus = 'loading' | 'ready' | 'error'
export type ConvTab = 'all' | 'buying' | 'selling'

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

// Fetches the conversation list and refreshes it every 10 seconds while the tab is visible.
export function useConversations(enabled: boolean) {
  const [rows, setRows] = useState<Conv[]>([])
  const [status, setStatus] = useState<ConvStatus>('loading')

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
    if (!enabled) return
    load(true)
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(false) }, 10000)
    return () => clearInterval(t)
  }, [enabled])

  return { rows, status, reload: load }
}

// Filter chips, loading and empty states and the conversation rows. activeId highlights a row on desktop only.
export function ConversationList({ rows, status, reload, tab, setTab, activeId }: {
  rows: Conv[]
  status: ConvStatus
  reload: (showLoading: boolean) => void
  tab: ConvTab
  setTab: (t: ConvTab) => void
  activeId?: string
}) {
  const router = useRouter()
  const mainBtn = 'w-full h-[52px] bg-[#fbbf24] text-[#6c4f00] text-[15px] font-bold shadow-[0_4px_14px_rgba(251,191,36,0.35)] rounded-full active:scale-[0.98] transition-transform'
  const shown = rows.filter(r => tab === 'all' || r.role === tab)
  const chips: { key: ConvTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'buying', label: 'Buying' },
    { key: 'selling', label: 'Selling' },
  ]

  return (
    <>
      <div className="flex gap-2 mb-4 overflow-x-auto -mx-5 px-5 lg:mx-0 lg:px-0" style={{ scrollbarWidth: 'none' }}>
        {chips.map(c => (
          <button key={c.key} onClick={() => setTab(c.key)}
            className={'shrink-0 h-9 px-4 rounded-full text-[13px] font-semibold transition-colors ' + (tab === c.key ? 'bg-[#fbbf24] text-[#6c4f00] lg:bg-[#F7CF65]' : 'bg-white text-[#1c1c19] ' + SHADOW)}>
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
          <button onClick={() => reload(true)} className={mainBtn}>Try again</button>
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
                  className={'w-full text-left bg-white rounded-[2rem] p-3 flex items-center gap-3 active:scale-[0.99] transition-transform lg:rounded-2xl lg:border lg:hover:bg-[#faf7f1] ' + SHADOW + (activeId === c.id ? ' lg:border-[#F7CF65] lg:ring-2 lg:ring-[#F7CF65]/60' : ' lg:border-stone-200')}>
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
  )
}

// Desktop-only left pane for the open chat page. Fetches only on lg+ so phones make no extra requests.
export function DesktopConversationPane({ activeId }: { activeId?: string }) {
  const { isLoaded, isSignedIn } = useUser()
  const [wide, setWide] = useState(false)
  const [tab, setTab] = useState<ConvTab>('all')

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setWide(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const { rows, status, reload } = useConversations(wide && isLoaded && !!isSignedIn)
  const unread = rows.filter(r => r.unread).length

  return (
    <aside aria-label="Conversations" className="hidden lg:block w-[340px] shrink-0 sticky top-[84px] self-start max-h-[calc(100vh-100px)] overflow-y-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[22px] font-black tracking-tight">Messages</h2>
        {unread > 0 && <span className="text-[12px] text-[#795900] font-semibold">{unread} new</span>}
      </div>
      <ConversationList rows={rows} status={status} reload={reload} tab={tab} setTab={setTab} activeId={activeId} />
    </aside>
  )
}
