'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk, SignInButton } from '@clerk/nextjs'
import { schools, isRegister } from '@/lib/kit-prices'
import LocationSheet, { useDeliveryPlace } from '@/components/LocationSheet'
import { SETS_OPEN } from '@/lib/features'

// ── Contact (change here only) ────────────────────────────────────────────
const WHATSAPP_NUMBER = '918872235738'
const WA_HELP_LINK = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent('Hi, I need help with a school book set on Pageplus')

// ── Photos (put your own files in public/photos) ──────────────────────────
const HERO_PHOTO = '/photos/hero.jpg'
const STORE_PHOTO = '/photos/store.jpg'

const SHADOW = 'shadow-[0_6px_20px_rgba(120,70,40,0.08)]'

const HOME_CATS = [
  { key: 'textbook', label: 'Textbooks' },
  { key: 'novel', label: 'Novels' },
  { key: 'competitive', label: 'Competitive' },
  { key: 'stationery', label: 'Stationery' },
]

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const first = (n?: string | null) => String(n || '').trim().split(/\s+/)[0] || ''
const priceText = (p: any) => (Number(p) === 0 ? 'Free' : '₹' + p)

const SHORT_NAME: Record<string, string> = {
  'Delhi Public School': 'DPS Sector 40-C',
  'Shivalik Public School': 'Shivalik Public',
}

// Same default selection rules as the School Sets page (so the price matches)
function kitSummary(school: string, cls: number) {
  const kit = schools[school]?.[cls]
  if (!kit) return { total: 0, books: 0, notebooks: 0 }
  let total = 0
  let books = 0
  let notebooks = 0
  for (const sec of ['ncert', 'pvt'] as const) {
    for (const it of kit[sec]) {
      if (!it.oos && !it.optional) { total += it.price; books++ }
    }
  }
  for (const it of kit.stationery) {
    if (!it.oos) total += it.price
  }
  for (const n of kit.notebooks) {
    if (!n.oos) { total += (isRegister(n.name) ? 68 : 50) * n.qty; notebooks += n.qty }
  }
  return { total, books, notebooks }
}

