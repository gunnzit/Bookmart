'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'

const SHADOW = 'shadow-[0_6px_20px_rgba(28,28,25,0.08)]'
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
const firstName = (n?: string | null) => String(n || '').trim().split(/\s+/)[0] || ''

type Filter = 'all' | 'available' | 'unavailable'

export default function WishlistPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [chatBusy, setChatBusy] = useState('')
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || !user) { setLoading(false); return }
    fetch('/api/wishlist?userId=' + user.id, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) { setItems(data.filter((i: any) => i.listing)); setError('') }
        else setError('Could not load your saved books.')
      })
      .catch(() => setError('Could not connect. Check your internet and try again.'))
      .finally(() => setLoading(false))
  }, [isLoaded, isSignedIn, user])

  const gone = (l: any) => !!l.sold || (!!l.status && l.status !== 'active')

  async function toggle(listingId: string) {
    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, listingId }),
    })
    return res.ok
  }

  async function removeOne(listingId: string) {
    if (removing) return
    setRemoving(listingId)
    try {
      if (await toggle(listingId)) setItems(prev => prev.filter(i => i.listingId !== listingId))
    } catch {}
    setRemoving(null)
  }

  async function clearUnavailable() {
    const ids = items.filter(i => gone(i.listing)).map(i => i.listingId)
    if (!ids.length || clearing) return
    setClearing(true)
    try {
      const results = await Promise.all(ids.map(id => toggle(id).then(ok => (ok ? id : null)).catch(() => null)))
      const done = new Set(results.filter(Boolean) as string[])
      setItems(prev => prev.filter(i => !done.has(i.listingId)))
      setFilter('all')
    } catch {}
    setClearing(false)
  }

  async function startChat(l: any) {
    if (chatBusy) return
    if (user?.id === l.sellerId) { router.push('/listing/' + l.id); return }
    setChatBusy(l.id)
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: l.id }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok && d.id) { router.push('/messages/' + d.id); return }
      alert(typeof d.error === 'string' && d.error.length < 120 ? d.error : 'Could not start the chat. Please try again.')
    } catch {
      alert('Could not start the chat. Please check your connection.')
    }
    setChatBusy('')
  }

  const availableCount = items.filter(i => !gone(i.listing)).length
  const goneCount = items.length - availableCount
  const shown = items.filter(i => (filter === 'all' ? true : filter === 'available' ? !gone(i.listing) : gone(i.listing)))

  const pageCls = "min-h-screen text-[#1c1c19] antialiased font-['Plus_Jakarta_Sans',sans-serif]"
  const pageStyle = { background: '#fcf9f4' }
  const mainBtn = 'w-full h-[52px] bg-[#fbbf24] text-[#6c4f00] text-[15px] font-bold shadow-[0_4px_14px_rgba(251,191,36,0.35)] rounded-full active:scale-[0.98] transition-transform'
  const chip = (on: boolean) => 'whitespace-nowrap px-4 py-2 rounded-full text-[12px] shrink-0 active:scale-95 transition-transform ' + (on ? 'bg-[#fbbf24] text-[#6c4f00] font-semibold ' : 'bg-white text-[#1c1c19] font-medium ') + SHADOW

  const chips: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All (' + items.length + ')' },
    { key: 'available', label: 'Available (' + availableCount + ')' },
    ...(goneCount > 0 ? [{ key: 'unavailable' as Filter, label: 'Sold (' + goneCount + ')' }] : []),
  ]

  return (
    <div className={pageCls} style={pageStyle}>
      {/* Top bar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#fcf9f4]/85 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="h-16 px-5 flex items-center justify-between gap-3 max-w-md md:max-w-3xl mx-auto">
          <div className="flex items-center gap-2 min-w-0">
            <button aria-label="Back" onClick={() => (window.history.length > 1 ? router.back() : router.push('/marketplace'))}
              className={'w-10 h-10 rounded-full bg-[#f0ede9] flex items-center justify-center active:scale-95 transition-transform shrink-0'}>
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <h1 className="text-[20px] font-bold ml-1 truncate">Wishlist</h1>
          </div>
          {isSignedIn && (
            <button aria-label="Profile" onClick={() => router.push('/profile')} className="w-8 h-8 rounded-full bg-[#fbbf24] text-[#6c4f00] flex items-center justify-center shrink-0 active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </button>
          )}
        </div>
      </header>

      <main className="w-full max-w-md md:max-w-3xl mx-auto pb-16" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)' }}>

        {isLoaded && !isSignedIn ? (
          <div className="px-5 mt-6">
            <div className={'bg-white rounded-[2rem] p-7 text-center ' + SHADOW}>
              <h2 className="text-[20px] font-bold mb-1">Sign in to see your saved books</h2>
              <p className="text-[14px] text-[#4f4633] mb-6">Tap the heart on any book to keep it here for later.</p>
              <SignInButton mode="modal"><button className={mainBtn}>Sign in</button></SignInButton>
            </div>
          </div>
        ) : loading ? (
          <div className="px-5 flex flex-col gap-4">
            {[0, 1, 2].map(i => <div key={i} className="h-[170px] rounded-[2rem] bg-white/70 animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="px-5 mt-4">
            <div className={'bg-white rounded-[2rem] p-6 text-center ' + SHADOW}>
              <p className="text-[14px] text-[#4f4633] mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className={mainBtn}>Try again</button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 mt-4">
            <div className={'bg-white rounded-[2rem] p-8 text-center ' + SHADOW}>
              <h2 className="text-[15px] font-semibold mb-1">Nothing saved yet</h2>
              <p className="text-[14px] text-[#4f4633] mb-5">Tap the heart on any book to save it here.</p>
              <button onClick={() => router.push('/marketplace')} className={mainBtn}>Browse books</button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary line */}
            <div className="px-5 pt-1 pb-2 flex items-center justify-between gap-3">
              <p className="text-[14px] text-[#4f4633]">
                {items.length} saved {items.length === 1 ? 'book' : 'books'}
                {goneCount > 0 && <span className="text-[#817661]"> · {goneCount} sold</span>}
              </p>
              {goneCount > 0 && (
                <button onClick={clearUnavailable} disabled={clearing} className="text-[12px] text-[#817661] flex items-center gap-1 active:scale-95 transition-transform shrink-0 disabled:opacity-50">
                  <span>{clearing ? 'Clearing…' : 'Clear sold'}</span>
                  <span className="material-symbols-outlined text-[15px]">cleaning_services</span>
                </button>
              )}
            </div>

            {/* Filter chips */}
            <div className="w-full overflow-x-auto px-5 pb-4 pt-1 flex items-center gap-2" style={{ scrollbarWidth: 'none' }}>
              {chips.map(c => <button key={c.key} onClick={() => setFilter(c.key)} className={chip(filter === c.key)}>{c.label}</button>)}
            </div>

            {/* Saved books */}
            {shown.length === 0 ? (
              <p className="text-center text-[14px] text-[#4f4633] py-10 px-5">No {filter === 'available' ? 'available' : 'sold'} books in your wishlist.</p>
            ) : (
              <div className="px-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {shown.map(item => {
                  const l = item.listing
                  const isGone = gone(l)
                  const sold = !!l.sold
                  const seller = firstName(l.seller?.name)
                  const place = String(l.location || '').split(',')[0]
                  const sub = [cap(l.category || ''), l.condition].filter(Boolean).join(' · ')
                  const meta = [seller, place].filter(Boolean).join(' · ')
                  const priceText = Number(l.price) === 0 ? 'Free' : '₹' + Number(l.price).toLocaleString('en-IN')
                  const isRemoving = removing === l.id
                  return (
                    <article key={item.id} onClick={() => router.push('/listing/' + l.id)}
                      className={'p-4 rounded-[2rem] flex gap-4 items-center cursor-pointer ' + (isGone ? 'bg-white/75 shadow-[0_6px_20px_rgba(28,28,25,0.05)]' : 'bg-white ' + SHADOW)}>
                      <div className="relative w-24 h-32 rounded-[1rem] overflow-hidden bg-[#f0ede9] shrink-0 flex items-center justify-center text-[36px]">
                        {l.images?.[0]
                          ? <img src={l.images[0]} alt={l.title} className={'w-full h-full object-cover ' + (isGone ? 'opacity-60 grayscale-[30%]' : '')} />
                          : <span>{l.emoji || '📚'}</span>}
                        {isGone && <span className="absolute inset-0 flex items-center justify-center text-[12px] font-semibold bg-white/40">{sold ? 'Sold' : 'Unavailable'}</span>}
                        <button aria-label="Remove from wishlist" disabled={isRemoving} onClick={e => { e.stopPropagation(); removeOne(l.id) }}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#795900] shadow-sm active:scale-90 transition-transform disabled:opacity-60">
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                        </button>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between h-32 py-0.5">
                        <div>
                          <h2 className={'text-[15px] font-semibold leading-tight line-clamp-2 ' + (isGone ? 'text-[#4f4633]' : '')}>{l.title}</h2>
                          {sub && <p className="text-[12px] text-[#817661] truncate mt-0.5">{sub}</p>}
                          <div className="mt-1 flex items-baseline gap-1.5">
                            <span className={'text-[16px] font-bold ' + (isGone ? 'text-[#4f4633]' : '')}>{priceText}</span>
                            {Number(l.origPrice) > Number(l.price) && <span className="text-[12px] text-[#817661] line-through">₹{Number(l.origPrice).toLocaleString('en-IN')}</span>}
                          </div>
                        </div>
                        <div>
                          {meta && <p className="text-[12px] text-[#4f4633] truncate">{meta}</p>}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            {isGone ? (
                              <span className="text-[12px] text-[#817661]">{sold ? 'Sold' : 'Not available'}</span>
                            ) : (
                              <span className="text-[12px] text-[#2E8B57] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#2E8B57]" />Available</span>
                            )}
                            {!isGone && (
                              <button aria-label="Chat to buy" disabled={!!chatBusy} onClick={e => { e.stopPropagation(); startChat(l) }}
                                className="w-10 h-10 rounded-full bg-[#fbbf24] text-[#6c4f00] shadow-[0_4px_12px_rgba(251,191,36,0.3)] flex items-center justify-center active:scale-95 transition-transform shrink-0 disabled:opacity-60">
                                <span className={'material-symbols-outlined text-[20px] ' + (chatBusy === l.id ? 'animate-spin' : '')}>{chatBusy === l.id ? 'progress_activity' : 'chat_bubble'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}