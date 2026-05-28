'use client'
import { useState, useEffect } from 'react'
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'

const cats = ['All', 'textbook', 'novel', 'notebook', 'art', 'stationery', 'competitive']

export default function Home() {
  const { isSignedIn, user } = useUser()
  const [listings, setListings] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const filtered = listings.filter((l: any) => {
    const matchCat = activeCat === 'All' || l.category === activeCat
    const matchSearch = l.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div style={{ fontFamily: 'sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>

      <div style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1D9E75' }}>📚 BookMart</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search books, notebooks, stationery…"
          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isSignedIn ? (
            <>
              <span style={{ fontSize: '13px', color: '#555' }}>Hi, {user?.firstName}</span>
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
        {loading ? (
          <p style={{ color: '#888', fontSize: '14px' }}>Loading listings...</p>
        ) : error ? (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <p style={{ color: '#E24B4A', fontSize: '14px', marginBottom: '8px' }}>⚠️ {error}</p>
            <button onClick={() => window.location.reload()} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' }}>
              Try again
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>{filtered.length} listings found</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              {filtered.map((l: any) => (
                <div key={l.id} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ height: '100px', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', position: 'relative' }}>
                    {l.emoji}
                    <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '10px', background: l.condition === 'New' ? '#E1F5EE' : '#E6F1FB', color: l.condition === 'New' ? '#0F6E56' : '#185FA5', padding: '2px 7px', borderRadius: '99px', fontWeight: 'bold' }}>{l.condition}</span>
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