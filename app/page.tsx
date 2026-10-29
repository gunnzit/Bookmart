'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { schools, isRegister } from '@/lib/kit-prices'
import LocationSheet, { useDeliveryPlace } from '@/components/LocationSheet'
import { SETS_OPEN } from '@/lib/features'
import Logo from '@/components/Logo'

// ── Contact (change here only) ────────────────────────────────────────────
const WHATSAPP_NUMBER = '918872235738'
const WA_HELP_LINK = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent('Hi, I need help with a school book set on wrap&read')

// ── Photos (put your own files in public/photos) ──────────────────────────
const STORE_PHOTO = '/photos/store.jpg'

const HOME_CATS = [
  { key: 'textbook', label: 'Textbooks', c1: '#FDE7C7', c2: '#FFCF86', border: 'border-amber-300/60' },
  { key: 'novel', label: 'Novels', c1: '#FCE2EB', c2: '#FFB9D3', border: 'border-pink-300/60' },
  { key: 'competitive', label: 'Competitive', c1: '#E2F7E4', c2: '#A9EBB5', border: 'border-emerald-300/60' },
  { key: 'stationery', label: 'Stationery', c1: '#ECE7FE', c2: '#C8B9FF', border: 'border-purple-300/60' },
]

// Soft colours for books that have no photo yet (they rotate)
const TINTS = [
  { bg: 'bg-orange-50/60', bd: 'border-orange-100', tx: 'text-amber-900' },
  { bg: 'bg-cyan-50/60', bd: 'border-cyan-100', tx: 'text-sky-800' },
  { bg: 'bg-amber-50', bd: 'border-amber-100', tx: 'text-red-800' },
  { bg: 'bg-yellow-100/70', bd: 'border-amber-200', tx: 'text-stone-900' },
]
const STUDENT_TINTS = [
  { bg: 'bg-emerald-100', bd: 'border-emerald-200', tag: 'bg-emerald-700', tx: 'text-emerald-900' },
  { bg: 'bg-blue-100', bd: 'border-blue-200', tag: 'bg-blue-700', tx: 'text-blue-900' },
  { bg: 'bg-teal-100', bd: 'border-teal-200', tag: 'bg-teal-700', tx: 'text-teal-900' },
  { bg: 'bg-orange-100', bd: 'border-orange-200', tag: 'bg-orange-700', tx: 'text-orange-900' },
]
const REQ_TINTS = [
  { bg: 'bg-amber-100', bd: 'border-amber-200', tx: 'text-amber-900' },
  { bg: 'bg-blue-100', bd: 'border-blue-200', tx: 'text-blue-900' },
  { bg: 'bg-emerald-100', bd: 'border-emerald-200', tx: 'text-emerald-900' },
]

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
const first = (n?: string | null) => String(n || '').trim().split(/\s+/)[0] || ''
const priceText = (p: any) => (Number(p) === 0 ? 'Free' : '₹' + p)
const condCls = (c: string) =>
  /new/i.test(c) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
const ago = (d?: string) => {
  if (!d) return ''
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (!(days >= 0)) return ''
  return days === 0 ? 'Posted today' : days === 1 ? 'Posted yesterday' : 'Posted ' + days + ' days ago'
}

// Same default selection rules as the School Sets page (so the price matches)
function kitSummary(school: string, cls: number) {
  const kit = schools[school]?.[cls]
  if (!kit) return { total: 0, books: 0, notebooks: 0, stationery: 0 }
  let total = 0
  let books = 0
  let notebooks = 0
  let stationery = 0
  for (const sec of ['ncert', 'pvt'] as const) {
    for (const it of kit[sec]) {
      if (!it.oos && !it.optional) { total += it.price; books++ }
    }
  }
  for (const it of kit.stationery) {
    if (!it.oos) { total += it.price; stationery++ }
  }
  for (const n of kit.notebooks) {
    if (!n.oos) { total += (isRegister(n.name) ? 68 : 50) * n.qty; notebooks += n.qty }
  }
  return { total, books, notebooks, stationery }
}

// Words the search bar types out, one after another
const PHRASES = ['NCERT Class 10 Maths', 'Atomic Habits', 'JEE Physics', 'Class 8 notebooks', 'Hindi Class 9', 'Harry Potter', 'NEET Biology', 'RD Sharma']

