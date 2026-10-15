'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'

function timeLabel(iso: string) {
  const d = new Date(iso)
  if (d.toDateString() === new Date().toDateString()) {
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function InboxPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations', { cache: 'no-store' })
      if (!res.ok) { setError('Could not load your messages.'); setLoading(false); return }
      const d = await res.json()
      setItems(Array.isArray(d.conversations) ? d.conversations : [])
      setError('')
    } catch {
      setError('Could not connect. Please try again.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { setLoading(false); return }
    load()
    const t = setInterval(() => { if (document.visibilityState === 'visible') load() }, 10000)
    return () => clearInterval(t)
  }, [isLoaded, isSignedIn, load])

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased flex flex-col min-h-screen">
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(45,30,18,0.04)]">
        <div className="h-16 px-gutter flex items-center gap-space-sm max-w-xl mx-auto">
          <button aria-label="Back" onClick={() => router.push('/marketplace')} className="w-11 h-11 flex items-center justify-center -ml-space-xs rounded-full text-on-surface hover:bg-surface-container active:scale-95 transition-all">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h1 className="font-headline-md text-headline-md text-on-surface">Messages</h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto pt-16 pb-10 px-gutter">
        <div className="pt-space-md">
          {isLoaded && !isSignedIn ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
              <span className="material-symbols-outlined text-[40px] text-primary">lock</span>
              <h2 className="font-headline-sm text-headline-sm mt-2 mb-1">Sign in to see your messages</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Chats with buyers and sellers are private.</p>
              <SignInButton mode="modal">
                <button className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-6 py-3 rounded-xl shadow-md">Sign in</button>
              </SignInButton>
            </div>
          ) : loading ? (
            <div className="flex flex-col gap-2">
              {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-surface-container animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
              <p className="font-body-md text-body-md text-error mb-3 font-semibold">{error}</p>
              <button onClick={() => { setLoading(true); load() }} className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-5 py-2.5 rounded-xl">Try again</button>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
              <span className="material-symbols-outlined text-[40px] text-primary">forum</span>
              <h2 className="font-headline-sm text-headline-sm mt-2 mb-1">No messages yet</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Chat with a seller from any book in the marketplace.</p>
              <button onClick={() => router.push('/marketplace')} className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-6 py-3 rounded-xl shadow-md">Browse books</button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((c: any) => {
                const img = c.listing?.images?.[0]
                return (
                  <button key={c.id} onClick={() => router.push('/messages/' + c.id)} className="w-full text-left bg-surface-container-lowest rounded-2xl p-3 shadow-sm flex items-center gap-3 active:scale-[0.99] transition-transform">
                    <div className="w-12 h-14 rounded-lg bg-primary-fixed/60 overflow-hidden shrink-0 flex items-center justify-center text-[24px]">
                      {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <span>{c.listing?.emoji || '📚'}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={'font-label-lg text-label-lg truncate ' + (c.unread ? 'font-bold text-on-surface' : 'font-semibold text-on-surface')}>{c.otherName}</span>
                          <span className="font-label-micro text-[10px] uppercase tracking-wider bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded-full shrink-0">{c.role === 'buying' ? 'Buying' : 'Selling'}</span>
                        </div>
                        <span className="font-body-sm text-[12px] text-outline shrink-0">{timeLabel(c.lastAt)}</span>
                      </div>
                      <p className="font-body-sm text-[12px] text-primary font-semibold truncate">{c.listing?.title}{c.listing?.sold ? ' · Sold' : ''}</p>
                      <div className="flex items-center justify-between gap-2">
                        <p className={'font-body-sm text-body-sm truncate ' + (c.unread ? 'text-on-surface font-semibold' : 'text-on-surface-variant')}>{c.lastMine ? 'You: ' : ''}{c.lastText}</p>
                        {c.unread && <span className="w-2.5 h-2.5 rounded-full bg-primary-container shrink-0" aria-label="Unread" />}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}