export default function HomePage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const { openSignIn } = useClerk()
  const pickerRef = useRef<HTMLDivElement>(null)

  const [search, setSearch] = useState('')
  const [school, setSchool] = useState('Shivalik Public School')
  const [cls, setCls] = useState(5)
  const [listings, setListings] = useState<any[]>([])
  const [chatBusy, setChatBusy] = useState('')
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [cart, setCart] = useState<{ selectedClass: number; items: string[]; kitSubtotal: number }[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [place, setPlace] = useDeliveryPlace()
  const [heroOk, setHeroOk] = useState(true)
  const [storeOk, setStoreOk] = useState(true)
  const [unread, setUnread] = useState(0)
  const [reqs, setReqs] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setListings(d.filter((l: any) => (!l.status || l.status === 'active') && !l.sold))
      })
      .catch(() => {})
    try {
      const raw = sessionStorage.getItem('buddybooks_cart')
      if (raw) setCart(JSON.parse(raw))
    } catch {}
  }, [])

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

  // The latest open book requests (public)
  useEffect(() => {
    fetch('/api/book-requests', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d?.requests)) setReqs(d.requests.filter((r: any) => r.status === 'open').slice(0, 3))
      })
      .catch(() => {})
  }, [isSignedIn])

  // Which books this person has already saved
  useEffect(() => {
    if (!isSignedIn || !user) { setSaved(new Set()); return }
    fetch('/api/wishlist?userId=' + user.id)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSaved(new Set(d.map((w: any) => w.listingId))) })
      .catch(() => {})
  }, [isSignedIn, user])

  const schoolNames = Object.keys(schools)
  const classes = Object.keys(schools[school]).map(Number).sort((a, b) => a - b)
  const summary = kitSummary(school, cls)
  const shortName = SHORT_NAME[school] || school
  const cartTotal = cart.reduce((sum, k) => sum + (k.kitSubtotal || 0), 0)

  const featured = listings.filter(l => l.featured).slice(0, 6)
  const others = listings.filter(l => !l.featured)
  const gridList = (others.length >= 2 ? others : listings).slice(0, 4)
  const free = listings.filter(l => Number(l.price) === 0).slice(0, 6)

  const placeLine = !place
    ? 'Choose your delivery area'
    : place.kind === 'pickup'
      ? 'Pickup from Sector 40-C'
      : 'Deliver to ' + place.area.split(',')[0]

  function pickSchool(name: string) {
    setSchool(name)
    const cl = Object.keys(schools[name]).map(Number).sort((a, b) => a - b)
    if (!cl.includes(cls)) setCls(cl[0])
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(search.trim() ? '/marketplace?q=' + encodeURIComponent(search.trim()) : '/marketplace')
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

  function chatButton(l: any) {
    return (
      <button aria-label="Chat to buy" disabled={!!chatBusy} onClick={e => openChat(l, e)} className="w-8 h-8 rounded-full bg-[#FFF1EA] text-[#E8632B] flex items-center justify-center shrink-0 active:scale-90 transition-transform disabled:opacity-60">
        <span className={'material-symbols-outlined text-[16px] ' + (chatBusy === l.id ? 'animate-spin' : '')}>{chatBusy === l.id ? 'progress_activity' : 'chat_bubble'}</span>
      </button>
    )
  }

  const iconBtn = 'relative w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1E1B19] active:scale-90 transition-transform ' + SHADOW

  return (
    <div
      className="min-h-screen text-[#1E1B19] antialiased font-['Plus_Jakarta_Sans',sans-serif]"
      style={{ background: 'linear-gradient(180deg, #FDEADF 0%, #FFF7F2 100%)' }}
    >
      <LocationSheet open={sheetOpen} onClose={() => setSheetOpen(false)} place={place} onSelect={setPlace} />

      <main className="w-full max-w-md md:max-w-3xl mx-auto px-5 pb-36 flex flex-col gap-5" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>

        {/* 1. App bar */}
        <header>
          <div className="flex items-center justify-between">
            <a href="/" className="text-[26px] font-extrabold tracking-tight leading-none active:scale-95 transition-transform">
              Page<span className="text-[#E8632B]">plus</span>
            </a>
            <div className="flex items-center gap-2.5">
              {SETS_OPEN && (
              <button aria-label="Kit bag" onClick={() => router.push('/school-sets')} className={iconBtn}>
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                {cart.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E8632B] ring-2 ring-white" />}
              </button>
              )}
              <button aria-label={unread > 0 ? 'Messages, ' + unread + ' unread' : 'Messages'} onClick={() => (isSignedIn ? router.push('/messages') : openSignIn())} className={iconBtn}>
                <span className="material-symbols-outlined text-[20px]">forum</span>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E8632B] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">{unread > 9 ? '9+' : unread}</span>
                )}
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
          </div>
          <button onClick={() => setSheetOpen(true)} className="flex items-center gap-1 text-[13px] font-medium text-[#5E5650] mt-1.5 active:opacity-70">
            <span>{placeLine}</span>
            <span className="material-symbols-outlined text-[16px] text-[#9A908A]">expand_more</span>
          </button>
        </header>

        {/* 2. Search */}
        <form onSubmit={handleSearch} className={'flex items-center w-full h-12 bg-white rounded-full pl-4 pr-1.5 gap-2.5 ' + SHADOW}>
          <span className="material-symbols-outlined text-[20px] text-[#9A908A] shrink-0">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search books, notebooks, class…"
            type="text"
            className="flex-1 min-w-0 bg-transparent text-[14px] text-[#1E1B19] placeholder:text-[#9A908A] focus:outline-none"
          />
          <button type="button" aria-label="Browse marketplace filters" onClick={() => router.push('/marketplace')} className="w-9 h-9 rounded-full bg-[#FFF1EA] flex items-center justify-center text-[#1E1B19] shrink-0 active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>
        </form>

        {/* 3. Category chips */}
        <section className="-mx-5 px-5 overflow-x-auto flex items-center gap-2 pb-1" style={{ scrollbarWidth: 'none' }}>
          {HOME_CATS.map(c => (
            <button key={c.key} onClick={() => router.push('/marketplace?cat=' + c.key)}
              className={'px-5 py-2 rounded-full text-[14px] font-medium bg-white text-[#1E1B19] whitespace-nowrap shrink-0 active:scale-95 transition-transform ' + SHADOW}>
              {c.label}
            </button>
          ))}
        </section>

        {/* 4. Sell banner (the one main button on this screen) */}
        <section className={'relative overflow-hidden bg-white rounded-[22px] p-5 flex flex-col gap-4 ' + SHADOW}>
          <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-[#FCE3D6]/40 pointer-events-none" />
          <div className="relative flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-[#C4501A]">Sell to students near you</span>
            <h2 className="text-[20px] font-bold leading-tight">Have old books? List them in 2 minutes</h2>
            <p className="text-[14px] text-[#5E5650]">Earn cash and help a neighbourhood student.</p>
          </div>
          <button onClick={goSell} className="relative w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Sell a book</span>
          </button>
        </section>

        {SETS_OPEN && (<>
        {/* 3. Hero */}
        <section className={'relative w-full rounded-[22px] overflow-hidden aspect-[16/10] flex flex-col justify-end p-5 ' + SHADOW} style={{ background: 'linear-gradient(135deg, #C4501A 0%, #E8632B 100%)' }}>
          {heroOk && (
            <img src={HERO_PHOTO} alt="" className="absolute inset-0 w-full h-full object-cover" onError={() => setHeroOk(false)} />
          )}
          {!heroOk && <span className="material-symbols-outlined absolute right-5 top-5 text-white/25 text-[96px]">menu_book</span>}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(30,27,25,0.78), rgba(30,27,25,0.3) 55%, rgba(30,27,25,0))' }} />
          <div className="relative flex flex-col items-start gap-3">
            <h1 className="text-white text-[19px] font-bold leading-snug max-w-[250px]">
              School books for 2026-27, ready at Sector 40-C
            </h1>
            <button onClick={() => pickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="px-5 py-2.5 bg-white text-[#1E1B19] text-[13px] font-semibold rounded-full active:scale-95 transition-transform">
              Find your set
            </button>
          </div>
        </section>

        {/* 4. School picker */}
        <section ref={pickerRef} className="flex flex-col gap-3 scroll-mt-4">
          <div className="flex items-center gap-2 overflow-x-auto -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
            {schoolNames.map(n => {
              const on = n === school
              return (
                <button key={n} onClick={() => pickSchool(n)}
                  className={'px-4 py-2 rounded-full text-[13px] whitespace-nowrap shrink-0 active:scale-95 transition-transform ' + (on ? 'bg-[#E8632B] text-white font-semibold ' : 'bg-white text-[#1E1B19] font-medium ') + SHADOW}>
                  {SHORT_NAME[n] || n}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto -mx-5 px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
            {classes.map(c => {
              const on = c === cls
              return (
                <button key={c} onClick={() => setCls(c)}
                  className={'px-3.5 py-1.5 rounded-full text-[12px] whitespace-nowrap shrink-0 transition-colors ' + (on ? 'bg-[#E8632B] text-white font-semibold ' : 'bg-white text-[#1E1B19] font-medium ') + SHADOW}>
                  Class {c}
                </button>
              )
            })}
          </div>

          <div className={'bg-white rounded-[22px] p-4 flex flex-col gap-4 ' + SHADOW}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold leading-snug">{shortName} · Class {cls} set</h2>
                <p className="text-[13px] text-[#9A908A] mt-0.5">
                  {summary.books} books{summary.notebooks > 0 ? ' + ' + summary.notebooks + ' notebooks' : ''}
                </p>
              </div>
              <span className="text-[18px] font-extrabold shrink-0">₹{summary.total.toLocaleString('en-IN')}</span>
            </div>
            <button
              onClick={() => router.push('/school-sets?school=' + encodeURIComponent(school) + '&class=' + cls)}
              className="w-full h-[52px] bg-[#E8632B] text-white text-[17px] font-semibold rounded-full flex items-center justify-center active:scale-[0.98] transition-transform">
              View set
            </button>
          </div>
        </section>

        </>)}

        {/* 5. Featured books */}
        {featured.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold">Featured books</h2>
              <button onClick={() => router.push('/marketplace')} className="text-[13px] font-semibold text-[#9A908A] active:opacity-70">See all</button>
            </div>
            <div className="-mx-5 px-5 flex gap-3.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {featured.map(l => (
                <div key={l.id} onClick={() => router.push('/listing/' + l.id)} className={'w-44 shrink-0 bg-white rounded-[22px] p-3 flex flex-col justify-between cursor-pointer ' + SHADOW}>
                  <div className="flex flex-col gap-2.5">
                    <div className="relative w-full h-44 rounded-[18px] overflow-hidden bg-[#F8EDE6] flex items-center justify-center text-[34px]">
                      {l.images?.[0] ? <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" /> : <span>{l.emoji || '📚'}</span>}
                      {l.category && <span className="absolute top-2 left-2 bg-white/90 text-[#1E1B19] text-[12px] font-semibold px-2 py-0.5 rounded-full">{cap(l.category)}</span>}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-[13px] font-bold leading-tight line-clamp-1">{l.title}</h3>
                      <span className="text-[12px] text-[#9A908A] truncate">{l.subtitle || l.condition}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                      <span className="text-[15px] font-extrabold">{priceText(l.price)}</span>
                      {Number(l.origPrice) > Number(l.price) && <span className="text-[12px] text-[#9A908A] line-through">₹{l.origPrice}</span>}
                    </div>
                    {chatButton(l)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Books from students near you */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold">Books from students near you</h2>
            <button onClick={() => router.push('/marketplace')} className="text-[13px] font-semibold text-[#9A908A] active:opacity-70">See all</button>
          </div>

          {listings.length === 0 ? (
            <div className={'bg-white rounded-[22px] p-5 text-center ' + SHADOW}>
              <p className="text-[14px] text-[#5E5650] mb-3">No books listed yet. Be the first to sell yours.</p>
              <button onClick={goSell} className="px-5 py-2.5 bg-[#FFF1EA] text-[#C4501A] text-[14px] font-semibold rounded-full active:scale-95 transition-transform">Sell a book</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {gridList.map(l => {
                const isSaved = saved.has(l.id)
                const pct = Number(l.origPrice) > Number(l.price) && Number(l.price) > 0 ? Math.round((Number(l.price) / Number(l.origPrice)) * 100) : 0
                const who = [first(l.seller?.name), l.location].filter(Boolean).join(' · ')
                return (
                  <div key={l.id} onClick={() => router.push('/listing/' + l.id)} className={'bg-white rounded-[22px] p-3 flex flex-col justify-between cursor-pointer ' + SHADOW}>
                    <div className="flex flex-col gap-2">
                      <div className="relative w-full aspect-[3/4] rounded-[18px] overflow-hidden bg-[#FFF1EA] flex items-center justify-center text-[34px]">
                        {l.images?.[0] ? <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" /> : <span>{l.emoji || '📚'}</span>}
                        {pct > 0 && <span className="absolute top-2 left-2 bg-white/95 text-[#C4501A] text-[12px] font-semibold px-2 py-0.5 rounded-full">{pct}% of MRP</span>}
                        <button aria-label={isSaved ? 'Remove from saved' : 'Save book'} onClick={e => toggleHeart(l, e)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform shadow-[0_2px_10px_rgba(120,70,40,0.12)]">
                          <span className="material-symbols-outlined text-[16px]" style={{ color: isSaved ? '#E8632B' : '#9A908A', fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                        </button>
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-[13px] font-bold leading-tight line-clamp-1">{l.title}</h3>
                        {who && <span className="text-[12px] text-[#5E5650] truncate">{who}</span>}
                        {l.condition && <span className="text-[12px] text-[#2E8B57] font-medium">{l.condition}</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2.5">
                      <div className="flex items-baseline gap-1 min-w-0">
                        <span className="text-[15px] font-extrabold">{priceText(l.price)}</span>
                        {Number(l.origPrice) > Number(l.price) && <span className="text-[12px] text-[#9A908A] line-through">₹{l.origPrice}</span>}
                      </div>
                      {chatButton(l)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* 7. People are looking for */}
        {reqs.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold">People are looking for</h2>
              <button onClick={() => router.push('/requests')} className="text-[13px] font-semibold text-[#9A908A] active:opacity-70">See all requests</button>
            </div>
            <div className="flex flex-col gap-2.5">
              {reqs.map(r => {
                const wanted = r.maxPrice ? 'Wanted up to ₹' + r.maxPrice : 'Wanted'
                const who = r.mine ? r.location : [r.name, r.location ? '(' + r.location + ')' : ''].filter(Boolean).join(' ')
                return (
                  <div key={r.id} className={'w-full bg-white rounded-[22px] p-4 flex items-center justify-between gap-3 ' + SHADOW}>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="text-[15px] font-semibold truncate">{r.title}</h3>
                        {r.mine && <span className="px-2 py-0.5 rounded-full bg-[#FCE3D6] text-[#C4501A] text-[12px] font-semibold shrink-0">You</span>}
                      </div>
                      <span className="text-[12px] text-[#5E5650] truncate">{[wanted, who].filter(Boolean).join(' · ')}</span>
                    </div>
                    {r.mine ? (
                      <span className="shrink-0 text-[12px] text-[#9A908A]">Awaiting offers</span>
                    ) : (
                      <button onClick={goSell} className="shrink-0 px-3 py-1.5 rounded-full bg-[#FFF1EA] text-[#C4501A] text-[12px] font-semibold flex items-center gap-1 active:scale-95 transition-transform">
                        <span className="material-symbols-outlined text-[15px]">chat</span>
                        <span>I have this</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 8. Free community books */}
        {free.length > 0 && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold">Free community books</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#2E8B57]/10 text-[#2E8B57] text-[12px] font-semibold">Pay it forward</span>
            </div>
            <div className="-mx-5 px-5 flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {free.map(l => (
                <div key={l.id} onClick={() => router.push('/listing/' + l.id)} className={'w-48 shrink-0 bg-white rounded-[22px] p-3.5 flex flex-col justify-between cursor-pointer ' + SHADOW}>
                  <div className="flex flex-col gap-1">
                    <span className="text-[12px] font-semibold text-[#2E8B57]">Giveaway</span>
                    <h3 className="text-[13px] font-bold leading-tight line-clamp-2">{l.title}</h3>
                    {first(l.seller?.name) && <span className="text-[12px] text-[#9A908A]">Listed by {first(l.seller?.name)}</span>}
                  </div>
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-[15px] font-extrabold text-[#2E8B57]">Free</span>
                    <button disabled={!!chatBusy} onClick={e => openChat(l, e)} className="px-3 py-1.5 rounded-full bg-[#FFF1EA] text-[#1E1B19] text-[12px] font-semibold active:scale-95 transition-transform disabled:opacity-60">
                      {chatBusy === l.id ? 'Opening…' : 'Claim'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 9. How Pageplus works */}
        <section className={'bg-white rounded-[22px] p-5 flex flex-col gap-4 ' + SHADOW}>
          <div className="flex flex-col">
            <h2 className="text-[17px] font-bold">How Pageplus works</h2>
            <span className="text-[12px] text-[#9A908A]">Safe, local peer-to-peer exchanges</span>
          </div>
          <div className="flex flex-col gap-3.5">
            {[
              { n: 1, t: 'List your book', d: 'Snap the cover and set your price in 2 minutes.' },
              { n: 2, t: 'Chat and agree', d: 'Message directly. No middleman fees.' },
              { n: 3, t: 'Meet and pay in person', d: 'Hand over at a safe public place near you.' },
            ].map(st => (
              <div key={st.n} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#FCE3D6] text-[#C4501A] text-[12px] font-bold flex items-center justify-center shrink-0">{st.n}</div>
                <div className="flex flex-col">
                  <h3 className="text-[15px] font-semibold">{st.t}</h3>
                  <p className="text-[14px] text-[#5E5650]">{st.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-[#F8EDE6] rounded-[16px] p-3 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-[#5E5650] shrink-0">verified_user</span>
            <p className="text-[12px] text-[#9A908A]">Meet in daylight at public places. Never share OTPs.</p>
          </div>
        </section>

        {/* 10. School sets: coming soon */}
        {!SETS_OPEN && (
          <section className={'bg-[#FFF1EA] rounded-[22px] p-4 flex items-center justify-between gap-3 ' + SHADOW}>
            <div className="flex flex-col min-w-0">
              <h3 className="text-[15px] font-semibold">School sets and customised kits · Coming soon</h3>
              <p className="text-[12px] text-[#5E5650] mt-0.5">Curated book sets for DPS Sector 40-C and Shivalik Public School.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#E8632B] shrink-0 shadow-[0_2px_10px_rgba(120,70,40,0.06)]">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
          </section>
        )}

        {/* 11. Store card */}
        <section className={'bg-white rounded-[22px] p-4 flex flex-col gap-3.5 ' + SHADOW}>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-[18px] overflow-hidden shrink-0 bg-[#FFF1EA] flex items-center justify-center">
              {storeOk
                ? <img src={STORE_PHOTO} alt="Bedi Book Store" className="w-full h-full object-cover" onError={() => setStoreOk(false)} />
                : <span className="material-symbols-outlined text-[26px] text-[#C4501A]">storefront</span>}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-bold">Bedi Book Store, Sector 40-C</h3>
              <p className="text-[12px] text-[#9A908A] mt-0.5">Since 1994 · Booth 48 · Mon–Sat, 9am–7pm</p>
            </div>
          </div>
          <a href={WA_HELP_LINK} target="_blank" rel="noopener noreferrer" className="w-full h-11 bg-[#25D366] text-white rounded-full flex items-center justify-center gap-2 text-[14px] font-semibold active:scale-[0.98] transition-transform">
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>Chat on WhatsApp</span>
          </a>
        </section>
      </main>

      {/* Kit bag pill (only when a kit has been added) */}
      {SETS_OPEN && cart.length > 0 && (
        <div className="fixed inset-x-0 flex justify-center pointer-events-none px-5" style={{ zIndex: 40, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}>
          <div className={'pointer-events-auto bg-white rounded-full pl-4 pr-1.5 py-1.5 flex items-center gap-3 ' + SHADOW}>
            <span className="text-[13px] font-semibold">{cart.length} {cart.length > 1 ? 'kits' : 'kit'} · ₹{cartTotal.toLocaleString('en-IN')}</span>
            <button onClick={() => router.push('/school-sets')} className="px-4 py-2 bg-[#E8632B] text-white text-[13px] font-semibold rounded-full active:scale-95 transition-transform">View bag</button>
          </div>
        </div>
      )}
    </div>
  )
}