// All the motion on this page lives here
const WR_CSS = `
@keyframes wr-pop{0%{opacity:0;transform:translateY(24px) scale(.88)}60%{opacity:1;transform:translateY(-4px) scale(1.04)}100%{opacity:1;transform:none}}
@keyframes wr-grad{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes wr-bob{0%,100%{translate:0 0}50%{translate:0 -2px}}
@keyframes wr-shine{0%{transform:translateX(-130%)}45%,100%{transform:translateX(130%)}}
@keyframes wr-floaty{0%,100%{translate:0 0}50%{translate:0 -5px}}
@keyframes wr-blink{0%,45%{opacity:1}50%,95%{opacity:0}100%{opacity:1}}
@keyframes wr-hp{0%{transform:scale(1)}35%{transform:scale(1.6)}70%{transform:scale(.9)}100%{transform:scale(1)}}
@keyframes wr-sk{0%{background-position:100% 0}100%{background-position:-100% 0}}
@keyframes wr-su{0%{opacity:0;transform:translateY(40px) scale(.92)}100%{opacity:1;transform:none}}
@keyframes wr-ring{0%{box-shadow:0 0 0 0 rgba(234,88,12,.55)}100%{box-shadow:0 0 0 8px rgba(234,88,12,0)}}
.wr-pre{opacity:0}
.wr-anim{animation:wr-pop .6s cubic-bezier(.22,1,.36,1) var(--d,0ms) backwards}
.wr-card{transition:transform .2s ease,box-shadow .2s ease}
.wr-card:active{transform:scale(.97)}
@media (hover:hover){.wr-card:hover{transform:translateY(-3px);box-shadow:0 10px 24px rgba(120,70,40,.15)}}
.wr-pill{position:relative;overflow:hidden;isolation:isolate;background-image:linear-gradient(110deg,var(--c1),var(--c2),var(--c1));background-size:230% 100%;animation:wr-grad 5s ease-in-out infinite,wr-bob 3.4s ease-in-out infinite;animation-delay:var(--pd,0s);transition:transform .15s ease}
.wr-pill:active{transform:scale(.93)}
.wr-pill::after,.wr-btn::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.8) 50%,transparent 70%);transform:translateX(-130%);animation:wr-shine 3.4s ease-in-out infinite;animation-delay:var(--pd,0s)}
.wr-btn{position:relative;overflow:hidden;isolation:isolate}
.wr-btn::after{background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.35) 50%,transparent 65%);animation-duration:4.2s}
.wr-btn2::after{animation-delay:1.6s}
.wr-float{animation:wr-floaty 3.6s ease-in-out infinite}
.wr-float2{animation:wr-floaty 4.4s ease-in-out infinite;animation-delay:-1.2s}
.wr-caret{display:inline-block;width:1.5px;height:14px;background:#78716c;margin-left:1px;vertical-align:-2px;animation:wr-blink 1s step-end infinite}
.wr-heart{display:inline-block;animation:wr-hp .5s cubic-bezier(.34,1.56,.64,1)}
.wr-skel{background:linear-gradient(90deg,#f1ede6 25%,#fbf8f1 40%,#f1ede6 60%);background-size:300% 100%;animation:wr-sk 1.4s ease-in-out infinite}
.wr-slideup{animation:wr-su .55s cubic-bezier(.34,1.56,.64,1) both}
.wr-pulse{animation:wr-ring 1.8s ease-out infinite}
.wr-snap{scroll-snap-type:x proximity;scroll-padding-left:14px}
.wr-snap-item{scroll-snap-align:start}
@media (prefers-reduced-motion:reduce){
.wr-pre{opacity:1}
.wr-anim,.wr-pill,.wr-pill::after,.wr-btn::after,.wr-float,.wr-float2,.wr-caret,.wr-heart,.wr-skel,.wr-slideup,.wr-pulse{animation:none!important}
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

export default function HomePage() {
  const router = useRouter()
  // Sign-in is now a real page (/sign-in). After signing in, the person comes back here.
  function goSignIn() {
    router.push('/sign-in?redirect_url=' + encodeURIComponent(window.location.pathname + window.location.search))
  }
  const { isSignedIn, user } = useUser()
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
  const [storeOk, setStoreOk] = useState(true)
  const [unread, setUnread] = useState(0)
  const [reqs, setReqs] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [popId, setPopId] = useState('')

  useEffect(() => {
    fetch('/api/listings')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setListings(d.filter((l: any) => (!l.status || l.status === 'active') && !l.sold))
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
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
  }, [listings, reqs, loaded, cart.length, school])

  const schoolNames = Object.keys(schools)
  const classes = Object.keys(schools[school]).map(Number).sort((a, b) => a - b)
  const summary = kitSummary(school, cls)
  const cartTotal = cart.reduce((sum, k) => sum + (k.kitSubtotal || 0), 0)

  const featured = listings.filter(l => l.featured).slice(0, 6)
  const others = listings.filter(l => !l.featured)
  const gridList = (others.length >= 2 ? others : listings).slice(0, 4)
  const free = listings.filter(l => Number(l.price) === 0).slice(0, 6)

  const setLine = [
    summary.books + ' books',
    summary.notebooks > 0 ? summary.notebooks + ' notebooks' : '',
    summary.stationery > 0 ? summary.stationery + ' stationery items' : '',
  ].filter(Boolean).join(' • ')

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
      if (d.saved) { setPopId(l.id); setTimeout(() => setPopId(''), 700) }
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

  function heart(l: any, cls: string, size: string) {
    const on = saved.has(l.id)
    return (
      <button aria-label={on ? 'Remove from saved' : 'Save book'} onClick={e => toggleHeart(l, e)} className={cls}>
        <i className={(on ? 'fa-solid text-red-500 ' : 'fa-regular ') + 'fa-heart ' + size + (popId === l.id ? ' wr-heart' : '')} />
      </button>
    )
  }

  function seeAll(href: string, label = 'See all') {
    return (
      <button onClick={() => router.push(href)} className="text-[13px] font-bold text-stone-700 hover:text-black flex items-center space-x-1">
        <span>{label}</span>
        <i className="fa-solid fa-arrow-right text-[11px]" />
      </button>
    )
  }

  const placeText = !place
    ? <span className="truncate text-[12px] font-semibold text-stone-800">Choose your delivery area</span>
    : place.kind === 'pickup'
      ? <span className="truncate text-[12px] font-semibold text-stone-800">Pickup from <strong className="font-bold text-stone-900">Sector 40-C</strong></span>
      : <span className="truncate text-[12px] font-semibold text-stone-800">Deliver to <strong className="font-bold text-stone-900">{place.area.split(',').slice(0, 2).join(',').trim()}</strong></span>

  const iconBtn = 'relative w-9 h-9 bg-white/80 rounded-full flex items-center justify-center text-stone-900 shadow-sm cursor-pointer hover:bg-white transition border border-amber-300/40'

  return (
    <div className="min-h-screen bg-[#ECEAE5] flex justify-center text-stone-900 antialiased font-['Plus_Jakarta_Sans',sans-serif]">
      <style>{WR_CSS}</style>
      <LocationSheet open={sheetOpen} onClose={() => setSheetOpen(false)} place={place} onSelect={setPlace} />

      <div className="w-full max-w-[430px] bg-[#FAF8F5] min-h-screen flex flex-col relative shadow-2xl border-x border-stone-200 pb-28">

        {/* ── Top header ───────────────────────────────────────────── */}
        <header className="bg-[#F7CF65] px-4 pb-5 rounded-b-[2.2rem] shadow-sm relative z-10" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
          {/* Logo and top actions */}
          <div className="flex items-center justify-between mb-3">
            <a href="/" className="flex items-center">
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

          {/* Delivery location pill */}
          <button type="button" onClick={() => setSheetOpen(true)} className="w-full bg-white py-2 px-3.5 rounded-full flex items-center justify-between text-[13px] font-bold text-stone-800 shadow-sm border border-amber-200/50 mb-3 active:scale-[0.99] transition">
            <div className="flex items-center truncate">
              <i className="fa-solid fa-location-dot text-stone-900 mr-2 text-[13px]" />
              {placeText}
            </div>
            <i className="fa-solid fa-chevron-down text-[11px] text-stone-500 ml-2" />
          </button>

          {/* Search and filter */}
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-[13px]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search books, authors, schools"
                type="text"
                className="w-full bg-white pl-9 pr-3 py-2 rounded-full text-[13px] placeholder-stone-400 font-medium border-0 focus:ring-1 focus:ring-stone-800 focus:outline-none shadow-sm"
              />
              {search === '' && (
                <div aria-hidden className="absolute left-9 right-3 top-1/2 -translate-y-1/2 text-[13px] text-stone-400 font-medium pointer-events-none truncate">
                  {'Search "'}<TypeLine /><span className="wr-caret" />{'"'}
                </div>
              )}
            </div>
            <button type="button" onClick={() => router.push('/marketplace')} className="bg-white px-3.5 py-2 rounded-full flex items-center space-x-1.5 text-[13px] font-bold text-stone-800 shadow-sm border border-amber-100 flex-shrink-0 active:scale-95 transition">
              <i className="fa-solid fa-sliders text-[13px]" />
              <span>Filter</span>
            </button>
          </form>

          {/* Quick category chips */}
          <nav aria-label="Categories" className="flex items-center justify-between gap-1.5 mt-3 pt-0.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {HOME_CATS.map((c, i) => (
              <button key={c.key} type="button" onClick={() => router.push('/marketplace?cat=' + c.key)}
                style={{ ['--c1' as any]: c.c1, ['--c2' as any]: c.c2, ['--pd' as any]: i * 0.55 + 's' }}
                className={'wr-pill flex-1 py-1.5 px-2.5 rounded-xl flex items-center justify-center text-[12px] font-bold text-stone-800 border whitespace-nowrap text-center ' + c.border}>
                {c.label}
              </button>
            ))}
          </nav>
        </header>

        {/* ── Main content ─────────────────────────────────────────── */}
        <main className="px-3.5 pt-4 space-y-4">

          {/* Sell a book banner */}
          <section data-pop className="wr-pre bg-gradient-to-r from-[#FDEEAB] via-[#FCE99B] to-[#FCE389] p-4 rounded-2xl shadow-sm border border-amber-200 relative overflow-hidden flex items-center justify-between">
            <div className="z-10 max-w-[55%]">
              <h2 className="text-lg font-black text-stone-900 leading-tight">Sell a book</h2>
              <p className="text-[13px] text-stone-700 mt-1 font-medium leading-snug">Give your books a second life.</p>
              <button type="button" onClick={goSell} className="wr-btn inline-flex items-center space-x-1.5 bg-stone-900 text-white text-[12px] font-bold px-3.5 py-1.5 rounded-full mt-3 shadow hover:bg-black transition">
                <span>Start selling</span>
                <i className="fa-solid fa-arrow-right text-[11px]" />
              </button>
            </div>
            <div className="relative w-36 h-24 flex items-end justify-center pr-1">
              <div className="absolute top-2 left-2 flex space-x-1 text-stone-700 font-bold opacity-60">
                <span className="block w-2.5 h-0.5 bg-stone-700 rotate-[-30deg]" />
                <span className="block w-3 h-0.5 bg-stone-700" />
                <span className="block w-2.5 h-0.5 bg-stone-700 rotate-[30deg]" />
              </div>
              <div className="wr-float relative flex flex-col items-center">
                <div className="w-20 h-4 bg-teal-600 rounded shadow-sm border-t border-teal-400 flex items-center px-1"><span className="w-full h-0.5 bg-white/40 rounded" /></div>
                <div className="w-24 h-5 bg-amber-600 rounded shadow-sm -mt-0.5 border-t border-amber-400 flex items-center px-1"><span className="w-full h-0.5 bg-white/40 rounded" /></div>
                <div className="w-28 h-6 bg-blue-700 rounded shadow border-t border-blue-400 flex items-center px-1"><span className="w-full h-1 bg-white/30 rounded" /></div>
              </div>
              <div className="wr-float2 w-7 h-10 bg-stone-900 rounded-b-md ml-2 flex items-start justify-center pt-0.5 space-x-0.5 relative shadow">
                <div className="w-1 h-6 bg-red-500 rounded-full transform -rotate-12" />
                <div className="w-1.5 h-7 bg-amber-400 rounded-full transform rotate-3" />
                <div className="w-1 h-5 bg-blue-400 rounded-full" />
              </div>
            </div>
          </section>

          {/* Complete school sets (only while sets are open) */}
          {SETS_OPEN && (
            <section data-pop className="wr-pre bg-gradient-to-br from-[#FEF7D9] via-[#FDF1BF] to-[#FCE59F] p-4 rounded-3xl border border-amber-300/70 shadow-sm relative">
              <span className="inline-block bg-[#FBD65B] border border-amber-400/80 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase text-stone-900 mb-1.5">School Sets</span>
              <div className="flex justify-between items-start">
                <div className="max-w-[58%]">
                  <h2 className="text-xl font-black text-stone-900 leading-tight">Complete School Sets Delivered to Your Door</h2>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2.5 text-[12px] font-semibold text-stone-700">
                    <span className="flex items-center"><i className="fa-solid fa-bag-shopping text-stone-700 mr-1 text-[11px]" />Books</span>
                    <span className="text-stone-400">+</span>
                    <span className="flex items-center"><i className="fa-regular fa-newspaper text-stone-700 mr-1 text-[11px]" />Notebooks</span>
                    <span className="text-stone-400">+</span>
                    <span className="flex items-center"><i className="fa-solid fa-pen-fancy text-stone-700 mr-1 text-[11px]" />Stationery</span>
                  </div>
                  <button type="button" onClick={() => pickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="wr-btn mt-3.5 bg-stone-900 text-white text-[12px] font-bold px-3.5 py-1.5 rounded-full inline-flex items-center space-x-1 shadow hover:bg-black transition">
                    <span>Find your set</span>
                    <i className="fa-solid fa-arrow-down text-[11px]" />
                  </button>
                </div>
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="wr-float w-24 h-28 bg-[#1E293B] rounded-2xl relative shadow-lg border-2 border-stone-800 flex flex-col items-center p-1.5">
                    <div className="w-8 h-2 bg-amber-500 rounded-full mt-1" />
                    <div className="w-16 h-10 border-2 border-dashed border-stone-600 rounded-lg mt-2 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">KIT</span>
                    </div>
                    <div className="w-20 h-7 bg-[#0F172A] rounded-lg mt-1 border-t-2 border-amber-500" />
                  </div>
                  <div className="wr-float2 absolute -left-1 bottom-1 w-14 h-16 bg-blue-600 rounded-sm shadow-md border-l-2 border-white -rotate-12 flex flex-col justify-end p-1 text-[8px] text-white font-bold">
                    Class {cls}
                  </div>
                </div>
              </div>

              {/* School and class selector card */}
              <div ref={pickerRef} className="bg-white p-3.5 rounded-2xl mt-4 shadow-sm border border-amber-200/70 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 mb-1">Select your school</label>
                    <div className="relative">
                      <select value={school} onChange={e => pickSchool(e.target.value)} className="w-full bg-[#FAF9F5] border border-stone-200 rounded-xl text-[13px] font-bold text-stone-800 py-1.5 pl-2.5 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-stone-800 truncate">
                        {schoolNames.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-stone-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 mb-1">Select class</label>
                    <div className="relative">
                      <select value={cls} onChange={e => setCls(Number(e.target.value))} className="w-full bg-[#FAF9F5] border border-stone-200 rounded-xl text-[13px] font-bold text-stone-800 py-1.5 pl-2.5 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-stone-800">
                        {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-stone-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFF4D2] border border-amber-300 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[13px] font-bold text-stone-900 truncate">Class {cls} Complete Set</h4>
                    <p className="text-[10px] text-stone-600 font-medium truncate">{setLine}</p>
                  </div>
                  <div className="border-l border-amber-300/80 pl-2 shrink-0 text-right">
                    <span className="block text-[9px] text-stone-500 font-medium leading-none">Estimated Total</span>
                    <div className="flex items-center space-x-0.5 justify-end mt-0.5">
                      <span className="text-[13px] font-black text-stone-900 leading-none">₹{summary.total.toLocaleString('en-IN')}</span>
                      <i title="Estimated from the default selection of the set" className="fa-regular fa-circle-question text-[10px] text-stone-400" />
                    </div>
                  </div>
                  <button type="button" onClick={() => router.push('/school-sets?school=' + encodeURIComponent(school) + '&class=' + cls)} className="wr-btn wr-btn2 bg-stone-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg flex items-center space-x-1 shrink-0 hover:bg-black transition">
                    <span className="whitespace-nowrap">View set</span>
                    <i className="fa-solid fa-arrow-right text-[9px]" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Featured books */}
          {featured.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-base font-black text-stone-900">Featured Books</h2>
                {seeAll('/marketplace')}
              </div>
              <div className="wr-snap flex space-x-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {featured.map((l, i) => {
                  const t = TINTS[i % TINTS.length]
                  const off = Number(l.origPrice) > Number(l.price) ? Math.round((1 - Number(l.price) / Number(l.origPrice)) * 100) : 0
                  const sub = l.author || l.subtitle || l.condition || ''
                  return (
                    <div key={l.id} data-pop onClick={() => router.push('/listing/' + l.id)} className="wr-pre wr-card wr-snap-item w-28 flex-shrink-0 bg-white p-2 rounded-2xl border border-stone-200 shadow-2xs relative flex flex-col justify-between cursor-pointer">
                      <div className={'relative rounded-xl p-1 mb-1.5 aspect-[3/4] flex items-center justify-center overflow-hidden border ' + t.bg + ' ' + t.bd}>
                        {l.images?.[0]
                          ? <img src={l.images[0]} alt={l.title} className="absolute inset-0 w-full h-full object-cover" />
                          : <div className="text-center p-1"><span className={'block text-[12px] font-black tracking-tight leading-tight line-clamp-3 ' + t.tx}>{l.title}</span></div>}
                        {off > 0 && <span className="absolute top-1 left-1 bg-[#EA580C] text-white text-[9px] font-black px-1 py-0.5 rounded z-10">{off}% OFF</span>}
                        {heart(l, 'absolute top-1 right-1 w-5 h-5 bg-white/80 rounded-full flex items-center justify-center text-stone-400 hover:text-red-500 z-10', 'text-[11px]')}
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold text-stone-900 truncate">{l.title}</h3>
                        {sub && <p className="text-[11px] text-stone-500 truncate">{sub}</p>}
                        <div className="flex items-baseline space-x-1 mt-1">
                          <span className="text-[13px] font-black text-[#EA580C]">{priceText(l.price)}</span>
                          {Number(l.origPrice) > Number(l.price) && <span className="text-[10px] text-stone-400 line-through">₹{l.origPrice}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Books from students near you */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-base font-black text-stone-900">Books from students near you</h2>
              {seeAll('/marketplace')}
            </div>
            {!loaded ? (
              <div className="grid grid-cols-2 gap-2.5">
                {[0, 1, 2, 3].map(k => (
                  <div key={k} className="bg-white p-2.5 rounded-2xl border border-stone-200 shadow-2xs">
                    <div className="flex space-x-2">
                      <div className="w-14 h-[72px] rounded-lg wr-skel" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 rounded wr-skel" />
                        <div className="h-2.5 w-2/3 rounded wr-skel" />
                        <div className="h-2.5 w-1/2 rounded wr-skel" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                      <div className="h-3 w-12 rounded wr-skel" />
                      <div className="h-5 w-14 rounded-lg wr-skel" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs text-center">
                <p className="text-[13px] text-stone-600 mb-3">No books listed yet. Be the first to sell yours.</p>
                <button type="button" onClick={goSell} className="bg-[#FFF4D2] hover:bg-amber-200 text-stone-900 text-[12px] font-bold px-4 py-1.5 rounded-lg border border-amber-300 transition">Sell a book</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {gridList.map((l, i) => {
                  const t = STUDENT_TINTS[i % STUDENT_TINTS.length]
                  const pct = Number(l.origPrice) > Number(l.price) && Number(l.price) > 0 ? Math.round((Number(l.price) / Number(l.origPrice)) * 100) : 0
                  const who = [first(l.seller?.name), l.location].filter(Boolean).join(' • ')
                  const author = l.author || ''
                  return (
                    <div key={l.id} data-pop onClick={() => router.push('/listing/' + l.id)} className="wr-pre wr-card bg-white p-2.5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between cursor-pointer">
                      <div className="flex space-x-2">
                        <div className={'relative w-14 h-[72px] rounded-lg flex-shrink-0 flex items-center justify-center p-1 overflow-hidden border ' + t.bg + ' ' + t.bd}>
                          {l.images?.[0]
                            ? <img src={l.images[0]} alt={l.title} className="absolute inset-0 w-full h-full object-cover" />
                            : <div className={'text-center text-[9px] font-black mt-4 line-clamp-3 ' + t.tx}>{l.title}</div>}
                          {pct > 0 && <span className={'absolute top-0.5 left-0.5 text-white text-[8px] font-bold px-1 rounded z-10 whitespace-nowrap leading-tight ' + t.tag}>{pct}% of MRP</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between">
                            <h3 className="text-[12px] font-bold text-stone-900 leading-tight truncate">{l.title}</h3>
                            {heart(l, 'ml-1 shrink-0', 'text-[11px] ' + (saved.has(l.id) ? '' : 'text-stone-300'))}
                          </div>
                          {author && <p className="text-[10px] text-stone-500 truncate">{author}</p>}
                          {who && <p className="text-[10px] text-stone-500 truncate"><i className="fa-solid fa-user text-[8px] mr-1" />{who}</p>}
                          {l.condition && <span className={'inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ' + condCls(String(l.condition))}>{l.condition}</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                        <div className="flex items-baseline space-x-1 min-w-0">
                          <span className="text-[13px] font-black text-amber-700">{priceText(l.price)}</span>
                          {Number(l.origPrice) > Number(l.price) && <span className="text-[10px] text-stone-400 line-through">₹{l.origPrice}</span>}
                        </div>
                        <button type="button" disabled={!!chatBusy} onClick={e => openChat(l, e)} className="bg-[#FFF4D2] hover:bg-amber-200 text-stone-900 text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1 border border-amber-300 transition disabled:opacity-60">
                          <i className={(chatBusy === l.id ? 'fa-solid fa-spinner fa-spin' : 'fa-regular fa-comment') + ' text-[10px]'} />
                          <span>Chat</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* People are looking for */}
          {reqs.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-base font-black text-stone-900">People are looking for</h2>
                {seeAll('/requests')}
              </div>
              <div className="wr-snap flex space-x-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {reqs.map((r, i) => {
                  const t = REQ_TINTS[i % REQ_TINTS.length]
                  const subject = String(r.title || '').split(/\s+/)[0]
                  const who = r.mine ? r.location : [first(r.name), r.location].filter(Boolean).join(' • ')
                  const when = ago(r.createdAt)
                  return (
                    <div key={r.id} data-pop className="wr-pre wr-card wr-snap-item w-40 flex-shrink-0 bg-white p-2.5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
                      <div className="flex items-start space-x-2">
                        <div className={'relative w-10 h-14 rounded flex-shrink-0 flex items-center justify-center text-[8px] font-bold border ' + t.bg + ' ' + t.bd + ' ' + t.tx}>
                          {r.mine && <span className="absolute -top-1 -left-1 bg-[#EA580C] text-white text-[8px] font-black px-1 rounded-full">You</span>}
                          <span className="truncate px-0.5">{subject}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[11px] font-bold text-stone-900 leading-snug line-clamp-2">{r.title}</h3>
                          {r.maxPrice ? <span className="text-[10px] text-stone-500">Up to ₹{r.maxPrice}</span> : null}
                          {r.mine
                            ? <div className="mt-1"><span className="inline-block bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">Awaiting offers</span></div>
                            : who ? <p className="text-[9px] text-stone-500 truncate mt-0.5">{who}</p> : null}
                        </div>
                      </div>
                      {r.mine ? (
                        when ? <p className="text-[9px] text-stone-400 mt-2 font-medium">{when}</p> : null
                      ) : (
                        <button type="button" onClick={goSell} className="wr-btn wr-btn2 mt-2 w-full bg-[#FCE389] hover:bg-amber-300 text-stone-900 text-[10px] font-bold py-1 rounded-lg border border-amber-300 transition">
                          I have this
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Free community books */}
          {free.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-base font-black text-stone-900">Free community books</h2>
                {seeAll('/marketplace')}
              </div>
              <div className="wr-snap flex space-x-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {free.map(l => (
                  <div key={l.id} data-pop onClick={() => router.push('/listing/' + l.id)} className="wr-pre wr-card wr-snap-item w-24 flex-shrink-0 bg-white p-1.5 rounded-xl border border-stone-200 shadow-2xs flex flex-col justify-between cursor-pointer">
                    <div className="relative bg-emerald-50 rounded-lg p-1 aspect-[3/4] flex items-center justify-center border border-emerald-100 overflow-hidden">
                      {l.images?.[0]
                        ? <img src={l.images[0]} alt={l.title} className="absolute inset-0 w-full h-full object-cover" />
                        : <span className="text-[9px] font-bold text-emerald-950 text-center line-clamp-3">{l.title}</span>}
                      <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[8px] font-black px-1 rounded z-10">FREE</span>
                      {heart(l, 'absolute top-1 right-1 z-10 text-stone-400', 'text-[9px]')}
                    </div>
                    <h3 className="text-[10px] font-bold text-stone-900 mt-1 truncate">{l.title}</h3>
                    <span className="text-[9px] text-stone-400 truncate">{l.author || l.subtitle || cap(l.category || '')}</span>
                    <button type="button" disabled={!!chatBusy} onClick={e => openChat(l, e)} className="mt-1 w-full bg-[#FCE389] hover:bg-amber-300 text-stone-900 text-[10px] font-bold py-0.5 rounded border border-amber-300 disabled:opacity-60">
                      {chatBusy === l.id ? 'Opening…' : 'Claim'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* How it works and trust */}
          <section className="space-y-3">
            <h2 className="text-base font-black text-stone-900">How it works</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { n: 1, icon: 'fa-magnifying-glass', t: 'Find what you need', d: 'Search books, school sets or stationery.', arrow: true },
                { n: 2, icon: 'fa-cart-shopping', t: 'Buy or get it free', d: 'Chat with verified students and get the best deals.', arrow: true },
                { n: 3, icon: 'fa-book-bookmark', t: 'Sell your books', d: 'List your old books in minutes and help other students.', arrow: false },
              ].map(st => (
                <div key={st.n} data-pop className="wr-pre wr-card bg-[#FFF9EA] border border-amber-200 rounded-xl p-2.5 flex flex-col justify-between relative">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center">{st.n}</span>
                      {st.arrow && <i className="fa-solid fa-arrow-right text-[10px] text-stone-400" />}
                    </div>
                    <div className="my-2 text-center"><i className={'fa-solid ' + st.icon + ' text-stone-800 text-lg'} /></div>
                    <h4 className="text-[11px] font-bold text-stone-900">{st.t}</h4>
                    <p className="text-[9px] text-stone-500 mt-0.5 leading-snug">{st.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div data-pop className="wr-pre bg-[#FFFBEB] border border-amber-200/90 rounded-2xl p-3 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="fa-solid fa-shield-halved text-sm" />
              </div>
              <div className="flex-1">
                <h4 className="text-[13px] font-bold text-stone-900">Safe &amp; trusted</h4>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1.5 text-[10px] text-stone-600 font-medium">
                  {['Verified student community', 'Chat before buying', 'Report and get support', 'Keep our community safe'].map(x => (
                    <span key={x} className="flex items-center"><i className="fa-solid fa-check text-emerald-600 text-[9px] mr-1" />{x}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Sets coming soon (when sets are not open yet) */}
          {!SETS_OPEN && (
            <section data-pop className="wr-pre bg-[#FFF9EA] border border-amber-200 rounded-2xl p-3 shadow-2xs flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[13px] font-black text-stone-900">School sets and customised kits · Coming soon</h3>
                <p className="text-[10px] text-stone-600 mt-0.5">Curated book sets for DPS Sector 40-C and Shivalik Public School.</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-white border border-amber-200 flex items-center justify-center text-stone-800 shrink-0">
                <i className="fa-solid fa-bag-shopping text-[14px]" />
              </div>
            </section>
          )}

          {/* Local store card */}
          <section data-pop className="wr-pre bg-[#FFF9EA] border border-amber-200 rounded-2xl p-3 shadow-2xs flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-16 h-14 bg-stone-800 rounded-xl relative overflow-hidden flex flex-col justify-end p-1 border border-stone-300 shrink-0">
                {storeOk
                  ? <img src={STORE_PHOTO} alt="Bedi Book Store" className="absolute inset-0 w-full h-full object-cover" onError={() => setStoreOk(false)} />
                  : (<>
                      <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'radial-gradient(#FCD34D 1px, transparent 1px)', backgroundSize: '6px 6px' }} />
                      <span className="relative z-10 text-[9px] font-black text-amber-300 leading-tight">Bedi Book Store</span>
                    </>)}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] text-stone-500 uppercase tracking-wider font-bold">Visit our store</span>
                <h3 className="text-[13px] font-black text-stone-900 leading-tight">Bedi Book Store</h3>
                <p className="text-[10px] text-stone-600 flex items-center mt-0.5">
                  <i className="fa-solid fa-location-dot text-[9px] mr-1 text-stone-400" />
                  Booth 48, Sector 40-C, Chandigarh
                </p>
                <p className="text-[9px] text-stone-500 mt-0.5">Complete school sets, books and stationery.</p>
              </div>
            </div>
            <a href={WA_HELP_LINK} target="_blank" rel="noopener noreferrer" className="wr-btn wr-btn2 bg-[#25D366] hover:bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex items-center space-x-1 shrink-0 shadow-xs transition ml-2">
              <i className="fa-brands fa-whatsapp text-[13px]" />
              <span>Chat on WhatsApp</span>
            </a>
          </section>
        </main>
      </div>

      {/* Floating kit-bag bar (only when a kit has been added) */}
      {SETS_OPEN && cart.length > 0 && (
        <div className="fixed inset-x-0 max-w-[430px] mx-auto px-4 z-40 pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)' }}>
          <div className="wr-slideup bg-[#FFF9E5] border border-amber-300/90 shadow-xl rounded-full px-3 py-1.5 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center space-x-2 pl-1">
              <div className="relative w-6 h-6 flex items-center justify-center">
                <i className="fa-solid fa-bag-shopping text-stone-800 text-sm" />
                <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-900 text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">{cart.length}</span>
              </div>
              <span className="text-[13px] font-black text-stone-900">{cart.length} {cart.length > 1 ? 'kits' : 'kit'} • ₹{cartTotal.toLocaleString('en-IN')}</span>
            </div>
            <button type="button" onClick={() => router.push('/school-sets')} className="wr-btn bg-stone-900 hover:bg-black text-white text-[12px] font-bold px-3.5 py-1.5 rounded-full flex items-center space-x-1.5 shadow-sm transition">
              <span>View bag</span>
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}