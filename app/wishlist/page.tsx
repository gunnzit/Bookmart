'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

export default function WishlistPage() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSignedIn || !user) return
    fetch(`/api/wishlist?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setItems(data)
        setLoading(false)
      })
  }, [isSignedIn, user])

  async function removeFromWishlist(listingId: string) {
    await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, listingId }),
    })
    setItems(prev => prev.filter(i => i.listingId !== listingId))
  }

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #FAFAF8; --bg-card: #FFFEF9; --bg-img: #F5F2ED;
      --nav-bg: #fff; --border: #EDE9E1; --text-primary: #1B2A4A;
      --text-secondary: #888; --text-muted: #bbb;
      --shadow-nav: 0 2px 12px rgba(27,42,74,0.05);
      --shadow-card: 0 2px 8px rgba(27,42,74,0.04);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0F1117; --bg-card: #1A1D27; --bg-img: #242736;
        --nav-bg: #13151F; --border: #2A2D3E; --text-primary: #E8E6F0;
        --text-secondary: #8B8FA8; --text-muted: #555878;
        --shadow-nav: 0 2px 12px rgba(0,0,0,0.3);
        --shadow-card: 0 2px 8px rgba(0,0,0,0.2);
      }
    }
    body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text-primary); }
    .kalam { font-family: 'Kalam', cursive; }
    .card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: pointer; }
    .card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(27,42,74,0.10) !important; }
    .remove-btn { transition: all 0.15s; }
    .remove-btn:hover { background: #FEF2F2 !important; color: #E24B4A !important; }
  `

  if (!isSignedIn) return (
    <>
      <style>{styles}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
          <div className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '16px' }}>Sign in to view your wishlist</div>
          <button onClick={() => router.push('/')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: 'Kalam, cursive' }}>Go home</button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <style>{styles}</style>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        <nav style={{ background: 'var(--nav-bg)', borderBottom: '1.5px solid var(--border)', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow-nav)' }}>
          <button onClick={() => router.push('/marketplace')} style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', width: '38px', height: '38px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>←</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="BookMart" style={{ height: '32px', width: 'auto' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <span className="kalam" style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: '700' }}>❤️ Wishlist</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>{items.length} saved</div>
        </nav>

        <div style={{ maxWidth: '900px', margin: '24px auto', padding: '0 16px 40px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ borderRadius: '16px', height: '220px', background: 'var(--bg-card)', border: '1.5px solid var(--border)', opacity: 0.5 }} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '64px 40px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤍</div>
              <div className="kalam" style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>No saved listings yet</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Tap the heart on any listing to save it here</div>
              <button onClick={() => router.push('/marketplace')} style={{ background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: 'Kalam, cursive' }}>Browse listings</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
              {items.map(item => {
                const l = item.listing
                if (!l) return null
                return (
                  <div key={item.id} style={{ position: 'relative' }}>
                    <div className="card" onClick={() => router.push('/listing/' + l.id)}
                      style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1.5px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                      <div style={{ height: '130px', background: 'var(--bg-img)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', position: 'relative', overflow: 'hidden' }}>
                        {l.images?.[0]
                          ? <img src={l.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : l.emoji}
                        <span style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '9px', background: l.condition === 'New' ? 'rgba(220,252,231,0.95)' : 'rgba(239,246,255,0.95)', color: l.condition === 'New' ? '#166534' : '#1D4ED8', padding: '2px 7px', borderRadius: '99px', fontWeight: '600' }}>{l.condition}</span>
                        {l.sold && <div style={{ position: 'absolute', inset: 0, background: 'rgba(27,42,74,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="kalam" style={{ color: '#fff', fontSize: '16px', letterSpacing: '3px' }}>SOLD</span></div>}
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.subtitle}</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                          <span className="kalam" style={{ fontSize: '16px', color: '#1D9E75', fontWeight: '700' }}>₹{l.price}</span>
                          {l.origPrice && <span style={{ fontSize: '10px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{l.origPrice}</span>}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>📍 {l.location}</div>
                      </div>
                    </div>
                    {/* Remove button */}
                    <button className="remove-btn" onClick={e => { e.stopPropagation(); removeFromWishlist(l.id) }}
                      style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: 'all 0.15s' }}>
                      ❤️
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}