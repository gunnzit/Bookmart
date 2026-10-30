'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import LocationSheet, { useDeliveryPlace } from '@/components/LocationSheet'
import Logo from '@/components/Logo'
import DesktopNav from '@/components/DesktopNav'
import DesktopFooter from '@/components/DesktopFooter'

// Category chips under the header. "free" is a special one (price 0)
const CATS: { key: string; label: string }[] = [
  { key: 'All', label: 'All Books' },
  { key: 'textbook', label: 'Textbooks' },
  { key: 'competitive', label: 'Competitive' },
  { key: 'novel', label: 'Novels' },
  { key: 'notebook', label: 'Notebooks' },
  { key: 'stationery', label: 'Stationery' },
  { key: 'art', label: 'Art' },
  { key: 'free', label: 'Free Books' },
]
const SORTS = ['Newest', 'Cheapest', 'Most expensive', 'Active only']
const AREAS = ['All areas', 'Chandigarh', 'Mohali', 'Panchkula']
const CONDS = ['New', 'Good', 'Fair']

// Words the search bar types out, one after another
const PHRASES = ['NCERT Class 10 Maths', 'Atomic Habits', 'JEE Physics', 'Class 8 notebooks', 'Hindi Class 9', 'Harry Potter', 'NEET Biology', 'RD Sharma']

const REQ_TINTS = [
  { bg: 'bg-amber-100', bd: 'border-amber-200', tx: 'text-amber-900' },
  { bg: 'bg-blue-100', bd: 'border-blue-200', tx: 'text-blue-900' },
  { bg: 'bg-emerald-100', bd: 'border-emerald-200', tx: 'text-emerald-900' },
]

function areaMatch(location: string, area: string) {
  const loc = (location || '').toLowerCase()
  if (area === 'Chandigarh') return loc.includes('chandigarh') || loc.includes('chd') || loc.includes('sector') || loc.includes('sec ')
  return loc.includes(area.toLowerCase())
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const first = (n?: string | null) => String(n || '').trim().split(/\s+/)[0] || ''
const ago = (d?: string) => {
  if (!d) return ''
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (!(days >= 0)) return ''
  return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : days + 'd ago'
}
const offPct = (l: any) => {
  const p = Number(l.price)
  const o = Number(l.origPrice)
  if (!(o > p) || !(p > 0)) return 0
  return Math.round(((o - p) / o) * 100)
}
const condLabel = (c: string) => (/new/i.test(c) ? 'New' : c + ' condition')
const condCls = (c: string) =>
  /new/i.test(c) ? 'bg-stone-100 text-[#6e5e0d] border-transparent' : /good/i.test(c) ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-stone-100 text-stone-700 border-transparent'

// All the motion on this page lives here
const WR_CSS = `
@keyframes wr-pop{0%{opacity:0;transform:translateY(24px) scale(.88)}60%{opacity:1;transform:translateY(-4px) scale(1.04)}100%{opacity:1;transform:none}}
@keyframes wr-shine{0%{transform:translateX(-130%)}45%,100%{transform:translateX(130%)}}
@keyframes wr-sk{0%{background-position:100% 0}100%{background-position:-100% 0}}
@keyframes wr-floaty{0%,100%{translate:0 0}50%{translate:0 -5px}}
@keyframes wr-blink{0%,45%{opacity:1}50%,95%{opacity:0}100%{opacity:1}}
@keyframes wr-hp{0%{transform:scale(1)}35%{transform:scale(1.6)}70%{transform:scale(.9)}100%{transform:scale(1)}}
@keyframes wr-su{0%{opacity:0;transform:translateY(40px) scale(.92)}100%{opacity:1;transform:none}}
@keyframes wr-ring{0%{box-shadow:0 0 0 0 rgba(234,88,12,.55)}100%{box-shadow:0 0 0 8px rgba(234,88,12,0)}}
@keyframes wr-sheet{0%{transform:translateY(100%)}100%{transform:none}}
.wr-pre{opacity:0}
.wr-anim{animation:wr-pop .6s cubic-bezier(.22,1,.36,1) var(--d,0ms) backwards}
.wr-card{transition:transform .2s ease,box-shadow .2s ease}
.wr-card:active{transform:scale(.97)}
@media (hover:hover){.wr-card:hover{transform:translateY(-3px);box-shadow:0 10px 24px rgba(120,70,40,.15)}}
.wr-btn{position:relative;overflow:hidden;isolation:isolate}
.wr-btn::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.4) 50%,transparent 65%);transform:translateX(-130%);animation:wr-shine 4.2s ease-in-out infinite;animation-delay:var(--pd,0s)}
.wr-float{animation:wr-floaty 3.6s ease-in-out infinite}
.wr-float2{animation:wr-floaty 4.4s ease-in-out infinite;animation-delay:-1.2s}
.wr-caret{display:inline-block;width:1.5px;height:14px;background:#78716c;margin-left:1px;vertical-align:-2px;animation:wr-blink 1s step-end infinite}
.wr-heart{display:inline-block;animation:wr-hp .5s cubic-bezier(.34,1.56,.64,1)}
.wr-slideup{animation:wr-su .55s cubic-bezier(.34,1.56,.64,1) both}
.wr-sheet{animation:wr-sheet .3s cubic-bezier(.22,1,.36,1) both}
.wr-pulse{animation:wr-ring 1.8s ease-out infinite}
.wr-skel{background:linear-gradient(90deg,#f1ede6 25%,#fbf8f1 40%,#f1ede6 60%);background-size:300% 100%;animation:wr-sk 1.4s ease-in-out infinite}
.wr-snap{scroll-snap-type:x proximity;scroll-padding-left:14px}
.wr-snap-item{scroll-snap-align:start}
@media (prefers-reduced-motion:reduce){
.wr-pre{opacity:1}
.wr-anim,.wr-btn::after,.wr-float,.wr-float2,.wr-caret,.wr-heart,.wr-skel,.wr-slideup,.wr-pulse,.wr-sheet{animation:none!important}
}
`

// The typing text inside the search bar (kept in its own piece so only this part redraws)
function TypeLine() {
  const [s, setS] = useState({ i: 0, n: 0, del: false })
  const [still, setStill] = useState(false)
  useEffect(() => {
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setStill(true) } catch {}
  }, [])
  useEffect(() => {
    if (still) return
    const full = PHRASES[s.i]
    let t: ReturnType<typeof setTimeout>
    if (!s.del && s.n < full.length) t = setTimeout(() => setS({ ...s, n: s.n + 1 }), 75)
    else if (!s.del) t = setTimeout(() => setS({ ...s, del: true }), 1500)
    else if (s.n > 0) t = setTimeout(() => setS({ ...s, n: s.n - 1 }), 38)
    else t = setTimeout(() => setS({ i: (s.i + 1) % PHRASES.length, n: 0, del: false }), 250)
    return () => clearTimeout(t)
  }, [s, still])
  return <>{still ? PHRASES[0] : PHRASES[s.i].slice(0, s.n)}</>
}

