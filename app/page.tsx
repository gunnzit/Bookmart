'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useClerk, SignInButton } from '@clerk/nextjs'
import { schools, isRegister } from '@/lib/kit-prices'
import LocationSheet, { useDeliveryPlace } from '@/components/LocationSheet'

// ── Contact (change here only) ────────────────────────────────────────────
const WHATSAPP_NUMBER = '918872235738'
const WA_HELP_LINK = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent('Hi, I need help with a school book set on Pageplus')

// ── Photos (put your own files in public/photos) ──────────────────────────
const HERO_PHOTO = '/photos/hero.jpg'
const STORE_PHOTO = '/photos/store.jpg'

const SHADOW = 'shadow-[0_6px_20px_rgba(120,70,40,0.08)]'

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
  const [chatBusy, setChatBusy] = useState(false)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [cart, setCart] = useState<{ selectedClass: number; items: string[]; kitSubtotal: number }[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [place, setPlace] = useDeliveryPlace()
  const [heroOk, setHeroOk] = useState(true)
  const [storeOk, setStoreOk] = useState(true)

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
    setChatBusy(true)
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
    setChatBusy(false)
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
              <button aria-label="Kit bag" onClick={() => router.push('/school-sets')} className={iconBtn}>
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                {cart.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E8632B] ring-2 ring-white" />}
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

        {/* 5. Books from students near you */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold">Books from students near you</h2>
            <button onClick={() => router.push('/marketplace')} className="text-[13px] font-semibold text-[#9A908A] active:opacity-70">See all</button>
          </div>

          {listings.length === 0 ? (
            <div className={'bg-white rounded-[22px] p-5 text-center ' + SHADOW}>
              <p className="text-[14px] text-[#5E5650] mb-3">No books listed yet. Be the first to sell yours.</p>
              <button onClick={goSell} className="px-5 py-2.5 bg-[#E8632B] text-white text-[14px] font-semibold rounded-full active:scale-95 transition-transform">Sell a book</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {listings.slice(0, 4).map(l => {
                const isSaved = saved.has(l.id)
                return (
                  <div key={l.id} onClick={() => router.push('/listing/' + l.id)} className={'bg-white rounded-[22px] p-3 flex flex-col justify-between cursor-pointer ' + SHADOW}>
                    <div>
                      <div className="relative w-full aspect-[4/3] rounded-[18px] overflow-hidden mb-2.5 bg-[#FFF1EA] flex items-center justify-center text-[34px]">
                        {l.images?.[0] ? <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" /> : <span>{l.emoji || '📚'}</span>}
                        <button aria-label={isSaved ? 'Remove from saved' : 'Save book'} onClick={e => toggleHeart(l, e)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform shadow-[0_2px_10px_rgba(120,70,40,0.12)]">
                          <span className="material-symbols-outlined text-[16px]" style={{ color: isSaved ? '#E8632B' : '#9A908A', fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                        </button>
                      </div>
                      <h3 className="text-[13px] font-bold leading-tight line-clamp-2">{l.title}</h3>
                      <p className="text-[12px] text-[#9A908A] mt-1 truncate">{[l.category, l.condition].filter(Boolean).join(' • ')}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[15px] font-extrabold">₹{l.price}</span>
                      <button aria-label="Chat to buy" onClick={e => openChat(l, e)} className="w-8 h-8 rounded-full bg-[#E8632B] text-white flex items-center justify-center active:scale-90 transition-transform shadow-[0_3px_10px_rgba(232,99,43,0.35)]">
                        <span className="material-symbols-outlined text-[17px]">chat_bubble</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <button onClick={goSell} className="self-start text-[13px] font-semibold text-[#C4501A] active:opacity-70">
            Have old books? Sell yours
          </button>
        </section>

        {/* 6. Store card */}
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
      {cart.length > 0 && (
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