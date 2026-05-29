'use client'
import { useState, useEffect, useRef } from 'react'
import { useUser, SignInButton, UserButton, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const cats = ['All', 'textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']
const catEmoji: Record<string, string> = {
  All: '✦', textbook: '📗', novel: '📘', notebook: '📓',
  art: '🎨', stationery: '✏️', competitive: '📙'
}
const sortOptions = ['Newest', 'Cheapest', 'Most expensive', 'Active only']

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
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const suggestions = search.length > 1
    ? listings.filter(l => l.title.toLowerCase().includes(search.toLowerCase()) || l.subtitle?.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : []

  const activeListings = listings.filter(l => !l.sold).length
  const hasFilters = activeCat !== 'All' || sortBy !== 'Newest' || search

  function requireAuth(action: () => void) {
    if (isSignedIn) action()
    else openSignIn()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #FAFAF8; --bg-card: #FFFEF9; --bg-img: #F5F2ED; --bg-input: #FAFAF8;
          --nav-bg: #fff; --border: #EDE9E1; --text-primary: #1B2A4A;
          --text-secondary: #888; --text-muted: #bbb;
          --shadow-nav: 0 2px 12px rgba(27,42,74,0.05);
          --shadow-card: 0 2px 8px rgba(27,42,74,0.05);
          --shadow-card-hover: 0 16px 40px rgba(27,42,74,0.12);
          --skeleton-1: #f0ede8; --skeleton-2: #e8e4de;
          --navy: #1B2A4A; --scrollbar: #e0ddd6;
          --hero-bg: linear-gradient(135deg, #1B2A4A 0%, #0F6E56 100%);
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0F1117; --bg-card: #1A1D27; --bg-img: #242736; --bg-input: #1A1D27;
            --nav-bg: #13151F; --border: #2A2D3E; --text-primary: #E8E6F0;
            --text-secondary: #8B8FA8; --text-muted: #555878;
            --shadow-nav: 0 2px 12px rgba(0,0,0,0.3);
            --shadow-card: 0 2px 8px rgba(0,0,0,0.2);
            --shadow-card-hover: 0 16px 40px rgba(0,0,0,0.35);
            --skeleton-1: #1E2130; --skeleton-2: #252840;
            --navy: #E8E6F0; --scrollbar: #2A2D3E;
            --hero-bg: linear-gradient(135deg, #13151F 0%, #0F2D1F 100%);
          }
        }
        body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text-primary); }
        .logo-text { font-family: 'Kalam', cursive; font-weight: 700; }
        .card { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .card:hover { transform: translateY(-5px); box-shadow: var(--shadow-card-hover) !important; }
        .listing-img { transition: transform 0.4s ease; }
        .card:hover .listing-img { transform: scale(1.07); }
        .sell-btn { transition: all 0.15s ease; }
        .sell-btn:hover { transform: scale(1.04); box-shadow: 0 6px 20px rgba(29,158,117,0.35) !important; }
        .cat-chip { transition: all 0.15s ease; cursor: pointer; }
        .cat-chip:hover { transform: translateY(-1px); }
        .sort-opt:hover { background: var(--bg-img) !important; }
        input { color: var(--text-primary) !important; font-weight: 500; }
        input::placeholder { color: var(--text-muted) !important; font-weight: 400; }
        input:focus { outline: none; border-color: #1D9E75 !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.12) !important; }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 99px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.38s ease forwards; opacity: 0; }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .skeleton { background: linear-gradient(90deg, var(--skeleton-1) 25%, var(--skeleton-2) 50%, var(--skeleton-1) 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite; border-radius: 18px; }
        .suggestion-item:hover { background: var(--bg-img) !important; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        .float { animation: float 3s ease-in-out infinite; }
        @keyframes featuredPulse { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.4)} 50%{box-shadow:0 0 0 4px rgba(245,158,11,0)} }
        .featured-card { animation: featuredPulse 2.5s ease-in-out infinite; }
        @media (max-width: 480px) {
          .listings-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .nav-search { max-width: 100% !important; }
          .nav-logo-text { display: none; }
          .sell-btn-text { display: none; }
          .sell-btn-icon { display: inline !important; }
          .card:hover { transform: none !important; }
          .listing-card-img { height: 120px !important; }
          .listing-card-body { padding: 8px 10px !important; }
          .listing-card-title { font-size: 12px !important; }
          .listing-card-price { font-size: 15px !important; }
          .listing-card-location { display: none !important; }
          .cat-chip { padding: 6px 10px !important; font-size: 11px !important; }
          .main-padding { padding: 12px !important; }
          .hero-section { padding: 20px 16px 24px !important; }
          .hero-title { font-size: 22px !important; }
          .hero-subtitle { display: none !important; }
          .filters-bar { padding: 10px 12px !important; }
        }
        @media (min-width: 481px) and (max-width: 768px) {
          .listings-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .nav-logo-text { font-size: 18px !important; }
        }
        .bottom-nav {
          display: none; position: fixed; bottom: 0; left: 0; right: 0;
          background: var(--nav-bg); border-top: 1.5px solid var(--border);
          padding: 8px 0 env(safe-area-inset-bottom, 8px);
          z-index: 100; box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
        }
        @media (max-width: 480px) {
          .bottom-nav { display: flex; }
          .bottom-nav-spacer { height: 64px; }
        }
        .bottom-nav-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          gap: 3px; background: none; border: none; cursor: pointer;
          font-size: 10px; color: var(--text-secondary); font-family: 'DM Sans', sans-serif;
          padding: 4px 0; transition: color 0.15s;
        }
        .bottom-nav-btn.active { color: #1D9E75; }
        .bottom-nav-btn:active { opacity: 0.7; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Nav */}
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', gap: '10px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flexShrink: 0 }} onClick={() => router.push('/')}>
            <img src="/logo.png" alt="BookMart" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="logo-text nav-logo-text" style={{ fontSize: '20px', color: 'var(--text-primary)', lineHeight: 1 }}>BookMart</span>
          </div>

          <div ref={searchRef} className="nav-search" style={{ flex: 1, position: 'relative', maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: '12px', padding: '0 12px', height: '38px', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="var(--text-muted)" strokeWidth="1.5"/><path d="M9.5 9.5L12 12" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <input value={search} onChange={e => { setSearch(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search books, notebooks…"
                style={{ border: 'none', background: 'transparent', fontSize: '13px', outline: 'none', flex: 1, fontFamily: 'DM Sans, sans-serif' }} />
              {search && <button onClick={() => { setSearch(''); setShowSuggestions(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1, padding: 0 }}>×</button>}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '44px', left: 0, right: 0, background: 'var(--nav-bg)', border: '1.5px solid var(--border)', borderRadius: '14px', boxShadow: 'var(--shadow-card-hover)', zIndex: 100, overflow: 'hidden' }}>
                {suggestions.map((l: any) => (
                  <div key={l.id} className="suggestion-item" onClick={() => { window.location.href = '/listing/' + l.id }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-img)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, overflow: 'hidden' }}>
                      {l.images?.[0] ? <img src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : l.emoji}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{l.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>₹{l.price} · {l.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSignedIn ? (
              <>
                <span onClick={() => router.push('/profile')} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E1F5EE', color: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', border: '1.5px solid #B2E8D6', flexShrink: 0 }}>
                  {user?.firstName?.charAt(0).toUpperCase()}
                </span>
                <button className="sell-btn" onClick={() => window.location.href = '/sell'}
                  style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', fontFamily: 'Kalam, cursive', boxShadow: '0 3px 10px rgba(29,158,117,0.25)', flexShrink: 0 }}>
                  <span className="sell-btn-text">+ Sell</span>
                  <span className="sell-btn-icon" style={{ display: 'none' }}>+</span>
                </button>
                <UserButton />
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="sell-btn" style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', fontFamily: 'Kalam, cursive', flexShrink: 0 }}>Sign in</button>
              </SignInButton>
            )}
          </div>
        </nav>

        {/* Hero banner */}
        <div className="hero-section" style={{ background: 'var(--hero-bg)', padding: '28px 24px 32px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '40%', width: '100px', height: '100px', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }} />
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.12)', borderRadius: '99px', padding: '3px 12px', marginBottom: '10px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>{activeListings} active listings</span>
              </div>
              <h1 className="logo-text hero-title" style={{ fontSize: '28px', color: '#fff', marginBottom: '6px', lineHeight: 1.2 }}>Find your next book 📚</h1>
              <p className="hero-subtitle" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>Second-hand books & stationery from students in Chandigarh</p>
            </div>
            {isSignedIn ? (
              <button onClick={() => router.push('/sell')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', boxShadow: '0 4px 16px rgba(29,158,117,0.4)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                + Sell now
              </button>
            ) : (
              <SignInButton mode="modal">
                <button style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.25)', borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', flexShrink: 0, whiteSpace: 'nowrap', backdropFilter: 'blur(8px)' }}>
                  Sign in to sell
                </button>
              </SignInButton>
            )}
          </div>
        </div>

        {/* Filters bar */}
        <div className="filters-bar" style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '10px 16px', display: 'flex', gap: '8px', alignItems: 'center', overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any, position: 'sticky', top: '56px', zIndex: 40 }}>
          <div style={{ display: 'flex', gap: '6px', flex: 1, overflowX: 'auto' }}>
            {cats.map(cat => (
              <button key={cat} className="cat-chip" onClick={() => setActiveCat(cat)} style={{
                padding: '6px 14px', border: `1.5px solid ${activeCat === cat ? '#1D9E75' : 'var(--border)'}`,
                borderRadius: '99px', background: activeCat === cat ? '#E1F5EE' : 'var(--bg-input)',
                color: activeCat === cat ? '#0F6E56' : 'var(--text-secondary)',
                fontWeight: activeCat === cat ? '600' : '400', whiteSpace: 'nowrap',
                textTransform: 'capitalize', fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.15s',
              }}>
                <span>{catEmoji[cat]}</span> {cat}
              </button>
            ))}
          </div>
          <div style={{ width: '1px', height: '24px', background: 'var(--border)', flexShrink: 0 }} />
          <div ref={sortRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setShowSortMenu(!showSortMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1.5px solid var(--border)', borderRadius: '99px', background: sortBy !== 'Newest' ? '#E1F5EE' : 'var(--bg-input)', color: sortBy !== 'Newest' ? '#0F6E56' : 'var(--text-secondary)', fontSize: '12px', fontWeight: '500', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 3h10M3 6h6M5 9h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {sortBy}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: showSortMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {showSortMenu && (
              <div style={{ position: 'absolute', top: '36px', right: 0, background: 'var(--nav-bg)', border: '1.5px solid var(--border)', borderRadius: '14px', boxShadow: '0 8px 32px rgba(27,42,74,0.12)', zIndex: 100, overflow: 'hidden', minWidth: '160px' }}>
                {sortOptions.map(opt => (
                  <div key={opt} className="sort-opt" onClick={() => { setSortBy(opt); setShowSortMenu(false) }}
                    style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '13px', color: sortBy === opt ? '#1D9E75' : 'var(--text-primary)', fontWeight: sortBy === opt ? '600' : '400', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.1s' }}>
                    {sortBy === opt && <span style={{ color: '#1D9E75' }}>✓</span>}
                    {opt}
                  </div>
                ))}
              </div>
            )}
          </div>
          {hasFilters && (
            <button onClick={() => { setActiveCat('All'); setSortBy('Newest'); setSearch('') }}
              style={{ padding: '6px 12px', border: '1.5px solid #FCA5A5', borderRadius: '99px', background: '#FEF2F2', color: '#E24B4A', fontSize: '11px', fontWeight: '600', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Listings */}
        <div className="main-padding" style={{ padding: '20px 16px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              {loading ? 'Loading…' : search ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"` : `${filtered.length} listings`}
            </p>
            {search && filtered.length === 0 && (
              <button onClick={() => setSearch('')} style={{ color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', textDecoration: 'underline' }}>Clear search</button>
            )}
          </div>

          {loading ? (
            <div className="listings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px' }}>
              {[...Array(8)].map((_, i) => (<div key={i} className="skeleton" style={{ height: '240px' }} />))}
            </div>
          ) : error ? (
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '40px 24px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
              <p style={{ color: '#E24B4A', fontSize: '14px', marginBottom: '14px' }}>{error}</p>
              <button onClick={() => window.location.reload()} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '56px 32px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <div className="logo-text" style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>Nothing found</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Try a different search, category or sort</div>
              <button onClick={() => { setSearch(''); setActiveCat('All'); setSortBy('Newest') }}
                style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Reset filters</button>
            </div>
          ) : (
            <div className="listings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px' }}>
              {filtered.map((l: any, idx: number) => {
                const discount = l.origPrice ? Math.round((1 - l.price / l.origPrice) * 100) : 0
                const isFeatured = l.featured && !l.sold
                return (
                  <div key={l.id} className={`card fade-up${isFeatured ? ' featured-card' : ''}`}
                    onClick={() => window.location.href = '/listing/' + l.id}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: '18px',
                      border: isFeatured ? '2px solid #F59E0B' : '1.5px solid var(--border)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: isFeatured ? '0 4px 20px rgba(245,158,11,0.2)' : 'var(--shadow-card)',
                      animationDelay: `${Math.min(idx * 0.04, 0.4)}s`,
                      position: 'relative',
                    }}>

                    {/* Image area */}
                    <div className="listing-card-img" style={{ height: '140px', background: 'var(--bg-img)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px', position: 'relative', overflow: 'hidden' }}>
                      {l.images?.[0]
                        ? <img className="listing-img" src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span className="listing-img float" style={{ display: 'block', animationDelay: `${idx * 0.2}s` }}>{l.emoji}</span>}

                      {/* Condition badge */}
                      <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '9px', background: l.condition === 'New' ? 'rgba(220,252,231,0.95)' : l.condition === 'Fair' ? 'rgba(254,243,199,0.95)' : 'rgba(239,246,255,0.95)', color: l.condition === 'New' ? '#166534' : l.condition === 'Fair' ? '#92400E' : '#1D4ED8', padding: '2px 8px', borderRadius: '99px', fontWeight: '700', backdropFilter: 'blur(4px)' }}>{l.condition}</span>

                      {/* Discount badge */}
                      {discount >= 20 && !l.sold && (
                        <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '9px', background: 'linear-gradient(135deg, #FF6B35, #E24B4A)', color: '#fff', padding: '2px 7px', borderRadius: '99px', fontWeight: '700' }}>-{discount}%</span>
                      )}

                      {/* Featured badge */}
                      {isFeatured && (
                        <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff', fontSize: '9px', fontWeight: '800', padding: '3px 8px', borderRadius: '99px', display: 'flex', alignItems: 'center', gap: '3px', boxShadow: '0 2px 8px rgba(245,158,11,0.5)', zIndex: 2 }}>
                          ⭐ FEATURED
                        </div>
                      )}

                      {/* Sold overlay */}
                      {l.sold && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(27,42,74,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="logo-text" style={{ color: '#fff', fontSize: '17px', letterSpacing: '3px' }}>SOLD</span>
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="listing-card-body" style={{ padding: '11px 13px' }}>
                      <div className="listing-card-title" style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: l.sold ? 'var(--text-muted)' : 'var(--text-primary)' }}>{l.title}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '7px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.subtitle || l.seller?.name}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '5px' }}>
                        <span className="logo-text listing-card-price" style={{ fontSize: '17px', color: l.sold ? 'var(--text-muted)' : '#1D9E75' }}>₹{l.price}</span>
                        {l.origPrice && <span style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{l.origPrice}</span>}
                      </div>
                      <div className="listing-card-location" style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
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
          <button className="bottom-nav-btn" onClick={() => requireAuth(() => { window.location.href = '/sell' })} style={{ color: '#1D9E75' }}>
            <div style={{ width: '40px', height: '40px', background: '#1D9E75', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '-4px', boxShadow: '0 4px 12px rgba(29,158,117,0.4)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
            Sell
          </button>
          <button className="bottom-nav-btn" onClick={() => requireAuth(() => router.push('/wishlist'))}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Saved
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