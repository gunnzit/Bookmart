'use client'
import { useState, useEffect, useRef } from 'react'
import { useUser, SignInButton, UserButton, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const cats = ['All', 'textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']

const catEmoji: Record<string, string> = {
  All: '✦', textbook: '📗', novel: '📘', notebook: '📓',
  art: '🎨', stationery: '✏️', competitive: '📙'
}

const catColors: Record<string, { color: string; bg: string; border: string; dark: string }> = {
  All:         { color: '#00B86B', bg: '#DFFFEF', border: '#9DEAC4', dark: '#009957' },
  textbook:    { color: '#2D7FF9', bg: '#E3F0FF', border: '#BFDBFE', dark: '#1D4ED8' },
  novel:       { color: '#7C5CFC', bg: '#EFEAFF', border: '#DDD6FE', dark: '#6D28D9' },
  notebook:    { color: '#E0A800', bg: '#FFF6DD', border: '#FDE68A', dark: '#B8860B' },
  art:         { color: '#FF3D81', bg: '#FFE5EF', border: '#FBCFE8', dark: '#BE185D' },
  stationery:  { color: '#06B6D4', bg: '#ECFEFF', border: '#A5F3FC', dark: '#0891B2' },
  competitive: { color: '#FF6B2C', bg: '#FFEDE2', border: '#FED7AA', dark: '#C2410C' },
}

const conditionColors: Record<string, { bg: string; color: string }> = {
  New:  { bg: 'rgba(223,255,239,0.95)', color: '#009957' },
  Good: { bg: 'rgba(227,240,255,0.95)', color: '#1D4ED8' },
  Fair: { bg: 'rgba(255,246,221,0.95)', color: '#B8860B' },
}

const sortOptions = ['Newest', 'Cheapest', 'Most expensive', 'Active only']

function getCatColor(category: string) {
  return catColors[category] || catColors['All']
}

export default function Marketplace() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const { openSignIn } = useClerk()
  const [listings, setListings] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [sortBy, setSortBy] = useState('Newest')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isSignedIn && user) {
      fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user.id, name: user.fullName, email: user.primaryEmailAddress?.emailAddress })
      })
    }
  }, [isSignedIn, user])

  useEffect(() => {
    function fetchListings() {
      setLoading(true)
      fetch('/api/listings?t=' + Date.now(), { cache: 'no-store' })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setListings(data); else setError('Could not load listings'); setLoading(false) })
        .catch(() => { setError('Could not connect to database'); setLoading(false) })
    }
    fetchListings()
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') fetchListings() })
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false)
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = listings.filter((l: any) => {
    const matchCat = activeCat === 'All' || l.category === activeCat
    const q = search.toLowerCase()
    const matchSearch = !q || l.title.toLowerCase().includes(q) ||
      (l.subtitle && l.subtitle.toLowerCase().includes(q)) ||
      l.category.toLowerCase().includes(q) || l.location.toLowerCase().includes(q) ||
      l.condition.toLowerCase().includes(q)
    const matchActive = sortBy !== 'Active only' || !l.sold
    return matchCat && matchSearch && matchActive
  }).sort((a, b) => {
    if (sortBy === 'Cheapest') return a.price - b.price
    if (sortBy === 'Most expensive') return b.price - a.price
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const suggestions = search.length > 1
    ? listings.filter(l => l.title.toLowerCase().includes(search.toLowerCase()) || l.subtitle?.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : []

  const activeListings = listings.filter(l => !l.sold).length
  const hasFilters = activeCat !== 'All' || sortBy !== 'Newest' || search
  const activeCatStyle = catColors[activeCat] || catColors['All']

  function requireAuth(action: () => void) {
    if (isSignedIn) action()
    else openSignIn()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #FFF9F0; --bg-card: #fff; --bg-img: #FFF3E0; --bg-input: #FFF9F0;
          --nav-bg: #fff; --border: #FFE2C2; --border-strong: #FFCB94; --text-primary: #1A1330;
          --text-secondary: #6B6280; --text-muted: #A89FC0;
          --shadow-nav: 0 2px 12px rgba(124,92,252,0.06);
          --shadow-card: 0 2px 10px rgba(124,92,252,0.07);
          --shadow-card-hover: 0 16px 40px rgba(124,92,252,0.16);
          --skeleton-1: #FFF3E0; --skeleton-2: #FFE2C2;
          --navy: #1A1330; --scrollbar: #FFCB94;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #14101F; --bg-card: #221C3A; --bg-img: #2A2342; --bg-input: #1C1730;
            --nav-bg: #1C1730; --border: #352C52; --border-strong: #463A6B; --text-primary: #F3EEFF;
            --text-secondary: #B0A8CC; --text-muted: #6E6590;
            --shadow-nav: 0 2px 12px rgba(0,0,0,0.3);
            --shadow-card: 0 2px 10px rgba(0,0,0,0.25);
            --shadow-card-hover: 0 16px 40px rgba(0,0,0,0.4);
            --skeleton-1: #2A2342; --skeleton-2: #352C52;
            --navy: #F3EEFF; --scrollbar: #463A6B;
          }
        }
        body { background: var(--bg); font-family: 'Poppins', sans-serif; color: var(--text-primary); }
        .logo-text { font-weight: 800; background: linear-gradient(135deg,#FF6B2C,#FF3D81); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.03em; }
        .card { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s, border-color 0.2s; }
        .card:hover { transform: translateY(-6px) rotate(-0.5deg); box-shadow: var(--shadow-card-hover) !important; border-color: #7C5CFC !important; }
        .listing-img { transition: transform 0.4s ease; }
        .card:hover .listing-img { transform: scale(1.08); }
        .sell-btn { transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.12s; }
        .sell-btn:hover { transform: translateY(-2px); }
        .sell-btn:active { transform: translateY(1px); }
        .cat-chip { transition: all 0.15s cubic-bezier(0.34,1.56,0.64,1); cursor: pointer; }
        .cat-chip:hover { transform: translateY(-2px); }
        .cat-chip:active { transform: scale(0.95); }
        .sort-opt:hover { background: var(--bg-img) !important; }
        input { color: var(--text-primary) !important; font-weight: 500; font-family: 'Poppins', sans-serif; }
        input::placeholder { color: var(--text-muted) !important; font-weight: 400; }
        input:focus { outline: none; border-color: #00B86B !important; box-shadow: 0 0 0 3px rgba(0,184,107,0.14) !important; }
        ::-webkit-scrollbar { height: 5px; width: 5px; }
        ::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 99px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) forwards; opacity: 0; }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .skeleton { background: linear-gradient(90deg, var(--skeleton-1) 25%, var(--skeleton-2) 50%, var(--skeleton-1) 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite; border-radius: 18px; }
        .suggestion-item:hover { background: var(--bg-img) !important; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        .float { animation: float 3s ease-in-out infinite; }
        @keyframes wiggle { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
        .wiggle { animation: wiggle 2.5s ease-in-out infinite; display: inline-block; }
        .banner-pop { transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s; }
        .banner-pop:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,0.12) !important; }
        .nav-second-row {
          display: none; background: var(--nav-bg); border-bottom: 2px solid var(--border);
          padding: 8px 12px; gap: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch;
          scrollbar-width: none; position: sticky; top: 56px; z-index: 49;
        }
        .nav-second-row::-webkit-scrollbar { display: none; }
        .nav-pill {
          display: inline-flex; align-items: center; gap: 5px; padding: 7px 14px; border-radius: 99px;
          border: 2px solid var(--border); background: var(--bg-input); color: var(--text-secondary);
          font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0;
          font-family: 'Poppins', sans-serif; transition: all 0.15s;
        }
        .nav-pill:active { transform: scale(0.95); }
        .nav-pill.green { background: #DFFFEF; color: #00B86B; border-color: #9DEAC4; }
        .nav-pill.blue { background: linear-gradient(135deg,#FFF6DD,#FFEDE2); color: #FF6B2C; border-color: #FFCB94; }
        @media (max-width: 480px) {
          .listings-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .nav-search { max-width: 100% !important; }
          .nav-logo-text { display: none; }
          .sell-btn-text { display: none; }
          .sell-btn-icon { display: inline !important; }
          .card:hover { transform: none !important; }
          .listing-card-img { height: 130px !important; }
          .listing-card-body { padding: 9px 11px !important; }
          .listing-card-title { font-size: 12px !important; }
          .listing-card-price { font-size: 16px !important; }
          .listing-card-location { display: none !important; }
          .cat-chip { padding: 7px 12px !important; font-size: 11px !important; }
          .main-padding { padding: 12px !important; }
          .hero-section { padding: 22px 16px 26px !important; }
          .hero-title { font-size: 23px !important; }
          .hero-subtitle { display: none !important; }
          .filters-bar { padding: 10px 12px !important; top: 96px !important; }
          .request-banner-text { display: none !important; }
          .nav-orders-btn { display: none !important; }
          .nav-desktop-only { display: none !important; }
          .nav-second-row { display: flex !important; }
        }
        @media (min-width: 481px) and (max-width: 768px) {
          .listings-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .nav-logo-text { font-size: 18px !important; }
        }
        .bottom-nav {
          display: none; position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--nav-bg); border-top: 2px solid var(--border);
          padding: 8px 0 env(safe-area-inset-bottom, 8px); z-index: 100; box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
        }
        @media (max-width: 480px) { .bottom-nav { display: flex; } .bottom-nav-spacer { height: 64px; } }
        .bottom-nav-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
          background: none; border: none; cursor: pointer; font-size: 10px; color: var(--text-secondary);
          font-family: 'Poppins', sans-serif; font-weight: 600; padding: 4px 0; transition: color 0.15s;
        }
        .bottom-nav-btn.active { color: #00B86B; }
        .bottom-nav-btn:active { opacity: 0.7; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '2px solid var(--border)', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', gap: '10px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0 }} onClick={() => router.push('/')}>
            <img src="/logo.png" alt="BuddyBooks" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="logo-text nav-logo-text" style={{ fontSize: '20px', lineHeight: 1 }}>BuddyBooks</span>
          </div>

          <div ref={searchRef} className="nav-search" style={{ flex: 1, position: 'relative', maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '2px solid var(--border)', borderRadius: '12px', padding: '0 12px', height: '40px', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="var(--text-muted)" strokeWidth="1.5"/><path d="M9.5 9.5L12 12" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <input value={search} onChange={e => { setSearch(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search books, notebooks…"
                style={{ border: 'none', background: 'transparent', fontSize: '13px', outline: 'none', flex: 1 }} />
              {search && <button onClick={() => { setSearch(''); setShowSuggestions(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1, padding: 0 }}>×</button>}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '46px', left: 0, right: 0, background: 'var(--nav-bg)', border: '2px solid var(--border)', borderRadius: '14px', boxShadow: 'var(--shadow-card-hover)', zIndex: 100, overflow: 'hidden' }}>
                {suggestions.map((l: any) => {
                  const c = getCatColor(l.category)
                  return (
                    <div key={l.id} className="suggestion-item" onClick={() => { window.location.href = '/listing/' + l.id }}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: c.bg, border: '1px solid ' + c.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, overflow: 'hidden' }}>
                        {l.images?.[0] ? <img src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : l.emoji}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{l.title}</div>
                        <div style={{ fontSize: '11px', color: c.color, fontWeight: '700' }}>₹{l.price} · {l.location}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSignedIn ? (
              <>
                <button onClick={() => router.push('/school-sets')}
                  className="nav-desktop-only"
                  style={{ background: 'linear-gradient(135deg, #FFF6DD, #FFEDE2)', border: '2px solid #FFCB94', borderRadius: '10px', padding: '7px 13px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', color: '#FF6B2C', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  🎒 School Sets
                </button>
                <button className="nav-orders-btn nav-desktop-only" onClick={() => router.push('/my-orders')}
                  style={{ background: 'var(--bg-input)', border: '2px solid var(--border)', borderRadius: '10px', padding: '7px 13px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  📦 My Orders
                </button>
                <button onClick={() => router.push('/requests')}
                  className="nav-desktop-only"
                  style={{ background: 'var(--bg-input)', border: '2px solid var(--border)', borderRadius: '10px', padding: '7px 13px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: 'var(--text-secondary)', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  📋 Requests
                </button>
                <span onClick={() => router.push('/profile')} style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#DFFFEF', color: '#009957', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', border: '2px solid #9DEAC4', flexShrink: 0 }}>
                  {user?.firstName?.charAt(0).toUpperCase()}
                </span>
                <button className="sell-btn" onClick={() => window.location.href = '/sell'}
                  style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '12px', padding: '9px 18px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', fontFamily: 'Poppins, sans-serif', boxShadow: '0 3px 0 #009957', flexShrink: 0 }}>
                  <span className="sell-btn-text">+ Sell</span>
                  <span className="sell-btn-icon" style={{ display: 'none' }}>+</span>
                </button>
                <UserButton />
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="sell-btn" style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '12px', padding: '9px 18px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', fontFamily: 'Poppins, sans-serif', boxShadow: '0 3px 0 #009957', flexShrink: 0 }}>Sign in</button>
              </SignInButton>
            )}
          </div>
        </nav>

        {/* Mobile second nav row */}
        <div className="nav-second-row">
          <button className="nav-pill blue" onClick={() => router.push('/school-sets')}>🎒 School Sets</button>
          <button className="nav-pill" onClick={() => router.push('/my-orders')}>📦 My Orders</button>
          <button className="nav-pill" onClick={() => router.push('/requests')}>📋 Requests</button>
          <button className="nav-pill" onClick={() => router.push('/wishlist')}>❤️ Saved</button>
          <button className="nav-pill green" onClick={() => router.push('/contact')}>📍 Contact</button>
        </div>

        {/* Hero */}
        <div className="hero-section" style={{ background: activeCat === 'All' ? 'linear-gradient(135deg, #1A1330 0%, #00B86B 60%, #2D7FF9 100%)' : 'linear-gradient(135deg, ' + activeCatStyle.dark + ' 0%, ' + activeCatStyle.color + ' 100%)', backgroundSize: '200% 200%', padding: '30px 24px 34px', position: 'relative', overflow: 'hidden', transition: 'background 0.4s ease' }}>
          <div className="float" style={{ position: 'absolute', top: '12%', right: '8%', fontSize: '40px', opacity: 0.25 }}>📚</div>
          <div className="float" style={{ position: 'absolute', bottom: '-30px', left: '38%', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.18)', borderRadius: '99px', padding: '4px 13px', marginBottom: '10px', backdropFilter: 'blur(8px)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: '700' }}>{activeListings} active listings</span>
              </div>
              <h1 className="hero-title" style={{ fontSize: '30px', fontWeight: '800', color: '#fff', marginBottom: '6px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {activeCat === 'All' ? 'Find your next book 📚' : catEmoji[activeCat] + ' ' + activeCat.charAt(0).toUpperCase() + activeCat.slice(1) + 's'}
              </h1>
              <p className="hero-subtitle" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, fontWeight: '500' }}>Second-hand books & stationery from students in Chandigarh</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button onClick={() => router.push('/school-sets')}
                style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '2px solid rgba(255,255,255,0.35)', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap', backdropFilter: 'blur(8px)' }}>
                🎒 School Sets
              </button>
              {isSignedIn ? (
                <button onClick={() => router.push('/sell')} style={{ background: '#fff', color: '#00B86B', border: 'none', borderRadius: '12px', padding: '10px 18px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 0 rgba(0,0,0,0.12)', whiteSpace: 'nowrap' }}>
                  + Sell now
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '12px', padding: '10px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap', backdropFilter: 'blur(8px)' }}>
                    Sign in to sell
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>

        {/* Filters bar */}
        <div className="filters-bar" style={{ background: 'var(--nav-bg)', borderBottom: '2px solid var(--border)', padding: '10px 16px', display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any, position: 'sticky', top: '56px', zIndex: 40 }}>
          <div style={{ display: 'flex', gap: '6px', flex: 1, overflowX: 'auto' }}>
            {cats.map(cat => {
              const c = catColors[cat]
              const isActive = activeCat === cat
              return (
                <button key={cat} className="cat-chip" onClick={() => setActiveCat(cat)} style={{ padding: '7px 15px', border: '2px solid ' + (isActive ? c.color : 'var(--border)'), borderRadius: '99px', background: isActive ? c.bg : 'var(--bg-input)', color: isActive ? c.dark : 'var(--text-secondary)', fontWeight: isActive ? '700' : '500', whiteSpace: 'nowrap', textTransform: 'capitalize', fontFamily: 'Poppins, sans-serif', fontSize: '12px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', boxShadow: isActive ? '0 3px 10px ' + c.color + '40' : 'none' }}>
                  <span>{catEmoji[cat]}</span> {cat}
                </button>
              )
            })}
          </div>
          <div style={{ width: '2px', height: '24px', background: 'var(--border)', flexShrink: 0 }} />
          <div ref={sortRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setShowSortMenu(!showSortMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 13px', border: '2px solid var(--border)', borderRadius: '99px', background: sortBy !== 'Newest' ? '#DFFFEF' : 'var(--bg-input)', color: sortBy !== 'Newest' ? '#009957' : 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'Poppins, sans-serif', whiteSpace: 'nowrap' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 3h10M3 6h6M5 9h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {sortBy}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: showSortMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {showSortMenu && (
              <div style={{ position: 'absolute', top: '40px', right: 0, background: 'var(--nav-bg)', border: '2px solid var(--border)', borderRadius: '14px', boxShadow: 'var(--shadow-card-hover)', zIndex: 100, overflow: 'hidden', minWidth: '160px' }}>
                {sortOptions.map(opt => (
                  <div key={opt} className="sort-opt" onClick={() => { setSortBy(opt); setShowSortMenu(false) }}
                    style={{ padding: '11px 16px', cursor: 'pointer', fontSize: '13px', color: sortBy === opt ? '#00B86B' : 'var(--text-primary)', fontWeight: sortBy === opt ? '700' : '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {sortBy === opt && <span style={{ color: '#00B86B' }}>✓</span>}
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
          {hasFilters && (
            <button onClick={() => { setActiveCat('All'); setSortBy('Newest'); setSearch('') }}
              style={{ padding: '7px 13px', border: '2px solid #FCA5A5', borderRadius: '99px', background: '#FEF2F2', color: '#E24B4A', fontSize: '11px', fontWeight: '700', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Banners */}
        <div style={{ padding: '16px 16px 0', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="banner-pop" onClick={() => router.push('/school-sets')}
            style={{ background: 'linear-gradient(135deg, #FFF6DD, #FFEDE2)', border: '2px solid #FFCB94', borderRadius: '16px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '12px', marginBottom: '10px', boxShadow: '0 2px 12px rgba(255,107,44,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="wiggle" style={{ fontSize: '28px', flexShrink: 0 }}>🎒</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#C2410C' }}>New: School Kits for Shivalik Public School</div>
                <div className="request-banner-text" style={{ fontSize: '12px', color: '#FF6B2C', marginTop: '2px', fontWeight: '500' }}>Complete Class 1–10 book + stationery kits · Delivery available · Order now</div>
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#FF6B2C,#FFC83D)', color: '#fff', borderRadius: '12px', padding: '9px 16px', fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 3px 0 #E0851F' }}>Order kit →</div>
          </div>

          <div className="banner-pop" onClick={() => router.push('/requests')}
            style={{ background: 'linear-gradient(135deg, #DFFFEF, #E3F0FF)', border: '2px solid #9DEAC4', borderRadius: '16px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: '12px', boxShadow: '0 2px 12px rgba(0,184,107,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="wiggle" style={{ fontSize: '28px', flexShrink: 0 }}>🔍</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#009957' }}>Can't find what you're looking for?</div>
                <div className="request-banner-text" style={{ fontSize: '12px', color: '#00B86B', marginTop: '2px', fontWeight: '500' }}>Post a book request — sellers in your area will contact you on WhatsApp</div>
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', borderRadius: '12px', padding: '9px 16px', fontSize: '12px', fontWeight: '800', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 3px 0 #009957' }}>Request a book →</div>
          </div>
        </div>

        {/* Listings */}
        <div className="main-padding" style={{ padding: '20px 16px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {loading ? 'Loading…' : search ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"` : `${filtered.length} listings`}
            </p>
            {search && filtered.length === 0 && (
              <button onClick={() => setSearch('')} style={{ color: '#00B86B', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', textDecoration: 'underline' }}>Clear search</button>
            )}
          </div>

          {loading ? (
            <div className="listings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px' }}>
              {[...Array(8)].map((_, i) => (<div key={i} className="skeleton" style={{ height: '240px' }} />))}
            </div>
          ) : error ? (
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '40px 24px', textAlign: 'center', border: '2px solid var(--border)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
              <p style={{ color: '#E24B4A', fontSize: '14px', marginBottom: '14px', fontWeight: '600' }}>{error}</p>
              <button onClick={() => window.location.reload()} style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '12px', padding: '11px 22px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', boxShadow: '0 3px 0 #009957' }}>Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '56px 32px', textAlign: 'center', border: '2px solid var(--border)' }}>
              <div className="float" style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>Nothing found</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', fontWeight: '500' }}>Try a different search, category or sort</div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => { setSearch(''); setActiveCat('All'); setSortBy('Newest') }} style={{ background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', color: '#fff', border: 'none', borderRadius: '12px', padding: '11px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', boxShadow: '0 3px 0 #009957' }}>Reset filters</button>
                <button onClick={() => router.push('/requests')} style={{ background: 'var(--bg-card)', color: '#00B86B', border: '2px solid #00B86B', borderRadius: '12px', padding: '11px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>Request this book →</button>
              </div>
            </div>
          ) : (
            <div className="listings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px' }}>
              {filtered.map((l: any, idx: number) => {
                const discount = l.origPrice ? Math.round((1 - l.price / l.origPrice) * 100) : 0
                const isFeatured = l.featured && !l.sold
                const c = getCatColor(l.category)
                const cond = conditionColors[l.condition] || conditionColors['Good']
                return (
                  <div key={l.id} className="card fade-up"
                    onClick={() => window.location.href = '/listing/' + l.id}
                    style={{ background: 'var(--bg-card)', borderRadius: '18px', border: isFeatured ? '2px solid #E0A800' : '2px solid var(--border)', overflow: 'hidden', cursor: 'pointer', boxShadow: isFeatured ? '0 4px 20px rgba(224,168,0,0.22)' : 'var(--shadow-card)', animationDelay: `${Math.min(idx * 0.04, 0.4)}s`, position: 'relative' }}>
                    <div style={{ height: '4px', background: c.color, width: '100%' }} />
                    <div className="listing-card-img" style={{ height: '137px', background: l.images?.[0] ? 'var(--bg-img)' : c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px', position: 'relative', overflow: 'hidden' }}>
                      {l.images?.[0]
                        ? <img className="listing-img" src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span className="listing-img float" style={{ display: 'block', animationDelay: `${idx * 0.2}s`, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}>{l.emoji}</span>}
                      <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '9px', background: cond.bg, color: cond.color, padding: '3px 9px', borderRadius: '99px', fontWeight: '800', backdropFilter: 'blur(4px)' }}>{l.condition}</span>
                      {discount >= 20 && !l.sold && (
                        <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '9px', background: 'linear-gradient(135deg, #FF6B2C, #FF3D81)', color: '#fff', padding: '3px 8px', borderRadius: '99px', fontWeight: '800' }}>-{discount}%</span>
                      )}
                      {isFeatured && (
                        <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'linear-gradient(135deg, #FFC83D, #FF6B2C)', color: '#fff', fontSize: '9px', fontWeight: '900', padding: '3px 9px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '3px', boxShadow: '0 2px 8px rgba(255,107,44,0.5)', zIndex: 2 }}>⭐ FEATURED</div>
                      )}
                      {l.sold && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,19,48,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: '17px', letterSpacing: '3px', fontWeight: '900' }}>SOLD</span>
                        </div>
                      )}
                    </div>
                    <div className="listing-card-body" style={{ padding: '11px 13px' }}>
                      <div className="listing-card-title" style={{ fontSize: '13px', fontWeight: '700', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: l.sold ? 'var(--text-muted)' : 'var(--text-primary)' }}>{l.title}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '7px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>{l.subtitle || l.seller?.name}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '5px' }}>
                        <span className="listing-card-price" style={{ fontSize: '18px', fontWeight: '800', color: l.sold ? 'var(--text-muted)' : c.color }}>₹{l.price}</span>
                        {l.origPrice && <span style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{l.origPrice}</span>}
                      </div>
                      <div className="listing-card-location" style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '500' }}>
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M6 1C4.34 1 3 2.34 3 4c0 2.5 3 7 3 7s3-4.5 3-7c0-1.66-1.34-3-3-3z" fill="var(--text-muted)"/><circle cx="6" cy="4" r="1" fill="var(--bg-card)"/></svg>
                        {l.location}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bottom-nav-spacer" />

        {/* Mobile bottom nav */}
        <nav className="bottom-nav">
          <button className="bottom-nav-btn active" onClick={() => router.push('/marketplace')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Browse
          </button>
          <button className="bottom-nav-btn" onClick={() => router.push('/school-sets')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            Kits
          </button>
          <button className="bottom-nav-btn" onClick={() => requireAuth(() => { window.location.href = '/sell' })} style={{ color: '#00B86B' }}>
            <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg,#00B86B,#2D7FF9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '-4px', boxShadow: '0 4px 12px rgba(0,184,107,0.4)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            Sell
          </button>
          <button className="bottom-nav-btn" onClick={() => requireAuth(() => router.push('/my-orders'))}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/></svg>
            Orders
          </button>
          <button className="bottom-nav-btn" onClick={() => requireAuth(() => router.push('/profile'))}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Profile
          </button>
        </nav>

      </div>
    </>
  )
}