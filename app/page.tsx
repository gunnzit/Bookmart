'use client'
import { useState, useEffect, useRef } from 'react'
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

const cats = ['All', 'textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']

export default function Home() {
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
        body: JSON.stringify({
          clerkId: user.id,
          name: user.fullName,
          email: user.primaryEmailAddress?.emailAddress,
        })
      })
    }
  }, [isSignedIn, user])

  useEffect(() => {
    fetch('/api/listings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setListings(data)
        } else {
          setError('Could not load listings')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Could not connect to database')
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = listings.filter((l: any) => {
    const matchCat = activeCat === 'All' || l.category === activeCat
    const q = search.toLowerCase()
    const matchSearch = !q ||
      l.title.toLowerCase().includes(q) ||
      (l.subtitle && l.subtitle.toLowerCase().includes(q)) ||
      l.category.toLowerCase().includes(q) ||
      l.location.toLowerCase().includes(q) ||
      l.condition.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  const suggestions = search.length > 1
    ? listings
        .filter(l =>
          l.title.toLowerCase().includes(search.toLowerCase()) ||
          l.subtitle?.toLowerCase().includes(search.toLowerCase())
        )
        .slice(0, 5)
    : []

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>

      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1D9E75' }}>📚 BookMart</span>

        <div ref={searchRef} style={{ flex: 1, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '8px', padding: '0 12px', height: '36px', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#aaa' }}>🔍</span>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search books, notebooks, stationery…"
              style={{ border: 'none', background: 'transparent', fontSize: '13px', outline: 'none', flex: 1 }}
            />
            {search && (
              <button onClick={() => { setSearch(''); setShowSuggestions(false) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#aaa', padding: '0', lineHeight: 1 }}>×</button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '40px', left: 0, right: 0, background: '#fff', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden' }}>
              {suggestions.map((l: any) => (
                <div
                  key={l.id}
                  onClick={() => { window.location.href = '/listing/' + l.id }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  <span style={{ fontSize: '20px' }}>{l.emoji}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>{l.title}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>₹{l.price} · {l.location}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isSignedIn ? (
            <>
              <span onClick={() => router.push('/profile')} style={{ fontSize: '13px', color: '#1D9E75', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>Hi, {user?.firstName}</span>
              <button onClick={() => window.location.href = '/sell'} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>+ Sell</button>
              <UserButton />
            </>
          ) : (
            <SignInButton mode="modal">
              <button style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>Sign in</button>
            </SignInButton>
          )}
        </div>
      </div>

      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '0 20px', display: 'flex', gap: '4px', overflowX: 'auto' }}>
        {cats.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)} style={{
            padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px',
            borderBottom: activeCat === cat ? '2px solid #1D9E75' : '2px solid transparent',
            color: activeCat === cat ? '#1D9E75' : '#888',
            fontWeight: activeCat === cat ? 'bold' : 'normal',
            whiteSpace: 'nowrap', textTransform: 'capitalize'
          }}>{cat}</button>
        ))}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {search && (
          <div style={{ marginBottom: '10px', fontSize: '13px', color: '#888' }}>
            {filtered.length > 0
              ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"`
              : `No results for "${search}"`}
            {filtered.length === 0 && (
              <button onClick={() => setSearch('')} style={{ marginLeft: '8px', color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Clear search</button>
            )}
          </div>
        )}

        {loading ? (
          <p style={{ color: '#888', fontSize: '14px' }}>Loading listings...</p>
        ) : error ? (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <p style={{ color: '#E24B4A', fontSize: '14px', marginBottom: '8px' }}>⚠️ {error}</p>
            <button onClick={() => window.location.reload()} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' }}>Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
            <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>No listings found</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>Try a different search or category</div>
            <button onClick={() => { setSearch(''); setActiveCat('All') }} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Show all listings</button>
          </div>
        ) : (
          <>
            {!search && <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>{filtered.length} listings found</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {filtered.map((l: any) => (
                <div key={l.id} onClick={() => window.location.href = '/listing/' + l.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#1D9E75')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#eee')}
                >
                  <div style={{ height: '100px', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', position: 'relative' }}>
                    {l.emoji}
                    <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '10px', background: l.condition === 'New' ? '#E1F5EE' : '#E6F1FB', color: l.condition === 'New' ? '#0F6E56' : '#185FA5', padding: '2px 7px', borderRadius: '99px', fontWeight: 'bold' }}>{l.condition}</span>
                    {l.sold && <span style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px' }}>SOLD</span>}
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>{l.subtitle}</div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1D9E75' }}>₹{l.price} <span style={{ fontSize: '11px', color: '#aaa', textDecoration: 'line-through', fontWeight: 'normal' }}>₹{l.origPrice}</span></div>
                    <div style={{ fontSize: '10px', color: '#aaa', marginTop: '6px' }}>📍 {l.location} · {l.seller?.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  )
}