export default function MarketplaceClient({ initial }: { initial: any[] }) {
  const router = useRouter()
  // Sign-in is now a real page (/sign-in). After signing in, the person comes back here.
  function goSignIn() {
    router.push('/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname + window.location.search))
  }
  const { isSignedIn, user } = useUser()
  const [place, setPlace] = useDeliveryPlace()

  const [listings, setListings] = useState<any[]>(initial)
  // True once we have books to show (from the server, or from the first fetch). Until then the grid shows placeholders.
  const [loaded, setLoaded] = useState(initial.length > 0)
  const [reqs, setReqs] = useState<any[]>([])
  const [tab, setTab] = useState<'browse' | 'requests'>('browse')
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('All')
  const [area, setArea] = useState('All areas')
  const [sortBy, setSortBy] = useState('Newest')
  const [under150, setUnder150] = useState(false)
  const [cond, setCond] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [placeOpen, setPlaceOpen] = useState(false)
  const [error, setError] = useState('')
  const [unread, setUnread] = useState(0)
  const [chatBusy, setChatBusy] = useState('')
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [popId, setPopId] = useState('')

  // Search text carried over from the Home page (?q=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const qq = params.get('q')
      if (qq) setSearch(qq)
      const cc = params.get('cat')
      if (cc && CATS.some(c => c.key === cc)) setCat(cc)
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

  // Open book requests (public)
  useEffect(() => {
    fetch('/api/book-requests', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d?.requests)) setReqs(d.requests.filter((r: any) => r.status === 'open')) })
      .catch(() => {})
  }, [isSignedIn])

  // Load listings, and refresh quietly when the tab becomes visible again
  useEffect(() => {
    let first = false // the first batch already came with the page, so a failed refresh stays quiet
    function load() {
      fetch('/api/listings?t=' + Date.now(), { cache: 'no-store' })
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d)) { setListings(d); setError('') }
          else if (first) setError('Could not load listings')
        })
        .catch(() => { if (first) setError('Could not connect. Check your internet and try again.') })
        .finally(() => { first = false; setLoaded(true) })
    }
    load()
    const onVisible = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Cards pop in as you scroll to them (one after another when several appear together)
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-pop]:not([data-pop-seen])'))
    if (!els.length) return
    const show = (el: HTMLElement) => {
      el.setAttribute('data-pop-seen', '1')
      el.classList.remove('wr-pre')
      el.classList.add('wr-anim')
    }
    if (typeof IntersectionObserver === 'undefined') { els.forEach(show); return }
    const io = new IntersectionObserver(entries => {
      entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((e, i) => {
          const el = e.target as HTMLElement
          el.style.setProperty('--d', i * 70 + 'ms')
          show(el)
          io.unobserve(el)
        })
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  })

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
      const matchCat = cat === 'All' || (cat === 'free' ? Number(l.price) === 0 : l.category === cat)
      return matchCat
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
  const free = visible.filter((l: any) => !l.sold && Number(l.price) === 0).slice(0, 8)
  const sheetFilters = (sortBy !== 'Newest' ? 1 : 0) + (under150 ? 1 : 0) + (cond ? 1 : 0) + (area !== 'All areas' ? 1 : 0)
  const anyFilter = cat !== 'All' || !!search || sheetFilters > 0

  function clearAll() {
    setCat('All'); setArea('All areas'); setSearch(''); setSortBy('Newest'); setUnder150(false); setCond(null)
  }

  async function toggleHeart(l: any, e: React.MouseEvent) {
    e.stopPropagation()
    if (!isSignedIn || !user) { goSignIn(); return }
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
      setPopId(l.id)
      setTimeout(() => setPopId(''), 600)
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
    if (!isSignedIn) { goSignIn(); return }
    if (user?.id === l.sellerId) { router.push('/listing/' + l.id); return }
    startChat(l.id)
  }

  function goSell() {
    if (!isSignedIn) { goSignIn(); return }
    router.push('/sell')
  }

  const placeText = !place
    ? <span className="truncate text-[12px] font-semibold text-stone-800">Choose your delivery area</span>
    : place.kind === 'pickup'
      ? <span className="truncate text-[12px] font-semibold text-stone-800">Pickup from <strong className="font-bold text-stone-900">Sector 40-C</strong></span>
      : <span className="truncate text-[12px] font-semibold text-stone-800">Deliver to <strong className="font-bold text-stone-900">{place.area.split(',').slice(0, 2).join(',').trim()}</strong></span>

  const iconBtn = 'relative w-9 h-9 bg-white/80 rounded-full flex items-center justify-center text-stone-900 shadow-sm cursor-pointer hover:bg-white transition border border-amber-300/40'
  const subChip = 'shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-sm border active:scale-95 transition '
  const sheetPill = (on: boolean) => 'px-3.5 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-colors active:scale-95 border ' + (on ? 'bg-stone-900 text-white font-bold border-stone-900' : 'bg-white text-stone-800 font-semibold border-stone-200')

  function heart(l: any) {
    const on = saved.has(l.id)
    return (
      <button type="button" aria-label={on ? 'Remove from saved' : 'Save book'} onClick={e => toggleHeart(l, e)}
        className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors">
        <i className={(on ? 'fa-solid text-red-500 ' : 'fa-regular ') + 'fa-heart text-[11px]' + (popId === l.id ? ' wr-heart' : '')} />
      </button>
    )
  }

  const seeAll = (href: string) => (
    <a href={href} className="text-xs font-bold text-amber-800 flex items-center gap-0.5 hover:text-black">
      See all <i className="fa-solid fa-arrow-right text-[10px] ml-0.5" />
    </a>
  )

  return (
    <div className="min-h-screen bg-[#ECEAE5] flex justify-center lg:block lg:bg-[#fcf9f4] text-stone-900 antialiased font-['Plus_Jakarta_Sans',sans-serif]">
      <style>{WR_CSS}</style>
      <LocationSheet open={placeOpen} onClose={() => setPlaceOpen(false)} place={place} onSelect={setPlace} />

      {/* Sort and filter sheet */}
      {filterOpen && (
        <div className="fixed inset-0 z-[400] bg-black/45 flex items-end justify-center" onClick={() => setFilterOpen(false)}>
          <div className="wr-sheet bg-white rounded-t-[28px] p-5 w-full max-w-[430px] shadow-[0_-10px_35px_rgba(30,27,25,0.2)] max-h-[88vh] overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 rounded-full bg-stone-200 mx-auto mb-4" />
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-[18px] font-black">Sort and filter</h3>
                <p className="text-[12px] text-stone-500 mt-0.5">{filtered.length} {filtered.length === 1 ? 'book' : 'books'} match</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setFilterOpen(false)} className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[13px] font-bold mb-2">Sort by</p>
                <div className="flex flex-wrap gap-2">
                  {SORTS.map(s => <button key={s} type="button" onClick={() => setSortBy(s)} className={sheetPill(sortBy === s)}>{s}</button>)}
                </div>
              </div>
              <div>
                <p className="text-[13px] font-bold mb-2">Meetup area</p>
                <div className="flex flex-wrap gap-2">
                  {AREAS.map(a => <button key={a} type="button" onClick={() => setArea(a)} className={sheetPill(area === a)}>{a}</button>)}
                </div>
              </div>
              <div>
                <p className="text-[13px] font-bold mb-2">Price</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setUnder150(v => !v)} className={sheetPill(under150)}>Under ₹150</button>
                </div>
              </div>
              <div>
                <p className="text-[13px] font-bold mb-2">Condition</p>
                <div className="flex flex-wrap gap-2">
                  {CONDS.map(c => <button key={c} type="button" onClick={() => setCond(cond === c ? null : c)} className={sheetPill(cond === c)}>{c}</button>)}
                </div>
              </div>
            </div>
            <div className="flex gap-2.5 mt-6">
              <button type="button" onClick={() => { setSortBy('Newest'); setUnder150(false); setCond(null); setArea('All areas') }} className="h-12 px-6 rounded-full bg-white border border-stone-200 text-[14px] font-bold active:scale-95 transition-transform">Clear</button>
              <button type="button" onClick={() => setFilterOpen(false)} className="flex-1 h-12 bg-[#FBBF24] text-stone-900 text-[15px] font-bold rounded-full active:scale-[0.98] transition-transform">
                Show {filtered.length} {filtered.length === 1 ? 'book' : 'books'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-[430px] bg-[#FAF8F5] min-h-screen flex flex-col relative shadow-2xl border-x border-stone-200 pb-28 lg:hidden">

        {/* ── Top header (scrolls away with the page) ─────────────── */}
        <header className="bg-[#F7CF65] px-4 pb-4 rounded-b-[2rem] shadow-sm relative z-10" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
          <div className="flex items-center justify-between mb-3">
            <a href="/" className="flex items-center" aria-label="wrap&read home">
              <Logo height={32} className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]" />
            </a>
            <div className="flex items-center space-x-2">
              <button type="button" aria-label="Notifications" className={iconBtn}>
                <i className="fa-regular fa-bell text-[15px]" />
              </button>
              <button type="button" aria-label={unread > 0 ? 'Messages, ' + unread + ' unread' : 'Messages'} onClick={() => (isSignedIn ? router.push('/messages') : goSignIn())} className={iconBtn}>
                <i className="fa-regular fa-comment-dots text-[15px]" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#EA580C] text-white text-[10px] font-extrabold px-1 rounded-full border-2 border-[#F7CF65] leading-tight wr-pulse">{unread > 9 ? '9+' : unread}</span>
                )}
              </button>
              {isSignedIn ? (
                <button type="button" aria-label="Profile" onClick={() => router.push('/profile')} className="w-9 h-9 bg-[#FEEBC8] rounded-full flex items-center justify-center border border-amber-300 text-stone-800 font-semibold cursor-pointer shadow-sm">
                  <i className="fa-regular fa-user text-sm" />
                </button>
              ) : (
                <button type="button" aria-label="Sign in" onClick={goSignIn} className="w-9 h-9 bg-[#FEEBC8] rounded-full flex items-center justify-center border border-amber-300 text-stone-800 font-semibold cursor-pointer shadow-sm">
                  <i className="fa-regular fa-user text-sm" />
                </button>
              )}
            </div>
          </div>

          <button type="button" onClick={() => setPlaceOpen(true)} className="w-full bg-white py-2 px-3.5 rounded-full flex items-center justify-between text-[13px] font-bold text-stone-800 shadow-sm border border-amber-100/50 mb-2.5 active:scale-[0.99] transition">
            <div className="flex items-center truncate">
              <i className="fa-solid fa-location-dot text-stone-900 mr-2 text-[13px]" />
              {placeText}
            </div>
            <i className="fa-solid fa-chevron-down text-[11px] text-stone-500 ml-2" />
          </button>

          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-[13px]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search books, authors, schools"
                type="text"
                className="w-full bg-white pl-9 pr-8 py-2 rounded-full text-[13px] font-medium border-0 focus:ring-1 focus:ring-stone-800 focus:outline-none shadow-sm"
              />
              {search === '' && (
                <div aria-hidden className="absolute left-9 right-3 top-1/2 -translate-y-1/2 text-[13px] text-stone-400 font-medium pointer-events-none truncate">
                  {'Search "'}<TypeLine /><span className="wr-caret" />{'"'}
                </div>
              )}
              {search !== '' && (
                <button type="button" aria-label="Clear search" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full text-stone-400 flex items-center justify-center">
                  <i className="fa-solid fa-xmark text-[12px]" />
                </button>
              )}
            </div>
            <button type="button" onClick={() => setFilterOpen(true)} className="relative bg-white px-3.5 py-2 rounded-full flex items-center space-x-1.5 text-[13px] font-bold text-stone-800 shadow-sm border border-amber-100 flex-shrink-0 active:scale-95 transition">
              <i className="fa-solid fa-sliders text-[13px]" />
              <span>Filter</span>
              {sheetFilters > 0 && <span className="absolute -top-1 -right-1 bg-[#EA580C] text-white text-[9px] font-extrabold min-w-[16px] h-4 px-1 rounded-full border-2 border-[#F7CF65] flex items-center justify-center">{sheetFilters}</span>}
            </button>
          </div>
        </header>

        <main className="flex flex-col w-full pt-3 px-3.5 gap-4">

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto -mx-3.5 px-3.5 py-0.5" style={{ scrollbarWidth: 'none' }}>
            {CATS.map(c => (
              <button key={c.key} type="button" onClick={() => { setCat(c.key); setTab('browse') }}
                className={'shrink-0 px-4 py-2 rounded-full text-xs shadow-sm active:scale-95 transition-transform ' + (cat === c.key ? 'bg-stone-900 text-white font-bold' : 'bg-white text-stone-800 font-semibold border border-stone-200')}>
                {c.label}
              </button>
            ))}
          </div>

          {/* Sell a book card */}
          <section data-pop className="wr-pre relative overflow-hidden rounded-2xl bg-[#ffdf9f] p-4 shadow-sm border border-amber-200 flex items-center justify-between">
            <div className="flex flex-col max-w-[62%] z-10">
              <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full bg-[#fbbf24]/80 text-[#6c4f00] text-[10px] font-bold mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" /> {activeCount} {activeCount === 1 ? 'book' : 'books'} available now
              </span>
              <h2 className="text-lg font-black text-[#261a00] leading-tight">Sell a book</h2>
              <p className="text-xs text-[#5c4300] mt-0.5 leading-snug font-medium">Give your books a second life. List in under 60 seconds.</p>
              <button type="button" onClick={goSell} className="wr-btn mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-stone-900 text-white font-bold text-xs shadow-sm active:scale-95 transition-transform w-fit">
                <span>Start selling</span>
                <i className="fa-solid fa-arrow-right text-[10px]" />
              </button>
            </div>
            <div className="relative w-28 h-24 shrink-0 flex items-end justify-center">
              <div className="wr-float relative flex flex-col items-center">
                <div className="w-16 h-3.5 bg-teal-600 rounded shadow-sm border-t border-teal-400 flex items-center px-1"><span className="w-full h-0.5 bg-white/40 rounded" /></div>
                <div className="w-20 h-4 bg-amber-600 rounded shadow-sm -mt-0.5 border-t border-amber-400 flex items-center px-1"><span className="w-full h-0.5 bg-white/40 rounded" /></div>
                <div className="w-24 h-5 bg-blue-700 rounded shadow border-t border-blue-400 flex items-center px-1"><span className="w-full h-1 bg-white/30 rounded" /></div>
              </div>
              <div className="wr-float2 w-6 h-9 bg-stone-900 rounded-b-md ml-1.5 flex items-start justify-center pt-0.5 space-x-0.5 relative shadow">
                <div className="w-1 h-5 bg-red-500 rounded-full -rotate-12" />
                <div className="w-1.5 h-6 bg-amber-400 rounded-full rotate-3" />
                <div className="w-1 h-4 bg-blue-400 rounded-full" />
              </div>
            </div>
          </section>

          {/* Tabs and sub-filters */}
          <div className="flex flex-col gap-2.5">
            <div className="flex p-1 bg-stone-100 rounded-full border border-stone-200">
              <button type="button" onClick={() => setTab('browse')} className={'flex-1 py-1.5 rounded-full text-xs text-center transition-all ' + (tab === 'browse' ? 'bg-white text-stone-900 font-bold shadow-sm' : 'text-stone-500 font-medium hover:text-stone-800')}>Browse Books (P2P)</button>
              <button type="button" onClick={() => setTab('requests')} className={'flex-1 py-1.5 rounded-full text-xs text-center transition-all ' + (tab === 'requests' ? 'bg-white text-stone-900 font-bold shadow-sm' : 'text-stone-500 font-medium hover:text-stone-800')}>Student Requests ({reqs.length})</button>
            </div>

            {tab === 'browse' && (
              <div className="flex items-center gap-2 overflow-x-auto -mx-3.5 px-3.5 py-0.5" style={{ scrollbarWidth: 'none' }}>
                <button type="button" onClick={() => setFilterOpen(true)} className={subChip + (area !== 'All areas' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-800 border-stone-200')}>
                  <i className={'fa-solid fa-location-arrow text-[10px] ' + (area !== 'All areas' ? 'text-amber-300' : 'text-amber-700')} />
                  <span>{area === 'All areas' ? 'Area: All' : area}</span>
                  <i className="fa-solid fa-chevron-down text-[9px]" />
                </button>
                <button type="button" onClick={() => setFilterOpen(true)} className={subChip + (cond ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-800 border-stone-200')}>
                  <span>Condition: {cond || 'All'}</span>
                  <i className="fa-solid fa-chevron-down text-[9px]" />
                </button>
                <button type="button" onClick={() => setFilterOpen(true)} className={subChip + (sortBy !== 'Newest' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-800 border-stone-200')}>
                  <span>{sortBy === 'Newest' ? 'Sort: Newest' : sortBy === 'Cheapest' ? 'Price: Low to High' : sortBy === 'Most expensive' ? 'Price: High to Low' : 'Active only'}</span>
                  <i className="fa-solid fa-chevron-down text-[9px]" />
                </button>
                <button type="button" onClick={() => setUnder150(v => !v)} className={subChip + (under150 ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-100 text-stone-600 border-stone-200')}>
                  <i className={'fa-solid fa-indian-rupee-sign text-[10px] ' + (under150 ? 'text-amber-300' : 'text-[#EA580C]')} />
                  <span>Under ₹150</span>
                </button>
              </div>
            )}
          </div>

          {tab === 'browse' ? (
            <>
              {/* Books from students near you */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-base font-black text-stone-900 tracking-tight">Books from students near you</h1>
                    <p className="text-xs text-stone-500 font-medium">Checked listings, pickups in Chandigarh tricity</p>
                  </div>
                  <span className="text-xs font-bold text-amber-800 shrink-0">{anyFilter ? filtered.length + ' found' : activeCount + ' available'}</span>
                </div>

                {error ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-stone-200 shadow-sm">
                    <p className="text-[13px] text-stone-600 mb-4">{error}</p>
                    <button type="button" onClick={() => window.location.reload()} className="px-5 py-2.5 bg-[#FBBF24] text-stone-900 text-[13px] font-bold rounded-full active:scale-95 transition-transform">Try again</button>
                  </div>
                ) : !loaded ? (
                  <div className="grid grid-cols-2 gap-3" aria-busy="true" aria-label="Loading books">
                    {[0, 1, 2, 3, 4, 5].map(k => (
                      <div key={k} className="flex flex-col bg-white rounded-2xl p-3 shadow-sm border border-stone-200">
                        <div className="h-6 mb-1.5" />
                        <div className="w-full h-44 rounded-xl wr-skel mb-2" />
                        <div className="h-3.5 w-12 rounded wr-skel" />
                        <div className="h-3.5 rounded wr-skel mt-2" />
                        <div className="h-3.5 w-2/3 rounded wr-skel mt-1.5" />
                        <div className="h-3 w-1/2 rounded wr-skel mt-2" />
                        <div className="h-5 w-16 rounded wr-skel mt-2" />
                        <div className="h-9 w-full rounded-full wr-skel mt-3" />
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-stone-200 shadow-sm">
                    <h2 className="text-[15px] font-black mb-1">Nothing found</h2>
                    <p className="text-[13px] text-stone-600 mb-4">Try a different search or filter, or ask for the book you need.</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {anyFilter && <button type="button" onClick={clearAll} className="px-5 py-2.5 bg-[#FBBF24] text-stone-900 text-[13px] font-bold rounded-full active:scale-95 transition-transform">Clear filters</button>}
                      <button type="button" onClick={() => router.push('/requests')} className="px-5 py-2.5 bg-stone-900 text-white text-[13px] font-bold rounded-full active:scale-95 transition-transform">Request this book</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filtered.map((l: any) => {
                      const sold = !!l.sold
                      const isFree = Number(l.price) === 0
                      const off = offPct(l)
                      const seller = l.seller?.name ? first(l.seller.name) : ''
                      const place2 = (l.location || '').split(',')[0]
                      const metaLine = [seller, place2].filter(Boolean).join(' • ')
                      const mine = !!user?.id && user.id === l.sellerId
                      return (
                        <div key={l.id} data-pop onClick={() => router.push('/listing/' + l.id)} className="wr-pre wr-card flex flex-col bg-white rounded-2xl p-3 shadow-sm border border-stone-200 relative justify-between cursor-pointer">
                          <div>
                            <div className="flex items-center justify-between mb-1.5 min-h-6">
                              {sold ? <span className="px-1.5 py-0.5 rounded-md bg-stone-500 text-white font-bold text-[9px] uppercase tracking-wide">Sold</span>
                                : isFree ? <span className="px-1.5 py-0.5 rounded-md bg-[#a73a00] text-white font-bold text-[9px] uppercase tracking-wide">Free</span>
                                : off > 0 ? <span className="px-1.5 py-0.5 rounded-md bg-[#795900] text-white font-bold text-[9px] uppercase tracking-wide">{off}% off MRP</span>
                                : l.featured ? <span className="px-1.5 py-0.5 rounded-md bg-stone-900 text-white font-bold text-[9px] uppercase tracking-wide">Featured</span>
                                : <span />}
                              {heart(l)}
                            </div>
                            <div className="relative w-full h-44 rounded-xl bg-stone-50 overflow-hidden flex items-center justify-center mb-2 text-4xl">
                              {l.images?.[0]
                                ? <img src={l.images[0]} alt={l.title} className={'w-full h-full object-cover ' + (sold ? 'opacity-50' : '')} />
                                : <span>{l.emoji || '📚'}</span>}
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              {l.condition && <span className={'w-fit px-1.5 py-0.5 rounded font-bold text-[9px] border ' + condCls(l.condition)}>{condLabel(l.condition)}</span>}
                              <h3 className={'font-bold text-[13px] leading-snug line-clamp-2 min-h-[2.6em] mt-0.5 ' + (sold ? 'text-stone-400' : 'text-stone-900')}>
                                <a href={'/listing/' + l.id} onClick={e => e.stopPropagation()}>{l.title}</a>
                              </h3>
                              {metaLine && <div className="text-stone-500 text-[11px] truncate">{metaLine}</div>}
                              <div className="flex items-baseline gap-1 mt-0.5">
                                {isFree ? (
                                  <>
                                    <span className="text-sm font-black text-[#EA580C]">₹0</span>
                                    <span className="text-[10px] text-[#EA580C] font-bold">Community Gift</span>
                                  </>
                                ) : (
                                  <>
                                    <span className={'text-base font-black ' + (sold ? 'text-stone-400' : 'text-stone-900')}>₹{l.price}</span>
                                    {Number(l.origPrice) > Number(l.price) && <span className="text-[10px] text-stone-400 line-through">₹{l.origPrice}</span>}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <button type="button" disabled={sold || (!!chatBusy && !mine)} onClick={e => openChat(l, e)}
                            className={'wr-btn mt-3 w-full py-2.5 rounded-full font-bold text-[13px] flex items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-50 ' + (isFree ? 'bg-orange-100 hover:bg-orange-200 text-[#a73a00]' : 'bg-[#fbbf24] hover:bg-amber-400 text-stone-900')}>
                            {chatBusy === l.id
                              ? <i className="fa-solid fa-spinner fa-spin text-[11px]" />
                              : <i className={(isFree ? 'fa-solid fa-gift' : 'fa-regular fa-comment') + ' text-[11px]'} />}
                            <span>{sold ? 'Sold' : mine ? 'Your listing' : isFree ? 'Claim' : 'Chat'}</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* People are looking for */}
              {reqs.length > 0 && (
                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-magnifying-glass text-[#EA580C] text-sm" />
                      <h2 className="text-base font-black text-stone-900 tracking-tight">People are looking for</h2>
                    </div>
                    {seeAll('/requests')}
                  </div>
                  <div className="wr-snap flex items-stretch gap-2.5 overflow-x-auto -mx-3.5 px-3.5 pb-1" style={{ scrollbarWidth: 'none' }}>
                    {reqs.slice(0, 6).map((r, i) => {
                      const t = REQ_TINTS[i % REQ_TINTS.length]
                      const who = r.mine ? r.location : [first(r.name), r.location].filter(Boolean).join(' • ')
                      return (
                        <div key={r.id} data-pop className={'wr-pre wr-card wr-snap-item w-48 shrink-0 bg-white rounded-2xl p-3 flex flex-col justify-between shadow-sm border border-stone-200'}>
                          <div className="flex items-start gap-2">
                            <div className={'w-12 h-16 rounded-lg shrink-0 overflow-hidden flex items-center justify-center p-1 border text-[8px] font-bold text-center ' + t.bg + ' ' + t.bd + ' ' + t.tx}>
                              <span className="line-clamp-3">{String(r.title || '').split(/\s+/)[0]}</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              {r.mine
                                ? <span className="inline-flex w-fit px-1.5 rounded bg-[#EA580C] text-white font-bold text-[9px] mb-1">You</span>
                                : who ? <div className="text-[10px] text-stone-500 truncate">{who}</div> : null}
                              <h3 className="font-bold text-xs text-stone-900 leading-snug line-clamp-2">{r.title}</h3>
                              {r.maxPrice ? <span className="text-[10px] text-stone-500">Up to ₹{r.maxPrice}</span> : null}
                            </div>
                          </div>
                          {r.mine ? (
                            <div className="mt-2.5 flex items-center justify-between bg-stone-50 rounded-lg px-2 py-1 border border-stone-100">
                              <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Awaiting offers
                              </span>
                              <span className="text-[9px] text-stone-400">{ago(r.createdAt)}</span>
                            </div>
                          ) : (
                            <button type="button" onClick={goSell} className="wr-btn mt-2.5 w-full py-1.5 rounded-full bg-[#fbbf24] hover:bg-amber-400 text-stone-900 font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform">
                              <i className="fa-solid fa-hand-holding-heart text-[11px]" />
                              <span>I have this</span>
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Community Book Giveaways */}
              {free.length > 0 && (
                <div className="flex flex-col gap-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-gift text-[#EA580C] text-sm" />
                      <h2 className="text-base font-black text-stone-900 tracking-tight">Community Book Giveaways</h2>
                    </div>
                    <span className="text-xs font-extrabold text-[#EA580C]">100% Free</span>
                  </div>
                  <div className="wr-snap flex items-stretch gap-2.5 overflow-x-auto -mx-3.5 px-3.5 pb-1" style={{ scrollbarWidth: 'none' }}>
                    {free.map((l: any) => (
                      <div key={l.id} data-pop onClick={() => router.push('/listing/' + l.id)} className="wr-pre wr-card wr-snap-item w-32 shrink-0 bg-white rounded-2xl p-2 flex flex-col justify-between shadow-sm border border-stone-200 cursor-pointer">
                        <div className="relative w-full h-24 rounded-xl bg-stone-50 overflow-hidden flex items-center justify-center mb-1.5 border border-stone-100 text-2xl">
                          <span className="absolute top-1 left-1 px-1.5 rounded bg-[#EA580C] text-white font-extrabold text-[8px] uppercase z-10">Free</span>
                          {l.images?.[0] ? <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" /> : <span>{l.emoji || '📚'}</span>}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="font-bold text-[11px] text-stone-900 truncate">{l.title}</h3>
                          <span className="text-[9px] text-stone-500 truncate">{l.subtitle || cap(l.category || '')}</span>
                        </div>
                        <button type="button" disabled={!!chatBusy && chatBusy !== l.id} onClick={e => openChat(l, e)} className="wr-btn mt-1.5 w-full py-1 rounded-full bg-amber-100 hover:bg-amber-200 text-stone-900 font-bold text-[10px] text-center active:scale-95 transition-transform">
                          {chatBusy === l.id ? 'Opening…' : 'Claim'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Student Requests tab */
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-base font-black text-stone-900 tracking-tight">Books students are looking for</h1>
                  <p className="text-xs text-stone-500 font-medium">Have one of these? Sell it in a minute.</p>
                </div>
                {seeAll('/requests')}
              </div>
              {reqs.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-stone-200 shadow-sm">
                  <h2 className="text-[15px] font-black mb-1">No open requests right now</h2>
                  <p className="text-[13px] text-stone-600 mb-4">Can&apos;t find a book? Ask and sellers nearby will see it.</p>
                  <button type="button" onClick={() => router.push('/requests')} className="px-5 py-2.5 bg-stone-900 text-white text-[13px] font-bold rounded-full active:scale-95 transition-transform">Request a book</button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {reqs.map((r, i) => {
                    const t = REQ_TINTS[i % REQ_TINTS.length]
                    const who = r.mine ? r.location : [first(r.name), r.location].filter(Boolean).join(' • ')
                    return (
                      <div key={r.id} data-pop className="wr-pre wr-card bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm border border-stone-200">
                        <div className={'w-12 h-16 rounded-lg shrink-0 flex items-center justify-center p-1 border text-[8px] font-bold text-center ' + t.bg + ' ' + t.bd + ' ' + t.tx}>
                          <span className="line-clamp-3">{String(r.title || '').split(/\s+/)[0]}</span>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          {r.mine && <span className="inline-flex w-fit px-1.5 rounded bg-[#EA580C] text-white font-bold text-[9px] mb-1">You</span>}
                          <h3 className="font-bold text-[13px] text-stone-900 leading-snug line-clamp-2">{r.title}</h3>
                          <div className="text-[10px] text-stone-500 truncate">{[who, r.maxPrice ? 'Up to ₹' + r.maxPrice : '', ago(r.createdAt)].filter(Boolean).join(' • ')}</div>
                        </div>
                        {r.mine ? (
                          <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Awaiting offers
                          </span>
                        ) : (
                          <button type="button" onClick={goSell} className="wr-btn shrink-0 px-3.5 py-1.5 rounded-full bg-[#fbbf24] hover:bg-amber-400 text-stone-900 font-bold text-[11px] active:scale-95 transition-transform">I have this</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              <button type="button" onClick={() => router.push('/requests')} className="wr-btn mt-1 w-full py-2.5 rounded-full bg-stone-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                <i className="fa-solid fa-plus text-[10px]" />Request a book
              </button>
            </div>
          )}

          {/* Safe and simple banner */}
          <section data-pop className="wr-pre p-3.5 rounded-2xl bg-[#FFFBEB] border border-amber-200 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-shield-halved text-sm" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-stone-900 leading-tight">Safe &amp; simple student marketplace</h2>
                <p className="text-[10px] text-stone-600 font-medium">Meet nearby, check the book, pay only when you&apos;re happy</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              {[
                { icon: 'fa-regular fa-comment', t: 'Chat before meeting' },
                { icon: 'fa-solid fa-wallet', t: 'Pay the seller directly' },
                { icon: 'fa-regular fa-circle-check', t: 'Listings checked by our team' },
              ].map(x => (
                <div key={x.t} className="flex flex-col items-center bg-white p-2 rounded-xl border border-amber-100">
                  <i className={x.icon + ' text-amber-700 text-sm mb-1'} />
                  <span className="text-[9px] leading-tight text-stone-800 font-semibold">{x.t}</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* ── Desktop layout (lg and up). Phones never see this. ───────── */}
      <div className="hidden lg:block w-full">
        <DesktopNav query={search} onQuery={setSearch} />
        <main className="max-w-[1200px] mx-auto px-6 pt-8 grid grid-cols-[260px_1fr] gap-8 items-start">

          {/* Filters */}
          <aside aria-label="Filters" className="sticky top-[92px] bg-white rounded-3xl border border-stone-200 shadow-sm p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-black flex items-center gap-2"><i className="fa-solid fa-sliders text-[14px]" />Filters</h2>
              <button type="button" onClick={clearAll} disabled={!anyFilter} className="text-[12px] font-bold text-amber-800 disabled:text-stone-300">Clear</button>
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 mb-2">Category</p>
              <div className="flex flex-col gap-1">
                {CATS.map(c => (
                  <button key={c.key} type="button" onClick={() => { setCat(c.key); setTab('browse') }}
                    className={'w-full text-left px-3 py-2 rounded-xl text-[13px] flex items-center justify-between transition-colors ' + (cat === c.key ? 'bg-[#F7CF65] text-stone-900 font-bold' : 'text-stone-700 font-medium hover:bg-stone-100')}>
                    <span>{c.label}</span>
                    {cat === c.key && <i className="fa-solid fa-check text-[11px]" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-stone-100 pt-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 mb-2">Meetup area</p>
              <div className="flex flex-col gap-1">
                {AREAS.map(a => (
                  <button key={a} type="button" onClick={() => setArea(a)}
                    className={'w-full text-left px-3 py-2 rounded-xl text-[13px] flex items-center justify-between transition-colors ' + (area === a ? 'bg-[#F7CF65] text-stone-900 font-bold' : 'text-stone-700 font-medium hover:bg-stone-100')}>
                    <span>{a}</span>
                    {area === a && <i className="fa-solid fa-check text-[11px]" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-stone-100 pt-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 mb-2">Condition</p>
              <div className="flex flex-wrap gap-2">
                {CONDS.map(c => (
                  <button key={c} type="button" onClick={() => setCond(cond === c ? null : c)}
                    className={'px-3.5 py-1.5 rounded-full text-[12px] transition-colors border ' + (cond === c ? 'bg-[#F7CF65] border-[#F7CF65] text-stone-900 font-bold' : 'bg-white border-stone-200 text-stone-700 font-semibold hover:bg-stone-50')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-stone-100 pt-4">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500 mb-2">Price</p>
              <button type="button" onClick={() => setUnder150(v => !v)}
                className={'px-3.5 py-1.5 rounded-full text-[12px] transition-colors border ' + (under150 ? 'bg-[#F7CF65] border-[#F7CF65] text-stone-900 font-bold' : 'bg-white border-stone-200 text-stone-700 font-semibold hover:bg-stone-50')}>
                Under ₹150
              </button>
            </div>
            <div className="border-t border-stone-100 pt-4">
              <label htmlFor="desk-sort" className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500 mb-2">Sort by</label>
              <select id="desk-sort" value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full bg-[#FAF9F5] border border-stone-200 rounded-xl text-[13px] font-semibold text-stone-800 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-stone-800">
                {SORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </aside>

          {/* Results */}
          <div className="min-w-0 flex flex-col gap-6">
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-3 flex items-center justify-between gap-4">
              <div className="flex p-1 bg-stone-100 rounded-full border border-stone-200">
                <button type="button" onClick={() => setTab('browse')} className={'px-5 py-2 rounded-full text-[13px] transition-all ' + (tab === 'browse' ? 'bg-[#F7CF65] text-stone-900 font-bold shadow-sm' : 'text-stone-500 font-medium hover:text-stone-800')}>Books for sale</button>
                <button type="button" onClick={() => setTab('requests')} className={'px-5 py-2 rounded-full text-[13px] transition-all ' + (tab === 'requests' ? 'bg-[#F7CF65] text-stone-900 font-bold shadow-sm' : 'text-stone-500 font-medium hover:text-stone-800')}>Student requests ({reqs.length})</button>
              </div>
              <div className="flex items-center gap-4 pr-2">
                <span className="text-[13px] font-bold text-stone-800">{anyFilter ? filtered.length + ' found' : activeCount + ' available'}</span>
                <button type="button" onClick={() => setPlaceOpen(true)} className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 transition-colors rounded-full px-4 py-2 text-[12px] font-bold text-stone-800">
                  <i className="fa-solid fa-location-dot text-[12px]" />
                  {placeText}
                  <i className="fa-solid fa-chevron-down text-[10px] text-stone-500" />
                </button>
              </div>
            </div>

            {tab === 'browse' ? (
              <>
                <div>
                  <h1 className="text-[22px] font-black tracking-tight text-stone-900">Books from students near you</h1>
                  <p className="text-[14px] text-stone-600 font-medium mt-0.5">Checked listings, pickups in Chandigarh, Mohali and Panchkula</p>
                </div>

                {error ? (
                  <div className="bg-white rounded-2xl p-10 text-center border border-stone-200 shadow-sm">
                    <p className="text-[14px] text-stone-600 mb-4">{error}</p>
                    <button type="button" onClick={() => window.location.reload()} className="px-6 py-2.5 bg-[#FBBF24] text-stone-900 text-[13px] font-bold rounded-full">Try again</button>
                  </div>
                ) : !loaded ? (
                  <div className="grid grid-cols-4 gap-4" aria-busy="true" aria-label="Loading books">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(k => (
                      <div key={k} className="flex flex-col bg-white rounded-2xl p-3 shadow-sm border border-stone-200">
                        <div className="w-full aspect-[3/4] rounded-xl wr-skel mb-2" />
                        <div className="h-3.5 w-12 rounded wr-skel" />
                        <div className="h-3.5 rounded wr-skel mt-2" />
                        <div className="h-3.5 w-2/3 rounded wr-skel mt-1.5" />
                        <div className="h-5 w-16 rounded wr-skel mt-2" />
                        <div className="h-9 w-full rounded-full wr-skel mt-3" />
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 text-center border border-stone-200 shadow-sm">
                    <h2 className="text-[17px] font-black mb-1">Nothing found</h2>
                    <p className="text-[14px] text-stone-600 mb-5">Try a different search or filter, or ask for the book you need.</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {anyFilter && <button type="button" onClick={clearAll} className="px-6 py-2.5 bg-[#FBBF24] text-stone-900 text-[13px] font-bold rounded-full">Clear filters</button>}
                      <button type="button" onClick={() => router.push('/requests')} className="px-6 py-2.5 bg-stone-900 text-white text-[13px] font-bold rounded-full">Request this book</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {filtered.map((l: any) => {
                      const sold = !!l.sold
                      const isFree = Number(l.price) === 0
                      const off = offPct(l)
                      const seller = l.seller?.name ? first(l.seller.name) : ''
                      const place2 = (l.location || '').split(',')[0]
                      const metaLine = [seller, place2].filter(Boolean).join(' • ')
                      const mine = !!user?.id && user.id === l.sellerId
                      return (
                        <div key={l.id} onClick={() => router.push('/listing/' + l.id)} className="wr-card flex flex-col bg-white rounded-2xl p-3 shadow-sm border border-stone-200 relative justify-between cursor-pointer">
                          <div>
                            <div className="flex items-center justify-between mb-1.5 min-h-6">
                              {sold ? <span className="px-1.5 py-0.5 rounded-md bg-stone-500 text-white font-bold text-[10px] uppercase tracking-wide">Sold</span>
                                : isFree ? <span className="px-1.5 py-0.5 rounded-md bg-[#a73a00] text-white font-bold text-[10px] uppercase tracking-wide">Free</span>
                                : off > 0 ? <span className="px-1.5 py-0.5 rounded-md bg-[#795900] text-white font-bold text-[10px] uppercase tracking-wide">{off}% off MRP</span>
                                : l.featured ? <span className="px-1.5 py-0.5 rounded-md bg-stone-900 text-white font-bold text-[10px] uppercase tracking-wide">Featured</span>
                                : <span />}
                              {heart(l)}
                            </div>
                            <div className="relative w-full aspect-[3/4] rounded-xl bg-stone-50 overflow-hidden flex items-center justify-center mb-2 text-5xl">
                              {l.images?.[0]
                                ? <img src={l.images[0]} alt={l.title} className={'w-full h-full object-cover ' + (sold ? 'opacity-50' : '')} />
                                : <span>{l.emoji || '📚'}</span>}
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              {l.condition && <span className={'w-fit px-1.5 py-0.5 rounded font-bold text-[10px] border ' + condCls(l.condition)}>{condLabel(l.condition)}</span>}
                              <h3 className={'font-bold text-[14px] leading-snug line-clamp-2 min-h-[2.6em] mt-0.5 ' + (sold ? 'text-stone-400' : 'text-stone-900')}>
                                <a href={'/listing/' + l.id} onClick={e => e.stopPropagation()}>{l.title}</a>
                              </h3>
                              {metaLine && <div className="text-stone-500 text-[12px] truncate">{metaLine}</div>}
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                {isFree ? (
                                  <>
                                    <span className="text-[16px] font-black text-[#EA580C]">₹0</span>
                                    <span className="text-[11px] text-[#EA580C] font-bold">Community Gift</span>
                                  </>
                                ) : (
                                  <>
                                    <span className={'text-[18px] font-black ' + (sold ? 'text-stone-400' : 'text-stone-900')}>₹{l.price}</span>
                                    {Number(l.origPrice) > Number(l.price) && <span className="text-[11px] text-stone-400 line-through">₹{l.origPrice}</span>}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <button type="button" disabled={sold || (!!chatBusy && !mine)} onClick={e => openChat(l, e)}
                            className={'wr-btn mt-3 w-full py-2.5 rounded-full font-bold text-[13px] flex items-center justify-center gap-1 transition-colors disabled:opacity-50 ' + (isFree ? 'bg-orange-100 hover:bg-orange-200 text-[#a73a00]' : 'bg-[#fbbf24] hover:bg-amber-400 text-stone-900')}>
                            {chatBusy === l.id
                              ? <i className="fa-solid fa-spinner fa-spin text-[11px]" />
                              : <i className={(isFree ? 'fa-solid fa-gift' : 'fa-regular fa-comment') + ' text-[11px]'} />}
                            <span>{sold ? 'Sold' : mine ? 'Your listing' : isFree ? 'Claim' : 'Chat'}</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* People are looking for */}
                {reqs.length > 0 && (
                  <div className="border-t border-stone-200 pt-8 mt-2">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-[22px] font-black tracking-tight text-stone-900">People are looking for</h2>
                        <p className="text-[13px] text-stone-600 font-medium mt-0.5">Have an extra copy? Sell it directly.</p>
                      </div>
                      {seeAll('/requests')}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {reqs.slice(0, 3).map((r, i) => {
                        const t = REQ_TINTS[i % REQ_TINTS.length]
                        const who = r.mine ? r.location : [first(r.name), r.location].filter(Boolean).join(' • ')
                        return (
                          <div key={r.id} className="wr-card bg-white rounded-2xl p-4 flex flex-col justify-between shadow-sm border border-stone-200">
                            <div className="flex items-start gap-3">
                              <div className={'w-12 h-16 rounded-lg shrink-0 flex items-center justify-center p-1 border text-[9px] font-bold text-center ' + t.bg + ' ' + t.bd + ' ' + t.tx}>
                                <span className="line-clamp-3">{String(r.title || '').split(/\s+/)[0]}</span>
                              </div>
                              <div className="min-w-0">
                                {r.mine && <span className="inline-flex w-fit px-1.5 rounded bg-[#EA580C] text-white font-bold text-[9px] mb-1">You</span>}
                                <h3 className="font-bold text-[14px] text-stone-900 leading-snug line-clamp-2">{r.title}</h3>
                                {r.maxPrice ? <span className="text-[12px] text-stone-600 font-semibold">Up to ₹{r.maxPrice}</span> : null}
                                {who && <div className="text-[11px] text-stone-500 truncate">{who}</div>}
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-[11px] text-stone-400">{ago(r.createdAt)}</span>
                              {r.mine
                                ? <span className="text-[12px] text-amber-800 font-bold">Awaiting offers</span>
                                : <button type="button" onClick={goSell} className="wr-btn px-5 py-2 rounded-full bg-[#fbbf24] hover:bg-amber-400 text-stone-900 font-bold text-[12px] transition-colors">I have this</button>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-[22px] font-black tracking-tight text-stone-900">Books students are looking for</h1>
                    <p className="text-[14px] text-stone-600 font-medium mt-0.5">Have one of these? Sell it in a minute.</p>
                  </div>
                  <button type="button" onClick={() => router.push('/requests')} className="wr-btn px-5 py-2.5 rounded-full bg-stone-900 text-white font-bold text-[13px] flex items-center gap-2">
                    <i className="fa-solid fa-plus text-[11px]" />Request a book
                  </button>
                </div>
                {reqs.length === 0 ? (
                  <div className="bg-white rounded-2xl p-10 text-center border border-stone-200 shadow-sm">
                    <h2 className="text-[17px] font-black mb-1">No open requests right now</h2>
                    <p className="text-[14px] text-stone-600 mb-5">Can&apos;t find a book? Ask and sellers nearby will see it.</p>
                    <button type="button" onClick={() => router.push('/requests')} className="px-6 py-2.5 bg-stone-900 text-white text-[13px] font-bold rounded-full">Request a book</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {reqs.map((r, i) => {
                      const t = REQ_TINTS[i % REQ_TINTS.length]
                      const who = r.mine ? r.location : [first(r.name), r.location].filter(Boolean).join(' • ')
                      return (
                        <div key={r.id} className="wr-card bg-white rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm border border-stone-200">
                          <div className="flex items-start gap-3">
                            <div className={'w-12 h-16 rounded-lg shrink-0 flex items-center justify-center p-1 border text-[9px] font-bold text-center ' + t.bg + ' ' + t.bd + ' ' + t.tx}>
                              <span className="line-clamp-3">{String(r.title || '').split(/\s+/)[0]}</span>
                            </div>
                            <div className="min-w-0">
                              {r.mine && <span className="inline-flex w-fit px-1.5 rounded bg-[#EA580C] text-white font-bold text-[9px] mb-1">You</span>}
                              <h3 className="font-bold text-[14px] text-stone-900 leading-snug line-clamp-2">{r.title}</h3>
                              <div className="text-[12px] text-stone-500 truncate">{[who, r.maxPrice ? 'Up to ₹' + r.maxPrice : '', ago(r.createdAt)].filter(Boolean).join(' • ')}</div>
                            </div>
                          </div>
                          {r.mine
                            ? <span className="text-[12px] text-amber-800 font-bold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />Awaiting offers</span>
                            : <button type="button" onClick={goSell} className="wr-btn w-full py-2 rounded-full bg-[#fbbf24] hover:bg-amber-400 text-stone-900 font-bold text-[12px] transition-colors">I have this</button>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
        <DesktopFooter />
      </div>

      {/* Floating "Sell a book" button (stays inside the phone-width column) */}
      <div className="fixed inset-x-0 z-40 mx-auto w-full max-w-[430px] px-4 pointer-events-none flex justify-end lg:hidden" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 68px)' }}>
        <button type="button" onClick={goSell} className="pointer-events-auto bg-stone-900 hover:bg-black text-amber-300 px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-xs active:scale-95 transition-transform">
          <i className="fa-solid fa-plus text-xs" />
          <span className="font-bold tracking-tight">Sell a book</span>
        </button>
      </div>
    </div>
  )
}