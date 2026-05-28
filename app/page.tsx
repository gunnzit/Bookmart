'use client'
import { useState, useEffect, useRef } from 'react'
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const cats = ['All', 'textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']
const catEmoji: Record<string, string> = {
  All: '✦', textbook: '📗', novel: '📘', notebook: '📓',
  art: '🎨', stationery: '✏️', competitive: '📙'
}

export default function Home() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const [listings, setListings] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mounted, setMounted] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    if (isSignedIn && user) {
      fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          name: user.fullName,
          email: user.primaryEmailAddress?.emailAddress,
        })
      })
    }
  }, [isSignedIn, user])

  useEffect(() => {
    function fetchListings() {
      setLoading(true)
      fetch('/api/listings?t=' + Date.now(), { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setListings(data)
          else setError('Could not load listings')
          setLoading(false)
        })
        .catch(() => { setError('Could not connect to database'); setLoading(false) })
    }
    fetchListings()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') fetchListings()
    })
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
    ? listings.filter(l => l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.subtitle?.toLowerCase().includes(search.toLowerCase())).slice(0, 5)
    : []

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F7F6F2; font-family: 'DM Sans', sans-serif; }
        .nav-logo { font-family: 'Syne', sans-serif; font-weight: 800; }
        .card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.10) !important; }
        .cat-btn { transition: all 0.15s ease; }
        .sell-btn { transition: all 0.15s ease; }
        .sell-btn:hover { transform: scale(1.03); }
        .listing-img { transition: transform 0.3s ease; }
        .card:hover .listing-img { transform: scale(1.04); }
        input:focus { outline: none; border-color: #1D9E75 !important; }
        ::-webkit-scrollbar { height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 99px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F6F2' }}>

        {/* Nav */}
        <nav style={{ background: '#fff', borderBottom: '1px solid #EBEBEB', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 0 #EBEBEB' }}>
          <div className="nav-logo" style={{ fontSize: '20px', color: '#1D9E75', letterSpacing: '-0.5px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '22px' }}>📚</span> BookMart
          </div>

          <div ref={searchRef} style={{ flex: 1, position: 'relative', maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#F7F6F2', border: '1.5px solid #E8E8E8', borderRadius: '12px', padding: '0 14px', height: '38px', gap: '8px', transition: 'border-color 0.15s' }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="#aaa" strokeWidth="1.5"/><path d="M10.5 10.5L13 13" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <input value={search} onChange={e => { setSearch(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search books, notebooks, stationery…"
                style={{ border: 'none', background: 'transparent', fontSize: '13.5px', outline: 'none', flex: 1, color: '#333', fontFamily: 'DM Sans, sans-serif' }} />
              {search && <button onClick={() => { setSearch(''); setShowSuggestions(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#bbb', padding: 0, lineHeight: 1, display: 'flex' }}>×</button>}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '44px', left: 0, right: 0, background: '#fff', border: '1px solid #EBEBEB', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.10)', zIndex: 100, overflow: 'hidden' }}>
                {suggestions.map((l: any) => (
                  <div key={l.id} onClick={() => { window.location.href = '/listing/' + l.id }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #F5F5F5' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F7F6F2')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F7F6F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, overflow: 'hidden' }}>
                      {l.images?.[0] ? <img src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : l.emoji}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#222', fontFamily: 'Syne, sans-serif' }}>{l.title}</div>
                      <div style={{ fontSize: '11px', color: '#999' }}>₹{l.price} · {l.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isSignedIn ? (
              <>
                <span onClick={() => router.push('/profile')} style={{ fontSize: '13px', color: '#555', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#E1F5EE', color: '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', fontFamily: 'Syne, sans-serif' }}>{user?.firstName?.charAt(0).toUpperCase()}</span>
                  <span style={{ display: 'none' }}>{user?.firstName}</span>
                </span>
                <button className="sell-btn" onClick={() => window.location.href = '/sell'} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 18px', fontWeight: '600', cursor: 'pointer', fontSize: '13.5px', fontFamily: 'Syne, sans-serif', letterSpacing: '0.2px' }}>+ Sell</button>
                <UserButton />
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="sell-btn" style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 18px', fontWeight: '600', cursor: 'pointer', fontSize: '13.5px', fontFamily: 'Syne, sans-serif' }}>Sign in</button>
              </SignInButton>
            )}
          </div>
        </nav>

        {/* Category tabs */}
        <div style={{ background: '#fff', borderBottom: '1px solid #EBEBEB', padding: '0 24px', display: 'flex', gap: '2px', overflowX: 'auto' }}>
          {cats.map(cat => (
            <button key={cat} className="cat-btn" onClick={() => setActiveCat(cat)} style={{
              padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px',
              borderBottom: activeCat === cat ? '2.5px solid #1D9E75' : '2.5px solid transparent',
              color: activeCat === cat ? '#1D9E75' : '#888',
              fontWeight: activeCat === cat ? '600' : '400',
              whiteSpace: 'nowrap', textTransform: 'capitalize',
              fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <span style={{ fontSize: '14px' }}>{catEmoji[cat]}</span> {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          {search && (
            <div style={{ marginBottom: '16px', fontSize: '13px', color: '#888', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {filtered.length > 0
                ? <span><strong style={{ color: '#333' }}>{filtered.length}</strong> result{filtered.length !== 1 ? 's' : ''} for "<strong style={{ color: '#1D9E75' }}>{search}</strong>"</span>
                : <span>No results for "<strong>{search}</strong>"</span>}
              {filtered.length === 0 && (
                <button onClick={() => setSearch('')} style={{ color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600', textDecoration: 'underline' }}>Clear</button>
              )}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: '16px', height: '240px', animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6 }} />
              ))}
            </div>
          ) : error ? (
            <div style={{ background: '#fff', borderRadius: '20px', padding: '48px', textAlign: 'center', border: '1px solid #EBEBEB' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
              <p style={{ color: '#E24B4A', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
              <button onClick={() => window.location.reload()} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '20px', padding: '64px 40px', textAlign: 'center', border: '1px solid #EBEBEB' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#222', marginBottom: '8px', fontFamily: 'Syne, sans-serif' }}>Nothing here yet</div>
              <div style={{ fontSize: '13px', color: '#999', marginBottom: '20px' }}>Try a different search or category</div>
              <button onClick={() => { setSearch(''); setActiveCat('All') }} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Show all listings</button>
            </div>
          ) : (
            <>
              {!search && <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px', fontWeight: '500', letterSpacing: '0.3px', textTransform: 'uppercase' }}>{filtered.length} listings</p>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                {filtered.map((l: any, idx: number) => (
                  <div key={l.id} className="card fade-up" onClick={() => window.location.href = '/listing/' + l.id}
                    style={{ background: '#fff', borderRadius: '18px', border: '1px solid #EBEBEB', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', animationDelay: `${idx * 0.04}s` }}>
                    <div style={{ height: '140px', background: '#F7F6F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '44px', position: 'relative', overflow: 'hidden' }}>
                      {l.images?.[0]
                        ? <img className="listing-img" src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span className="listing-img" style={{ display: 'block' }}>{l.emoji}</span>}
                      <span style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '10px', background: l.condition === 'New' ? '#DCFCE7' : '#EFF6FF', color: l.condition === 'New' ? '#166534' : '#1D4ED8', padding: '3px 8px', borderRadius: '99px', fontWeight: '600', backdropFilter: 'blur(4px)' }}>{l.condition}</span>
                      {l.sold && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: '15px', fontWeight: '800', letterSpacing: '3px', fontFamily: 'Syne, sans-serif' }}>SOLD</span></div>}
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '600', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#222', fontFamily: 'Syne, sans-serif' }}>{l.title}</div>
                      <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.subtitle}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#1D9E75', fontFamily: 'Syne, sans-serif' }}>₹{l.price}</span>
                        {l.origPrice && <span style={{ fontSize: '11px', color: '#ccc', textDecoration: 'line-through' }}>₹{l.origPrice}</span>}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#bbb', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>📍</span> {l.location}
                      </div>
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