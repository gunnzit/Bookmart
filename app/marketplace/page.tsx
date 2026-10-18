'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk, SignInButton } from '@clerk/nextjs'

const SHADOW = 'shadow-[0_6px_20px_rgba(120,70,40,0.08)]'

const CATS = ['All', 'textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']
const SORTS = ['Newest', 'Cheapest', 'Most expensive', 'Active only']
const AREAS = ['All areas', 'Chandigarh', 'Mohali', 'Panchkula']
const CONDS = ['New', 'Good', 'Fair']

function areaMatch(location: string, area: string) {
  const loc = (location || '').toLowerCase()
  if (area === 'Chandigarh') return loc.includes('chandigarh') || loc.includes('chd') || loc.includes('sector') || loc.includes('sec ')
  return loc.includes(area.toLowerCase())
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export default function Marketplace() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const { openSignIn } = useClerk()

  const [listings, setListings] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('All')
  const [area, setArea] = useState('All areas')
  const [sortBy, setSortBy] = useState('Newest')
  const [under150, setUnder150] = useState(false)
  const [cond, setCond] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unread, setUnread] = useState(0)
  const [chatBusy, setChatBusy] = useState('')
  const [saved, setSaved] = useState<Set<string>>(new Set())

  // Search text carried over from the Home page (?q=...)
  useEffect(() => {
    try {
      const qq = new URLSearchParams(window.location.search).get('q')
      if (qq) setSearch(qq)
    } catch {}
  }, [])

  // Keep the user record in sync
  useEffect(() => {
    if (isSignedIn && user) {
      fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id, name: user.fullName, email: user.primaryEmailAddress?.emailAddress }),
      }).catch(() => {})
    }
  }, [isSignedIn, user])

  // Unread message count for the header icon
  useEffect(() => {
    if (!isSignedIn) { setUnread(0); return }
    let stop = false
    async function loadUnread() {
      if (document.visibilityState !== 'visible') return
      try {
        const res = await fetch('/api/chat/conversations', { cache: 'no-store' })
        if (!res.ok) return
        const d = await res.json()
        if (!stop) setUnread(Number(d.unreadCount) || 0)
      } catch {}
    }
    loadUnread()
    const t = setInterval(loadUnread, 30000)
    return () => { stop = true; clearInterval(t) }
  }, [isSignedIn])

  // Which books this person has saved
  useEffect(() => {
    if (!isSignedIn || !user) { setSaved(new Set()); return }
    fetch('/api/wishlist?userId=' + user.id)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSaved(new Set(d.map((w: any) => w.listingId))) })
      .catch(() => {})
  }, [isSignedIn, user])

  // Load listings, and refresh quietly when the tab becomes visible again
  useEffect(() => {
    let first = true
    function load() {
      fetch('/api/listings?t=' + Date.now(), { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d)) { setListings(d); setError('') }
          else if (first) setError('Could not load listings')
        })
        .catch(() => { if (first) setError('Could not connect. Check your internet and try again.') })
        .finally(() => { first = false; setLoading(false) })
    }
    load()
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Only live listings (sold ones still show, with a Sold mark)
  const visible = listings.filter((l: any) => !l.status || l.status === 'active')

  const filtered = visible
    .filter((l: any) => {
      const q = search.toLowerCase().trim()
      const matchSearch = !q
        || (l.title || '').toLowerCase().includes(q)
        || (l.subtitle || '').toLowerCase().includes(q)
        || (l.category || '').toLowerCase().includes(q)
        || (l.location || '').toLowerCase().includes(q)
        || (l.condition || '').toLowerCase().includes(q)
      return (cat === 'All' || l.category === cat)
        && matchSearch
        && (sortBy !== 'Active only' || !l.sold)
        && (area === 'All areas' || areaMatch(l.location, area))
        && (!under150 || Number(l.price) <= 150)
        && (!cond || l.condition === cond)
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'Cheapest') return a.price - b.price
      if (sortBy === 'Most expensive') return b.price - a.price
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const activeCount = visible.filter((l: any) => !l.sold).length
  const sheetFilters = (sortBy !== 'Newest' ? 1 : 0) + (under150 ? 1 : 0) + (cond ? 1 : 0)
  const anyFilter = cat !== 'All' || area !== 'All areas' || !!search || sheetFilters > 0

  function clearAll() {
    setCat('All'); setArea('All areas'); setSearch(''); setSortBy('Newest'); setUnder150(false); setCond(null)
  }

  async function toggleHeart(l: any, e: React.MouseEvent) {
    e.stopPropagation()
    if (!isSignedIn || !user) { openSignIn(); return }
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, listingId: l.id }),
      })
      const d = await res.json()
      setSaved(prev => {
        const next = new Set(prev)
        if (d.saved) next.add(l.id); else next.delete(l.id)
        return next
      })
    } catch {}
  }

  async function startChat(listingId: string) {
    if (chatBusy) return
    setChatBusy(listingId)
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok && d.id) { router.push('/messages/' + d.id); return }
      alert(typeof d.error === 'string' && d.error.length < 120 ? d.error : 'Could not start the chat. Please try again.')
    } catch {
      alert('Could not start the chat. Please check your connection.')
    }
    setChatBusy('')
  }

  function openChat(l: any, e: React.MouseEvent) {
    e.stopPropagation()
    if (!isSignedIn) { openSignIn(); return }
    if (user?.id === l.sellerId) { router.push('/listing/' + l.id); return }
    startChat(l.id)
  }

  function goSell() {
    if (!isSignedIn) { openSignIn(); return }
    router.push('/sell')
  }

  const iconBtn = 'relative w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1E1B19] active:scale-90 transition-transform ' + SHADOW
  const chip = (on: boolean) => 'px-4 py-2 rounded-full text-[13px] whitespace-nowrap shrink-0 active:scale-95 transition-transform ' + (on ? 'bg-[#E8632B] text-white font-semibold ' : 'bg-white text-[#1E1B19] font-medium ') + SHADOW
  const sheetPill = (on: boolean) => 'px-3.5 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-colors active:scale-95 ' + (on ? 'bg-[#E8632B] text-white font-semibold' : 'bg-[#FFF1EA] text-[#1E1B19] font-medium')

  return (
    <div
      className="min-h-screen text-[#1E1B19] antialiased font-['Plus_Jakarta_Sans',sans-serif]"
      style={{ background: 'linear-gradient(180deg, #FDEADF 0%, #FFF7F2 100%)' }}
    >
      {/* Filter sheet */}
      {filterOpen && (
        <div className="fixed inset-0 z-[400] bg-black/45 flex items-end md:items-center justify-center" onClick={() => setFilterOpen(false)}>
          <div className="bg-white rounded-t-[28px] md:rounded-[28px] p-6 w-full max-w-md shadow-[0_-10px_35px_rgba(30,27,25,0.2)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 rounded-full bg-[#F0E2DA] mx-auto mb-4 md:hidden" />
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h3 className="text-[18px] font-bold">Sort and filter</h3>
                <p className="text-[13px] text-[#9A908A] mt-0.5">{filtered.length} {filtered.length === 1 ? 'book' : 'books'} match</p>
              </div>
              <button aria-label="Close" onClick={() => setFilterOpen(false)} className="w-9 h-9 rounded-full bg-[#FFF1EA] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <p className="text-[13px] font-semibold mb-2">Sort by</p>
                <div className="flex flex-wrap gap-2">
                  {SORTS.map(s => <button key={s} onClick={() => setSortBy(s)} className={sheetPill(sortBy === s)}>{s}</button>)}
                </div>
              </div>
              <div>
                <p className="text-[13px] font-semibold mb-2">Price</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setUnder150(v => !v)} className={sheetPill(under150)}>Under ₹150</button>
                </div>
              </div>
              <div>
                <p className="text-[13px] font-semibold mb-2">Condition</p>
                <div className="flex flex-wrap gap-2">
                  {CONDS.map(c => <button key={c} onClick={() => setCond(cond === c ? null : c)} className={sheetPill(cond === c)}>{c}</button>)}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 mt-7">
              <button onClick={() => { setSortBy('Newest'); setUnder150(false); setCond(null) }} className="h-[52px] px-6 rounded-full bg-white border border-[#F0E2DA] text-[15px] font-semibold active:scale-95 transition-transform">Clear</button>
              <button onClick={() => setFilterOpen(false)} className="flex-1 h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full active:scale-[0.98] transition-transform">
                Show {filtered.length} {filtered.length === 1 ? 'book' : 'books'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="w-full max-w-md md:max-w-5xl mx-auto px-5 pb-36 flex flex-col gap-5" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>

        {/* 1. App bar */}
        <header className="flex items-center justify-between">
          <a href="/" className="text-[26px] font-extrabold tracking-tight leading-none active:scale-95 transition-transform">
            Page<span className="text-[#E8632B]">plus</span>
          </a>
          <div className="flex items-center gap-2.5">
            <nav className="hidden md:flex items-center gap-1 mr-2">
              <a href="/" className="px-3 py-2 rounded-full text-[14px] font-medium text-[#5E5650] hover:text-[#1E1B19]">Home</a>
              <a href="/school-sets" className="px-3 py-2 rounded-full text-[14px] font-medium text-[#5E5650] hover:text-[#1E1B19]">Sets</a>
              <a href="/requests" className="px-3 py-2 rounded-full text-[14px] font-medium text-[#5E5650] hover:text-[#1E1B19]">Requests</a>
            </nav>
            <button aria-label={unread > 0 ? 'Messages, ' + unread + ' unread' : 'Messages'} onClick={() => router.push('/messages')} className={iconBtn}>
              <span className="material-symbols-outlined text-[20px]">forum</span>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E8632B] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-[#FFF7F2]">{unread > 9 ? '9+' : unread}</span>
              )}
            </button>
            <button aria-label="Saved books" onClick={() => router.push('/wishlist')} className={iconBtn}>
              <span className="material-symbols-outlined text-[20px]">favorite</span>
            </button>
            {isSignedIn ? (
              <button aria-label="Profile" onClick={() => router.push('/profile')} className={iconBtn}>
                <span className="material-symbols-outlined text-[20px]">person</span>
              </button>
            ) : (
              <SignInButton mode="modal">
                <button aria-label="Sign in" className={iconBtn}>
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </button>
              </SignInButton>
            )}
          </div>
        </header>

        {/* 2. Search */}
        <div className={'flex items-center w-full h-12 bg-white rounded-full pl-4 pr-1.5 gap-2.5 ' + SHADOW}>
          <span className="material-symbols-outlined text-[20px] text-[#9A908A] shrink-0">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search NCERT, RD Sharma, Class 10…"
            type="text"
            className="flex-1 min-w-0 bg-transparent text-[14px] text-[#1E1B19] placeholder:text-[#9A908A] focus:outline-none"
          />
          {search && (
            <button aria-label="Clear search" onClick={() => setSearch('')} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[#9A908A]">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <button aria-label="Sort and filter" onClick={() => setFilterOpen(true)} className="relative w-9 h-9 rounded-full bg-[#FFF1EA] flex items-center justify-center text-[#1E1B19] shrink-0 active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-[18px]">tune</span>
            {sheetFilters > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E8632B] ring-2 ring-[#FFF1EA]" />}
          </button>
        </div>

        {/* 3. Sell card */}
        <section className={'bg-white rounded-[22px] p-3.5 flex items-center justify-between gap-3 ' + SHADOW}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#FCE3D6] text-[#E8632B] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold leading-tight">Sell your old books</h2>
              <p className="text-[12px] text-[#9A908A] mt-0.5">Free to list · You keep the full price</p>
            </div>
          </div>
          <button onClick={goSell} className="px-4 py-2.5 rounded-full bg-[#E8632B] text-white text-[14px] font-bold flex items-center gap-1 shrink-0 shadow-[0_4px_14px_rgba(232,99,43,0.35)] active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-[18px]">add</span>Sell
          </button>
        </section>

        {/* 4. Category chips and meetup area */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2 overflow-x-auto -mx-5 px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} className={chip(cat === c)}>{c === 'All' ? 'All' : cap(c)}</button>
            ))}
          </div>
          <div>
            <p className="text-[12px] text-[#9A908A] mb-2 px-0.5">Meetup area</p>
            <div className="flex items-center gap-2 overflow-x-auto -mx-5 px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
              {AREAS.map(a => (
                <button key={a} onClick={() => setArea(a)} className={chip(area === a)}>{a}</button>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Books */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="text-[17px] font-bold">Books in your neighbourhood</h1>
            <span className="text-[13px] text-[#5E5650] shrink-0">
              {loading ? '…' : anyFilter ? filtered.length + ' found' : activeCount + ' available'}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-72 rounded-[22px] bg-white/60 animate-pulse" />)}
            </div>
          ) : error ? (
            <div className={'bg-white rounded-[22px] p-6 text-center ' + SHADOW}>
              <p className="text-[14px] text-[#5E5650] mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-[#E8632B] text-white text-[14px] font-semibold rounded-full active:scale-95 transition-transform">Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className={'bg-white rounded-[22px] p-6 text-center ' + SHADOW}>
              <h2 className="text-[16px] font-bold mb-1">Nothing found</h2>
              <p className="text-[14px] text-[#5E5650] mb-4">Try a different search or filter, or ask for the book you need.</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {anyFilter && <button onClick={clearAll} className="px-5 py-2.5 bg-[#E8632B] text-white text-[14px] font-semibold rounded-full active:scale-95 transition-transform">Clear filters</button>}
                <button onClick={() => router.push('/requests')} className={'px-5 py-2.5 bg-white text-[14px] font-semibold rounded-full active:scale-95 transition-transform ' + SHADOW}>Request this book</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((l: any) => {
                const isSaved = saved.has(l.id)
                const sold = !!l.sold
                const seller = l.seller?.name ? String(l.seller.name).split(' ')[0] : ''
                const place = (l.location || '').split(',')[0]
                const metaLine = [seller, place].filter(Boolean).join(' • ')
                return (
                  <div key={l.id} onClick={() => router.push('/listing/' + l.id)} className={'bg-white rounded-[22px] p-3 flex flex-col justify-between cursor-pointer ' + SHADOW}>
                    <div>
                      <div className="relative w-full aspect-[4/5] rounded-[18px] overflow-hidden mb-2.5 bg-[#FFF1EA] flex items-center justify-center text-[40px]">
                        {l.images?.[0] ? <img src={l.images[0]} alt={l.title} className={'w-full h-full object-cover ' + (sold ? 'opacity-60' : '')} /> : <span>{l.emoji || '📚'}</span>}
                        {l.featured && !sold && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/95 text-[11px] font-semibold flex items-center gap-0.5 shadow-sm">
                            <span className="material-symbols-outlined text-[12px] text-[#F5B82E]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>Featured
                          </span>
                        )}
                        <button aria-label={isSaved ? 'Remove from saved' : 'Save book'} onClick={e => toggleHeart(l, e)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform shadow-[0_2px_10px_rgba(120,70,40,0.14)]">
                          <span className="material-symbols-outlined text-[16px]" style={{ color: isSaved ? '#E8632B' : '#9A908A', fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                        </button>
                        {l.condition && !sold && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-white/95 text-[11px] font-semibold shadow-sm">{l.condition}</span>
                        )}
                        {sold && (
                          <div className="absolute inset-0 bg-[#1E1B19]/35 flex items-center justify-center">
                            <span className="px-3 py-1 rounded-full bg-white text-[12px] font-bold">Sold</span>
                          </div>
                        )}
                      </div>
                      <h3 className={'text-[13px] font-bold leading-tight line-clamp-2 ' + (sold ? 'text-[#9A908A]' : '')}>{l.title}</h3>
                      {metaLine && <p className="text-[12px] text-[#9A908A] mt-1 truncate">{metaLine}</p>}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className={'text-[15px] font-extrabold ' + (sold ? 'text-[#9A908A]' : '')}>{Number(l.price) === 0 ? 'Free' : '₹' + l.price}</span>
                        {Number(l.origPrice) > Number(l.price) && <span className="text-[12px] text-[#9A908A] line-through">₹{l.origPrice}</span>}
                      </div>
                      <button aria-label="Chat to buy" disabled={sold || !!chatBusy} onClick={e => openChat(l, e)}
                        className="w-8 h-8 rounded-full bg-[#E8632B] text-white flex items-center justify-center shrink-0 active:scale-90 transition-transform shadow-[0_3px_10px_rgba(232,99,43,0.35)] disabled:opacity-40 disabled:shadow-none">
                        <span className={"material-symbols-outlined text-[17px] " + (chatBusy === l.id ? "animate-spin" : "")}>{chatBusy === l.id ? "progress_activity" : "chat_bubble"}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 6. How it works */}
        <section className={'bg-white rounded-[22px] p-5 flex flex-col gap-4 ' + SHADOW}>
          <h2 className="text-[15px] font-bold">How buying works</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: 'forum', t: 'Chat', s: 'Message the seller in the app' },
              { icon: 'handshake', t: 'Meet nearby', s: 'Check the book in person' },
              { icon: 'payments', t: 'Pay when happy', s: 'Pay the seller directly' },
            ].map(x => (
              <div key={x.t} className="flex flex-col items-center text-center gap-1.5">
                <div className="w-9 h-9 rounded-full bg-[#FFF1EA] flex items-center justify-center text-[#E8632B]">
                  <span className="material-symbols-outlined text-[18px]">{x.icon}</span>
                </div>
                <span className="text-[12px] font-semibold leading-tight">{x.t}</span>
                <span className="text-[11px] text-[#9A908A] leading-snug">{x.s}</span>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-[#9A908A]">Every listing is checked by our team before it goes live.</p>
        </section>

        <button onClick={() => router.push('/requests')} className="self-center text-[13px] font-semibold text-[#C4501A] active:opacity-70">
          Can&apos;t find your book? Ask for it
        </button>
      </main>
    </div>
  )
}