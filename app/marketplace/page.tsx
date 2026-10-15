'use client'
import { useEffect, useRef, useState } from 'react'
import { useUser, SignInButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

// ── Contact (change here only) ────────────────────────────────────────────
const WHATSAPP_NUMBER = '918872235738'
const WA_HELP_LINK = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent('Hi, I need help on Pageplus')

const cats = ['All', 'textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']
const sortOptions = ['Newest', 'Cheapest', 'Most expensive', 'Active only']
const areas = ['All areas', 'Chandigarh', 'Mohali', 'Panchkula']
const conditions = ['New', 'Good', 'Fair']

function areaMatch(location: string, area: string) {
  const loc = (location || '').toLowerCase()
  if (area === 'Chandigarh') return loc.includes('chandigarh') || loc.includes('chd') || loc.includes('sector') || loc.includes('sec ')
  return loc.includes(area.toLowerCase())
}

export default function Marketplace() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()

  const [logoOk, setLogoOk] = useState(true)
  const [listings, setListings] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')
  const [area, setArea] = useState('All areas')
  const [under150, setUnder150] = useState(false)
  const [cond, setCond] = useState<string | null>(null)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showAreaMenu, setShowAreaMenu] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const searchRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)

  // Keep the user record in sync
  useEffect(() => {
    if (isSignedIn && user) {
      fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id, name: user.fullName, email: user.primaryEmailAddress?.emailAddress }),
      })
    }
  }, [isSignedIn, user])

  // Load listings, and refresh when the tab becomes visible again
  useEffect(() => {
    function fetchListings() {
      setLoading(true)
      fetch('/api/listings?t=' + Date.now(), { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) { setListings(data); setError('') }
          else setError('Could not load listings')
          setLoading(false)
        })
        .catch(() => { setError('Could not connect to database'); setLoading(false) })
    }
    fetchListings()
    const onVisible = () => { if (document.visibilityState === 'visible') fetchListings() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false)
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false)
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) setShowAreaMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Only live listings (sold ones still show, with a SOLD tag)
  const visible = listings.filter((l: any) => !l.status || l.status === 'active')

  const filtered = visible.filter((l: any) => {
    const q = search.toLowerCase().trim()
    const matchCat = activeCat === 'All' || l.category === activeCat
    const matchSearch = !q
      || (l.title || '').toLowerCase().includes(q)
      || (l.subtitle || '').toLowerCase().includes(q)
      || (l.category || '').toLowerCase().includes(q)
      || (l.location || '').toLowerCase().includes(q)
      || (l.condition || '').toLowerCase().includes(q)
    const matchActive = sortBy !== 'Active only' || !l.sold
    const matchArea = area === 'All areas' || areaMatch(l.location, area)
    const matchPrice = !under150 || Number(l.price) <= 150
    const matchCond = !cond || l.condition === cond
    return matchCat && matchSearch && matchActive && matchArea && matchPrice && matchCond
  }).sort((a: any, b: any) => {
    if (sortBy === 'Cheapest') return a.price - b.price
    if (sortBy === 'Most expensive') return b.price - a.price
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const suggestions = search.length > 1
    ? visible.filter((l: any) => (l.title || '').toLowerCase().includes(search.toLowerCase()) || (l.subtitle || '').toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : []

  const activeCount = visible.filter((l: any) => !l.sold).length
  const hasFilters = activeCat !== 'All' || sortBy !== 'Newest' || !!search || area !== 'All areas' || under150 || !!cond

  function clearAll() {
    setActiveCat('All'); setSortBy('Newest'); setSearch(''); setArea('All areas'); setUnder150(false); setCond(null)
  }

  function discountOf(l: any) {
    const p = Number(l.price)
    const o = Number(l.origPrice)
    return o > p && p > 0 ? Math.round((1 - p / o) * 100) : 0
  }

  // ── Chat with seller ─────────────────────────────────────────────────────
  // One place to change when Pageplus gets its own messaging: replace the body
  // of this function. For now it opens WhatsApp with the seller.
  function openChat(l: any, e: React.MouseEvent) {
    e.stopPropagation()
    const phone = String(l.seller?.phone || '').replace(/\D/g, '').slice(-10)
    if (phone.length === 10) {
      window.open('https://wa.me/91' + phone + '?text=' + encodeURIComponent('Hi, I am interested in your listing "' + l.title + '" on Pageplus'), '_blank')
    } else {
      router.push('/listing/' + l.id)
    }
  }

  const sellButton = (className: string, children: React.ReactNode) =>
    isSignedIn
      ? <button className={className} onClick={() => router.push('/sell')}>{children}</button>
      : <SignInButton mode="modal"><button className={className}>{children}</button></SignInButton>

  const navLink = 'font-label-lg text-label-lg text-on-surface-variant hover:text-primary-container transition-colors px-3 py-2 rounded-full hover:bg-surface-container-low whitespace-nowrap'
  const chip = 'px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap shadow-sm transition-colors shrink-0 '

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased flex flex-col min-h-screen">

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(45,30,18,0.04)] pt-safe">
        <div className="h-20 px-margin md:px-margin-desktop flex items-center justify-between gap-space-sm md:gap-6 max-w-md mx-auto md:max-w-[1200px]">
          <div className="flex items-center gap-space-sm md:gap-4 min-w-0">
            {logoOk ? (
              <img alt="Pageplus" className="h-10 w-auto object-contain shrink-0 cursor-pointer" src="/pageplus-logo.png" onError={() => setLogoOk(false)} onClick={() => router.push('/')} />
            ) : (
              <span className="font-headline-md text-headline-md text-on-surface shrink-0 cursor-pointer" onClick={() => router.push('/')}>Page<span className="text-secondary-container">plus</span></span>
            )}
            <span className="flex items-center gap-1 bg-surface-container-low px-space-sm py-1 rounded-full min-w-0">
              <span className="material-symbols-outlined text-[16px] text-primary shrink-0">location_on</span>
              <span className="font-label-micro text-label-micro text-on-surface-variant font-bold truncate max-w-[110px] sm:max-w-[200px]">Sector 40-C • Chandigarh</span>
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            <button className={navLink} onClick={() => router.push('/school-sets')}>School Sets</button>
            <button className={navLink + ' !text-primary-container font-bold'} onClick={() => router.push('/marketplace')}>Marketplace</button>
            <button className={navLink} onClick={() => router.push('/projects')}>Projects</button>
            <button className={navLink} onClick={() => router.push('/requests')}>Requests</button>
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            {sellButton('hidden md:flex items-center gap-1.5 bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-4 py-2.5 rounded-full shadow-sm active:scale-95 transition-transform mr-1', (<><span className="material-symbols-outlined text-[18px]">add</span><span>Sell</span></>))}
            <button aria-label="Saved books" onClick={() => router.push('/wishlist')} className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant transition-colors active:bg-surface-container">
              <span className="material-symbols-outlined text-[22px]">favorite</span>
            </button>
            <a aria-label="WhatsApp Support" className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant transition-colors active:bg-surface-container relative" href={WA_HELP_LINK} rel="noopener noreferrer" target="_blank">
              <span className="material-symbols-outlined text-[22px] text-tertiary">chat</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary-container ring-2 ring-surface"></span>
            </a>
            {isSignedIn ? (
              <button aria-label="Profile" onClick={() => router.push('/profile')} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 ml-1 shadow-[0_2px_8px_-2px_rgba(45,30,18,0.06)]">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </button>
            ) : (
              <SignInButton mode="modal">
                <button aria-label="Sign in" className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 ml-1 shadow-[0_2px_8px_-2px_rgba(45,30,18,0.06)]">
                  <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto md:max-w-[1200px] pt-20 pb-40 md:pb-16 px-margin md:px-margin-desktop">
        <div className="flex flex-col w-full space-y-4 pt-4 md:pt-6">

          {/* Search + filter button */}
          <div className="flex items-center gap-2">
            <div ref={searchRef} className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
              <input value={search} onChange={e => { setSearch(e.target.value); setShowSuggestions(true) }} onFocus={() => setShowSuggestions(true)}
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-container/20 transition-all placeholder:text-outline"
                placeholder="Search books, notebooks, class, school..." type="text" />
              {search && (
                <button aria-label="Clear search" onClick={() => { setSearch(''); setShowSuggestions(false) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 top-12 bg-surface-container-lowest rounded-xl shadow-lg overflow-hidden border border-outline-variant">
                  {suggestions.map((l: any) => (
                    <button key={l.id} onClick={() => router.push('/listing/' + l.id)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left active:bg-surface-container border-b border-[#EADFCC]/70 last:border-0">
                      <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center overflow-hidden shrink-0 text-[18px]">
                        {l.images?.[0] ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" /> : <span>{l.emoji || '📚'}</span>}
                      </div>
                      <div className="min-w-0">
                        <div className="font-label-md text-label-md text-on-surface font-semibold truncate">{l.title}</div>
                        <div className="font-body-sm text-[12px] text-primary font-bold">₹{l.price} · {l.location}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div ref={sortRef} className="relative shrink-0">
              <button aria-label="Sort and filter" onClick={() => setShowSortMenu(o => !o)} className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface shadow-sm active:scale-95 transition-transform">
                <span className="material-symbols-outlined text-[20px]">tune</span>
              </button>
              {showSortMenu && (
                <div className="absolute z-30 right-0 top-12 min-w-[180px] bg-surface-container-lowest rounded-xl shadow-lg overflow-hidden border border-outline-variant">
                  {sortOptions.map(opt => (
                    <button key={opt} onClick={() => { setSortBy(opt); setShowSortMenu(false) }} className={'w-full text-left px-4 py-3 font-label-md text-label-md flex items-center gap-2 active:bg-surface-container ' + (sortBy === opt ? 'text-primary font-bold bg-primary-fixed/40' : 'text-on-surface')}>
                      {sortBy === opt && <span className="material-symbols-outlined text-[16px]">check</span>}
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto -mx-margin px-margin md:mx-0 md:px-0 py-0.5 scrollbar-none">
            {cats.map(c => (
              <button key={c} onClick={() => setActiveCat(c)} className={chip + 'capitalize ' + (activeCat === c ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container')}>
                {c === 'All' ? 'All Pre-Loved' : c}
              </button>
            ))}
          </div>

          {/* Sell banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-fixed to-surface-container-high p-4 md:p-6 shadow-sm">
            <div className="relative z-10 flex flex-col gap-2.5 md:max-w-xl">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest text-primary font-label-micro text-label-micro shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  0% COMMISSION
                </span>
                <span className="font-label-micro text-label-micro text-on-surface-variant uppercase tracking-wider">Chandigarh Tricity</span>
              </div>
              <div>
                <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-primary-fixed font-bold leading-tight">Have old books from last session?</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">List in 2 minutes • You keep 100% of the price • Meet nearby, check the book, then pay</p>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                {sellButton('h-11 px-4 rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2', (<><span className="material-symbols-outlined text-[20px]">add_circle</span>Sell Your Books Now</>))}
                <div className="flex items-center gap-1.5 px-1 py-1 text-on-surface-variant font-label-micro text-label-micro">
                  <span className="material-symbols-outlined text-tertiary text-[16px] shrink-0">verified_user</span>
                  <span>Every listing is checked by our team before it goes live</span>
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-6 text-[120px] md:text-[160px] text-primary/10 select-none pointer-events-none">menu_book</span>
          </div>

          {/* Quick filters */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto scrollbar-none -mx-margin px-margin md:mx-0 md:px-0">
            <div ref={areaRef} className="relative shrink-0">
              <button onClick={() => setShowAreaMenu(o => !o)} className={'flex items-center gap-1 px-3 py-1.5 rounded-full font-label-md text-label-md shadow-sm ' + (area !== 'All areas' ? 'bg-primary-fixed text-on-primary-fixed-variant font-semibold' : 'bg-surface-container-lowest text-on-surface')}>
                <span className="material-symbols-outlined text-[16px] text-primary">my_location</span>
                <span>{area}</span>
                <span className="material-symbols-outlined text-[16px] text-outline">arrow_drop_down</span>
              </button>
              {showAreaMenu && (
                <div className="absolute z-30 left-0 top-10 min-w-[160px] bg-surface-container-lowest rounded-xl shadow-lg overflow-hidden border border-outline-variant">
                  {areas.map(a => (
                    <button key={a} onClick={() => { setArea(a); setShowAreaMenu(false) }} className={'w-full text-left px-4 py-3 font-label-md text-label-md flex items-center gap-2 active:bg-surface-container ' + (area === a ? 'text-primary font-bold bg-primary-fixed/40' : 'text-on-surface')}>
                      {area === a && <span className="material-symbols-outlined text-[16px]">check</span>}
                      {a}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setUnder150(v => !v)} className={chip + (under150 ? 'bg-primary-fixed text-on-primary-fixed-variant font-semibold' : 'bg-surface-container-lowest text-on-surface-variant')}>Under ₹150</button>
            {conditions.map(c => (
              <button key={c} onClick={() => setCond(cond === c ? null : c)} className={chip + (cond === c ? 'bg-primary-fixed text-on-primary-fixed-variant font-semibold' : 'bg-surface-container-lowest text-on-surface-variant')}>{c}</button>
            ))}
            {hasFilters && (
              <button onClick={clearAll} className="px-3 py-1.5 rounded-full bg-error-container text-on-error-container font-label-md text-label-md whitespace-nowrap shrink-0 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">close</span>Clear
              </button>
            )}
          </div>

          {/* Catalog heading */}
          <div className="flex items-center justify-between px-1">
            <p className="font-headline-sm md:font-headline-md text-headline-sm md:text-headline-md text-on-surface">
              Pre-Loved Catalog{' '}
              <span className="font-body-sm text-body-sm text-outline font-normal">
                ({loading ? '…' : search || hasFilters ? filtered.length + ' found' : activeCount + ' active'})
              </span>
            </p>
            <button onClick={() => setShowSortMenu(o => !o)} className="font-label-micro text-label-micro text-secondary font-bold uppercase">Sort: {sortBy}</button>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {[...Array(8)].map((_, i) => <div key={i} className="h-72 rounded-2xl bg-surface-container animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
              <span className="material-symbols-outlined text-[36px] text-error mb-2">error</span>
              <p className="font-body-md text-body-md text-error mb-4 font-semibold">{error}</p>
              <button onClick={() => window.location.reload()} className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-5 py-2.5 rounded-xl shadow-md">Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
              <span className="material-symbols-outlined text-[40px] text-primary mb-2">search_off</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">Nothing found</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Try a different search, category or filter.</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <button onClick={clearAll} className="bg-primary-container text-on-primary font-label-lg text-label-lg font-bold px-5 py-2.5 rounded-xl shadow-md">Reset filters</button>
                <button onClick={() => router.push('/requests')} className="bg-surface-container-low text-primary font-label-lg text-label-lg font-bold px-5 py-2.5 rounded-xl">Request this book</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filtered.map((l: any) => {
                const off = discountOf(l)
                const featured = l.featured && !l.sold
                return (
                  <div key={l.id} onClick={() => router.push('/listing/' + l.id)}
                    className={'bg-surface-container-lowest rounded-2xl p-2.5 flex flex-col shadow-sm hover:shadow-md transition cursor-pointer group ' + (featured ? 'ring-2 ring-[#E0A100]/60' : '')}>
                    <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-primary-fixed/50 mb-2 flex items-center justify-center text-[44px]">
                      {l.images?.[0]
                        ? <img className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" src={l.images[0]} alt={l.title} />
                        : <span>{l.emoji || '📚'}</span>}
                      {l.condition && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-primary font-label-micro text-label-micro font-bold shadow-sm">{l.condition}</span>}
                      {off > 0 && !l.sold && <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-primary-container text-on-primary font-label-micro text-label-micro font-bold">-{off}%</span>}
                      {featured && <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-[#E0A100] text-white font-label-micro text-label-micro font-bold flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>Featured</span>}
                      {l.location && <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-inverse-surface/85 text-inverse-on-surface font-label-micro text-[10px] max-w-[60%] truncate">{l.location}</span>}
                      {l.sold && (
                        <div className="absolute inset-0 bg-inverse-surface/60 flex items-center justify-center">
                          <span className="text-white font-label-lg text-label-lg tracking-[0.2em] font-bold">SOLD</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className="font-label-micro text-label-micro text-outline uppercase tracking-wider block truncate">{l.subtitle || l.category}</span>
                        <h3 className={'font-headline-sm text-[16px] leading-snug font-semibold line-clamp-1 ' + (l.sold ? 'text-outline' : 'text-on-surface')}>{l.title}</h3>
                        <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
                          <span className={'font-headline-sm text-[18px] font-bold ' + (l.sold ? 'text-outline' : 'text-primary')}>₹{l.price}</span>
                          {Number(l.origPrice) > Number(l.price) && <span className="font-body-sm text-[12px] text-outline line-through">₹{l.origPrice}</span>}
                          {off > 0 && !l.sold && <span className="font-label-micro text-[11px] text-secondary font-bold">{off}% off</span>}
                        </div>
                        {l.seller?.name && (
                          <div className="flex items-center gap-1 mt-1.5 text-on-surface-variant font-label-micro text-label-micro truncate">
                            <span className="material-symbols-outlined text-[13px] text-tertiary">person</span>
                            <span className="truncate">{String(l.seller.name).split(' ')[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-surface-container">
                        <button disabled={l.sold} onClick={e => openChat(l, e)} className="h-8 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-40">
                          <span className="material-symbols-outlined text-[15px] text-tertiary">chat</span>
                          <span className="font-label-micro text-label-micro">Chat</span>
                        </button>
                        <button disabled={l.sold} onClick={e => { e.stopPropagation(); router.push('/listing/' + l.id) }} className="h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-label-micro text-label-micro shadow-sm active:scale-95 transition-transform disabled:opacity-40">Buy</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Request a book */}
          <div className="rounded-xl bg-surface-container-lowest p-3.5 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">manage_search</span>
              </div>
              <div className="min-w-0">
                <p className="font-label-lg text-label-lg text-on-surface font-semibold">Can&apos;t find your book?</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Post a request and sellers will contact you.</p>
              </div>
            </div>
            <button onClick={() => router.push('/requests')} className="bg-primary-container text-on-primary font-label-md text-label-md font-bold px-3.5 py-2 rounded-full shrink-0 active:scale-95 transition-transform">Request</button>
          </div>

          {/* How it works */}
          <div className="rounded-2xl bg-surface-container-low p-4 md:p-6 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-[16px] text-on-surface font-semibold">How Pageplus Works</h4>
                <p className="font-body-sm text-[12px] text-on-surface-variant">Simple, free and direct</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1 md:max-w-2xl">
              {[
                { icon: 'photo_camera', t: '1. Snap & Post', s: 'Free listing' },
                { icon: 'forum', t: '2. Chat', s: 'Talk to the seller' },
                { icon: 'handshake', t: '3. Meet & Pay', s: 'Check, then pay' },
              ].map(x => (
                <div key={x.t} className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm mb-1.5 text-primary">
                    <span className="material-symbols-outlined text-[20px]">{x.icon}</span>
                  </div>
                  <span className="font-label-md text-[12px] text-on-surface font-semibold">{x.t}</span>
                  <span className="font-body-sm text-[11px] text-outline leading-tight mt-0.5">{x.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom nav (phone only) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(45,30,18,0.06)]">
        <div className="flex justify-around items-center h-16 px-space-xs relative max-w-md mx-auto">
          <button onClick={() => router.push('/')} className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[22px]">storefront</span>
            <span className="font-label-micro text-label-micro uppercase tracking-wider">Home</span>
          </button>
          <button onClick={() => router.push('/school-sets')} className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 text-on-surface-variant transition-colors relative">
            <div className="relative flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">local_library</span>
              <span className="absolute -top-1 -right-2 px-1 bg-primary-fixed text-on-primary-fixed-variant rounded-full text-[9px] font-bold leading-tight uppercase">Kit</span>
            </div>
            <span className="font-label-micro text-label-micro uppercase tracking-wider">Sets</span>
          </button>
          {isSignedIn ? (
            <button onClick={() => router.push('/sell')} className="flex flex-col items-center justify-center -mt-6">
              <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary shadow-[0_4px_14px_rgba(196,80,26,0.35)] flex items-center justify-center transition-transform active:scale-95">
                <span className="material-symbols-outlined text-[28px]">add</span>
              </div>
              <span className="font-label-micro text-label-micro uppercase tracking-wider text-on-surface-variant mt-1 font-semibold">Sell</span>
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="flex flex-col items-center justify-center -mt-6">
                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary shadow-[0_4px_14px_rgba(196,80,26,0.35)] flex items-center justify-center transition-transform active:scale-95">
                  <span className="material-symbols-outlined text-[28px]">add</span>
                </div>
                <span className="font-label-micro text-label-micro uppercase tracking-wider text-on-surface-variant mt-1 font-semibold">Sell</span>
              </button>
            </SignInButton>
          )}
          <button onClick={() => router.push('/marketplace')} className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 text-primary-container font-semibold transition-colors">
            <span className="material-symbols-outlined text-[22px]">sell</span>
            <span className="font-label-micro text-label-micro uppercase tracking-wider">Market</span>
          </button>
          <button onClick={() => router.push('/my-orders')} className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            <span className="font-label-micro text-label-micro uppercase tracking-wider">Orders</span>
          </button>
        </div>
      </nav>
    </div>
  )
}