'use client'
import { useState, useEffect, useRef } from 'react'
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const cats = ['All', 'textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']
const catEmoji: Record<string, string> = {
  All: '✦', textbook: '📗', novel: '📘', notebook: '📓',
  art: '🎨', stationery: '✏️', competitive: '📙'
}

export default function Marketplace() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const [listings, setListings] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

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
    return matchCat && matchSearch
  })

  const suggestions = search.length > 1
    ? listings.filter(l => l.title.toLowerCase().includes(search.toLowerCase()) || l.subtitle?.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : []

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #FAFAF8;
          --bg-card: #FFFEF9;
          --bg-img: #F5F2ED;
          --bg-input: #FAFAF8;
          --nav-bg: #fff;
          --border: #EDE9E1;
          --border-hover: #1D9E75;
          --text-primary: #1B2A4A;
          --text-secondary: #888;
          --text-muted: #bbb;
          --shadow-nav: 0 2px 12px rgba(27,42,74,0.05);
          --shadow-card: 0 2px 8px rgba(27,42,74,0.05);
          --shadow-card-hover: 0 16px 40px rgba(27,42,74,0.10);
          --skeleton-1: #f0ede8;
          --skeleton-2: #e8e4de;
          --green: #1D9E75;
          --navy: #1B2A4A;
          --scrollbar: #e0ddd6;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0F1117;
            --bg-card: #1A1D27;
            --bg-img: #242736;
            --bg-input: #1A1D27;
            --nav-bg: #13151F;
            --border: #2A2D3E;
            --border-hover: #1D9E75;
            --text-primary: #E8E6F0;
            --text-secondary: #8B8FA8;
            --text-muted: #555878;
            --shadow-nav: 0 2px 12px rgba(0,0,0,0.3);
            --shadow-card: 0 2px 8px rgba(0,0,0,0.2);
            --shadow-card-hover: 0 16px 40px rgba(0,0,0,0.35);
            --skeleton-1: #1E2130;
            --skeleton-2: #252840;
            --scrollbar: #2A2D3E;
          }
        }

        body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text-primary); }
        .logo-text { font-family: 'Kalam', cursive; font-weight: 700; }
        .card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card:hover { transform: translateY(-4px); box-shadow: var(--shadow-card-hover) !important; }
        .listing-img { transition: transform 0.35s ease; }
        .card:hover .listing-img { transform: scale(1.05); }
        .sell-btn { transition: all 0.15s ease; }
        .sell-btn:hover { transform: scale(1.03); }
        .cat-pill { transition: all 0.15s ease; }
        input { color: var(--text-primary) !important; font-weight: 500; }
        input::placeholder { color: var(--text-muted) !important; font-weight: 400; }
        input:focus { outline: none; border-color: #1D9E75 !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.12) !important; }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 99px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease forwards; opacity: 0; }
        @keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } }
        .skeleton { background: linear-gradient(90deg, var(--skeleton-1) 25%, var(--skeleton-2) 50%, var(--skeleton-1) 75%); background-size: 800px 100%; animation: shimmer 1.4s infinite; }
        .suggestion-item:hover { background: var(--bg-img) !important; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* Nav */}
        <nav style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }} onClick={() => router.push('/')}>
            <img src="/logo.png" alt="BookMart" style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="logo-text" style={{ fontSize: '22px', color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1 }}>BookMart</span>
          </div>

          <div ref={searchRef} style={{ flex: 1, position: 'relative', maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1.5px solid var(--border)', borderRadius: '14px', padding: '0 14px', height: '40px', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4.5" stroke="var(--text-muted)" strokeWidth="1.5"/><path d="M9.5 9.5L12 12" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <input value={search} onChange={e => { setSearch(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search books, stationery, notebooks…"
                style={{ border: 'none', background: 'transparent', fontSize: '13.5px', outline: 'none', flex: 1, fontFamily: 'DM Sans, sans-serif' }} />
              {search && <button onClick={() => { setSearch(''); setShowSuggestions(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1, padding: 0 }}>×</button>}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '46px', left: 0, right: 0, background: 'var(--nav-bg)', border: '1.5px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow-card-hover)', zIndex: 100, overflow: 'hidden' }}>
                {suggestions.map((l: any) => (
                  <div key={l.id} className="suggestion-item" onClick={() => { window.location.href = '/listing/' + l.id }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--bg-img)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, overflow: 'hidden' }}>
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

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isSignedIn ? (
              <>
                <span onClick={() => router.push('/profile')} style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#E1F5EE', color: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Kalam, cursive', border: '1.5px solid #B2E8D6' }}>
                  {user?.firstName?.charAt(0).toUpperCase()}
                </span>
                <button className="sell-btn" onClick={() => window.location.href = '/sell'} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '12px', padding: '9px 20px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', fontFamily: 'Kalam, cursive', boxShadow: '0 3px 12px rgba(29,158,117,0.25)' }}>
                  + Sell
                </button>
                <UserButton />
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="sell-btn" style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '12px', padding: '9px 20px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', fontFamily: 'Kalam, cursive' }}>
                  Sign in
                </button>
              </SignInButton>
            )}
          </div>
        </nav>

        {/* Category pills */}
        <div style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '0 24px', display: 'flex', gap: '4px', overflowX: 'auto' }}>
          {cats.map(cat => (
            <button key={cat} className="cat-pill" onClick={() => setActiveCat(cat)} style={{
              padding: '12px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px',
              borderBottom: activeCat === cat ? '2.5px solid #1D9E75' : '2.5px solid transparent',
              color: activeCat === cat ? '#1D9E75' : 'var(--text-secondary)',
              fontWeight: activeCat === cat ? '600' : '400',
              whiteSpace: 'nowrap', textTransform: 'capitalize',
              fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <span>{catEmoji[cat]}</span> {cat}
            </button>
          ))}
        </div>

        {/* Listings */}
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          {search && (
            <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {filtered.length > 0
                ? <span><strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> result{filtered.length !== 1 ? 's' : ''} for "<em style={{ color: '#1D9E75' }}>{search}</em>"</span>
                : <span>No results for "<strong>{search}</strong>"</span>}
              {filtered.length === 0 && <button onClick={() => setSearch('')} style={{ color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', textDecoration: 'underline' }}>Clear</button>}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {[...Array(8)].map((_, i) => (<div key={i} className="skeleton" style={{ borderRadius: '18px', height: '250px' }} />))}
            </div>
          ) : error ? (
            <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '48px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
              <p style={{ color: '#E24B4A', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
              <button onClick={() => window.location.reload()} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '64px 40px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <div className="logo-text" style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>Nothing here yet</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Try a different search or category</div>
              <button onClick={() => { setSearch(''); setActiveCat('All') }} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Show all listings</button>
            </div>
          ) : (
            <>
              {!search && <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: '500', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{filtered.length} listings</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                {filtered.map((l: any, idx: number) => (
                  <div key={l.id} className="card fade-up" onClick={() => window.location.href = '/listing/' + l.id}
                    style={{ background: 'var(--bg-card)', borderRadius: '18px', border: '1.5px solid var(--border)', overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-card)', animationDelay: `${Math.min(idx * 0.04, 0.4)}s` }}>
                    <div style={{ height: '145px', background: 'var(--bg-img)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px', position: 'relative', overflow: 'hidden' }}>
                      {l.images?.[0]
                        ? <img className="listing-img" src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span className="listing-img" style={{ display: 'block' }}>{l.emoji}</span>}
                      <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '10px', background: l.condition === 'New' ? 'rgba(220,252,231,0.95)' : 'rgba(239,246,255,0.95)', color: l.condition === 'New' ? '#166534' : '#1D4ED8', padding: '3px 8px', borderRadius: '99px', fontWeight: '600', backdropFilter: 'blur(4px)' }}>{l.condition}</span>
                      {l.sold && <div style={{ position: 'absolute', inset: 0, background: 'rgba(27,42,74,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="logo-text" style={{ color: '#fff', fontSize: '18px', letterSpacing: '3px' }}>SOLD</span></div>}
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '600', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{l.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.subtitle}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span className="logo-text" style={{ fontSize: '18px', color: '#1D9E75' }}>₹{l.price}</span>
                        {l.origPrice && <span style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{l.origPrice}</span>}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '5px' }}>📍 {l.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}